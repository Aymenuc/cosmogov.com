'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Search, MapPin, ChevronRight, ArrowLeft, Users, Building2,
  Landmark, Navigation, Loader2, Sparkles, Compass, X, ChevronDown,
  Mountain, Eye, Activity, Map as MapIcon, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/* ─── Types ─── */
interface Country {
  id: number;
  name: string;
  iso2: string;
  emoji: string;
  capital: string;
  region: string;
  subregion: string;
  currency: string;
  iso3?: string;
  phone_code?: string;
  native?: string;
}

interface Region {
  name: string;
  countries: Country[];
}

interface State {
  id: number;
  name: string;
  country_id: number;
  country_code: string;
  state_code: string;
}

interface City {
  id: number;
  name: string;
  state_id: number;
  state_code: string;
  country_id: number;
  country_code: string;
  latitude: string;
  longitude: string;
  countryName?: string;
  countryEmoji?: string;
  stateName?: string;
}

interface SearchResult {
  countries: Country[];
  states: (State & { countryName: string; countryEmoji: string })[];
  cities: (City & { countryName: string; countryEmoji: string; stateName: string })[];
}

/* ─── Region Tab Config ─── */
const regionTabs = [
  { key: 'all', label: 'All', emoji: '🌐' },
  { key: 'Africa', label: 'Africa', emoji: '🌍' },
  { key: 'Americas', label: 'Americas', emoji: '🌎' },
  { key: 'Asia', label: 'Asia', emoji: '🌏' },
  { key: 'Europe', label: 'Europe', emoji: '🇪🇺' },
  { key: 'Oceania', label: 'Oceania', emoji: '🌊' },
  { key: 'Polar', label: 'Polar', emoji: '🧊' },
];

/* ─── Featured Locations ─── */
const featuredLocations = [
  { name: 'New York', country: 'United States', emoji: '🇺🇸', desc: 'The city that never sleeps' },
  { name: 'London', country: 'United Kingdom', emoji: '🇬🇧', desc: 'The heart of parliamentary democracy' },
  { name: 'Paris', country: 'France', emoji: '🇫🇷', desc: 'City of Light & Liberté' },
  { name: 'Tokyo', country: 'Japan', emoji: '🇯🇵', desc: 'Where tradition meets innovation' },
  { name: 'Berlin', country: 'Germany', emoji: '🇩🇪', desc: 'A city reborn from division' },
  { name: 'São Paulo', country: 'Brazil', emoji: '🇧🇷', desc: 'South America\'s megacity' },
  { name: 'Mumbai', country: 'India', emoji: '🇮🇳', desc: 'The city of dreams' },
  { name: 'Lagos', country: 'Nigeria', emoji: '🇳🇬', desc: 'Africa\'s commercial hub' },
  { name: 'Sydney', country: 'Australia', emoji: '🇦🇺', desc: 'The harbour city' },
  { name: 'Dubai', country: 'United Arab Emirates', emoji: '🇦🇪', desc: 'The city of the future' },
];

/* ─── Cosmic Spinner ─── */
function CosmicSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-cosmic-violet/20 border-t-cosmic-violet animate-spin" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-b-cosmic-teal animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
    </div>
  );
}

