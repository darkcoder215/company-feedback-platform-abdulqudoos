'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Employee } from '@/lib/types';
import SearchInput from '@/components/ui/SearchInput';
import Badge from '@/components/ui/Badge';

interface EmployeeTableProps {
  employees: Employee[];
}

export default function EmployeeTable({ employees }: EmployeeTableProps) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  const departments = useMemo(
    () => [...new Set(employees.map(e => e.department).filter(Boolean))].sort(),
    [employees]
  );

  const teams = useMemo(
    () => [...new Set(
      employees
        .filter(e => !deptFilter || e.department === deptFilter)
        .map(e => e.team)
        .filter(Boolean)
    )].sort(),
    [employees, deptFilter]
  );

  const filtered = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = !search ||
        emp.name.includes(search) ||
        emp.preferredName.includes(search) ||
        emp.jobTitleAr.includes(search) ||
        emp.jobTitleEn.toLowerCase().includes(search.toLowerCase());
      const matchDept = !deptFilter || emp.department === deptFilter;
      const matchTeam = !teamFilter || emp.team === teamFilter;
      return matchSearch && matchDept && matchTeam;
    });
  }, [employees, search, deptFilter, teamFilter]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="ابحث بالاسم أو المسمى الوظيفي..."
          className="w-[300px]"
        />
        <select
          value={deptFilter}
          onChange={(e) => { setDeptFilter(e.target.value); setTeamFilter(''); }}
          className="px-4 py-[10px] rounded-lg border border-neutral-warm-gray bg-white font-ui text-[14px] focus:outline-none focus:border-brand-green"
        >
          <option value="">جميع الإدارات</option>
          {departments.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="px-4 py-[10px] rounded-lg border border-neutral-warm-gray bg-white font-ui text-[14px] focus:outline-none focus:border-brand-green"
        >
          <option value="">جميع الفرق</option>
          {teams.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className="flex items-center font-ui text-[13px] text-neutral-muted">
          {filtered.length} موظف
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-brand-black text-white">
                <th className="text-right px-4 py-3 font-ui font-bold text-[13px]">الاسم</th>
                <th className="text-right px-4 py-3 font-ui font-bold text-[13px]">الإدارة</th>
                <th className="text-right px-4 py-3 font-ui font-bold text-[13px]">الفريق</th>
                <th className="text-right px-4 py-3 font-ui font-bold text-[13px]">المسمى الوظيفي</th>
                <th className="text-right px-4 py-3 font-ui font-bold text-[13px]">المستوى</th>
                <th className="text-right px-4 py-3 font-ui font-bold text-[13px]">الموقع</th>
                <th className="text-right px-4 py-3 font-ui font-bold text-[13px]">سنوات الخدمة</th>
                <th className="text-right px-4 py-3 font-ui font-bold text-[13px]">الحالة</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => (
                <motion.tr
                  key={emp.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.5) }}
                  className={`border-b border-neutral-warm-gray/50 hover:bg-neutral-cream transition-colors ${
                    i % 2 === 1 ? 'bg-neutral-off-white' : 'bg-white'
                  }`}
                >
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-ui font-bold text-[14px]">{emp.preferredName}</span>
                      {emp.isLeader && (
                        <Badge variant="success" className="mr-2 text-[11px]">قائد</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-ui text-[13px] text-neutral-muted">{emp.department}</td>
                  <td className="px-4 py-3 font-ui text-[13px] text-neutral-muted">{emp.team}</td>
                  <td className="px-4 py-3 font-ui text-[13px]">{emp.jobTitleAr}</td>
                  <td className="px-4 py-3 font-ui font-bold text-[14px] text-center">{emp.level || '-'}</td>
                  <td className="px-4 py-3 font-ui text-[13px] text-neutral-muted">{emp.currentLocation}</td>
                  <td className="px-4 py-3 font-ui font-medium text-[14px] text-center">{emp.serviceYears}</td>
                  <td className="px-4 py-3">
                    {emp.inProbation ? (
                      <Badge variant="warning">تجربة</Badge>
                    ) : (
                      <Badge variant="success">مثبّت</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/employees/${emp.id}`}
                      className="text-brand-blue hover:text-brand-blue/80 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="font-ui text-[14px] text-neutral-muted">لا توجد نتائج</p>
          </div>
        )}
      </div>
    </div>
  );
}
