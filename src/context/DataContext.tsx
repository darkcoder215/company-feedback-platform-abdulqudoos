'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { PlatformData, CleanedData, DataQualityReport } from '@/lib/types';
import { parseFile, parseBuffer } from '@/lib/parser';
import { cleanPlatformData } from '@/lib/data-cleaning';

interface DataContextType {
  data: PlatformData;
  cleanedData: CleanedData | null;
  qualityReport: DataQualityReport | null;
  isLoading: boolean;
  error: string | null;
  uploadFile: (file: File) => Promise<{ type: string; count: number }>;
  clearData: () => void;
  hasData: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DATA_FILES = [
  '/data/employees.csv',
  '/data/probation.csv',
  '/data/ananas.xlsx',
  '/data/leaders.xlsx',
];

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PlatformData>({ employees: [], evaluations: [], reviews: [], leaders: [] });
  const [cleanedData, setCleanedData] = useState<CleanedData | null>(null);
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-load data files on mount
  useEffect(() => {
    let cancelled = false;

    async function loadStaticData() {
      const newData: PlatformData = { employees: [], evaluations: [], reviews: [], leaders: [] };

      for (const path of DATA_FILES) {
        try {
          const res = await fetch(path);
          if (!res.ok) continue;
          const buffer = await res.arrayBuffer();
          const result = parseBuffer(buffer);

          if (result.type === 'employees' && result.employees) {
            newData.employees.push(...result.employees);
          } else if (result.type === 'evaluations' && result.evaluations) {
            newData.evaluations.push(...result.evaluations);
          } else if (result.type === 'reviews' && result.reviews) {
            newData.reviews.push(...result.reviews);
          } else if (result.type === 'leaders' && result.leaders) {
            newData.leaders.push(...result.leaders);
          }
        } catch {
          // Skip files that fail to load
        }
      }

      if (!cancelled) {
        setData(newData);
        setIsLoading(false);
      }
    }

    loadStaticData();
    return () => { cancelled = true; };
  }, []);

  // Re-run cleaning pipeline when data changes (e.g., after file upload)
  useEffect(() => {
    if (data.employees.length > 0 || data.evaluations.length > 0) {
      const cleaned = cleanPlatformData(data);
      setCleanedData(cleaned);
      setQualityReport(cleaned.qualityReport);
    }
  }, [data]);

  const uploadFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await parseFile(file);

      if (result.error) {
        setError(result.error);
        return { type: 'error', count: 0 };
      }

      if (result.type === 'employees' && result.employees) {
        setData(prev => ({ ...prev, employees: [...prev.employees, ...result.employees!] }));
        return { type: 'employees', count: result.employees.length };
      }

      if (result.type === 'evaluations' && result.evaluations) {
        setData(prev => ({ ...prev, evaluations: [...prev.evaluations, ...result.evaluations!] }));
        return { type: 'evaluations', count: result.evaluations.length };
      }

      if (result.type === 'reviews' && result.reviews) {
        setData(prev => ({ ...prev, reviews: [...prev.reviews, ...result.reviews!] }));
        return { type: 'reviews', count: result.reviews.length };
      }

      if (result.type === 'leaders' && result.leaders) {
        setData(prev => ({ ...prev, leaders: [...prev.leaders, ...result.leaders!] }));
        return { type: 'leaders', count: result.leaders.length };
      }

      setError('لم يتم التعرف على نوع الملف');
      return { type: 'unknown', count: 0 };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setData({ employees: [], evaluations: [], reviews: [], leaders: [] });
    setCleanedData(null);
    setQualityReport(null);
    setError(null);
  }, []);

  const hasData = data.employees.length > 0 || data.evaluations.length > 0 || data.reviews.length > 0 || data.leaders.length > 0;

  return (
    <DataContext.Provider value={{ data, cleanedData, qualityReport, isLoading, error, uploadFile, clearData, hasData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
