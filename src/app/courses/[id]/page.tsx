"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconStar,
  IconClock,
  IconUsers,
  IconCalendar,
  IconWorld,
  IconBook,
  IconPencil,
  IconFlask,
  IconCode,
  IconMap,
  IconCalculator,
  IconDeviceLaptop,
  IconMessageCircle,
  IconCertificate,
  IconVideo,
  IconRotate,
  IconInfinity,
  IconBroadcast,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandYoutube,
} from "@tabler/icons-react";
import { getCourseDetails, getItemReviews, addReview } from "../../actions";
import BookingModal from "@/components/BookingModal";
import { MobileStickyBookingBar } from "@/components/MobileStickyBookingBar";

// Dynamic Icon Picker Helper
const getDetailsIcon = (name: string) => {
  switch (name) {
    case "math":
    case "calculator":
      return <IconMath className="w-16 h-16 text-secondary" />;
    case "code":
      return <IconCode className="w-16 h-16 text-green-700" />;
    case "flask":
    case "science":
      return <IconFlask className="w-16 h-16 text-yellow-700" />;
    case "writing":
    case "pencil":
      return <IconPencil className="w-16 h-16 text-purple-700" />;
    case "map":
      return <IconMap className="w-16 h-16 text-pink-700" />;
    default:
      return <IconBook className="w-16 h-16 text-primary" />;
  }
};

// Subject Color Class Mapper
const getSubjectBgColor = (subject: string) => {
  switch (subject) {
    case "Mathematics":
      return "bg-blue-50";
    case "Programming":
      return "bg-green-50";
    case "Science":
      return "bg-yellow-50";
    case "English":
      return "bg-purple-50";
    default:
      return "bg-slate-50";
  }
};

// Helper to resolve icon from react icons
const IconMath = ({ className }: { className?: string }) => <IconCalculator className={className} />;

// Dynamic Syllabus Content generator
function getDynamicSyllabus(subject: string) {
  if (subject === "Mathematics") {
    return [
      {
        name: "Module 1 — Limits & Continuity",
        meta: "5 lessons · 6h 20m",
        lessons: ["Introduction to limits", "Continuity and discontinuity", "L'Hôpital's rule"]
      },
      {
        name: "Module 2 — Differentiation",
        meta: "7 lessons · 9h 10m",
        lessons: ["Rules of differentiation", "Chain rule & implicit differentiation", "Applications: maxima & minima"]
      },
      {
        name: "Module 3 — Integration & Linear Algebra",
        meta: "9 lessons · 12h 45m",
        lessons: ["Definite and indefinite integrals", "Matrices and determinants", "Vector spaces and transformations"]
      }
    ];
  }
  if (subject === "Programming") {
    return [
      {
        name: "Module 1 — Python Basics",
        meta: "6 lessons · 5h 45m",
        lessons: ["Variables & Data Types", "Control Flow & Loops", "Functions & Scope"]
      },
      {
        name: "Module 2 — OOP & Data Structures",
        meta: "8 lessons · 8h 30m",
        lessons: ["Classes and Objects", "Lists, Dicts, and Sets", "File I/O and Error Handling"]
      },
      {
        name: "Module 3 — Real-World Applications",
        meta: "10 lessons · 14h 15m",
        lessons: ["Web Scraping with BeautifulSoup", "API Integrations", "Final Capstone Project"]
      }
    ];
  }
  if (subject === "Science") {
    return [
      {
        name: "Module 1 — Core Principles",
        meta: "5 lessons · 7h 00m",
        lessons: ["Fundamental Concepts", "Atomic Structure & Chemical Bonding", "Laws of Motion & Mechanics"]
      },
      {
        name: "Module 2 — Advanced Topics",
        meta: "7 lessons · 10h 00m",
        lessons: ["Thermodynamics & Kinetics", "Organic Chemistry Basics", "Electromagnetism & Optics"]
      },
      {
        name: "Module 3 — Exam Prep & Worksheets",
        meta: "9 lessons · 15h 00m",
        lessons: ["Mock Test Reviews", "NEET/JEE Problem Sets", "Doubt Clearing Sessions"]
      }
    ];
  }
  if (subject === "English") {
    return [
      {
        name: "Module 1 — Essay Fundamentals",
        meta: "4 lessons · 4h 30m",
        lessons: ["Thesis Statement & Outline", "Introduction & Hook Writing", "Body Paragraphs & Transitions"]
      },
      {
        name: "Module 2 — Rhetoric & Style",
        meta: "6 lessons · 7h 00m",
        lessons: ["Persuasive Techniques", "Grammar & Punctuation Polish", "Editing and Peer Reviews"]
      },
      {
        name: "Module 3 — Advanced Writing",
        meta: "8 lessons · 10h 00m",
        lessons: ["Creative Writing Exercises", "Timed Essay Writing Prep", "College Application Essays"]
      }
    ];
  }
  // Default
  return [
    {
      name: "Module 1 — Fundamentals",
      meta: "5 lessons · 6h 00m",
      lessons: ["Introduction & Baseline", "Core Theories & Concepts", "Worked Examples"]
    },
    {
      name: "Module 2 — Intermediate Concepts",
      meta: "6 lessons · 9h 00m",
      lessons: ["Deep Dive & Application", "Problem Solving Workshops", "Feedback Sessions"]
    }
  ];
}

