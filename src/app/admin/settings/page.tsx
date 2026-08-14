"use client";

import React, { useEffect, useState } from "react";
import { IconSettings, IconMail } from "@tabler/icons-react";
import { getPlatformSettings, updatePlatformSettings } from "@/app/actions";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [commissionRate, setCommissionRate] = useState(15);
  const [allowSignups, setAllowSignups] = useState(true);
  const [smtpServer, setSmtpServer] = useState("smtp.resend.com");

  useEffect(() => {
    getPlatformSettings()
      .then((s) => {
        setCommissionRate(s.commissionRate);
        setAllowSignups(s.allowSignups);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load settings."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updatePlatformSettings({ commissionRate, allowSignups });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

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
              disabled={loading}
              className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] disabled:opacity-50"
              value={commissionRate}
              onChange={(e) => setCommissionRate(Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">New Signups</label>
            <select
              disabled={loading}
              className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none bg-white font-semibold text-[#1B3A6B] disabled:opacity-50"
              value={allowSignups ? "enabled" : "disabled"}
              onChange={(e) => setAllowSignups(e.target.value === "enabled")}
            >
              <option value="enabled">Allow New Mentors & Students</option>
              <option value="disabled">Disable Public Signups</option>
            </select>
          </div>
        </div>

        {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

        <div className="flex items-center gap-3 pt-3 border-t border-[#E6EBF8]">
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="text-xs font-bold px-6 py-2.5 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save settings"}
          </button>
          {saved && <span className="text-xs font-semibold text-emerald-600">Saved.</span>}
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
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3 font-medium">
            Not wired up yet — custom SMTP setup (email verification, notification delivery) is planned as a follow-up. These fields are a preview of the upcoming form and don&apos;t save anything yet.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">SMTP Host</label>
            <input
              type="text"
              disabled
              className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] cursor-not-allowed"
              value={smtpServer}
              onChange={(e) => setSmtpServer(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">SMTP Port</label>
            <input
              type="number"
              disabled
              className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] cursor-not-allowed"
              defaultValue={465}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
