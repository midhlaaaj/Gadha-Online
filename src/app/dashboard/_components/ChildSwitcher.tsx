"use client";

import { useState, useEffect, useRef } from "react";
import { useSelectedLayoutSegment, useSearchParams, useRouter } from "next/navigation";
import { IconChevronDown, IconPlus, IconClock } from "@tabler/icons-react";
import { getParentChildren } from "@/app/actions";

type Child = {
  id: string;
  name: string;
  avatarText: string;
  grade: string;
  joined: boolean;
  status?: string;
};

const AVATAR_COLORS = ["#2F7FE8", "#993556", "#0F6E56", "#534AB7", "#D97706"];
function avatarColor(name: string) {
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function ChildSwitcher() {
  const segment = useSelectedLayoutSegment() ?? "overview";
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [active, setActive] = useState<Child | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getParentChildren()
      .then((all) => {
        // Show ALL children — both joined and pending invitations
        setChildren(all);

        const paramId = searchParams.get("child");
        const found = all.find((k) => k.id === paramId);

        // Prefer joined children first, then any child
        const joinedFirst = all.filter((k) => k.joined);
        const fallback = joinedFirst[0] ?? all[0] ?? null;

        const activeChild = found ?? fallback;
        setActive(activeChild);

        if (!paramId && activeChild) {
          router.replace(`/dashboard/${segment}?child=${activeChild.id}`);
        }
      })
      .catch(() => setChildren([]))
      .finally(() => setLoading(false));
  }, [searchParams, segment, router]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const pick = (kid: Child) => {
    setActive(kid);
    setOpen(false);
    router.push(`/dashboard/${segment}?child=${kid.id}`);
  };

  return (
    <div className="sticky top-[70px] z-30 bg-[#F5F8FF] border-b border-[#D0DCF5]">
      <div className="max-w-7xl mx-auto w-full px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-[#4A5A7A] uppercase tracking-widest whitespace-nowrap">
            Viewing:
          </span>

          {loading ? (
            <div className="h-9 w-44 rounded-full animate-shimmer" />
          ) : children.length === 0 ? (
            /* No children at all */
            <a
              href="/my-children"
              className="flex items-center gap-2 text-[12px] font-semibold text-[#2F7FE8] bg-white border border-[#D0DCF5] px-4 py-1.5 rounded-full hover:border-[#2F7FE8] transition-colors"
            >
              <IconPlus className="w-3.5 h-3.5" />
              Add a child to get started
            </a>
          ) : active ? (
            <div className="relative" ref={ref}>
              {/* Trigger button */}
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 bg-white border border-[#D0DCF5] hover:border-[#2F7FE8] rounded-full transition-all cursor-pointer focus:outline-none select-none"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold font-heading shrink-0"
                  style={{ backgroundColor: avatarColor(active.name) }}
                >
                  {active.avatarText}
                </div>
                <div className="text-left leading-tight">
                  <p className="text-[12px] font-bold text-[#1B3A6B]">{active.name}</p>
                  <p className="text-[10px] text-[#4A5A7A]">
                    {active.joined ? active.grade : "Invitation pending"}
                  </p>
                </div>
                {!active.joined && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full">
                    Pending
                  </span>
                )}
                <IconChevronDown
                  className={`w-4 h-4 text-[#4A5A7A] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown */}
              {open && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl border border-slate-100 shadow-xl py-1.5 z-50 animate-fade-in-up">
                  {children.map((kid) => (
                    <button
                      key={kid.id}
                      onClick={() => pick(kid)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-2.5 text-[12px] font-semibold transition-colors hover:bg-[#F5F8FF] focus:outline-none ${
                        kid.id === active?.id ? "bg-[#E6F1FB] text-[#0C447C]" : "text-[#1B3A6B]"
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: avatarColor(kid.name) }}
                      >
                        {kid.avatarText}
                      </div>
                      <div className="flex flex-col leading-tight flex-1 min-w-0">
                        <span className="truncate">{kid.name}</span>
                        <span className="text-[10px] text-[#4A5A7A] font-medium">
                          {kid.joined ? kid.grade : "Invitation pending"}
                        </span>
                      </div>
                      {!kid.joined && (
                        <IconClock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      )}
                    </button>
                  ))}

                  <div className="h-px bg-slate-100 my-1.5" />
                  <a
                    href="/my-children"
                    className="flex items-center gap-3 px-4 py-2.5 text-[12px] font-semibold text-[#2F7FE8] hover:bg-[#F5F8FF] transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-50 text-[#2F7FE8] flex items-center justify-center shrink-0">
                      <IconPlus className="w-4 h-4" />
                    </div>
                    Add a child
                  </a>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <span className="text-[11px] text-[#4A5A7A] font-semibold bg-white px-3 py-1.5 rounded-full border border-[#D0DCF5]">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </span>
      </div>
    </div>
  );
}
