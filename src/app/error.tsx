"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 font-sans">
      <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-5">
        <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="font-heading text-xl font-extrabold text-[#1B3A6B] mb-1.5">
        Something went wrong
      </h1>
      <p className="text-sm text-[#4A5A7A] max-w-sm mb-6">
        We hit an unexpected error loading this page. Please try again — if the problem keeps happening, contact support.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-[#2F7FE8] text-white text-sm font-bold rounded-xl hover:bg-[#1B3A6B] transition-colors cursor-pointer"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 bg-white text-[#1B3A6B] text-sm font-bold rounded-xl border border-[#D0DCF5] hover:bg-slate-50 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
