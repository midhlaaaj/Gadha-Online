"use client";

import React from "react";

interface MobileStickyBookingBarProps {
  price: number;
  priceSuffix?: string;
  ctaLabel?: string;
  onCtaClick: () => void;
}

export function MobileStickyBookingBar({
  price,
  priceSuffix = "",
  ctaLabel = "Book now",
  onCtaClick,
}: MobileStickyBookingBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E6EBF8] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden flex items-center justify-between gap-4 font-sans">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-[#4A5A7A] uppercase tracking-wider">Total Price</span>
        <div className="flex items-baseline gap-1">
          <span className="font-heading text-xl font-extrabold text-[#1B3A6B]">
            ₹{price?.toLocaleString("en-IN")}
          </span>
          {priceSuffix && (
            <span className="text-xs font-semibold text-[#4A5A7A]">{priceSuffix}</span>
          )}
        </div>
      </div>

      <button
        onClick={onCtaClick}
        className="flex-1 max-w-[200px] text-xs sm:text-sm font-bold py-3 px-5 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-[#2F7FE8]/20 text-center"
      >
        {ctaLabel}
      </button>
    </div>
  );
}
