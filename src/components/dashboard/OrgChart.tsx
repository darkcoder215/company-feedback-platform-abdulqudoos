'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Users } from 'lucide-react';
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

// ── Radial layout helpers ──
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Scale bubble radius based on employee count
function bubbleRadius(count: number, min: number, max: number, minR: number, maxR: number): number {
  if (max === min) return (minR + maxR) / 2;
  const t = (count - min) / (max - min);
  return minR + t * (maxR - minR);
}

// Truncate text to fit inside a circle
function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 1) + '..';
}

// ── SVG Components ──

function CenterBubble({ cx, cy, r, isActive }: { cx: number; cy: number; r: number; isActive: boolean }) {
  return (
    <motion.g
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      {/* Glow */}
      <motion.circle
        cx={cx} cy={cy} r={r + 6}
        fill="none"
        stroke="#0072F9"
        strokeWidth={2}
        strokeDasharray="6 4"
        opacity={0.3}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      <circle cx={cx} cy={cy} r={r} fill="#0072F9" opacity={0.12} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#0072F9" strokeWidth={2.5} />
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#0072F9" fontSize={16} fontWeight={900} fontFamily="inherit">
        ثمانية
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#0072F9" fontSize={11} fontWeight={600} opacity={0.7} fontFamily="inherit">
        {isActive ? 'اضغط للعودة' : 'الهيكل التنظيمي'}
      </text>
    </motion.g>
  );
}

function ConnectionLine({ x1, y1, x2, y2, color, delay = 0 }: { x1: number; y1: number; x2: number; y2: number; color: string; delay?: number }) {
  return (
    <motion.line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color}
      strokeWidth={1.5}
      strokeDasharray="6 3"
      opacity={0.35}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.35 }}
      transition={{ duration: 0.6, delay }}
    />
  );
}