// Dynamic Learning Outcomes generator
function getDynamicLearningOutcomes(subject: string) {
  if (subject === "Mathematics") {
    return [
      "Master differentiation and integration techniques",
      "Solve complex limit and continuity problems",
      "Build strong matrix and vector space fundamentals",
      "Apply calculus to real-world physics problems",
      "Practice with 500+ curated problem sets",
      "Prepare for JEE, NEET and board exam patterns"
    ];
  }
  if (subject === "Programming") {
    return [
      "Master Python syntax and core coding concepts",
      "Solve algorithm and data structure problems",
      "Build custom scripts and web crawlers",
      "Understand object-oriented programming (OOP)",
      "Practice with weekly coding assignments",
      "Build a portfolio of 5 capstone projects"
    ];
  }
  if (subject === "Science") {
    return [
      "Understand key scientific principles and concepts",
      "Solve complex physical and chemical numericals",
      "Analyze biological processes and systems",
      "Prepare for NEET, JEE and board patterns",
      "Get detailed worksheets and solutions",
      "Learn experimental and diagnostic methods"
    ];
  }
  if (subject === "English") {
    return [
      "Improve essay structure and argumentation",
      "Master grammar and punctuation fundamentals",
      "Write persuasive and analytical essays",
      "Learn to edit and refine your own writing",
      "Get detailed feedback on weekly essays",
      "Understand classical and modern literature models"
    ];
  }
  return [
    "Master key subject concepts and fundamentals",
    "Build a solid baseline for advanced studies",
    "Get practice worksheets and mock tests",
    "Interactive Q&A and doubt-solving",
    "Weekly assignments and feedback",
    "Achieve confidence in exam preparations"
  ];
}

interface RelatedCourse {
  id: string;
  title: string;
  subject: string;
  format: string;
  price: number;
  mentor: string;
  students: number;
  rating: number;
  colorBg: string;
  iconName: string;
}

interface CourseDetailsData {
  id: string;
  title: string;
  description: string;
  aboutCourse: string;
  subject: string;
  format: string;
  price: number;
  class_level?: string;
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
    students: number;
  };
  students: number;
  rating: number;
  learningOutcomes: string[];
  curriculum: { name: string; meta: string; lessons: string[]; }[];
  inclusions: string[];
  batchStartDate: string;
  batchEndDate: string;
  classDays: string;
  classTiming: string;
  coverImageUrl: string;
  colorBg: string;
  iconName: string;
  languages?: string[];
  durationDays?: number;
  totalSessions?: number;
  sessionsPerWeek?: number;
  inclusionsEnabled?: boolean[];
}

interface CourseDetailsResponse {
  course: CourseDetailsData;
  related: RelatedCourse[];
}

