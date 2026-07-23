"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IconCheck,
  IconClock,
  IconUsers,
  IconCalendar,
  IconWorld,
  IconDeviceLaptop,
  IconMessageCircle,
  IconRotate,
  IconStar,
  IconShieldCheck,
  IconCalculator,
  IconFlask,
  IconPencil,
  IconCode,
  IconBook,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandYoutube,
} from "@tabler/icons-react";
import { getSessionDetails, getItemReviews, addReview } from "../../actions";
import BookingModal from "@/components/BookingModal";
import { MobileStickyBookingBar } from "@/components/MobileStickyBookingBar";

// Dynamic Icon Picker Helper
const getDetailsIcon = (name: string) => {
  switch (name) {
    case "math":
    case "calculator":
      return <IconCalculator className="w-20 h-20 text-[#0c447c] opacity-85" />;
    case "code":
      return <IconCode className="w-20 h-20 text-green-700 opacity-85" />;
    case "flask":
    case "science":
      return <IconFlask className="w-20 h-20 text-yellow-800 opacity-85" />;
    case "writing":
    case "pencil":
      return <IconPencil className="w-20 h-20 text-purple-700 opacity-85" />;
    default:
      return <IconBook className="w-20 h-20 text-[#1B3A6B] opacity-85" />;
  }
};

// Covered checklist generator by subject
const getCoveredTopics = (subject: string) => {
  switch (subject) {
    case "Mathematics":
      return [
        "Confidence intervals & margin of error",
        "Hypothesis testing (Z-test, T-test)",
        "Probability distributions explained",
        "Past paper question walkthroughs",
        "Live problem-solving with feedback",
        "Summary notes sent after session",
      ];
    case "Programming":
      return [
        "Object-oriented programming concepts",
        "Algorithms & complexity analysis",
        "Debugging & troubleshooting code live",
        "Live code reviews and feedback",
        "Solving coding challenges (LeetCode style)",
        "Source code and summary notes sent after",
      ];
    case "Science":
      return [
        "Core scientific laws & theories",
        "Complex physical and chemical calculations",
        "Mock test questions walkthroughs",
        "Visual animations of biological/physical processes",
        "Interactive whiteboard explanations",
        "Detailed formula sheets and notes sent after",
      ];
    case "English":
      return [
        "Structuring thesis statements and body paragraphs",
        "Persuasive and analytical essay writing styles",
        "Vocabulary & rhetorical devices enhancement",
        "Grammar, syntax, and punctuation check",
        "Live feedback on essay drafts",
        "Annotated exemplars sent after session",
      ];
    default:
      return [
        "Core subject fundamentals walkthroughs",
        "Step-by-step problem solving solutions",
        "Interactive doubt-solving support",
        "Custom worksheets and diagnostic questions",
        "Exam board syllabus coverage guide",
        "Revision notes sent within 2 hours",
      ];
  }
};

interface RelatedSession {
  id: string;
  title: string;
  subject: string;
  type: string;
  price: number;
  mentor: string;
  bookings: number;
  colorBg: string;
  iconName: string;
}

interface SessionDetailsData {
  id: string;
  title: string;
  description: string;
  subject: string;
  type: string;
  price: number;
  class_level?: string;
  bookings: number;
  colorBg: string;
  iconName: string;
  aboutSession: string;
  whatsCovered: string[];
  inclusions: string[];
  inclusionsEnabled?: boolean[];
  durationOptions: string;
  platform: string;
  language: string;
  days: string;
  reschedulePolicy: string;
  sessionDate?: string;
  sessionTime?: string;
  isRepeatable?: boolean;
  mentor: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    avatarText: string;
    expertise: string;
    rating: number;
    qualification: string;
    experience: number;
    bio: string;
  };
}

interface SessionDetailsResponse {
  session: SessionDetailsData;
  related: RelatedSession[];
}

