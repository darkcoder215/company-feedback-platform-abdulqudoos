'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { PlatformData } from '@/lib/types';
import { parseFile } from '@/lib/parser';

interface DataContextType {
  data: PlatformData;
  isLoading: boolean;
  error: string | null;
  uploadFile: (file: File) => Promise<{ type: string; count: number }>;
  clearData: () => void;
  hasData: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PlatformData>({ employees: [], evaluations: [], reviews: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setData(prev => ({
          ...prev,
          employees: [...prev.employees, ...result.employees!],
        }));
        return { type: 'employees', count: result.employees.length };
      }

      if (result.type === 'evaluations' && result.evaluations) {
        setData(prev => ({
          ...prev,
          evaluations: [...prev.evaluations, ...result.evaluations!],
        }));
        return { type: 'evaluations', count: result.evaluations.length };
      }

      if (result.type === 'reviews' && result.reviews) {
        setData(prev => ({
          ...prev,
          reviews: [...prev.reviews, ...result.reviews!],
        }));
        return { type: 'reviews', count: result.reviews.length };
      }

      setError('لم يتم التعرف على نوع الملف');
      return { type: 'unknown', count: 0 };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setData({ employees: [], evaluations: [], reviews: [] });
    setError(null);
  }, []);

  const hasData = data.employees.length > 0 || data.evaluations.length > 0 || data.reviews.length > 0;

  return (
    <DataContext.Provider value={{ data, isLoading, error, uploadFile, clearData, hasData }}>
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
