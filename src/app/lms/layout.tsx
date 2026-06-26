"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { StudentAppSidebar } from "./_components/StudentSidebar";

export default function StudentDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/lms/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7FF] font-sans">
      {/* ── Fixed left sidebar ── */}
      <Suspense fallback={
        <aside className="w-[220px] shrink-0 bg-white border-r border-[#E6EBF8] h-screen">
          <div className="h-[64px] border-b border-[#E6EBF8] px-6 flex items-center">
            <div className="h-8 w-32 animate-shimmer rounded-xl" />
          </div>
          <div className="p-4 space-y-2 pt-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 w-full rounded-xl animate-shimmer" />
            ))}
          </div>
        </aside>
      }>
        <StudentAppSidebar />
      </Suspense>

      {/* ── Right column: scrollable content only ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Scrollable page area */}
        <main className="flex-1 overflow-y-auto px-7 py-7 premium-scrollbar">
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
