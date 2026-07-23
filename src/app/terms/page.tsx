"use client";

import Link from "next/link";
import Image from "next/image";
import {
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandYoutube,
} from "@tabler/icons-react";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: "By creating an account or using Gadha Online, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our platform.",
  },
  {
    title: "2. Our Services",
    body: "Gadha Online connects students and parents with independent mentors for 1-on-1 sessions and structured courses. We facilitate bookings, scheduling, payments, and communication between students, parents, and mentors, but sessions are delivered by mentors, not by Gadha Online directly.",
  },
  {
    title: "3. Accounts & Eligibility",
    body: "You must provide accurate information when creating an account. Parent accounts are responsible for the activity of any student profiles they create for their children. You are responsible for keeping your login credentials secure and for all activity under your account.",
  },
  {
    title: "4. Bookings & Payments",
    body: "Course and session bookings are subject to mentor availability. Prices are displayed at the time of booking. Payment must be completed as instructed to confirm a booking. Refunds and rescheduling are handled according to the reschedule policy shown on each session or course, or at Gadha Online's discretion for exceptional circumstances.",
  },
  {
    title: "5. Mentor Conduct",
    body: "Mentors on Gadha Online are expected to conduct sessions professionally and deliver the content described in their course or session listing. Gadha Online reserves the right to suspend or remove any mentor or user account that violates these terms or engages in inappropriate conduct.",
  },
  {
    title: "6. Cancellations & Rescheduling",
    body: "Cancellation and rescheduling policies vary by session/course and are shown on the relevant booking page. Repeated late cancellations or no-shows may affect a student's or mentor's ability to book future sessions.",
  },
  {
    title: "7. Acceptable Use",
    body: "You agree not to misuse the platform, including attempting unauthorized access, sharing account credentials, uploading harmful content, or using the platform for any unlawful purpose. Messages sent through the platform (including to Gadha Online Support) must not contain abusive, harassing, or illegal content.",
  },
  {
    title: "8. Intellectual Property",
    body: "Course materials, recordings, and resources shared through Gadha Online are for the personal, non-commercial use of the enrolled student only, and may not be redistributed or resold without permission.",
  },
  {
    title: "9. Limitation of Liability",
    body: "Gadha Online facilitates connections between students and independent mentors but is not liable for the specific outcomes of tutoring sessions. To the maximum extent permitted by law, Gadha Online is not liable for indirect or incidental damages arising from use of the platform.",
  },
  {
    title: "10. Changes to These Terms",
    body: "We may update these Terms & Conditions from time to time. Continued use of Gadha Online after changes are posted constitutes acceptance of the revised terms.",
  },
  {
    title: "11. Contact Us",
    body: "For questions about these Terms & Conditions, please reach out via Gadha Online Support from your dashboard, or through our contact form on the homepage.",
  },
];

export default function TermsPage() {
  return (
    <div className="w-full bg-white text-primary flex-1 min-h-screen flex flex-col font-sans">
      <title>Terms &amp; Conditions | Gadha Online</title>
      <meta name="description" content="Read Gadha Online's Terms & Conditions governing the use of our tutoring platform." />

      {/* PAGE HEADER */}
      <header className="bg-surface px-6 md:px-12 py-8 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto">
          <nav className="text-xs text-text-muted mb-3 flex items-center gap-1.5 font-medium">
            <Link href="/" className="hover:text-secondary transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <span className="text-primary font-semibold">Terms &amp; Conditions</span>
          </nav>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-primary">Terms &amp; Conditions</h1>
          <p className="text-xs md:text-sm text-text-muted mt-2 max-w-2xl">
            Last updated: January 2026. Please read these terms carefully before using Gadha Online.
          </p>
        </div>
      </header>

      {/* CONTENT */}
      <section className="px-6 md:px-12 py-10 md:py-14 flex-1">
        <div className="max-w-3xl mx-auto space-y-8">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="font-heading text-base md:text-lg font-bold text-primary mb-2">{s.title}</h2>
              <p className="text-sm text-text-muted leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

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
              <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-4">Company</div>
              <ul className="space-y-2.5 text-xs text-white/60">
                <li><Link href="/about" className="hover:text-white transition-colors">About us</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-4">Explore</div>
              <ul className="space-y-2.5 text-xs text-white/60">
                <li><Link href="/courses" className="hover:text-white transition-colors">Courses</Link></li>
                <li><Link href="/sessions" className="hover:text-white transition-colors">Sessions</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-4">Legal</div>
              <ul className="space-y-2.5 text-xs text-white/60">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
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