export default function CourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [data, setData] = useState<CourseDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Accordion state (for curriculum)
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({ 0: true });

  const [selectedSlot, setSelectedSlot] = useState({ day: "Wed", time: "7 PM" });
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const sidebarSlots = [
    { day: "Mon", time: "5 PM", status: "booked" },
    { day: "Tue", time: "5 PM", status: "open" },
    { day: "Wed", time: "7 PM", status: "open" },
    { day: "Thu", time: "5 PM", status: "open" },
    { day: "Fri", time: "5 PM", status: "open" },
    { day: "Sat", time: "10 AM", status: "open" },
  ];

  const calendarData = [
    { day: "Mon", slots: [{ time: "5 PM", status: "booked" }, { time: "7 PM", status: "booked" }, { time: "8 PM", status: "open" }] },
    { day: "Tue", slots: [{ time: "5 PM", status: "open" }, { time: "6 PM", status: "open" }, { time: "8 PM", status: "open" }] },
    { day: "Wed", slots: [{ time: "5 PM", status: "booked" }, { time: "6 PM", status: "open" }, { time: "7 PM", status: "open" }] },
    { day: "Thu", slots: [{ time: "5 PM", status: "open" }, { time: "7 PM", status: "open" }, { time: "8 PM", status: "booked" }] },
    { day: "Fri", slots: [{ time: "5 PM", status: "open" }, { time: "6 PM", status: "open" }, { time: "8 PM", status: "open" }] },
    { day: "Sat", slots: [{ time: "10 AM", status: "open" }, { time: "11 AM", status: "open" }, { time: "12 PM", status: "open" }] },
    { day: "Sun", slots: [{ time: "10 AM", status: "booked" }, { time: "11 AM", status: "booked" }, { time: "12 PM", status: "booked" }] },
  ];

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
      const data = await getItemReviews(id, "course");
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
        const res = await getCourseDetails(id);
        setData(res as CourseDetailsResponse);
      } catch (err: unknown) {
        console.error("Failed to load course details:", err);
        setError("Couldn't load this course. Please try again.");
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
        type: "course",
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

  const toggleModule = (index: number) => {
    setExpandedModules((prev) => ({ ...prev, [index]: !prev[index] }));
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

              {/* Syllabus Skeleton */}
              <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm space-y-3">
                <div className="h-6 w-48 bg-slate-200 rounded animate-shimmer mb-4"></div>
                {[1, 2, 3].map((m) => (
                  <div key={m} className="border border-border-subtle rounded-xl p-4 h-12 bg-slate-50 animate-shimmer"></div>
                ))}
              </div>
            </div>

            {/* Right Column Pricing Card Skeleton */}
            <div className="space-y-6">
              <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 animate-shimmer"></div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-24 bg-slate-200 rounded animate-shimmer"></div>
                    <div className="h-3 w-16 bg-slate-100 rounded animate-shimmer"></div>
                  </div>
                </div>
                <div className="space-y-2 border-t border-border-subtle pt-4">
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
            <h2 className="font-heading text-lg font-bold text-red-700 mb-2">Error Loading Course</h2>
            <p className="text-sm text-text-muted mb-6">{error || "Course not found."}</p>
            <Link href="/courses" className="text-xs font-semibold px-6 py-3 bg-primary text-white rounded-lg hover:shadow-md transition-all">
              Back to Courses
            </Link>
          </div>
        </div>
      ) : (() => {
        const { course, related } = data!;
        const isLive = course.format === "Live batch";

        const syllabus = (course.curriculum && course.curriculum.length > 0)
          ? course.curriculum
          : getDynamicSyllabus(course.subject);

        const outcomes = (course.learningOutcomes && course.learningOutcomes.length > 0)
          ? course.learningOutcomes
          : getDynamicLearningOutcomes(course.subject);

        const defaults = isLive
          ? [
              "16 live sessions, 2x weekly",
              "Live on Zoom — join via browser/app",
              "Live doubt-solving every class",
              "7-day replay for missed classes",
              "Certificate on batch completion"
            ]
          : [
              "32 hours of content",
              "Access on mobile & desktop",
              "Certificate of completion",
              "Lifetime access",
              "Weekly live Q&A with mentor"
            ];
        const inclusionsList = [0, 1, 2, 3, 4].map((idx) => {
          return (course.inclusions && course.inclusions[idx]) || defaults[idx];
        });

        const getInclusionIcon = (idx: number) => {
          if (isLive) {
            switch (idx) {
              case 0: return <IconBroadcast className="w-4 h-4 text-secondary flex-shrink-0" />;
              case 1: return <IconDeviceLaptop className="w-4 h-4 text-secondary flex-shrink-0" />;
              case 2: return <IconMessageCircle className="w-4 h-4 text-secondary flex-shrink-0" />;
              case 3: return <IconRotate className="w-4 h-4 text-secondary flex-shrink-0" />;
              default: return <IconCertificate className="w-4 h-4 text-secondary flex-shrink-0" />;
            }
          } else {
            switch (idx) {
              case 0: return <IconClock className="w-4 h-4 text-secondary flex-shrink-0" />;
              case 1: return <IconDeviceLaptop className="w-4 h-4 text-secondary flex-shrink-0" />;
              case 2: return <IconCertificate className="w-4 h-4 text-secondary flex-shrink-0" />;
              case 3: return <IconInfinity className="w-4 h-4 text-secondary flex-shrink-0" />;
              default: return <IconMessageCircle className="w-4 h-4 text-secondary flex-shrink-0" />;
            }
          }
        };

        const oldPrice = Math.round(course.price * 1.66);

        return (
          <>

      {/* BREADCRUMB */}
      <div className="bg-surface border-b border-border-subtle py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto text-xs text-text-muted flex items-center gap-1.5 font-medium">
          <Link href="/" className="hover:text-secondary transition-colors">Home</Link>
          <span className="text-slate-300">/</span>
          <Link href="/courses" className="hover:text-secondary transition-colors">Courses</Link>
          <span className="text-slate-300">/</span>
          <span className="text-primary font-semibold truncate max-w-[200px] sm:max-w-xs">{course.title}</span>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="max-w-7xl mx-auto w-full px-6 md:px-12 pt-8 pb-20 lg:pb-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Cover Hero Banner Image */}
          <div className={`w-full h-72 rounded-2xl flex items-center justify-center relative shadow-sm overflow-hidden ${getSubjectBgColor(course.subject)}`}>
            {course.coverImageUrl ? (
              <Image src={course.coverImageUrl} fill className="object-cover" alt={course.title} />
            ) : (
              getDetailsIcon(course.iconName)
            )}
            {isLive ? (() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const start = course.batchStartDate ? new Date(course.batchStartDate) : null;
              if (start) start.setHours(0, 0, 0, 0);
              const isStarted = start ? today >= start : false;

              return (
                <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                  {isStarted ? "Live batch · In progress" : `Live batch · Starts ${course.batchStartDate || "Monday, 22 Jun"}`}
                </div>
              );
            })() : (
              <div className="absolute top-4 left-4 bg-amber-100 text-amber-800 text-[10px] font-bold px-3.5 py-1.5 rounded-full">
                Self-paced recorded content
              </div>
            )}
          </div>

          {/* Course Title and Header */}
          <div className="border-b border-border-subtle pb-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-badge-bg text-badge-text border border-badge-border">
                {course.subject}
              </span>
              {course.class_level && (
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {course.class_level}
                </span>
              )}
              {isLive && (
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-150 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  LIVE CLASSES
                </span>
              )}
            </div>
            
            <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-primary mb-3 leading-tight">
              {course.title} {isLive && "— Live Batch"}
            </h2>
            
            <p className="text-sm text-text-muted leading-relaxed mb-4">
              {course.description || (isLive 
                ? "Join live, instructor-led sessions twice a week with real-time doubt solving, interactive whiteboards, and group discussions. Every class happens live with your mentor."
                : "A complete, exam-focused course covering fundamentals, core structures, and advanced calculations — designed for board exams and competitive exam aspirants."
              )}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-muted font-medium pt-2">
              <div className="flex items-center gap-1">
                <span className="text-accent font-bold">
                  ★ {reviews.length > 0
                    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                    : "5.0"}
                </span>
                <span>({reviews.length} review{reviews.length === 1 ? "" : "s"})</span>
              </div>
              <span className="h-4 w-px bg-border-subtle hidden sm:block"></span>
              <div className="flex items-center gap-1.5">
                <IconUsers className="w-4 h-4 text-slate-400" />
                <span>{course.students.toLocaleString()} students {isLive ? "in this batch" : "enrolled"}</span>
              </div>
              <span className="h-4 w-px bg-border-subtle hidden sm:block"></span>
              <div className="flex items-center gap-1.5">
                <IconClock className="w-4 h-4 text-slate-400" />
                <span>
                  {(() => {
                    if (isLive && course.batchStartDate && course.batchEndDate) {
                      const start = new Date(course.batchStartDate);
                      const end = new Date(course.batchEndDate);
                      const diffTime = Math.abs(end.getTime() - start.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      const diffWeeks = Math.round(diffDays / 7);
                      return `${diffWeeks}-week program`;
                    }
                    return isLive ? "8-week program" : "32 hours total";
                  })()}
                </span>
              </div>
              <span className="h-4 w-px bg-border-subtle hidden sm:block"></span>
              <div className="flex items-center gap-1.5">
                <IconWorld className="w-4 h-4 text-slate-400" />
                <span>
                  {(course.languages && course.languages.length > 0) 
                    ? course.languages.join(" / ") 
                    : "English"} {isLive && "· IST"}
                </span>
              </div>
            </div>
          </div>

          {/* ABOUT THIS COURSE */}
          <div className="space-y-3">
            <h3 className="font-heading text-lg font-bold text-primary">
              About this {isLive ? "live batch" : "course"}
            </h3>
            {course.aboutCourse ? (
              <p className="text-xs md:text-sm text-text-muted leading-relaxed whitespace-pre-line">
                {course.aboutCourse}
              </p>
            ) : (
              <>
                <p className="text-xs md:text-sm text-text-muted leading-relaxed">
                  {isLive 
                    ? "This is a fully live, instructor-led batch — there are no pre-recorded videos. Classes happen twice a week with an interactive whiteboard, live polls, and breakout rooms for group problem-solving."
                    : "This course is built for students who want a rock-solid foundation in the subject before tackling school exams and competitive tests. Each module combines concept videos, worked examples, and timed practice worksheets."
                  }
                </p>
                <p className="text-xs md:text-sm text-text-muted leading-relaxed">
                  {isLive 
                    ? "Each session is capped at 40 students to ensure everyone gets personal attention. Missed a class? You'll get access to that session's recording for 7 days only, but live attendance is strongly encouraged."
                    : "You'll get lifetime access to all pre-recorded videos, downloadable lecture notes, and weekly live doubt-clearing sessions personally led by the mentor."
                  }
                </p>
              </>
            )}
          </div>

          {/* SYLLABUS ACCORDION (Recorded format only) */}
          {!isLive && (
            <div className="space-y-3">
              <h3 className="font-heading text-lg font-bold text-primary">Course curriculum</h3>
              <div className="space-y-3">
                {syllabus.map((module: { name: string; meta: string; lessons: string[] }, mIdx: number) => (
                  <div key={mIdx} className="border border-border-subtle rounded-xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => toggleModule(mIdx)}
                      className="w-full flex items-center justify-between p-4 bg-surface hover:bg-slate-50 transition-colors text-left"
                    >
                      <div>
                        <p className="text-xs md:text-sm font-semibold text-primary">{module.name}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">{module.meta}</p>
                      </div>
                      {expandedModules[mIdx] ? (
                        <IconChevronUp className="w-4 h-4 text-primary" />
                      ) : (
                        <IconChevronDown className="w-4 h-4 text-primary" />
                      )}
                    </button>
                    
                    {expandedModules[mIdx] && (
                      <div className="bg-white divide-y divide-slate-100 px-4">
                        {module.lessons.map((lesson: string, lIdx: number) => (
                          <div key={lIdx} className="flex items-center gap-2.5 py-3 text-xs text-text-muted">
                            <IconVideo className="w-4 h-4 text-secondary flex-shrink-0" />
                            <span>{lesson}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* AVAILABILITY CALENDAR (Only if Live individual course) */}
          {course.format === "Live individual" && (
            <div className="bg-white border border-border-subtle rounded-2xl p-[22px] shadow-sm">
              <h3 className="font-heading text-base font-bold text-primary mb-1">Availability this week</h3>
              <p className="text-[10px] text-text-muted mb-4">Click an available slot to pick a booking time</p>
              
              <div className="grid grid-cols-7 gap-1.5 mb-4 overflow-x-auto pb-2 premium-scrollbar">
                {calendarData.map((dayData, idx) => (
                  <div key={idx} className="flex flex-col min-w-[50px] text-center">
                    <span className="text-[9px] text-text-muted font-bold uppercase mb-2">{dayData.day}</span>
                    <div className="space-y-1">
                      {dayData.slots.map((slot, sIdx) => {
                        const isSelected = selectedSlot.day === dayData.day && selectedSlot.time === slot.time;
                        const isBooked = slot.status === "booked";
                        
                        let slotClass = "bg-slate-100 text-slate-400 cursor-not-allowed border-transparent";
                        if (slot.status === "open") {
                          if (isSelected) {
                            slotClass = "bg-primary text-white border-primary font-bold";
                          } else {
                            slotClass = "bg-[#E6F1FB] text-[#0C447C] border-[#b5d0f0] hover:bg-secondary hover:text-white";
                          }
                        }
                        
                        return (
                          <button
                            key={sIdx}
                            disabled={isBooked}
                            onClick={() => {
                              if (!isBooked) {
                                setSelectedSlot({ day: dayData.day, time: slot.time });
                              }
                            }}
                            className={`w-full text-[9px] py-1.5 border rounded-lg transition-all text-center focus:outline-none ${slotClass}`}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3.5 border-t border-slate-50 pt-3">
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-medium">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#E6F1FB] border border-[#b5d0f0]"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-medium">
                  <div className="w-2.5 h-2.5 rounded-sm bg-primary"></div>
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-medium">
                  <div className="w-2.5 h-2.5 rounded-sm bg-slate-100"></div>
                  <span>Booked</span>
                </div>
              </div>
            </div>
          )}

          {/* WHAT YOU'LL LEARN */}
          <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm">
            <h3 className="font-heading text-lg font-bold text-primary mb-4">What you&apos;ll learn</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {outcomes.map((item: string, index: number) => (
                <div key={index} className="flex items-start gap-2.5 text-xs text-slate-700 leading-normal">
                  <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5 border border-green-150">
                    <IconCheck className="w-3.5 h-3.5 text-green-700 stroke-[3]" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* MENTOR CARD */}
          <div className="bg-white border border-border-subtle rounded-2xl p-5 sm:p-[22px] shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-heading text-base font-bold text-accent shrink-0">
                  {course.mentor.avatarText}
                </div>
                <div>
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">Your mentor</p>
                  <h4 className="font-heading text-base font-bold text-primary">{course.mentor.name}</h4>
                  <p className="text-xs text-text-muted">{course.mentor.expertise} · {course.mentor.qualification} · {course.mentor.experience} yrs exp</p>
                </div>
              </div>

              {/* Top Right Rating Badge */}
              <div className="flex items-center gap-1 font-bold text-xs text-[#1B3A6B] bg-[#FFFBEB] border border-[#FDE68A] px-2.5 py-1 rounded-full shrink-0">
                <IconStar className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
                <span>{course.mentor.rating}</span>
              </div>
            </div>

            <Link 
              href={`/mentors/${course.mentor.id}`}
              className="w-full block text-xs font-semibold py-2.5 rounded-xl border border-border-subtle hover:border-primary text-primary transition-colors text-center cursor-pointer"
            >
              View profile
            </Link>
          </div>

          {/* STUDENT REVIEWS */}
          <div className="space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="font-heading text-lg font-extrabold text-primary">Student reviews</h3>
              <button
                onClick={() => setReviewModalOpen(true)}
                className="text-xs font-bold text-secondary hover:text-secondary/80 border border-secondary px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                Write a review
              </button>
            </div>
            
            {loadingReviews ? (
              <p className="text-xs text-text-muted">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <div className="w-full border border-dashed border-border-subtle rounded-2xl p-6 text-center space-y-1">
                <p className="text-xs font-bold text-primary">No reviews yet</p>
                <p className="text-[10.5px] text-text-muted">Be the first to share your learning experience!</p>
              </div>
            ) : (
              <div className="overflow-hidden relative w-full pb-2 [mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)]">
                <div className="animate-marquee gap-4">
                  {[...reviews, ...reviews, ...reviews, ...reviews].map((r, idx) => (
                    <div key={`${r.id}-${idx}`} className="w-[280px] sm:w-[320px] shrink-0 border border-border-subtle rounded-2xl p-5 shadow-sm space-y-3 bg-white">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center font-heading text-xs font-bold text-secondary">
                          {r.avatarText}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-primary">{r.studentName}</p>
                          <p className="text-[10px] text-text-muted">
                            {new Date(r.createdAt ?? 0).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </p>
                        </div>
                        <div className="ml-auto text-xs text-accent font-bold flex items-center">
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

        {/* RIGHT COLUMN / SIDEBAR CARD (1/3 width on desktop) */}
        <div className="space-y-6">
          <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-lg space-y-5">
            {isLive && (() => {
              if (!course.batchStartDate) return null;
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const start = new Date(course.batchStartDate);
              start.setHours(0, 0, 0, 0);
              const diffTime = start.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              let statusText = "";
              let bgClass = "bg-red-50 text-red-700 border-red-150";
              let dotClass = "bg-red-500";

              if (diffDays === 0) {
                statusText = "Batch starts today!";
                bgClass = "bg-emerald-50 text-emerald-700 border-emerald-150";
                dotClass = "bg-emerald-500";
              } else if (diffDays === 1) {
                statusText = "Batch starts tomorrow!";
              } else if (diffDays > 1) {
                statusText = `Batch starts in ${diffDays} days`;
              } else {
                statusText = "Batch in progress";
                bgClass = "bg-slate-100 text-slate-700 border-slate-200";
                dotClass = "bg-slate-500";
              }

              return (
                <div className={`text-[10px] font-bold px-3 py-1 rounded-lg border flex items-center gap-1.5 self-start w-fit ${bgClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dotClass}`}></span>
                  {statusText}
                </div>
              );
            })()}
            
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-3xl font-extrabold text-primary">
                  ₹{course.price.toLocaleString("en-IN")}
                </span>
                <span className="text-sm text-slate-400 line-through">
                  ₹{oldPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-text-muted font-medium">
                  {isLive ? (() => {
                    if (course.batchStartDate && course.batchEndDate) {
                      const start = new Date(course.batchStartDate);
                      const end = new Date(course.batchEndDate);
                      const diffTime = Math.abs(end.getTime() - start.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      const diffWeeks = Math.round(diffDays / 7);
                      return `/ ${diffWeeks}-week batch`;
                    }
                    return "/ 8-week batch";
                  })() : "/ course"}
                </span>
              </div>
              {!isLive && (
                <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-md bg-amber-100 text-amber-800">
                  40% OFF — Limited time
                </span>
              )}
            </div>

            {course.format === "Live individual" && (
              <>
                {/* Next Available */}
                <div className="flex items-center gap-3 bg-[#F5F8FF] border border-border-subtle rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                    <IconCalendar className="w-4.5 h-4.5 text-accent" />
                  </div>
                  <div>
                    <p className="text-[9px] text-secondary font-bold uppercase tracking-wider">Next available slot</p>
                    <p className="text-xs font-semibold text-primary">
                      {selectedSlot.day}, 25 Jun · {selectedSlot.time} IST
                    </p>
                  </div>
                </div>

                {/* Slot picker grid */}
                <div>
                  <p className="text-[9px] text-primary font-bold uppercase tracking-wider mb-2">Pick a slot</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {sidebarSlots.map((slot, idx) => {
                      const isSelected = selectedSlot.day === slot.day && selectedSlot.time === slot.time;
                      const isBooked = slot.status === "booked";
                      
                      let slotClass = "border-border-subtle text-text-muted hover:border-secondary hover:text-secondary";
                      if (isBooked) {
                        slotClass = "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed";
                      } else if (isSelected) {
                        slotClass = "bg-primary text-white border-primary font-bold shadow-sm";
                      }
                      
                      return (
                        <button
                          key={idx}
                          disabled={isBooked}
                          onClick={() => setSelectedSlot({ day: slot.day, time: slot.time })}
                          className={`text-center py-2.5 border rounded-lg text-[10px] font-semibold transition-all focus:outline-none cursor-pointer ${slotClass}`}
                        >
                          {slot.day} · {slot.time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <button 
              onClick={() => setBookingModalOpen(true)}
              className="w-full font-semibold text-sm py-3.5 bg-secondary text-white rounded-xl hover:bg-secondary/90 transition-colors cursor-pointer shadow-md"
            >
              {course.format === "Live individual" ? "Book 1-on-1 Course" : isLive ? "Reserve your seat" : "Book now"}
            </button>

            <hr className="border-t border-slate-100" />

            {/* Inclusions */}
            <div className="space-y-3">
              {inclusionsList.map((incItem: string, idx: number) => {
                const isEnabled = !course.inclusionsEnabled || course.inclusionsEnabled[idx] !== false;
                if (!isEnabled) return null;
                return (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700">
                    {getInclusionIcon(idx)}
                    <span>{incItem}</span>
                  </div>
                );
              })}
            </div>

            {/* Timing parameters (Live batch only) */}
            {isLive && (
              <div className="bg-surface border border-border-subtle rounded-xl p-3.5 space-y-2.5 mt-4">
                <div className="flex justify-between items-center text-[11px] text-text-muted">
                  <span>Batch start date</span>
                  <strong className="text-primary font-bold">{course.batchStartDate || "22 Jun 2026"}</strong>
                </div>
                <div className="flex justify-between items-center text-[11px] text-text-muted">
                  <span>Batch end date</span>
                  <strong className="text-primary font-bold">{course.batchEndDate || "14 Aug 2026"}</strong>
                </div>
                <div className="flex justify-between items-center text-[11px] text-text-muted">
                  <span>Class days</span>
                  <strong className="text-primary font-bold">{course.classDays || "Mon & Thu"}</strong>
                </div>
                <div className="flex justify-between items-center text-[11px] text-text-muted">
                  <span>Class timing</span>
                  <strong className="text-primary font-bold">{course.classTiming || "6:00–7:30 PM IST"}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* RELATED COURSES STRIP (Recorded format only) */}
      {!isLive && related.length > 0 && (
        <div className="border-t border-border-subtle bg-slate-50/50 py-12">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <h3 className="font-heading text-lg font-bold text-primary mb-6">Related courses</h3>
            
            <div className="flex lg:grid lg:grid-cols-3 gap-3 md:gap-6 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 snap-x snap-mandatory lg:snap-none premium-scrollbar">
              {related.map((rc: RelatedCourse) => (
                <Link 
                  href={`/courses/${rc.id}`}
                  key={rc.id}
                  className="w-[calc(50%_-_6px)] md:w-[calc(50%_-_12px)] lg:w-auto min-w-[calc(50%_-_6px)] md:min-w-[calc(50%_-_12px)] lg:min-w-0 snap-start shrink-0 bg-white border border-border-subtle rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className={`w-full h-24 sm:h-28 flex items-center justify-center ${getSubjectBgColor(rc.subject)}`}>
                    {getDetailsIcon(rc.iconName)}
                  </div>
                  <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                    <h4 className="font-heading text-xs sm:text-sm font-bold text-primary mb-2 line-clamp-1 group-hover:text-secondary transition-colors">
                      {rc.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] sm:text-xs text-text-muted pt-2 border-t border-slate-100 font-medium">
                      <span>★ {rc.rating}</span>
                      <strong className="text-primary font-extrabold text-xs sm:text-sm">₹{rc.price.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

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
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        targetId={course.id}
        targetType="course"
        title={course.title}
        price={course.price}
        selectedSlot={course.format === "Live individual" ? selectedSlot : undefined}
        mentorName={course.mentor.name}
        isLiveIndividual={course.format === "Live individual"}
      />
      <MobileStickyBookingBar
        price={course.price}
        priceSuffix={isLive ? "/ batch" : "/ course"}
        ctaLabel={course.format === "Live individual" ? "Book 1-on-1 Course" : isLive ? "Reserve your seat" : "Book now"}
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
                  placeholder="Share your learning experience with this course..."
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
