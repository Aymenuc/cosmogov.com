'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Layers, PanelRightOpen, PanelRightClose, Map as MapIcon, List, X, Crosshair } from 'lucide-react';
import MapSidebar, { type CityResult } from './MapSidebar';
import {
  MapMarkerData,
  MapBloom,
  ActivityType,
  ACTIVITY_COLORS,
  ACTIVITY_TINTS,
  ACTIVITY_LABELS,
  ACTIVITY_ICONS,
} from './MapMarker';
import { useStickers, announceStickerProgress } from '@/components/stickers/StickerBook';
import { homeFor } from '@/lib/stickers';

/* ─── Dynamic import for MapView (Leaflet and MapLibre need the browser) ─── */
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <span className="map-loading-pin" aria-hidden="true" />
      <span>Unfolding the map…</span>
    </div>
  ),
});

interface MapStats {
  totalMarkers: number;
  byType: Record<string, number>;
  byCountry: Record<string, number>;
}

const ALL_TYPES: ActivityType[] = ['proposal', 'process', 'assembly', 'initiative', 'meeting', 'debate'];

export default function CommunityMapPage() {
  const [markers, setMarkers] = useState<MapMarkerData[]>([]);
  const [stats, setStats] = useState<MapStats>({ totalMarkers: 0, byType: {}, byCountry: {} });
  const [blooms, setBlooms] = useState<MapBloom[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [visibleTypes, setVisibleTypes] = useState<Set<ActivityType>>(new Set(ALL_TYPES));
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const mapCenterRef = useRef<{ lat: number; lng: number }>({ lat: 30, lng: 0 });
  const initialLoadRef = useRef(false);
  const flewHomeRef = useRef(false);

  const { stickers, home } = useStickers();
  const homeLevel = homeFor(stickers.filter((s) => s.earned).length);

  /* ─── Fetch map data ─── */
  const fetchMapData = useCallback(async (bounds?: { swLat: number; swLng: number; neLat: number; neLng: number }) => {
    try {
      let url = `/api/geo/map-data?type=${activeFilter === 'all' ? 'all' : activeFilter}`;
      if (bounds) url += `&bounds=${bounds.swLat},${bounds.swLng},${bounds.neLat},${bounds.neLng}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMarkers(data.markers || []);
        setStats(data.stats || { totalMarkers: 0, byType: {}, byCountry: {} });
      }
    } catch (err) {
      console.error('Failed to fetch map data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      fetchMapData();
    }
  }, [fetchMapData]);

  useEffect(() => {
    if (initialLoadRef.current) fetchMapData();
  }, [activeFilter, fetchMapData]);

  /* ─── Garden blooms (signed-in, missions you can see) ─── */
  useEffect(() => {
    fetch('/api/geo/blooms')
      .then((r) => (r.ok ? r.json() : { blooms: [] }))
      .then((d) => setBlooms(Array.isArray(d.blooms) ? d.blooms : []))
      .catch(() => setBlooms([]));
  }, []);

  /* ─── Start at home, once, when we know where that is ─── */
  useEffect(() => {
    if (home && !flewHomeRef.current) {
      flewHomeRef.current = true;
      setFlyTo({ lat: home.latitude, lng: home.longitude, zoom: 10 });
    }
  }, [home]);

  useEffect(() => {
    if (activeFilter === 'all') {
      setVisibleTypes(new Set(ALL_TYPES));
    } else {
      const map: Record<string, ActivityType> = {
        proposals: 'proposal',
        processes: 'process',
        assemblies: 'assembly',
        initiatives: 'initiative',
        meetings: 'meeting',
        debates: 'debate',
      };
      const t = map[activeFilter];
      if (t) setVisibleTypes(new Set([t]));
    }
  }, [activeFilter]);

  const handleMapMove = useCallback((bounds: { swLat: number; swLng: number; neLat: number; neLng: number }, center: { lat: number; lng: number }) => {
    mapCenterRef.current = center;
    fetchMapData(bounds);
  }, [fetchMapData]);

  const handleMarkerClick = useCallback(() => {}, []);
  const handleClusterClick = useCallback((cluster: { centerLat: number; centerLng: number }) => {
    setFlyTo({ lat: cluster.centerLat, lng: cluster.centerLng, zoom: 8 });
  }, []);
  const handleFlyToComplete = useCallback(() => setFlyTo(null), []);
  const handleSearchSelect = useCallback((lat: number, lng: number) => {
    setFlyTo({ lat, lng, zoom: 11 });
    setMobileView('map');
  }, []);

  /* ─── Show where I am now (browser only, never saved) ─── */
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const spot = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyLocation(spot);
        setFlyTo({ ...spot, zoom: 12 });
        setMobileView('map');
      },
      () => {
        /* permission refused: nothing to show */
      },
    );
  }, []);

  /* ─── Plant your flag: save your home city ─── */
  const handlePlantHome = useCallback(async (city: CityResult) => {
    try {
      const res = await fetch('/api/geo/set-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryId: String(city.country_id),
          stateId: String(city.state_id),
          cityId: String(city.id),
        }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      const lat = Number(data?.location?.latitude);
      const lng = Number(data?.location?.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        flewHomeRef.current = true;
        setFlyTo({ lat, lng, zoom: 11 });
      }
      announceStickerProgress();
      setMobileView('map');
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleGoHome = useCallback(() => {
    if (home) {
      setFlyTo({ lat: home.latitude, lng: home.longitude, zoom: 11 });
      setMobileView('map');
    }
  }, [home]);

  const places = new Set(markers.filter((m) => m.cityName).map((m) => m.cityName)).size;
  const flowers = blooms.reduce((sum, b) => sum + b.tasksDone, 0);

  const sidebar = (
    <MapSidebar
      markers={markers}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      onSearchSelect={handleSearchSelect}
      onLocate={handleLocate}
      loading={loading}
      home={home}
      homeLevel={homeLevel}
      onPlantHome={handlePlantHome}
      onGoHome={handleGoHome}
    />
  );

  return (
    <div className="community-map">
      <header className="map-header">
        <div>
          <p className="map-eyebrow">
            <span className="status-dot" /> Your neighborhood, live
          </p>
          <h1>Community map</h1>
          <p>See what your neighbors are working on, plant your flag, and watch the garden grow.</p>
        </div>
        <ul className="map-header-stats" aria-label="On the map">
          <li style={{ ['--pin-tint' as string]: '#eee6ff', ['--pin-ink' as string]: '#5932c4' }}>
            <strong>{stats.totalMarkers}</strong> {stats.totalMarkers === 1 ? 'thing' : 'things'} happening
          </li>
          <li style={{ ['--pin-tint' as string]: '#e1f3ff', ['--pin-ink' as string]: '#226784' }}>
            <strong>{places}</strong> {places === 1 ? 'place' : 'places'}
          </li>
          <li style={{ ['--pin-tint' as string]: '#dff5e8', ['--pin-ink' as string]: '#28745b' }}>
            <strong>{flowers}</strong> {flowers === 1 ? 'flower' : 'flowers'} in the garden
          </li>
        </ul>
      </header>

      <div className="map-stage">
        <div className="map-canvas">
          <MapView
            markers={markers}
            visibleTypes={visibleTypes}
            onMapMove={handleMapMove}
            onMarkerClick={handleMarkerClick}
            onClusterClick={handleClusterClick}
            flyTo={flyTo}
            onFlyToComplete={handleFlyToComplete}
            myLocation={myLocation}
            home={home ? { lat: home.latitude, lng: home.longitude, homeId: homeLevel.current.id, cityName: home.cityName } : null}
            blooms={blooms}
          />

          <div className="map-overlay top-left">
            <LayerControls
              visibleTypes={visibleTypes}
              onToggleType={(type) =>
                setVisibleTypes((prev) => {
                  const next = new Set(prev);
                  if (next.has(type)) {
                    if (next.size > 1) next.delete(type);
                  } else next.add(type);
                  return next;
                })
              }
            />
          </div>

          <div className="map-overlay top-right hidden lg:block">
            <button
              className="map-chip-button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Hide the side panel' : 'Show the side panel'}
            >
              {sidebarOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            </button>
          </div>

          <div className="map-overlay bottom lg:hidden">
            <button className="map-chip-button" onClick={handleLocate} aria-label="Show where I am right now">
              <Crosshair size={16} />
            </button>
            <button
              className={`map-chip-button ${mobileView === 'map' ? 'active' : ''}`}
              onClick={() => setMobileView('map')}
            >
              <MapIcon size={15} /> Map
            </button>
            <button
              className={`map-chip-button ${mobileView === 'list' ? 'active' : ''}`}
              onClick={() => setMobileView('list')}
            >
              <List size={15} /> {home ? 'Home & list' : 'Plant your flag'}
            </button>
          </div>
        </div>

        {sidebarOpen && <aside className="map-panel hidden lg:block">{sidebar}</aside>}

        {mobileView === 'list' && (
          <div className="map-sheet lg:hidden" role="dialog" aria-label="Community map panel">
            <div className="map-sheet-top">
              <strong>Community map</strong>
              <button className="map-chip-button" onClick={() => setMobileView('map')} aria-label="Close panel">
                <X size={16} />
              </button>
            </div>
            {sidebar}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── What's shown on the map ─── */

function LayerControls({
  visibleTypes,
  onToggleType,
}: {
  visibleTypes: Set<ActivityType>;
  onToggleType: (type: ActivityType) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="map-layers">
      <button className="map-chip-button" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Layers size={15} /> What’s shown
      </button>
      {open && (
        <div className="map-layers-menu">
          {ALL_TYPES.map((type) => {
            const on = visibleTypes.has(type);
            return (
              <button key={type} aria-pressed={on} className={on ? 'on' : ''} onClick={() => onToggleType(type)}>
                <span
                  className="map-type-icon"
                  style={{ ['--pin-tint' as string]: ACTIVITY_TINTS[type], ['--pin-ink' as string]: ACTIVITY_COLORS[type] }}
                  dangerouslySetInnerHTML={{ __html: ACTIVITY_ICONS[type] }}
                />
                {ACTIVITY_LABELS[type]}s
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
