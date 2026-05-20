// src/components/ZoneMap.jsx
// SVG-based map of Tamale distribution zones
import { useState } from 'react';

const ZONE_PATHS = [
  {
    id: 'lamashegu',
    name: 'Lamashegu',
    path: 'M 160 90 L 210 85 L 225 110 L 215 135 L 175 140 L 155 120 Z',
    labelX: 185, labelY: 114,
  },
  {
    id: 'choggu',
    name: 'Choggu',
    path: 'M 120 135 L 160 125 L 175 140 L 165 165 L 130 170 L 110 155 Z',
    labelX: 143, labelY: 150,
  },
  {
    id: 'savelugu-rd',
    name: 'Savelugu Rd',
    path: 'M 215 80 L 265 75 L 270 105 L 255 125 L 215 115 L 210 85 Z',
    labelX: 240, labelY: 98,
  },
  {
    id: 'nyanshegu',
    name: 'Nyanshegu',
    path: 'M 120 170 L 165 165 L 175 195 L 150 215 L 115 205 L 108 185 Z',
    labelX: 142, labelY: 192,
  },
  {
    id: 'kalpohin',
    name: 'Kalpohin',
    path: 'M 175 195 L 220 185 L 235 210 L 220 235 L 175 230 L 165 210 Z',
    labelX: 200, labelY: 213,
  },
  {
    id: 'sagnarigu',
    name: 'Sagnarigu',
    path: 'M 130 215 L 175 230 L 165 260 L 125 265 L 105 245 L 112 220 Z',
    labelX: 140, labelY: 242,
  },
  {
    id: 'bilpela',
    name: "Bilp'ela",
    path: 'M 255 125 L 295 120 L 305 148 L 280 162 L 255 150 L 250 130 Z',
    labelX: 278, labelY: 143,
  },
  {
    id: 'tamale-south',
    name: 'Tamale South',
    path: 'M 175 230 L 220 235 L 225 265 L 190 280 L 155 268 L 158 245 Z',
    labelX: 190, labelY: 256,
  },
];

export default function ZoneMap({ zones = [], onZoneClick }) {
  const [hovered, setHovered] = useState(null);

  function getZoneStatus(slug) {
    return zones.find(z => z.slug === slug)?.status || 'closed';
  }

  function getColor(slug) {
    const status = getZoneStatus(slug);
    if (status === 'open') return '#10b981';
    if (status === 'maintenance') return '#f59e0b';
    return '#64748b';
  }

  function getFillOpacity(slug) {
    return hovered === slug ? 0.85 : 0.6;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <span>Tamale Distribution Zones</span>
        <span className="ml-auto flex items-center gap-3 text-xs font-normal text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/>Open</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"/>Maintenance</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"/>Closed</span>
        </span>
      </h3>
      <svg
        viewBox="70 60 270 240"
        className="w-full max-h-72"
        style={{ fontFamily: 'inherit' }}
      >
        {/* Background */}
        <rect x="70" y="60" width="270" height="240" fill="#f8fafc" rx="8" />

        {/* Road lines (decorative) */}
        <line x1="185" y1="65" x2="185" y2="290" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 4" />
        <line x1="75" y1="175" x2="335" y2="175" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 4" />

        {/* Zone shapes */}
        {ZONE_PATHS.map(z => (
          <g key={z.id}>
            <path
              d={z.path}
              fill={getColor(z.id)}
              fillOpacity={getFillOpacity(z.id)}
              stroke="white"
              strokeWidth="2"
              style={{ cursor: 'pointer', transition: 'fill-opacity 0.2s' }}
              onMouseEnter={() => setHovered(z.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onZoneClick && onZoneClick(z.id)}
            />
            <text
              x={z.labelX}
              y={z.labelY}
              textAnchor="middle"
              fill="white"
              fontSize="6.5"
              fontWeight="600"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {z.name.split(' ').map((word, i) => (
                <tspan key={i} x={z.labelX} dy={i === 0 ? 0 : 8}>{word}</tspan>
              ))}
            </text>
            {/* Animated dot for open zones */}
            {getZoneStatus(z.id) === 'open' && (
              <circle cx={z.labelX + 14} cy={z.labelY - 8} r="3" fill="white" opacity="0.9">
                <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        ))}

        {/* Tooltip */}
        {hovered && (
          <g>
            <rect x="80" y="68" width="110" height="22" rx="5" fill="#1e293b" opacity="0.92" />
            <text x="135" y="82" textAnchor="middle" fill="white" fontSize="8" fontWeight="600">
              {ZONE_PATHS.find(z => z.id === hovered)?.name} — {getZoneStatus(hovered).toUpperCase()}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
