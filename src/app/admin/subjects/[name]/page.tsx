"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { IconChevronLeft, IconBook, IconClock } from "@tabler/icons-react";
import { getSubjectDetails } from "../../../actions";

type SubjectDetails = Awaited<ReturnType<typeof getSubjectDetails>>;

export default function SubjectDetailsPage({ params }: { params: Promise<{ name: string }> }) {
  const { name: encodedName } = use(params);
  const name = decodeURIComponent(encodedName);

  const [data, setData] = useState<SubjectDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getSubjectDetails(name);
        setData(res);
      } catch (err) {
        console.error("Failed to load subject details:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [name]);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/subjects"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7A99] hover:text-[#1B3A6B] transition-colors"
      >
        <IconChevronLeft className="w-3.5 h-3.5" />
        Back to Subjects
      </Link>

      <h2 className="font-heading text-xl font-extrabold text-[#1B3A6B]">{name}</h2>

      {loading ? (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-4 w-4 rounded bg-slate-100 animate-shimmer"></div>
              <div className="h-3.5 w-28 bg-slate-200 rounded animate-shimmer"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-[#E6EBF8] rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-14 rounded-full bg-slate-100 animate-shimmer"></div>
                    <div className="h-3 w-12 bg-slate-100 rounded animate-shimmer"></div>
                  </div>
                  <div className="h-3.5 w-3/4 bg-slate-200 rounded animate-shimmer"></div>
                  <div className="h-2.5 w-1/2 bg-slate-100 rounded animate-shimmer"></div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-4 w-4 rounded bg-slate-100 animate-shimmer"></div>
              <div className="h-3.5 w-28 bg-slate-200 rounded animate-shimmer"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-[#E6EBF8] rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-14 rounded-full bg-slate-100 animate-shimmer"></div>
                    <div className="h-3 w-12 bg-slate-100 rounded animate-shimmer"></div>
                  </div>
                  <div className="h-3.5 w-3/4 bg-slate-200 rounded animate-shimmer"></div>
                  <div className="h-2.5 w-1/2 bg-slate-100 rounded animate-shimmer"></div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <IconBook className="w-4 h-4 text-[#2F7FE8]" />
              <h3 className="font-heading text-sm font-bold text-[#1B3A6B]">
                Courses ({data?.courses.length || 0})
              </h3>
            </div>
            {!data || data.courses.length === 0 ? (
              <div className="text-center py-8 bg-white border border-dashed border-[#E6EBF8] rounded-2xl">
                <p className="text-xs text-[#9BA8C0]">No courses tagged with this subject yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.courses.map((c) => (
                  <Link
                    key={c.id}
                    href={`/admin/courses/${c.id}`}
                    className="bg-white border border-[#E6EBF8] rounded-2xl p-4 hover:shadow-md hover:border-[#2F7FE8]/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${c.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {c.status}
                      </span>
                      <span className="text-[10px] font-bold text-[#1B3A6B]">₹{c.price.toLocaleString("en-IN")}</span>
                    </div>
                    <h4 className="font-heading text-sm font-bold text-[#1B3A6B] line-clamp-1 mb-1">{c.title}</h4>
                    <p className="text-[11px] text-[#9BA8C0] font-medium">{c.format} · by {c.mentor}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <IconClock className="w-4 h-4 text-[#2F7FE8]" />
              <h3 className="font-heading text-sm font-bold text-[#1B3A6B]">
                Sessions ({data?.sessions.length || 0})
              </h3>
            </div>
            {!data || data.sessions.length === 0 ? (
              <div className="text-center py-8 bg-white border border-dashed border-[#E6EBF8] rounded-2xl">
                <p className="text-xs text-[#9BA8C0]">No sessions tagged with this subject yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.sessions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/admin/sessions/${s.id}`}
                    className="bg-white border border-[#E6EBF8] rounded-2xl p-4 hover:shadow-md hover:border-[#2F7FE8]/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${s.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {s.status}
                      </span>
                      <span className="text-[10px] font-bold text-[#1B3A6B]">₹{s.price.toLocaleString("en-IN")}/hr</span>
                    </div>
                    <h4 className="font-heading text-sm font-bold text-[#1B3A6B] line-clamp-1 mb-1">{s.title}</h4>
                    <p className="text-[11px] text-[#9BA8C0] font-medium">{s.type} · by {s.mentor}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
