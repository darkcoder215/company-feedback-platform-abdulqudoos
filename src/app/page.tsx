'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { BarChart3, Users, ClipboardCheck, Building2, ArrowLeft, Upload } from 'lucide-react';
import Button from '@/components/ui/Button';

const features = [
  {
    icon: Users,
    title: 'دليل الموظفين',
    description: 'استعراض وبحث وتصفية بيانات جميع الموظفين مع إحصائيات شاملة',
    color: '#0072F9',
  },
  {
    icon: ClipboardCheck,
    title: 'تحليل فترات التجربة',
    description: 'تقييم أداء الموظفين خلال الفترة التجريبية بمعايير دقيقة ومفصّلة',
    color: '#00C17A',
  },
  {
    icon: BarChart3,
    title: 'رؤى وتحليلات',
    description: 'استخراج الأنماط والرؤى من البيانات لدعم اتخاذ القرار',
    color: '#FFBC0A',
  },
  {
    icon: Building2,
    title: 'تحليل الإدارات',
    description: 'مقارنة أداء الإدارات والفرق مع إحصائيات تفصيلية',
    color: '#FF9172',
  },
];

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-off-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.03, scale: 1 }}
            transition={{ duration: 2 }}
            className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] rounded-full bg-brand-green"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.03, scale: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="absolute -bottom-[100px] -left-[100px] w-[400px] h-[400px] rounded-full bg-brand-blue"
          />
        </div>

        <div className="relative w-full max-w-[1280px] mx-auto px-8 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex justify-center mb-10"
          >
            <div className="bg-brand-black p-5 rounded-2xl shadow-lg">
              <Image
                src="/fonts/thamanyah.png"
                alt="ثمانية"
                width={64}
                height={64}
                className="w-16 h-16"
              />
            </div>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="text-center max-w-[800px] mx-auto"
          >
            <motion.h1
              variants={fadeIn}
              transition={{ duration: 0.6 }}
              className="font-display font-black text-[48px] md:text-[56px] leading-tight mb-6"
            >
              منصة تحليل{' '}
              <span className="relative inline-block">
                <span className="relative z-10">التقييمات</span>
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="absolute bottom-1 right-0 h-3 bg-brand-green-light z-0"
                />
              </span>
            </motion.h1>

            <motion.p
              variants={fadeIn}
              transition={{ duration: 0.6 }}
              className="font-body text-[18px] text-neutral-muted leading-relaxed mb-10 max-w-[600px] mx-auto"
            >
              ارفع بيانات الموظفين وتقييمات فترات التجربة واحصل على رؤى فورية وتحليلات شاملة لدعم قراراتك
            </motion.p>

            <motion.div
              variants={fadeIn}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center gap-4"
            >
              <Link href="/dashboard">
                <Button variant="primary" size="lg" className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  ابدأ الآن
                </Button>
              </Link>
              <a href="#features">
                <Button variant="secondary" size="lg" className="flex items-center gap-2">
                  اكتشف المزيد
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </a>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-6 h-10 border-2 border-neutral-muted/30 rounded-full flex items-start justify-center pt-2"
            >
              <div className="w-1 h-2 bg-neutral-muted/50 rounded-full" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-8">
        <div className="max-w-[1280px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-bold text-[36px] mb-4">
              كل ما تحتاجه في مكان واحد
            </h2>
            <p className="font-body text-[16px] text-neutral-muted max-w-[500px] mx-auto">
              أدوات تحليل متقدمة مصممة خصيصًا لفريق الموارد البشرية في ثمانية
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="font-ui font-bold text-[18px] mb-2">{feature.title}</h3>
                <p className="font-body text-[15px] text-neutral-muted leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-8 bg-brand-black">
        <div className="max-w-[1280px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-bold text-[36px] text-white mb-4">
              كيف تعمل المنصة؟
            </h2>
            <p className="font-body text-[16px] text-white/60 max-w-[500px] mx-auto">
              ثلاث خطوات بسيطة للحصول على تحليلات شاملة
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'ارفع الملفات', desc: 'ارفع ملفات Excel أو CSV تحتوي على بيانات الموظفين أو تقييمات فترة التجربة' },
              { step: '2', title: 'تعرّف تلقائي', desc: 'تتعرف المنصة تلقائيًا على نوع البيانات وتعالجها بذكاء' },
              { step: '3', title: 'استعرض النتائج', desc: 'احصل على لوحة تحكم شاملة مع رسوم بيانية ورؤى قابلة للتنفيذ' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-full bg-brand-green flex items-center justify-center mx-auto mb-5">
                  <span className="font-display font-black text-[24px] text-white">{item.step}</span>
                </div>
                <h3 className="font-ui font-bold text-[18px] text-white mb-2">{item.title}</h3>
                <p className="font-body text-[14px] text-white/50 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-[600px] mx-auto text-center"
        >
          <h2 className="font-display font-bold text-[32px] mb-4">
            جاهز للبدء؟
          </h2>
          <p className="font-body text-[16px] text-neutral-muted mb-8">
            ارفع ملفاتك الآن واكتشف رؤى جديدة عن فريقك
          </p>
          <Link href="/dashboard">
            <Button variant="accent" size="lg" className="flex items-center gap-2 mx-auto">
              <Upload className="w-5 h-5" />
              ابدأ التحليل
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-neutral-warm-gray">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/fonts/thamanyah.png"
              alt="ثمانية"
              width={24}
              height={24}
              className="rounded"
            />
            <span className="font-ui text-[13px] text-neutral-muted">
              منصة تحليل التقييمات — ثمانية
            </span>
          </div>
          <span className="font-ui text-[12px] text-neutral-muted">
            أداة داخلية للموارد البشرية
          </span>
        </div>
      </footer>
    </div>
  );
}
