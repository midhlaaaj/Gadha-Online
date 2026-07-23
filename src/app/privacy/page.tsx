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
    title: "1. Information We Collect",
    body: "We collect information you provide directly to us, such as your name, email address, phone number, and payment details when you create an account, book a course or session, or contact support. We also collect information about your child(ren) when you register them as students, including grade level and school name. When you use our platform, we automatically collect usage data such as pages visited, session attendance, and assignment activity to help mentors track progress.",
  },
  {
    title: "2. How We Use Your Information",
    body: "We use the information we collect to provide and improve our tutoring services, process bookings and payments, match students with suitable mentors, send booking confirmations and class reminders, respond to support requests, and communicate important updates about your account or our services.",
  },
  {
    title: "3. Information Sharing",
    body: "We share limited information with mentors so they can deliver sessions effectively (student name, grade level, subject needs). We do not sell your personal information to third parties. We may share information with service providers who help us operate the platform (such as payment processors and cloud hosting providers), and when required by law.",
  },
  {
    title: "4. Data Security",
    body: "We use industry-standard security measures, including encrypted connections and access controls, to protect your personal information. Passwords are never stored in plain text. While we work hard to protect your data, no method of transmission over the internet is 100% secure.",
  },
  {
    title: "5. Cookies & Local Storage",
    body: "We use cookies and browser local storage to keep you signed in, remember your preferences, and understand how our platform is used. You can control cookies through your browser settings, though disabling them may affect some features.",
  },
  {
    title: "6. Children's Privacy",
    body: "Our platform is used by parents to book tutoring for their children. Student accounts for minors are created and managed by a parent or guardian, who is responsible for providing consent for the collection of their child's information.",
  },
  {
    title: "7. Your Rights",
    body: "You can access, update, or request deletion of your personal information at any time by contacting Gadha Online Support through your dashboard, or by reaching out to us directly. You may also request a copy of the data we hold about you.",
  },
  {
    title: "8. Changes to This Policy",
    body: "We may update this Privacy Policy from time to time to reflect changes in our practices or for legal reasons. We will post the updated policy on this page with a revised date.",
  },
  {
    title: "9. Contact Us",
    body: "If you have questions about this Privacy Policy or how we handle your data, please reach out to us via Gadha Online Support from your dashboard, or through our contact form on the homepage.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full bg-white text-primary flex-1 min-h-screen flex flex-col font-sans">
      <title>Privacy Policy | Gadha Online</title>
      <meta name="description" content="Read Gadha Online's Privacy Policy to learn how we collect, use, and protect your personal information." />

      {/* PAGE HEADER */}
      <header className="bg-surface px-6 md:px-12 py-8 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto">
          <nav className="text-xs text-text-muted mb-3 flex items-center gap-1.5 font-medium">
            <Link href="/" className="hover:text-secondary transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <span className="text-primary font-semibold">Privacy Policy</span>
          </nav>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-primary">Privacy Policy</h1>
          <p className="text-xs md:text-sm text-text-muted mt-2 max-w-2xl">
            Last updated: January 2026. This policy explains how Gadha Online collects, uses, and protects your information.
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
