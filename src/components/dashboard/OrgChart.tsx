'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronLeft, Search, Users, X } from 'lucide-react';
import Link from 'next/link';
import type { Employee } from '@/lib/types';

interface TreeNode {
  employee: Employee;
  children: TreeNode[];
}

function buildTree(employees: Employee[]): TreeNode[] {
  const nameSet = new Set(employees.map(e => e.name));
  const childrenMap = new Map<string, TreeNode[]>();

  // Initialize map for every employee name
  employees.forEach(e => {
    if (!childrenMap.has(e.name)) childrenMap.set(e.name, []);
  });

  const roots: TreeNode[] = [];

  employees.forEach(emp => {
    const node: TreeNode = { employee: emp, children: [] };
    const managerName = emp.manager?.trim();

    if (!managerName || !nameSet.has(managerName)) {
      roots.push(node);
    } else {
      const siblings = childrenMap.get(managerName);
      if (siblings) siblings.push(node);
    }
  });

  // Attach children recursively
  function attachChildren(node: TreeNode): TreeNode {
    const kids = childrenMap.get(node.employee.name) || [];
    node.children = kids.map(k => attachChildren(k));
    return node;
  }

  return roots.map(r => attachChildren(r));
}

function countDescendants(node: TreeNode): number {
  return node.children.length + node.children.reduce((s, c) => s + countDescendants(c), 0);
}

function findPathToEmployee(nodes: TreeNode[], targetName: string): Set<string> {
  const path = new Set<string>();

  function search(node: TreeNode): boolean {
    if (node.employee.name.includes(targetName) || node.employee.preferredName?.includes(targetName)) {
      path.add(node.employee.name);
      return true;
    }
    for (const child of node.children) {
      if (search(child)) {
        path.add(node.employee.name);
        return true;
      }
    }
    return false;
  }

  nodes.forEach(n => search(n));
  return path;
}

// ── Department color mapping ──
const DEPT_COLORS: Record<string, string> = {};
const COLOR_PALETTE = ['#0072F9', '#00C17A', '#F24935', '#FFBC0A', '#82003A', '#84DBE5', '#6366f1', '#ec4899', '#f97316', '#14b8a6'];
let colorIdx = 0;
function getDeptColor(dept: string): string {
  if (!dept) return '#94a3b8';
  if (!DEPT_COLORS[dept]) {
    DEPT_COLORS[dept] = COLOR_PALETTE[colorIdx % COLOR_PALETTE.length];
    colorIdx++;
  }
  return DEPT_COLORS[dept];
}