function DeptBubble({
  dept,
  cx,
  cy,
  r,
  color,
  delay,
  isHighlighted,
  isSearchMatch,
  onHover,
  onLeave,
  onClick,
}: {
  dept: DeptData;
  cx: number;
  cy: number;
  r: number;
  color: string;
  delay: number;
  isHighlighted: boolean;
  isSearchMatch: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const maxChars = Math.max(6, Math.floor(r / 5));

  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 20, delay }}
      style={{ cursor: 'pointer' }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {/* Search match ring */}
      {isSearchMatch && (
        <motion.circle
          cx={cx} cy={cy} r={r + 6}
          fill="none"
          stroke="#00C17A"
          strokeWidth={3}
          animate={{ r: [r + 6, r + 10, r + 6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      {/* Hover ring */}
      {isHighlighted && !isSearchMatch && (
        <motion.circle
          cx={cx} cy={cy} r={r + 4}
          fill="none"
          stroke={color}
          strokeWidth={2}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
        />
      )}
      {/* Main bubble */}
      <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.15} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={2} />
      {/* Department name */}
      <text x={cx} y={cy - 6} textAnchor="middle" fill={color} fontSize={Math.min(13, r / 2.5)} fontWeight={800} fontFamily="inherit">
        {truncateText(dept.name, maxChars)}
      </text>
      {/* Count */}
      <text x={cx} y={cy + 10} textAnchor="middle" fill={color} fontSize={Math.min(11, r / 3)} fontWeight={600} opacity={0.7} fontFamily="inherit">
        {dept.count} موظف
      </text>
      {/* Teams count small text */}
      <text x={cx} y={cy + 22} textAnchor="middle" fill={color} fontSize={Math.min(9, r / 4)} fontWeight={500} opacity={0.5} fontFamily="inherit">
        {dept.teams.size} فريق
      </text>
    </motion.g>
  );
}

function TeamBubble({
  teamName,
  members,
  cx,
  cy,
  r,
  color,
  delay,
  isHighlighted,
  isSearchMatch,
  onHover,
  onLeave,
  onClick,
}: {
  teamName: string;
  members: Employee[];
  cx: number;
  cy: number;
  r: number;
  color: string;
  delay: number;
  isHighlighted: boolean;
  isSearchMatch: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const maxChars = Math.max(4, Math.floor(r / 5));

  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18, delay }}
      style={{ cursor: 'pointer' }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {isSearchMatch && (
        <motion.circle
          cx={cx} cy={cy} r={r + 4}
          fill="none"
          stroke="#00C17A"
          strokeWidth={2.5}
          animate={{ r: [r + 4, r + 7, r + 4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      {isHighlighted && !isSearchMatch && (
        <motion.circle
          cx={cx} cy={cy} r={r + 3}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
        />
      )}
      <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.1} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={1.5} />
      <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize={Math.min(11, r / 2.2)} fontWeight={700} fontFamily="inherit">
        {truncateText(teamName, maxChars)}
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fill={color} fontSize={Math.min(9, r / 2.8)} fontWeight={500} opacity={0.7} fontFamily="inherit">
        {members.length}
      </text>
    </motion.g>
  );
}

function EmployeeNode({
  emp,
  cx,
  cy,
  r,
  color,
  delay,
  isSearchMatch,
  isHighlighted,
  onHover,
  onLeave,
}: {
  emp: Employee;
  cx: number;
  cy: number;
  r: number;
  color: string;
  delay: number;
  isSearchMatch: boolean;
  isHighlighted: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18, delay }}
      style={{ cursor: 'pointer' }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {isSearchMatch && (
        <motion.circle
          cx={cx} cy={cy} r={r + 3}
          fill="none"
          stroke="#00C17A"
          strokeWidth={2}
          animate={{ r: [r + 3, r + 6, r + 3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      <circle cx={cx} cy={cy} r={r} fill={color} opacity={isHighlighted ? 0.35 : 0.2} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={isHighlighted ? 2 : 1} />
      <text x={cx} y={cy + 1} textAnchor="middle" fill="white" fontSize={r * 0.85} fontWeight={800} fontFamily="inherit">
        {emp.preferredName?.[0] || emp.name?.[0] || '?'}
      </text>
      {/* Name below the circle */}
      <text x={cx} y={cy + r + 11} textAnchor="middle" fill={color} fontSize={8} fontWeight={600} opacity={0.8} fontFamily="inherit">
        {truncateText(emp.preferredName || emp.name, 10)}
      </text>
    </motion.g>
  );
}

// ── Tooltip Component (HTML overlay) ──
function Tooltip({ info, x, y, containerRef }: { info: { title: string; subtitle?: string; detail?: string; color: string }; x: number; y: number; containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const svgEl = containerRef.current.querySelector('svg');
      if (svgEl) {
        const svgRect = svgEl.getBoundingClientRect();
        const viewBox = svgEl.viewBox.baseVal;
        const scaleX = svgRect.width / viewBox.width;
        const scaleY = svgRect.height / viewBox.height;
        setPos({
          left: svgRect.left - rect.left + x * scaleX,
          top: svgRect.top - rect.top + y * scaleY - 10,
        });
      }
    }
  }, [x, y, containerRef]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute z-50 pointer-events-none"
      style={{ left: pos.left, top: pos.top, transform: 'translate(-50%, -100%)' }}
    >
      <div className="bg-white rounded-xl shadow-lg border-2 px-3 py-2 min-w-[120px]" style={{ borderColor: info.color }}>
        <p className="font-ui font-black text-[13px] text-brand-black text-center">{info.title}</p>
        {info.subtitle && <p className="font-ui font-bold text-[11px] text-neutral-muted text-center">{info.subtitle}</p>}
        {info.detail && <p className="font-ui font-bold text-[10px] text-neutral-muted/70 text-center mt-0.5">{info.detail}</p>}
      </div>
    </motion.div>
  );
}

// ── Main OrgChart Component ──
export default function OrgChart({ employees }: { employees: Employee[] }) {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredNode, setHoveredNode] = useState<{ info: { title: string; subtitle?: string; detail?: string; color: string }; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build department data
  const departments = useMemo(() => buildDeptData(employees), [employees]);
  const deptColors = useMemo(() => getDeptColorMap(departments.map(d => d.name)), [departments]);

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
      }
    });
    return matches;
  }, [searchQuery, employees]);

  // Auto-navigate to department when searching
  useEffect(() => {
    if (searchMatches.size > 0 && !selectedDept) {
      // Find the first matching department
      for (const key of searchMatches) {
        if (key.startsWith('dept:')) {
          setSelectedDept(key.replace('dept:', ''));
          break;
        }
      }
    }
  }, [searchMatches, selectedDept]);

  const handleBack = useCallback(() => {
    if (selectedTeam) {
      setSelectedTeam(null);
    } else if (selectedDept) {
      setSelectedDept(null);
    }
  }, [selectedDept, selectedTeam]);

  // ── SVG dimensions ──
  const SVG_W = 800;
  const SVG_H = 600;
  const CENTER_X = SVG_W / 2;
  const CENTER_Y = SVG_H / 2;
  const CENTER_R = 45;

  // ── Overview: departments around center ──
  const renderOverview = () => {
    const counts = departments.map(d => d.count);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);
    const deptRadius = Math.min(SVG_W, SVG_H) * 0.32;
    const minBubbleR = 35;
    const maxBubbleR = 60;
    const angleStep = 360 / departments.length;

    return (
      <>
        {/* Connection lines */}
        {departments.map((dept, i) => {
          const angle = i * angleStep;
          const pos = polarToCartesian(CENTER_X, CENTER_Y, deptRadius, angle);
          return (
            <ConnectionLine
              key={`line-${dept.name}`}
              x1={CENTER_X} y1={CENTER_Y}
              x2={pos.x} y2={pos.y}
              color={deptColors[dept.name]}
              delay={i * 0.05}
            />
          );
        })}

        {/* Center */}
        <CenterBubble cx={CENTER_X} cy={CENTER_Y} r={CENTER_R} isActive={false} />

        {/* Department bubbles */}
        {departments.map((dept, i) => {
          const angle = i * angleStep;
          const pos = polarToCartesian(CENTER_X, CENTER_Y, deptRadius, angle);
          const r = bubbleRadius(dept.count, minCount, maxCount, minBubbleR, maxBubbleR);
          const color = deptColors[dept.name];
          const isDeptSearchMatch = searchMatches.has(`dept:${dept.name}`);

          return (
            <DeptBubble
              key={dept.name}
              dept={dept}
              cx={pos.x}
              cy={pos.y}
              r={r}
              color={color}
              delay={0.1 + i * 0.06}
              isHighlighted={hoveredNode?.info.title === dept.name}
              isSearchMatch={isDeptSearchMatch}
              onHover={() => setHoveredNode({
                info: { title: dept.name, subtitle: `${dept.count} موظف - ${dept.teams.size} فريق`, color },
                x: pos.x, y: pos.y - r - 5,
              })}
              onLeave={() => setHoveredNode(null)}
              onClick={() => { setSelectedDept(dept.name); setHoveredNode(null); }}
            />
          );
        })}
      </>
    );
  };

  // ── Department drill-down: teams around department center ──
  const renderDepartmentView = () => {
    const dept = departments.find(d => d.name === selectedDept);
    if (!dept) return null;

    const color = deptColors[dept.name];
    const teamsArr = Array.from(dept.teams.entries()).sort((a, b) => b[1].length - a[1].length);
    const teamCounts = teamsArr.map(([, m]) => m.length);
    const minCount = Math.min(...teamCounts);
    const maxCount = Math.max(...teamCounts);
    const teamOrbitR = Math.min(SVG_W, SVG_H) * 0.3;
    const minBubbleR = 28;
    const maxBubbleR = 50;
    const angleStep = 360 / teamsArr.length;

    return (
      <>
        {/* Connection lines */}
        {teamsArr.map(([teamName], i) => {
          const angle = i * angleStep;
          const pos = polarToCartesian(CENTER_X, CENTER_Y, teamOrbitR, angle);
          return (
            <ConnectionLine
              key={`tline-${teamName}`}
              x1={CENTER_X} y1={CENTER_Y}
              x2={pos.x} y2={pos.y}
              color={color}
              delay={i * 0.05}
            />
          );
        })}

        {/* Department center */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <circle cx={CENTER_X} cy={CENTER_Y} r={CENTER_R + 5} fill={color} opacity={0.12} />
          <circle cx={CENTER_X} cy={CENTER_Y} r={CENTER_R + 5} fill="none" stroke={color} strokeWidth={2.5} />
          <text x={CENTER_X} y={CENTER_Y - 8} textAnchor="middle" fill={color} fontSize={14} fontWeight={900} fontFamily="inherit">
            {truncateText(dept.name, 12)}
          </text>
          <text x={CENTER_X} y={CENTER_Y + 10} textAnchor="middle" fill={color} fontSize={11} fontWeight={600} opacity={0.7} fontFamily="inherit">
            {dept.count} موظف
          </text>
        </motion.g>

        {/* Team bubbles */}
        {teamsArr.map(([teamName, members], i) => {
          const angle = i * angleStep;
          const pos = polarToCartesian(CENTER_X, CENTER_Y, teamOrbitR, angle);
          const r = bubbleRadius(members.length, minCount, maxCount, minBubbleR, maxBubbleR);
          const isTeamSearchMatch = searchMatches.has(`team:${dept.name}:${teamName}`);

          return (
            <TeamBubble
              key={teamName}
              teamName={teamName}
              members={members}
              cx={pos.x}
              cy={pos.y}
              r={r}
              color={color}
              delay={0.1 + i * 0.05}
              isHighlighted={hoveredNode?.info.title === teamName}
              isSearchMatch={isTeamSearchMatch}
              onHover={() => {
                const leaders = members.filter(m => m.isLeader);
                setHoveredNode({
                  info: {
                    title: teamName,
                    subtitle: `${members.length} موظف`,
                    detail: leaders.length > 0 ? `قائد: ${leaders[0].preferredName || leaders[0].name}` : undefined,
                    color,
                  },
                  x: pos.x, y: pos.y - r - 5,
                });
              }}
              onLeave={() => setHoveredNode(null)}
              onClick={() => { setSelectedTeam(teamName); setHoveredNode(null); }}
            />
          );
        })}
      </>
    );
  };

  // ── Team drill-down: employees around team center ──
  const renderTeamView = () => {
    const dept = departments.find(d => d.name === selectedDept);
    if (!dept) return null;
    const members = dept.teams.get(selectedTeam!) || [];
    if (members.length === 0) return null;

    const color = deptColors[dept.name];
    const empOrbitR = Math.min(SVG_W, SVG_H) * 0.28;
    const empR = Math.max(12, Math.min(20, 200 / members.length));
    const angleStep = 360 / members.length;

    return (
      <>
        {/* Connection lines */}
        {members.map((emp, i) => {
          const angle = i * angleStep;
          const pos = polarToCartesian(CENTER_X, CENTER_Y, empOrbitR, angle);
          return (
            <ConnectionLine
              key={`eline-${emp.id}`}
              x1={CENTER_X} y1={CENTER_Y}
              x2={pos.x} y2={pos.y}
              color={color}
              delay={i * 0.03}
            />
          );
        })}

        {/* Team center */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <circle cx={CENTER_X} cy={CENTER_Y} r={40} fill={color} opacity={0.12} />
          <circle cx={CENTER_X} cy={CENTER_Y} r={40} fill="none" stroke={color} strokeWidth={2} />
          <text x={CENTER_X} y={CENTER_Y - 6} textAnchor="middle" fill={color} fontSize={13} fontWeight={800} fontFamily="inherit">
            {truncateText(selectedTeam!, 10)}
          </text>
          <text x={CENTER_X} y={CENTER_Y + 10} textAnchor="middle" fill={color} fontSize={10} fontWeight={600} opacity={0.7} fontFamily="inherit">
            {members.length} موظف
          </text>
        </motion.g>

        {/* Employee nodes */}
        {members.map((emp, i) => {
          const angle = i * angleStep;
          const pos = polarToCartesian(CENTER_X, CENTER_Y, empOrbitR, angle);
          const isMatch = searchMatches.has(emp.id);

          return (
            <EmployeeNode
              key={emp.id}
              emp={emp}
              cx={pos.x}
              cy={pos.y}
              r={empR}
              color={color}
              delay={0.08 + i * 0.03}
              isSearchMatch={isMatch}
              isHighlighted={hoveredNode?.info.title === emp.name}
              onHover={() => setHoveredNode({
                info: {
                  title: emp.preferredName || emp.name,
                  subtitle: emp.jobTitleAr,
                  detail: emp.isLeader ? 'قائد الفريق' : undefined,
                  color,
                },
                x: pos.x, y: pos.y - empR - 5,
              })}
              onLeave={() => setHoveredNode(null)}
            />
          );
        })}
      </>
    );
  };

  // Current breadcrumb label
  const breadcrumb = useMemo(() => {
    if (selectedTeam && selectedDept) return `${selectedDept} / ${selectedTeam}`;
    if (selectedDept) return selectedDept;
    return null;
  }, [selectedDept, selectedTeam]);

  if (employees.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-10 h-10 text-neutral-muted mx-auto mb-3 opacity-40" />
        <p className="font-ui font-bold text-[14px] text-neutral-muted">لا توجد بيانات موظفين</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Top bar: search + navigation */}
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
              onClick={() => { setSearchQuery(''); }}
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

        {/* Back button */}
        <AnimatePresence>
          {breadcrumb && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-cream font-ui font-black text-[12px] text-neutral-muted hover:bg-brand-blue/10 hover:text-brand-blue transition-all"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              رجوع
            </motion.button>
          )}
        </AnimatePresence>
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
                  ? `تم العثور على نتائج`
                  : 'لا توجد نتائج'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumb */}
      {breadcrumb && (
        <div className="mb-2 flex items-center gap-2">
          <button onClick={() => { setSelectedDept(null); setSelectedTeam(null); }} className="font-ui font-bold text-[12px] text-brand-blue hover:underline">
            ثمانية
          </button>
          <span className="text-neutral-muted text-[12px]">/</span>
          {selectedDept && (
            <button
              onClick={() => { setSelectedTeam(null); }}
              className={`font-ui font-bold text-[12px] ${selectedTeam ? 'text-brand-blue hover:underline' : 'text-brand-black'}`}
            >
              {selectedDept}
            </button>
          )}
          {selectedTeam && (
            <>
              <span className="text-neutral-muted text-[12px]">/</span>
              <span className="font-ui font-bold text-[12px] text-brand-black">{selectedTeam}</span>
            </>
          )}
        </div>
      )}

      {/* SVG Visualization */}
      <div className="relative bg-neutral-cream/30 rounded-2xl border-2 border-neutral-cream overflow-hidden">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full"
          style={{ minHeight: 400, maxHeight: 600 }}
        >
          {/* Background pattern */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="0.5" fill="#94a3b8" opacity="0.2" />
            </pattern>
          </defs>
          <rect width={SVG_W} height={SVG_H} fill="url(#grid)" />

          <AnimatePresence mode="wait">
            {!selectedDept && (
              <motion.g key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                {renderOverview()}
              </motion.g>
            )}
            {selectedDept && !selectedTeam && (
              <motion.g key={`dept-${selectedDept}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                {renderDepartmentView()}
              </motion.g>
            )}
            {selectedDept && selectedTeam && (
              <motion.g key={`team-${selectedTeam}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                {renderTeamView()}
              </motion.g>
            )}
          </AnimatePresence>
        </svg>

        {/* Tooltip overlay */}
        <AnimatePresence>
          {hoveredNode && (
            <Tooltip
              info={hoveredNode.info}
              x={hoveredNode.x}
              y={hoveredNode.y}
              containerRef={containerRef}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-2">
        {departments.map(dept => (
          <button
            key={dept.name}
            onClick={() => { setSelectedDept(dept.name); setSelectedTeam(null); }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-neutral-cream hover:border-brand-blue/30 transition-all"
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: deptColors[dept.name] }} />
            <span className="font-ui font-bold text-[11px] text-neutral-muted">{dept.name}</span>
            <span className="font-ui font-black text-[10px] text-neutral-muted/60">{dept.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
