'use client';

import { useMemo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { motion, AnimatePresence } from 'framer-motion';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Map Arabic nationality names → ISO country names used in world-atlas
const ARABIC_TO_ISO: Record<string, string> = {
  'السعودية': 'Saudi Arabia', 'سعودي': 'Saudi Arabia', 'سعودية': 'Saudi Arabia',
  'مصر': 'Egypt', 'مصري': 'Egypt', 'مصرية': 'Egypt',
  'الأردن': 'Jordan', 'أردني': 'Jordan', 'أردنية': 'Jordan',
  'الإمارات': 'United Arab Emirates', 'إماراتي': 'United Arab Emirates',
  'الكويت': 'Kuwait', 'كويتي': 'Kuwait',
  'البحرين': 'Bahrain', 'بحريني': 'Bahrain',
  'قطر': 'Qatar', 'قطري': 'Qatar',
  'العراق': 'Iraq', 'عراقي': 'Iraq',
  'سوريا': 'Syria', 'سوري': 'Syria', 'سورية': 'Syria',
  'لبنان': 'Lebanon', 'لبناني': 'Lebanon', 'لبنانية': 'Lebanon',
  'فلسطين': 'Palestine', 'فلسطيني': 'Palestine',
  'اليمن': 'Yemen', 'يمني': 'Yemen',
  'ليبيا': 'Libya', 'ليبي': 'Libya',
  'تونس': 'Tunisia', 'تونسي': 'Tunisia',
  'الجزائر': 'Algeria', 'جزائري': 'Algeria',
  'المغرب': 'Morocco', 'مغربي': 'Morocco',
  'السودان': 'Sudan', 'سوداني': 'Sudan',
  'باكستان': 'Pakistan', 'باكستاني': 'Pakistan',
  'الهند': 'India', 'هندي': 'India',
  'بريطانيا': 'United Kingdom', 'بريطاني': 'United Kingdom',
  'أمريكا': 'United States of America', 'أمريكي': 'United States of America',
  'كندا': 'Canada', 'كندي': 'Canada',
  'تركيا': 'Turkey', 'تركي': 'Turkey', 'Türkiye': 'Turkey',
  'ألمانيا': 'Germany', 'ألماني': 'Germany',
  'فرنسا': 'France', 'فرنسي': 'France',
  'إريتريا': 'Eritrea', 'إريتري': 'Eritrea',
  'إثيوبيا': 'Ethiopia', 'إثيوبي': 'Ethiopia',
  'نيجيريا': 'Nigeria', 'نيجيري': 'Nigeria',
  'الفلبين': 'Philippines', 'فلبيني': 'Philippines',
  'بنغلاديش': 'Bangladesh', 'بنغلاديشي': 'Bangladesh',
  'إندونيسيا': 'Indonesia', 'إندونيسي': 'Indonesia',
  'ماليزيا': 'Malaysia',
  'عمان': 'Oman', 'عُمان': 'Oman', 'عماني': 'Oman',
  'موريتانيا': 'Mauritania', 'موريتاني': 'Mauritania',
  'الصومال': 'Somalia', 'صومالي': 'Somalia',
};

// Map Arabic city names → country (for drill-down)
const CITY_TO_COUNTRY: Record<string, string> = {
  'الرياض': 'Saudi Arabia', 'جدة': 'Saudi Arabia', 'الدمام': 'Saudi Arabia',
  'مكة': 'Saudi Arabia', 'المدينة': 'Saudi Arabia', 'الخبر': 'Saudi Arabia',
  'القاهرة': 'Egypt', 'الإسكندرية': 'Egypt',
  'عمّان': 'Jordan', 'دبي': 'United Arab Emirates', 'أبوظبي': 'United Arab Emirates',
  'عن بعد': '__remote__',
};

function heatColor(ratio: number): string {
  // 0 → #EFEDE2 (neutral), 1 → #00C17A (green)
  if (ratio <= 0) return '#EFEDE2';
  if (ratio < 0.15) return '#D1EDEF';
  if (ratio < 0.3) return '#AFE2EA';
  if (ratio < 0.5) return '#84DBE5';
  if (ratio < 0.7) return '#B2E2BA';
  return '#00C17A';
}

interface EmployeeBasic {
  nationality: string;
  currentLocation: string;
  department: string;
}

interface WorldMapProps {
  locationData: Record<string, number>;
  nationalityData: Record<string, number>;
  employees?: EmployeeBasic[];
}

export default function WorldMap({ locationData, nationalityData, employees = [] }: WorldMapProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hoveredGeo, setHoveredGeo] = useState<string | null>(null);

  // Resolve all Arabic keys → ISO country name and aggregate
  const countryTotals = useMemo(() => {
    const totals: Record<string, { count: number; arabicName: string }> = {};

    const addData = (source: Record<string, number>) => {
      for (const [arabicKey, count] of Object.entries(source)) {
        // Try direct mapping
        let isoName = ARABIC_TO_ISO[arabicKey];
        // Try city mapping
        if (!isoName && CITY_TO_COUNTRY[arabicKey]) {
          const mapped = CITY_TO_COUNTRY[arabicKey];
          if (mapped === '__remote__') continue; // skip remote workers for map
          isoName = mapped;
        }
        if (!isoName) continue;
        if (!totals[isoName]) totals[isoName] = { count: 0, arabicName: arabicKey };
        totals[isoName].count += count;
      }
    };

    addData(nationalityData);
    addData(locationData);
    return totals;
  }, [locationData, nationalityData]);

  const maxCount = useMemo(() => Math.max(...Object.values(countryTotals).map(c => c.count), 1), [countryTotals]);

  // Build city + department breakdown for a selected country
  const cityBreakdown = useMemo(() => {
    if (!selectedCountry) return [];
    const cities: { name: string; count: number }[] = [];
    for (const [key, count] of Object.entries(locationData)) {
      const iso = CITY_TO_COUNTRY[key];
      if (iso === selectedCountry) {
        cities.push({ name: key, count });
      }
      const countryIso = ARABIC_TO_ISO[key];
      if (countryIso === selectedCountry && !CITY_TO_COUNTRY[key]) {
        cities.push({ name: key, count });
      }
    }
    for (const [key, count] of Object.entries(nationalityData)) {
      const countryIso = ARABIC_TO_ISO[key];
      if (countryIso === selectedCountry) {
        if (!cities.find(c => c.name === key)) {
          cities.push({ name: `${key} (جنسية)`, count });
        }
      }
    }
    return cities.sort((a, b) => b.count - a.count);
  }, [selectedCountry, locationData, nationalityData]);

  // Department breakdown for selected country
  const deptBreakdown = useMemo(() => {
    if (!selectedCountry || employees.length === 0) return [];
    const depts: Record<string, number> = {};
    for (const emp of employees) {
      // Match by nationality or location
      const natIso = ARABIC_TO_ISO[emp.nationality];
      const locIso = ARABIC_TO_ISO[emp.currentLocation] || CITY_TO_COUNTRY[emp.currentLocation];
      if (natIso === selectedCountry || locIso === selectedCountry) {
        if (emp.department) depts[emp.department] = (depts[emp.department] || 0) + 1;
      }
    }
    return Object.entries(depts).sort(([, a], [, b]) => b - a).map(([name, count]) => ({ name, count }));
  }, [selectedCountry, employees]);

  const remoteCount = locationData['عن بعد'] || 0;

  return (
    <div className="relative">
      {/* Map */}
      <div className="w-full rounded-xl overflow-hidden bg-neutral-cream" style={{ aspectRatio: '2.2/1' }}>
        <ComposableMap
          projectionConfig={{ rotate: [-40, 0, 0], scale: 170 }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup center={[40, 25]} zoom={1.8} minZoom={1} maxZoom={5}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoName = geo.properties.name;
                  const data = countryTotals[geoName];
                  const isHovered = hoveredGeo === geoName;
                  const isSelected = selectedCountry === geoName;
                  const ratio = data ? data.count / maxCount : 0;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={
                        isSelected ? '#00C17A'
                        : isHovered && data ? '#84DBE5'
                        : data ? heatColor(ratio)
                        : '#F4F2ED'
                      }
                      stroke={isSelected ? '#00C17A' : data ? '#B2E2BA' : '#E5E2D8'}
                      strokeWidth={isSelected ? 1.5 : 0.5}
                      style={{
                        default: { outline: 'none', transition: 'fill 0.3s ease' },
                        hover: { outline: 'none', cursor: data ? 'pointer' : 'default' },
                        pressed: { outline: 'none' },
                      }}
                      onMouseEnter={() => setHoveredGeo(geoName)}
                      onMouseLeave={() => setHoveredGeo(null)}
                      onClick={() => {
                        if (data) setSelectedCountry(isSelected ? null : geoName);
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredGeo && countryTotals[hoveredGeo] && !selectedCountry && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute top-4 left-4 bg-brand-black text-white px-4 py-3 rounded-xl shadow-lg z-10"
          >
            <p className="font-ui font-black text-[14px]">{countryTotals[hoveredGeo].arabicName}</p>
            <p className="font-display font-black text-[22px] text-brand-green leading-none">{countryTotals[hoveredGeo].count}</p>
            <p className="font-ui font-bold text-[11px] text-white/50">اضغط لعرض التفاصيل</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Country drill-down panel */}
      <AnimatePresence>
        {selectedCountry && countryTotals[selectedCountry] && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-5 z-10 min-w-[220px] border border-neutral-warm-gray"
          >
            <button
              onClick={() => setSelectedCountry(null)}
              className="font-ui font-black text-[12px] text-brand-blue hover:underline mb-2 block"
            >
              ← العودة للخريطة
            </button>
            <h3 className="font-display font-black text-[20px] mb-1">
              {countryTotals[selectedCountry].arabicName}
            </h3>
            <p className="font-display font-black text-[32px] text-brand-green leading-none mb-3">
              {countryTotals[selectedCountry].count}
            </p>

            {cityBreakdown.length > 0 && (
              <div className="border-t border-neutral-warm-gray pt-3 space-y-2">
                <p className="font-ui font-black text-[12px] text-neutral-muted">التوزيع حسب الموقع:</p>
                {cityBreakdown.map(city => (
                  <div key={city.name} className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-ui font-bold text-[13px]">{city.name}</span>
                        <span className="font-display font-black text-[13px] text-brand-green">{city.count}</span>
                      </div>
                      <div className="h-1.5 bg-neutral-cream rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round((city.count / countryTotals[selectedCountry].count) * 100)}%` }}
                          transition={{ delay: 0.1, duration: 0.5 }}
                          className="h-full bg-brand-green rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {deptBreakdown.length > 0 && (
              <div className="border-t border-neutral-warm-gray pt-3 mt-3 space-y-2">
                <p className="font-ui font-black text-[12px] text-neutral-muted">التوزيع حسب الإدارة:</p>
                {deptBreakdown.slice(0, 8).map((dept, i) => (
                  <div key={dept.name} className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-ui font-bold text-[12px]">{dept.name}</span>
                        <span className="font-display font-black text-[12px] text-brand-blue">{dept.count}</span>
                      </div>
                      <div className="h-1.5 bg-neutral-cream rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round((dept.count / countryTotals[selectedCountry].count) * 100)}%` }}
                          transition={{ delay: 0.15 + i * 0.05, duration: 0.5 }}
                          className="h-full bg-brand-blue rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend bar */}
      <div className="mt-4 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <span className="font-ui font-bold text-[12px] text-neutral-muted">أقل</span>
          <div className="flex gap-0.5">
            {['#F4F2ED', '#D1EDEF', '#AFE2EA', '#84DBE5', '#B2E2BA', '#00C17A'].map(c => (
              <div key={c} className="w-6 h-3 rounded-sm" style={{ backgroundColor: c }} />
            ))}
          </div>
          <span className="font-ui font-bold text-[12px] text-neutral-muted">أكثر</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {Object.entries(countryTotals)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 5)
            .map(([, { arabicName, count }]) => (
              <span key={arabicName} className="font-ui font-black text-[12px] text-neutral-charcoal">
                {arabicName}: <span className="text-brand-green">{count}</span>
              </span>
            ))}
          {remoteCount > 0 && (
            <span className="font-ui font-black text-[12px] text-neutral-charcoal">
              عن بعد: <span className="text-brand-blue">{remoteCount}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
