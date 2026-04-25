'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search, X, MapPin, Users, Clock, Filter,
  FileText, Activity, UsersRound, Megaphone,
  Calendar, MessageSquare, ChevronDown, Navigation,
  Loader2, Globe, Building2, Layers, Sparkles, Crosshair,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapMarkerData,
  ActivityType,
  ACTIVITY_COLORS,
  ACTIVITY_LABELS,
} from './MapMarker';

/* ─── Types ─── */

interface MapSidebarProps {
  markers: MapMarkerData[];
  stats: {
    totalMarkers: number;
    byType: Record<string, number>;
    byCountry: Record<string, number>;
  };
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onSearchSelect: (lat: number, lng: number) => void;
  onSetLocation: () => void;
  loading: boolean;
}

interface CityResult {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  countryName: string;
  countryEmoji: string;
  stateName: string;
}

interface CountryResult {
  id: number;
  name: string;
  emoji: string;
  region: string;
}

/* ─── Filter Config ─── */

const filterTabs: { key: string; label: string; type: ActivityType | null }[] = [
  { key: 'all', label: 'All', type: null },
  { key: 'proposals', label: 'Proposals', type: 'proposal' },
  { key: 'processes', label: 'Processes', type: 'process' },
  { key: 'assemblies', label: 'Assemblies', type: 'assembly' },
  { key: 'initiatives', label: 'Initiatives', type: 'initiative' },
  { key: 'meetings', label: 'Meetings', type: 'meeting' },
  { key: 'debates', label: 'Debates', type: 'debate' },
];

const typeIcons: Record<ActivityType, React.ReactNode> = {
  proposal: <FileText className="w-3.5 h-3.5" />,
  process: <Activity className="w-3.5 h-3.5" />,
  assembly: <UsersRound className="w-3.5 h-3.5" />,
  initiative: <Megaphone className="w-3.5 h-3.5" />,
  meeting: <Calendar className="w-3.5 h-3.5" />,
  debate: <MessageSquare className="w-3.5 h-3.5" />,
};

/* ─── Utility ─── */

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/* ─── Component ─── */

