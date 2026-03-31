'use client';

import { DataProvider } from '@/context/DataContext';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <div className="min-h-screen bg-neutral-off-white">
        <Sidebar />
        <main className="mr-[260px] min-h-screen">
          {children}
        </main>
      </div>
    </DataProvider>
  );
}
