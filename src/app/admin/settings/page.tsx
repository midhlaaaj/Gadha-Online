"use client";

import React, { useState } from "react";
import { IconSettings, IconShieldCheck, IconMail, IconDatabase } from "@tabler/icons-react";

export default function SettingsPage() {
  const [commissionRate, setCommissionRate] = useState(15);
  const [allowSignups, setAllowSignups] = useState(true);
  const [smtpServer, setSmtpServer] = useState("smtp.resend.com");

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white border border-[#E6EBF8] rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] uppercase tracking-wider flex items-center gap-2">
            <IconSettings className="w-4.5 h-4.5 text-[#2F7FE8]" /> General Platform Settings
          </h3>
          <p className="text-xs text-text-muted mt-1 font-medium font-sans">
            Configure system-wide settings, rates, and platform defaults.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Platform Commission Fee (%)</label>
            <input
              type="number"
              className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
              value={commissionRate}
              onChange={(e) => setCommissionRate(Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">New Signups</label>
            <select
              className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none bg-white font-semibold text-[#1B3A6B]"
              value={allowSignups ? "enabled" : "disabled"}
              onChange={(e) => setAllowSignups(e.target.value === "enabled")}
            >
              <option value="enabled">Allow New Mentors & Students</option>
              <option value="disabled">Disable Public Signups</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-3 border-t border-[#E6EBF8]">
          <button
            onClick={() => alert("Settings saved provisionally! (Dummy configuration)")}
            className="text-xs font-bold px-6 py-2.5 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-colors cursor-pointer"
          >
            Save settings
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E6EBF8] rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B] uppercase tracking-wider flex items-center gap-2">
            <IconMail className="w-4.5 h-4.5 text-[#2F7FE8]" /> SMTP Email Notifications
          </h3>
          <p className="text-xs text-text-muted mt-1 font-medium font-sans">
            Configure SMTP settings for system invites and booking notifications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">SMTP Host</label>
            <input
              type="text"
              className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
              value={smtpServer}
              onChange={(e) => setSmtpServer(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">SMTP Port</label>
            <input
              type="number"
              className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
              defaultValue={465}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
