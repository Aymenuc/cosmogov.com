'use client';

import L from 'leaflet';

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

/* ─── Constants ─── */

export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  proposal: '#2EE6C7',   // Teal
  process: '#2D6BFF',    // Blue
  assembly: '#9B5CFF',   // Purple
  initiative: '#FFB547', // Amber
  meeting: '#4ADE80',    // Green
  debate: '#FF6B9D',     // Pink
};

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  proposal: 'Proposal',
  process: 'Process',
  assembly: 'Assembly',
  initiative: 'Initiative',
  meeting: 'Meeting',
  debate: 'Debate',
};

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  proposal: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  process: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  assembly: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  initiative: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
  meeting: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  debate: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/></svg>`,
};

/* ─── Helper: Create Leaflet DivIcon ─── */

export function createMarkerIcon(type: ActivityType, size: number = 32): L.DivIcon {
  const color = ACTIVITY_COLORS[type];
  const iconSvg = ACTIVITY_ICONS[type];

  const html = `
    <div class="cosmic-marker" style="width:${size}px;height:${size}px;color:${color};">
      <div class="marker-glow" style="color:${color};"></div>
      <div class="marker-ring" style="color:${color};"></div>
      <div class="marker-icon" style="border-color:${color};color:${color};">
        ${iconSvg}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

export function createClusterIcon(count: number): L.DivIcon {
  const size = Math.max(36, Math.min(56, 36 + Math.log2(count) * 6));
  const html = `
    <div class="cosmic-cluster-marker" style="width:${size}px;height:${size}px;">
      <div class="cluster-ring"></div>
      ${count}
    </div>
  `;

  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/* ─── Popup HTML ─── */

export function createPopupContent(marker: MapMarkerData): string {
  const color = ACTIVITY_COLORS[marker.type];
  const label = ACTIVITY_LABELS[marker.type];
  const location = [marker.cityName, marker.countryName].filter(Boolean).join(', ') || 'Unknown';
  const timeAgo = getTimeAgo(marker.createdAt);

  const statusColors: Record<string, string> = {
    active: '#2EE6C7',
    open: '#2EE6C7',
    live: '#4ADE80',
    collecting: '#FFB547',
    voting: '#2D6BFF',
    scheduled: '#A7B3D6',
    closed: '#FF5E8A',
    draft: '#A7B3D6',
    information: '#2D6BFF',
    proposal: '#2EE6C7',
    deliberation: '#9B5CFF',
    implementation: '#4ADE80',
    evaluation: '#FFB547',
  };
  const statusColor = statusColors[marker.status] || '#A7B3D6';

  return `
    <div style="padding:14px 16px;min-width:230px;font-family:'Inter',system-ui,sans-serif;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:8px;background:${color}20;color:${color};font-size:11px;">
          ${ACTIVITY_ICONS[marker.type]}
        </span>
        <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:${color};">
          ${label}
        </span>
        <span style="margin-left:auto;display:inline-flex;align-items:center;gap:4px;font-size:10px;color:${statusColor};background:${statusColor}15;padding:2px 8px;border-radius:9999px;border:1px solid ${statusColor}25;">
          <span style="width:5px;height:5px;border-radius:50%;background:${statusColor};"></span>
          ${marker.status}
        </span>
      </div>
      <h3 style="font-size:14px;font-weight:600;color:#F2F5FF;margin:0 0 8px;line-height:1.3;font-family:'Space Grotesk',system-ui,sans-serif;">
        ${marker.title}
      </h3>
      <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#A7B3D6;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${location}
        </div>
        <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#A7B3D6;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${timeAgo}
        </div>
        <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#A7B3D6;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          ${marker.participantCount} participants
        </div>
      </div>
      <a href="${marker.url}" style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:${color};text-decoration:none;transition:opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1">
        View Details
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </a>
    </div>
  `;
}

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
  // At high zoom, show all individual markers
  if (zoom >= 8) {
    return { individual: markers, clusters: [] };
  }

  // Pixel distance threshold depends on zoom
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

      // Simple distance: approximate pixel distance using lat/lng difference scaled by zoom
      const dLat = (markers[j].latitude - markers[i].latitude) * Math.pow(2, zoom);
      const dLng = (markers[j].longitude - markers[i].longitude) * Math.pow(2, zoom) *
        Math.cos((markers[i].latitude * Math.PI) / 180);
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);

      if (dist < pixelThreshold) {
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
