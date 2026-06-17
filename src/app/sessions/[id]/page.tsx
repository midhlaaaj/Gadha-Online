"use client";

import React, { use, useState, useEffect } from "react";
import {
  IconCheck,
  IconClock,
  IconUsers,
  IconCalendar,
  IconWorld,
  IconHeart,
  IconDeviceLaptop,
  IconMessageCircle,
  IconRotate,
  IconStar,
  IconChevronDown,
  IconChevronUp,
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
import { getSessionDetails } from "../../actions";

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

// Subject Color Class Mapper (for fallback)
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

export default function SessionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking details states
  const [duration, setDuration] = useState(60); // 60 min or 90 min
  const [selectedSlot, setSelectedSlot] = useState({ day: "Wed", time: "7 PM" });
  const [isSaved, setIsSaved] = useState(false);

  // Calendar structure
  const calendarData = [
    { day: "Mon", slots: [{ time: "5 PM", status: "booked" }, { time: "7 PM", status: "booked" }, { time: "8 PM", status: "open" }] },
    { day: "Tue", slots: [{ time: "5 PM", status: "open" }, { time: "6 PM", status: "open" }, { time: "8 PM", status: "open" }] },
    { day: "Wed", slots: [{ time: "5 PM", status: "booked" }, { time: "6 PM", status: "open" }, { time: "7 PM", status: "open" }] },
    { day: "Thu", slots: [{ time: "5 PM", status: "open" }, { time: "7 PM", status: "open" }, { time: "8 PM", status: "booked" }] },
    { day: "Fri", slots: [{ time: "5 PM", status: "open" }, { time: "6 PM", status: "open" }, { time: "8 PM", status: "open" }] },
    { day: "Sat", slots: [{ time: "10 AM", status: "open" }, { time: "11 AM", status: "open" }, { time: "12 PM", status: "open" }] },
    { day: "Sun", slots: [{ time: "10 AM", status: "booked" }, { time: "11 AM", status: "booked" }, { time: "12 PM", status: "booked" }] },
  ];

  // Sidebar slots
  const sidebarSlots = [
    { day: "Mon", time: "5 PM", status: "booked" },
    { day: "Tue", time: "5 PM", status: "open" },
    { day: "Wed", time: "7 PM", status: "open" },
    { day: "Thu", time: "5 PM", status: "open" },
    { day: "Fri", time: "5 PM", status: "open" },
    { day: "Sat", time: "10 AM", status: "open" },
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getSessionDetails(id);
        setData(res);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load session details");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] h-screen bg-[#F5F8FF] font-sans text-primary">
        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500 animate-pulse">Loading Session Details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] h-screen bg-white font-sans text-primary p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center shadow-md">
          <h2 className="font-heading text-lg font-bold text-red-700 mb-2">Error Loading Session</h2>
          <p className="text-sm text-text-muted mb-6">{error || "Session not found."}</p>
          <a href="/sessions" className="text-xs font-semibold px-6 py-3 bg-primary text-white rounded-lg hover:shadow-md transition-all">
            Back to Sessions
          </a>
        </div>
      </div>
    );
  }

  const { session, related } = data;
  const coveredTopics = (session.whatsCovered && session.whatsCovered.length > 0)
    ? session.whatsCovered
    : getCoveredTopics(session.subject);

  // Inclusions array binding
  const inclusionsList = (session.inclusions && session.inclusions.length === 5 && session.inclusions.every((x: string) => x !== ""))
    ? session.inclusions
    : [
        "Live on Zoom — any device",
        "Summary notes after session",
        "Free reschedule up to 4 hrs before",
        "Pre-session topic form",
        "Secure payment via Razorpay"
      ];

  const getInclusionIcon = (idx: number) => {
    switch (idx) {
      case 0: return <IconDeviceLaptop className="w-4.5 h-4.5 text-secondary flex-shrink-0" />;
      case 1: return <IconBook className="w-4.5 h-4.5 text-secondary flex-shrink-0" />;
      case 2: return <IconRotate className="w-4.5 h-4.5 text-secondary flex-shrink-0" />;
      case 3: return <IconMessageCircle className="w-4.5 h-4.5 text-secondary flex-shrink-0" />;
      default: return <IconShieldCheck className="w-4.5 h-4.5 text-secondary flex-shrink-0" />;
    }
  };

  // Cost calculations
  const pricePerHour = session.price;
  const currentPrice = duration === 90 ? Math.round(pricePerHour * 1.5) : pricePerHour;

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
          <a href="/sessions" className="text-sm font-medium text-text-muted hover:text-secondary transition-colors">
            Sessions
          </a>
          <a href="/mentors" className="text-sm font-medium text-text-muted hover:text-secondary transition-colors">
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

      {/* BREADCRUMB */}
      <div className="bg-surface border-b border-border-subtle py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto text-xs text-text-muted flex items-center gap-1.5 font-medium">
          <a href="/" className="hover:text-secondary transition-colors">Home</a>
          <span className="text-slate-300">/</span>
          <a href="/sessions" className="hover:text-secondary transition-colors">Sessions</a>
          <span className="text-slate-300">/</span>
          <span className="hover:text-secondary transition-colors truncate max-w-[150px] sm:max-w-xs">{session.subject}</span>
          <span className="text-slate-300">/</span>
          <span className="text-primary font-semibold truncate max-w-[200px] sm:max-w-xs">{session.title}</span>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
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
                <span>({session.bookings} reviews)</span>
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
          <div className="bg-white border border-border-subtle rounded-2xl p-[22px] shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-heading text-base font-bold text-accent">
                  {session.mentor.avatarText}
                </div>
                <div>
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">Your mentor</p>
                  <h4 className="font-heading text-base font-bold text-primary">{session.mentor.name}</h4>
                  <p className="text-xs text-text-muted">{session.mentor.expertise} · {session.mentor.qualification} · {session.mentor.experience} yrs exp</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold sm:border-l sm:border-border-subtle sm:pl-6 py-1">
                <div>
                  <strong className="text-primary text-base font-heading font-bold block">420</strong>
                  <span className="text-[10px] text-text-muted font-normal">Students</span>
                </div>
                <div>
                  <strong className="text-primary text-base font-heading font-bold block">★ {session.mentor.rating}</strong>
                  <span className="text-[10px] text-text-muted font-normal">Rating</span>
                </div>
              </div>
              <a 
                href="/mentors"
                className="text-xs font-semibold px-4 py-2 rounded-lg border border-border-subtle hover:border-primary text-primary transition-colors whitespace-nowrap self-stretch sm:self-auto text-center"
              >
                View profile
              </a>
            </div>
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
            <h3 className="font-heading text-base font-bold text-primary mb-3.5">What's covered</h3>
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

          {/* AVAILABILITY CALENDAR */}
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

          {/* STUDENT REVIEWS */}
          <div className="bg-white border border-border-subtle rounded-2xl p-[22px] shadow-sm">
            <h3 className="font-heading text-base font-bold text-primary mb-3.5">Student reviews</h3>
            
            <div className="flex items-center gap-5 bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4">
              <div className="text-center flex-shrink-0">
                <div className="font-heading text-3xl font-extrabold text-primary leading-none">4.9</div>
                <div className="text-xs text-accent my-1">★★★★★</div>
                <div className="text-[10px] text-text-muted">({session.bookings} reviews)</div>
              </div>
              <div className="flex-1 space-y-1">
                {[
                  { stars: 5, pct: "88%", count: 101 },
                  { stars: 4, pct: "10%", count: 11 },
                  { stars: 3, pct: "2%", count: 3 },
                  { stars: 2, pct: "0%", count: 0 },
                  { stars: 1, pct: "0%", count: 0 }
                ].map((row, rIdx) => (
                  <div key={rIdx} className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted w-2.5 text-right font-medium">{row.stars}</span>
                    <div className="flex-1 h-1 bg-[#E6F1FB] rounded-full overflow-hidden">
                      <div className="h-full bg-secondary rounded-full" style={{ width: row.pct }}></div>
                    </div>
                    <span className="text-[10px] text-text-muted w-5 font-medium">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="py-3.5 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7.5 h-7.5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-accent">
                    RA
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary">Rohan Agarwal</p>
                    <p className="text-[9px] text-text-muted">1 week ago</p>
                  </div>
                  <div className="ml-auto text-[11px] text-accent font-bold">★★★★★</div>
                </div>
                <p className="text-xs leading-relaxed text-text-muted">
                  {session.mentor.name} sir explained {session.subject === "Mathematics" ? "confidence intervals" : "the concepts"} in a way that finally clicked for me. Booked a second session the next day.
                </p>
              </div>

              <div className="py-3.5 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7.5 h-7.5 rounded-full bg-[#0F6E56] flex items-center justify-center text-[10px] font-bold text-white">
                    KP
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary">Karan Patel</p>
                    <p className="text-[9px] text-text-muted">2 weeks ago</p>
                  </div>
                  <div className="ml-auto text-[11px] text-accent font-bold">★★★★★</div>
                </div>
                <p className="text-xs leading-relaxed text-text-muted">
                  Super focused and tailored. He knew exactly which topics to prioritize. Formula sheets and lecture summaries were incredibly concise.
                </p>
              </div>

              <div className="py-3.5 space-y-2 last:pb-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7.5 h-7.5 rounded-full bg-[#993556] flex items-center justify-center text-[10px] font-bold text-white">
                    MV
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary">Meera Verma</p>
                    <p className="text-[9px] text-text-muted">3 weeks ago</p>
                  </div>
                  <div className="ml-auto text-[11px] text-accent font-bold">★★★★★</div>
                </div>
                <p className="text-xs leading-relaxed text-text-muted">
                  One 90-minute session completely changed my perspective. Highly recommended for exam preparation.
                </p>
              </div>
            </div>
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
                  ₹{currentPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-text-muted font-medium">
                  / {duration} min session
                </span>
              </div>
              {duration === 90 && (
                <span className="text-[10px] text-text-muted block mt-1">
                  60-min session rate is <strong>₹{pricePerHour.toLocaleString("en-IN")}</strong>
                </span>
              )}
            </div>

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

            {/* Duration select */}
            <div>
              <p className="text-[9px] text-primary font-bold uppercase tracking-wider mb-2">Duration</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDuration(60)}
                  className={`flex-1 text-center py-2.5 border rounded-xl cursor-pointer transition-all ${
                    duration === 60
                      ? "border-primary bg-blue-50 text-primary font-bold"
                      : "border-border-subtle hover:border-secondary bg-white text-text-muted"
                  }`}
                >
                  <div className="text-xs font-bold font-heading">60 min</div>
                  <div className="text-[10px] mt-0.5">₹{pricePerHour}</div>
                </button>
                <button
                  onClick={() => setDuration(90)}
                  className={`flex-1 text-center py-2.5 border rounded-xl cursor-pointer transition-all ${
                    duration === 90
                      ? "border-primary bg-blue-50 text-primary font-bold"
                      : "border-border-subtle hover:border-secondary bg-white text-text-muted"
                  }`}
                >
                  <div className="text-xs font-bold font-heading">90 min</div>
                  <div className="text-[10px] mt-0.5">₹{Math.round(pricePerHour * 1.5)}</div>
                </button>
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

            {/* CTA Buttons */}
            <div className="space-y-2 pt-2">
              <button 
                onClick={() => {}}
                className="w-full font-semibold text-xs py-3.5 bg-secondary text-white rounded-xl hover:bg-secondary/90 transition-colors shadow-md cursor-pointer text-center"
              >
                Book session
              </button>
              <button
                onClick={() => setIsSaved(!isSaved)}
                className={`w-full font-semibold text-xs py-2.5 border rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isSaved
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-border-subtle hover:border-primary text-primary bg-white"
                }`}
              >
                <IconHeart className={`w-4 h-4 ${isSaved ? "fill-red-500 text-red-500" : ""}`} />
                <span>{isSaved ? "Saved for later" : "Save for later"}</span>
              </button>
            </div>

          </div>

          {/* What's included card */}
          <div className="bg-white border border-border-subtle rounded-2xl p-5 shadow-sm space-y-3">
            <p className="text-[9px] text-primary font-bold uppercase tracking-wider mb-1.5">What's included</p>
            {inclusionsList.map((incItem: string, iIdx: number) => (
              <div key={iIdx} className="flex items-center gap-3 text-xs text-slate-700 pb-2.5 last:pb-0 border-b border-slate-50 last:border-0">
                {getInclusionIcon(iIdx)}
                <span>{incItem}</span>
              </div>
            ))}
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
              {related.map((rs: any) => (
                <a 
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
                </a>
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
              <div className="font-heading text-lg font-extrabold text-white mb-2">
                Tuto<span className="text-accent">board</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed max-w-[280px]">
                India's most trusted online tutoring platform. Learn at your pace, with the best mentors.
              </p>
            </div>
            <div>
              <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-3">
                Company
              </div>
              <ul className="space-y-2 text-xs text-white/60">
                <li>
                  <a href="/#about" className="hover:text-white transition-colors">About us</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Careers</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
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
