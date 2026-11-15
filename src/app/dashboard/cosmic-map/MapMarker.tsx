'use client';

import L from 'leaflet';
import type { HomeId } from '@/lib/stickers';
import { homeSvg } from '@/components/stickers/home-svg';

/* ─── Types ─── */

export type ActivityType = 'proposal' | 'process' | 'assembly' | 'initiative' | 'meeting' | 'debate';

export interface MapMarkerData {
  id: string;
  type: ActivityType;
  title: string;
  status: string;
  category: string | null;
  latitude: number;
  longitude: number;
  countryName: string | null;
  cityName: string | null;
  participantCount: number;
  createdAt: string;
  url: string;
}

export interface MapBloom {
  id: string;
  name: string;
  cityName: string | null;
  latitude: number;
  longitude: number;
  tasksDone: number;
  missions: number;
}

/* ─── Palette (DESIGN.md topic tints: ink text on a light tint) ─── */

/** Ink colour per type: readable on white, used for icons, labels and edges. */
export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  proposal: '#5932c4',
  process: '#226784',
  assembly: '#28745b',
  initiative: '#a44231',
  meeting: '#7b570c',
  debate: '#a3324f',
};

/** Light tint per type: sticker fill. */
export const ACTIVITY_TINTS: Record<ActivityType, string> = {
  proposal: '#eee6ff',
  process: '#e1f3ff',
  assembly: '#dff5e8',
  initiative: '#ffe7df',
  meeting: '#fff0c3',
  debate: '#ffe3ea',
};

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  proposal: 'Proposal',
  process: 'Process',
  assembly: 'Assembly',
  initiative: 'Initiative',
  meeting: 'Meeting',
  debate: 'Debate',
};

const svg = (body: string, size = 16) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  proposal: svg('<path d="M3 11h3l9-5v12l-9-5H3z"/><path d="M6 13l1.5 6h2.5l-1-5"/><path d="M18.5 9a4 4 0 0 1 0 6"/>'),
  process: svg('<path d="M4 6h10"/><path d="M4 12h16"/><path d="M4 18h7"/><circle cx="17" cy="6" r="2.5"/><circle cx="14" cy="18" r="2.5"/>'),
  assembly: svg('<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0"/><path d="M10.5 20a5.5 5.5 0 0 1 11 0"/>'),
  initiative: svg('<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>'),
  meeting: svg('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>'),
  debate: svg('<path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4z"/><path d="M19 9h1a1 1 0 0 1 1 1v8l-3-2"/>'),
};

/** Escape text written by people before it goes into map HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─── Sticker pins ─── */

/** A sticker pin: tinted disc, ink edge and solid shadow, with a little tail. */
export function createMarkerIcon(type: ActivityType, animate = false, size = 38): L.DivIcon {
  const html = `
    <div class="map-pin${animate ? ' map-pop' : ''}" style="--pin-tint:${ACTIVITY_TINTS[type]};--pin-ink:${ACTIVITY_COLORS[type]};width:${size}px;height:${size}px;">
      ${ACTIVITY_ICONS[type]}
    </div>`;
  return L.divIcon({
    html,
    className: 'map-pin-host',
    iconSize: [size, size + 10],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -size - 4],
  });
}

