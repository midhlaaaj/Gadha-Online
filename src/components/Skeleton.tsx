import React from "react";

export function SkeletonCard() {
  return (
    <div className="bg-white border border-[#E6EBF8] rounded-2xl overflow-hidden hover:shadow-md transition-shadow relative flex flex-col justify-between animate-pulse">
      <div>
        {/* Cover image or subject color icon area */}
        <div className="w-full h-28 bg-slate-200 border-b border-[#E6EBF8]"></div>
        <div className="p-5 space-y-3.5">
          {/* Format / Type badge */}
          <div className="h-3 bg-slate-200 rounded w-16"></div>
          {/* Course / Session Title */}
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          {/* Metadata / rating / student count */}
          <div className="h-3.5 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
      <div>
        {/* Footer info: price & status */}
        <div className="p-5 border-t border-[#E6EBF8]/50 flex items-center justify-between">
          <div className="h-4 bg-slate-200 rounded w-16"></div>
          <div className="h-6 bg-slate-200 rounded-full w-14"></div>
        </div>
        {/* View Details action button */}
        <div className="px-5 pb-5 pt-0">
          <div className="h-8 bg-slate-200 rounded-xl w-full"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-[#E6EBF8]/50">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0"></div>
          <div className="h-3 bg-slate-200 rounded w-24"></div>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="h-3 bg-slate-200 rounded w-32"></div>
      </td>
      <td className="py-3 px-4">
        <div className="h-3 bg-slate-200 rounded w-16"></div>
      </td>
      <td className="py-3 px-4">
        <div className="h-3 bg-slate-200 rounded w-20"></div>
      </td>
      <td className="py-3 px-4">
        <div className="h-6 bg-slate-200 rounded w-14"></div>
      </td>
    </tr>
  );
}

export function SkeletonMetric() {
  return (
    <div className="bg-white border border-[#E6EBF8] rounded-2xl p-5 flex flex-col justify-between shadow-sm animate-pulse h-32">
      <div className="w-[38px] h-[38px] rounded-xl bg-slate-200 mb-3"></div>
      <div className="space-y-1.5">
        <div className="h-2.5 bg-slate-200 rounded w-20"></div>
        <div className="h-6 bg-slate-200 rounded w-28"></div>
      </div>
    </div>
  );
}
