'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search,
  User,
  ClipboardCheck,
  Star,
  ChevronLeft,
  Building2,
  Briefcase,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import Badge from '@/components/ui/Badge';

interface SearchResult {
  type: 'employee' | 'review' | 'evaluation';
  id: string;
  title: string;
  subtitle: string;
  details: string[];
  link?: string;
  score?: number;
  track?: string;
}

const TRACK_COLORS: Record<string, string> = {
  'فخر': '#00C17A',
  'خضر': '#B2E2BA',
  'صفر': '#FFBC0A',
  'حمر': '#F24935',
  'خطر': '#82003A',
};

export default function SearchPage() {
  const { data } = useData();
  const { isDepartmentOnly, userDepartment, canViewReviews } = useAuth();
  const [query, setQuery] = useState('');

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.trim().toLowerCase();

    const items: SearchResult[] = [];

    // Search employees
    for (const emp of data.employees) {
      if (isDepartmentOnly && userDepartment && emp.department !== userDepartment) continue;

      const fields = [emp.name, emp.preferredName, emp.department, emp.team, emp.jobTitleAr,
        emp.jobTitleEn, emp.manager, emp.currentLocation, emp.nationality, emp.workEmail].join(' ');

      if (fields.toLowerCase().includes(q) || fields.includes(query)) {
        items.push({
          type: 'employee',
          id: emp.id,
          title: emp.preferredName,
          subtitle: `${emp.jobTitleAr} — ${emp.department} / ${emp.team}`,
          details: [
            emp.manager ? `المدير: ${emp.manager}` : '',
            `المستوى: ${emp.level}`,
            `الموقع: ${emp.currentLocation}`,
            emp.isLeader ? 'قائد' : '',
          ].filter(Boolean),
          link: `/employees/${emp.id}`,
        });
      }
    }

    // Search reviews
    if (canViewReviews) {
      for (const rev of data.reviews) {
        if (isDepartmentOnly && userDepartment && rev.department !== userDepartment) continue;

        const fields = [rev.employeeName, rev.directLeader, rev.department, rev.team,
          rev.jobTitle, rev.managerComments, rev.generalTrack, rev.season].join(' ');

        if (fields.toLowerCase().includes(q) || fields.includes(query)) {
          items.push({
            type: 'review',
            id: rev.id,
            title: rev.employeeName,
            subtitle: `تقييم أداء — ${rev.season || ''} — المقيّم: ${rev.directLeader}`,
            details: [
              rev.department ? `القسم: ${rev.department}` : '',
              rev.generalTrack ? `الدرب: ${rev.generalTrack}` : '',
              rev.retainEmployee ? `التمسك: ${rev.retainEmployee}` : '',
            ].filter(Boolean),
            track: rev.generalTrack,
          });
        }
      }
    }

    // Search evaluations
    if (canViewReviews) {
      for (const ev of data.evaluations) {
        const fields = [ev.employeeName, ev.evaluatorName, ev.startFeedback,
          ev.stopFeedback, ev.continueFeedback, ev.openComments].join(' ');

        if (fields.toLowerCase().includes(q) || fields.includes(query)) {
          items.push({
            type: 'evaluation',
            id: ev.id,
            title: ev.employeeName,
            subtitle: `${ev.evaluationType === 'first_impression' ? 'الانطباع الأول' : 'محطة القرار'} — المقيّم: ${ev.evaluatorName}`,
            details: [
              ev.trafficLight ? `النتيجة: ${ev.trafficLight}` : '',
              ev.finalDecision === 'confirmed' ? 'الترسيم' : ev.finalDecision === 'terminated' ? 'عدم الاستمرار' : '',
            ].filter(Boolean),
          });
        }
      }
    }

    return items;
  }, [query, data, isDepartmentOnly, userDepartment, canViewReviews]);

  const typeIcon = (type: string) => {
    switch (type) {
      case 'employee': return User;
      case 'review': return Star;
      case 'evaluation': return ClipboardCheck;
      default: return Search;
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case 'employee': return 'موظف';
      case 'review': return 'تقييم أداء';
      case 'evaluation': return 'فترة تجربة';
      default: return '';
    }
  };

  const typeVariant = (type: string): 'info' | 'success' | 'warning' => {
    switch (type) {
      case 'employee': return 'info';
      case 'review': return 'success';
      case 'evaluation': return 'warning';
      default: return 'info';
    }
  };

  // Group results
  const grouped = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    for (const r of results) {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    }
    return groups;
  }, [results]);

  return (
    <div>
      <TopBar title="البحث الذكي" />
      <div className="p-8">
        {/* Search input */}
        <div className="max-w-[600px] mx-auto mb-10">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-neutral-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن موظف، تقييم، إدارة، مدير..."
              autoFocus
              className="
                w-full pr-12 pl-6 py-4 rounded-xl
                bg-white border-2 border-neutral-warm-gray
                font-ui font-bold text-[16px] text-brand-black
                placeholder:text-neutral-muted placeholder:font-normal
                focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20
                shadow-md transition-all duration-200
              "
            />
          </div>
          {query.length > 0 && query.length < 2 && (
            <p className="font-ui text-[13px] text-neutral-muted mt-2 text-center">اكتب حرفين على الأقل للبحث</p>
          )}
          {query.length >= 2 && (
            <p className="font-ui font-bold text-[14px] text-neutral-muted mt-3 text-center">
              {results.length} نتيجة
            </p>
          )}
        </div>

        {/* Results */}
        <AnimatePresence>
          {Object.entries(grouped).map(([type, items]) => (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8"
            >
              {/* Section header */}
              <div className="flex items-center gap-2 mb-4">
                {type === 'employee' && <User className="w-5 h-5 text-brand-blue" />}
                {type === 'review' && <Star className="w-5 h-5 text-brand-green" />}
                {type === 'evaluation' && <ClipboardCheck className="w-5 h-5 text-brand-amber" />}
                <h2 className="font-display font-black text-[18px]">
                  {type === 'employee' ? 'الموظفون' : type === 'review' ? 'تقييمات الأداء' : 'فترات التجربة'}
                </h2>
                <Badge variant={typeVariant(type)}>{items.length}</Badge>
              </div>

              <div className="space-y-2">
                {items.slice(0, 20).map((result, i) => {
                  const Icon = typeIcon(result.type);
                  const content = (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-lg bg-neutral-cream flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-neutral-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-ui font-black text-[15px]">{result.title}</h3>
                          <Badge variant={typeVariant(result.type)} className="text-[10px]">
                            {typeLabel(result.type)}
                          </Badge>
                          {result.track && (
                            <span
                              className="font-ui font-black text-[11px] px-2 py-[1px] rounded"
                              style={{
                                backgroundColor: `${TRACK_COLORS[result.track] || '#EFEDE2'}20`,
                                color: TRACK_COLORS[result.track] || '#494C6B',
                              }}
                            >
                              {result.track}
                            </span>
                          )}
                        </div>
                        <p className="font-ui font-bold text-[12px] text-neutral-muted truncate">{result.subtitle}</p>
                        {result.details.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {result.details.map((d, j) => (
                              <span key={j} className="font-ui text-[11px] text-neutral-muted font-bold">{d}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {result.link && <ChevronLeft className="w-5 h-5 text-neutral-muted flex-shrink-0" />}
                    </motion.div>
                  );

                  return result.link ? (
                    <Link key={result.id} href={result.link}>{content}</Link>
                  ) : (
                    <div key={result.id}>{content}</div>
                  );
                })}
                {items.length > 20 && (
                  <p className="font-ui font-bold text-[13px] text-neutral-muted text-center py-2">
                    و {items.length - 20} نتيجة أخرى...
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {query.length >= 2 && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Search className="w-16 h-16 mx-auto text-neutral-warm-gray mb-4" />
            <p className="font-display font-bold text-[20px] mb-2">لا توجد نتائج</p>
            <p className="font-body text-[14px] text-neutral-muted">
              جرّب البحث بكلمات مختلفة أو تأكد من رفع الملفات أولاً
            </p>
          </motion.div>
        )}

        {/* Initial state - no query */}
        {!query && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Search className="w-20 h-20 mx-auto text-neutral-warm-gray/50 mb-6" />
            <p className="font-display font-bold text-[22px] mb-3">ابحث في كل البيانات</p>
            <p className="font-body text-[15px] text-neutral-muted max-w-[400px] mx-auto leading-relaxed">
              ابحث بالاسم، الإدارة، الفريق، المدير، المسمى الوظيفي، أو أي نص في التعليقات والملاحظات
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {['الإنتاج', 'فخر', 'المحتوى', 'قائد', 'السعودية'].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  className="font-ui font-bold text-[13px] px-4 py-2 rounded-full bg-neutral-cream hover:bg-neutral-warm-gray transition-colors text-neutral-muted"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