export default function SessionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [data, setData] = useState<SessionDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking details states
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const [reviews, setReviews] = useState<Awaited<ReturnType<typeof getItemReviews>>>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewName, setNewReviewName] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      const data = await getItemReviews(id, "session");
      setReviews(data);
    } catch (e) {
      console.error("Failed to load reviews:", e);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getSessionDetails(id);
        setData(res as SessionDetailsResponse);
      } catch (err: unknown) {
        console.error("Failed to load session details:", err);
        setError("Couldn't load this session. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate fetch-on-mount; setState fires after the awaited request resolves, not synchronously
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadReviews is redefined each render but only reads id, which is already tracked
  }, [id]);

  const handleAddReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newReviewRating < 1 || newReviewRating > 5) return;
    setSubmittingReview(true);
    try {
      await addReview({
        itemId: id,
        type: "session",
        rating: newReviewRating,
        comment: newReviewComment.trim(),
        studentName: newReviewName.trim() || undefined,
      });
      setNewReviewComment("");
      setNewReviewName("");
      setNewReviewRating(5);
      setReviewModalOpen(false);
      await loadReviews();
      alert("Review submitted successfully!");
    } catch (err) {
      console.error("Failed to submit review:", err);
      alert("Couldn't submit your review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="w-full bg-white text-primary flex-1 min-h-screen flex flex-col font-sans">

      {loading ? (
        <div className="w-full">
          {/* Shimmering Breadcrumbs */}
          <div className="bg-surface border-b border-border-subtle py-4 px-6 md:px-12">
            <div className="max-w-7xl mx-auto space-y-2">
              <div className="h-3 w-48 bg-slate-100 rounded animate-shimmer"></div>
            </div>
          </div>

          {/* Shimmering Layout Grid */}
          <div className="max-w-7xl mx-auto w-full px-6 md:px-12 pt-8 pb-20 lg:pb-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column Skeletons */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hero Banner Banner Skeleton */}
              <div className="w-full h-72 bg-slate-150 rounded-2xl animate-shimmer"></div>

              {/* Title & Info Box Skeleton */}
              <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex gap-2">
                  <div className="h-4 w-16 bg-slate-100 rounded animate-shimmer"></div>
                  <div className="h-4 w-24 bg-slate-100 rounded animate-shimmer"></div>
                </div>
                <div className="h-8 w-3/4 bg-slate-200 rounded animate-shimmer"></div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-slate-100 rounded animate-shimmer"></div>
                  <div className="h-4 w-full bg-slate-100 rounded animate-shimmer"></div>
                  <div className="h-4 w-2/3 bg-slate-100 rounded animate-shimmer"></div>
                </div>
              </div>

              {/* Covered Topics Skeleton */}
              <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm space-y-3">
                <div className="h-6 w-48 bg-slate-200 rounded animate-shimmer mb-4"></div>
                {[1, 2, 3].map((m) => (
                  <div key={m} className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-100 rounded animate-shimmer"></div>
                    <div className="h-3.5 w-1/2 bg-slate-100 rounded animate-shimmer"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column Booking Card Skeleton */}
            <div className="space-y-6">
              <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 animate-shimmer"></div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-24 bg-slate-200 rounded animate-shimmer"></div>
                    <div className="h-3 w-16 bg-slate-100 rounded animate-shimmer"></div>
                  </div>
                </div>
                <div className="space-y-3 border-t border-border-subtle pt-4">
                  <div className="h-8 w-full bg-slate-50 rounded animate-shimmer"></div>
                  <div className="h-5 w-32 bg-slate-100 rounded animate-shimmer mx-auto"></div>
                  <div className="h-10 w-full bg-slate-250 rounded-lg animate-shimmer"></div>
                </div>
                <div className="space-y-2 border-t border-border-subtle pt-4">
                  {[1, 2, 3, 4, 5].map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-slate-100 rounded animate-shimmer"></div>
                      <div className="h-3 w-3/4 bg-slate-100 rounded animate-shimmer"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : error || !data ? (
        <div className="flex flex-col items-center justify-center flex-1 min-h-[400px] p-6 bg-white">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center shadow-md">
            <h2 className="font-heading text-lg font-bold text-red-700 mb-2">Error Loading Session</h2>
            <p className="text-sm text-text-muted mb-6">{error || "Session not found."}</p>
            <Link href="/sessions" className="text-xs font-semibold px-6 py-3 bg-primary text-white rounded-lg hover:shadow-md transition-all">
              Back to Sessions
            </Link>
          </div>
        </div>
      ) : (() => {
        const { session, related } = data!;
        const coveredTopics = (session.whatsCovered && session.whatsCovered.length > 0)
          ? session.whatsCovered
          : getCoveredTopics(session.subject);

        // Inclusions array binding
        const defaults = [
          "Live on Zoom — any device",
          "Summary notes after session",
          "Free reschedule up to 4 hrs before",
          "Pre-session topic form",
          "Payment coordinated after booking confirmation"
        ];
        const inclusionsList = [0, 1, 2, 3, 4].map((idx) => {
          return (session.inclusions && session.inclusions[idx]) || defaults[idx];
        });

        const getInclusionIcon = (idx: number) => {
          switch (idx) {
            case 0: return <IconDeviceLaptop className="w-4.5 h-4.5 text-secondary flex-shrink-0" />;
            case 1: return <IconBook className="w-4.5 h-4.5 text-secondary flex-shrink-0" />;
            case 2: return <IconRotate className="w-4.5 h-4.5 text-secondary flex-shrink-0" />;
            case 3: return <IconMessageCircle className="w-4.5 h-4.5 text-secondary flex-shrink-0" />;
            default: return <IconShieldCheck className="w-4.5 h-4.5 text-secondary flex-shrink-0" />;
          }
        };

        const detailGridItems = [
          {
            label: "Duration",
            value: session.durationOptions || "60 or 90 min",
            icon: <IconClock className="w-5 h-5 text-secondary" />,
            bg: "bg-blue-50"
          },
          {
            label: "Platform",
            value: session.platform || "Zoom",
            icon: <IconDeviceLaptop className="w-5 h-5 text-[#0F6E56]" />,
            bg: "bg-green-50"
          },
          {
            label: "Session type",
            value: session.type === "Group" ? "Group session" : "1-on-1 private",
            icon: <IconUsers className="w-5 h-5 text-[#854F0B]" />,
            bg: "bg-yellow-50"
          },
          {
            label: "Language",
            value: session.language || "English / Hindi",
            icon: <IconWorld className="w-5 h-5 text-[#993556]" />,
            bg: "bg-pink-50"
          },
          {
            label: "Days",
            value: session.days || "Mon – Sat",
            icon: <IconCalendar className="w-5 h-5 text-[#534AB7]" />,
            bg: "bg-purple-50"
          },
          {
            label: "Reschedule",
            value: session.reschedulePolicy || "Up to 4 hrs before",
            icon: <IconRotate className="w-5 h-5 text-secondary" />,
            bg: "bg-blue-50"
          }
        ];

        return (
          <>

      {/* BREADCRUMB */}
      <div className="bg-surface border-b border-border-subtle py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto text-xs text-text-muted flex items-center gap-1.5 font-medium">
          <Link href="/" className="hover:text-secondary transition-colors">Home</Link>
          <span className="text-slate-300">/</span>
          <Link href="/sessions" className="hover:text-secondary transition-colors">Sessions</Link>
          <span className="text-slate-300">/</span>
          <span className="hover:text-secondary transition-colors truncate max-w-[150px] sm:max-w-xs">{session.subject}</span>
          <span className="text-slate-300">/</span>
          <span className="text-primary font-semibold truncate max-w-[200px] sm:max-w-xs">{session.title}</span>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="max-w-7xl mx-auto w-full px-6 md:px-12 pt-8 pb-20 lg:pb-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Cover Header Hero Image */}
          <div 
            className="w-full h-72 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-sm"
            style={{ backgroundColor: session.colorBg }}
          >
            <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
              <span>Hourly · {session.type === "Group" ? "Group session" : "1-on-1"}</span>
            </div>
            {getDetailsIcon(session.iconName)}
          </div>

          {/* HEADER CARD */}
          <div className="border-b border-border-subtle pb-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-badge-bg text-badge-text border border-badge-border">
                {session.subject}
              </span>
              {session.class_level && (
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {session.class_level}
                </span>
              )}
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-150 flex items-center gap-1">
                <IconClock className="w-3 h-3 text-amber-500" />
                HOURLY SESSION
              </span>
            </div>
            
            <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-primary mb-3 leading-tight">
              {session.title}
            </h2>
            
            <p className="text-sm text-text-muted leading-relaxed mb-4">
              {session.description || `A focused ${session.type} session tailored entirely to your level and syllabus needs. Connect directly with your mentor to clear doubts.`}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-muted font-medium pt-2">
              <div className="flex items-center gap-1">
                <span className="text-accent font-bold">★ 4.9</span>
              </div>
              <span className="h-4 w-px bg-border-subtle hidden sm:block"></span>
              <div className="flex items-center gap-1.5">
                <IconUsers className="w-4 h-4 text-slate-400" />
                <span>{session.bookings} completed</span>
              </div>
              <span className="h-4 w-px bg-border-subtle hidden sm:block"></span>
              <div className="flex items-center gap-1.5">
                <IconClock className="w-4 h-4 text-slate-400" />
                <span>{session.durationOptions || "60 or 90 min"}</span>
              </div>
              <span className="h-4 w-px bg-border-subtle hidden sm:block"></span>
              <div className="flex items-center gap-1.5">
                <IconWorld className="w-4 h-4 text-slate-400" />
                <span>English · IST</span>
              </div>
            </div>
          </div>

          {/* MENTOR CARD */}
          <div className="bg-white border border-border-subtle rounded-2xl p-5 sm:p-[22px] shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-heading text-base font-bold text-accent shrink-0">
                  {session.mentor.avatarText}
                </div>
                <div>
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">Your mentor</p>
                  <h4 className="font-heading text-base font-bold text-primary">{session.mentor.name}</h4>
                  <p className="text-xs text-text-muted">{session.mentor.expertise} · {session.mentor.qualification} · {session.mentor.experience} yrs exp</p>
                </div>
              </div>

              {/* Top Right Rating Badge */}
              <div className="flex items-center gap-1 font-bold text-xs text-[#1B3A6B] bg-[#FFFBEB] border border-[#FDE68A] px-2.5 py-1 rounded-full shrink-0">
                <IconStar className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
                <span>{session.mentor.rating}</span>
              </div>
            </div>

            <Link 
              href={`/mentors/${session.mentor.id}`}
              className="w-full block text-xs font-semibold py-2.5 rounded-xl border border-border-subtle hover:border-primary text-primary transition-colors text-center cursor-pointer"
            >
              View profile
            </Link>
          </div>

          {/* SESSION DETAILS GRID */}
          <div className="bg-white border border-border-subtle rounded-2xl p-[22px] shadow-sm">
            <h3 className="font-heading text-base font-bold text-primary mb-3.5">Session details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {detailGridItems.map((item, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-1 hover:shadow-sm transition-shadow">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bg} mb-1`}>
                    {item.icon}
                  </div>
                  <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">{item.label}</span>
                  <span className="text-xs font-bold text-primary">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ABOUT THIS SESSION */}
          {(session.aboutSession || session.description) && (
            <div className="bg-white border border-border-subtle rounded-2xl p-[22px] shadow-sm space-y-2.5">
              <h3 className="font-heading text-base font-bold text-primary">About this session</h3>
              <p className="text-xs md:text-sm text-text-muted leading-relaxed whitespace-pre-line">
                {session.aboutSession || session.description}
              </p>
            </div>
          )}

          {/* WHAT'S COVERED */}
          <div className="bg-white border border-border-subtle rounded-2xl p-[22px] shadow-sm">
            <h3 className="font-heading text-base font-bold text-primary mb-3.5">What&apos;s covered</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {coveredTopics.map((topic: string, index: number) => (
                <div key={index} className="flex items-start gap-2.5 text-xs text-slate-700 leading-normal">
                  <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5 border border-green-150">
                    <IconCheck className="w-3.5 h-3.5 text-green-700 stroke-[3]" />
                  </div>
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          </div>

          {/* HOW IT WORKS */}
          <div className="bg-white border border-border-subtle rounded-2xl p-[22px] shadow-sm">
            <h3 className="font-heading text-base font-bold text-primary mb-3.5">How it works</h3>
            <div className="flex flex-col">
              {[
                {
                  step: 1,
                  title: "Pick a time slot",
                  desc: "Choose from the mentor's live availability calendar in the booking panel."
                },
                {
                  step: 2,
                  title: "Share your goals",
                  desc: "After booking, fill a short form about your exam board, syllabus, and weak topics."
                },
                {
                  step: 3,
                  title: "Join live on Zoom",
                  desc: "You'll receive a Zoom link 30 minutes before the session. Join from any device."
                },
                {
                  step: 4,
                  title: "Get your summary notes",
                  desc: `Within 2 hours, ${session.mentor.name} shares key points and practice problems over chat.`
                }
              ].map((step, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center font-heading text-xs font-bold text-accent">
                      {step.step}
                    </div>
                    {index < 3 && <div className="w-0.5 flex-1 bg-slate-100 my-1"></div>}
                  </div>
                  <div className="pb-4 flex-1">
                    <h5 className="text-xs font-bold text-primary mb-0.5">{step.title}</h5>
                    <p className="text-[11px] text-text-muted leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STUDENT REVIEWS */}
          <div className="bg-white border border-border-subtle rounded-2xl p-[22px] shadow-sm space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="font-heading text-base font-extrabold text-primary">Student reviews</h3>
              <button
                onClick={() => setReviewModalOpen(true)}
                className="text-[11px] font-bold text-secondary hover:text-secondary/80 border border-secondary px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                Write a review
              </button>
            </div>
            
            {loadingReviews ? (
              <p className="text-xs text-text-muted py-2">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <div className="w-full py-6 text-center space-y-1">
                <p className="text-xs font-bold text-primary">No reviews yet</p>
                <p className="text-[10.5px] text-text-muted">Be the first to share your learning experience!</p>
              </div>
            ) : (
              <div className="overflow-hidden relative w-full pb-2 [mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)]">
                <div className="animate-marquee gap-4">
                  {[...reviews, ...reviews, ...reviews, ...reviews].map((r, idx) => (
                    <div key={`${r.id}-${idx}`} className="w-[260px] sm:w-[280px] shrink-0 border border-border-subtle rounded-2xl p-4 shadow-sm space-y-2 bg-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7.5 h-7.5 rounded-full bg-secondary/10 flex items-center justify-center text-[10px] font-bold text-secondary">
                          {r.avatarText}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-primary">{r.studentName}</p>
                          <p className="text-[9px] text-text-muted">
                            {new Date(r.createdAt ?? 0).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </p>
                        </div>
                        <div className="ml-auto text-[11px] text-accent font-bold">
                          {"★".repeat(r.rating) + "☆".repeat(5 - r.rating)}
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-text-muted">
                        {r.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN (SIDEBAR) */}
        <div className="space-y-4">
          
          {/* Price + Booking Panel */}
          <div className="bg-white border border-border-subtle rounded-2xl p-5 shadow-md space-y-4">
            
            {/* Price section */}
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-heading text-3xl font-extrabold text-primary">
                  ₹{session.price.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-text-muted font-medium">
                  {session.type === "Group" ? "/ session" : "/ hour"}
                </span>
              </div>

              {session.type === "Group" && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs text-left">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <IconCalendar className="w-4 h-4 text-secondary shrink-0" />
                    <span>
                      {session.isRepeatable
                        ? `Every ${session.days || "Saturday"}`
                        : (session.sessionDate
                            ? new Date(session.sessionDate).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })
                            : "Date TBA")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-text-muted font-medium pl-6">
                    <IconClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{session.sessionTime || "Time TBA"} IST</span>
                  </div>
                  {session.isRepeatable && (
                    <div className="text-[10px] text-blue-700 bg-blue-50/60 border border-blue-100 rounded-lg p-2 mt-1.5 font-medium leading-relaxed">
                      📅 This group session runs every week. Book for the day that works best for you.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2 pt-2">
              <button 
                onClick={() => setBookingModalOpen(true)}
                className="w-full font-semibold text-xs py-3.5 bg-secondary text-white rounded-xl hover:bg-secondary/90 transition-colors shadow-md cursor-pointer text-center"
              >
                Book session
              </button>
            </div>

          </div>

          {/* What's included card */}
          <div className="bg-white border border-border-subtle rounded-2xl p-5 shadow-sm space-y-3">
            <p className="text-[9px] text-primary font-bold uppercase tracking-wider mb-1.5">What&apos;s included</p>
            {inclusionsList.map((incItem: string, iIdx: number) => {
              const isEnabled = !session.inclusionsEnabled || session.inclusionsEnabled[iIdx] !== false;
              if (!isEnabled) return null;
              return (
                <div key={iIdx} className="flex items-center gap-3 text-xs text-slate-700 pb-2.5 last:pb-0 border-b border-slate-50 last:border-0">
                  {getInclusionIcon(iIdx)}
                  <span>{incItem}</span>
                </div>
              );
            })}
          </div>

          {/* Guarantee card */}
          <div className="bg-[#dcfce7] border border-[#bbf7d0] rounded-2xl p-[16px] flex items-start gap-2.5 shadow-sm">
            <IconShieldCheck className="w-5 h-5 text-[#0F6E56] flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-[#0F6E56] mb-0.5">Money-back guarantee</h5>
              <p className="text-[10px] text-[#166534] leading-relaxed">
                Not satisfied? Get a full refund within 24 hours of your session, no questions asked.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* RELATED SESSIONS STRIP */}
      {related.length > 0 && (
        <div className="border-t border-border-subtle bg-white/60 py-10 mt-6">
          <div className="max-w-7xl mx-auto px-6 md:px-[28px]">
            <h3 className="font-heading text-base font-bold text-primary mb-5">Related sessions</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((rs: RelatedSession) => (
                <Link 
                  href={`/sessions/${rs.id}`}
                  key={rs.id}
                  className="bg-white border border-border-subtle rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div 
                    className="w-full h-28 flex items-center justify-center" 
                    style={{ backgroundColor: rs.colorBg }}
                  >
                    {getDetailsIcon(rs.iconName)}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 mb-2 inline-block">
                        {rs.type}
                      </span>
                      <h4 className="font-heading text-sm font-bold text-primary mb-2 line-clamp-1 group-hover:text-secondary transition-colors">
                        {rs.title}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-slate-50 font-semibold">
                      <span>★ 4.9 ({rs.bookings})</span>
                      <strong className="text-primary font-extrabold text-base">₹{rs.price.toLocaleString("en-IN")}/hr</strong>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-[#0f2347] text-white py-10 mt-auto">
        <div className="px-6 md:px-[28px] max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Image src="/logo.png" alt="Gadha Online" width={36} height={36} className="w-9 h-9 object-contain" />
                <span className="font-heading text-lg font-extrabold text-white">Gadha Online</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed max-w-[280px]">
                India&apos;s most trusted online tutoring platform. Learn at your pace, with the best mentors.
              </p>
            </div>
            <div>
              <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-3">
                Company
              </div>
              <ul className="space-y-2 text-xs text-white/60">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">About us</Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-3">
                Explore
              </div>
              <ul className="space-y-2 text-xs text-white/60">
                <li>
                  <Link href="/courses" className="hover:text-white transition-colors">Courses</Link>
                </li>
                <li>
                  <Link href="/sessions" className="hover:text-white transition-colors">Sessions</Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-3">
                Legal
              </div>
              <ul className="space-y-2 text-xs text-white/60">
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
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
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        targetId={session.id}
        targetType="session"
        title={session.title}
        price={session.price}
        mentorName={session.mentor.name}
        isLiveIndividual={session.type !== "Group"}
      />
      <MobileStickyBookingBar
        price={session.price}
        priceSuffix="/hr"
        ctaLabel="Book session"
        onCtaClick={() => setBookingModalOpen(true)}
      />

      {/* REVIEW SUBMISSION MODAL */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-xs z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-border-subtle max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="font-heading text-base font-bold text-primary">Write a Review</h3>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer text-text-muted font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddReviewSubmit} className="space-y-4 text-left">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-primary uppercase">Your Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Anonymous Student"
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-primary uppercase">Rating</label>
                <div className="flex items-center gap-1.5 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewRating(star)}
                      className="text-xl cursor-pointer transition-transform hover:scale-110"
                    >
                      {star <= newReviewRating ? (
                        <IconStar className="w-6 h-6 text-accent fill-accent" />
                      ) : (
                        <IconStar className="w-6 h-6 text-slate-300" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-primary uppercase">Review Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share your learning experience with this session..."
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none resize-none h-24"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full text-xs font-bold py-2.5 rounded-xl bg-secondary text-white hover:bg-secondary/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        </div>
      )}
          </>
        );
      })()}
    </div>
  );
}
