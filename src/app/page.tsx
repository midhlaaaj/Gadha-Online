"use client";

import React, { useState, useEffect } from "react";
import {
  IconSparkles,
  IconCode,
  IconFlask,
  IconMap,
  IconCalculator,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandYoutube,
  IconMath,
  IconPencil,
  IconStar,
  IconBook,
} from "@tabler/icons-react";
import { getHomepageData, submitContactMessage } from "./actions";

// Dynamic Icon Picker Helper
const getIconComponent = (name: string) => {
  switch (name) {
    case "math":
    case "calculator":
      return <IconMath className="w-12 h-12 text-secondary" />;
    case "code":
      return <IconCode className="w-12 h-12 text-green-700" />;
    case "flask":
    case "science":
      return <IconFlask className="w-12 h-12 text-yellow-700" />;
    case "writing":
    case "pencil":
      return <IconPencil className="w-12 h-12 text-purple-700" />;
    case "map":
      return <IconMap className="w-12 h-12 text-pink-700" />;
    default:
      return <IconBook className="w-12 h-12 text-primary" />;
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

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    phone: "",
    message: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getHomepageData();
        setData(res);
      } catch (err) {
        console.error("Failed to load homepage content:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingForm(true);
    setFormError(null);
    try {
      await submitContactMessage(formData);
      setFormSubmitted(true);
      setFormData({
        fullName: "",
        email: "",
        subject: "",
        phone: "",
        message: "",
      });
    } catch (err: any) {
      setFormError(err.message || "Failed to send message. Please try again.");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] h-screen bg-[#F5F8FF] font-sans text-primary">
        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500 animate-pulse">Loading Tutoboard...</p>
      </div>
    );
  }

  const settings = data?.settings || {
    badge_text: "#1 online tutoring platform",
    headline: "Learn faster with expert mentors by your side",
    accented_text: "expert mentors",
    subheading: "Connect with top-rated tutors for 1-on-1 sessions, structured courses, and hourly lessons — all tailored to your pace and goals.",
    primary_cta: "Find a mentor",
    primary_link: "/mentors",
    secondary_cta: "Browse courses",
    secondary_link: "/courses",
    c1: "12,400+",
    cl1: "Students enrolled",
    c2: "840+",
    cl2: "Expert mentors",
    c3: "320+",
    cl3: "Courses available",
    c4: "98%",
    cl4: "Satisfaction rate",
  };

  const courses = data?.courses || [];
  const sessions = data?.sessions || [];
  const mentors = data?.mentors || [];
  const testimonials = data?.testimonials || [];

  // Determine dynamic hero card class session details
  const firstSession = sessions.length > 0 ? sessions[0] : null;
  const heroWidgetTitle = firstSession 
    ? `${firstSession.subject}: ${firstSession.title}` 
    : "Mathematics: Master Calculus";
  const heroWidgetDesc = firstSession 
    ? firstSession.description || `1-on-1 private lesson with ${firstSession.mentor}.`
    : "Learn derivatives, integration, and limits with Arjun Kapoor.";
  const heroWidgetMentorName = firstSession ? firstSession.mentor : "Arjun Kapoor";
  const heroWidgetAvatar = firstSession ? firstSession.mentorAvatar : "AK";
  const heroWidgetColor = firstSession ? firstSession.mentorColor : "#1B3A6B";
  const heroWidgetMentor = firstSession 
    ? mentors.find((m: any) => m.name === firstSession.mentor) 
    : null;
  const heroWidgetQualification = heroWidgetMentor 
    ? heroWidgetMentor.qualification 
    : "IIT Delhi Graduate";

  const renderHeadline = () => {
    const text = settings.headline;
    const phrase = settings.accented_text;
    if (!phrase || !text.includes(phrase)) {
      return text;
    }
    const parts = text.split(phrase);
    return (
      <>
        {parts[0]}
        <span className="text-secondary">{phrase}</span>
        {parts[1]}
      </>
    );
  };

  return (
    <div className="w-full bg-white text-primary flex-1">
      {/* NAVIGATION */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-[70px] bg-white border-b border-border-subtle sticky top-0 z-50">
        <div className="font-heading text-2xl font-extrabold tracking-tight text-primary">
          Tuto<span className="text-secondary">board</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a
            href="/courses"
            className="text-sm font-medium text-text-muted hover:text-secondary transition-colors"
          >
            Courses
          </a>
          <a
            href="/sessions"
            className="text-sm font-medium text-text-muted hover:text-secondary transition-colors"
          >
            Sessions
          </a>
          <a
            href="#mentors"
            className="text-sm font-medium text-text-muted hover:text-secondary transition-colors"
          >
            Mentors
          </a>
          <a
            href="#about"
            className="text-sm font-medium text-text-muted hover:text-secondary transition-colors"
          >
            About
          </a>
          <a
            href="/admin"
            className="text-xs font-semibold px-5 py-2.5 rounded-lg bg-secondary text-white hover:bg-secondary/90 hover:shadow-md transition-all cursor-pointer"
          >
            Admin Panel
          </a>
        </div>
        
        {/* Mobile Nav Button */}
        <button className="md:hidden text-xs font-semibold px-4 py-2 rounded-lg bg-secondary text-white cursor-pointer">
          Menu
        </button>
      </nav>

      {/* HERO SECTION */}
      <section className="bg-surface pl-6 pr-6 md:pl-20 md:pr-16 lg:pl-32 lg:pr-24 xl:pl-40 xl:pr-28 py-16 lg:py-0 flex flex-col lg:flex-row items-center gap-12 border-b border-border-subtle min-h-[calc(100vh-70px)]">
        <div className="flex-1 flex flex-col items-start gap-6">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-badge-bg text-badge-text border border-badge-border animate-pulse">
            <IconSparkles className="w-3.5 h-3.5" />
            {settings.badge_text}
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-primary leading-tight max-w-[600px]">
            {renderHeadline()}
          </h1>
          <p className="text-sm md:text-base text-text-muted leading-relaxed max-w-[500px]">
            {settings.subheading}
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href={settings.primary_link}
              className="text-sm font-semibold px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/95 hover:shadow-md transition-all cursor-pointer"
            >
              {settings.primary_cta}
            </a>
            <a
              href={settings.secondary_link}
              className="text-sm font-semibold px-6 py-3 rounded-lg bg-transparent text-primary border-2 border-primary hover:bg-primary/5 transition-all cursor-pointer"
            >
              {settings.secondary_cta}
            </a>
          </div>
        </div>
        <div className="flex-1 hidden lg:flex justify-center">
          {/* Decorative graphical widget representation */}
          <div className="relative w-[400px] h-[300px] bg-white rounded-2xl shadow-xl border border-border-subtle p-6 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                Live Class
              </span>
              <span className="text-xs text-text-muted">Starting in 5 mins</span>
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-primary mb-2">
                {heroWidgetTitle}
              </h3>
              <p className="text-xs text-text-muted">
                {heroWidgetDesc}
              </p>
            </div>
            <div className="flex items-center gap-3 border-t border-border-subtle pt-4">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-accent"
                style={{ backgroundColor: heroWidgetColor }}
              >
                {heroWidgetAvatar}
              </div>
              <div>
                <p className="text-xs font-bold text-primary">{heroWidgetMentorName}</p>
                <p className="text-[10px] text-text-muted">{heroWidgetQualification}</p>
              </div>
              <button className="ml-auto text-xs font-semibold px-4 py-2 rounded-lg bg-secondary text-white">
                Join
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* COUNTERS */}
      <section className="bg-primary px-6 md:px-12 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0">
        <div className="text-center md:border-r border-white/15 py-2">
          <div className="font-heading text-3xl md:text-4xl font-extrabold text-accent">
            {settings.c1}
          </div>
          <div className="text-xs text-white/70 mt-1 font-medium">
            {settings.cl1}
          </div>
        </div>
        <div className="text-center md:border-r border-white/15 py-2">
          <div className="font-heading text-3xl md:text-4xl font-extrabold text-accent">
            {settings.c2}
          </div>
          <div className="text-xs text-white/70 mt-1 font-medium">
            {settings.cl2}
          </div>
        </div>
        <div className="text-center md:border-r border-white/15 py-2">
          <div className="font-heading text-3xl md:text-4xl font-extrabold text-accent">
            {settings.c3}
          </div>
          <div className="text-xs text-white/70 mt-1 font-medium">
            {settings.cl3}
          </div>
        </div>
        <div className="text-center py-2">
          <div className="font-heading text-3xl md:text-4xl font-extrabold text-accent">
            {settings.c4}
          </div>
          <div className="text-xs text-white/70 mt-1 font-medium">
            {settings.cl4}
          </div>
        </div>
      </section>

      {/* POPULAR COURSES */}
      <section id="courses" className="py-16">
        <div className="px-6 md:px-12 max-w-7xl mx-auto">
          <div className="mb-10 text-left">
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">
              What we offer
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-primary">
              Popular courses
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Structured programs taught by verified educators
            </p>
          </div>
          {courses.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-sm text-text-muted">No active courses listed currently.</p>
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory premium-scrollbar">
              {courses.map((c: any) => (
                <div key={c.id} className="w-[calc(100%_-_32px)] md:w-[calc(50%_-_12px)] lg:w-[calc(33.333%_-_16px)] min-w-[calc(100%_-_32px)] md:min-w-[calc(50%_-_12px)] lg:min-w-[calc(33.333%_-_16px)] snap-start shrink-0 bg-white border border-border-subtle rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                  <div className={`w-full h-32 flex items-center justify-center ${getSubjectBgColor(c.subject)}`}>
                    {getIconComponent(c.iconName)}
                  </div>
                  <div className="p-5">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-badge-bg text-badge-text mb-3 inline-block">
                      {c.subject}
                    </span>
                    <h3 className="font-heading text-lg font-bold text-primary mb-1">
                      {c.title}
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed mb-1 line-clamp-2">
                      Course by {c.mentor}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize mb-4">Format: {c.format}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-bold text-accent flex items-center gap-0.5">
                        <IconStar className="w-3.5 h-3.5 fill-accent" /> {c.rating}
                      </span>
                      <span className="text-[10px] text-text-muted">({c.students} students)</span>
                      <span className="ml-auto font-heading font-extrabold text-primary text-base">
                        ₹{c.price}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button className="flex-1 text-xs font-semibold py-2.5 rounded-lg bg-secondary text-white hover:bg-secondary/90 transition-colors cursor-pointer">
                        Book now
                      </button>
                      <a href={`/courses/${c.id}`} className="flex-1 text-xs font-semibold py-2.5 rounded-lg bg-transparent text-primary border border-primary hover:bg-primary/5 transition-colors cursor-pointer text-center">
                        Details
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* HOURLY SESSIONS */}
      <section id="sessions" className="bg-surface py-16">
        <div className="px-6 md:px-12 max-w-7xl mx-auto">
          <div className="mb-10 text-left">
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">
              Flexible learning
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-primary">
              Hourly sessions
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Pay per session — no long-term commitment required
            </p>
          </div>
          {sessions.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
              <p className="text-sm text-text-muted">No active sessions scheduled currently.</p>
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory premium-scrollbar">
              {sessions.map((s: any) => (
                <div key={s.id} className="w-[calc(100%_-_32px)] md:w-[calc(50%_-_12px)] lg:w-[calc(33.333%_-_16px)] min-w-[calc(100%_-_32px)] md:min-w-[calc(50%_-_12px)] lg:min-w-[calc(33.333%_-_16px)] snap-start shrink-0 bg-white border border-border-subtle rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                  <div className={`w-full h-32 flex items-center justify-center ${getSubjectBgColor(s.subject)}`}>
                    {getIconComponent(s.iconName)}
                  </div>
                  <div className="p-5">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 mb-3 inline-block">
                      {s.type} Session
                    </span>
                    <h3 className="font-heading text-lg font-bold text-primary mb-1">
                      {s.title}
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed mb-4 line-clamp-2">
                      {s.description || `1-on-1 private lesson with ${s.mentor}.`}
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-bold text-accent flex items-center gap-0.5">
                        <IconStar className="w-3.5 h-3.5 fill-accent" /> 5.0
                      </span>
                      <span className="text-[10px] text-text-muted">({s.bookings} reviews)</span>
                      <span className="ml-auto font-heading font-extrabold text-primary text-base">
                        ₹{s.price}/hr
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button className="flex-1 text-xs font-semibold py-2.5 rounded-lg bg-secondary text-white hover:bg-secondary/90 transition-colors cursor-pointer">
                        Book now
                      </button>
                      <button className="flex-1 text-xs font-semibold py-2.5 rounded-lg bg-transparent text-primary border border-primary hover:bg-primary/5 transition-colors cursor-pointer">
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TOP MENTORS */}
      <section id="mentors" className="py-16">
        <div className="px-6 md:px-12 max-w-7xl mx-auto">
          <div className="mb-10 text-left">
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">
              Meet the team
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-primary">
              Our top mentors
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Verified experts with proven teaching track records
            </p>
          </div>
          {mentors.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-sm text-text-muted">No mentors available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-flow-col grid-rows-2 gap-6 overflow-x-auto pb-6 snap-x snap-mandatory premium-scrollbar auto-cols-[calc(100%)] md:auto-cols-[calc(50%-12px)]">
              {mentors.map((m: any) => (
                <div key={m.id} className="bg-white border border-border-subtle rounded-2xl overflow-hidden flex flex-col sm:flex-row hover:shadow-md transition-shadow snap-start shrink-0">
                  <div className="w-full sm:w-[130px] bg-blue-50 flex items-center justify-center p-6">
                    <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center font-heading text-2xl font-extrabold text-accent">
                      {m.avatarText}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-heading text-base font-bold text-primary flex items-center gap-1.5">
                        {m.name}
                        {m.verified && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            Vetted
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-secondary font-semibold mb-2">
                        {m.subject}
                      </p>
                      <p className="text-xs text-text-muted leading-relaxed mb-4 line-clamp-2">
                        {m.bio || `${m.qualification} with ${m.experience} years of teaching expertise.`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs border-t border-border-subtle pt-3 text-text-muted">
                      <div>
                        <strong className="text-primary font-bold">{m.students}</strong> students
                      </div>
                      <div>
                        <strong className="text-primary font-bold">★ {m.rating}</strong> rating
                      </div>
                      <div className="ml-auto font-semibold text-primary">
                        ₹{m.rate}/hr
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-surface py-16">
        <div className="px-6 md:px-12 max-w-7xl mx-auto">
          <div className="mb-10 text-left">
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">
              Student stories
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-primary">
              What our students say
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Real results from real learners
            </p>
          </div>
          {testimonials.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
              <p className="text-sm text-text-muted">No testimonials to show.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t: any) => (
                <div key={t.id} className="bg-white border border-border-subtle rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="font-heading text-4xl text-accent font-extrabold leading-none mb-2">
                      &ldquo;
                    </div>
                    <p className="text-xs md:text-sm text-text-muted leading-relaxed mb-6">
                      {t.quote}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white font-heading"
                      style={{ backgroundColor: t.avatar_bg || "#1B3A6B" }}
                    >
                      {t.avatar_text}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-primary">{t.student_name}</p>
                      <p className="text-[10px] text-text-muted">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CONTACT FORM */}
      <section id="about" className="bg-primary text-white py-16">
        <div className="px-6 md:px-12 max-w-3xl mx-auto">
          <h2 className="font-heading text-2xl md:text-3xl font-extrabold mb-2 text-white">
            Get in touch
          </h2>
          <p className="text-xs md:text-sm text-white/65 mb-8">
            Have a question or want to book a trial session? We&apos;ll get back to you within 24 hours.
          </p>

          {formSubmitted ? (
            <div className="bg-white/10 border border-white/20 rounded-2xl p-8 text-center animate-fade-in">
              <h3 className="font-heading text-xl font-bold text-accent mb-2">
                Thank you!
              </h3>
              <p className="text-sm text-white/80">
                Your message has been sent successfully. Our support team will reach out to you shortly.
              </p>
              <button
                onClick={() => setFormSubmitted(false)}
                className="mt-6 text-xs font-semibold px-5 py-2.5 rounded-lg bg-accent text-primary hover:bg-accent/90 transition-colors cursor-pointer"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 text-xs text-red-200">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-white/75 uppercase tracking-wider">
                    Full name
                  </label>
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="font-sans text-sm p-3 rounded-lg border border-white/25 bg-white/10 text-white outline-none focus:border-accent/50 focus:bg-white/15 transition-all"
                    type="text"
                    placeholder="Your name"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-white/75 uppercase tracking-wider">
                    Email address
                  </label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="font-sans text-sm p-3 rounded-lg border border-white/25 bg-white/10 text-white outline-none focus:border-accent/50 focus:bg-white/15 transition-all"
                    type="email"
                    placeholder="you@email.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-white/75 uppercase tracking-wider">
                    Subject
                  </label>
                  <input
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="font-sans text-sm p-3 rounded-lg border border-white/25 bg-white/10 text-white outline-none focus:border-accent/50 focus:bg-white/15 transition-all"
                    type="text"
                    placeholder="e.g. JEE Maths tutoring"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-white/75 uppercase tracking-wider">
                    Phone (optional)
                  </label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="font-sans text-sm p-3 rounded-lg border border-white/25 bg-white/10 text-white outline-none focus:border-accent/50 focus:bg-white/15 transition-all"
                    type="tel"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-white/75 uppercase tracking-wider">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="font-sans text-sm p-3 rounded-lg border border-white/25 bg-white/10 text-white outline-none focus:border-accent/50 focus:bg-white/15 transition-all resize-none"
                  placeholder="Tell us what you need help with..."
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingForm}
                className="text-xs font-bold px-8 py-3.5 rounded-lg bg-accent text-primary hover:bg-accent/95 hover:shadow-lg transition-all cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingForm ? "Sending..." : "Send message"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0f2347] text-white py-12">
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
                  <a href="#" className="hover:text-white transition-colors">
                    About us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
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
