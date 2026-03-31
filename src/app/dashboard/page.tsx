'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Building2,
  Calendar,
  Award,
  ClipboardCheck,
  UserCheck,
  UserX,
  TrendingUp,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import FileUploader from '@/components/upload/FileUploader';
import StatCard from '@/components/dashboard/StatCard';
import OverviewCharts from '@/components/dashboard/OverviewCharts';
import { useData } from '@/context/DataContext';
import { getOverallStats, getEvaluationInsights } from '@/lib/analytics';
import { getTrafficLightColor } from '@/lib/scoring';

export default function DashboardPage() {
  const [showUpload, setShowUpload] = useState(false);
  const { data, hasData } = useData();

  const stats = useMemo(
    () => getOverallStats(data.employees, data.evaluations),
    [data.employees, data.evaluations]
  );

  const insights = useMemo(
    () => getEvaluationInsights(data.evaluations),
    [data.evaluations]
  );

  const genderData = [
    { name: 'ذكر', value: stats.genderDistribution.male, color: '#0072F9' },
    { name: 'أنثى', value: stats.genderDistribution.female, color: '#FFA5C6' },
  ].filter(d => d.value > 0);

  const decisionData = [
    { name: 'تم الترسيم', value: insights.decisionDist.confirmed, color: '#00C17A' },
    { name: 'لم يستمر', value: insights.decisionDist.terminated, color: '#F24935' },
    { name: 'قيد المراجعة', value: insights.decisionDist.pending, color: '#FFBC0A' },
  ].filter(d => d.value > 0);

  const trafficLightData = Object.entries(insights.trafficLightDist).map(([label, value]) => ({
    name: label,
    value,
    color: getTrafficLightColor(label),
  }));

  return (
    <div>
      <TopBar title="لوحة التحكم" />

      <div className="p-8">
        {/* Upload section - always show if no data, or if explicitly opened */}
        <AnimatePresence>
          {(!hasData || showUpload) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-8"
            >
              <FileUploader onClose={hasData ? () => setShowUpload(false) : undefined} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        {hasData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="إجمالي الموظفين"
                value={stats.totalEmployees}
                subtitle={`${stats.departmentCount} إدارة — ${stats.teamCount} فريق`}
                icon={Users}
                color="#0072F9"
                delay={0}
              />
              <StatCard
                title="متوسط سنوات الخدمة"
                value={stats.avgServiceYears}
                subtitle="سنة"
                icon={Calendar}
                color="#00C17A"
                delay={0.1}
              />
              <StatCard
                title="القيادات"
                value={stats.leaders}
                subtitle={`من أصل ${stats.totalEmployees} موظف`}
                icon={Award}
                color="#FFBC0A"
                delay={0.2}
              />
              <StatCard
                title="التقييمات"
                value={stats.totalEvaluations}
                subtitle={`${stats.firstImpressions} انطباع أول — ${stats.decisionStations} قرار`}
                icon={ClipboardCheck}
                color="#84DBE5"
                delay={0.3}
              />
            </div>

            {/* Probation summary */}
            {stats.totalEvaluations > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                  title="تم ترسيمهم"
                  value={stats.confirmed}
                  icon={UserCheck}
                  color="#00C17A"
                  delay={0.4}
                />
                <StatCard
                  title="لم يستمروا"
                  value={stats.terminated}
                  icon={UserX}
                  color="#F24935"
                  delay={0.5}
                />
                <StatCard
                  title="معدل النجاح"
                  value={
                    stats.confirmed + stats.terminated > 0
                      ? `${Math.round((stats.confirmed / (stats.confirmed + stats.terminated)) * 100)}%`
                      : 'غير متاح'
                  }
                  icon={TrendingUp}
                  color="#0072F9"
                  delay={0.6}
                />
              </div>
            )}

            {/* Charts */}
            <OverviewCharts
              genderData={genderData}
              decisionData={decisionData}
              trafficLightData={trafficLightData}
            />

            {/* Location distribution */}
            {Object.keys(stats.locationDistribution).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-8 bg-white rounded-lg p-6 shadow-sm"
              >
                <h3 className="font-ui font-bold text-[16px] mb-4">توزيع المواقع</h3>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(stats.locationDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .map(([location, count]) => (
                      <div
                        key={location}
                        className="flex items-center gap-2 bg-neutral-cream px-4 py-2 rounded-lg"
                      >
                        <span className="font-ui font-medium text-[14px]">{location}</span>
                        <span className="font-ui font-bold text-[14px] text-brand-green">{count}</span>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
