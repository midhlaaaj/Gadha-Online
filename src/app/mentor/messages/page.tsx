"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconSend, IconMessageCircle, IconUser, IconChevronLeft,
  IconClock, IconLoader
} from "@tabler/icons-react";
import { getChatRooms, getMessages, sendMessage, getMentorProfile } from "@/app/actions";

type ChatRoom = Awaited<ReturnType<typeof getChatRooms>>[number];
type Message = Awaited<ReturnType<typeof getMessages>>[number];
type Profile = Awaited<ReturnType<typeof getMentorProfile>>;

const AVATAR_COLORS = ["#2F7FE8", "#0F6E56", "#993556", "#534AB7", "#D97706"];
function colorFor(id: string) {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function MessagesSkeleton() {
  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[500px] bg-white rounded-2xl border border-[#D0DCF5] overflow-hidden">
      <div className="w-80 border-r border-[#D0DCF5] p-4 space-y-3 hidden md:block">
        <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
              <div className="h-2.5 w-20 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 p-6 space-y-4 flex flex-col justify-end">
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

export default function MentorMessagesPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  
  // Responsive layout state
  const [mobileShowChat, setMobileShowChat] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load profile and rooms
  const loadRooms = async (selectFirst = false) => {
    try {
      const [p, rooms] = await Promise.all([
        getMentorProfile().catch(() => null),
        getChatRooms().catch(() => []),
      ]);
      setProfile(p);
      setChatRooms(rooms || []);
      
      if (selectFirst && rooms && rooms.length > 0) {
        setActiveRoom(rooms[0]);
      }
    } catch (e) {
      console.error("Failed to load chat rooms:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms(true);
  }, []);

  // Poll messages when active room changes
  useEffect(() => {
    if (!activeRoom) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        const msgs = await getMessages(activeRoom.id);
        setMessages(msgs || []);
      } catch (e) {
        console.error("Failed to get messages:", e);
      }
    };

    loadMessages();
    
    // Polling interval for live chat updates
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [activeRoom]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom || !draft.trim() || !profile) return;

    setSending(true);
    const content = draft.trim();
    setDraft(""); // optimistic clear

    try {
      await sendMessage(activeRoom.id, content);
      const updatedMessages = await getMessages(activeRoom.id);
      setMessages(updatedMessages || []);
    } catch (e) {
      console.error(e);
      alert("Failed to send message");
      setDraft(content); // revert on error
    } finally {
      setSending(false);
    }
  };

  // Helper to extract receiver details from a chat room
  const getReceiverInfo = (room: ChatRoom) => {
    const otherParticipant = (room.chat_participants || []).find(
      (p: any) => p.user_id !== profile?.id
    );
    const profileObj = otherParticipant?.profile as any;
    const name = (Array.isArray(profileObj) ? profileObj[0]?.full_name : profileObj?.full_name) || room.name || "Chat Room";
    const role = (Array.isArray(profileObj) ? profileObj[0]?.role : profileObj?.role) || "";
    const initials = name
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
    
    return { name, role, initials, color: colorFor(room.id) };
  };

  if (loading) return <MessagesSkeleton />;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] bg-white rounded-2xl border border-[#D0DCF5] overflow-hidden">
      {/* Messages Layout Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Chat Rooms List */}
        <div className={`w-full md:w-80 border-r border-[#D0DCF5] flex flex-col ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
          <div className="px-5 py-4 border-b border-[#D0DCF5] bg-[#F5F8FF]">
            <h2 className="text-[15px] font-extrabold font-heading text-[#1B3A6B]">Messages</h2>
            <p className="text-[11px] text-[#4A5A7A] mt-0.5">Inbox with students & parents</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1 premium-scrollbar">
            {chatRooms.length === 0 ? (
              <div className="text-center py-10 text-[12px] text-[#9BA8C0]">
                No active conversations.
              </div>
            ) : (
              chatRooms.map((room) => {
                const info = getReceiverInfo(room);
                const isActive = activeRoom?.id === room.id;

                return (
                  <button
                    key={room.id}
                    onClick={() => {
                      setActiveRoom(room);
                      setMobileShowChat(true);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors cursor-pointer focus:outline-none ${
                      isActive ? "bg-[#E6F1FB]" : "hover:bg-[#F5F8FF]"
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm"
                      style={{ backgroundColor: info.color }}
                    >
                      {info.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-bold truncate ${isActive ? "text-[#0C447C]" : "text-[#1B3A6B]"}`}>
                        {info.name}
                      </p>
                      <p className="text-[10px] text-[#9BA8C0] capitalize truncate">{info.role}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Messages View */}
        <div className={`flex-1 flex flex-col justify-between ${!mobileShowChat ? "hidden md:flex" : "flex"}`}>
          {activeRoom ? (
            <>
              {/* Header */}
              {(() => {
                const info = getReceiverInfo(activeRoom);
                return (
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D0DCF5] bg-[#F5F8FF]">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setMobileShowChat(false)}
                        className="md:hidden p-1 rounded-lg border border-[#D0DCF5] text-[#1B3A6B] hover:bg-slate-50 cursor-pointer"
                      >
                        <IconChevronLeft className="w-5 h-5" />
                      </button>
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-sm shrink-0"
                        style={{ backgroundColor: info.color }}
                      >
                        {info.initials}
                      </div>
                      <div>
                        <h3 className="text-[13px] font-extrabold text-[#1B3A6B]">{info.name}</h3>
                        <p className="text-[10px] text-[#9BA8C0] capitalize">{info.role}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Message Bubbles Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 premium-scrollbar bg-slate-50/50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-[#9BA8C0] gap-2 py-10">
                    <IconMessageCircle className="w-8 h-8 text-[#D0DCF5]" />
                    <p className="text-[12px] font-bold">No messages yet</p>
                    <p className="text-[11px]">Send a message to start the conversation.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSelf = msg.sender_id === profile?.id;
                    const timeStr = new Date(msg.created_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div key={msg.id} className={`flex gap-2.5 items-end ${isSelf ? "flex-row-reverse" : ""}`}>
                        {!isSelf && (
                          <div className="w-7 h-7 rounded-full bg-[#EBF2FF] border border-[#d0e0f8] flex items-center justify-center shrink-0 mb-0.5">
                            <IconUser className="w-4 h-4 text-[#2F7FE8]" />
                          </div>
                        )}
                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                          isSelf
                            ? "bg-[#2F7FE8] text-white rounded-br-sm"
                            : "bg-white border border-[#D0DCF5] text-[#1B3A6B] rounded-bl-sm"
                        }`}>
                          {msg.content}
                          <p className={`text-[9px] mt-1 font-semibold ${isSelf ? "text-blue-100 text-right" : "text-[#9BA8C0]"}`}>
                            {timeStr}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input bar */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-[#D0DCF5] bg-white flex gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
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
              <p className="text-[13px] font-bold text-[#1B3A6B]">Select a Conversation</p>
              <p className="text-[12px]">Choose a chat from the sidebar to view messages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
