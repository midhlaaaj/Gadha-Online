import React from "react";

/** Shimmering placeholder block — swap in for any `bg-slate-200` skeleton fill. */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-shimmer rounded ${className}`}></div>;
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-[#E6EBF8] rounded-2xl overflow-hidden hover:shadow-md transition-shadow relative flex flex-col justify-between">
      <div>
        {/* Cover image or subject color icon area */}
        <SkeletonBlock className="w-full h-28 rounded-none border-b border-[#E6EBF8]" />
        <div className="p-5 space-y-3.5">
          {/* Format / Type badge */}
          <SkeletonBlock className="h-3 w-16" />
          {/* Course / Session Title */}
          <SkeletonBlock className="h-4 w-3/4" />
          {/* Metadata / rating / student count */}
          <SkeletonBlock className="h-3.5 w-1/2" />
        </div>
      </div>
      <div>
        {/* Footer info: price & status */}
        <div className="p-5 border-t border-[#E6EBF8]/50 flex items-center justify-between">
          <SkeletonBlock className="h-4 w-16" />
          <SkeletonBlock className="h-6 rounded-full w-14" />
        </div>
        {/* View Details action button */}
        <div className="px-5 pb-5 pt-0">
          <SkeletonBlock className="h-8 rounded-xl w-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr className="border-b border-[#E6EBF8]/50">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="w-8 h-8 rounded-full shrink-0" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
      </td>
      <td className="py-3 px-4">
        <SkeletonBlock className="h-3 w-32" />
      </td>
      <td className="py-3 px-4">
        <SkeletonBlock className="h-3 w-16" />
      </td>
      <td className="py-3 px-4">
        <SkeletonBlock className="h-3 w-20" />
      </td>
      <td className="py-3 px-4">
        <SkeletonBlock className="h-6 w-14" />
      </td>
    </tr>
  );
}

/** No-image detail card — header (badge/id + title, optional avatar), N detail lines, footer buttons. */
export function SkeletonDetailCard({
  avatar = false,
  lines = 4,
  buttons = 2,
}: {
  avatar?: boolean;
  lines?: number;
  buttons?: number;
}) {
  return (
    <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-start gap-3 mb-4">
          {avatar && <SkeletonBlock className="w-10 h-10 rounded-full shrink-0" />}
          <div className="flex-1 space-y-1.5">
            <SkeletonBlock className="h-3.5 w-2/3" />
            <SkeletonBlock className="h-2.5 w-1/2" />
          </div>
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: lines }).map((_, i) => (
            <SkeletonBlock key={i} className="h-2.5 w-full" />
          ))}
        </div>
      </div>
      <div className="flex gap-2 border-t border-[#E6EBF8] pt-3 mt-4">
        {Array.from({ length: buttons }).map((_, i) => (
          <SkeletonBlock key={i} className={`h-8 rounded-xl ${i === 0 ? "flex-1" : "w-16"}`} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonMetric() {
  return (
    <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 flex flex-col justify-between shadow-sm h-32">
      <SkeletonBlock className="w-[38px] h-[38px] rounded-xl mb-3" />
      <div className="space-y-1.5">
        <SkeletonBlock className="h-2.5 w-20" />
        <SkeletonBlock className="h-6 w-28" />
      </div>
    </div>
  );
}
