"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { validateEmail } from "@/lib/validate";

/**
 * Checks if a given email address has a pending student invitation.
 * This is used to restrict student sign-up only to invited emails.
 */
export async function checkStudentInvitation(email: string) {
  // Validate email format first
  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    return { success: false, error: emailCheck.error };
  }

  try {
    const adminClient = createAdminClient();
    const { data: invite, error: inviteErr } = await adminClient
      .from("student_invitations")
      .select("id, status")
      .eq("email", email.trim().toLowerCase())
      .eq("status", "pending")
      .maybeSingle();

    if (inviteErr) {
      console.error("Database error while checking student invitation:", inviteErr);
      return { success: false, error: "Failed to verify invitation status. Please try again." };
    }

    if (!invite) {
      return {
        success: false,
        error: "This email has not been invited by a parent. Please ask your parent to add your email in their dashboard first.",
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Unexpected error checking student invitation:", err);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
