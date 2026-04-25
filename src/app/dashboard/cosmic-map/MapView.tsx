'use client';

import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapMarkerData,
  ActivityType,
  createMarkerIcon,
  createClusterIcon,
  createPopupContent,
  clusterMarkers,
  ACTIVITY_COLORS,
} from './MapMarker';

/* ─── Fix Leaflet default icon issue ─── */
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

/* ─── Types ─── */

interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

interface MapCenter {
  lat: number;
  lng: number;
}

interface MapViewProps {
  markers: MapMarkerData[];
  visibleTypes: Set<ActivityType>;
  onMapMove: (bounds: MapBounds, center: MapCenter) => void;
  onMarkerClick: (marker: MapMarkerData) => void;
  onClusterClick: (cluster: { centerLat: number; centerLng: number }) => void;
  flyTo: { lat: number; lng: number; zoom: number } | null;
  onFlyToComplete: () => void;
  myLocation: { lat: number; lng: number } | null;
  className?: string;
}

/* ─── Component ─── */

export default function MapView({
  markers,
  visibleTypes,
  onMapMove,
  onMarkerClick,
  onClusterClick,
  flyTo,
  onFlyToComplete,
  myLocation,
  className,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const clusterLayerRef = useRef<L.LayerGroup | null>(null);
  const myLocationMarkerRef = useRef<L.Marker | null>(null);
  const moveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── Initialize Map ─── */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [30, 0],
      zoom: 3,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true,
    });

    // Dark tile layer
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Create layers
    markersLayerRef.current = L.layerGroup().addTo(map);
    clusterLayerRef.current = L.layerGroup().addTo(map);

    // Handle map move events (debounced)
    map.on('moveend', () => {
      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
      moveTimeoutRef.current = setTimeout(() => {
        const b = map.getBounds();
        const c = map.getCenter();
        onMapMove(
          { swLat: b.getSouth(), swLng: b.getWest(), neLat: b.getNorth(), neLng: b.getEast() },
          { lat: c.lat, lng: c.lng }
        );
      }, 300);
    });

    mapRef.current = map;

    // Initial data fetch
    const ib = map.getBounds();
    const ic = map.getCenter();
    onMapMove(
      { swLat: ib.getSouth(), swLng: ib.getWest(), neLat: ib.getNorth(), neLng: ib.getEast() },
      { lat: ic.lat, lng: ic.lng }
    );

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* ─── Update Markers ─── */
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current || !clusterLayerRef.current) return;

    const map = mapRef.current;
    const zoom = map.getZoom();

    // Filter markers by visible types
    const filtered = markers.filter(m => visibleTypes.has(m.type));

    // Clear existing layers
    markersLayerRef.current.clearLayers();
    clusterLayerRef.current.clearLayers();

    // Cluster markers
    const { individual, clusters } = clusterMarkers(filtered, zoom);

    // Add individual markers
    individual.forEach(marker => {
      const icon = createMarkerIcon(marker.type);
      const leafletMarker = L.marker([marker.latitude, marker.longitude], { icon })
        .bindPopup(createPopupContent(marker), {
          className: 'cosmic-popup',
          maxWidth: 300,
          closeButton: true,
        });

      leafletMarker.on('click', () => {
        onMarkerClick(marker);
      });

      markersLayerRef.current!.addLayer(leafletMarker);
    });

    // Add cluster markers
    clusters.forEach(cluster => {
      const icon = createClusterIcon(cluster.count);
      const leafletMarker = L.marker([cluster.centerLat, cluster.centerLng], { icon });

      leafletMarker.on('click', () => {
        onClusterClick({ centerLat: cluster.centerLat, centerLng: cluster.centerLng });
      });

      clusterLayerRef.current!.addLayer(leafletMarker);
    });
  }, [markers, visibleTypes, onMarkerClick, onClusterClick]);

  /* ─── Fly To Location ─── */
  useEffect(() => {
    if (!mapRef.current || !flyTo) return;

    mapRef.current.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom, {
      duration: 1.5,
    });

    const timer = setTimeout(() => {
      onFlyToComplete();
    }, 1600);

    return () => clearTimeout(timer);
  }, [flyTo, onFlyToComplete]);

  /* ─── My Location Marker ─── */
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing my-location marker
    if (myLocationMarkerRef.current) {
      myLocationMarkerRef.current.remove();
      myLocationMarkerRef.current = null;
    }

    if (myLocation) {
      const pulseIcon = L.divIcon({
        html: `
          <div style="position:relative;width:20px;height:20px;">
            <div style="position:absolute;inset:-8px;border-radius:50%;background:rgba(46,230,199,0.2);animation:markerPulseRing 2s ease-out infinite;"></div>
            <div style="position:absolute;inset:-4px;border-radius:50%;background:rgba(46,230,199,0.3);animation:markerPulseRing 2s ease-out infinite 0.3s;"></div>
            <div style="width:20px;height:20px;border-radius:50%;background:#2EE6C7;border:3px solid #04050b;box-shadow:0 0 12px rgba(46,230,199,0.5);"></div>
          </div>
        `,
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      myLocationMarkerRef.current = L.marker([myLocation.lat, myLocation.lng], {
        icon: pulseIcon,
        zIndexOffset: 1000,
      })
        .bindPopup(
          `<div style="padding:8px 12px;font-family:'Inter',system-ui,sans-serif;color:#F2F5FF;">
            <div style="font-size:13px;font-weight:600;">📍 Your Location</div>
          </div>`,
          { className: 'cosmic-popup', closeButton: false }
        )
        .addTo(mapRef.current);
    }
  }, [myLocation]);

  return (
    <div
      ref={containerRef}
      className={className || 'w-full h-full'}
      style={{ background: '#0A0E1A' }}
    />
  );
}
