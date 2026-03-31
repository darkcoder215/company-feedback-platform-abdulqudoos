'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Upload,
  Users,
  Clock,
  Award,
  TrendingUp,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useData } from '@/context/DataContext';
import { getDepartmentStats } from '@/lib/analytics';
import DepartmentChart from '@/components/charts/DepartmentChart';
import MetricBar from '@/components/charts/MetricBar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { getScoreColor } from '@/lib/scoring';

export default function DepartmentsPage() {
  const { data } = useData();

  const deptStats = useMemo(
    () => getDepartmentStats(data.employees, data.evaluations),
    [data.employees, data.evaluations]
  );

  if (data.employees.length === 0) {
    return (
      <div>
        <TopBar title="الإدارات" />
        <div className="p-8 text-center py-20">
          <p className="font-body text-[16px] text-neutral-muted mb-4">
            لم يتم رفع بيانات الموظفين بعد
          </p>
          <Link href="/dashboard?upload=true">
            <Button variant="accent" className="flex items-center gap-2 mx-auto">
              <Upload className="w-4 h-4" />
              رفع ملف بيانات الموظفين
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const chartData = deptStats.map(d => ({
    name: d.name,
    value: d.employeeCount,
  }));

  return (
    <div>
      <TopBar title="الإدارات" />
      <div className="p-8">
        {/* Department size chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-8"
        >
          <h3 className="font-ui font-bold text-[16px] mb-4">حجم الإدارات</h3>
          <DepartmentChart data={chartData} height={Math.max(200, deptStats.length * 40)} />
        </motion.div>

        {/* Department cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deptStats.map((dept, i) => (
            <motion.div
              key={dept.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <div className="bg-brand-black p-4">
                <h3 className="font-display font-bold text-[18px] text-white">{dept.name}</h3>
                <p className="font-ui text-[13px] text-white/50 mt-1">
                  {dept.teams.length} فريق
                </p>
              </div>

              <div className="p-5">
                {/* Key stats */}
                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="text-center">
                    <Users className="w-5 h-5 text-brand-blue mx-auto mb-1" />
                    <p className="font-display font-black text-[20px]">{dept.employeeCount}</p>
                    <p className="font-ui text-[11px] text-neutral-muted">موظف</p>
                  </div>
                  <div className="text-center">
                    <Clock className="w-5 h-5 text-brand-green mx-auto mb-1" />
                    <p className="font-display font-black text-[20px]">{dept.avgServiceYears.toFixed(1)}</p>
                    <p className="font-ui text-[11px] text-neutral-muted">سنة خدمة</p>
                  </div>
                  <div className="text-center">
                    <Award className="w-5 h-5 text-brand-amber mx-auto mb-1" />
                    <p className="font-display font-black text-[20px]">{dept.leaderCount}</p>
                    <p className="font-ui text-[11px] text-neutral-muted">قائد</p>
                  </div>
                </div>

                {/* Gender distribution */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-ui text-[12px] text-neutral-muted">الجنس:</span>
                  <div className="flex-1 flex gap-1">
                    {dept.genderDistribution.male > 0 && (
                      <div
                        className="h-3 rounded-full bg-brand-blue"
                        style={{
                          width: `${(dept.genderDistribution.male / dept.employeeCount) * 100}%`,
                        }}
                        title={`ذكر: ${dept.genderDistribution.male}`}
                      />
                    )}
                    {dept.genderDistribution.female > 0 && (
                      <div
                        className="h-3 rounded-full bg-brand-pink-light"
                        style={{
                          width: `${(dept.genderDistribution.female / dept.employeeCount) * 100}%`,
                        }}
                        title={`أنثى: ${dept.genderDistribution.female}`}
                      />
                    )}
                  </div>
                  <span className="font-ui text-[11px] text-neutral-muted">
                    {dept.genderDistribution.male}ذ / {dept.genderDistribution.female}أ
                  </span>
                </div>

                {/* Evaluation score */}
                {dept.avgScore > 0 && (
                  <MetricBar
                    label="متوسط التقييم"
                    value={dept.avgScore}
                  />
                )}

                {/* Probation pass rate */}
                {dept.evaluationCount > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" style={{ color: getScoreColor(dept.probationPassRate / 20) }} />
                    <span className="font-ui text-[13px] text-neutral-muted">نسبة الترسيم:</span>
                    <span className="font-ui font-bold text-[14px]" style={{ color: getScoreColor(dept.probationPassRate / 20) }}>
                      {dept.probationPassRate.toFixed(0)}%
                    </span>
                  </div>
                )}

                {/* Teams */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {dept.teams.map(team => (
                    <Badge key={team} variant="neutral">{team}</Badge>
                  ))}
                </div>

                {/* Top nationalities */}
                {Object.keys(dept.nationalityDistribution).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(dept.nationalityDistribution)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([nat, count]) => (
                        <span key={nat} className="font-ui text-[11px] text-neutral-muted">
                          {nat} ({count})
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
