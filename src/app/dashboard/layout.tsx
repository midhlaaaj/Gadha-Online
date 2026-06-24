import { Suspense } from "react";
import { DashboardSidebar } from "./_components/DashboardSidebar";
import { ChildSwitcher } from "./_components/ChildSwitcher";

// Skeleton fallback for sidebar
function SidebarSkeleton() {
  return (
    <aside className="hidden md:flex w-[220px] shrink-0 sticky top-[70px] h-[calc(100vh-70px)] bg-white border-r border-[#D0DCF5] flex-col p-5 gap-3">
      <div className="h-3 w-24 rounded-full animate-shimmer" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-9 w-full rounded-xl animate-shimmer" />
      ))}
    </aside>
  );
}

// Skeleton fallback for child switcher bar
function SwitcherSkeleton() {
  return (
    <div className="sticky top-[70px] z-30 bg-[#F5F8FF] border-b border-[#D0DCF5]">
      <div className="max-w-7xl mx-auto w-full px-6 py-3 flex items-center gap-3">
        <div className="h-3 w-16 rounded-full animate-shimmer" />
        <div className="h-9 w-44 rounded-full animate-shimmer" />
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-70px)] bg-[#F5F8FF] font-sans">
      {/* Sticky sidebar */}
      <Suspense fallback={<SidebarSkeleton />}>
        <DashboardSidebar />
      </Suspense>

      {/* Right column: child switcher + page content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Suspense fallback={<SwitcherSkeleton />}>
          <ChildSwitcher />
        </Suspense>

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
