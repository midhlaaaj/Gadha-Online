"use client";

import React, { use, useState, useEffect } from "react";
import {
  IconCheck,
  IconStar,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandYoutube,
  IconAward,
  IconBriefcase,
  IconBook,
  IconArrowLeft,
  IconShieldCheck,
  IconUsers,
} from "@tabler/icons-react";
import { getMentorDetailsData } from "../../actions";

// Helper for subject badges colors
const getSubjectBgColor = (subject: string) => {
  switch (subject) {
    case "Mathematics":
      return "bg-blue-50 text-blue-700 border border-blue-100";
    case "Programming":
      return "bg-green-50 text-green-700 border border-green-100";
    case "Science":
      return "bg-yellow-50 text-yellow-800 border border-yellow-100";
    case "English":
      return "bg-purple-50 text-purple-700 border border-purple-100";
    default:
      return "bg-slate-50 text-slate-700 border border-slate-100";
  }
};

export default function MentorDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getMentorDetailsData(id);
        setData(res);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load mentor details");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] h-screen bg-[#F5F8FF] font-sans text-primary">
        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500 animate-pulse">Loading Mentor Profile...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] h-screen bg-white font-sans text-primary p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center shadow-md">
          <h2 className="font-heading text-lg font-bold text-red-700 mb-2">Error Loading Profile</h2>
          <p className="text-sm text-text-muted mb-6">{error || "Mentor not found."}</p>
          <a href="/mentors" className="text-xs font-semibold px-6 py-3 bg-primary text-white rounded-lg hover:shadow-md transition-all">
            Back to Mentors
          </a>
        </div>
      </div>
    );
  }

  const { mentor, courses, sessions } = data;

  return (
    <div className="w-full bg-white text-primary flex-1 min-h-screen flex flex-col font-sans">
      <title>{`${mentor.name} - Expert Subject Tutor | Tutoboard`}</title>
      <meta name="description" content={`Book 1-on-1 sessions and explore courses taught by ${mentor.name}, verified educator specializing in ${mentor.subject} on Tutoboard.`} />
      
      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-primary text-white border border-secondary text-xs px-4 py-3 rounded-xl shadow-xl z-50 animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
          {toastMessage}
        </div>
      )}

      {/* NAVIGATION */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-[70px] bg-white border-b border-border-subtle sticky top-0 z-50">
        <a href="/" className="font-heading text-2xl font-extrabold tracking-tight text-primary">
          Tuto<span className="text-secondary">board</span>
        </a>
        <div className="hidden md:flex items-center gap-8">
          <a href="/courses" className="text-sm font-medium text-text-muted hover:text-secondary transition-colors">
            Courses
          </a>
          <a href="/sessions" className="text-sm font-medium text-text-muted hover:text-secondary transition-colors">
            Sessions
          </a>
          <a href="/mentors" className="text-sm font-semibold text-secondary hover:text-secondary/90 transition-colors">
            Mentors
          </a>
          <a href="/#about" className="text-sm font-medium text-text-muted hover:text-secondary transition-colors">
            About
          </a>
          <div className="flex items-center gap-3 ml-2">
            <a
              href="#"
              className="text-xs font-semibold px-5 py-2.5 rounded-lg border border-primary text-primary hover:bg-primary/5 transition-all cursor-pointer"
            >
              Sign In
            </a>
            <a
              href="#"
              className="text-xs font-semibold px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 hover:shadow-md transition-all cursor-pointer"
            >
              Sign Up
            </a>
          </div>
        </div>
        <button className="md:hidden text-xs font-semibold px-4 py-2 rounded-lg bg-secondary text-white cursor-pointer">
          Menu
        </button>
      </nav>

      {/* HEADER SECTION */}
      <header className="bg-surface px-6 md:px-12 py-8 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-xs text-text-muted mb-4 flex items-center gap-1.5 font-medium">
            <a href="/" className="hover:text-secondary transition-colors">Home</a>
            <span className="text-slate-300">/</span>
            <a href="/mentors" className="hover:text-secondary transition-colors">Mentors</a>
            <span className="text-slate-300">/</span>
            <span className="text-primary font-semibold">{mentor.name}</span>
          </nav>

          <h1 className="font-heading text-3xl font-extrabold text-primary mb-1">
            {mentor.name}
          </h1>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="max-w-7xl mx-auto w-full px-6 md:px-12 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start flex-1">
        
        {/* LEFT COLUMN: ABOUT, COURSES, SESSIONS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* About/Bio Box */}
          <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-primary mb-3">About {mentor.name}</h2>
            <p className="text-xs md:text-sm text-text-muted/90 leading-relaxed whitespace-pre-line mb-6">
              {mentor.bio || `${mentor.name} is a highly accomplished educator with a passion for guiding students toward academic success.`}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border-subtle pt-6">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 shrink-0">
                  <IconAward className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-primary">Qualification</h4>
                  <p className="text-[11px] text-text-muted font-medium mt-0.5">{mentor.qualification}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center text-green-700 shrink-0">
                  <IconBriefcase className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-primary">Experience</h4>
                  <p className="text-[11px] text-text-muted font-medium mt-0.5">{mentor.experience} Years Teaching</p>
                </div>
              </div>
            </div>
          </div>

          {/* Courses Taken */}
          <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold text-primary">Courses by {mentor.name}</h2>
              {courses.length > 0 && (
                <a 
                  href={`/courses?mentor=${encodeURIComponent(mentor.name)}`}
                  className="text-xs font-bold text-secondary hover:underline"
                >
                  View all courses
                </a>
              )}
            </div>

            {courses.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 border border-dashed border-border-subtle rounded-xl">
                <p className="text-xs text-text-muted">No structured courses published yet by this mentor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.slice(0, 4).map((c: any) => (
                  <div key={c.id} className="bg-white border border-border-subtle rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-badge-bg text-badge-text border border-badge-border">
                          {c.subject}
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {c.format}
                        </span>
                      </div>
                      <h4 className="font-heading text-sm font-bold text-primary leading-snug mb-1 line-clamp-1">
                        {c.title}
                      </h4>
                      <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed mb-4">
                        {c.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                      <span className="text-xs font-bold text-accent flex items-center gap-0.5">
                        <IconStar className="w-3.5 h-3.5 fill-accent text-accent" /> {c.rating}
                      </span>
                      <span className="font-heading font-extrabold text-primary text-sm">
                        ₹{c.price.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <a 
                      href={`/courses/${c.id}`}
                      className="mt-3 text-center text-xs font-semibold py-2 rounded-lg bg-secondary text-white hover:bg-secondary/95 transition-colors"
                    >
                      View Details
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sessions Conducted */}
          <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold text-primary">Hourly Sessions by {mentor.name}</h2>
              {sessions.length > 0 && (
                <a 
                  href={`/sessions?mentor=${encodeURIComponent(mentor.name)}`}
                  className="text-xs font-bold text-secondary hover:underline"
                >
                  View all sessions
                </a>
              )}
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 border border-dashed border-border-subtle rounded-xl">
                <p className="text-xs text-text-muted">No hourly sessions scheduled yet by this mentor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessions.slice(0, 4).map((s: any) => (
                  <div key={s.id} className="bg-white border border-border-subtle rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-100">
                          {s.type} Session
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                          {s.subject}
                        </span>
                      </div>
                      <h4 className="font-heading text-sm font-bold text-primary leading-snug mb-1 line-clamp-1">
                        {s.title}
                      </h4>
                      <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed mb-4">
                        {s.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                      <span className="text-xs font-bold text-accent flex items-center gap-0.5">
                        <IconStar className="w-3.5 h-3.5 fill-accent text-accent" /> 5.0
                      </span>
                      <span className="font-heading font-extrabold text-primary text-sm">
                        ₹{s.price}/hr
                      </span>
                    </div>

                    <a 
                      href={`/sessions/${s.id}`}
                      className="mt-3 text-center text-xs font-semibold py-2 rounded-lg bg-secondary text-white hover:bg-secondary/95 transition-colors"
                    >
                      View Details
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: OVERVIEW CARD */}
        <div className="space-y-6">
          <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
            
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center font-heading text-3xl font-bold text-accent shadow-md mb-4"
              style={{ backgroundColor: mentor.avatarBg || "#1B3A6B" }}
            >
              {mentor.avatarText}
            </div>

            <h3 className="font-heading text-xl font-bold text-primary flex items-center gap-2 justify-center">
              {mentor.name}
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-150 shrink-0">
                Verified
              </span>
            </h3>

            <p className="text-xs text-text-muted font-medium mt-1">{mentor.qualification}</p>

            <div className="flex flex-wrap gap-1 mt-3 justify-center">
              {mentor.expertise.map((subject: string, idx: number) => (
                <span key={idx} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getSubjectBgColor(subject)}`}>
                  {subject}
                </span>
              ))}
            </div>

            <div className="w-full grid grid-cols-3 gap-2 py-4 border-t border-b border-border-subtle my-5">
              <div>
                <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider block">Rating</span>
                <span className="text-xs font-extrabold text-primary block mt-0.5">★ {mentor.rating}</span>
              </div>
              <div className="border-l border-border-subtle">
                <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider block">Students</span>
                <span className="text-xs font-extrabold text-primary block mt-0.5">{mentor.students}+</span>
              </div>
              <div className="border-l border-border-subtle">
                <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider block">Experience</span>
                <span className="text-xs font-extrabold text-primary block mt-0.5">{mentor.experience} yrs</span>
              </div>
            </div>

            <div className="w-full flex items-center justify-between mb-5 px-1">
              <span className="text-xs font-bold text-text-muted">Hourly Rate</span>
              <span className="font-heading font-extrabold text-2xl text-primary">₹{mentor.rate}/hr</span>
            </div>

            <button
              onClick={() => triggerToast("Booking function coming soon!")}
              className="w-full text-xs font-bold py-3.5 rounded-xl bg-secondary text-white hover:bg-secondary/90 transition-all cursor-pointer shadow-md mb-2.5"
            >
              Book 1-on-1 Session
            </button>

            <button
              onClick={() => triggerToast("Message service coming soon!")}
              className="w-full text-xs font-bold py-3.5 rounded-xl bg-transparent text-primary border border-border-subtle hover:bg-slate-50 transition-all cursor-pointer"
            >
              Message Mentor
            </button>
          </div>

          {/* Vetted Box */}
          <div className="bg-slate-50 border border-border-subtle rounded-2xl p-[22px] flex gap-3.5">
            <IconShieldCheck className="w-10 h-10 text-secondary shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-primary mb-1">Vetted & Verified educator</h4>
              <p className="text-[11px] text-text-muted/90 leading-relaxed">
                Credentials, certifications, and teaching standards of this mentor have been thoroughly vetted by Tutoboard quality managers.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="bg-[#0f2347] text-white py-12 mt-auto">
        <div className="px-6 md:px-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="font-heading text-xl font-extrabold text-white mb-3">
                Tuto<span className="text-accent">board</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed max-w-[280px]">
                India's most trusted online tutoring platform. Learn at your pace, with the best mentors.
              </p>
            </div>
            <div>
              <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-4">
                Company
              </div>
              <ul className="space-y-2.5 text-xs text-white/60">
                <li>
                  <a href="/#about" className="hover:text-white transition-colors">About us</a>
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
