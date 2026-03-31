'use client';

import { useMemo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import { motion, AnimatePresence } from 'framer-motion';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Map country/location names (Arabic) to approximate lat/lng
const LOCATION_COORDS: Record<string, [number, number]> = {
  'السعودية': [45.08, 23.88],
  'الرياض': [46.72, 24.71],
  'جدة': [39.17, 21.49],
  'مصر': [31.24, 30.04],
  'القاهرة': [31.24, 30.04],
  'الأردن': [35.93, 31.96],
  'عمّان': [35.93, 31.96],
  'الإمارات': [54.37, 24.45],
  'دبي': [55.27, 25.20],
  'أبوظبي': [54.37, 24.45],
  'الكويت': [47.98, 29.37],
  'البحرين': [50.55, 26.07],
  'قطر': [51.53, 25.29],
  'العراق': [44.37, 33.31],
  'سوريا': [36.29, 33.51],
  'لبنان': [35.50, 33.89],
  'فلسطين': [35.23, 31.95],
  'اليمن': [44.21, 15.35],
  'ليبيا': [13.18, 32.90],
  'تونس': [10.17, 36.81],
  'الجزائر': [3.06, 36.75],
  'المغرب': [-6.84, 33.97],
  'السودان': [32.53, 15.59],
  'باكستان': [73.04, 33.69],
  'الهند': [77.21, 28.61],
  'بريطانيا': [-0.12, 51.51],
  'أمريكا': [-77.04, 38.91],
  'كندا': [-75.69, 45.42],
  'تركيا': [32.86, 39.93],
  'ألمانيا': [13.40, 52.52],
  'فرنسا': [2.35, 48.86],
  'عن بعد': [45.08, 23.88], // Default to Saudi
};

interface WorldMapProps {
  locationData: Record<string, number>;
  nationalityData: Record<string, number>;
}

export default function WorldMap({ locationData, nationalityData }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<{ name: string; count: number; x: number; y: number } | null>(null);

  // Merge location and nationality data for markers
  const markers = useMemo(() => {
    const combined: Record<string, number> = {};
    for (const [key, val] of Object.entries(locationData)) {
      combined[key] = (combined[key] || 0) + val;
    }
    for (const [key, val] of Object.entries(nationalityData)) {
      if (!combined[key]) combined[key] = val;
    }

    return Object.entries(combined)
      .filter(([name]) => LOCATION_COORDS[name])
      .map(([name, count]) => ({
        name,
        count,
        coordinates: LOCATION_COORDS[name] as [number, number],
      }))
      .sort((a, b) => b.count - a.count);
  }, [locationData, nationalityData]);

  const maxCount = Math.max(...markers.map(m => m.count), 1);

  return (
    <div className="relative w-full" style={{ aspectRatio: '2/1' }}>
      <ComposableMap
        projectionConfig={{ rotate: [-40, 0, 0], scale: 160 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup center={[40, 25]} zoom={1.5}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#EFEDE2"
                  stroke="#D1C4E2"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { fill: '#D1EDEF', outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {markers.map((marker) => {
            const size = Math.max(6, Math.min(24, (marker.count / maxCount) * 24));
            return (
              <Marker
                key={marker.name}
                coordinates={marker.coordinates}
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect();
                  if (rect) {
                    setTooltip({
                      name: marker.name,
                      count: marker.count,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                <circle
                  r={size / 2}
                  fill="#00C17A"
                  fillOpacity={0.6}
                  stroke="#00C17A"
                  strokeWidth={1.5}
                  className="cursor-pointer"
                />
                <circle
                  r={size / 2}
                  fill="transparent"
                  className="cursor-pointer"
                >
                  <animate
                    attributeName="r"
                    from={size / 2}
                    to={size / 2 + 4}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.4"
                    to="0"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
                {marker.count > maxCount * 0.3 && (
                  <text
                    textAnchor="middle"
                    y={-size / 2 - 4}
                    style={{ fontFamily: 'Thmanyah Sans', fontSize: 9, fontWeight: 900, fill: '#2B2D3F' }}
                  >
                    {marker.name}
                  </text>
                )}
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute pointer-events-none bg-brand-black text-white px-3 py-2 rounded-lg shadow-lg z-10"
            style={{ left: tooltip.x + 10, top: tooltip.y - 40 }}
          >
            <p className="font-ui font-black text-[13px]">{tooltip.name}</p>
            <p className="font-ui font-bold text-[11px] text-brand-green">{tooltip.count} موظف</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex flex-wrap gap-2">
        {markers.slice(0, 6).map((m) => (
          <span key={m.name} className="font-ui font-black text-[11px] bg-white/80 backdrop-blur px-2 py-1 rounded text-brand-black">
            {m.name}: <span className="text-brand-green">{m.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
