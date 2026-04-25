'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, MapPin, ChevronRight, Loader2, Sparkles,
  Crosshair, Layers, PanelRightOpen, PanelRightClose,
  Navigation, Users, Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MapSidebar from './MapSidebar';
import { MapMarkerData, ActivityType, ACTIVITY_COLORS, ACTIVITY_LABELS } from './MapMarker';

/* ─── Dynamic import for MapView (SSR disabled for Leaflet) ─── */
const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0A0E1A]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-2 border-cosmic-teal/20 border-t-cosmic-teal animate-spin" />
          <div className="absolute inset-0 w-14 h-14 rounded-full border-2 border-transparent border-b-cosmic-violet animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Globe className="w-6 h-6 text-cosmic-teal" />
          </div>
        </div>
        <span className="text-cosmic-muted text-sm">Loading cosmic map...</span>
      </div>
    </div>
  ),
});

/* ─── Types ─── */

interface MapStats {
  totalMarkers: number;
  byType: Record<string, number>;
  byCountry: Record<string, number>;
}

/* ─── Main Page ─── */

export default function CosmicMapPage() {
  const [markers, setMarkers] = useState<MapMarkerData[]>([]);
  const [stats, setStats] = useState<MapStats>({ totalMarkers: 0, byType: {}, byCountry: {} });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [visibleTypes, setVisibleTypes] = useState<Set<ActivityType>>(
    new Set(['proposal', 'process', 'assembly', 'initiative', 'meeting', 'debate'])
  );
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapCenterRef = useRef<{ lat: number; lng: number }>({ lat: 30, lng: 0 });
  const initialLoadRef = useRef(false);

  /* ─── Fetch map data ─── */
  const fetchMapData = useCallback(async (bounds?: { swLat: number; swLng: number; neLat: number; neLng: number }) => {
    try {
      const typeParam = activeFilter === 'all' ? 'all' : activeFilter;
      let url = `/api/geo/map-data?type=${typeParam}`;
      if (bounds) {
        url += `&bounds=${bounds.swLat},${bounds.swLng},${bounds.neLat},${bounds.neLng}`;
      }
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

  /* ─── Initial fetch ─── */
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      fetchMapData();
    }
  }, [fetchMapData]);

  /* ─── Refetch when filter changes ─── */
  useEffect(() => {
    if (initialLoadRef.current) {
      fetchMapData();
    }
  }, [activeFilter, fetchMapData]);

  /* ─── Update visible types based on filter ─── */
  useEffect(() => {
    if (activeFilter === 'all') {
      setVisibleTypes(new Set(['proposal', 'process', 'assembly', 'initiative', 'meeting', 'debate']));
    } else {
      const typeMap: Record<string, ActivityType> = {
        proposals: 'proposal',
        processes: 'process',
        assemblies: 'assembly',
        initiatives: 'initiative',
        meetings: 'meeting',
        debates: 'debate',
      };
      const t = typeMap[activeFilter];
      if (t) setVisibleTypes(new Set([t]));
    }
  }, [activeFilter]);

  /* ─── Handle map move ─── */
  const handleMapMove = useCallback((bounds: { swLat: number; swLng: number; neLat: number; neLng: number }, center: { lat: number; lng: number }) => {
    mapCenterRef.current = { lat: center.lat, lng: center.lng };
    // Refetch data for new bounds
    fetchMapData({
      swLat: bounds.swLat,
      swLng: bounds.swLng,
      neLat: bounds.neLat,
      neLng: bounds.neLng,
    });
  }, [fetchMapData]);

  /* ─── Handle marker click ─── */
  const handleMarkerClick = useCallback((marker: MapMarkerData) => {
    // Could navigate or show details
  }, []);

  /* ─── Handle cluster click ─── */
  const handleClusterClick = useCallback((cluster: { centerLat: number; centerLng: number }) => {
    setFlyTo({ lat: cluster.centerLat, lng: cluster.centerLng, zoom: 8 });
  }, []);

  /* ─── Fly-to complete ─── */
  const handleFlyToComplete = useCallback(() => {
    setFlyTo(null);
  }, []);

  /* ─── Handle search select ─── */
  const handleSearchSelect = useCallback((lat: number, lng: number) => {
    setFlyTo({ lat, lng, zoom: 12 });
  }, []);

  /* ─── Set my location ─── */
  const handleSetLocation = useCallback(async () => {
    try {
      // Try browser geolocation first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setMyLocation({ lat: latitude, lng: longitude });
            setUserLocation({ lat: latitude, lng: longitude });
            setFlyTo({ lat: latitude, lng: longitude, zoom: 12 });
          },
          () => {
            // Fallback: use map center
            const center = mapCenterRef.current;
            setMyLocation(center);
            setUserLocation(center);
          }
        );
      } else {
        const center = mapCenterRef.current;
        setMyLocation(center);
        setUserLocation(center);
      }
    } catch {
      // Use map center as fallback
      const center = mapCenterRef.current;
      setMyLocation(center);
      setUserLocation(center);
    }
  }, []);

  /* ─── Go to my location ─── */
  const handleGoToMyLocation = useCallback(() => {
    if (userLocation) {
      setFlyTo({ lat: userLocation.lat, lng: userLocation.lng, zoom: 12 });
    } else {
      handleSetLocation();
    }
  }, [userLocation, handleSetLocation]);

  /* ─── Count unique countries & cities ─── */
  const countryCount = Object.keys(stats.byCountry).length;
  const citySet = new Set(markers.filter(m => m.cityName).map(m => m.cityName));
  const cityCount = citySet.size;

  return (
    <div className="space-y-0 -m-4 lg:-m-8">
      {/* ═══════════ HERO HEADER ═══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden"
      >
        <div className="relative z-10 px-4 lg:px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0A0E1A]/80 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cosmic-teal/20 to-cosmic-violet/20 border border-white/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-cosmic-teal" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-heading">
                <span className="text-gradient">Cosmic Map</span>
              </h1>
              <p className="text-cosmic-muted text-sm">Discover governance activities across the globe</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cosmic-teal" />
              <span className="text-white font-semibold">{stats.totalMarkers}</span>
              <span className="text-cosmic-muted">Activities</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">
              <Navigation className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cosmic-violet" />
              <span className="text-white font-semibold">{countryCount}</span>
              <span className="text-cosmic-muted">Countries</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">
              <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cosmic-amber" />
              <span className="text-white font-semibold">{cityCount}</span>
              <span className="text-cosmic-muted">Cities</span>
            </div>

            {/* My Location Button */}
            <Button
              size="sm"
              className="bg-cosmic-teal/10 text-cosmic-teal hover:bg-cosmic-teal/20 border border-cosmic-teal/20 hidden sm:inline-flex"
              variant="outline"
              onClick={handleGoToMyLocation}
            >
              <Crosshair className="w-3.5 h-3.5 mr-1" />
              {userLocation ? 'My Location' : 'Locate Me'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ═══════════ MAIN CONTENT: MAP + SIDEBAR ═══════════ */}
      <div className="relative flex" style={{ height: 'calc(100vh - 140px)' }}>
        {/* ─── Map Area ─── */}
        <div className="relative flex-1 min-w-0">
          <MapView
            markers={markers}
            visibleTypes={visibleTypes}
            onMapMove={handleMapMove}
            onMarkerClick={handleMarkerClick}
            onClusterClick={handleClusterClick}
            flyTo={flyTo}
            onFlyToComplete={handleFlyToComplete}
            myLocation={myLocation}
          />

          {/* ─── Layer Controls (top-left overlay) ─── */}
          <div className="absolute top-3 left-3 z-[1000]">
            <LayerControls
              visibleTypes={visibleTypes}
              onToggleType={(type) => {
                setVisibleTypes(prev => {
                  const next = new Set(prev);
                  if (next.has(type)) {
                    // Don't allow removing all types
                    if (next.size > 1) next.delete(type);
                  } else {
                    next.add(type);
                  }
                  return next;
                });
              }}
            />
          </div>

          {/* ─── My Location Button (mobile) ─── */}
          <div className="absolute bottom-4 left-3 z-[1000] sm:hidden">
            <Button
              size="sm"
              className="bg-cosmic-teal/15 text-cosmic-teal hover:bg-cosmic-teal/25 border border-cosmic-teal/25 backdrop-blur-sm h-10 w-10 p-0 rounded-full"
              variant="outline"
              onClick={handleGoToMyLocation}
            >
              <Crosshair className="w-4 h-4" />
            </Button>
          </div>

          {/* ─── Sidebar Toggle ─── */}
          <div className="absolute top-3 right-14 z-[1000] hidden lg:block">
            <Button
              size="sm"
              className="bg-[#0B1022]/90 text-cosmic-muted hover:text-white border border-white/10 backdrop-blur-sm h-8 w-8 p-0"
              variant="outline"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            </Button>
          </div>

          {/* ─── Mobile View Toggle ─── */}
          <div className="absolute bottom-4 right-3 z-[1000] flex lg:hidden gap-2">
            <Button
              size="sm"
              className={`backdrop-blur-sm h-9 px-3 text-xs font-medium ${
                mobileView === 'map'
                  ? 'bg-cosmic-teal/20 text-cosmic-teal border-cosmic-teal/30'
                  : 'bg-[#0B1022]/90 text-cosmic-muted border-white/10'
              } border`}
              variant="outline"
              onClick={() => setMobileView('map')}
            >
              <Globe className="w-3.5 h-3.5 mr-1" /> Map
            </Button>
            <Button
              size="sm"
              className={`backdrop-blur-sm h-9 px-3 text-xs font-medium ${
                mobileView === 'list'
                  ? 'bg-cosmic-teal/20 text-cosmic-teal border-cosmic-teal/30'
                  : 'bg-[#0B1022]/90 text-cosmic-muted border-white/10'
              } border`}
              variant="outline"
              onClick={() => setMobileView('list')}
            >
              <Layers className="w-3.5 h-3.5 mr-1" /> List
            </Button>
          </div>
        </div>

        {/* ─── Sidebar ─── */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={`hidden lg:block border-l border-white/5 bg-[#0A0E1A]/95 backdrop-blur-xl overflow-hidden flex-shrink-0`}
            >
              <div className="p-4 h-full overflow-hidden">
                <MapSidebar
                  markers={markers}
                  stats={stats}
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                  onSearchSelect={handleSearchSelect}
                  onSetLocation={handleSetLocation}
                  loading={loading}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Mobile Sidebar (bottom sheet) ─── */}
        <AnimatePresence>
          {mobileView === 'list' && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed inset-0 top-14 z-50 lg:hidden bg-[#0A0E1A]/98 backdrop-blur-xl"
            >
              <div className="h-full p-4 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold font-heading text-white">Activities</h2>
                  <Button
                    size="sm"
                    className="text-cosmic-muted hover:text-white h-8 w-8 p-0"
                    variant="ghost"
                    onClick={() => setMobileView('map')}
                  >
                    ✕
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <MapSidebar
                    markers={markers}
                    stats={stats}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    onSearchSelect={(lat, lng) => {
                      handleSearchSelect(lat, lng);
                      setMobileView('map');
                    }}
                    onSetLocation={handleSetLocation}
                    loading={loading}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Layer Controls Component ─── */

function LayerControls({
  visibleTypes,
  onToggleType,
}: {
  visibleTypes: Set<ActivityType>;
  onToggleType: (type: ActivityType) => void;
}) {
  const [open, setOpen] = useState(false);

  const types: { type: ActivityType; label: string }[] = [
    { type: 'proposal', label: 'Proposals' },
    { type: 'process', label: 'Processes' },
    { type: 'assembly', label: 'Assemblies' },
    { type: 'initiative', label: 'Initiatives' },
    { type: 'meeting', label: 'Meetings' },
    { type: 'debate', label: 'Debates' },
  ];

  return (
    <div className="relative">
      <Button
        size="sm"
        className={`bg-[#0B1022]/90 backdrop-blur-sm border text-xs font-medium h-8 px-2.5 gap-1.5 ${
          open ? 'text-cosmic-teal border-cosmic-teal/30' : 'text-cosmic-muted border-white/10 hover:text-white'
        }`}
        variant="outline"
        onClick={() => setOpen(!open)}
      >
        <Layers className="w-3.5 h-3.5" />
        Layers
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-52 glass-card rounded-xl p-3 space-y-1"
          >
            <div className="text-[10px] font-semibold text-cosmic-muted uppercase tracking-wider mb-2">
              Activity Types
            </div>
            {types.map(({ type, label }) => {
              const color = ACTIVITY_COLORS[type];
              const isVisible = visibleTypes.has(type);
              return (
                <button
                  key={type}
                  onClick={() => onToggleType(type)}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <div
                    className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
                    style={{
                      borderColor: isVisible ? color : 'rgba(242,245,255,0.15)',
                      background: isVisible ? `${color}30` : 'transparent',
                    }}
                  >
                    {isVisible && (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span
                    className="text-xs font-medium"
                    style={{ color: isVisible ? color : '#A7B3D6' }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


