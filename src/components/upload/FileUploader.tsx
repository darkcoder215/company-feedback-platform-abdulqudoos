'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useData } from '@/context/DataContext';
import Button from '@/components/ui/Button';

interface UploadResult {
  fileName: string;
  type: string;
  count: number;
  success: boolean;
  error?: string;
}

export default function FileUploader({ onClose }: { onClose?: () => void }) {
  const { uploadFile, isLoading } = useData();
  const [isDragOver, setIsDragOver] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadFile(file);
      setResults(prev => [...prev, {
        fileName: file.name,
        type: result.type,
        count: result.count,
        success: result.type !== 'error' && result.type !== 'unknown',
        error: result.type === 'error' ? 'حدث خطأ أثناء قراءة الملف' : undefined,
      }]);
    }
  }, [uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const typeLabel = (type: string) => {
    switch (type) {
      case 'employees': return 'بيانات الموظفين';
      case 'evaluations': return 'تقييمات فترة التجربة';
      case 'reviews': return 'تقييمات الأداء (أناناس)';
      case 'leaders': return 'تقييمات القادة (٣٦٠°)';
      default: return 'غير معروف';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white rounded-lg shadow-md p-8 relative"
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-neutral-muted hover:text-brand-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="text-center mb-6">
        <h2 className="font-display font-bold text-[22px] mb-2">رفع الملفات</h2>
        <p className="font-ui text-[14px] text-neutral-muted">
          ارفع ملفات CSV أو Excel تحتوي على بيانات الموظفين أو تقييمات فترة التجربة
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-300
          ${isDragOver
            ? 'border-brand-green bg-brand-green/5'
            : 'border-neutral-warm-gray hover:border-brand-green/50 hover:bg-neutral-cream'
          }
          ${isLoading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <motion.div
          animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
              <p className="font-ui text-[14px] text-neutral-muted">جارٍ معالجة الملف...</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 mx-auto mb-4 text-neutral-muted" />
              <p className="font-ui font-medium text-[16px] mb-1">
                اسحب الملفات هنا أو اضغط للاختيار
              </p>
              <p className="font-ui text-[13px] text-neutral-muted">
                CSV, XLSX, XLS — يتم التعرف تلقائيًا على نوع البيانات
              </p>
            </>
          )}
        </motion.div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 space-y-3"
          >
            {results.map((result, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`
                  flex items-center gap-3 p-4 rounded-lg
                  ${result.success ? 'bg-score-excellent/5' : 'bg-score-poor/5'}
                `}
              >
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-score-excellent flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-score-poor flex-shrink-0" />
                )}
                <FileSpreadsheet className="w-5 h-5 text-neutral-muted flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-ui font-medium text-[14px]">{result.fileName}</p>
                  <p className="font-ui text-[12px] text-neutral-muted">
                    {result.success
                      ? `${typeLabel(result.type)} — ${result.count} سجل`
                      : result.error || 'فشل في قراءة الملف'
                    }
                  </p>
                </div>
              </motion.div>
            ))}

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setResults([]);
                  fileInputRef.current?.click();
                }}
              >
                رفع ملف آخر
              </Button>
              {onClose && (
                <Button variant="accent" size="sm" onClick={onClose}>
                  تم
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