export function createClusterIcon(count: number, animate = false): L.DivIcon {
  const size = Math.round(Math.max(40, Math.min(64, 38 + Math.log2(count) * 7)));
  const html = `
    <div class="map-cluster${animate ? ' map-pop' : ''}" style="width:${size}px;height:${size}px;">
      <span>${count}</span>
    </div>`;
  return L.divIcon({
    html,
    className: 'map-pin-host',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/* ─── Your home ─── */

export function createHomeIcon(homeId: HomeId, cityName: string | null): L.DivIcon {
  const label = cityName ? `Home · ${escapeHtml(cityName)}` : 'Home';
  const html = `
    <div class="map-home map-pop" title="${label}">
      ${homeSvg(homeId, 76)}
    </div>`;
  return L.divIcon({
    html,
    className: 'map-pin-host',
    iconSize: [120, 100],
    iconAnchor: [60, 78],
    popupAnchor: [0, -70],
  });
}

/** The home's name tag, drawn as its own marker on top so pins can't hide it. */
export function createHomeLabelIcon(cityName: string | null): L.DivIcon {
  const label = cityName ? `Home · ${escapeHtml(cityName)}` : 'Home';
  return L.divIcon({
    html: `<span class="map-home-label">${label}</span>`,
    className: 'map-pin-host map-home-label-host',
    iconSize: [140, 24],
    iconAnchor: [70, -2],
  });
}

/* ─── Garden blooms: one flower per community, bigger as more gets done ─── */

const PETALS = ['#FF785F', '#FFCF4D', '#6741D9', '#FF785F', '#FFCF4D'];

export function createBloomIcon(tasksDone: number, animate = false): L.DivIcon {
  const size = Math.round(Math.max(34, Math.min(62, 30 + Math.sqrt(tasksDone) * 7)));
  const petal = PETALS[tasksDone % PETALS.length];
  const centre = petal === '#FFCF4D' ? '#FF785F' : '#FFCF4D';
  const petals = [0, 72, 144, 216, 288]
    .map((a) => {
      const x = (24 + 9 * Math.sin((a * Math.PI) / 180)).toFixed(1);
      const y = (20 - 9 * Math.cos((a * Math.PI) / 180)).toFixed(1);
      return `<circle cx="${x}" cy="${y}" r="7" fill="${petal}" stroke="#29223d" stroke-width="2"/>`;
    })
    .join('');
  const html = `
    <div class="map-bloom${animate ? ' map-pop' : ''}" style="width:${size}px;height:${size}px;">
      <svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true">
        <path d="M24 46V28" stroke="#28745B" stroke-width="4" stroke-linecap="round"/>
        <path d="M24 38c-8 0-10-7-10-7 8-1 10 7 10 7Z" fill="#28745B"/>
        ${petals}
        <circle cx="24" cy="20" r="6" fill="${centre}" stroke="#29223d" stroke-width="2"/>
      </svg>
      ${tasksDone > 0 ? `<span class="map-bloom-count">${tasksDone}</span>` : ''}
    </div>`;
  return L.divIcon({
    html,
    className: 'map-pin-host',
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 2],
    popupAnchor: [0, -size + 6],
  });
}

export function createBloomPopup(bloom: MapBloom): string {
  const where = bloom.cityName ? ` in ${escapeHtml(bloom.cityName)}` : '';
  const done =
    bloom.tasksDone === 0
      ? 'No tasks finished yet. The first one plants a flower here.'
      : `${bloom.tasksDone} ${bloom.tasksDone === 1 ? 'task' : 'tasks'} finished across ${bloom.missions} ${bloom.missions === 1 ? 'mission' : 'missions'}. Each one is a flower in the shared garden.`;
  return `
    <div class="map-card">
      <span class="map-card-type" style="--pin-tint:#dff5e8;--pin-ink:#28745b;">🌼 Garden</span>
      <h3>${escapeHtml(bloom.name)}${where}</h3>
      <p class="map-card-meta">${done}</p>
      <a class="map-card-link" href="/dashboard/missions">Help it grow →</a>
    </div>`;
}

/* ─── Popup ─── */

export function createPopupContent(marker: MapMarkerData): string {
  const label = ACTIVITY_LABELS[marker.type];
  const location = [marker.cityName, marker.countryName].filter(Boolean).join(', ') || 'Somewhere on the map';
  const people =
    marker.participantCount > 0
      ? `${marker.participantCount} taking part`
      : 'Be the first to join in';
  return `
    <div class="map-card">
      <div class="map-card-top">
        <span class="map-card-type" style="--pin-tint:${ACTIVITY_TINTS[marker.type]};--pin-ink:${ACTIVITY_COLORS[marker.type]};">
          ${ACTIVITY_ICONS[marker.type]} ${label}
        </span>
        <span class="map-card-status">${escapeHtml(marker.status.replace(/_/g, ' '))}</span>
      </div>
      <h3>${escapeHtml(marker.title)}</h3>
      <p class="map-card-meta">
        ${escapeHtml(location)} · ${getTimeAgo(marker.createdAt)}<br>
        ${people}
      </p>
      <a class="map-card-link" href="${escapeHtml(marker.url)}">Have a look →</a>
    </div>`;
}

/* ─── Utility ─── */

export function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  return `${Math.floor(months / 12)} y ago`;
}

/** Great-circle distance in km. */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ─── Simple Clustering ─── */

export interface ClusterGroup {
  markers: MapMarkerData[];
  centerLat: number;
  centerLng: number;
  count: number;
}

export function clusterMarkers(
  markers: MapMarkerData[],
  zoom: number
): { individual: MapMarkerData[]; clusters: ClusterGroup[] } {
  if (zoom >= 8) {
    return { individual: markers, clusters: [] };
  }
  const pixelThreshold = zoom >= 5 ? 40 : 60;
  const used = new Set<number>();
  const clusters: ClusterGroup[] = [];
  const individual: MapMarkerData[] = [];

  for (let i = 0; i < markers.length; i++) {
    if (used.has(i)) continue;
    const group: MapMarkerData[] = [markers[i]];
    used.add(i);
    for (let j = i + 1; j < markers.length; j++) {
      if (used.has(j)) continue;
      const dLat = (markers[j].latitude - markers[i].latitude) * Math.pow(2, zoom);
      const dLng = (markers[j].longitude - markers[i].longitude) * Math.pow(2, zoom) *
        Math.cos((markers[i].latitude * Math.PI) / 180);
      if (Math.sqrt(dLat * dLat + dLng * dLng) < pixelThreshold) {
        group.push(markers[j]);
        used.add(j);
      }
    }
    if (group.length === 1) {
      individual.push(group[0]);
    } else {
      const centerLat = group.reduce((s, m) => s + m.latitude, 0) / group.length;
      const centerLng = group.reduce((s, m) => s + m.longitude, 0) / group.length;
      clusters.push({ markers: group, centerLat, centerLng, count: group.length });
    }
  }
  return { individual, clusters };
}
