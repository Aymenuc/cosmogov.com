'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, X, Loader2, Crosshair, ArrowUpRight, Home as HomeIcon, Flag } from 'lucide-react';
import HomeArt from '@/components/stickers/HomeArt';
import StickerNudge from '@/components/stickers/StickerNudge';
import type { StickerHome } from '@/components/stickers/StickerBook';
import type { HomeLevel } from '@/lib/stickers';
import {
  MapMarkerData,
  ActivityType,
  ACTIVITY_COLORS,
  ACTIVITY_TINTS,
  ACTIVITY_LABELS,
  ACTIVITY_ICONS,
  getTimeAgo,
  distanceKm,
} from './MapMarker';

/* ─── Types ─── */

export interface CityResult {
  id: number;
  name: string;
  state_id: number;
  country_id: number;
  latitude: string;
  longitude: string;
  countryName: string;
  countryEmoji: string;
  stateName: string;
}

interface MapSidebarProps {
  markers: MapMarkerData[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onSearchSelect: (lat: number, lng: number) => void;
  onLocate: () => void;
  loading: boolean;
  home: StickerHome | null;
  homeLevel: { current: HomeLevel; next: HomeLevel | null; toNext: number };
  onPlantHome: (city: CityResult) => Promise<boolean>;
  onGoHome: () => void;
}

const filterTabs: { key: string; label: string; type: ActivityType | null }[] = [
  { key: 'all', label: 'Everything', type: null },
  { key: 'proposals', label: 'Proposals', type: 'proposal' },
  { key: 'processes', label: 'Processes', type: 'process' },
  { key: 'assemblies', label: 'Assemblies', type: 'assembly' },
  { key: 'initiatives', label: 'Initiatives', type: 'initiative' },
  { key: 'meetings', label: 'Meetings', type: 'meeting' },
  { key: 'debates', label: 'Debates', type: 'debate' },
];

const typeMap: Record<string, ActivityType> = {
  proposals: 'proposal',
  processes: 'process',
  assemblies: 'assembly',
  initiatives: 'initiative',
  meetings: 'meeting',
  debates: 'debate',
};

function TypeIcon({ type }: { type: ActivityType }) {
  return (
    <span
      className="map-type-icon"
      style={{ ['--pin-tint' as string]: ACTIVITY_TINTS[type], ['--pin-ink' as string]: ACTIVITY_COLORS[type] }}
      dangerouslySetInnerHTML={{ __html: ACTIVITY_ICONS[type] }}
    />
  );
}

function ActivityCard({ marker, distance }: { marker: MapMarkerData; distance?: number }) {
  const where = [marker.cityName, marker.countryName].filter(Boolean).join(', ') || 'Somewhere on the map';
  return (
    <Link href={marker.url} className="map-activity">
      <TypeIcon type={marker.type} />
      <span className="map-activity-text">
        <small style={{ color: ACTIVITY_COLORS[marker.type] }}>
          {ACTIVITY_LABELS[marker.type]} · {marker.status.replace(/_/g, ' ')}
        </small>
        <strong>{marker.title}</strong>
        <span>
          {distance !== undefined ? `${distance < 1 ? 'under 1' : Math.round(distance)} km from home` : where} ·{' '}
          {getTimeAgo(marker.createdAt)} ·{' '}
          {marker.participantCount > 0 ? `${marker.participantCount} taking part` : 'be the first'}
        </span>
      </span>
      <ArrowUpRight size={15} />
    </Link>
  );
}

/* ─── Component ─── */

export default function MapSidebar({
  markers,
  activeFilter,
  onFilterChange,
  onSearchSelect,
  onLocate,
  loading,
  home,
  homeLevel,
  onPlantHome,
  onGoHome,
}: MapSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState<CityResult[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [planting, setPlanting] = useState<number | null>(null);
  const [plantError, setPlantError] = useState('');
  const [movingHome, setMovingHome] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plantMode = !home || movingHome;

  const handleSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setCities(null);
      return;
    }
    setSearchLoading(true);
    debounceRef.current = setTimeout(() => {
      fetch(`/api/geo/search?q=${encodeURIComponent(q.trim())}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setCities(data ? (data.cities || []).slice(0, 8) : []))
        .catch(() => setCities([]))
        .finally(() => setSearchLoading(false));
    }, 300);
  }, []);

  const clearSearch = () => {
    setSearchQuery('');
    setCities(null);
  };

  const plant = async (city: CityResult) => {
    setPlantError('');
    setPlanting(city.id);
    const ok = await onPlantHome(city);
    setPlanting(null);
    if (ok) {
      clearSearch();
      setMovingHome(false);
    } else {
      setPlantError('That didn’t save. Please try again.');
    }
  };

  const filtered =
    activeFilter === 'all' ? markers : markers.filter((m) => m.type === typeMap[activeFilter]);

  const nearYou = home
    ? markers
        .map((m) => ({ marker: m, distance: distanceKm(home.latitude, home.longitude, m.latitude, m.longitude) }))
        .filter((x) => x.distance <= 100)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3)
    : [];

  return (
    <div className="map-side">
      {/* ─── Your home / plant your flag ─── */}
      {home && !movingHome ? (
        <section className="map-home-card">
          <HomeArt id={homeLevel.current.id} size={78} />
          <div>
            <p className="map-eyebrow">
              <HomeIcon size={13} /> Your home{home.cityName ? ` in ${home.cityName}` : ''}
            </p>
            <h2>{homeLevel.current.name}</h2>
            <p>
              {homeLevel.next
                ? `${homeLevel.toNext} more ${homeLevel.toNext === 1 ? 'sticker' : 'stickers'} and it becomes a ${homeLevel.next.name.toLowerCase()}.`
                : 'The top of the street. You light the way.'}
            </p>
            <div className="map-home-actions">
              <button onClick={onGoHome}>Go home</button>
              <button onClick={() => setMovingHome(true)}>Move</button>
              <Link href="/dashboard/stickers">Sticker book</Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="map-plant-card">
          <div className="map-plant-top">
            <HomeArt id="tent" size={70} />
            <div>
              <p className="map-eyebrow">
                <Flag size={13} /> {movingHome ? 'Moving house' : 'Plant your flag'}
              </p>
              <h2>{movingHome ? 'Where’s home now?' : 'Where’s home?'}</h2>
              <p>
                Pick your city and a little tent goes up. It grows into a house, a tower, a lighthouse as you
                help out. Only you see it, and only at city level.
              </p>
            </div>
          </div>
          {movingHome && (
            <button className="map-link-button" onClick={() => setMovingHome(false)}>
              Keep my home where it is
            </button>
          )}
        </section>
      )}

      {/* ─── Search ─── */}
      <div className="map-search">
        <Search size={16} aria-hidden="true" />
        <input
          type="text"
          aria-label={plantMode ? 'Find your city' : 'Search the map for a city'}
          placeholder={plantMode ? 'Type your city…' : 'Look around: search a city…'}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            handleSearch(e.target.value);
          }}
        />
        {searchLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : searchQuery ? (
          <button onClick={clearSearch} aria-label="Clear search">
            <X size={15} />
          </button>
        ) : null}
      </div>
      {cities && (
        <ul className="map-results">
          {cities.length === 0 && <li className="map-results-empty">No city by that name. Try another spelling.</li>}
          {cities.map((c) => {
            const lat = parseFloat(c.latitude);
            const lng = parseFloat(c.longitude);
            return (
              <li key={c.id}>
                <button
                  className="map-result-go"
                  onClick={() => {
                    if (!isNaN(lat) && !isNaN(lng)) onSearchSelect(lat, lng);
                  }}
                >
                  <span aria-hidden="true">{c.countryEmoji}</span>
                  <span>
                    <strong>{c.name}</strong>
                    <small>{[c.stateName, c.countryName].filter(Boolean).join(', ')}</small>
                  </span>
                </button>
                {plantMode && (
                  <button className="map-result-plant" onClick={() => plant(c)} disabled={planting !== null}>
                    {planting === c.id ? 'Planting…' : 'This is home'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {plantError && (
        <p className="form-error" role="alert">
          {plantError}
        </p>
      )}

      <button className="map-locate" onClick={onLocate}>
        <Crosshair size={15} /> Show where I am right now
      </button>

      <StickerNudge ids={['on-the-map', 'local-spark', 'conversation-starter', 'good-neighbor']} />

      {/* ─── Near you ─── */}
      {home && nearYou.length > 0 && (
        <section className="map-near">
          <h3>Near you</h3>
          {nearYou.map(({ marker, distance }) => (
            <ActivityCard key={`near-${marker.type}-${marker.id}`} marker={marker} distance={distance} />
          ))}
        </section>
      )}

      {/* ─── Filters ─── */}
      <div className="map-filters" role="group" aria-label="Show on the map">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            className={activeFilter === tab.key ? 'active' : ''}
            aria-pressed={activeFilter === tab.key}
            onClick={() => onFilterChange(tab.key)}
          >
            {tab.type && <TypeIcon type={tab.type} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── In view ─── */}
      <div className="map-list">
        {loading ? (
          <p className="map-list-loading">
            <Loader2 size={16} className="animate-spin" /> Looking around…
          </p>
        ) : filtered.length === 0 ? (
          <div className="map-empty">
            <svg viewBox="0 0 120 90" width="120" height="90" aria-hidden="true">
              <ellipse cx="60" cy="80" rx="44" ry="7" fill="#B8E9CC" stroke="#29223d" strokeWidth="3" />
              <path d="M60 18c-13 0-22 9-22 21 0 16 22 37 22 37s22-21 22-37c0-12-9-21-22-21Z" fill="#FF785F" stroke="#29223d" strokeWidth="3" strokeLinejoin="round" />
              <circle cx="60" cy="39" r="8" fill="#FFFDF7" stroke="#29223d" strokeWidth="3" />
              <path d="M92 16l3 7 7 3-7 3-3 7-3-7-7-3 7-3ZM22 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#FFCF4D" stroke="#29223d" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <h3>
              {home?.cityName ? `No sparks around ${home.cityName} yet.` : 'Nothing on the map here yet.'}
            </h3>
            <p>Be the first. Whatever you start shows up here for your neighbors, and earns you a sticker.</p>
            <div className="map-empty-actions">
              <Link className="civic-button" href="/dashboard/missions">
                Start a mission
              </Link>
              <Link className="civic-button outline" href="/dashboard/proposals/new">
                Open a proposal
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h3 className="map-list-title">
              On the map here <span>{filtered.length}</span>
            </h3>
            {filtered.slice(0, 50).map((marker) => (
              <ActivityCard key={`${marker.type}-${marker.id}`} marker={marker} />
            ))}
            {filtered.length > 50 && <p className="map-list-more">Showing 50 of {filtered.length}. Zoom in to see more.</p>}
          </>
        )}
      </div>
    </div>
  );
}
