'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Upload,
  ChevronLeft,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import SearchInput from '@/components/ui/SearchInput';
import Badge from '@/components/ui/Badge';
import MetricBar from '@/components/charts/MetricBar';
import Button from '@/components/ui/Button';
import { PerformanceReview } from '@/lib/types';

const TRACK_COLORS: Record<string, string> = {
  'فخر': '#00C17A',
  'خضر': '#B2E2BA',
  'صفر': '#FFBC0A',
  'حمر': '#F24935',
  'خطر': '#82003A',
};

const TRACK_VARIANTS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  'فخر': 'success',
  'خضر': 'success',
  'صفر': 'warning',
  'حمر': 'error',
  'خطر': 'error',
};

const PERF_LABELS: Record<string, string> = {
  outputQuality: 'جودة المخرجات',
  timeDiscipline: 'الانضباط مع الوقت',
  basecampUsage: 'استخدام بيسكامب',
  initiative: 'حس المبادرة',
  efficiency: 'كفاءة الموظف',
  dependability: 'الاعتمادية',
  professionalDev: 'التطور المهني',
  overallTrack: 'التقييم العام',
};

const LEADER_LABELS: Record<string, string> = {
  decisionMaking: 'اتخاذ القرارات',
  teamBuilding: 'بناء الفريق',
  goalSetting: 'بناء الأهداف',
  teamLeadership: 'قيادة الفريق',
};

