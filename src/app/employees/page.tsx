'use client';

import { useData } from '@/context/DataContext';
import TopBar from '@/components/layout/TopBar';
import EmployeeTable from '@/components/employees/EmployeeTable';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Upload } from 'lucide-react';

export default function EmployeesPage() {
  const { data } = useData();

  return (
    <div>
      <TopBar title="الموظفون" />
      <div className="p-8">
        {data.employees.length === 0 ? (
          <div className="text-center py-20">
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
        ) : (
          <EmployeeTable employees={data.employees} />
        )}
      </div>
    </div>
  );
}