// ── Single Tree Node ──
function OrgNode({
  node,
  depth = 0,
  expandedNodes,
  toggleNode,
  searchMatch,
  isLast = false,
}: {
  node: TreeNode;
  depth?: number;
  expandedNodes: Set<string>;
  toggleNode: (name: string) => void;
  searchMatch: Set<string> | null;
  isLast?: boolean;
}) {
  const emp = node.employee;
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedNodes.has(emp.name);
  const directReports = node.children.length;
  const totalReports = countDescendants(node);
  const deptColor = getDeptColor(emp.department);

  const isHighlighted = searchMatch && searchMatch.has(emp.name);
  const isSearchTarget = searchMatch && (emp.name.includes([...searchMatch][0] || '') || emp.preferredName?.includes([...searchMatch][0] || ''));

  return (
    <div className="relative">
      {/* Connection line from parent */}
      {depth > 0 && (
        <div className="absolute top-0 right-6 w-px h-4 bg-neutral-warm-gray" />
      )}

      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: depth * 0.05 }}
        className={`relative ${depth > 0 ? 'mt-1' : ''}`}
      >
        <div
          className={`
            flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200
            border-2 group
            ${isHighlighted && !isSearchTarget ? 'bg-brand-amber/5 border-brand-amber/20' : ''}
            ${isSearchTarget ? 'bg-brand-green/10 border-brand-green/30 ring-2 ring-brand-green/20' : ''}
            ${!isHighlighted ? 'bg-white border-neutral-cream hover:border-brand-blue/30 hover:shadow-md' : ''}
          `}
          onClick={() => hasChildren && toggleNode(emp.name)}
          style={{ marginRight: depth > 0 ? `${Math.min(depth * 24, 120)}px` : '0' }}
        >
          {/* Expand/collapse button */}
          <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
            {hasChildren ? (
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-6 h-6 rounded-full bg-neutral-cream flex items-center justify-center group-hover:bg-brand-blue/10"
              >
                <ChevronDown className="w-3.5 h-3.5 text-neutral-muted" />
              </motion.div>
            ) : (
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: deptColor }} />
            )}
          </div>

          {/* Avatar circle */}
          <div
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white font-ui font-black text-[13px]"
            style={{ backgroundColor: deptColor }}
          >
            {emp.preferredName?.[0] || emp.name?.[0] || '?'}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/employees/${emp.id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-ui font-black text-[14px] text-brand-black hover:text-brand-blue transition-colors truncate"
              >
                {emp.name}
              </Link>
              {emp.isLeader && (
                <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-ui font-black bg-brand-amber/15 text-brand-amber">
                  قائد
                </span>
              )}
            </div>
            <p className="font-ui font-bold text-[12px] text-neutral-muted truncate">
              {emp.jobTitleAr}
            </p>
          </div>

          {/* Department badge */}
          <div className="hidden sm:flex flex-shrink-0 items-center gap-2">
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-ui font-bold text-white truncate max-w-[120px]"
              style={{ backgroundColor: deptColor }}
            >
              {emp.department}
            </span>
          </div>

          {/* Direct reports count */}
          {hasChildren && (
            <div className="flex-shrink-0 flex items-center gap-1 text-neutral-muted">
              <Users className="w-3.5 h-3.5" />
              <span className="font-ui font-black text-[12px]">{directReports}</span>
              {totalReports > directReports && (
                <span className="font-ui font-bold text-[11px] text-neutral-muted/60">
                  ({totalReports})
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* Vertical connection line */}
            <div
              className="relative"
              style={{ marginRight: `${Math.min((depth + 1) * 24, 120) + 10}px` }}
            >
              <div className="absolute top-0 right-0 w-px bg-neutral-warm-gray" style={{ height: 'calc(100% - 20px)' }} />
            </div>
            <div className="space-y-0.5 pb-1">
              {node.children.map((child, i) => (
                <OrgNode
                  key={child.employee.id}
                  node={child}
                  depth={depth + 1}
                  expandedNodes={expandedNodes}
                  toggleNode={toggleNode}
                  searchMatch={searchMatch}
                  isLast={i === node.children.length - 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main OrgChart Component ──
export default function OrgChart({ employees }: { employees: Employee[] }) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const tree = useMemo(() => buildTree(employees), [employees]);

  // Auto-expand root nodes on first render
  useMemo(() => {
    if (expandedNodes.size === 0 && tree.length > 0) {
      const roots = new Set(tree.map(n => n.employee.name));
      setExpandedNodes(roots);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree]);

  const searchMatch = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return findPathToEmployee(tree, searchQuery.trim());
  }, [tree, searchQuery]);

  // When searching, auto-expand the path
  useMemo(() => {
    if (searchMatch && searchMatch.size > 0) {
      setExpandedNodes(prev => {
        const next = new Set(prev);
        searchMatch.forEach(name => next.add(name));
        return next;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchMatch]);

  const toggleNode = useCallback((name: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const all = new Set<string>();
    function collect(nodes: TreeNode[]) {
      nodes.forEach(n => {
        if (n.children.length > 0) {
          all.add(n.employee.name);
          collect(n.children);
        }
      });
    }
    collect(tree);
    setExpandedNodes(all);
  }, [tree]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set(tree.map(n => n.employee.name)));
  }, [tree]);

  const totalManagers = useMemo(() => {
    let count = 0;
    function walk(nodes: TreeNode[]) {
      nodes.forEach(n => {
        if (n.children.length > 0) count++;
        walk(n.children);
      });
    }
    walk(tree);
    return count;
  }, [tree]);

  if (employees.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-10 h-10 text-neutral-muted mx-auto mb-3 opacity-40" />
        <p className="font-ui font-bold text-[14px] text-neutral-muted">لا توجد بيانات موظفين</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header bar with search and controls */}
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
          <span>{tree.length} جذر</span>
          <span className="text-neutral-warm-gray">|</span>
          <span>{totalManagers} مدير</span>
          <span className="text-neutral-warm-gray">|</span>
          <span>{employees.length} موظف</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 rounded-lg bg-neutral-cream font-ui font-black text-[12px] text-neutral-muted hover:bg-brand-blue/10 hover:text-brand-blue transition-all"
          >
            توسيع الكل
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 rounded-lg bg-neutral-cream font-ui font-black text-[12px] text-neutral-muted hover:bg-brand-blue/10 hover:text-brand-blue transition-all"
          >
            طي الكل
          </button>
        </div>
      </div>

      {/* Search results indicator */}
      <AnimatePresence>
        {searchMatch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-green/5 border border-brand-green/20">
              <Search className="w-3.5 h-3.5 text-brand-green" />
              <span className="font-ui font-bold text-[12px] text-brand-green">
                {searchMatch.size > 0
                  ? `تم العثور على ${searchMatch.size} نتيجة`
                  : 'لا توجد نتائج'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tree */}
      <div className="space-y-1 max-h-[600px] overflow-y-auto overflow-x-hidden rounded-xl pl-1" style={{ scrollbarGutter: 'stable' }}>
        {tree.map((rootNode, i) => (
          <OrgNode
            key={rootNode.employee.id}
            node={rootNode}
            depth={0}
            expandedNodes={expandedNodes}
            toggleNode={toggleNode}
            searchMatch={searchMatch}
            isLast={i === tree.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
