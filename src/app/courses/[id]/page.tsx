"use client";

import React, { use, useState, useEffect } from "react";
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
  IconHeart,
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
import { getCourseDetails } from "../../actions";

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

export default function CourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Accordion state (for curriculum)
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({ 0: true });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getCourseDetails(id);
        setData(res);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load course details");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const toggleModule = (index: number) => {
    setExpandedModules((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] h-screen bg-[#F5F8FF] font-sans text-primary">
        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500 animate-pulse">Loading Course Details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] h-screen bg-white font-sans text-primary p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center shadow-md">
          <h2 className="font-heading text-lg font-bold text-red-700 mb-2">Error Loading Course</h2>
          <p className="text-sm text-text-muted mb-6">{error || "Course not found."}</p>
          <a href="/courses" className="text-xs font-semibold px-6 py-3 bg-primary text-white rounded-lg hover:shadow-md transition-all">
            Back to Courses
          </a>
        </div>
      </div>
    );
  }

  const { course, related } = data;
  const isLive = course.format === "Live batch";

  const syllabus = getDynamicSyllabus(course.subject);
  const outcomes = getDynamicLearningOutcomes(course.subject);

  // Dynamic old price (40% discount fallback representation)
  const oldPrice = Math.round(course.price * 1.66);

  return (
    <div className="w-full bg-white text-primary flex-1 min-h-screen flex flex-col font-sans">
      
      {/* NAVIGATION */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-[70px] bg-white border-b border-border-subtle sticky top-0 z-50">
        <a href="/" className="font-heading text-2xl font-extrabold tracking-tight text-primary">
          Tuto<span className="text-secondary">board</span>
        </a>
        <div className="hidden md:flex items-center gap-8">
          <a href="/courses" className="text-sm font-medium text-text-muted hover:text-secondary transition-colors">
            Courses
          </a>
          <a href="/#sessions" className="text-sm font-medium text-text-muted hover:text-secondary transition-colors">
            Sessions
          </a>
          <a href="/#mentors" className="text-sm font-medium text-text-muted hover:text-secondary transition-colors">
            Mentors
          </a>
          <a href="/#about" className="text-sm font-medium text-text-muted hover:text-secondary transition-colors">
            About
          </a>
          <a
            href="/admin"
            className="text-xs font-semibold px-5 py-2.5 rounded-lg bg-secondary text-white hover:bg-secondary/90 hover:shadow-md transition-all cursor-pointer"
          >
            Admin Panel
          </a>
        </div>
        <button className="md:hidden text-xs font-semibold px-4 py-2 rounded-lg bg-secondary text-white cursor-pointer">
          Menu
        </button>
      </nav>

      {/* BREADCRUMB */}
      <div className="bg-surface border-b border-border-subtle py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto text-xs text-text-muted flex items-center gap-1.5 font-medium">
          <a href="/" className="hover:text-secondary transition-colors">Home</a>
          <span className="text-slate-300">/</span>
          <a href="/courses" className="hover:text-secondary transition-colors">Courses</a>
          <span className="text-slate-300">/</span>
          <span className="text-primary font-semibold truncate max-w-[200px] sm:max-w-xs">{course.title}</span>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Cover Hero Banner Image */}
          <div className={`w-full h-72 rounded-2xl flex items-center justify-center relative shadow-sm ${getSubjectBgColor(course.subject)}`}>
            {isLive ? (
              <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                Live batch · Starts Monday, 22 Jun
              </div>
            ) : (
              <div className="absolute top-4 left-4 bg-amber-100 text-amber-800 text-[10px] font-bold px-3.5 py-1.5 rounded-full">
                Self-paced recorded content
              </div>
            )}
            {getDetailsIcon(course.iconName)}
          </div>

          {/* Course Title and Header */}
          <div className="border-b border-border-subtle pb-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-badge-bg text-badge-text border border-badge-border">
                {course.subject}
              </span>
              {isLive ? (
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-150 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  LIVE CLASSES
                </span>
              ) : (
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-150">
                  BESTSELLER
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
                <span className="text-accent font-bold">★ {course.rating}</span>
                <span>(214 reviews)</span>
              </div>
              <span className="h-4 w-px bg-border-subtle hidden sm:block"></span>
              <div className="flex items-center gap-1.5">
                <IconUsers className="w-4 h-4 text-slate-400" />
                <span>{course.students.toLocaleString()} students {isLive ? "in this batch" : "enrolled"}</span>
              </div>
              <span className="h-4 w-px bg-border-subtle hidden sm:block"></span>
              <div className="flex items-center gap-1.5">
                <IconClock className="w-4 h-4 text-slate-400" />
                <span>{isLive ? "8-week program" : "32 hours total"}</span>
              </div>
              <span className="h-4 w-px bg-border-subtle hidden sm:block"></span>
              <div className="flex items-center gap-1.5">
                <IconWorld className="w-4 h-4 text-slate-400" />
                <span>English {isLive && "· IST"}</span>
              </div>
            </div>
          </div>

          {/* WHAT YOU'LL LEARN */}
          <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-sm">
            <h3 className="font-heading text-lg font-bold text-primary mb-4">What you'll learn</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {outcomes.map((item, index) => (
                <div key={index} className="flex items-start gap-2.5 text-xs text-slate-700 leading-normal">
                  <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5 border border-green-150">
                    <IconCheck className="w-3.5 h-3.5 text-green-700 stroke-[3]" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ABOUT THIS COURSE */}
          <div className="space-y-3">
            <h3 className="font-heading text-lg font-bold text-primary">
              About this {isLive ? "live batch" : "course"}
            </h3>
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
          </div>

          {/* SYLLABUS ACCORDION (Recorded format only) */}
          {!isLive && (
            <div className="space-y-3">
              <h3 className="font-heading text-lg font-bold text-primary">Course curriculum</h3>
              <div className="space-y-3">
                {syllabus.map((module, mIdx) => (
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
                        {module.lessons.map((lesson, lIdx) => (
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

          {/* MENTOR DETAILS */}
          <div className="space-y-3">
            <h3 className="font-heading text-lg font-bold text-primary">
              {isLive ? "Your live instructor" : "Meet your mentor"}
            </h3>
            <div className="bg-white border border-border-subtle rounded-2xl overflow-hidden flex flex-col sm:flex-row hover:shadow-sm transition-shadow">
              <div className="w-full sm:w-[130px] bg-blue-50 flex items-center justify-center p-6 flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center font-heading text-2xl font-extrabold text-accent">
                  {course.mentor.avatarText}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-heading text-base font-bold text-primary mb-0.5">{course.mentor.name}</h4>
                  <p className="text-xs text-secondary font-semibold mb-2">{course.mentor.expertise}</p>
                  <p className="text-xs text-text-muted leading-relaxed mb-4">
                    {course.mentor.bio || `${course.mentor.qualification} with ${course.mentor.experience} years of expert teaching experience.`}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs border-t border-border-subtle pt-3 text-text-muted font-medium">
                  <div>
                    <strong className="text-primary font-bold">{course.mentor.students}</strong> students
                  </div>
                  <div>
                    <strong className="text-primary font-bold">★ {course.mentor.rating}</strong> rating
                  </div>
                  <div>
                    <strong className="text-primary font-bold">{isLive ? "6" : "12"}</strong> {isLive ? "live batches" : "courses"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STUDENT REVIEWS */}
          <div className="space-y-3">
            <h3 className="font-heading text-lg font-bold text-primary">Student reviews</h3>
            <div className="space-y-3">
              <div className="border border-border-subtle rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-heading text-xs font-bold text-accent">
                    RA
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary">Rohan Agarwal</p>
                    <p className="text-[10px] text-text-muted">2 weeks ago</p>
                  </div>
                  <div className="ml-auto text-xs text-accent font-bold flex items-center">
                    ★★★★★
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-text-muted">
                  {isLive 
                    ? "Loved that it's actually live — I could ask questions mid-class and get answers right away. Felt like a real classroom."
                    : "Extremely well structured. The module on integration alone was worth the price — clear explanations and tons of practice problems."
                  }
                </p>
              </div>

              <div className="border border-border-subtle rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#993556] flex items-center justify-center font-heading text-xs font-bold text-white">
                    AN
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary">Aisha Naik</p>
                    <p className="text-[10px] text-text-muted">1 month ago</p>
                  </div>
                  <div className="ml-auto text-xs text-accent font-bold flex items-center">
                    ★★★★★
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-text-muted">
                  {isLive 
                    ? "The small batch size made a huge difference. Arjun sir noticed when I was stuck and slowed down to help."
                    : "Arjun sir explains everything so patiently. The weekly live sessions really helped clear my doubts before the boards."
                  }
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN / SIDEBAR CARD (1/3 width on desktop) */}
        <div className="space-y-6">
          <div className="bg-white border border-border-subtle rounded-2xl p-6 shadow-lg space-y-5">
            {isLive && (
              <div className="bg-red-50 text-red-700 text-[10px] font-bold px-3 py-1 rounded-lg border border-red-150 flex items-center gap-1.5 self-start w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                Batch starts in 2 days
              </div>
            )}
            
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-3xl font-extrabold text-primary">
                  ₹{course.price.toLocaleString("en-IN")}
                </span>
                <span className="text-sm text-slate-400 line-through">
                  ₹{oldPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-text-muted font-medium">
                  {isLive ? "/ 8-week batch" : "/ course"}
                </span>
              </div>
              {!isLive && (
                <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-md bg-amber-100 text-amber-800">
                  40% OFF — Limited time
                </span>
              )}
            </div>

            <button className="w-full font-semibold text-sm py-3.5 bg-secondary text-white rounded-xl hover:bg-secondary/90 transition-colors cursor-pointer shadow-md">
              {isLive ? "Reserve your seat" : "Book now"}
            </button>
            
            <button className="w-full font-semibold text-xs py-3 border border-primary rounded-xl text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <IconHeart className="w-4 h-4" />
              <span>Add to wishlist</span>
            </button>

            <hr className="border-t border-slate-100" />

            {/* Inclusions */}
            <div className="space-y-3">
              {isLive ? (
                <>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <IconBroadcast className="w-4 h-4 text-secondary flex-shrink-0" />
                    <span>16 live sessions, 2x weekly</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <IconDeviceLaptop className="w-4 h-4 text-secondary flex-shrink-0" />
                    <span>Live on Zoom — join via browser/app</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <IconMessageCircle className="w-4 h-4 text-secondary flex-shrink-0" />
                    <span>Live doubt-solving every class</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <IconRotate className="w-4 h-4 text-secondary flex-shrink-0" />
                    <span>7-day replay for missed classes</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <IconCertificate className="w-4 h-4 text-secondary flex-shrink-0" />
                    <span>Certificate on batch completion</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <IconClock className="w-4 h-4 text-secondary flex-shrink-0" />
                    <span>32 hours of content</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <IconDeviceLaptop className="w-4 h-4 text-secondary flex-shrink-0" />
                    <span>Access on mobile & desktop</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <IconCertificate className="w-4 h-4 text-secondary flex-shrink-0" />
                    <span>Certificate of completion</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <IconInfinity className="w-4 h-4 text-secondary flex-shrink-0" />
                    <span>Lifetime access</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <IconMessageCircle className="w-4 h-4 text-secondary flex-shrink-0" />
                    <span>Weekly live Q&A with mentor</span>
                  </div>
                </>
              )}
            </div>

            {/* Timing parameters (Live batch only) */}
            {isLive && (
              <div className="bg-surface border border-border-subtle rounded-xl p-3.5 space-y-2.5 mt-4">
                <div className="flex justify-between items-center text-[11px] text-text-muted">
                  <span>Batch start date</span>
                  <strong className="text-primary font-bold">22 Jun 2026</strong>
                </div>
                <div className="flex justify-between items-center text-[11px] text-text-muted">
                  <span>Batch end date</span>
                  <strong className="text-primary font-bold">14 Aug 2026</strong>
                </div>
                <div className="flex justify-between items-center text-[11px] text-text-muted">
                  <span>Class days</span>
                  <strong className="text-primary font-bold">Mon & Thu</strong>
                </div>
                <div className="flex justify-between items-center text-[11px] text-text-muted">
                  <span>Class timing</span>
                  <strong className="text-primary font-bold">6:00–7:30 PM IST</strong>
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((rc: any) => (
                <a 
                  href={`/courses/${rc.id}`}
                  key={rc.id}
                  className="bg-white border border-border-subtle rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className={`w-full h-28 flex items-center justify-center ${getSubjectBgColor(rc.subject)}`}>
                    {getDetailsIcon(rc.iconName)}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <h4 className="font-heading text-sm font-bold text-primary mb-2 line-clamp-1 group-hover:text-secondary transition-colors">
                      {rc.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-slate-100 font-medium">
                      <span>★ {rc.rating} ({rc.students})</span>
                      <strong className="text-primary font-extrabold text-sm">₹{rc.price.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>
                </a>
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
