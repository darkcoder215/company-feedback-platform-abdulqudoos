'use client';

import { DataProvider, useData } from '@/context/DataContext';
import Sidebar from './Sidebar';
import LoadingBanner from './LoadingBanner';
import { AnimatePresence } from 'framer-motion';

function AppContent({ children }: { children: React.ReactNode }) {
  const { isLoading } = useData();

  return (
    <>
      <AnimatePresence>
        {isLoading && <LoadingBanner />}
      </AnimatePresence>
      <div className={`min-h-screen bg-neutral-off-white transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        <Sidebar />
        <main className="mr-[260px] min-h-screen">
          {children}
        </main>
      </div>
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <AppContent>{children}</AppContent>
    </DataProvider>
  );
}
