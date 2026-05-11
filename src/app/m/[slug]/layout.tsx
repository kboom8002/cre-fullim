import { ReactNode } from "react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "투자 메모 (Mobile IM) | JS CRE",
  description: "모바일에서 확인하는 예비 검토용 투자 설명서입니다."
};

export default function MobileIMLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col ${inter.className}`}>
      {/* Simple JS Branding Header */}
      <header className="h-14 bg-slate-900 flex items-center px-4 shrink-0">
        <div className="font-semibold text-white tracking-wide text-lg">
          JS<span className="text-slate-400 font-light ml-1">CRE</span>
        </div>
      </header>
      
      {/* Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto bg-white shadow-xl relative overflow-hidden">
        {children}
      </main>
    </div>
  );
}
