'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Users, Building2, ChevronDown, ChevronUp, Crown, ExternalLink } from 'lucide-react';
import type { Employee } from '@/lib/types';

// ── Color palette for departments ──
const COLOR_PALETTE = [
  '#0072F9', '#00C17A', '#F24935', '#FFBC0A', '#82003A',
  '#84DBE5', '#6366f1', '#ec4899', '#f97316', '#14b8a6',
  '#8b5cf6', '#ef4444', '#22d3ee', '#a3e635',
];

function getDeptColorMap(departments: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  departments.forEach((dept, i) => {
    map[dept] = COLOR_PALETTE[i % COLOR_PALETTE.length];
  });
  return map;
}

// ── Data structures ──
interface DeptData {
  name: string;
  employees: Employee[];
  teams: Map<string, Employee[]>;
  count: number;
}

function buildDeptData(employees: Employee[]): DeptData[] {
  const deptMap = new Map<string, Employee[]>();
  employees.forEach(emp => {
    const dept = emp.department || 'بدون قسم';
    if (!deptMap.has(dept)) deptMap.set(dept, []);
    deptMap.get(dept)!.push(emp);
  });

  return Array.from(deptMap.entries()).map(([name, emps]) => {
    const teams = new Map<string, Employee[]>();
    emps.forEach(emp => {
      const team = emp.team || 'عام';
      if (!teams.has(team)) teams.set(team, []);
      teams.get(team)!.push(emp);
    });
    return { name, employees: emps, teams, count: emps.length };
  }).sort((a, b) => b.count - a.count);
}

// ── People mode: manager hierarchy data ──
interface ManagerNode {
  employee: Employee;
  directReports: Employee[];
}

function buildManagerHierarchy(employees: Employee[]): {
  rootManagers: ManagerNode[];
  managerMap: Map<string, ManagerNode>;
  employeeByName: Map<string, Employee>;
} {
  const employeeByName = new Map<string, Employee>();
  employees.forEach(emp => {
    employeeByName.set(emp.name, emp);
  });

  const directReportsMap = new Map<string, Employee[]>();
  employees.forEach(emp => {
    const mgr = emp.manager?.trim();
    if (mgr) {
      if (!directReportsMap.has(mgr)) directReportsMap.set(mgr, []);
      directReportsMap.get(mgr)!.push(emp);
    }
  });

  const managerMap = new Map<string, ManagerNode>();
  employees.forEach(emp => {
    const reports = directReportsMap.get(emp.name) || [];
    if (reports.length > 0) {
      managerMap.set(emp.name, { employee: emp, directReports: reports });
    }
  });

  const rootManagers: ManagerNode[] = [];
  managerMap.forEach((node) => {
    const mgrName = node.employee.manager?.trim();
    if (!mgrName || !employeeByName.has(mgrName)) {
      rootManagers.push(node);
    }
  });

  rootManagers.sort((a, b) => b.directReports.length - a.directReports.length);

  return { rootManagers, managerMap, employeeByName };
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 1) + '..';
}

// ── Sub-components ──

function EmployeeCard({ emp, color, onClick }: {
  emp: Employee;
  color: string;
  onClick: () => void;
}) {
  const displayName = emp.preferredName || emp.name;
  const years = emp.serviceYears;
  const yearsText = years != null ? `${years.toFixed(1)} سنة` : '';

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.03, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-sm text-right cursor-pointer transition-shadow hover:shadow-md"
      style={{ borderRight: `3px solid ${color}` }}
    >
      {emp.isLeader && <span className="text-sm shrink-0" title="قائد">⭐</span>}
      <span className="font-ui font-bold text-[13px] text-brand-black truncate max-w-[120px]">
        {truncateText(displayName, 16)}
      </span>
      {emp.jobTitleAr && (
        <>
          <span className="text-neutral-muted/40 text-[11px]">|</span>
          <span className="font-ui font-bold text-[11px] text-neutral-muted truncate max-w-[120px]">
            {truncateText(emp.jobTitleAr, 18)}
          </span>
        </>
      )}
      {yearsText && (
        <>
          <span className="text-neutral-muted/40 text-[11px]">|</span>
          <span className="font-ui font-bold text-[10px] text-neutral-muted/70 shrink-0">
            {yearsText}
          </span>
        </>
      )}
    </motion.button>
  );
}

