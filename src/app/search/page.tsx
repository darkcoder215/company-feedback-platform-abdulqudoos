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
  Shield,
  Lightbulb,
  HelpCircle,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import Badge from '@/components/ui/Badge';

interface SearchResult {
  type: 'employee' | 'review' | 'evaluation' | 'leader';
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

const SEARCH_EXAMPLES = [
  { query: 'الإنتاج', description: 'البحث عن جميع موظفي إدارة الإنتاج' },
  { query: 'فخر', description: 'الموظفون في درب الفخر (أعلى تقييم أداء)' },
  { query: 'قائد', description: 'عرض القيادات وتقييماتهم' },
  { query: 'السعودية', description: 'الموظفون حسب الجنسية' },
  { query: 'الرياض', description: 'البحث حسب الموقع أو المكتب' },
  { query: 'تطوير', description: 'البحث في التعليقات والملاحظات' },
];

const PLATFORM_GUIDE = [
  { icon: User, title: 'الموظفون', desc: 'ابحث بالاسم، المسمى الوظيفي، الإدارة، الفريق، المدير، أو الموقع' },
  { icon: Star, title: 'تقييمات الأداء', desc: 'ابحث باسم الموظف، القائد المباشر، الدرب، أو القسم' },
  { icon: ClipboardCheck, title: 'فترات التجربة', desc: 'ابحث باسم الموظف أو المقيّم أو في التعليقات' },
  { icon: Shield, title: 'تقييمات القيادة', desc: 'ابحث باسم القائد أو المقيّم أو في ملاحظات التقييم' },
];

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

    // Search leader evaluations
    if (canViewReviews) {
      for (const ldr of data.leaders) {
        const fields = [ldr.leaderName, ldr.evaluatorName, ldr.clarityComments,
          ldr.workMethodComments, ldr.teamLeadershipComments, ldr.developmentComments, ldr.generalComments].join(' ');

        if (fields.toLowerCase().includes(q) || fields.includes(query)) {
          items.push({
            type: 'leader',
            id: ldr.id,
            title: ldr.leaderName,
            subtitle: `تقييم قيادة ٣٦٠° — المقيّم: ${ldr.evaluatorName}`,
            details: [
              `المتوسط: ${ldr.averageScore.toFixed(1)} / ١٠`,
            ],
            score: ldr.averageScore,
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
      case 'leader': return Shield;
      default: return Search;
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case 'employee': return 'موظف';
      case 'review': return 'تقييم أداء';
      case 'evaluation': return 'فترة تجربة';
      case 'leader': return 'تقييم قيادة';
      default: return '';
    }
  };

  const typeVariant = (type: string): 'info' | 'success' | 'warning' => {
    switch (type) {
      case 'employee': return 'info';
      case 'review': return 'success';
      case 'evaluation': return 'warning';
      case 'leader': return 'info';
      default: return 'info';
    }
  };

  const typeSectionLabel = (type: string) => {
    switch (type) {
      case 'employee': return 'الموظفون';
      case 'review': return 'تقييمات الأداء';
      case 'evaluation': return 'فترات التجربة';
      case 'leader': return 'تقييمات القيادة';
      default: return '';
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
        <div className="max-w-[640px] mx-auto mb-10">
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
                {(() => { const Icon = typeIcon(type); return <Icon className="w-5 h-5 text-neutral-muted" />; })()}
                <h2 className="font-display font-black text-[18px]">
                  {typeSectionLabel(type)}
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
                          {result.score !== undefined && (
                            <span className="font-ui font-black text-[11px] text-brand-green">{result.score.toFixed(1)}/١٠</span>
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

        {/* Empty state on search */}
        {query.length >= 2 && results.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <Search className="w-16 h-16 mx-auto text-neutral-warm-gray mb-4" />
            <p className="font-display font-bold text-[20px] mb-2">لا توجد نتائج</p>
            <p className="font-body text-[14px] text-neutral-muted">
              جرّب البحث بكلمات مختلفة أو تأكد من رفع الملفات أولاً
            </p>
          </motion.div>
        )}

        {/* ── Initial state: guide + examples ── */}
        {!query && (
          <div className="max-w-[800px] mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-10">
              <Search className="w-16 h-16 mx-auto text-neutral-warm-gray/40 mb-4" />
              <p className="font-display font-bold text-[24px] mb-2">ابحث في كل البيانات</p>
              <p className="font-body text-[15px] text-neutral-muted max-w-[500px] mx-auto leading-relaxed">
                يمكنك البحث عبر جميع بيانات المنصة — الموظفون، تقييمات الأداء، فترات التجربة، وتقييمات القيادة
              </p>
            </motion.div>

            {/* Quick search examples */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-brand-amber" />
                <h3 className="font-ui font-bold text-[15px]">أمثلة للبحث</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SEARCH_EXAMPLES.map((example) => (
                  <button
                    key={example.query}
                    onClick={() => setQuery(example.query)}
                    className="text-right bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all hover:border-brand-green border-2 border-transparent group"
                  >
                    <span className="font-ui font-black text-[14px] text-brand-green group-hover:text-brand-black transition-colors">
                      &quot;{example.query}&quot;
                    </span>
                    <p className="font-ui text-[12px] text-neutral-muted mt-1">{example.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Platform guide */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="w-4 h-4 text-brand-blue" />
                <h3 className="font-ui font-bold text-[15px]">ما يمكنك البحث عنه</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PLATFORM_GUIDE.map((item) => (
                  <div key={item.title} className="bg-white rounded-lg p-4 shadow-sm flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-neutral-cream flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-neutral-muted" />
                    </div>
                    <div>
                      <h4 className="font-ui font-bold text-[14px]">{item.title}</h4>
                      <p className="font-ui text-[12px] text-neutral-muted mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Data stats */}
              <div className="mt-6 bg-gradient-to-l from-neutral-cream to-white rounded-xl p-5 flex flex-wrap items-center justify-center gap-6">
                <span className="font-ui text-[13px] text-neutral-muted">البيانات المتاحة:</span>
                {data.employees.length > 0 && (
                  <span className="font-ui font-bold text-[13px] text-brand-blue">{data.employees.length} موظف</span>
                )}
                {data.reviews.length > 0 && (
                  <span className="font-ui font-bold text-[13px] text-brand-green">{data.reviews.length} تقييم أداء</span>
                )}
                {data.evaluations.length > 0 && (
                  <span className="font-ui font-bold text-[13px] text-brand-amber">{data.evaluations.length} تقييم تجربة</span>
                )}
                {data.leaders.length > 0 && (
                  <span className="font-ui font-bold text-[13px] text-brand-burgundy">{data.leaders.length} تقييم قيادة</span>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
