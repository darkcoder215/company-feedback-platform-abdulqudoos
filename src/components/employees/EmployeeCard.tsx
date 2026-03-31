'use client';

import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Users,
  Award,
  Briefcase,
  Clock,
  FileText,
} from 'lucide-react';
import { Employee } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Highlight from '@/components/ui/Highlight';

interface EmployeeCardProps {
  employee: Employee;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  if (!value || value === '-') return null;
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="w-4 h-4 text-neutral-muted flex-shrink-0" />
      <span className="font-ui text-[13px] text-neutral-muted w-[120px] flex-shrink-0">{label}</span>
      <span className="font-ui text-[14px] font-medium">{value}</span>
    </div>
  );
}

export default function EmployeeCard({ employee }: EmployeeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="bg-brand-black p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-green/20 flex items-center justify-center">
            <span className="font-display font-black text-[24px] text-brand-green">
              {employee.preferredName.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-[22px] text-white">{employee.preferredName}</h2>
            <p className="font-ui text-[14px] text-white/60">{employee.jobTitleAr}</p>
            {employee.jobTitleEn && employee.jobTitleEn !== '-' && (
              <p className="font-ui text-[13px] text-white/40">{employee.jobTitleEn}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {employee.isLeader && <Badge variant="success">قائد</Badge>}
            {employee.inProbation ? (
              <Badge variant="warning">فترة تجريبية</Badge>
            ) : (
              <Badge variant="success">مثبّت</Badge>
            )}
            {employee.overallRating && (
              <Highlight color="yellow">{employee.overallRating}</Highlight>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <div>
          <h3 className="font-ui font-bold text-[14px] text-neutral-muted mb-3 pb-2 border-b border-neutral-warm-gray">
            معلومات العمل
          </h3>
          <InfoRow icon={Building2} label="الإدارة" value={employee.department} />
          <InfoRow icon={Users} label="الفريق" value={employee.team} />
          <InfoRow icon={Award} label="المستوى" value={employee.level ? String(employee.level) : '-'} />
          <InfoRow icon={Briefcase} label="المدير المباشر" value={employee.manager} />
          <InfoRow icon={MapPin} label="المكتب" value={employee.office} />
          <InfoRow icon={MapPin} label="الموقع الحالي" value={employee.currentLocation} />
          <InfoRow icon={Clock} label="نوع الدوام" value={employee.workType} />
        </div>

        <div>
          <h3 className="font-ui font-bold text-[14px] text-neutral-muted mb-3 pb-2 border-b border-neutral-warm-gray">
            معلومات الخدمة
          </h3>
          <InfoRow icon={Calendar} label="تاريخ المباشرة" value={employee.startDate} />
          <InfoRow icon={Calendar} label="سنوات الخدمة" value={`${employee.serviceYears} سنة (${employee.serviceMonths} شهر)`} />
          <InfoRow icon={Calendar} label="آخر ترقية" value={employee.lastPromotionDate} />
          <InfoRow icon={FileText} label="العقد الحالي" value={employee.currentContract} />
          <InfoRow icon={Calendar} label="انتهاء العقد" value={employee.contractEndDate} />
          {employee.contractDaysRemaining !== 0 && (
            <InfoRow icon={Clock} label="الأيام المتبقية" value={`${employee.contractDaysRemaining} يوم`} />
          )}
        </div>

        <div className="md:col-span-2 mt-4">
          <h3 className="font-ui font-bold text-[14px] text-neutral-muted mb-3 pb-2 border-b border-neutral-warm-gray">
            معلومات شخصية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              <InfoRow icon={Users} label="الجنس" value={employee.gender} />
              <InfoRow icon={MapPin} label="الجنسية" value={employee.nationality} />
              <InfoRow icon={Calendar} label="العمر" value={employee.age ? `${employee.age} سنة` : '-'} />
            </div>
            <div>
              <InfoRow icon={Phone} label="الجوال" value={employee.phone} />
              <InfoRow icon={Mail} label="بريد العمل" value={employee.workEmail} />
              <InfoRow icon={Mail} label="البريد الشخصي" value={employee.personalEmail} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
