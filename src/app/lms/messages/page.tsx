"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconSend, IconMessageCircle, IconHeadset, IconUser, IconChevronLeft,
} from "@tabler/icons-react";
import { getStudentMentors } from "@/app/actions";
import { validateMessage, sanitizeText } from "@/lib/validate";

type Contact = {
  id: string;
  name: string;
  initials: string;
  subject: string;
  avatarColor: string;
  isSupport?: boolean;
};

type Message = {
  id: string;
  sender: "student" | "contact";
  text: string;
  time: string;
};

type ConvoMap = Record<string, Message[]>;

const SUPPORT_CONTACT: Contact = {
  id: "__support__",
  name: "Tutoboard Support",
  initials: "TB",
  subject: "Help & Support",
  avatarColor: "#1B3A6B",
  isSupport: true,
};

const AVATAR_COLORS = ["#2F7FE8", "#0F6E56", "#993556", "#534AB7", "#D97706"];
function colorFor(id: string) {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
function nowTime() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// ─── Skeleton ──────────────────────────────────────────────────────
function MessagesSkeleton() {
  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[500px] bg-white rounded-2xl border border-[#D0DCF5] overflow-hidden">
      <div className="w-64 border-r border-[#D0DCF5] p-4 space-y-3">
        <div className="h-3 w-24 animate-shimmer rounded" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="w-10 h-10 rounded-full animate-shimmer shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-28 animate-shimmer rounded" />
              <div className="h-2.5 w-20 animate-shimmer rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
            <div className="w-8 h-8 rounded-full animate-shimmer shrink-0" />
            <div className="h-10 w-48 animate-shimmer rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Contact item ──────────────────────────────────────────────────
function ContactItem({ contact, active, lastMsg, onClick }: {
  contact: Contact; active: boolean; lastMsg?: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors cursor-pointer ${
        active ? "bg-[#E6F1FB]" : "hover:bg-[#F5F8FF]"
      }`}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
        style={{ backgroundColor: contact.avatarColor }}
      >
        {contact.isSupport ? <IconHeadset className="w-5 h-5" /> : contact.initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-bold truncate ${active ? "text-[#0C447C]" : "text-[#1B3A6B]"}`}>{contact.name}</p>
        <p className="text-[11px] text-[#4A5A7A] truncate">{lastMsg ?? contact.subject}</p>
      </div>
    </button>
  );
}

// ─── Chat bubble ──────────────────────────────────────────────────
function ChatBubble({ msg, isStudent }: { msg: Message; isStudent: boolean }) {
  return (
    <div className={`flex gap-2.5 items-end ${isStudent ? "flex-row-reverse" : ""}`}>
      {!isStudent && (
        <div className="w-7 h-7 rounded-full bg-[#E6F1FB] flex items-center justify-center shrink-0 mb-0.5">
          <IconUser className="w-4 h-4 text-[#2F7FE8]" />
        </div>
      )}
      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
        isStudent
          ? "bg-[#2F7FE8] text-white rounded-br-sm"
          : "bg-[#F5F8FF] text-[#1B3A6B] rounded-bl-sm"
      }`}>
        {msg.text}
        <p className={`text-[10px] mt-1 ${isStudent ? "text-blue-200 text-right" : "text-[#4A5A7A]"}`}>
          {msg.time}
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────
export default function StudentMessagesPage() {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([SUPPORT_CONTACT]);
  const [active, setActive] = useState<Contact>(SUPPORT_CONTACT);
  const [convos, setConvos] = useState<ConvoMap>({
    __support__: [
      {
        id: "s1",
        sender: "contact",
        text: "Hello! Welcome to Tutoboard Support. How can we help you today?",
        time: "Just now",
      },
    ],
  });
  const [draft, setDraft] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getStudentMentors()
      .then((mentors: any[]) => {
        const mentorContacts: Contact[] = mentors.map((m) => ({
          id: m.id,
          name: m.name,
          initials: m.initials,
          subject: m.subject,
          avatarColor: colorFor(m.id),
        }));
        setContacts([SUPPORT_CONTACT, ...mentorContacts]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convos, active]);

  const currentMessages = convos[active.id] ?? [];
  const lastMsg = (id: string) => {
    const msgs = convos[id];
    if (!msgs || msgs.length === 0) return undefined;
    return msgs[msgs.length - 1].text;
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const check = validateMessage(text, { maxLength: 2000 });
    if (!check.valid) return; // silently block oversized / malicious input
    const safeText = sanitizeText(text);
    const newMsg: Message = { id: `${Date.now()}`, sender: "student", text: safeText, time: nowTime() };
    setConvos((prev) => ({ ...prev, [active.id]: [...(prev[active.id] ?? []), newMsg] }));
    setDraft("");

    if (active.isSupport) {
      setTimeout(() => {
        const replies = [
          "Thank you for reaching out! Our team will review this shortly.",
          "Got it! We'll look into that and get back to you soon.",
          "Thanks for the message. Typically we respond within a few hours.",
        ];
        const reply: Message = {
          id: `${Date.now() + 1}`,
          sender: "contact",
          text: replies[Math.floor(Math.random() * replies.length)],
          time: nowTime(),
        };
        setConvos((prev) => ({ ...prev, [active.id]: [...(prev[active.id] ?? []), reply] }));
      }, 1000);
    }
  };

  const openContact = (c: Contact) => { setActive(c); setMobileShowChat(true); };

  if (loading) return <MessagesSkeleton />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-extrabold font-heading text-[#1B3A6B]">Messages</h1>
        <p className="text-[13px] text-[#4A5A7A] mt-0.5">Chat with your mentors or Tutoboard Support.</p>
      </div>

      <div className="flex h-[calc(100vh-220px)] min-h-[520px] bg-white rounded-2xl border border-[#D0DCF5] overflow-hidden shadow-sm">
        {/* Contact list */}
        <aside className={`flex-shrink-0 w-full md:w-64 border-r border-[#D0DCF5] flex flex-col h-full ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
          <div className="px-4 pt-4 pb-2 border-b border-[#D0DCF5]">
            <p className="text-[11px] font-bold text-[#4A5A7A] uppercase tracking-widest">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 premium-scrollbar">
            {contacts.map((c) => (
              <ContactItem key={c.id} contact={c} active={active.id === c.id} lastMsg={lastMsg(c.id)} onClick={() => openContact(c)} />
            ))}
            {contacts.length === 1 && (
              <div className="px-4 py-6 text-center">
                <IconMessageCircle className="w-8 h-8 text-[#D0DCF5] mx-auto mb-2" />
                <p className="text-[11px] text-[#4A5A7A] font-semibold">Enroll in courses to chat with mentors</p>
              </div>
            )}
          </div>
        </aside>

        {/* Chat panel */}
        <div className={`flex-1 flex flex-col min-w-0 h-full ${!mobileShowChat ? "hidden md:flex" : "flex"}`}>
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#D0DCF5] bg-white shrink-0">
            <button className="md:hidden p-1.5 rounded-lg hover:bg-[#F5F8FF] transition-colors" onClick={() => setMobileShowChat(false)}>
              <IconChevronLeft className="w-4 h-4 text-[#4A5A7A]" />
            </button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ backgroundColor: active.avatarColor }}>
              {active.isSupport ? <IconHeadset className="w-4.5 h-4.5" /> : active.initials}
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#1B3A6B]">{active.name}</p>
              <p className="text-[11px] text-[#4A5A7A]">{active.subject}</p>
            </div>
            {active.isSupport && (
              <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-600">● Online</span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 premium-scrollbar">
            {currentMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <IconMessageCircle className="w-10 h-10 text-[#D0DCF5]" />
                <p className="text-[13px] font-semibold text-[#4A5A7A]">Start the conversation with {active.name}</p>
              </div>
            )}
            {currentMessages.map((msg) => (
              <ChatBubble key={msg.id} msg={msg} isStudent={msg.sender === "student"} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-5 py-4 border-t border-[#D0DCF5] bg-white shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-3">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message ${active.name}…`}
                className="flex-1 bg-[#F5F8FF] border border-[#D0DCF5] rounded-full px-4 py-2.5 text-[13px] text-[#1B3A6B] placeholder:text-[#4A5A7A] outline-none focus:border-[#2F7FE8] transition-colors"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="w-10 h-10 rounded-full bg-[#2F7FE8] text-white flex items-center justify-center hover:bg-[#1B3A6B] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              >
                <IconSend className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
