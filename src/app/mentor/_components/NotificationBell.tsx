"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  IconBell,
  IconCalendarCheck,
  IconUserPlus,
  IconAlertTriangle,
  IconX,
} from "@tabler/icons-react";
import {
  getMentorNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
} from "@/app/actions";

type Notification = Awaited<ReturnType<typeof getMentorNotifications>>[number];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotifIcon({ type }: { type: string }) {
  if (type === "new_booking")
    return (
      <span className="w-8 h-8 rounded-full bg-[#E6F1FB] flex items-center justify-center shrink-0">
        <IconUserPlus className="w-4 h-4 text-[#2F7FE8]" />
      </span>
    );
  if (type === "reminder_3h")
    return (
      <span className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
        <IconCalendarCheck className="w-4 h-4 text-amber-500" />
      </span>
    );
  return (
    <span className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
      <IconAlertTriangle className="w-4 h-4 text-red-500" />
    </span>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUnreadNotificationCount().then(setUnreadCount).catch(() => {});
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);
    try {
      const data = await getMentorNotifications();
      setNotifications(data);
      const unreadIds = data.filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length > 0) {
        await markNotificationsRead(unreadIds);
        setUnreadCount(0);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative w-8 h-8 rounded-xl border border-[#E6EBF8] bg-[#F5F7FF] flex items-center justify-center hover:border-[#2F7FE8] hover:bg-[#EBF2FF] transition-all cursor-pointer"
        aria-label="Notifications"
      >
        <IconBell className="w-4 h-4 text-[#4A5A7A]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl border border-[#D0DCF5] shadow-2xl shadow-[#1B3A6B]/10 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0F3FB]">
            <p className="text-[12px] font-extrabold text-[#1B3A6B]">Notifications</p>
            <button onClick={() => setOpen(false)} className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-slate-100 cursor-pointer">
              <IconX className="w-3.5 h-3.5 text-[#9BA8C0]" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto premium-scrollbar">
            {loading ? (
              <div className="space-y-3 p-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-2 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0" />
                    <div className="flex-1 space-y-1.5 pt-1">
                      <div className="h-2.5 w-36 rounded bg-slate-100" />
                      <div className="h-2 w-52 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <IconBell className="w-8 h-8 text-[#D0DCF5]" />
                <p className="text-[12px] text-[#9BA8C0] font-semibold">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F0F3FB]">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link_url || "/mentor/classes"}
                    onClick={() => setOpen(false)}
                    className={`flex gap-3 px-4 py-3 hover:bg-[#F5F7FF] transition-colors ${!n.is_read ? "bg-[#EBF2FF]/50" : ""}`}
                  >
                    <NotifIcon type={n.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-[#1B3A6B]">{n.title}</p>
                      <p className="text-[10px] text-[#4A5A7A] mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-[#9BA8C0] mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#2F7FE8] shrink-0 mt-1" />}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-[#F0F3FB]">
              <Link href="/mentor/classes" onClick={() => setOpen(false)} className="text-[11px] font-bold text-[#2F7FE8] hover:underline">
                View all classes →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
