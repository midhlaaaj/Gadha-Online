"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconSend, IconMessageCircle, IconHeadset, IconUser, IconChevronLeft,
} from "@tabler/icons-react";
import { getStudentMentors, getStudentProfile, startConversationWithMentor, getOrCreateSupportChatRoom, getMessages, sendMessage } from "@/app/actions";
import { validateMessage, sanitizeText } from "@/lib/validate";

type MentorContact = Awaited<ReturnType<typeof getStudentMentors>>[number];
type RealMessage = Awaited<ReturnType<typeof getMessages>>[number];

const SUPPORT_ID = "__support__";

const AVATAR_COLORS = ["#2F7FE8", "#0F6E56", "#993556", "#534AB7", "#D97706"];
function colorFor(id: string) {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
function initialsFor(name: string) {
  return name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
}

// ─── Skeleton ──────────────────────────────────────────────────────
function MessagesSkeleton() {
  return (
    <div className="flex -m-4 h-[calc(100%+2rem)] sm:m-0 sm:h-[calc(100vh-220px)] sm:min-h-[500px] bg-white sm:rounded-2xl border-0 sm:border sm:border-[#D0DCF5] overflow-hidden">
      <div className="w-full sm:w-64 border-r border-[#D0DCF5] p-4 space-y-3">
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
      <div className="flex-1 p-6 space-y-4 hidden sm:block">
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
function ContactItem({ name, initials, subject, color, isSupport, active, lastMsg, onClick }: {
  name: string; initials: string; subject: string; color: string; isSupport?: boolean;
  active: boolean; lastMsg?: string; onClick: () => void;
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
        style={{ backgroundColor: color }}
      >
        {isSupport ? <IconHeadset className="w-5 h-5" /> : initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-bold truncate ${active ? "text-[#0C447C]" : "text-[#1B3A6B]"}`}>{name}</p>
        <p className="text-[11px] text-[#4A5A7A] truncate">{lastMsg ?? subject}</p>
      </div>
    </button>
  );
}

// ─── Chat bubble ──────────────────────────────────────────────────
function ChatBubble({ text, time, isSelf }: { text: string; time: string; isSelf: boolean }) {
  return (
    <div className={`flex gap-2.5 items-end ${isSelf ? "flex-row-reverse" : ""}`}>
      {!isSelf && (
        <div className="w-7 h-7 rounded-full bg-[#E6F1FB] flex items-center justify-center shrink-0 mb-0.5">
          <IconUser className="w-4 h-4 text-[#2F7FE8]" />
        </div>
      )}
      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
        isSelf
          ? "bg-[#2F7FE8] text-white rounded-br-sm"
          : "bg-[#F5F8FF] text-[#1B3A6B] rounded-bl-sm"
      }`}>
        {text}
        <p className={`text-[10px] mt-1 ${isSelf ? "text-blue-200 text-right" : "text-[#4A5A7A]"}`}>
          {time}
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────
export default function StudentMessagesPage() {
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [mentors, setMentors] = useState<MentorContact[]>([]);
  const [activeId, setActiveId] = useState<string>(SUPPORT_ID);

  // Real mentor conversation state
  const [roomIdByMentor, setRoomIdByMentor] = useState<Record<string, string>>({});
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [messages, setMessages] = useState<RealMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const [mobileShowChat, setMobileShowChat] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([getStudentProfile(), getStudentMentors()])
      .then(([profile, mentorList]) => {
        setStudentId(profile.id);
        setMentors(mentorList);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Resolve/create the chat room whenever a contact (support or mentor) becomes active
  useEffect(() => {
    if (roomIdByMentor[activeId]) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate fetch-driven-by-active-contact; loading/error state syncs with the async room resolution triggered by activeId changing
    setRoomLoading(true);
    setRoomError(null);
    const resolveRoom = activeId === SUPPORT_ID ? getOrCreateSupportChatRoom() : startConversationWithMentor(activeId);
    resolveRoom
      .then((roomId) => {
        if (cancelled) return;
        setRoomIdByMentor((prev) => ({ ...prev, [activeId]: roomId }));
      })
      .catch((err) => {
        if (cancelled) return;
        setRoomError(err instanceof Error ? err.message : "Failed to start conversation.");
      })
      .finally(() => {
        if (!cancelled) setRoomLoading(false);
      });

    return () => { cancelled = true; };
  }, [activeId, roomIdByMentor]);

  // Poll messages for the active room
  useEffect(() => {
    const roomId = roomIdByMentor[activeId];
    if (!roomId) return;

    const loadMessages = async () => {
      try {
        const msgs = await getMessages(roomId);
        setMessages(msgs || []);
      } catch (e) {
        console.error("Failed to get messages:", e);
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [activeId, roomIdByMentor]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeId]);

  const activeMentor = mentors.find((m) => m.id === activeId) || null;
  const lastMsgForMentor = () => undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const roomId = roomIdByMentor[activeId];
    const text = draft.trim();
    if (!roomId || !text) return;
    const check = validateMessage(text, { maxLength: 2000 });
    if (!check.valid) return;
    const safeText = sanitizeText(text);

    setSending(true);
    setDraft("");
    try {
      await sendMessage(roomId, safeText);
      const updated = await getMessages(roomId);
      setMessages(updated || []);
    } catch (e) {
      console.error(e);
      alert("Failed to send message");
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const openContact = (id: string) => {
    setActiveId(id);
    setMobileShowChat(true);
  };

  if (loading) return <MessagesSkeleton />;

  return (
    <div className="-m-4 h-[calc(100%+2rem)] sm:m-0 sm:h-auto sm:space-y-4">
      <div className="hidden sm:block">
        <h1 className="text-[22px] font-extrabold font-heading text-[#1B3A6B]">Messages</h1>
        <p className="text-[13px] text-[#4A5A7A] mt-0.5">Chat with your mentors or Gadha Online Support.</p>
      </div>

      <div className="flex h-full sm:h-[calc(100vh-220px)] sm:min-h-[520px] bg-white sm:rounded-2xl border-0 sm:border sm:border-[#D0DCF5] overflow-hidden sm:shadow-sm">
        {/* Contact list */}
        <aside className={`flex-shrink-0 w-full md:w-64 border-r border-[#D0DCF5] flex flex-col h-full ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
          <div className="px-4 pt-4 pb-2 border-b border-[#D0DCF5]">
            <p className="text-[11px] font-bold text-[#4A5A7A] uppercase tracking-widest">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 premium-scrollbar">
            <ContactItem
              name="Gadha Online Support"
              initials="TB"
              subject="Help & Support"
              color="#1B3A6B"
              isSupport
              active={activeId === SUPPORT_ID}
              onClick={() => openContact(SUPPORT_ID)}
            />
            {mentors.map((m) => (
              <ContactItem
                key={m.id}
                name={m.name}
                initials={m.initials}
                subject={m.subject}
                color={colorFor(m.id)}
                active={activeId === m.id}
                lastMsg={lastMsgForMentor()}
                onClick={() => openContact(m.id)}
              />
            ))}
            {mentors.length === 0 && (
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
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
              style={{ backgroundColor: activeId === SUPPORT_ID ? "#1B3A6B" : colorFor(activeId) }}
            >
              {activeId === SUPPORT_ID ? <IconHeadset className="w-4.5 h-4.5" /> : (activeMentor ? initialsFor(activeMentor.name) : "")}
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#1B3A6B]">
                {activeId === SUPPORT_ID ? "Gadha Online Support" : (activeMentor?.name ?? "")}
              </p>
              <p className="text-[11px] text-[#4A5A7A]">
                {activeId === SUPPORT_ID ? "Help & Support" : (activeMentor?.subject ?? "")}
              </p>
            </div>
            {activeId === SUPPORT_ID && (
              <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-600">● Online</span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 premium-scrollbar">
            {roomLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="w-6 h-6 border-2 border-[#2F7FE8] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : roomError ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                <p className="text-[13px] font-semibold text-red-600">{roomError}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <IconMessageCircle className="w-10 h-10 text-[#D0DCF5]" />
                <p className="text-[13px] font-semibold text-[#4A5A7A]">
                  {activeId === SUPPORT_ID
                    ? "Send a message to reach Gadha Online Support"
                    : `Start the conversation with ${activeMentor?.name}`}
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  text={msg.content}
                  time={new Date(msg.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  isSelf={msg.sender_id === studentId}
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-5 py-4 border-t border-[#D0DCF5] bg-white shrink-0">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message ${activeId === SUPPORT_ID ? "Gadha Online Support" : (activeMentor?.name ?? "")}…`}
                disabled={roomLoading || !!roomError}
                className="flex-1 bg-[#F5F8FF] border border-[#D0DCF5] rounded-full px-4 py-2.5 text-[13px] text-[#1B3A6B] placeholder:text-[#4A5A7A] outline-none focus:border-[#2F7FE8] transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending || roomLoading || !!roomError}
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