export default function MapSidebar({
  markers,
  stats,
  activeFilter,
  onFilterChange,
  onSearchSelect,
  onSetLocation,
  loading,
}: MapSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    countries: CountryResult[];
    cities: CityResult[];
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── Debounced Search ─── */
  const handleSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }
    setSearchLoading(true);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/geo/search?q=${encodeURIComponent(q)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setSearchResults({ countries: data.countries || [], cities: data.cities || [] });
            setSearchOpen(true);
          }
          setSearchLoading(false);
        })
        .catch(() => setSearchLoading(false));
    }, 350);
  }, []);

  /* ─── Select search result ─── */
  const handleSelect = useCallback((lat: number, lng: number) => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults(null);
    onSearchSelect(lat, lng);
  }, [onSearchSelect]);

  /* ─── Close search on outside click ─── */
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Small delay to allow clicking on search results
    setTimeout(() => {
      if (searchRef.current && !searchRef.current.contains(document.activeElement)) {
        setSearchOpen(false);
      }
    }, 200);
  }, []);

  /* ─── Count unique countries ─── */
  const countryCount = Object.keys(stats.byCountry).length;

  /* ─── Count unique cities from markers ─── */
  const citySet = new Set(markers.filter(m => m.cityName).map(m => m.cityName));
  const cityCount = citySet.size;

  /* ─── Filter markers ─── */
  const filteredMarkers = activeFilter === 'all'
    ? markers
    : markers.filter(m => {
        const typeMap: Record<string, ActivityType> = {
          proposals: 'proposal',
          processes: 'process',
          assemblies: 'assembly',
          initiatives: 'initiative',
          meetings: 'meeting',
          debates: 'debate',
        };
        return m.type === typeMap[activeFilter];
      });

  return (
    <div className="flex flex-col h-full">
      {/* ─── Search Bar ─── */}
      <div ref={searchRef} className="relative mb-3" onBlur={handleBlur}>
        <div className="glass-card rounded-xl p-1">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-cosmic-muted" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); handleSearch(e.target.value); }}
              onFocus={() => { if (searchResults && (searchResults.countries.length || searchResults.cities.length)) setSearchOpen(true); }}
              className="w-full bg-transparent pl-10 pr-10 py-2.5 text-white placeholder:text-cosmic-muted/60 text-sm outline-none"
            />
            {searchLoading && (
              <Loader2 className="absolute right-3 w-4 h-4 text-cosmic-teal animate-spin" />
            )}
            {searchQuery && !searchLoading && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults(null); setSearchOpen(false); }}
                className="absolute right-3 p-0.5 rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-cosmic-muted" />
              </button>
            )}
          </div>
        </div>

        {/* Search Dropdown */}
        <AnimatePresence>
          {searchOpen && searchResults && (
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 left-0 right-0 top-full mt-1 glass-card rounded-xl overflow-hidden max-h-[320px] overflow-y-auto"
            >
              {searchResults.countries.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 border-b border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] font-semibold text-cosmic-teal uppercase tracking-wider">Countries</span>
                  </div>
                  {searchResults.countries.map(c => (
                    <button
                      key={`country-${c.id}`}
                      onClick={() => {
                        // Fly to country center — approximate from region
                        handleSelect(30, 0); // Will be refined by the API
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                    >
                      <span className="text-lg">{c.emoji}</span>
                      <span className="flex-1 text-sm text-white">{c.name}</span>
                      <Badge variant="outline" className="text-[9px] border-cosmic-teal/20 text-cosmic-teal">{c.region}</Badge>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.cities.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 border-b border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] font-semibold text-cosmic-amber uppercase tracking-wider">Cities</span>
                  </div>
                  {searchResults.cities.slice(0, 15).map(c => (
                    <button
                      key={`city-${c.id}`}
                      onClick={() => {
                        const lat = parseFloat(c.latitude);
                        const lng = parseFloat(c.longitude);
                        if (!isNaN(lat) && !isNaN(lng)) {
                          handleSelect(lat, lng);
                        }
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                    >
                      <span className="text-lg">{c.countryEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white">{c.name}</span>
                        <span className="text-xs text-cosmic-muted ml-1.5">{c.stateName}, {c.countryName}</span>
                      </div>
                      <MapPin className="w-3.5 h-3.5 text-cosmic-amber/50 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
              {searchResults.countries.length === 0 && searchResults.cities.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <Globe className="w-8 h-8 text-cosmic-muted/20 mx-auto mb-2" />
                  <p className="text-cosmic-muted text-xs">No locations found</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Quick Stats ─── */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs">
          <Sparkles className="w-3 h-3 text-cosmic-teal" />
          <span className="text-white font-semibold">{stats.totalMarkers}</span>
          <span className="text-cosmic-muted">Activities</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs">
          <Globe className="w-3 h-3 text-cosmic-violet" />
          <span className="text-white font-semibold">{countryCount}</span>
          <span className="text-cosmic-muted">Countries</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs">
          <Building2 className="w-3 h-3 text-cosmic-amber" />
          <span className="text-white font-semibold">{cityCount}</span>
          <span className="text-cosmic-muted">Cities</span>
        </div>
      </div>

      {/* ─── Set Location Button ─── */}
      <Button
        size="sm"
        className="mb-3 bg-cosmic-teal/10 text-cosmic-teal hover:bg-cosmic-teal/20 border border-cosmic-teal/20 justify-start"
        variant="outline"
        onClick={onSetLocation}
      >
        <Crosshair className="w-3.5 h-3.5 mr-1.5" /> Set My Location
      </Button>

      {/* ─── Filter Tabs ─── */}
      <div className="mb-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-cosmic-muted hover:text-white transition-colors mb-2 w-full"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filter by type</span>
          <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-1.5 pb-1">
                {filterTabs.map(tab => {
                  const color = tab.type ? ACTIVITY_COLORS[tab.type] : '#2EE6C7';
                  const count = tab.type
                    ? (stats.byType[tab.type + 's'] || 0) + (stats.byType[tab.key] || 0)
                    : stats.totalMarkers;
                  const isActive = activeFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => onFilterChange(tab.key)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'text-white border'
                          : 'bg-white/[0.03] text-cosmic-muted border border-transparent hover:bg-white/[0.06] hover:text-white'
                      }`}
                      style={isActive ? {
                        background: `${color}15`,
                        borderColor: `${color}30`,
                        color: color,
                        boxShadow: `0 0 12px ${color}10`,
                      } : undefined}
                    >
                      {tab.type && (
                        <span style={{ color }}>{typeIcons[tab.type]}</span>
                      )}
                      <span>{tab.label}</span>
                      <span className="text-[10px] opacity-60">{count}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Activity List ─── */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: 'thin' }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-cosmic-violet/20 border-t-cosmic-violet animate-spin" />
              <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-b-cosmic-teal animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
          </div>
        ) : filteredMarkers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="w-10 h-10 text-cosmic-muted/20 mb-3" />
            <p className="text-cosmic-muted text-sm">No activities found</p>
            <p className="text-cosmic-muted/50 text-xs mt-1">Try zooming out or changing filters</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMarkers.slice(0, 50).map((marker, i) => {
              const color = ACTIVITY_COLORS[marker.type];
              const label = ACTIVITY_LABELS[marker.type];
              const location = [marker.cityName, marker.countryName].filter(Boolean).join(', ') || 'Unknown';
              const icon = typeIcons[marker.type];
              const timeAgo = getTimeAgo(marker.createdAt);

              return (
                <motion.div
                  key={marker.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5), duration: 0.2 }}
                >
                  <Link href={marker.url}>
                    <div
                      className="group relative rounded-xl p-3 transition-all duration-200 hover:bg-white/[0.04] cursor-pointer"
                      style={{
                        background: 'linear-gradient(135deg, rgba(12,16,32,0.5), rgba(5,8,19,0.3))',
                        borderLeft: `3px solid ${color}`,
                        border: `1px solid rgba(242,245,255,0.06)`,
                        borderLeftWidth: '3px',
                        borderLeftColor: color,
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        {/* Type icon */}
                        <div
                          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: `${color}15`, color }}
                        >
                          {icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
                              {label}
                            </span>
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-full"
                              style={{
                                background: `${color}15`,
                                color,
                                border: `1px solid ${color}25`,
                              }}
                            >
                              {marker.status}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium text-white truncate group-hover:text-cosmic-teal transition-colors">
                            {marker.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1 text-[11px] text-cosmic-muted">
                              <MapPin className="w-2.5 h-2.5" />
                              {location}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-[11px] text-cosmic-muted">
                              <Users className="w-2.5 h-2.5" />
                              {marker.participantCount}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-cosmic-muted">
                              <Clock className="w-2.5 h-2.5" />
                              {timeAgo}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}

            {filteredMarkers.length > 50 && (
              <div className="text-center py-3 text-xs text-cosmic-muted">
                Showing 50 of {filteredMarkers.length} activities
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
