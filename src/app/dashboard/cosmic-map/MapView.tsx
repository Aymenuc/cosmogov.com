'use client';

import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import type { HomeId } from '@/lib/stickers';
import {
  MapMarkerData,
  MapBloom,
  ActivityType,
  createMarkerIcon,
  createClusterIcon,
  createPopupContent,
  createHomeIcon,
  createHomeLabelIcon,
  createBloomIcon,
  createBloomPopup,
  clusterMarkers,
} from './MapMarker';

/* ─── Fix Leaflet default icon issue ─── */
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

/* ─── Basemap ───
 * Open-source vector basemap: OpenFreeMap (OpenStreetMap data, OpenMapTiles
 * schema), drawn with MapLibre inside Leaflet. No API key or account needed.
 * Point NEXT_PUBLIC_MAP_STYLE_URL at another MapLibre style (for example a
 * self-hosted OpenFreeMap or Protomaps style) to change providers. */
const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/positron';
const MAP_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> ' +
  '&copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> ' +
  'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

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
  /** Your home city and the home you have grown into (only you see it). */
  home: { lat: number; lng: number; homeId: HomeId; cityName: string | null } | null;
  /** Where the shared garden blooms, per community. */
  blooms: MapBloom[];
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
  home,
  blooms,
  className,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const clusterLayerRef = useRef<L.LayerGroup | null>(null);
  const bloomsLayerRef = useRef<L.LayerGroup | null>(null);
  const homeMarkerRef = useRef<L.Marker | null>(null);
  const homeLabelRef = useRef<L.Marker | null>(null);
  const myLocationMarkerRef = useRef<L.Marker | null>(null);
  const moveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Pins pop in the first time they appear, not on every pan. */
  const seenRef = useRef<Set<string>>(new Set());
  const firstTime = (key: string) => {
    if (seenRef.current.has(key)) return false;
    seenRef.current.add(key);
    return true;
  };

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

    // Neutral civic basemap (open source, no API key)
    maplibreGL({
      style: MAP_STYLE_URL,
      attributionControl: { customAttribution: MAP_ATTRIBUTION },
    }).addTo(map);

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Create layers (blooms sit under the activity pins)
    bloomsLayerRef.current = L.layerGroup().addTo(map);
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

    // City-level activities share the city's exact point. Fan those out in a
    // small ring (a fixed pixel radius at any zoom) so each one can be seen.
    const sameSpot = new Map<string, MapMarkerData[]>();
    individual.forEach((m) => {
      const key = `${m.latitude.toFixed(5)},${m.longitude.toFixed(5)}`;
      sameSpot.set(key, [...(sameSpot.get(key) ?? []), m]);
    });
    const position = new Map<MapMarkerData, L.LatLng>();
    sameSpot.forEach((group) => {
      group.forEach((m, i) => {
        if (group.length === 1) {
          position.set(m, L.latLng(m.latitude, m.longitude));
          return;
        }
        const angle = (2 * Math.PI * i) / group.length - Math.PI / 2;
        const radius = 30 + group.length * 3;
        const centre = map.project([m.latitude, m.longitude], zoom);
        position.set(m, map.unproject(centre.add([radius * Math.cos(angle), radius * Math.sin(angle)]), zoom));
      });
    });

    // Add individual markers
    individual.forEach(marker => {
      const icon = createMarkerIcon(marker.type, firstTime(`m:${marker.type}:${marker.id}`));
      const leafletMarker = L.marker(position.get(marker) ?? [marker.latitude, marker.longitude], {
        icon,
        title: marker.title,
        alt: marker.title,
        riseOnHover: true,
      })
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
      const key = `c:${cluster.count}:${cluster.centerLat.toFixed(2)}:${cluster.centerLng.toFixed(2)}`;
      const icon = createClusterIcon(cluster.count, firstTime(key));
      const leafletMarker = L.marker([cluster.centerLat, cluster.centerLng], {
        icon,
        title: `${cluster.count} activities here. Zoom in.`,
      });

      leafletMarker.on('click', () => {
        onClusterClick({ centerLat: cluster.centerLat, centerLng: cluster.centerLng });
      });

      clusterLayerRef.current!.addLayer(leafletMarker);
    });
  }, [markers, visibleTypes, onMarkerClick, onClusterClick]);

  /* ─── Garden blooms ─── */
  useEffect(() => {
    const layer = bloomsLayerRef.current;
    if (!mapRef.current || !layer) return;
    layer.clearLayers();
    blooms.forEach((bloom) => {
      L.marker([bloom.latitude, bloom.longitude], {
        icon: createBloomIcon(bloom.tasksDone, firstTime(`b:${bloom.id}:${bloom.tasksDone}`)),
        title: `${bloom.name}: ${bloom.tasksDone} tasks finished`,
        zIndexOffset: -500,
      })
        .bindPopup(createBloomPopup(bloom), { className: 'cosmic-popup', maxWidth: 280 })
        .addTo(layer);
    });
  }, [blooms]);

  /* ─── Your home ─── */
  useEffect(() => {
    if (!mapRef.current) return;
    homeMarkerRef.current?.remove();
    homeMarkerRef.current = null;
    homeLabelRef.current?.remove();
    homeLabelRef.current = null;
    if (!home) return;
    homeMarkerRef.current = L.marker([home.lat, home.lng], {
      icon: createHomeIcon(home.homeId, home.cityName),
      title: 'Your home',
      // Under the activity pins: the house is the backdrop, activities stay clickable.
      zIndexOffset: -1000,
      keyboard: false,
    }).addTo(mapRef.current);
    // The name tag rides above everything so pins never cover it.
    homeLabelRef.current = L.marker([home.lat, home.lng], {
      icon: createHomeLabelIcon(home.cityName),
      interactive: false,
      keyboard: false,
      zIndexOffset: 2000,
    }).addTo(mapRef.current);
  }, [home?.lat, home?.lng, home?.homeId, home?.cityName]);

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
        html: `<div class="map-you"><span></span></div>`,
        className: 'map-pin-host',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      myLocationMarkerRef.current = L.marker([myLocation.lat, myLocation.lng], {
        icon: pulseIcon,
        zIndexOffset: 1000,
        title: 'You are around here',
      })
        .bindPopup(
          `<div class="map-card"><h3>You are around here</h3><p class="map-card-meta">From your browser, for this visit only. Nothing is saved.</p></div>`,
          { className: 'cosmic-popup', closeButton: false }
        )
        .addTo(mapRef.current);
    }
  }, [myLocation]);

  return (
    <div
      ref={containerRef}
      className={className || 'w-full h-full'}
      style={{ background: '#f2efe9' }}
    />
  );
}