/* ─── Constellation Globe Visual ─── */
function ConstellationGlobe() {
  return (
    <div className="relative w-40 h-40 mx-auto sm:w-56 sm:h-56 lg:w-80 lg:h-80">
      {/* Outer rings */}
      <div className="absolute inset-0 rounded-full border border-white/5 orbit-ring" style={{ animation: 'orbitSpin 40s linear infinite' }} />
      <div className="absolute inset-4 rounded-full border border-white/8 orbit-ring" style={{ animation: 'orbitSpin 28s linear infinite reverse' }} />
      <div className="absolute inset-8 rounded-full border border-cosmic-teal/10 orbit-ring" style={{ animation: 'orbitSpin 20s linear infinite' }} />
      <div className="absolute inset-12 rounded-full border border-cosmic-violet/10 orbit-ring" style={{ animation: 'orbitSpin 15s linear infinite reverse' }} />

      {/* Center globe */}
      <div className="absolute inset-16 rounded-full bg-gradient-to-br from-cosmic-teal/10 via-cosmic-accent/5 to-cosmic-violet/10 border border-white/10 planet-glow" />

      {/* Glowing dots on orbits */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * 360;
        const ring = i % 4;
        const radius = ring === 0 ? 128 : ring === 1 ? 112 : ring === 2 ? 96 : 80;
        const size = ring === 0 ? 2 : ring === 1 ? 3 : ring === 2 ? 2 : 2;
        const color = i % 3 === 0 ? '#2EE6C7' : i % 3 === 1 ? '#9B5CFF' : '#2D6BFF';
        const delay = i * 0.8;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 8px ${color}`,
              left: `${50 + Math.cos((angle * Math.PI) / 180) * (radius / 2.56)}%`,
              top: `${50 + Math.sin((angle * Math.PI) / 180) * (radius / 2.56)}%`,
              animation: `starPulse 3s ease-in-out ${delay}s infinite`,
            }}
          />
        );
      })}

      {/* Shooting star */}
      <div className="shooting-star" style={{ top: '20%', left: '10%', animationDelay: '2s' }} />
      <div className="shooting-star" style={{ top: '60%', left: '40%', animationDelay: '5s' }} />

      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cosmic-teal/20 to-cosmic-violet/20 border border-white/10 flex items-center justify-center backdrop-blur-sm">
          <Globe className="w-7 h-7 text-cosmic-teal" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ExplorePage() {
  const router = useRouter();
  // Core data state
  const [regions, setRegions] = useState<Region[]>([]);
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation state
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [view, setView] = useState<'grid' | 'detail'>('grid');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchIndex, setSearchIndex] = useState(-1);

  // Detail state
  const [states, setStates] = useState<State[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  // Location setting state
  const [settingLocation, setSettingLocation] = useState(false);
  const [locationSet, setLocationSet] = useState(false);

  // Set location handlers
  const handleSetLocation = async (countryId: string, countryName: string) => {
    setSettingLocation(true);
    try {
      const res = await fetch('/api/geo/set-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryId, countryName }),
      });
      if (res.ok) {
        setLocationSet(true);
        setTimeout(() => setLocationSet(false), 3000);
      }
    } catch { /* ignore */ }
    setSettingLocation(false);
  };

  const handleSetCityLocation = async (city: City) => {
    setSettingLocation(true);
    try {
      const res = await fetch('/api/geo/set-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryId: city.country_id?.toString(),
          countryName: city.countryName,
          stateId: city.state_id?.toString(),
          stateName: city.stateName,
          cityId: city.id?.toString(),
          cityName: city.name,
        }),
      });
      if (res.ok) {
        setLocationSet(true);
        setTimeout(() => setLocationSet(false), 3000);
      }
    } catch { /* ignore */ }
    setSettingLocation(false);
  };

  // Refs
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch countries on mount
  useEffect(() => {
    fetch('/api/geo/countries')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setRegions(data.regions || []);
          setAllCountries(data.countries || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  const handleSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setSearchResults(null);
      setSearchOpen(false);
      setSearchIndex(-1);
      return;
    }
    setSearchLoading(true);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/geo/search?q=${encodeURIComponent(q)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setSearchResults(data);
            setSearchOpen(true);
            setSearchIndex(-1);
          }
          setSearchLoading(false);
        })
        .catch(() => setSearchLoading(false));
    }, 300);
  }, []);

  // Fetch states when country selected
  useEffect(() => {
    if (!selectedCountry) return;
    let cancelled = false;
    const loadStates = async () => {
      setStates([]);
      setSelectedState(null);
      setCities([]);
      setStatesLoading(true);
      try {
        const r = await fetch(`/api/geo/states?countryId=${selectedCountry.id}`);
        const data = r.ok ? await r.json() : [];
        if (!cancelled) {
          setStates(Array.isArray(data) ? data : []);
          setStatesLoading(false);
        }
      } catch {
        if (!cancelled) setStatesLoading(false);
      }
    };
    loadStates();
    return () => { cancelled = true; };
  }, [selectedCountry]);

  // Fetch cities when state selected
  useEffect(() => {
    if (!selectedState) return;
    let cancelled = false;
    const loadCities = async () => {
      setCities([]);
      setCitiesLoading(true);
      try {
        const r = await fetch(`/api/geo/cities?stateId=${selectedState.id}`);
        const data = r.ok ? await r.json() : [];
        if (!cancelled) {
          setCities(Array.isArray(data) ? data : []);
          setCitiesLoading(false);
        }
      } catch {
        if (!cancelled) setCitiesLoading(false);
      }
    };
    loadCities();
    return () => { cancelled = true; };
  }, [selectedState]);

  // Debounced city search
  useEffect(() => {
    if (!selectedState) return;
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    cityDebounceRef.current = setTimeout(async () => {
      try {
        const url = citySearch
          ? `/api/geo/cities?stateId=${selectedState.id}&search=${encodeURIComponent(citySearch)}`
          : `/api/geo/cities?stateId=${selectedState.id}`;
        const r = await fetch(url);
        const data = r.ok ? await r.json() : [];
        setCities(Array.isArray(data) ? data : []);
        setCitiesLoading(false);
      } catch {
        setCitiesLoading(false);
      }
    }, 300);
    return () => { if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current); };
  }, [citySearch, selectedState]);

  // Keyboard navigation for search
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!searchResults || !searchOpen) return;
    const allItems = [
      ...searchResults.countries.map(c => ({ type: 'country' as const, data: c })),
      ...searchResults.states.map(s => ({ type: 'state' as const, data: s })),
      ...searchResults.cities.map(c => ({ type: 'city' as const, data: c })),
    ];
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchIndex(prev => Math.min(prev + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && searchIndex >= 0 && searchIndex < allItems.length) {
      e.preventDefault();
      const item = allItems[searchIndex];
      handleSearchSelect(item.type, item.data);
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
    }
  };

  const handleSearchSelect = (type: string, data: any) => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults(null);
    setSearchIndex(-1);

    if (type === 'country') {
      const country = allCountries.find(c => c.id === data.id) || data;
      setSelectedCountry(country);
      setView('detail');
    } else if (type === 'state') {
      // Find the country and open detail view, then select the state
      const country = allCountries.find(c => c.id === Number(data.country_id));
      if (country) {
        setSelectedCountry(country);
        setView('detail');
        // After states load, we'll select this state
        setTimeout(() => {
          setSelectedState({ ...data, country_id: Number(data.country_id) });
        }, 500);
      }
    } else if (type === 'city') {
      const country = allCountries.find(c => c.id === Number(data.country_id));
      if (country) {
        setSelectedCountry(country);
        setView('detail');
        setTimeout(() => {
          setSelectedState({ id: data.state_id, name: data.stateName || data.state_code, country_id: Number(data.country_id), country_code: data.country_code, state_code: data.state_code });
        }, 500);
      }
    }
  };

  // Filtered countries for the grid
  const filteredCountries = selectedRegion === 'all'
    ? allCountries
    : allCountries.filter(c => c.region === selectedRegion);

  // Get region counts
  const getRegionCount = (key: string) => {
    if (key === 'all') return allCountries.length;
    return allCountries.filter(c => c.region === key).length;
  };

  // Breadcrumb
  const breadcrumbs: { label: string; action?: () => void }[] = [
    { label: '🌍 World', action: () => { setView('grid'); setSelectedCountry(null); setSelectedState(null); } },
  ];
  if (selectedCountry) {
    breadcrumbs.push({ label: `${selectedCountry.emoji} ${selectedCountry.name}`, action: () => { setSelectedState(null); } });
  }
  if (selectedState) {
    breadcrumbs.push({ label: selectedState.name });
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-2 border-cosmic-teal/20 border-t-cosmic-teal animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-cosmic-violet/20 border-b-cosmic-violet animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Globe className="w-8 h-8 text-cosmic-teal animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-cosmic-muted text-sm font-medium">Loading the global atlas...</p>
            <p className="text-cosmic-muted/50 text-xs mt-1">Mapping every nation on Earth</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8 pb-8 overflow-x-hidden">
      {/* ═══════════ HERO SECTION ═══════════ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl glass-card p-4 sm:p-6 lg:p-8"
      >
        {/* Background constellation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <ConstellationGlobe />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-4 sm:gap-8">
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="cosmic-badge rounded-full px-3 py-1 text-xs font-medium mb-4 inline-flex items-center gap-1.5">
                <Compass className="w-3 h-3" /> COSMIC ATLAS
              </Badge>
            </motion.div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold font-heading mb-3 sm:mb-4">
              <span className="text-gradient">Global Explorer</span>
            </h1>
            <p className="text-cosmic-muted text-sm sm:text-lg max-w-xl mb-4 sm:mb-6">
              Discover governance activities in every country, region, and city on Earth
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10">
                <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cosmic-teal" />
                <span className="text-white font-semibold">{allCountries.length}</span>
                <span className="text-cosmic-muted">Countries</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10">
                <Mountain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cosmic-violet" />
                <span className="text-white font-semibold">4,874</span>
                <span className="text-cosmic-muted">Regions</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10">
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cosmic-amber" />
                <span className="text-white font-semibold">146,156</span>
                <span className="text-cosmic-muted">Cities</span>
              </div>
              <Button
                size="sm"
                className="bg-gradient-to-r from-cosmic-teal/20 to-cosmic-violet/20 text-white hover:from-cosmic-teal/30 hover:to-cosmic-violet/30 border border-white/10"
                onClick={() => router.push('/dashboard/cosmic-map')}
              >
                <MapIcon className="w-4 h-4 mr-1.5" /> Open Cosmic Map
              </Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <ConstellationGlobe />
          </div>
        </div>
      </motion.section>

      {/* ═══════════ SEARCH BAR ═══════════ */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative"
        ref={searchRef}
      >
        <div className="glass-card rounded-2xl p-1.5">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-cosmic-muted" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search any country, state, or city on Earth..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); handleSearch(e.target.value); }}
              onFocus={() => { if (searchResults && (searchResults.countries.length || searchResults.states.length || searchResults.cities.length)) setSearchOpen(true); }}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-transparent pl-12 pr-12 py-4 text-white placeholder:text-cosmic-muted/60 text-base outline-none"
            />
            {searchLoading && (
              <Loader2 className="absolute right-4 w-5 h-5 text-cosmic-teal animate-spin" />
            )}
            {searchQuery && !searchLoading && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults(null); setSearchOpen(false); }}
                className="absolute right-4 p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-cosmic-muted" />
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
              className="absolute z-50 left-0 right-0 top-full mt-2 glass-card rounded-2xl overflow-hidden max-h-[480px] overflow-y-auto"
            >
              {/* Countries */}
              {searchResults.countries.length > 0 && (
                <div>
                  <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02]">
                    <span className="text-xs font-semibold text-cosmic-teal uppercase tracking-wider">Countries</span>
                  </div>
                  {searchResults.countries.map((c, i) => {
                    const idx = i;
                    return (
                      <button
                        key={`country-${c.id}`}
                        onClick={() => handleSearchSelect('country', c)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${searchIndex === idx ? 'bg-white/5' : ''}`}
                      >
                        <span className="text-xl">{c.emoji}</span>
                        <span className="flex-1 text-sm text-white">{c.name}</span>
                        <Badge variant="outline" className="text-[10px] border-cosmic-teal/20 text-cosmic-teal hidden sm:inline-flex">Country</Badge>
                        <ChevronRight className="w-4 h-4 text-cosmic-muted" />
                      </button>
                    );
                  })}
                </div>
              )}
              {/* States */}
              {searchResults.states.length > 0 && (
                <div>
                  <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02]">
                    <span className="text-xs font-semibold text-cosmic-violet uppercase tracking-wider">States / Regions</span>
                  </div>
                  {searchResults.states.map((s, i) => {
                    const idx = searchResults.countries.length + i;
                    return (
                      <button
                        key={`state-${s.id}`}
                        onClick={() => handleSearchSelect('state', s)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${searchIndex === idx ? 'bg-white/5' : ''}`}
                      >
                        <span className="text-xl">{s.countryEmoji}</span>
                        <span className="flex-1 text-sm text-white">{s.name}</span>
                        <span className="text-xs text-cosmic-muted hidden sm:inline">{s.countryName}</span>
                        <Badge variant="outline" className="text-[10px] border-cosmic-violet/20 text-cosmic-violet hidden sm:inline-flex">State</Badge>
                        <ChevronRight className="w-4 h-4 text-cosmic-muted" />
                      </button>
                    );
                  })}
                </div>
              )}
              {/* Cities */}
              {searchResults.cities.length > 0 && (
                <div>
                  <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02]">
                    <span className="text-xs font-semibold text-cosmic-amber uppercase tracking-wider">Cities</span>
                  </div>
                  {searchResults.cities.map((c, i) => {
                    const idx = searchResults.countries.length + searchResults.states.length + i;
                    return (
                      <button
                        key={`city-${c.id}`}
                        onClick={() => handleSearchSelect('city', c)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${searchIndex === idx ? 'bg-white/5' : ''}`}
                      >
                        <span className="text-xl">{c.countryEmoji}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-white">{c.name}</span>
                          <span className="text-xs text-cosmic-muted ml-2 hidden sm:inline">{c.stateName}, {c.countryName}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-cosmic-amber/20 text-cosmic-amber flex-shrink-0 hidden sm:inline-flex">City</Badge>
                        <ChevronRight className="w-4 h-4 text-cosmic-muted flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
              {/* No results */}
              {searchResults.countries.length === 0 && searchResults.states.length === 0 && searchResults.cities.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <Globe className="w-10 h-10 text-cosmic-muted/30 mx-auto mb-3" />
                  <p className="text-cosmic-muted text-sm">No locations found for &quot;{searchQuery}&quot;</p>
                  <p className="text-cosmic-muted/50 text-xs mt-1">Try a different search term</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* ═══════════ BREADCRUMB ═══════════ */}
      <AnimatePresence mode="wait">
        {view === 'detail' && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-2 text-sm"
          >
            {breadcrumbs.map((bc, i) => (
              <div key={i} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="w-3 h-3 text-cosmic-muted/40" />}
                {bc.action ? (
                  <button onClick={bc.action} className="text-cosmic-muted hover:text-cosmic-teal transition-colors">
                    {bc.label}
                  </button>
                ) : (
                  <span className="text-white font-medium">{bc.label}</span>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <AnimatePresence mode="wait">
        {view === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* ──── Region Tabs ──── */}
            <div className="mb-6 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              <div className="flex items-center gap-2 min-w-max">
                {regionTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedRegion(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                      selectedRegion === tab.key
                        ? 'bg-cosmic-accent/15 text-cosmic-accent border border-cosmic-accent/20 shadow-[0_0_20px_rgba(45,107,255,0.1)]'
                        : 'bg-white/[0.03] text-cosmic-muted border border-white/5 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <span>{tab.emoji}</span>
                    <span>{tab.label}</span>
                    <span className="text-xs opacity-60">({getRegionCount(tab.key)})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ──── Country Grid ──── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredCountries.map((country, i) => (
                <motion.button
                  key={country.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.5), duration: 0.3 }}
                  onClick={() => { setSelectedCountry(country); setView('detail'); }}
                  className="group text-left glass-card rounded-xl p-4 hover:border-cosmic-teal/20 hover:shadow-[0_0_30px_rgba(46,230,199,0.06)] transition-all duration-300"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{country.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-white truncate group-hover:text-cosmic-teal transition-colors">{country.name}</h3>
                      <p className="text-xs text-cosmic-muted truncate">{country.capital || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] border-white/10 text-cosmic-muted">
                      {country.subregion || country.region}
                    </Badge>
                    {country.currency && (
                      <Badge variant="outline" className="text-[10px] border-cosmic-amber/10 text-cosmic-amber/70">
                        💰 {country.currency}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-cosmic-muted">
                      <MapPin className="w-3 h-3" />
                      <span>{country.iso2}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-cosmic-muted/40 group-hover:text-cosmic-teal transition-colors" />
                  </div>
                </motion.button>
              ))}
            </div>

            {filteredCountries.length === 0 && (
              <div className="text-center py-16">
                <Globe className="w-12 h-12 text-cosmic-muted/20 mx-auto mb-4" />
                <p className="text-cosmic-muted">No countries found in this region</p>
              </div>
            )}

            {/* ──── Featured Locations ──── */}
            <div className="mt-8 sm:mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-cosmic-amber/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cosmic-amber" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-heading">Featured Locations</h2>
                  <p className="text-xs text-cosmic-muted">Popular governance hubs around the world</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                {featuredLocations.map((loc, i) => (
                  <motion.div
                    key={loc.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
                    className="glass-card-amber rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-[0_0_30px_rgba(255,181,71,0.08)] transition-all duration-300 cursor-pointer group"
                  >
                    <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">{loc.emoji}</span>
                    <h4 className="font-semibold text-sm text-white group-hover:text-cosmic-amber transition-colors">{loc.name}</h4>
                    <p className="text-[11px] text-cosmic-muted mt-0.5">{loc.country}</p>
                    <p className="text-[10px] text-cosmic-muted/60 mt-1.5 line-clamp-2">{loc.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          /* ═══════════ COUNTRY DETAIL VIEW ═══════════ */
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {selectedCountry && (
              <div className="space-y-6">
                {/* Back Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-cosmic-muted hover:text-white mb-2"
                  onClick={() => { setView('grid'); setSelectedCountry(null); setSelectedState(null); setCities([]); setStates([]); }}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back to Explorer
                </Button>

                {/* Country Header */}
                <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-6">
                    <div className="text-5xl sm:text-6xl">{selectedCountry.emoji}</div>
                    <div className="flex-1">
                      <h2 className="text-2xl lg:text-3xl font-bold font-heading mb-1">{selectedCountry.name}</h2>
                      {selectedCountry.native && selectedCountry.native !== selectedCountry.name && (
                        <p className="text-cosmic-muted text-sm mb-3">{selectedCountry.native}</p>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-3 sm:mt-4">
                        <div className="flex items-center gap-2">
                          <Landmark className="w-4 h-4 text-cosmic-teal" />
                          <div>
                            <p className="text-xs text-cosmic-muted">Capital</p>
                            <p className="text-sm font-medium">{selectedCountry.capital || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-cosmic-violet" />
                          <div>
                            <p className="text-xs text-cosmic-muted">Region</p>
                            <p className="text-sm font-medium">{selectedCountry.region}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-cosmic-amber" />
                          <div>
                            <p className="text-xs text-cosmic-muted">Subregion</p>
                            <p className="text-sm font-medium">{selectedCountry.subregion || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">💰</span>
                          <div>
                            <p className="text-xs text-cosmic-muted">Currency</p>
                            <p className="text-sm font-medium truncate max-w-[100px] sm:max-w-[140px]">{selectedCountry.currency || '—'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                        <Badge variant="outline" className="border-cosmic-teal/20 text-cosmic-teal text-xs">
                          {selectedCountry.iso2} / {selectedCountry.iso3 || selectedCountry.iso2}
                        </Badge>
                        <Button size="sm" className="bg-cosmic-teal/10 text-cosmic-teal hover:bg-cosmic-teal/20 border border-cosmic-teal/20" variant="outline" onClick={() => handleSetLocation(selectedCountry.id.toString(), selectedCountry.name)}>
                          {settingLocation ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : locationSet ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Navigation className="w-3.5 h-3.5 mr-1.5" />}
                          {locationSet ? 'Location Set!' : 'Set as My Location'}
                        </Button>
                        <Button size="sm" className="bg-cosmic-accent/10 text-cosmic-accent hover:bg-cosmic-accent/20 border border-cosmic-accent/20" variant="outline" onClick={() => router.push(`/dashboard/cosmic-map?countryId=${selectedCountry.id}`)}>
                          <MapIcon className="w-3.5 h-3.5 mr-1.5" /> See on Cosmic Map
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* States / Regions List */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-cosmic-violet/10 flex items-center justify-center">
                      <Mountain className="w-4 h-4 text-cosmic-violet" />
                    </div>
                    <h3 className="text-lg font-bold font-heading">
                      States & Regions
                      {states.length > 0 && <span className="text-cosmic-muted text-sm font-normal ml-2">({states.length})</span>}
                    </h3>
                  </div>

                  {statesLoading ? (
                    <CosmicSpinner />
                  ) : states.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                      {states.map((state, i) => (
                        <motion.button
                          key={state.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02 }}
                          onClick={() => setSelectedState(state)}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                            selectedState?.id === state.id
                              ? 'glass-card-violet border-cosmic-violet/30'
                              : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-cosmic-violet/10 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-3.5 h-3.5 text-cosmic-violet" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{state.name}</p>
                            <p className="text-xs text-cosmic-muted">{state.state_code || state.country_code}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-cosmic-muted/40 flex-shrink-0" />
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="glass-card rounded-xl p-8 text-center">
                      <Mountain className="w-10 h-10 text-cosmic-muted/20 mx-auto mb-3" />
                      <p className="text-cosmic-muted text-sm">No states/regions data available</p>
                    </div>
                  )}
                </div>

                {/* Cities for Selected State */}
                <AnimatePresence>
                  {selectedState && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="glass-card-teal rounded-xl sm:rounded-2xl p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-cosmic-teal/10 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 text-cosmic-teal" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-base sm:text-lg font-bold font-heading">
                                Cities in {selectedState.name}
                                {cities.length > 0 && <span className="text-cosmic-muted text-xs sm:text-sm font-normal ml-1 sm:ml-2">({cities.length})</span>}
                              </h3>
                              <p className="text-xs text-cosmic-muted">{selectedState.state_code} · {selectedCountry.emoji} {selectedCountry.name}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-cosmic-muted hover:text-white"
                            onClick={() => { setSelectedState(null); setCities([]); setCitySearch(''); }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* City Search */}
                        <div className="relative mb-4">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cosmic-muted" />
                          <input
                            type="text"
                            placeholder="Search cities in this state..."
                            value={citySearch}
                            onChange={e => setCitySearch(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-cosmic-muted/50 outline-none focus:border-cosmic-teal/30 transition-colors"
                          />
                        </div>

                        {citiesLoading ? (
                          <CosmicSpinner />
                        ) : cities.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[360px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                            {cities.map((city, i) => (
                              <motion.div
                                key={city.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.01 }}
                                className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-cosmic-teal/15 transition-all group cursor-pointer"
                              >
                                <div className="w-7 h-7 rounded-lg bg-cosmic-teal/10 flex items-center justify-center flex-shrink-0">
                                  <Building2 className="w-3 h-3 text-cosmic-teal" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate group-hover:text-cosmic-teal transition-colors">{city.name}</p>
                                  <div className="flex items-center gap-2 text-[10px] text-cosmic-muted">
                                    <span>{city.latitude?.slice(0, 8)}, {city.longitude?.slice(0, 8)}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-cosmic-teal/10"
                                    title="Set as My Location"
                                    onClick={e => { e.stopPropagation(); handleSetCityLocation(city); }}
                                  >
                                    <Navigation className="w-3 h-3 text-cosmic-teal" />
                                  </button>
                                  <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-cosmic-accent/10"
                                    title="See on Cosmic Map"
                                    onClick={e => { e.stopPropagation(); router.push(`/dashboard/cosmic-map?lat=${city.latitude}&lng=${city.longitude}`); }}
                                  >
                                    <MapIcon className="w-3 h-3 text-cosmic-accent" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 text-center">
                            <Building2 className="w-10 h-10 text-cosmic-muted/20 mx-auto mb-3" />
                            <p className="text-cosmic-muted text-sm">No cities found{citySearch ? ` matching "${citySearch}"` : ''}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════ FOOTER STATS BAR ═══════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex flex-wrap items-center justify-center gap-2 sm:gap-6 text-xs text-cosmic-muted/40 pt-4"
      >
        <span>Data from countries-states-cities</span>
        <span className="hidden sm:inline">·</span>
        <span>Powered by CosmoGov</span>
        <span className="hidden sm:inline">·</span>
        <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Earth</span>
      </motion.div>
    </div>
  );
}
