"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IconStar,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandYoutube,
  IconAward,
  IconBriefcase,
  IconShieldCheck,
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

interface MentorProfile {
  id: string;
  name: string;
  expertise: string[];
  subject: string;
  rating: number;
  students: number;
  courses: number;
  rate: number;
  verified: boolean;
  avatarText: string;
  avatarBg: string;
  qualification: string;
  experience: number;
  bio: string;
}

interface CourseData {
  id: string;
  title: string;
  description: string;
  subject: string;
  format: string;
  price: number;
  mentor: string;
  students: number;
  rating: number;
  status: string;
  colorBg: string;
  iconName: string;
}

interface SessionData {
  id: string;
  title: string;
  description: string;
  mentor: string;
  mentorAvatar: string;
  mentorColor: string;
  type: string;
  bookings: number;
  subject: string;
  price: number;
  status: string;
  colorBg: string;
  iconName: string;
}

interface MentorDetailsResponse {
  mentor: MentorProfile;
  courses: CourseData[];
  sessions: SessionData[];
}

export default function MentorDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [data, setData] = useState<MentorDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getMentorDetailsData(id);
        setData(res as MentorDetailsResponse);
      } catch (err: unknown) {
        console.error("Failed to load mentor details:", err);
        setError("Failed to load mentor details. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (error || (!loading && !data)) {
    return (
      <div className="w-full bg-white text-primary flex-1 min-h-screen flex flex-col font-sans">
        <div className="flex flex-col items-center justify-center flex-1 min-h-[400px] p-6 bg-white">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center shadow-md">
            <h2 className="font-heading text-lg font-bold text-red-700 mb-2">Error Loading Profile</h2>
            <p className="text-sm text-text-muted mb-6">{error || "Mentor not found."}</p>
            <Link href="/mentors" className="text-xs font-semibold px-6 py-3 bg-primary text-white rounded-lg hover:shadow-md transition-all">
              Back to Mentors
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full bg-white text-primary flex-1 min-h-screen flex flex-col font-sans">
        
        {/* Shimmering Header */}
        <header className="bg-surface px-6 md:px-12 py-8 border-b border-border-subtle">
          <div className="max-w-7xl mx-auto space-y-3">
            <div className="h-4 w-32 bg-slate-250 rounded animate-pulse"></div>
            <div className="h-8 w-64 bg-slate-200 rounded animate-pulse"></div>
          </div>
        </header>

        {/* Shimmering Content */}
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start flex-1">
          {/* Left Column Skeletons */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio Box Skeleton */}
            <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm space-y-4">
              <div className="h-6 w-40 bg-slate-200 rounded animate-shimmer"></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-100 rounded animate-shimmer"></div>
                <div className="h-4 w-full bg-slate-100 rounded animate-shimmer"></div>
                <div className="h-4 w-2/3 bg-slate-100 rounded animate-shimmer"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border-subtle pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-lg animate-shimmer"></div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-16 bg-slate-200 rounded animate-shimmer"></div>
                    <div className="h-4 w-28 bg-slate-100 rounded animate-shimmer"></div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-lg animate-shimmer"></div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-16 bg-slate-200 rounded animate-shimmer"></div>
                    <div className="h-4 w-28 bg-slate-100 rounded animate-shimmer"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Courses Grid Skeleton */}
            <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-6 w-48 bg-slate-200 rounded animate-shimmer"></div>
                <div className="h-4 w-24 bg-slate-100 rounded animate-shimmer"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="border border-border-subtle rounded-xl p-4 space-y-3 bg-white">
                    <div className="h-4 w-12 bg-slate-100 rounded animate-shimmer"></div>
                    <div className="h-5 w-full bg-slate-200 rounded animate-shimmer"></div>
                    <div className="h-4 w-3/4 bg-slate-100 rounded animate-shimmer"></div>
                    <div className="h-10 w-full bg-slate-50 rounded animate-shimmer"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sessions Conducted Skeleton */}
            <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-6 w-56 bg-slate-200 rounded animate-shimmer"></div>
                <div className="h-4 w-24 bg-slate-100 rounded animate-shimmer"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="border border-border-subtle rounded-xl p-4 space-y-3 bg-white">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-20 bg-slate-100 rounded-full animate-shimmer"></div>
                      <div className="h-4 w-14 bg-slate-100 rounded animate-shimmer"></div>
                    </div>
                    <div className="h-4 w-full bg-slate-200 rounded animate-shimmer"></div>
                    <div className="h-3 w-full bg-slate-100 rounded animate-shimmer"></div>
                    <div className="h-3 w-2/3 bg-slate-100 rounded animate-shimmer"></div>
                    <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                      <div className="h-3.5 w-8 bg-slate-100 rounded animate-shimmer"></div>
                      <div className="h-4 w-14 bg-slate-100 rounded animate-shimmer"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (Overview Card) Skeleton */}
          <div className="space-y-6">
            <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-slate-100 animate-shimmer"></div>
              <div className="h-6 w-36 bg-slate-200 rounded animate-shimmer"></div>
              <div className="h-4 w-44 bg-slate-100 rounded animate-shimmer"></div>
              <div className="w-full grid grid-cols-3 gap-2 py-4 border-t border-b border-border-subtle my-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="space-y-1">
                    <div className="h-3 w-10 bg-slate-100 rounded mx-auto animate-shimmer"></div>
                    <div className="h-4 w-12 bg-slate-200 rounded mx-auto animate-shimmer"></div>
                  </div>
                ))}
              </div>
              <div className="h-5 w-32 bg-slate-100 rounded animate-shimmer"></div>
              <div className="h-12 w-full bg-slate-200 rounded animate-shimmer"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { mentor, courses, sessions } = data!;

  return (
    <div className="w-full bg-white text-primary flex-1 min-h-screen flex flex-col font-sans">
      <title>{`${mentor.name} - Expert Subject Tutor | Gadha Online`}</title>
      <meta name="description" content={`Explore courses and hourly sessions taught by ${mentor.name}, verified educator specializing in ${mentor.subject || "tutoring"} on Gadha Online.`} />

      {/* HEADER SECTION */}
      <header className="bg-surface px-6 md:px-12 py-8 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-xs text-text-muted mb-4 flex items-center gap-1.5 font-medium">
            <Link href="/" className="hover:text-secondary transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <Link href="/mentors" className="hover:text-secondary transition-colors">Mentors</Link>
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
        <div className="order-2 lg:order-none lg:col-span-2 space-y-8">

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
                {courses.slice(0, 4).map((c: CourseData) => (
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
                {sessions.slice(0, 2).map((s: SessionData) => (
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
        <div className="order-1 lg:order-none space-y-6">
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

            <div className="w-full grid grid-cols-2 gap-2 py-4 border-t border-b border-border-subtle my-5 text-center">
              <div>
                <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider block">Rating</span>
                <span className="text-xs font-extrabold text-primary block mt-0.5">★ {mentor.rating}</span>
              </div>
              <div className="border-l border-border-subtle">
                <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider block">Experience</span>
                <span className="text-xs font-extrabold text-primary block mt-0.5">{mentor.experience} yrs</span>
              </div>
            </div>
          </div>

          {/* Vetted Box */}
          <div className="bg-slate-50 border border-border-subtle rounded-2xl p-[22px] flex gap-3.5">
            <IconShieldCheck className="w-10 h-10 text-secondary shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-primary mb-1">Vetted & Verified educator</h4>
              <p className="text-[11px] text-text-muted/90 leading-relaxed">
                Credentials, certifications, and teaching standards of this mentor have been thoroughly vetted by Gadha Online quality managers.
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
              <div className="flex items-center gap-2 mb-3">
                <Image src="/logo.png" alt="Gadha Online" width={40} height={40} className="w-10 h-10 object-contain" />
                <span className="font-heading text-xl font-extrabold text-white">Gadha Online</span>
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
                  <Link href="/about" className="hover:text-white transition-colors">About us</Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-4">
                Explore
              </div>
              <ul className="space-y-2.5 text-xs text-white/60">
                <li>
                  <Link href="/courses" className="hover:text-white transition-colors">Courses</Link>
                </li>
                <li>
                  <Link href="/sessions" className="hover:text-white transition-colors">Sessions</Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-4">
                Legal
              </div>
              <ul className="space-y-2.5 text-xs text-white/60">
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
            <p>&copy; 2026 Gadha Online. All rights reserved.</p>
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
