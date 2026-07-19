"use client";

import React, { useState, useEffect } from "react";
import {
  IconTargetArrow,
  IconBulb,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandYoutube,
} from "@tabler/icons-react";
import { getAboutPageData } from "../actions";

export default function AboutPage() {
  const [settings, setSettings] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getAboutPageData();
        setSettings(res.settings);
        setTeamMembers(res.teamMembers);
        setAchievements(res.achievements);
      } catch (err) {
        console.error("Failed to load about page data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="w-full bg-white text-primary flex-1 min-h-screen flex flex-col font-sans">
      <title>About Us | Tutoboard</title>
      <meta name="description" content="Learn about Tutoboard's vision, mission, team, and achievements." />

      {/* PAGE HEADER */}
      <header className="bg-surface px-6 md:px-12 py-8 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto">
          <nav className="text-xs text-text-muted mb-3 flex items-center gap-1.5 font-medium">
            <a href="/" className="hover:text-secondary transition-colors">Home</a>
            <span className="text-slate-300">/</span>
            <span className="text-primary font-semibold">About</span>
          </nav>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-8 w-64 bg-slate-200 rounded" />
              <div className="h-4 w-96 bg-slate-100 rounded" />
            </div>
          ) : (
            <>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-primary">
                {settings?.hero_title}
              </h1>
              <p className="text-sm text-text-muted mt-2 max-w-2xl">
                {settings?.hero_subtitle}
              </p>
            </>
          )}
        </div>
      </header>

      {/* VISION & MISSION */}
      <section className="py-10 sm:py-16">
        <div className="px-6 md:px-12 max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-surface border border-border-subtle rounded-2xl p-6 space-y-3 animate-pulse">
                  <div className="h-5 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="h-3 w-4/5 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface border border-border-subtle rounded-2xl p-6 sm:p-8">
                <div className="w-11 h-11 rounded-xl bg-[#EBF2FF] flex items-center justify-center mb-4">
                  <IconTargetArrow className="w-5 h-5 text-secondary" />
                </div>
                <h2 className="font-heading text-xl font-extrabold text-primary mb-2">
                  {settings?.vision_title}
                </h2>
                <p className="text-sm text-text-muted leading-relaxed">
                  {settings?.vision_text}
                </p>
              </div>
              <div className="bg-surface border border-border-subtle rounded-2xl p-6 sm:p-8">
                <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
                  <IconBulb className="w-5 h-5 text-accent" />
                </div>
                <h2 className="font-heading text-xl font-extrabold text-primary mb-2">
                  {settings?.mission_title}
                </h2>
                <p className="text-sm text-text-muted leading-relaxed">
                  {settings?.mission_text}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* MEET THE TEAM - HOMEPAGE COURSES UI STYLE */}
      <section className="bg-surface py-10 sm:py-16">
        <div className="px-6 md:px-12 max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-10 text-left">
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">
              The people behind Tutoboard
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-primary">
              Meet the team
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Educators, innovators, and leaders building the future of learning
            </p>
          </div>

          {/* MOBILE: single-card peek carousel (matching homepage courses) */}
          <div className="md:hidden">
            {loading ? (
              <div className="flex gap-3 overflow-x-auto pb-6 snap-x snap-mandatory premium-scrollbar">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-[85%] min-w-[85%] snap-center shrink-0 bg-white border border-border-subtle rounded-2xl overflow-hidden animate-pulse">
                    <div className="w-full h-36 bg-slate-100" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-1/2" />
                      <div className="h-3 bg-slate-100 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-sm text-text-muted">Team information coming soon.</p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-6 snap-x snap-mandatory premium-scrollbar">
                {teamMembers.map((m) => (
                  <div
                    key={m.id}
                    className="w-[85%] min-w-[85%] snap-center shrink-0 bg-white border border-border-subtle rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col justify-between"
                  >
                    {/* Header Image / Avatar Banner */}
                    <div className="relative w-full h-36 bg-slate-100 overflow-hidden flex items-center justify-center">
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                          <div
                            className="w-16 h-16 rounded-full flex items-center justify-center font-heading text-lg font-extrabold text-accent"
                            style={{ backgroundColor: m.avatarBg || "#1B3A6B" }}
                          >
                            {m.avatarText}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-2.5">
                      <div>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EBF2FF] text-[#1B3A6B] inline-block mb-1.5">
                          {m.role}
                        </span>
                        <h3 className="font-heading text-sm font-extrabold text-primary leading-snug">
                          {m.name}
                        </h3>
                        {m.bio && (
                          <p className="text-xs text-text-muted leading-relaxed mt-1.5 line-clamp-3">
                            {m.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DESKTOP (md:+): horizontal carousel (matching homepage courses) */}
          <div className="hidden md:block">
            {loading ? (
              <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory premium-scrollbar">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-[calc(50%_-_12px)] lg:w-[calc(33.333%_-_16px)] min-w-[calc(50%_-_12px)] lg:min-w-[calc(33.333%_-_16px)] snap-start shrink-0 bg-white border border-border-subtle rounded-2xl overflow-hidden animate-pulse">
                    <div className="w-full h-44 bg-slate-100" />
                    <div className="p-5 space-y-2.5">
                      <div className="h-4 bg-slate-200 rounded w-1/3" />
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
                      <div className="h-3 bg-slate-100 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-sm text-text-muted">Team information coming soon.</p>
              </div>
            ) : (
              <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory premium-scrollbar">
                {teamMembers.map((m) => (
                  <div
                    key={m.id}
                    className="w-[calc(50%_-_12px)] lg:w-[calc(33.333%_-_16px)] min-w-[calc(50%_-_12px)] lg:min-w-[calc(33.333%_-_16px)] snap-start shrink-0 bg-white border border-border-subtle rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col justify-between"
                  >
                    {/* Header Image / Avatar Banner */}
                    <div className="relative w-full h-44 bg-slate-100 overflow-hidden flex items-center justify-center">
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                          <div
                            className="w-20 h-20 rounded-full flex items-center justify-center font-heading text-xl font-extrabold text-accent"
                            style={{ backgroundColor: m.avatarBg || "#1B3A6B" }}
                          >
                            {m.avatarText}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#EBF2FF] text-[#1B3A6B] inline-block mb-2">
                          {m.role}
                        </span>
                        <h3 className="font-heading text-base font-extrabold text-primary leading-snug">
                          {m.name}
                        </h3>
                        {m.bio && (
                          <p className="text-xs text-text-muted leading-relaxed mt-2 line-clamp-3">
                            {m.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ACHIEVEMENTS - HORIZONTALLY SCROLLABLE CAROUSEL */}
      <section className="py-10 sm:py-16">
        <div className="px-6 md:px-12 max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-10 text-left">
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">
              Milestones
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-primary">
              Our achievements
            </h2>
          </div>

          {loading ? (
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 snap-x snap-mandatory premium-scrollbar">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-[85%] sm:w-[calc(50%_-_12px)] lg:w-[calc(33.333%_-_16px)] min-w-[85%] sm:min-w-[calc(50%_-_12px)] lg:min-w-[calc(33.333%_-_16px)] snap-center sm:snap-start shrink-0 bg-surface border border-border-subtle rounded-2xl overflow-hidden animate-pulse"
                >
                  <div className="w-full h-44 bg-slate-100" />
                  <div className="p-5 space-y-2">
                    <div className="h-6 w-24 bg-slate-200 rounded" />
                    <div className="h-3 w-40 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : achievements.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-sm text-text-muted">Achievements coming soon.</p>
            </div>
          ) : (
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 snap-x snap-mandatory premium-scrollbar">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className="w-[85%] sm:w-[calc(50%_-_12px)] lg:w-[calc(33.333%_-_16px)] min-w-[85%] sm:min-w-[calc(50%_-_12px)] lg:min-w-[calc(33.333%_-_16px)] snap-center sm:snap-start shrink-0 bg-surface border border-border-subtle rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col justify-between"
                >
                  {a.imageUrl ? (
                    <div className="w-full h-44 overflow-hidden bg-slate-100">
                      <img
                        src={a.imageUrl}
                        alt={a.statLabel}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-44 bg-[#EBF2FF] flex items-center justify-center">
                      <span className="font-heading text-4xl font-extrabold text-secondary/30">★</span>
                    </div>
                  )}
                  <div className="p-5 text-left">
                    <p className="font-heading text-2xl sm:text-3xl font-extrabold text-primary">{a.statValue}</p>
                    <p className="text-xs text-text-muted mt-1.5 leading-relaxed">{a.statLabel}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0f2347] text-white py-12 mt-auto">
        <div className="px-6 md:px-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="font-heading text-xl font-extrabold text-white mb-3">
                Tuto<span className="text-accent">board</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed max-w-[280px]">
                India&apos;s most trusted online tutoring platform. Learn at your pace, with the best mentors.
              </p>
            </div>
            <div>
              <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-4">
                Company
              </div>
              <ul className="space-y-2.5 text-xs text-white/60">
                <li>
                  <a href="/about" className="hover:text-white transition-colors">About us</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Careers</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
            <p>&copy; 2026 Tutoboard. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">
                <IconBrandInstagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <IconBrandTwitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <IconBrandLinkedin className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <IconBrandYoutube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
