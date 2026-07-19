"use client";

import React, { useState, useEffect } from "react";
import {
  IconSearch,
  IconMail,
  IconPhone,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { getAdminData, toggleLeadResolved } from "../../actions";

interface Lead {
  id: string;
  fullName: string;
  email: string;
  subject: string;
  phone: string;
  message: string;
  isResolved: boolean;
  createdAt: string;
}

function LeadsSkeleton() {
  return (
    <div className="space-y-4 font-sans animate-pulse">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="h-9 flex-1 max-w-xl bg-slate-100 rounded-lg" />
        <div className="h-9 w-40 bg-slate-100 rounded-lg" />
      </div>
      <div className="bg-white border border-[#E6EBF8] rounded-2xl p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | "Unresolved" | "Resolved">("Unresolved");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await getAdminData();
      setLeads(res.leads || []);
    } catch (err) {
      console.error("Failed to load leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleResolved = async (id: string, current: boolean) => {
    try {
      await toggleLeadResolved(id, current);
      await loadData();
    } catch (err: any) {
      alert("Error updating lead: " + err.message);
    }
  };

  const filteredLeads = leads.filter((l) => {
    const matchSearch =
      l.fullName.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filter === "All" ||
      (filter === "Resolved" ? l.isResolved : !l.isResolved);
    return matchSearch && matchStatus;
  });

  const unresolvedCount = leads.filter((l) => !l.isResolved).length;

  if (loading) {
    return <LeadsSkeleton />;
  }

  return (
    <div className="space-y-4 font-sans">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xl min-w-[200px]">
          <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, email, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-border-subtle rounded-lg bg-white outline-none font-semibold text-[#1B3A6B]"
          />
        </div>
        <div className="flex border border-[#E6EBF8] rounded-lg overflow-hidden shrink-0 shadow-sm bg-white">
          {(["Unresolved", "Resolved", "All"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-bold px-4 py-2 cursor-pointer transition-colors ${
                filter === f ? "bg-[#EBF2FF] text-[#1B3A6B]" : "bg-white text-[#9BA8C0]"
              }`}
            >
              {f}
              {f === "Unresolved" && unresolvedCount > 0 && (
                <span className="ml-1.5 text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5">
                  {unresolvedCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-[#E6EBF8]">
          <p className="text-sm text-text-muted">No leads match this filter.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E6EBF8] rounded-2xl divide-y divide-[#F0F3FB] shadow-sm overflow-hidden">
          {filteredLeads.map((l) => {
            const isExpanded = expandedId === l.id;
            return (
              <div key={l.id} className={l.isResolved ? "opacity-60" : ""}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : l.id)}
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      l.isResolved ? "bg-[#9BA8C0]" : "bg-red-500"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#1B3A6B]">{l.fullName}</span>
                      <span className="text-[10px] text-text-muted">{l.email}</span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 truncate max-w-md">{l.subject}</p>
                  </div>
                  <span className="text-[10px] text-text-muted shrink-0 hidden sm:block">
                    {new Date(l.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleResolved(l.id, l.isResolved);
                    }}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
                      l.isResolved
                        ? "bg-slate-100 text-[#6B7A99] hover:bg-slate-200"
                        : "bg-green-500 text-white hover:bg-green-600"
                    }`}
                  >
                    {l.isResolved ? (
                      <>
                        <IconX className="w-3.5 h-3.5" /> Reopen
                      </>
                    ) : (
                      <>
                        <IconCheck className="w-3.5 h-3.5" /> Resolved
                      </>
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pl-[34px] space-y-3">
                    <p className="text-xs text-text-muted leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-4">
                      {l.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <a
                        href={`mailto:${l.email}`}
                        className="flex items-center gap-1.5 font-semibold text-secondary hover:text-secondary/80"
                      >
                        <IconMail className="w-3.5 h-3.5" /> {l.email}
                      </a>
                      {l.phone && (
                        <a
                          href={`tel:${l.phone}`}
                          className="flex items-center gap-1.5 font-semibold text-secondary hover:text-secondary/80"
                        >
                          <IconPhone className="w-3.5 h-3.5" /> {l.phone}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
