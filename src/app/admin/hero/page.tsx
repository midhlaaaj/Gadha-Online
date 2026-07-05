"use client";

import React, { useState, useEffect } from "react";
import {
  IconEye,
  IconSparkles,
  IconPhotoUp,
} from "@tabler/icons-react";
import { getAdminData, updateHeroSettings } from "../../actions";

const DEFAULT_HERO = {
  badgeText: "#1 online tutoring platform",
  headline: "Learn faster with expert mentors by your side",
  accentedText: "expert mentors",
  subheading: "Connect with top-rated tutors for 1-on-1 sessions, structured courses, and hourly lessons — all tailored to your pace and goals.",
  primaryCta: "Find a mentor",
  primaryLink: "/mentors",
  secondaryCta: "Browse courses",
  secondaryLink: "/courses",
  c1: "12,400+",
  cl1: "Students enrolled",
  c2: "840+",
  cl2: "Expert mentors",
  c3: "320+",
  cl3: "Courses available",
  c4: "98%",
  cl4: "Satisfaction rate",
};

export default function HeroPage() {
  const [heroCopy, setHeroCopy] = useState(DEFAULT_HERO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const res = await getAdminData();
      if (res.settings) {
        setHeroCopy({
          badgeText: res.settings.badge_text,
          headline: res.settings.headline,
          accentedText: res.settings.accented_text,
          subheading: res.settings.subheading,
          primaryCta: res.settings.primary_cta,
          primaryLink: res.settings.primary_link,
          secondaryCta: res.settings.secondary_cta,
          secondaryLink: res.settings.secondary_link,
          c1: res.settings.c1,
          cl1: res.settings.cl1,
          c2: res.settings.c2,
          cl2: res.settings.cl2,
          c3: res.settings.c3,
          cl3: res.settings.cl3,
          c4: res.settings.c4,
          cl4: res.settings.cl4,
        });
      }
    } catch (err) {
      console.error("Failed to load hero configurations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveHeroChanges = async () => {
    setSaving(true);
    try {
      await updateHeroSettings({
        badge_text: heroCopy.badgeText,
        headline: heroCopy.headline,
        accented_text: heroCopy.accentedText,
        subheading: heroCopy.subheading,
        primary_cta: heroCopy.primaryCta,
        primary_link: heroCopy.primaryLink,
        secondary_cta: heroCopy.secondaryCta,
        secondary_link: heroCopy.secondaryLink,
        c1: heroCopy.c1,
        cl1: heroCopy.cl1,
        c2: heroCopy.c2,
        cl2: heroCopy.cl2,
        c3: heroCopy.c3,
        cl3: heroCopy.cl3,
        c4: heroCopy.c4,
        cl4: heroCopy.cl4,
      });
      alert("Hero settings saved and published successfully!");
      await loadData();
    } catch (err: any) {
      alert("Failed to save hero settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderPrevHeadline = () => {
    const text = heroCopy.headline;
    const phrase = heroCopy.accentedText;
    if (!phrase || !text.includes(phrase)) {
      return text;
    }
    const parts = text.split(phrase);
    return (
      <>
        {parts[0]}
        <span className="text-[#2F7FE8]">{phrase}</span>
        {parts[1]}
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-semibold text-slate-500 font-sans">Loading Hero Settings...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Left: Preview */}
      <div className="lg:sticky lg:top-4 space-y-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F7FE8] bg-[#EBF2FF] px-3.5 py-1 rounded-full">
          <IconEye className="w-4 h-4" />
          Live preview
        </div>
        {/* Browser shell container mockup */}
        <div className="bg-[#F5F8FF] border border-border-subtle rounded-2xl overflow-hidden shadow-md">
          {/* Mock Navbar */}
          <div className="bg-white border-b border-border-subtle px-4 h-9 flex items-center justify-between">
            <div className="font-heading text-xs font-extrabold text-primary">
              Tuto<span className="text-secondary">board</span>
            </div>
            <div className="flex gap-2">
              <div className="w-9 h-1 rounded-full bg-border-subtle"></div>
              <div className="w-9 h-1 rounded-full bg-border-subtle"></div>
              <div className="w-9 h-1 rounded-full bg-border-subtle"></div>
              <div className="w-10 h-4 bg-secondary rounded-sm"></div>
            </div>
          </div>
          {/* Mock Hero Copy */}
          <div className="p-5 flex flex-col gap-2.5">
            <div className="inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-badge-bg text-badge-text border border-badge-border w-fit font-sans">
              <IconSparkles className="w-2.5 h-2.5 text-secondary" />
              {heroCopy.badgeText}
            </div>
            <h2 className="font-heading text-base font-extrabold text-primary leading-snug max-w-[280px]">
              {renderPrevHeadline()}
            </h2>
            <p className="text-[9px] text-text-muted leading-relaxed max-w-[260px] font-medium font-sans">
              {heroCopy.subheading}
            </p>
            <div className="flex gap-2 pt-1 font-sans">
              <button className="text-[9px] font-bold px-3 py-1 rounded bg-[#1B3A6B] text-white">
                {heroCopy.primaryCta}
              </button>
              <button className="text-[9px] font-bold px-3 py-1 rounded bg-transparent text-[#1B3A6B] border border-[#1B3A6B]">
                {heroCopy.secondaryCta}
              </button>
            </div>
          </div>
          {/* Mock stats counters */}
          <div className="bg-[#1B3A6B] grid grid-cols-4 py-2.5 px-4 font-sans">
            <div className="text-center border-r border-white/12">
              <div className="font-heading text-xs font-bold text-accent">{heroCopy.c1}</div>
              <div className="text-[7px] text-white/60 font-semibold">{heroCopy.cl1}</div>
            </div>
            <div className="text-center border-r border-white/12">
              <div className="font-heading text-xs font-bold text-accent">{heroCopy.c2}</div>
              <div className="text-[7px] text-white/60 font-semibold">{heroCopy.cl2}</div>
            </div>
            <div className="text-center border-r border-white/12">
              <div className="font-heading text-xs font-bold text-accent">{heroCopy.c3}</div>
              <div className="text-[7px] text-white/60 font-semibold">{heroCopy.cl3}</div>
            </div>
            <div className="text-center">
              <div className="font-heading text-xs font-bold text-accent">{heroCopy.c4}</div>
              <div className="text-[7px] text-white/60 font-semibold">{heroCopy.cl4}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Form panel */}
      <div className="bg-white border border-border-subtle rounded-2xl p-5 shadow-sm space-y-5">
        <div className="text-xs font-bold uppercase tracking-wider text-[#1B3A6B] border-b border-border-subtle pb-2">
          Hero copy editor
        </div>
        <div className="space-y-4 font-sans">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Badge text</label>
            <input
              className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] focus:border-secondary"
              type="text"
              value={heroCopy.badgeText}
              onChange={(e) => setHeroCopy({ ...heroCopy, badgeText: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Headline</label>
            <input
              className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] focus:border-secondary"
              type="text"
              value={heroCopy.headline}
              onChange={(e) => setHeroCopy({ ...heroCopy, headline: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">
              Accented phrase <span className="text-text-muted font-normal">(blue text)</span>
            </label>
            <input
              className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] focus:border-secondary"
              type="text"
              value={heroCopy.accentedText}
              onChange={(e) => setHeroCopy({ ...heroCopy, accentedText: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Subheading</label>
            <textarea
              className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] focus:border-secondary resize-none h-20"
              value={heroCopy.subheading}
              onChange={(e) => setHeroCopy({ ...heroCopy, subheading: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Primary CTA</label>
              <input
                className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] focus:border-secondary"
                type="text"
                value={heroCopy.primaryCta}
                onChange={(e) => setHeroCopy({ ...heroCopy, primaryCta: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Primary link</label>
              <input
                className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] focus:border-secondary"
                type="text"
                value={heroCopy.primaryLink}
                onChange={(e) => setHeroCopy({ ...heroCopy, primaryLink: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Secondary CTA</label>
              <input
                className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] focus:border-secondary"
                type="text"
                value={heroCopy.secondaryCta}
                onChange={(e) => setHeroCopy({ ...heroCopy, secondaryCta: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Secondary link</label>
              <input
                className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B] focus:border-secondary"
                type="text"
                value={heroCopy.secondaryLink}
                onChange={(e) => setHeroCopy({ ...heroCopy, secondaryLink: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="text-xs font-bold uppercase tracking-wider text-[#1B3A6B] border-b border-border-subtle pb-2 pt-2">
          Counter values
        </div>
        <div className="grid grid-cols-2 gap-3 font-sans">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B]">Stat 1 value</label>
            <input
              className="text-xs p-2.5 border border-border-subtle rounded-lg font-semibold text-[#1B3A6B]"
              type="text"
              value={heroCopy.c1}
              onChange={(e) => setHeroCopy({ ...heroCopy, c1: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B]">Stat 1 label</label>
            <input
              className="text-xs p-2.5 border border-border-subtle rounded-lg font-semibold text-[#1B3A6B]"
              type="text"
              value={heroCopy.cl1}
              onChange={(e) => setHeroCopy({ ...heroCopy, cl1: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B]">Stat 2 value</label>
            <input
              className="text-xs p-2.5 border border-border-subtle rounded-lg font-semibold text-[#1B3A6B]"
              type="text"
              value={heroCopy.c2}
              onChange={(e) => setHeroCopy({ ...heroCopy, c2: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B]">Stat 2 label</label>
            <input
              className="text-xs p-2.5 border border-border-subtle rounded-lg font-semibold text-[#1B3A6B]"
              type="text"
              value={heroCopy.cl2}
              onChange={(e) => setHeroCopy({ ...heroCopy, cl2: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B]">Stat 3 value</label>
            <input
              className="text-xs p-2.5 border border-border-subtle rounded-lg font-semibold text-[#1B3A6B]"
              type="text"
              value={heroCopy.c3}
              onChange={(e) => setHeroCopy({ ...heroCopy, c3: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B]">Stat 3 label</label>
            <input
              className="text-xs p-2.5 border border-border-subtle rounded-lg font-semibold text-[#1B3A6B]"
              type="text"
              value={heroCopy.cl3}
              onChange={(e) => setHeroCopy({ ...heroCopy, cl3: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B]">Stat 4 value</label>
            <input
              className="text-xs p-2.5 border border-border-subtle rounded-lg font-semibold text-[#1B3A6B]"
              type="text"
              value={heroCopy.c4}
              onChange={(e) => setHeroCopy({ ...heroCopy, c4: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#1B3A6B]">Stat 4 label</label>
            <input
              className="text-xs p-2.5 border border-border-subtle rounded-lg font-semibold text-[#1B3A6B]"
              type="text"
              value={heroCopy.cl4}
              onChange={(e) => setHeroCopy({ ...heroCopy, cl4: e.target.value })}
            />
          </div>
        </div>

        <div className="text-xs font-bold uppercase tracking-wider text-[#1B3A6B] border-b border-border-subtle pb-2 pt-2">
          Hero Image
        </div>
        <div className="border border-dashed border-border-subtle rounded-2xl p-6 text-center cursor-pointer bg-badge-bg/30 hover:bg-badge-bg/50 transition-colors font-sans">
          <IconPhotoUp className="w-8 h-8 mx-auto text-text-muted mb-2" />
          <p className="text-xs text-text-muted">Upload hero image</p>
          <p className="text-[10px] text-text-muted/70 mt-1">PNG, JPG up to 4MB</p>
        </div>

        <div className="flex gap-3 pt-3 border-t border-[#E6EBF8] font-sans">
          <button
            onClick={saveHeroChanges}
            disabled={saving}
            className="text-xs font-bold px-6 py-2.5 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-colors cursor-pointer"
          >
            {saving ? "Saving..." : "Publish changes"}
          </button>
          <button
            onClick={loadData}
            className="text-xs font-bold px-4 py-2.5 rounded-xl bg-transparent text-[#1B3A6B] border border-border-subtle hover:bg-slate-50"
          >
            Revert
          </button>
        </div>
      </div>
    </div>
  );
}