function LevelGroup({ level, employees, color, searchMatches }: {
  level: number;
  employees: Employee[];
  color: string;
  searchMatches: Set<string>;
}) {
  const [showAll, setShowAll] = useState(false);
  const MAX_VISIBLE = 20;

  const filtered = searchMatches.size > 0
    ? employees.filter(emp => searchMatches.has(emp.id))
    : employees;

  if (filtered.length === 0) return null;

  const visible = showAll ? filtered : filtered.slice(0, MAX_VISIBLE);
  const remaining = filtered.length - MAX_VISIBLE;
  const levelLabel = level === 0 ? 'بدون مستوى' : `المستوى ${level}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="font-ui font-black text-[12px] px-2 py-0.5 rounded-md"
          style={{ backgroundColor: color + '15', color }}
        >
          {levelLabel}
        </span>
        <span className="font-ui font-bold text-[11px] text-neutral-muted">
          ({filtered.length} موظفين)
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {visible.map(emp => (
          <EmployeeCard
            key={emp.id}
            emp={emp}
            color={color}
            onClick={() => { window.location.href = `/employees/${emp.id}`; }}
          />
        ))}
        {!showAll && remaining > 0 && (
          <motion.button
            layout
            onClick={() => setShowAll(true)}
            className="flex items-center gap-1 px-3 py-2 bg-neutral-cream rounded-xl font-ui font-black text-[12px] text-neutral-muted hover:bg-brand-blue/10 hover:text-brand-blue transition-all"
          >
            +{remaining} آخرين
            <ChevronDown className="w-3 h-3" />
          </motion.button>
        )}
        {showAll && remaining > 0 && (
          <motion.button
            layout
            onClick={() => setShowAll(false)}
            className="flex items-center gap-1 px-3 py-2 bg-neutral-cream rounded-xl font-ui font-black text-[12px] text-neutral-muted hover:bg-brand-blue/10 hover:text-brand-blue transition-all"
          >
            عرض أقل
            <ChevronUp className="w-3 h-3" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

function DepartmentCard({ dept, color, isExpanded, onToggle, searchMatches }: {
  dept: DeptData;
  color: string;
  isExpanded: boolean;
  onToggle: () => void;
  searchMatches: Set<string>;
}) {
  const leaderCount = dept.employees.filter(e => e.isLeader).length;
  const avgService = dept.employees.length > 0
    ? (dept.employees.reduce((sum, e) => sum + (e.serviceYears || 0), 0) / dept.employees.length).toFixed(1)
    : '0';

  // Group employees by level
  const levelGroups = useMemo(() => {
    const groups = new Map<number, Employee[]>();
    dept.employees.forEach(emp => {
      const lvl = emp.level || 0;
      if (!groups.has(lvl)) groups.set(lvl, []);
      groups.get(lvl)!.push(emp);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);
  }, [dept.employees]);

  const onNavigate = useCallback(() => {
    window.location.href = `/departments?dept=${encodeURIComponent(dept.name)}`;
  }, [dept.name]);

  return (
    <motion.div
      layout
      className="bg-white rounded-2xl shadow-sm overflow-hidden"
      style={{ borderTop: `3px solid ${color}` }}
    >
      {/* Collapsed card header */}
      <motion.button
        layout="position"
        onClick={onToggle}
        className="w-full text-right px-5 py-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-neutral-cream/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="font-ui font-black text-[15px] text-brand-black truncate">
              {dept.name}
            </span>
          </div>
          <div className="font-ui font-bold text-[12px] text-neutral-muted">
            {dept.count} موظف · {dept.teams.size} فرق · {leaderCount} قائد
          </div>
          {!isExpanded && (
            <div className="font-ui font-bold text-[11px] text-neutral-muted/70 mt-0.5">
              متوسط الخدمة: {avgService} سنة
            </div>
          )}
        </div>
        <div className="shrink-0 mt-1">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-neutral-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-muted" />
          )}
        </div>
      </motion.button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* Navigate to department detail link */}
            <div className="px-5 pb-3 border-t border-neutral-cream pt-3">
              <button
                onClick={onNavigate}
                className="flex items-center gap-1.5 font-ui font-black text-[12px] hover:underline transition-all mb-4"
                style={{ color }}
              >
                اضغط للتفاصيل
                <ExternalLink className="w-3 h-3" />
              </button>

              {/* Level groups */}
              {levelGroups.map(([level, employees]) => (
                <LevelGroup
                  key={level}
                  level={level}
                  employees={employees}
                  color={color}
                  searchMatches={searchMatches}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ManagerCard({ node, managerMap, deptColors, depth, searchMatches, expandedManagers, toggleManager }: {
  node: ManagerNode;
  managerMap: Map<string, ManagerNode>;
  deptColors: Record<string, string>;
  depth: number;
  searchMatches: Set<string>;
  expandedManagers: Set<string>;
  toggleManager: (name: string) => void;
}) {
  const emp = node.employee;
  const color = deptColors[emp.department || 'بدون قسم'] || '#0072F9';
  const displayName = emp.preferredName || emp.name;
  const isExpanded = expandedManagers.has(emp.name);
  const reports = node.directReports;

  const isSearchRelevant = searchMatches.size === 0
    || searchMatches.has(emp.id)
    || searchMatches.has(`person:${emp.name}`)
    || searchMatches.has(`manager:${emp.name}`)
    || reports.some(r => searchMatches.has(r.id) || searchMatches.has(`person:${r.name}`));

  if (!isSearchRelevant) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.25 }}
      className="relative"
      style={{ paddingRight: depth > 0 ? 24 : 0 }}
    >
      {/* Left border line for hierarchy */}
      {depth > 0 && (
        <div
          className="absolute top-0 bottom-0 rounded-full"
          style={{ right: depth > 0 ? 10 : 0, width: 2, backgroundColor: color + '30' }}
        />
      )}

      {/* Manager card */}
      <motion.div
        layout="position"
        className="bg-white rounded-2xl shadow-sm mb-2 overflow-hidden"
        style={{ borderRight: `3px solid ${color}` }}
      >
        <button
          onClick={() => toggleManager(emp.name)}
          className="w-full text-right px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-neutral-cream/30 transition-colors"
        >
          <Crown className="w-4 h-4 shrink-0" style={{ color }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-ui font-black text-[14px] text-brand-black truncate">
                {displayName}
              </span>
              <span className="font-ui font-bold text-[11px] text-neutral-muted truncate">
                {emp.jobTitleAr}
              </span>
            </div>
            <div className="font-ui font-bold text-[11px] text-neutral-muted/70">
              {reports.length} تابع · {emp.department || ''}
            </div>
          </div>
          <div className="shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-neutral-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-muted" />
            )}
          </div>
        </button>
      </motion.div>

      {/* Direct reports */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pr-4 mb-2">
              {reports.map(report => {
                const reportNode = managerMap.get(report.name);
                const reportColor = deptColors[report.department || 'بدون قسم'] || color;
                const isReportSearchRelevant = searchMatches.size === 0
                  || searchMatches.has(report.id)
                  || searchMatches.has(`person:${report.name}`);

                if (reportNode) {
                  // This report is also a manager — recurse
                  return (
                    <ManagerCard
                      key={report.id}
                      node={reportNode}
                      managerMap={managerMap}
                      deptColors={deptColors}
                      depth={depth + 1}
                      searchMatches={searchMatches}
                      expandedManagers={expandedManagers}
                      toggleManager={toggleManager}
                    />
                  );
                }

                // Leaf employee
                if (!isReportSearchRelevant) return null;
                return (
                  <motion.div
                    key={report.id}
                    layout
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="relative mb-1.5"
                    style={{ paddingRight: 24 }}
                  >
                    <div
                      className="absolute top-0 bottom-0 rounded-full"
                      style={{ right: 10, width: 2, backgroundColor: reportColor + '20' }}
                    />
                    <EmployeeCard
                      emp={report}
                      color={reportColor}
                      onClick={() => { window.location.href = `/employees/${report.id}`; }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main OrgChart Component ──
export default function OrgChart({ employees }: { employees: Employee[] }) {
  const [viewMode, setViewMode] = useState<'departments' | 'people'>('departments');
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Build department data
  const departments = useMemo(() => buildDeptData(employees), [employees]);
  const deptColors = useMemo(() => getDeptColorMap(departments.map(d => d.name)), [departments]);

  // Build manager hierarchy for people mode
  const { rootManagers, managerMap } = useMemo(() => buildManagerHierarchy(employees), [employees]);

  // Search matching
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.trim().toLowerCase();
    const matches = new Set<string>();
    employees.forEach(emp => {
      const nameMatch = emp.name.toLowerCase().includes(q) || (emp.preferredName?.toLowerCase().includes(q));
      if (nameMatch) {
        matches.add(emp.id);
        matches.add(`dept:${emp.department || 'بدون قسم'}`);
        matches.add(`team:${emp.department || 'بدون قسم'}:${emp.team || 'عام'}`);
        if (emp.manager) {
          matches.add(`manager:${emp.manager}`);
        }
        matches.add(`person:${emp.name}`);
      }
    });
    return matches;
  }, [searchQuery, employees]);

  // Auto-expand departments/managers that have search matches
  const filteredDepartments = useMemo(() => {
    if (searchMatches.size === 0) return departments;
    return departments.filter(dept => searchMatches.has(`dept:${dept.name}`));
  }, [departments, searchMatches]);

  // Auto-expand departments when searching
  const effectiveExpandedDepts = useMemo(() => {
    if (searchMatches.size > 0) {
      const autoExpanded = new Set(expandedDepts);
      filteredDepartments.forEach(dept => autoExpanded.add(dept.name));
      return autoExpanded;
    }
    return expandedDepts;
  }, [expandedDepts, searchMatches, filteredDepartments]);

  // Auto-expand managers when searching
  const effectiveExpandedManagers = useMemo(() => {
    if (searchMatches.size > 0) {
      const autoExpanded = new Set(expandedManagers);
      searchMatches.forEach(key => {
        if (key.startsWith('manager:')) {
          autoExpanded.add(key.replace('manager:', ''));
        }
      });
      return autoExpanded;
    }
    return expandedManagers;
  }, [expandedManagers, searchMatches]);

  const toggleDept = useCallback((name: string) => {
    setExpandedDepts(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const toggleManager = useCallback((name: string) => {
    setExpandedManagers(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  if (employees.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-10 h-10 text-neutral-muted mx-auto mb-3 opacity-40" />
        <p className="font-ui font-bold text-[14px] text-neutral-muted">لا توجد بيانات موظفين</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* View mode toggle */}
      <div className="flex gap-1 bg-neutral-cream rounded-xl p-1 mb-3">
        <button
          className={`flex-1 px-4 py-2 rounded-lg font-ui font-black text-[13px] transition-all ${viewMode === 'departments' ? 'bg-white shadow-sm text-brand-black' : 'text-neutral-muted'}`}
          onClick={() => { setViewMode('departments'); setSearchQuery(''); }}
        >
          <Building2 className="w-3.5 h-3.5 inline ml-1.5" /> الأقسام
        </button>
        <button
          className={`flex-1 px-4 py-2 rounded-lg font-ui font-black text-[13px] transition-all ${viewMode === 'people' ? 'bg-white shadow-sm text-brand-black' : 'text-neutral-muted'}`}
          onClick={() => { setViewMode('people'); setSearchQuery(''); }}
        >
          <Users className="w-3.5 h-3.5 inline ml-1.5" /> الأشخاص
        </button>
      </div>

      {/* Top bar: search + stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن موظف..."
            className="w-full pr-9 pl-8 py-2 rounded-lg border-2 border-neutral-cream bg-neutral-cream/50 font-ui font-bold text-[13px] text-brand-black placeholder:text-neutral-muted/50 focus:outline-none focus:border-brand-blue/30 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-muted hover:text-brand-red transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-[12px] font-ui font-bold text-neutral-muted">
          <span>{departments.length} قسم</span>
          <span className="text-neutral-warm-gray">|</span>
          <span>{employees.length} موظف</span>
        </div>
      </div>

      {/* Search results indicator */}
      <AnimatePresence>
        {searchQuery.trim() && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-green/5 border border-brand-green/20">
              <Search className="w-3.5 h-3.5 text-brand-green" />
              <span className="font-ui font-bold text-[12px] text-brand-green">
                {searchMatches.size > 0
                  ? 'تم العثور على نتائج'
                  : 'لا توجد نتائج'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Departments Mode ── */}
      {viewMode === 'departments' && (
        <motion.div
          layout
          className="grid grid-cols-1 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {filteredDepartments.map((dept, i) => (
            <motion.div
              key={dept.name}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <DepartmentCard
                dept={dept}
                color={deptColors[dept.name]}
                isExpanded={effectiveExpandedDepts.has(dept.name)}
                onToggle={() => toggleDept(dept.name)}
                searchMatches={searchMatches}
              />
            </motion.div>
          ))}
          {filteredDepartments.length === 0 && searchQuery.trim() && (
            <div className="text-center py-8">
              <p className="font-ui font-bold text-[13px] text-neutral-muted">لا توجد أقسام مطابقة</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ── People Mode ── */}
      {viewMode === 'people' && (
        <motion.div
          layout
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {rootManagers.length === 0 && (
            <div className="text-center py-8">
              <p className="font-ui font-bold text-[13px] text-neutral-muted">لا توجد بيانات التسلسل الإداري</p>
            </div>
          )}
          <AnimatePresence>
            {rootManagers.map((node, i) => (
              <motion.div
                key={node.employee.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <ManagerCard
                  node={node}
                  managerMap={managerMap}
                  deptColors={deptColors}
                  depth={0}
                  searchMatches={searchMatches}
                  expandedManagers={effectiveExpandedManagers}
                  toggleManager={toggleManager}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {viewMode === 'departments' && departments.map(dept => (
          <button
            key={dept.name}
            onClick={() => toggleDept(dept.name)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-neutral-cream hover:border-brand-blue/30 transition-all"
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: deptColors[dept.name] }} />
            <span className="font-ui font-bold text-[11px] text-neutral-muted">{dept.name}</span>
            <span className="font-ui font-black text-[10px] text-neutral-muted/60">{dept.count}</span>
          </button>
        ))}
        {viewMode === 'people' && rootManagers.map(node => (
          <button
            key={node.employee.name}
            onClick={() => toggleManager(node.employee.name)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-neutral-cream hover:border-brand-blue/30 transition-all"
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: deptColors[node.employee.department || 'بدون قسم'] || '#0072F9' }} />
            <span className="font-ui font-bold text-[11px] text-neutral-muted">{node.employee.preferredName || node.employee.name}</span>
            <span className="font-ui font-black text-[10px] text-neutral-muted/60">{node.directReports.length}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
