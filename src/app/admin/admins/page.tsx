"use client";

import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconTrash,
  IconShieldCheck,
  IconClock,
} from "@tabler/icons-react";
import { getAdminData, inviteAdmin, revokeAdminInvite } from "../../actions";
import ConfirmDialog from "@/components/ConfirmDialog";

interface Admin {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

interface AdminInvitation {
  id: string;
  email: string;
  fullName: string;
  status: string;
  createdAt: string;
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: "destructive" | "constructive";
    onConfirm: () => void;
  } | null>(null);

  const loadData = async () => {
    try {
      const res = await getAdminData();
      setAdmins(res.admins || []);
      setInvitations(res.adminInvitations || []);
    } catch (err) {
      console.error("Failed to load admin management data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return;
    setSending(true);
    try {
      await inviteAdmin({ email: inviteEmail, fullName: inviteName });
      setInviteEmail("");
      setInviteName("");
      setInviteOpen(false);
      await loadData();
    } catch (err: any) {
      alert("Error sending invite: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const confirmSendInvite = () => {
    if (!inviteEmail.trim()) return;
    setConfirmDialog({
      title: "Send admin invite?",
      message: `${inviteEmail.trim()} will be able to create a full admin account with access to all site data and settings.`,
      confirmLabel: "Send invite",
      variant: "constructive",
      onConfirm: () => {
        setConfirmDialog(null);
        sendInvite();
      },
    });
  };

  const cancelInvite = (id: string, email: string) => {
    setConfirmDialog({
      title: "Cancel this invitation?",
      message: `${email} will no longer be able to sign up as an admin using this invite.`,
      confirmLabel: "Cancel invite",
      variant: "destructive",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await revokeAdminInvite(id);
          await loadData();
        } catch (err: any) {
          alert("Error cancelling invite: " + err.message);
        }
      },
    });
  };

  const pendingInvitations = invitations.filter((i) => i.status === "pending");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-semibold text-slate-500 font-sans">Loading admins...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* CURRENT ADMINS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1B3A6B]">
            Admins ({admins.length})
          </h2>
          <button
            onClick={() => setInviteOpen(true)}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <IconPlus className="w-4 h-4" /> Invite admin
          </button>
        </div>

        <div className="bg-white border border-[#E6EBF8] rounded-2xl divide-y divide-[#F0F3FB] shadow-sm overflow-hidden">
          {admins.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-5 py-4">
              <div className="w-9 h-9 rounded-full bg-[#EBF2FF] text-[#2F7FE8] flex items-center justify-center font-heading text-xs font-bold shrink-0">
                {a.fullName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#1B3A6B]">{a.fullName}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{a.email}</div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                <IconShieldCheck className="w-3 h-3" /> Admin
              </span>
              <span className="text-[10px] text-text-muted shrink-0 hidden sm:block">
                Joined{" "}
                {new Date(a.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* PENDING INVITATIONS */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1B3A6B]">
            Pending invitations ({pendingInvitations.length})
          </h2>
          <div className="bg-white border border-[#E6EBF8] rounded-2xl divide-y divide-[#F0F3FB] shadow-sm overflow-hidden">
            {pendingInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-5 py-4">
                <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <IconClock className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#1B3A6B]">{inv.fullName || inv.email}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">{inv.email}</div>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full shrink-0">
                  Pending
                </span>
                <button
                  onClick={() => cancelInvite(inv.id, inv.email)}
                  className="w-7 h-7 rounded-lg border border-red-200 bg-white flex items-center justify-center hover:bg-red-50 text-red-600 cursor-pointer shrink-0"
                >
                  <IconTrash className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INVITE DRAWER */}
      {inviteOpen && (
        <>
          <div
            onClick={() => setInviteOpen(false)}
            className="fixed inset-0 bg-[#1B3A6B]/30 backdrop-blur-xs z-[200] transition-opacity duration-300"
          ></div>
          <div className="fixed top-0 right-0 w-[420px] h-full bg-white z-[201] shadow-2xl flex flex-col transition-transform duration-300 animate-slide-in">
            <header className="px-6 py-4.5 border-b border-[#E6EBF8] flex items-center justify-between shrink-0">
              <h3 className="font-heading text-sm font-extrabold text-[#1B3A6B]">Invite new admin</h3>
              <button
                onClick={() => setInviteOpen(false)}
                className="w-7 h-7 border border-[#E6EBF8] bg-surface hover:bg-badge-bg rounded-lg text-primary text-sm flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Email address</label>
                <input
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
                  type="email"
                  placeholder="name@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#1B3A6B] uppercase">Full name (optional)</label>
                <input
                  className="text-xs p-2.5 border border-border-subtle rounded-lg outline-none font-semibold text-[#1B3A6B]"
                  type="text"
                  placeholder="e.g. Rahul Mehta"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-[#9BA8C0] leading-relaxed">
                When this person signs up with this email address, their account will automatically be granted admin access.
              </p>
            </div>

            <footer className="px-6 py-4 border-t border-[#E6EBF8] flex gap-3 shrink-0">
              <button
                onClick={() => setInviteOpen(false)}
                className="text-xs font-semibold px-4 py-2.5 rounded-lg bg-transparent text-primary border border-border-subtle hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={confirmSendInvite}
                disabled={sending || !inviteEmail.trim()}
                className="flex-1 text-xs font-bold py-2.5 rounded-lg bg-[#2F7FE8] text-white hover:bg-[#1B3A6B] transition-colors disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send invite"}
              </button>
            </footer>
          </div>
        </>
      )}

      {/* CONFIRM DIALOG (constructive + destructive actions) */}
      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.title || ""}
        message={confirmDialog?.message || ""}
        confirmLabel={confirmDialog?.confirmLabel}
        variant={confirmDialog?.variant}
        onConfirm={() => confirmDialog?.onConfirm()}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
}
