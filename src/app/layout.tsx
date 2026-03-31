import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "منصة تحليل التقييمات — ثمانية",
  description: "منصة تحليل تقييمات الموظفين وفترات التجربة لشركة ثمانية",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-ui bg-neutral-off-white text-brand-black antialiased">
        {children}
      </body>
    </html>
  );
}
