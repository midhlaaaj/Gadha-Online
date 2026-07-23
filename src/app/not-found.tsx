import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 – Page Not Found | Gadha Online",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-surface text-center px-6 py-24 min-h-[calc(100vh-70px)]">
      {/* Large 404 */}
      <p className="font-heading text-[120px] md:text-[180px] font-extrabold leading-none text-primary/8 select-none">
        404
      </p>

      {/* Content overlapping the big number */}
      <div className="-mt-10 md:-mt-16 flex flex-col items-center gap-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-badge-bg text-badge-text border border-badge-border uppercase tracking-wider">
          Page not found
        </span>

        <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-primary max-w-md leading-tight">
          Oops, this page doesn&apos;t exist
        </h1>

        <p className="text-sm text-text-muted max-w-sm leading-relaxed">
          The page you&apos;re looking for may have been moved, deleted, or
          never existed. Let&apos;s get you back on track.
        </p>

        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Link
            href="/"
            className="text-sm font-semibold px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 hover:shadow-md transition-all"
          >
            Go home
          </Link>
          <Link
            href="/mentors"
            className="text-sm font-semibold px-6 py-3 rounded-lg border-2 border-primary text-primary hover:bg-primary/5 transition-all"
          >
            Browse mentors
          </Link>
        </div>
      </div>
    </div>
  );
}
