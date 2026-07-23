"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconSend, IconMessageCircle, IconHeadset, IconUser,
} from "@tabler/icons-react";
import { getSupportConversations, getSupportMessages, sendSupportReply } from "@/app/actions";

type Conversation = Awaited<ReturnType<typeof getSupportConversations>>[number];
type Message = Awaited<ReturnType<typeof getSupportMessages>>[number];

const AVATAR_COLORS = ["#2F7FE8", "#0F6E56", "#993556", "#534AB7", "#D97706"];
function colorFor(id: string) {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
function initialsFor(name: string) {
  return name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
}

function SupportSkeleton() {
  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[500px] bg-white rounded-2xl border border-[#E6EBF8] overflow-hidden">
      <div className="w-80 border-r border-[#E6EBF8] p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
              <div className="h-2.5 w-40 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`flex gap-3 items-end ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
            <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse shrink-0" />
            <div className="h-10 w-48 bg-slate-100 animate-pulse rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminSupportPage() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = async (selectFirst = false) => {
    try {
      const convos = await getSupportConversations();
      setConversations(convos);
      if (selectFirst && convos.length > 0) {
        setActiveId(convos[0].id);
      }
    } catch (e) {
      console.error("Failed to load support conversations:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate fetch-on-mount; setState fires after the awaited request resolves, not synchronously
    loadConversations(true);
    const interval = setInterval(() => loadConversations(false), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears the message list when no conversation is selected, in sync with the activeId external state
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        const msgs = await getSupportMessages(activeId);
        setMessages(msgs);
      } catch (e) {
        console.error("Failed to load support messages:", e);
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId || !draft.trim()) return;

    setSending(true);
    const content = draft.trim();
    setDraft("");
    try {
      await sendSupportReply(activeId, content);
      const [msgs] = await Promise.all([getSupportMessages(activeId), loadConversations(false)]);
      setMessages(msgs);
    } catch (e) {
      console.error(e);
      alert("Failed to send reply");
      setDraft(content);
    } finally {
      setSending(false);
    }
  };

  const activeConvo = conversations.find((c) => c.id === activeId) || null;

  if (loading) return <SupportSkeleton />;

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[500px] bg-white rounded-2xl border border-[#E6EBF8] overflow-hidden">
      {/* Conversation list */}
      <div className="w-80 border-r border-[#E6EBF8] flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-[#E6EBF8]">
          <h2 className="text-[15px] font-extrabold font-heading text-[#1B3A6B]">Support Inbox</h2>
          <p className="text-[11px] text-[#9BA8C0] mt-0.5">Messages from students, mentors & parents</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 premium-scrollbar">
          {conversations.length === 0 ? (
            <div className="text-center py-10 text-[12px] text-[#9BA8C0]">
              No support conversations yet.
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = activeId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                    isActive ? "bg-[#EBF2FF]" : "hover:bg-[#F5F7FF]"
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm"
                    style={{ backgroundColor: colorFor(c.requesterId) }}
                  >
                    {initialsFor(c.requesterName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-[12px] font-bold truncate ${isActive ? "text-[#0C447C]" : "text-[#1B3A6B]"}`}>
                        {c.requesterName}
                      </p>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-[#F5F7FF] text-[#9BA8C0] rounded-md shrink-0">
                        {c.requesterRole}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#9BA8C0] truncate">{c.lastMessage || "No messages yet"}</p>
                  </div>
                  {c.needsReply && (
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat panel */}
      <div className="flex-1 flex flex-col">
        {activeConvo ? (
          <>
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#E6EBF8] bg-[#F5F7FF]">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-sm shrink-0"
                style={{ backgroundColor: colorFor(activeConvo.requesterId) }}
              >
                {initialsFor(activeConvo.requesterName)}
              </div>
              <div>
                <h3 className="text-[13px] font-extrabold text-[#1B3A6B]">{activeConvo.requesterName}</h3>
                <p className="text-[10px] text-[#9BA8C0]">{activeConvo.requesterEmail} · {activeConvo.requesterRole}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 premium-scrollbar bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-[#9BA8C0] gap-2 py-10">
                  <IconMessageCircle className="w-8 h-8 text-[#D0DCF5]" />
                  <p className="text-[12px] font-bold">No messages yet</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isAdminReply = msg.sender?.role === "admin";
                  const timeStr = new Date(msg.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

                  return (
                    <div key={msg.id} className={`flex gap-2.5 items-end ${isAdminReply ? "flex-row-reverse" : ""}`}>
                      {!isAdminReply && (
                        <div className="w-7 h-7 rounded-full bg-[#EBF2FF] border border-[#d0e0f8] flex items-center justify-center shrink-0 mb-0.5">
                          <IconUser className="w-4 h-4 text-[#2F7FE8]" />
                        </div>
                      )}
                      {isAdminReply && (
                        <div className="w-7 h-7 rounded-full bg-[#1B3A6B] flex items-center justify-center shrink-0 mb-0.5">
                          <IconHeadset className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                        isAdminReply
                          ? "bg-[#2F7FE8] text-white rounded-br-sm"
                          : "bg-white border border-[#D0DCF5] text-[#1B3A6B] rounded-bl-sm"
                      }`}>
                        {msg.content}
                        <p className={`text-[9px] mt-1 font-semibold ${isAdminReply ? "text-blue-100 text-right" : "text-[#9BA8C0]"}`}>
                          {timeStr}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-[#E6EBF8] bg-white flex gap-3">
              <input
                type="text"
                placeholder="Type a reply..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="flex-1 text-[13px] px-4 py-2.5 rounded-xl border border-[#D0DCF5] text-[#1B3A6B] focus:outline-none focus:border-[#2F7FE8]"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="w-10 h-10 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-colors flex items-center justify-center shrink-0 cursor-pointer focus:outline-none disabled:opacity-50"
              >
                <IconSend className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-[#9BA8C0] p-6 gap-2">
            <IconMessageCircle className="w-10 h-10 text-[#D0DCF5]" />
            <p className="text-[13px] font-bold text-[#1B3A6B]">Select a conversation</p>
            <p className="text-[12px]">Choose a request from the sidebar to view and reply.</p>
          </div>
        )}
      </div>
    </div>
  );
}