function ReviewCard({ review, delay }: { review: PerformanceReview; delay: number }) {
  const [expanded, setExpanded] = useState(false);
  const { canViewHrComments } = useAuth();

  const avgScore = useMemo(() => {
    const scores = Object.values(review.performanceScores).filter(s => s > 0);
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }, [review.performanceScores]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-lg shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div
        className="p-5 cursor-pointer hover:bg-neutral-cream/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-ui font-black text-[18px] mb-1">{review.employeeName}</h3>
            <p className="font-ui font-bold text-[13px] text-neutral-muted">
              {review.jobTitle} — {review.department} / {review.team}
            </p>
            <p className="font-ui text-[12px] text-neutral-muted mt-1">
              <span className="font-bold">المقيّم:</span> {review.directLeader}
              {review.season && <> — <span className="font-bold">{review.season}</span></>}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* General track badge */}
            {review.generalTrack && (
              <Badge variant={TRACK_VARIANTS[review.generalTrack] || 'neutral'}>
                <span className="font-black">الدرب: {review.generalTrack}</span>
              </Badge>
            )}

            {/* Score */}
            <div
              className="px-3 py-1 rounded-lg font-display font-black text-[22px]"
              style={{
                backgroundColor: `${TRACK_COLORS[review.generalTrack] || '#EFEDE2'}15`,
                color: TRACK_COLORS[review.generalTrack] || '#494C6B',
              }}
            >
              {review.generalTrackPercent > 0
                ? `${review.generalTrackPercent}%`
                : avgScore.toFixed(1)
              }
            </div>

            {/* Retain badge */}
            {review.retainEmployee && (
              <div className="flex items-center gap-1">
                {review.retainEmployee === '✅' || review.retainEmployee === 'نعم' ? (
                  <><CheckCircle className="w-4 h-4 text-score-excellent" /><span className="font-ui font-bold text-[11px] text-score-excellent">التمسك</span></>
                ) : (
                  <><XCircle className="w-4 h-4 text-score-poor" /><span className="font-ui font-bold text-[11px] text-score-poor">عدم التمسك</span></>
                )}
              </div>
            )}

            <ChevronLeft className={`w-5 h-5 text-neutral-muted transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </div>

        {/* Leadership track */}
        {review.leadershipTrack && review.leadershipTrack !== '-' && (
          <div className="mt-2 flex items-center gap-2">
            <Star className="w-4 h-4" style={{ color: TRACK_COLORS[review.leadershipTrack] || '#494C6B' }} />
            <span className="font-ui font-bold text-[12px]">
              درب القيادة: {review.leadershipTrack}
            </span>
            {review.leadershipPercent > 0 && (
              <span className="font-ui font-bold text-[12px] text-neutral-muted">({review.leadershipPercent}%)</span>
            )}
          </div>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-neutral-warm-gray"
        >
          {/* Performance scores */}
          <div className="p-5">
            <h4 className="font-ui font-black text-[15px] mb-4">معايير الأداء</h4>
            <div className="space-y-3">
              {Object.entries(review.performanceScores).map(([key, value], i) => (
                value > 0 && (
                  <div key={key}>
                    <MetricBar
                      label={PERF_LABELS[key] || key}
                      value={value}
                      delay={i * 0.03}
                    />
                    {review.performanceComments[key] && (
                      <p className="font-body text-[12px] text-neutral-muted mt-1 mr-[196px] leading-relaxed">
                        {review.performanceComments[key]}
                      </p>
                    )}
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Leadership scores */}
          {review.leadershipScores && (
            <div className="p-5 border-t border-neutral-warm-gray/50">
              <h4 className="font-ui font-black text-[15px] mb-4">معايير القيادة</h4>
              <div className="space-y-3">
                {Object.entries(review.leadershipScores).map(([key, value], i) => (
                  value > 0 && (
                    <div key={key}>
                      <MetricBar
                        label={LEADER_LABELS[key] || key}
                        value={value}
                        delay={i * 0.03}
                      />
                      {review.performanceComments[key] && (
                        <p className="font-body text-[12px] text-neutral-muted mt-1 mr-[196px] leading-relaxed">
                          {review.performanceComments[key]}
                        </p>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Manager comments */}
          {review.managerComments && (
            <div className="p-5 border-t border-neutral-warm-gray/50">
              <h4 className="font-ui font-black text-[15px] mb-2">تعليقات المدير</h4>
              <p className="font-body text-[14px] leading-relaxed whitespace-pre-wrap bg-neutral-cream rounded-lg p-4">
                {review.managerComments}
              </p>
            </div>
          )}

          {/* HR comments (restricted) */}
          {canViewHrComments && review.hrComments && (
            <div className="p-5 border-t border-neutral-warm-gray/50">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-brand-amber" />
                <h4 className="font-ui font-black text-[15px]">تعليقات الموارد البشرية</h4>
                <Badge variant="warning">سري</Badge>
              </div>
              <p className="font-body text-[14px] leading-relaxed whitespace-pre-wrap bg-brand-yellow-pale/30 rounded-lg p-4">
                {review.hrComments}
              </p>
            </div>
          )}

          {/* Meta info */}
          <div className="p-5 border-t border-neutral-warm-gray/50 bg-neutral-cream/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-ui text-[12px]">
              <div>
                <span className="font-bold text-neutral-muted block">الحالة</span>
                <span className="font-bold">{review.reviewStatus}</span>
              </div>
              <div>
                <span className="font-bold text-neutral-muted block">تاريخ التقييم</span>
                <span className="font-bold">{review.reviewDate}</span>
              </div>
              <div>
                <span className="font-bold text-neutral-muted block">المستوى</span>
                <span className="font-bold">{review.level}</span>
              </div>
              <div>
                <span className="font-bold text-neutral-muted block">الموقع</span>
                <span className="font-bold">{review.currentLocation}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function ReviewsPage() {
  const { data } = useData();
  const { canViewReviews, isDepartmentOnly, userDepartment } = useAuth();
  const [search, setSearch] = useState('');
  const [trackFilter, setTrackFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [retainFilter, setRetainFilter] = useState('');

  const departments = useMemo(
    () => [...new Set(data.reviews.map(r => r.department).filter(Boolean))].sort(),
    [data.reviews]
  );

  const filtered = useMemo(() => {
    let reviews = data.reviews;

    // Department restriction for managers
    if (isDepartmentOnly && userDepartment) {
      reviews = reviews.filter(r => r.department === userDepartment);
    }

    return reviews.filter(r => {
      const matchSearch = !search ||
        r.employeeName.includes(search) ||
        r.directLeader.includes(search) ||
        r.department.includes(search) ||
        r.team.includes(search) ||
        r.jobTitle.includes(search);
      const matchTrack = !trackFilter || r.generalTrack === trackFilter;
      const matchDept = !deptFilter || r.department === deptFilter;
      const matchRetain = !retainFilter ||
        (retainFilter === 'yes' && (r.retainEmployee === '✅' || r.retainEmployee === 'نعم')) ||
        (retainFilter === 'no' && (r.retainEmployee === '❌' || r.retainEmployee === 'لا'));
      return matchSearch && matchTrack && matchDept && matchRetain;
    });
  }, [data.reviews, search, trackFilter, deptFilter, retainFilter, isDepartmentOnly, userDepartment]);

  if (!canViewReviews) {
    return (
      <div>
        <TopBar title="تقييمات الأداء" />
        <div className="p-8 text-center py-20">
          <AlertTriangle className="w-12 h-12 mx-auto text-brand-amber mb-4" />
          <p className="font-display font-bold text-[20px] mb-2">لا تملك صلاحية الوصول</p>
          <p className="font-body text-[14px] text-neutral-muted">تواصل مع مدير النظام للحصول على الصلاحية المناسبة</p>
        </div>
      </div>
    );
  }

  if (data.reviews.length === 0) {
    return (
      <div>
        <TopBar title="تقييمات الأداء" />
        <div className="p-8 text-center py-20">
          <p className="font-body font-bold text-[16px] text-neutral-muted mb-4">
            لم يتم رفع تقييمات الأداء (أناناس) بعد
          </p>
          <Link href="/dashboard">
            <Button variant="accent" className="flex items-center gap-2 mx-auto font-bold">
              <Upload className="w-4 h-4" />
              رفع ملف التقييمات
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Summary stats
  const trackDist = filtered.reduce<Record<string, number>>((acc, r) => {
    if (r.generalTrack) acc[r.generalTrack] = (acc[r.generalTrack] || 0) + 1;
    return acc;
  }, {});

  const retainYes = filtered.filter(r => r.retainEmployee === '✅' || r.retainEmployee === 'نعم').length;
  const retainNo = filtered.filter(r => r.retainEmployee === '❌' || r.retainEmployee === 'لا').length;

  return (
    <div>
      <TopBar title="تقييمات الأداء" />
      <div className="p-8">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(trackDist).sort(([, a], [, b]) => b - a).map(([track, count]) => (
            <motion.div
              key={track}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-4 shadow-sm text-center"
            >
              <span
                className="font-display font-black text-[28px] block"
                style={{ color: TRACK_COLORS[track] || '#494C6B' }}
              >
                {count}
              </span>
              <span className="font-ui font-bold text-[13px] text-neutral-muted">{track}</span>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-4 shadow-sm text-center"
          >
            <span className="font-display font-black text-[28px] text-brand-green block">{retainYes}</span>
            <span className="font-ui font-bold text-[13px] text-neutral-muted">تمسّك</span>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="ابحث بالاسم، المدير، الإدارة، المسمى..."
            className="w-[320px]"
          />
          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
            className="px-4 py-[10px] rounded-lg border border-neutral-warm-gray bg-white font-ui font-bold text-[14px] focus:outline-none focus:border-brand-green"
          >
            <option value="">جميع الدروب</option>
            <option value="فخر">فخر</option>
            <option value="خضر">خضر</option>
            <option value="صفر">صفر</option>
            <option value="حمر">حمر</option>
            <option value="خطر">خطر</option>
          </select>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-4 py-[10px] rounded-lg border border-neutral-warm-gray bg-white font-ui font-bold text-[14px] focus:outline-none focus:border-brand-green"
          >
            <option value="">جميع الأقسام</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={retainFilter}
            onChange={(e) => setRetainFilter(e.target.value)}
            className="px-4 py-[10px] rounded-lg border border-neutral-warm-gray bg-white font-ui font-bold text-[14px] focus:outline-none focus:border-brand-green"
          >
            <option value="">التمسك: الكل</option>
            <option value="yes">التمسك بالموظف</option>
            <option value="no">عدم التمسك</option>
          </select>
          <span className="flex items-center font-ui font-bold text-[13px] text-neutral-muted">
            {filtered.length} تقييم
          </span>
        </div>

        {/* Review cards */}
        <div className="space-y-4">
          {filtered.map((review, i) => (
            <ReviewCard
              key={review.id}
              review={review}
              delay={Math.min(i * 0.03, 0.3)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
