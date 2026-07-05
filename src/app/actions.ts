"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { validateEmail } from "@/lib/validate";

// ----------------------------------------------------
// HELPERS
// ----------------------------------------------------

// Subject styling fallback mapping for UI compatibility
function mapSubjectToStyle(subject: string) {
  switch (subject) {
    case "Mathematics":
      return { colorBg: "#dbeafe", iconName: "math" };
    case "Programming":
      return { colorBg: "#dcfce7", iconName: "code" };
    case "Science":
      return { colorBg: "#fef9c3", iconName: "flask" };
    case "English":
      return { colorBg: "#ede9fe", iconName: "writing" };
    default:
      return { colorBg: "#f5f8ff", iconName: "book" };
  }
}

// Helper: Find mentor UUID by full name
async function resolveMentorIdByName(name: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("full_name", name)
    .eq("role", "mentor")
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.id;
}

// ----------------------------------------------------
// ACTIONS
// ----------------------------------------------------

export async function getHomepageData() {
  noStore();
  const supabase = await createClient();

  // 1. Get Hero Settings
  const { data: settings } = await supabase
    .from("homepage_settings")
    .select("*")
    .eq("id", 1)
    .single();

  // 2. Get Testimonials (visible only)
  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("*")
    .eq("show_on_site", true)
    .order("created_at", { ascending: false });

  // 3. Get Active Courses
  const { data: dbCourses } = await supabase
    .from("courses")
    .select("*, mentor:mentors(profile:profiles(full_name))")
    .eq("status", "Active")
    .order("created_at", { ascending: false });

  const courses = (dbCourses || []).map((c: any) => {
    const style = mapSubjectToStyle(c.subject);
    return {
      id: c.id,
      title: c.title,
      subject: c.subject,
      format: c.format,
      price: Number(c.price),
      mentor: c.mentor?.profile?.full_name || "Unknown Mentor",
      students: c.students_count,
      rating: Number(c.rating),
      status: c.status,
      colorBg: style.colorBg,
      iconName: style.iconName,
      coverImageUrl: c.cover_image_url || "",
      languages: c.languages || ["English"],
    };
  });

  // 4. Get Active Sessions
  const { data: dbSessions } = await supabase
    .from("sessions")
    .select("*, mentor:mentors(profile:profiles(full_name, avatar_url))")
    .eq("status", "Active")
    .order("created_at", { ascending: false });

  const sessions = (dbSessions || []).map((s: any) => {
    const name = s.mentor?.profile?.full_name || "Unknown Mentor";
    const init = name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();
    return {
      id: s.id,
      title: s.title,
      description: s.description || "",
      mentor: name,
      mentorAvatar: init,
      mentorColor: s.color_bg || "#1B3A6B",
      type: s.type,
      bookings: s.bookings_count,
      subject: s.subject,
      price: Number(s.price),
      status: s.status,
      colorBg: s.color_bg || "#ede9fe",
      iconName: s.icon_name || "writing",
    };
  });

  // 5. Get Active Mentors
  const { data: dbMentors } = await supabase
    .from("mentors")
    .select("*, profile:profiles(full_name, avatar_url, email)")
    .eq("is_active", true)
    .order("rating", { ascending: false });

  const mentors = (dbMentors || [])
    .filter((m: any) => {
      const hasBio = m.bio && m.bio.trim() !== "" && m.bio !== "Biography...";
      const hasExpertise = m.expertise && m.expertise.length > 0;
      const hasRate = m.hourly_rate && Number(m.hourly_rate) > 0;
      const hasQual = m.qualification && m.qualification.trim() !== "" && m.qualification !== "Educator";
      const hasExp = m.experience && Number(m.experience) > 0;
      return hasBio && hasExpertise && hasRate && hasQual && hasExp;
    })
    .map((m: any) => {
      const name = m.profile?.full_name || "Unknown Mentor";
      const init = name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();
      return {
        id: m.id,
        name,
        subject: m.expertise.join(" & "),
        rating: Number(m.rating),
        students: 420,
        courses: 10,
        rate: Number(m.hourly_rate),
        verified: m.verified || false,
        avatarText: init,
        avatarBg: "#1B3A6B",
        qualification: m.qualification || "Educator",
        experience: m.experience || 5,
        bio: m.bio || "",
      };
    });

  return {
    settings: settings || {
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
    },
    testimonials: testimonials || [],
    courses,
    sessions,
    mentors,
  };
}

export async function getAdminData() {
  noStore();
  const supabase = createAdminClient();

  // 1. Get Hero settings
  const { data: settings } = await supabase
    .from("homepage_settings")
    .select("*")
    .eq("id", 1)
    .single();

  // 2. Get Testimonials
  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });

  // 3. Get All Bookings for Admin (Moved to top to compute dynamic enrollment counts)
  const { data: dbBookings } = await supabase
    .from("bookings")
    .select(`
      *,
      parent:parents(profile:profiles(full_name, email)),
      student:students(profile:profiles(full_name, email)),
      course:courses(title),
      session:sessions(title)
    `)
    .order("created_at", { ascending: false });

  const bookings = (dbBookings || []).map((b: any) => {
    const studentProfile = b.student?.profile;
    const studentName = studentProfile?.full_name || "Unknown Student";
    const studentEmail = studentProfile?.email || "";

    const parentProfile = b.parent?.profile;
    let parentEmail = parentProfile?.email || "";
    let parentName = parentProfile?.full_name || "";

    if (!parentEmail && studentEmail) {
      parentEmail = studentEmail;
    }
    if (!parentName || parentName === "Unknown Parent") {
      parentName = parentEmail || "Unknown Parent";
    }

    let itemTitle = "1-on-1 Direct Private Session";
    let bookingType = "1-on-1 Session";
    
    if (b.course) {
      itemTitle = b.course.title;
      bookingType = "Course";
    } else if (b.session) {
      itemTitle = b.session.title;
      bookingType = "Session";
    }

    return {
      id: b.id,
      parentName,
      parentEmail,
      studentName,
      bookingType,
      itemTitle,
      amountPaid: Number(b.amount_paid),
      status: b.status,
      paymentStatus: b.payment_status,
      createdAt: b.created_at,
    };
  });

  // Calculate actual database enrollment count per course / session
  const courseBookingCounts: Record<string, number> = {};
  const sessionBookingCounts: Record<string, number> = {};

  (dbBookings || []).forEach((b: any) => {
    if (b.course_id) {
      courseBookingCounts[b.course_id] = (courseBookingCounts[b.course_id] || 0) + 1;
    }
    if (b.session_id) {
      sessionBookingCounts[b.session_id] = (sessionBookingCounts[b.session_id] || 0) + 1;
    }
  });

  // 4. Get All Courses
  const { data: dbCourses } = await supabase
    .from("courses")
    .select("*, mentor:mentors(profile:profiles(full_name))")
    .order("created_at", { ascending: false });

  const courses = (dbCourses || []).map((c: any) => {
    const style = mapSubjectToStyle(c.subject);
    const dbBookingCount = courseBookingCounts[c.id] || 0;
    return {
      id: c.id,
      title: c.title,
      description: c.description || "",
      aboutCourse: c.about_course || "",
      coverImageUrl: c.cover_image_url || "",
      subject: c.subject,
      format: c.format,
      price: Number(c.price),
      mentor: c.mentor?.profile?.full_name || "Unknown Mentor",
      students: dbBookingCount, // Dynamic enrolled students count
      rating: Number(c.rating),
      status: c.status,
      learningOutcomes: c.learning_outcomes || [],
      curriculum: c.curriculum || [],
      inclusions: c.inclusions || [],
      inclusionsEnabled: c.inclusions_enabled || [],
      batchStartDate: c.batch_start_date || "",
      batchEndDate: c.batch_end_date || "",
      classDays: c.class_days || "",
      classTiming: c.class_timing || "",
      durationDays: Number(c.duration_days || 30),
      totalSessions: Number(c.total_sessions || 10),
      sessionsPerWeek: Number(c.sessions_per_week || 2),
      colorBg: style.colorBg,
      iconName: style.iconName,
      languages: c.languages || ["English"],
    };
  });

  // 5. Get All Sessions
  const { data: dbSessions } = await supabase
    .from("sessions")
    .select("*, mentor:mentors(profile:profiles(full_name, avatar_url))")
    .order("created_at", { ascending: false });

  const sessions = (dbSessions || []).map((s: any) => {
    const name = s.mentor?.profile?.full_name || "Unknown Mentor";
    const init = name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();
    const dbBookingCount = sessionBookingCounts[s.id] || 0;
    return {
      id: s.id,
      title: s.title,
      description: s.description || "",
      mentor: name,
      mentorAvatar: init,
      mentorColor: s.color_bg || "#1B3A6B",
      type: s.type,
      bookings: dbBookingCount, // Dynamic bookings count
      subject: s.subject,
      price: Number(s.price),
      status: s.status,
      colorBg: s.color_bg || "#ede9fe",
      iconName: s.icon_name || "writing",
      aboutSession: s.about_session || "",
      whatsCovered: s.whats_covered || [],
      inclusions: s.inclusions || [],
      inclusionsEnabled: s.inclusions_enabled || [],
      durationOptions: s.duration_options || "60 or 90 min",
      platform: s.platform || "Zoom",
      language: s.language || "English / Hindi",
      days: (s.days || "Mon – Sat").replace(/^Every\s+/i, ""),
      reschedulePolicy: s.reschedule_policy || "Up to 4 hrs before",
      sessionDate: s.session_date || "",
      sessionTime: s.session_time || "",
      isRepeatable: s.is_repeatable || false,
    };
  });

  // 6. Get All Mentors
  const { data: dbMentors } = await supabase
    .from("mentors")
    .select("*, profile:profiles(full_name, avatar_url, email)")
    .order("created_at", { ascending: false });

  const activeMentors = (dbMentors || []).map((m: any) => {
    const name = m.profile?.full_name || "Unknown Mentor";
    const init = name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();
    return {
      id: m.id,
      name,
      email: m.profile?.email || "",
      subject: m.expertise.join(" & "),
      rating: Number(m.rating),
      students: 420,
      courses: 10,
      rate: Number(m.hourly_rate),
      verified: m.verified || false,
      avatarText: init,
      avatarBg: "#1B3A6B",
      qualification: m.qualification || "Educator",
      experience: m.experience || 5,
      bio: m.bio || "",
    };
  });

  // Get pending invitations
  const { data: dbInvites } = await supabase
    .from("mentor_invitations")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const pendingInvites = (dbInvites || []).map((inv: any) => {
    const name = inv.full_name || "Pending Mentor";
    const init = name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();
    return {
      id: `inv-${inv.id}`,
      name,
      email: inv.email,
      subject: inv.expertise.join(" & "),
      rating: 5.0,
      students: 0,
      courses: 0,
      rate: Number(inv.hourly_rate),
      verified: false,
      avatarText: init,
      avatarBg: "#9BA8C0",
      qualification: inv.qualification || "Educator",
      experience: inv.experience || 1,
      bio: "Invitation pending. Ready for sign up.",
      isInvitation: true,
    };
  });

  const mentors = [...pendingInvites, ...activeMentors];


  return {
    settings: settings || {
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
    },
    testimonials: (testimonials || []).map((t: any) => ({
      id: t.id,
      studentName: t.student_name,
      role: t.role,
      quote: t.quote,
      rating: t.rating,
      showOnSite: t.show_on_site,
      avatarBg: t.avatar_bg,
      avatarText: t.avatar_text,
    })),
    courses,
    sessions,
    mentors,
    bookings,
  };
}

// ----------------------------------------------------
// HERO SETTINGS
// ----------------------------------------------------

export async function updateHeroSettings(data: any) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("homepage_settings")
    .update({
      badge_text: data.badge_text || data.badgeText,
      headline: data.headline,
      accented_text: data.accented_text || data.accentedText,
      subheading: data.subheading,
      primary_cta: data.primary_cta || data.primaryCta,
      primary_link: data.primary_link || data.primaryLink,
      secondary_cta: data.secondary_cta || data.secondaryCta,
      secondary_link: data.secondary_link || data.secondaryLink,
      c1: data.c1,
      cl1: data.cl1,
      c2: data.c2,
      cl2: data.cl2,
      c3: data.c3,
      cl3: data.cl3,
      c4: data.c4,
      cl4: data.cl4,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

// ----------------------------------------------------
// COURSES
// ----------------------------------------------------

export async function upsertCourse(course: any) {
  const supabase = createAdminClient();

  // Resolve mentor string to a UUID
  let mentorId = await resolveMentorIdByName(course.mentor);
  if (!mentorId) {
    const { data } = await supabase.from("mentors").select("id").limit(1).single();
    mentorId = data?.id || null;
  }

  const courseData = {
    title: course.title,
    description: course.description || `Structured course program in ${course.subject}.`,
    about_course: course.aboutCourse || "",
    subject: course.subject,
    format: course.format,
    price: Number(course.price),
    class_level: course.classLevel || null,
    mentor_id: mentorId,
    status: course.status,
    cover_image_url: course.coverImageUrl || "",
    students_count: Number(course.students || 0),
    rating: Number(course.rating || 5.0),
    learning_outcomes: course.learningOutcomes || [],
    curriculum: course.curriculum || [],
    inclusions: course.inclusions || [],
    batch_start_date: course.batchStartDate || "",
    batch_end_date: course.batchEndDate || "",
    class_days: course.classDays || "",
    class_timing: course.classTiming || "",
    duration_days: Number(course.durationDays || 30),
    total_sessions: Number(course.totalSessions || 10),
    sessions_per_week: Number(course.sessionsPerWeek || 2),
    join_url: course.joinUrl || null,
    languages: course.languages || ["English"],
    updated_at: new Date().toISOString(),
  };

  const isNew = !course.id || course.id.startsWith("c-");

  // ── Mentor time conflict check for Live batch courses ──
  if (mentorId && (course.format === "Live batch" || course.format === "Live individual") && course.batchStartDate && course.batchEndDate && course.classDays && course.classTiming) {
    // Find other active live courses for this mentor that overlap in date range and class days/timing
    const { data: existingCourses } = await supabase
      .from("courses")
      .select("id, title, batch_start_date, batch_end_date, class_days, class_timing, format")
      .eq("mentor_id", mentorId)
      .in("format", ["Live batch", "Live individual"])
      .eq("status", "Active");

    const conflicting = (existingCourses || []).filter((ec: any) => {
      // Skip self when editing
      if (!isNew && ec.id === course.id) return false;
      if (!ec.batch_start_date || !ec.batch_end_date || !ec.class_days || !ec.class_timing) return false;

      // Check date range overlap
      const newStart = new Date(course.batchStartDate).getTime();
      const newEnd = new Date(course.batchEndDate).getTime();
      const existStart = new Date(ec.batch_start_date).getTime();
      const existEnd = new Date(ec.batch_end_date).getTime();
      const datesOverlap = newStart <= existEnd && newEnd >= existStart;
      if (!datesOverlap) return false;

      // Check if any class days overlap
      const newDays = course.classDays.split(",").map((d: string) => d.trim());
      const existDays = ec.class_days.split(",").map((d: string) => d.trim());
      const daysOverlap = newDays.some((d: string) => existDays.includes(d));
      if (!daysOverlap) return false;

      // Check if timing is the same
      return ec.class_timing === course.classTiming;
    });

    if (conflicting.length > 0) {
      const conflictNames = conflicting.map((c: any) => `"${c.title}"`).join(", ");
      throw new Error(
        `Mentor time conflict! This mentor already has ${conflictNames} scheduled at ${course.classTiming} on overlapping days during this date range. Please choose a different timing or different class days.`
      );
    }
  }

  // Also store inclusions_enabled if provided
  if (course.inclusionsEnabled) {
    (courseData as any).inclusions_enabled = course.inclusionsEnabled;
  }

  if (isNew) {
    const { error } = await supabase.from("courses").insert([courseData]);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("courses")
      .update(courseData)
      .eq("id", course.id);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteCourse(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function toggleCourseStatus(id: string, currentStatus: string) {
  const supabase = createAdminClient();
  const newStatus = currentStatus === "Active" ? "Draft" : "Active";
  const { error } = await supabase
    .from("courses")
    .update({ status: newStatus })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

// ----------------------------------------------------
// SESSIONS
// ----------------------------------------------------

export async function upsertSession(session: any) {
  const supabase = createAdminClient();

  // Resolve mentor
  let mentorId = await resolveMentorIdByName(session.mentor);
  if (!mentorId) {
    const { data } = await supabase.from("mentors").select("id").limit(1).single();
    mentorId = data?.id || null;
  }

  if (!mentorId) {
    throw new Error("No mentors available to assign to this session.");
  }

  const sessionData = {
    title: session.session_id ? session.title : (session.title || "Untitled Session"),
    description: session.description || "",
    mentor_id: mentorId,
    subject: session.subject,
    type: session.type,
    price: Number(session.price),
    class_level: session.classLevel || null,
    status: session.status,
    color_bg: session.colorBg || "#ede9fe",
    icon_name: session.iconName || "writing",
    about_session: session.aboutSession || "",
    whats_covered: session.whatsCovered || [],
    inclusions: session.inclusions || [],
    inclusions_enabled: session.inclusionsEnabled || [true, true, true, true, true],
    duration_options: session.durationOptions || "60 or 90 min",
    platform: session.platform || "Zoom",
    language: session.language || "English / Hindi",
    days: (session.days || "Mon – Sat").replace(/^Every\s+/i, ""),
    reschedule_policy: session.reschedulePolicy || "Up to 4 hrs before",
    session_date: session.isRepeatable ? null : (session.sessionDate || null),
    session_time: session.sessionTime || "",
    join_url: session.joinUrl || null,
    is_repeatable: session.isRepeatable || false,
  };

  const isNew = !session.id || session.id.startsWith("s-");

  if (isNew) {
    const { error } = await supabase.from("sessions").insert([sessionData]);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("sessions")
      .update(sessionData)
      .eq("id", session.id);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteSession(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function toggleSessionStatus(id: string, currentStatus: string) {
  const supabase = createAdminClient();
  const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
  const { error } = await supabase
    .from("sessions")
    .update({ status: newStatus })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

// ----------------------------------------------------
// MENTORS
// ----------------------------------------------------

export async function upsertMentor(mentor: any) {
  const supabase = createAdminClient();

  const isNew = !mentor.id || mentor.id.startsWith("m-");

  if (isNew) {
    const expertiseArray = mentor.subject
      ? mentor.subject.split("&").map((s: string) => s.trim())
      : ["Mathematics"];

    const { error } = await supabase
      .from("mentor_invitations")
      .insert([
        {
          email: mentor.email.trim().toLowerCase(),
          full_name: mentor.name,
          hourly_rate: Number(mentor.rate || 0.00),
          expertise: expertiseArray,
          qualification: mentor.qualification || "Educator",
          experience: Number(mentor.experience || 1),
          status: "pending"
        }
      ]);

    if (error) throw new Error(error.message);
  } else if (mentor.id.startsWith("inv-")) {
    const dbId = mentor.id.replace("inv-", "");

    const { error } = await supabase
      .from("mentor_invitations")
      .update({
        email: mentor.email.trim().toLowerCase(),
        full_name: mentor.name,
      })
      .eq("id", dbId);

    if (error) throw new Error(error.message);
  } else {
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ 
        full_name: mentor.name,
        email: mentor.email?.trim().toLowerCase()
      })
      .eq("id", mentor.id);

    if (profileErr) throw new Error(profileErr.message);

    const { error: mentorErr } = await supabase
      .from("mentors")
      .update({
        verified: mentor.verified,
      })
      .eq("id", mentor.id);

    if (mentorErr) throw new Error(mentorErr.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteMentor(id: string) {
  const adminClient = createAdminClient();
  if (id.startsWith("inv-")) {
    const dbId = id.replace("inv-", "");
    const { error } = await adminClient
      .from("mentor_invitations")
      .delete()
      .eq("id", dbId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await adminClient.auth.admin.deleteUser(id);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

// ----------------------------------------------------
// TESTIMONIALS
// ----------------------------------------------------

export async function upsertTestimonial(testimonial: any) {
  const supabase = createAdminClient();

  const init = (testimonial.studentName || "S")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const testiData = {
    student_name: testimonial.studentName,
    role: testimonial.role,
    quote: testimonial.quote,
    rating: Number(testimonial.rating),
    show_on_site: testimonial.showOnSite,
    avatar_bg: testimonial.avatarBg || "#1B3A6B",
    avatar_text: init,
  };

  const isNew = !testimonial.id || testimonial.id.startsWith("t-");

  if (isNew) {
    const { error } = await supabase.from("testimonials").insert([testiData]);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("testimonials")
      .update(testiData)
      .eq("id", testimonial.id);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteTestimonial(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function toggleTestimonialStatus(id: string, currentShow: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("testimonials")
    .update({ show_on_site: !currentShow })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

// ----------------------------------------------------
// CONTACT MESSAGES
// ----------------------------------------------------

export async function submitContactMessage(data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert([
    {
      full_name: data.fullName,
      email: data.email,
      subject: data.subject,
      phone: data.phone || null,
      message: data.message,
    },
  ]);

  if (error) throw new Error(error.message);
  return { success: true };
}

// ----------------------------------------------------
// MOCK DATA SYNCRONIZER
// ----------------------------------------------------

// Mock data for fallback / sync database
const INITIAL_HERO = {
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

const INITIAL_COURSES = [
  {
    title: "Advanced Calculus & Algebra",
    subject: "Mathematics",
    format: "Live batch",
    price: 4999,
    mentor: "Arjun Kapoor",
    students: 1240,
    rating: 4.9,
    status: "Active",
  },
  {
    title: "Python for Beginners",
    subject: "Programming",
    format: "Live batch",
    price: 3499,
    mentor: "Rahul Nair",
    students: 892,
    rating: 4.8,
    status: "Active",
  },
  {
    title: "Chemistry: Class 11 & 12",
    subject: "Science",
    format: "Live batch",
    price: 3999,
    mentor: "Sneha Mehta",
    students: 643,
    rating: 4.7,
    status: "Active",
  },
  {
    title: "English Essay Writing",
    subject: "English",
    format: "Recorded",
    price: 999,
    mentor: "Priya Sharma",
    students: 410,
    rating: 4.6,
    status: "Draft",
  },
  {
    title: "NEET Biology Crash Course",
    subject: "Science",
    format: "Live batch",
    price: 6499,
    mentor: "Sneha Mehta",
    students: 780,
    rating: 4.9,
    status: "Active",
  },
];

const INITIAL_SESSIONS = [
  {
    title: "English Essay Writing",
    mentor: "Priya Sharma",
    type: "1-on-1",
    description: "Improve essay structure, argumentation and grammar with live feedback and doubt-clearing.",
    bookings: 98,
    subject: "English",
    price: 399,
    status: "Active",
    colorBg: "#ede9fe",
    iconName: "writing",
  },
  {
    title: "Statistics & Probability",
    mentor: "Arjun Kapoor",
    type: "1-on-1",
    description: "Confidence intervals, hypothesis testing and data interpretation for JEE & board exams.",
    bookings: 115,
    subject: "Mathematics",
    price: 449,
    status: "Active",
    colorBg: "#dbeafe",
    iconName: "calculator",
  },
  {
    title: "Python Doubt-Solving",
    mentor: "Rahul Nair",
    type: "Group",
    description: "Live code reviews, debugging help and concept clarification for Python learners of all levels.",
    bookings: 203,
    subject: "Programming",
    price: 549,
    status: "Active",
    colorBg: "#dcfce7",
    iconName: "code",
  },
  {
    title: "Physics Problem-Solving",
    mentor: "Arjun Kapoor",
    type: "1-on-1",
    description: "Mechanics, electrostatics and optics problem-sets worked through in real time.",
    bookings: 154,
    subject: "Science",
    price: 499,
    status: "Inactive",
    colorBg: "#dbeafe",
    iconName: "science",
  },
  {
    title: "Chemistry Concept Clarification",
    mentor: "Sneha Mehta",
    type: "1-on-1",
    description: "Organic and inorganic chemistry explained simply for NEET and Class 12 students.",
    bookings: 86,
    subject: "Science",
    price: 449,
    status: "Active",
    colorBg: "#fef9c3",
    iconName: "flask",
  },
];

const INITIAL_MENTORS = [
  {
    name: "Arjun Kapoor",
    subject: "Maths & Physics",
    rating: 4.9,
    students: 420,
    courses: 12,
    rate: 499,
    verified: true,
    bio: "IIT Delhi graduate with 8 years of experience preparing students for JEE and NEET.",
    qualification: "IIT Delhi",
    experience: 8,
  },
  {
    name: "Priya Sharma",
    subject: "English & Lit.",
    rating: 4.8,
    students: 310,
    courses: 8,
    rate: 399,
    verified: true,
    bio: "MA English from Delhi University. Specialises in essay coaching and creative writing.",
    qualification: "MA English, DU",
    experience: 6,
  },
  {
    name: "Rahul Nair",
    subject: "Computer Science",
    rating: 5.0,
    students: 580,
    courses: 15,
    rate: 549,
    verified: true,
    bio: "Senior engineer at a top tech firm. Teaches Python, DSA, and web development.",
    qualification: "B.Tech CS, Senior Engineer",
    experience: 7,
  },
  {
    name: "Sneha Mehta",
    subject: "Chemistry & Bio",
    rating: 4.7,
    students: 270,
    courses: 9,
    rate: 449,
    verified: false,
    bio: "MBBS graduate with a passion for making science concepts simple and exam-ready.",
    qualification: "MBBS",
    experience: 5,
  },
  {
    name: "Vikram Khanna",
    subject: "Maths & Stats",
    rating: 4.9,
    students: 312,
    courses: 10,
    rate: 459,
    verified: true,
    bio: "Professional statistician and tutor specializing in exam preparation and data math.",
    qualification: "Actuary",
    experience: 9,
  },
];

const INITIAL_TESTIMONIALS = [
  {
    studentName: "Rohan Agarwal",
    role: "JEE Advanced 2024 — AIR 412",
    quote: "Tutoboard helped me crack JEE Advanced. Arjun sir's sessions were incredibly structured and the doubt-clearing was instant.",
    rating: 5,
    showOnSite: true,
    avatarBg: "#1B3A6B",
    avatarText: "RA",
  },
  {
    studentName: "Aisha Naik",
    role: "Class 12, CBSE Board 2024",
    quote: "I improved my English essay score from a C to an A in just 6 sessions. Priya ma'am really knows her craft.",
    rating: 5,
    showOnSite: true,
    avatarBg: "#993556",
    avatarText: "AN",
  },
  {
    studentName: "Karan Patel",
    role: "Placed at Google, 2025",
    quote: "Rahul sir made DSA feel like a breeze. Got placed at my dream company within 3 months of starting the course.",
    rating: 5,
    showOnSite: false,
    avatarBg: "#0F6E56",
    avatarText: "KP",
  },
  {
    studentName: "Maya Verma",
    role: "Class 10, ICSE 2024",
    quote: "The live math classes were amazing. I could ask questions directly and practice worksheets were really detailed.",
    rating: 4,
    showOnSite: true,
    avatarBg: "#534AB7",
    avatarText: "MV",
  },
];

export async function syncMockDataToBackend() {
  const supabase = createAdminClient();
  const adminClient = createAdminClient();

  // 1. Sync Hero Settings
  await updateHeroSettings(INITIAL_HERO);

  // 2. Sync Mentors
  const mentorNameMap: Record<string, string> = {};

  for (const m of INITIAL_MENTORS) {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("full_name", m.name)
      .eq("role", "mentor")
      .limit(1)
      .maybeSingle();

    let mentorId = existingProfile?.id;

    if (!mentorId) {
      const email = `${m.name.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now()}@tutoboard.com`;
      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password: "password123",
        email_confirm: true,
        user_metadata: {
          full_name: m.name,
          role: "mentor",
        },
      });

      if (authError || !authUser.user) {
        console.error("Failed to create auth user for mentor:", m.name, authError);
        continue;
      }
      mentorId = authUser.user.id;
    }

    mentorNameMap[m.name] = mentorId;

    await supabase.from("profiles").update({ full_name: m.name }).eq("id", mentorId);

    const expertiseArray = m.subject
      ? m.subject.split("&").map((s: string) => s.trim())
      : ["Mathematics"];

    await supabase
      .from("mentors")
      .update({
        bio: m.bio || "",
        expertise: expertiseArray,
        hourly_rate: Number(m.rate || 0),
        qualification: m.qualification || "Educator",
        experience: Number(m.experience || 1),
        verified: m.verified || false,
        is_active: true,
      })
      .eq("id", mentorId);
  }

  // 3. Sync Courses
  for (const c of INITIAL_COURSES) {
    let mentorId: string | null = mentorNameMap[c.mentor] || null;
    if (!mentorId) {
      mentorId = await resolveMentorIdByName(c.mentor);
    }

    const { data: existingCourse } = await supabase
      .from("courses")
      .select("id")
      .eq("title", c.title)
      .limit(1)
      .maybeSingle();

    const courseData = {
      title: c.title,
      description: `Structured course program in ${c.subject}.`,
      subject: c.subject,
      format: c.format,
      price: Number(c.price),
      mentor_id: mentorId,
      status: c.status,
      updated_at: new Date().toISOString(),
    };

    if (existingCourse) {
      await supabase.from("courses").update(courseData).eq("id", existingCourse.id);
    } else {
      await supabase.from("courses").insert([courseData]);
    }
  }

  // 4. Sync Sessions
  for (const s of INITIAL_SESSIONS) {
    let mentorId: string | null = mentorNameMap[s.mentor] || null;
    if (!mentorId) {
      mentorId = await resolveMentorIdByName(s.mentor);
    }

    if (!mentorId) continue;

    const { data: existingSession } = await supabase
      .from("sessions")
      .select("id")
      .eq("title", s.title)
      .limit(1)
      .maybeSingle();

    const sessionData = {
      title: s.title,
      description: s.description || "",
      mentor_id: mentorId,
      subject: s.subject,
      type: s.type,
      price: Number(s.price),
      status: s.status,
      color_bg: s.colorBg || "#ede9fe",
      icon_name: s.iconName || "writing",
    };

    if (existingSession) {
      await supabase.from("sessions").update(sessionData).eq("id", existingSession.id);
    } else {
      await supabase.from("sessions").insert([sessionData]);
    }
  }

  // 5. Sync Testimonials
  for (const t of INITIAL_TESTIMONIALS) {
    const { data: existingTesti } = await supabase
      .from("testimonials")
      .select("id")
      .eq("student_name", t.studentName)
      .limit(1)
      .maybeSingle();

    const testiData = {
      student_name: t.studentName,
      role: t.role,
      quote: t.quote,
      rating: Number(t.rating),
      show_on_site: t.showOnSite,
      avatar_bg: t.avatarBg,
      avatar_text: t.avatarText,
    };

    if (existingTesti) {
      await supabase.from("testimonials").update(testiData).eq("id", existingTesti.id);
    } else {
      await supabase.from("testimonials").insert([testiData]);
    }
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

// ----------------------------------------------------
// CHAT & MESSAGING
// ----------------------------------------------------

export async function getChatRooms() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Get chat room IDs where current user is a participant
  const { data: participations, error: partError } = await supabase
    .from("chat_participants")
    .select("chat_room_id")
    .eq("user_id", user.id);

  if (partError || !participations) return [];

  const roomIds = participations.map(p => p.chat_room_id);
  if (roomIds.length === 0) return [];

  // Fetch the chat rooms and their participants/messages
  const { data: rooms, error: roomsError } = await supabase
    .from("chat_rooms")
    .select(`
      id,
      name,
      created_at,
      chat_participants(
        user_id,
        profile:profiles(full_name, role, avatar_url)
      )
    `)
    .in("id", roomIds);

  if (roomsError) throw new Error(roomsError.message);

  return rooms || [];
}

export async function getMessages(chatRoomId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: messages, error } = await supabase
    .from("messages")
    .select(`
      id,
      chat_room_id,
      sender_id,
      content,
      file_url,
      created_at,
      sender:profiles(full_name, role, avatar_url)
    `)
    .eq("chat_room_id", chatRoomId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return messages || [];
}

export async function sendMessage(chatRoomId: string, content: string, fileUrl?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("messages")
    .insert([
      {
        chat_room_id: chatRoomId,
        sender_id: user.id,
        content,
        file_url: fileUrl || null,
      }
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getCoursesPageData() {
  noStore();
  const supabase = await createClient();
  const { data: dbCourses, error } = await supabase
    .from("courses")
    .select("*, mentor:mentors(profile:profiles(full_name))")
    .eq("status", "Active")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (dbCourses || []).map((c: any) => {
    const style = mapSubjectToStyle(c.subject);
    return {
      id: c.id,
      title: c.title,
      description: c.description || "",
      subject: c.subject,
      format: c.format,
      price: Number(c.price),
      mentor: c.mentor?.profile?.full_name || "Unknown Mentor",
      students: c.students_count,
      rating: Number(c.rating),
      status: c.status,
      colorBg: style.colorBg,
      iconName: style.iconName,
      coverImageUrl: c.cover_image_url || "",
      languages: c.languages || ["English"],
      class_level: c.class_level || "",
    };
  });
}

export async function getCourseDetails(id: string) {
  const adminClient = createAdminClient();

  // 1. Fetch Course details
  const { data: c, error } = await adminClient
    .from("courses")
    .select("*, mentor:mentors(profile:profiles(full_name, avatar_url, email), expertise, rating, qualification, experience, bio)")
    .eq("id", id)
    .single();

  if (error || !c) {
    throw new Error(error ? error.message : "Course not found");
  }

  // Fetch Course Units to dynamically construct curriculum
  const { data: dbUnits } = await adminClient
    .from("course_units")
    .select("id, title, duration_seconds, module_name")
    .eq("course_id", id)
    .order("order_index", { ascending: true });

  const dynamicCurriculum: any[] = [];
  if (dbUnits && dbUnits.length > 0) {
    const modulesMap: Record<string, { lessons: string[]; duration: number }> = {};
    const modulesList: string[] = [];

    dbUnits.forEach((u: any) => {
      const modName = u.module_name || "General Lessons";
      if (!modulesMap[modName]) {
        modulesMap[modName] = { lessons: [], duration: 0 };
        modulesList.push(modName);
      }
      modulesMap[modName].lessons.push(u.title);
      modulesMap[modName].duration += u.duration_seconds || 0;
    });

    modulesList.forEach((name) => {
      const { lessons, duration } = modulesMap[name];
      const hours = Math.floor(duration / 3600);
      const minutes = Math.round((duration % 3600) / 60);
      
      let metaStr = `${lessons.length} lesson${lessons.length === 1 ? "" : "s"}`;
      if (hours > 0) {
        metaStr += ` · ${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        metaStr += ` · ${minutes}m`;
      }

      dynamicCurriculum.push({
        name,
        meta: metaStr,
        lessons
      });
    });
  }

  const style = mapSubjectToStyle(c.subject);
  
  // Resolve initials for avatar fallback
  const mentorName = c.mentor?.profile?.full_name || "Unknown Mentor";
  const initials = mentorName.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();

  const courseMapped = {
    id: c.id,
    title: c.title,
    description: c.description || "",
    aboutCourse: c.about_course || "",
    subject: c.subject,
    format: c.format,
    price: Number(c.price),
    class_level: c.class_level || "",
    mentor: {
      id: c.mentor_id,
      name: mentorName,
      email: c.mentor?.profile?.email || "",
      avatarUrl: c.mentor?.profile?.avatar_url || "",
      avatarText: initials,
      expertise: c.mentor?.expertise ? c.mentor.expertise.join(" & ") : "Educator",
      rating: Number(c.mentor?.rating || 5.0),
      qualification: c.mentor?.qualification || "Educator",
      experience: c.mentor?.experience || 5,
      bio: c.mentor?.bio || "",
      students: c.students_count || 420,
    },
    students: c.students_count,
    rating: Number(c.rating),
    learningOutcomes: c.learning_outcomes || [],
    curriculum: dynamicCurriculum.length > 0 ? dynamicCurriculum : (c.curriculum || []),
    inclusions: c.inclusions || [],
    inclusionsEnabled: c.inclusions_enabled || [],
    batchStartDate: c.batch_start_date || "",
    batchEndDate: c.batch_end_date || "",
    classDays: c.class_days || "",
    classTiming: c.class_timing || "",
    durationDays: Number(c.duration_days || 30),
    totalSessions: Number(c.total_sessions || 10),
    sessionsPerWeek: Number(c.sessions_per_week || 2),
    coverImageUrl: c.cover_image_url || "",
    colorBg: style.colorBg,
    iconName: style.iconName,
    languages: c.languages || ["English"],
  };

  // 2. Fetch Related Courses (same category/subject, excluding current course)
  const { data: dbRelated } = await adminClient
    .from("courses")
    .select("*, mentor:mentors(profile:profiles(full_name))")
    .eq("status", "Active")
    .eq("subject", c.subject)
    .neq("id", id)
    .limit(3);

  let relatedMapped = (dbRelated || []).map((rc: any) => {
    const rStyle = mapSubjectToStyle(rc.subject);
    return {
      id: rc.id,
      title: rc.title,
      subject: rc.subject,
      format: rc.format,
      price: Number(rc.price),
      mentor: rc.mentor?.profile?.full_name || "Unknown Mentor",
      students: rc.students_count,
      rating: Number(rc.rating),
      colorBg: rStyle.colorBg,
      iconName: rStyle.iconName,
    };
  });

  // Safe fallback if not enough related courses in same subject
  if (relatedMapped.length < 3) {
    const { data: dbBackup } = await adminClient
      .from("courses")
      .select("*, mentor:mentors(profile:profiles(full_name))")
      .eq("status", "Active")
      .neq("id", id)
      .limit(3 - relatedMapped.length);

    const backupMapped = (dbBackup || []).map((rc: any) => {
      const rStyle = mapSubjectToStyle(rc.subject);
      return {
        id: rc.id,
        title: rc.title,
        subject: rc.subject,
        format: rc.format,
        price: Number(rc.price),
        mentor: rc.mentor?.profile?.full_name || "Unknown Mentor",
        students: rc.students_count,
        rating: Number(rc.rating),
        colorBg: rStyle.colorBg,
        iconName: rStyle.iconName,
      };
    });

    const merged = [...relatedMapped, ...backupMapped];
    const seen = new Set();
    relatedMapped = merged.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }).slice(0, 3);
  }

  return {
    course: courseMapped,
    related: relatedMapped,
  };
}

export async function uploadCourseCover(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const supabase = createAdminClient();

  // Ensure bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("Storage list error:", listError);
  }
  
  const bucketName = "course-covers";
  const bucketExists = buckets?.some(b => b.name === bucketName);

  if (!bucketExists) {
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    });
    if (createError) {
      console.warn("Storage bucket creation error or warning:", createError);
    }
  }

  // Upload file
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  
  const buffer = Buffer.from(await file.arrayBuffer());

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, buffer, {
      contentType: file.type,
      duplex: "half",
    } as any);

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  return { publicUrl };
}

export async function getSessionsPageData() {
  noStore();
  const supabase = await createClient();
  const { data: dbSessions, error } = await supabase
    .from("sessions")
    .select("*, mentor:mentors(profile:profiles(full_name, avatar_url))")
    .eq("status", "Active")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (dbSessions || []).map((s: any) => {
    const name = s.mentor?.profile?.full_name || "Unknown Mentor";
    const init = name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();
    return {
      id: s.id,
      title: s.title,
      description: s.description || "",
      mentor: name,
      mentorAvatar: init,
      mentorColor: s.color_bg || "#1B3A6B",
      type: s.type,
      bookings: s.bookings_count,
      subject: s.subject,
      price: Number(s.price),
      status: s.status,
      colorBg: s.color_bg || "#ede9fe",
      iconName: s.icon_name || "writing",
      class_level: s.class_level || "",
    };
  });
}

export async function getSessionDetails(id: string) {
  const supabase = await createClient();

  // 1. Fetch Session details
  const { data: s, error } = await supabase
    .from("sessions")
    .select("*, mentor:mentors(profile:profiles(full_name, avatar_url, email), expertise, rating, qualification, experience, bio)")
    .eq("id", id)
    .single();

  if (error || !s) {
    throw new Error(error ? error.message : "Session not found");
  }

  // Resolve initials for avatar fallback
  const mentorName = s.mentor?.profile?.full_name || "Unknown Mentor";
  const initials = mentorName.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();

  const sessionMapped = {
    id: s.id,
    title: s.title,
    description: s.description || "",
    subject: s.subject,
    type: s.type,
    price: Number(s.price),
    bookings: s.bookings_count,
    colorBg: s.color_bg || "#ede9fe",
    iconName: s.icon_name || "writing",
    class_level: s.class_level || "",
    aboutSession: s.about_session || "",
    whatsCovered: s.whats_covered || [],
    inclusions: s.inclusions || [],
    inclusionsEnabled: s.inclusions_enabled || [],
    durationOptions: s.duration_options || "60 or 90 min",
    platform: s.platform || "Zoom",
    language: s.language || "English / Hindi",
    days: (s.days || "").replace(/^Every\s+/i, ""),
    reschedulePolicy: s.reschedule_policy || "Up to 4 hrs before",
    sessionDate: s.session_date || "",
    sessionTime: s.session_time || "",
    isRepeatable: s.is_repeatable || false,
    mentor: {
      id: s.mentor_id,
      name: mentorName,
      email: s.mentor?.profile?.email || "",
      avatarUrl: s.mentor?.profile?.avatar_url || "",
      avatarText: initials,
      expertise: s.mentor?.expertise ? s.mentor.expertise.join(" & ") : "Educator",
      rating: Number(s.mentor?.rating || 5.0),
      qualification: s.mentor?.qualification || "Educator",
      experience: s.mentor?.experience || 5,
      bio: s.mentor?.bio || "",
    },
  };

  // 2. Fetch Related Sessions (same subject, excluding current session)
  const { data: dbRelated } = await supabase
    .from("sessions")
    .select("*, mentor:mentors(profile:profiles(full_name))")
    .eq("status", "Active")
    .eq("subject", s.subject)
    .neq("id", id)
    .limit(3);

  let relatedMapped = (dbRelated || []).map((rs: any) => {
    return {
      id: rs.id,
      title: rs.title,
      subject: rs.subject,
      type: rs.type,
      price: Number(rs.price),
      mentor: rs.mentor?.profile?.full_name || "Unknown Mentor",
      bookings: rs.bookings_count,
      colorBg: rs.color_bg || "#ede9fe",
      iconName: rs.icon_name || "writing",
    };
  });

  // Safe fallback if not enough related sessions in same subject
  if (relatedMapped.length < 3) {
    const { data: dbBackup } = await supabase
      .from("sessions")
      .select("*, mentor:mentors(profile:profiles(full_name))")
      .eq("status", "Active")
      .neq("id", id)
      .limit(3 - relatedMapped.length);

    const backupMapped = (dbBackup || []).map((rs: any) => {
      return {
        id: rs.id,
        title: rs.title,
        subject: rs.subject,
        type: rs.type,
        price: Number(rs.price),
        mentor: rs.mentor?.profile?.full_name || "Unknown Mentor",
        bookings: rs.bookings_count,
        colorBg: rs.color_bg || "#ede9fe",
        iconName: rs.icon_name || "writing",
      };
    });

    const merged = [...relatedMapped, ...backupMapped];
    const seen = new Set();
    relatedMapped = merged.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }).slice(0, 3);
  }

  return {
    session: sessionMapped,
    related: relatedMapped,
  };
}

export async function getMentorsPageData() {
  const supabase = await createClient();

  const { data: dbMentors, error } = await supabase
    .from("mentors")
    .select("*, profile:profiles(full_name, avatar_url, email)")
    .eq("is_active", true)
    .order("rating", { ascending: false });

  if (error) throw new Error(error.message);

  return (dbMentors || [])
    .filter((m: any) => {
      const hasBio = m.bio && m.bio.trim() !== "" && m.bio !== "Biography...";
      const hasExpertise = m.expertise && m.expertise.length > 0;
      const hasRate = m.hourly_rate && Number(m.hourly_rate) > 0;
      const hasQual = m.qualification && m.qualification.trim() !== "" && m.qualification !== "Educator";
      const hasExp = m.experience && Number(m.experience) > 0;
      return hasBio && hasExpertise && hasRate && hasQual && hasExp;
    })
    .map((m: any) => {
      const name = m.profile?.full_name || "Unknown Mentor";
      const init = name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();
      return {
        id: m.id,
        name,
        expertise: m.expertise || [],
        subject: (m.expertise || []).join(" & "),
        rating: Number(m.rating),
        students: 420,
        courses: 10,
        rate: Number(m.hourly_rate),
        verified: m.verified || false,
        avatarText: init,
        avatarBg: "#1B3A6B",
        qualification: m.qualification || "Educator",
        experience: m.experience || 5,
        bio: m.bio || "",
      };
    });
}

export async function getMentorDetailsData(mentorId: string) {
  const supabase = await createClient();

  // 1. Fetch Mentor Profile
  const { data: m, error } = await supabase
    .from("mentors")
    .select("*, profile:profiles(full_name, avatar_url, email)")
    .eq("id", mentorId)
    .single();

  if (error || !m) {
    throw new Error(error ? error.message : "Mentor not found");
  }

  const name = m.profile?.full_name || "Unknown Mentor";
  const init = name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();
  const mentorMapped = {
    id: m.id,
    name,
    email: m.profile?.email || "",
    expertise: m.expertise || [],
    subject: (m.expertise || []).join(" & "),
    rating: Number(m.rating),
    students: 420,
    courses: 10,
    rate: Number(m.hourly_rate),
    verified: m.verified || false,
    avatarText: init,
    avatarBg: "#1B3A6B",
    qualification: m.qualification || "Educator",
    experience: m.experience || 5,
    bio: m.bio || "",
    availability: m.availability || {},
  };

  // 2. Fetch Mentor Courses
  const { data: dbCourses } = await supabase
    .from("courses")
    .select("*, mentor:mentors(profile:profiles(full_name))")
    .eq("mentor_id", mentorId)
    .eq("status", "Active")
    .order("created_at", { ascending: false });

  const coursesMapped = (dbCourses || []).map((c: any) => {
    const style = mapSubjectToStyle(c.subject);
    return {
      id: c.id,
      title: c.title,
      description: c.description || "",
      subject: c.subject,
      format: c.format,
      price: Number(c.price),
      mentor: c.mentor?.profile?.full_name || "Unknown Mentor",
      students: c.students_count,
      rating: Number(c.rating),
      status: c.status,
      colorBg: style.colorBg,
      iconName: style.iconName,
    };
  });

  // 3. Fetch Mentor Sessions
  const { data: dbSessions } = await supabase
    .from("sessions")
    .select("*, mentor:mentors(profile:profiles(full_name, avatar_url))")
    .eq("mentor_id", mentorId)
    .eq("status", "Active")
    .order("created_at", { ascending: false });

  const sessionsMapped = (dbSessions || []).map((s: any) => {
    const name = s.mentor?.profile?.full_name || "Unknown Mentor";
    const init = name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();
    return {
      id: s.id,
      title: s.title,
      description: s.description || "",
      mentor: name,
      mentorAvatar: init,
      mentorColor: s.color_bg || "#1B3A6B",
      type: s.type,
      bookings: s.bookings_count,
      subject: s.subject,
      price: Number(s.price),
      status: s.status,
      colorBg: s.color_bg || "#ede9fe",
      iconName: s.icon_name || "writing",
    };
  });

  // 4. Fetch Mentor Scheduled Classes
  const { data: dbClasses } = await supabase
    .from("scheduled_classes")
    .select(`
      id, 
      title, 
      scheduled_at, 
      duration_minutes,
      student:students(profile:profiles(full_name)),
      booking:bookings(
        id,
        course_id,
        session_id,
        course:courses(title, format),
        session:sessions(title, type)
      )
    `)
    .eq("mentor_id", mentorId);

  const classesMapped = (dbClasses || []).map((cls: any) => {
    const studentName = cls.student?.profile?.full_name || "Unknown Student";
    let bookingType = "1-on-1 Session";
    let itemName = cls.title;

    if (cls.booking) {
      if (cls.booking.course) {
        bookingType = `Course (${cls.booking.course.format || "Live batch"})`;
        itemName = cls.booking.course.title || cls.title;
      } else if (cls.booking.session) {
        bookingType = `Session (${cls.booking.session.type || "1-on-1"})`;
        itemName = cls.booking.session.title || cls.title;
      }
    }

    return {
      id: cls.id,
      title: cls.title,
      itemName,
      bookingType,
      studentName,
      scheduledAt: cls.scheduled_at,
      durationMinutes: cls.duration_minutes || 60,
    };
  });

  return {
    mentor: mentorMapped,
    courses: coursesMapped,
    sessions: sessionsMapped,
    scheduledClasses: classesMapped,
  };
}

// ----------------------------------------------------
// PARENT DASHBOARD ACTIONS
// ----------------------------------------------------

export async function getParentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("*, parents(*)")
    .eq("id", user.id)
    .single();

  if (profileErr) throw new Error(profileErr.message);

  return {
    id: profile.id,
    email: profile.email,
    name: profile.full_name,
    avatarUrl: profile.avatar_url || "",
    role: profile.role,
    phone: profile.parents?.phone || "",
    address: profile.parents?.address || "",
    twoFactorEnabled: profile.parents?.two_factor_enabled || false,
    notificationPreferences: profile.parents?.notification_preferences || {
      booking_confirmations: true,
      class_reminders: true,
      assignment_updates: true,
      mentor_messages: true,
      offers_promotions: false
    },
    createdAt: profile.created_at,
    emailConfirmedAt: user.email_confirmed_at || null,
  };
}

export async function updateParentProfile(data: { name: string; phone: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ full_name: data.name })
    .eq("id", user.id);

  if (profileErr) throw new Error(profileErr.message);

  const { error: parentErr } = await supabase
    .from("parents")
    .update({ phone: data.phone })
    .eq("id", user.id);

  if (parentErr) throw new Error(parentErr.message);

  revalidatePath("/profile");
  return { success: true };
}

export async function updateParentSecurityAndNotifications(data: {
  twoFactorEnabled?: boolean;
  notificationPreferences?: any;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const updatePayload: any = {};
  if (data.twoFactorEnabled !== undefined) {
    updatePayload.two_factor_enabled = data.twoFactorEnabled;
  }
  if (data.notificationPreferences !== undefined) {
    updatePayload.notification_preferences = data.notificationPreferences;
  }

  const { error } = await supabase
    .from("parents")
    .update(updatePayload)
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/profile");
  return { success: true };
}

export async function updateParentPassword(password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getParentChildren() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Fetch active students — graceful fallback if RLS blocks
  const { data: dbStudents } = await supabase
    .from("students")
    .select("*, profile:profiles(full_name, email, avatar_url)")
    .eq("parent_id", user.id);

  const students = ((dbStudents || []) as any[]).map((s: any) => {
    const name = s.profile?.full_name || "Child User";
    const initials = name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();
    return {
      id: s.id,
      name,
      email: s.profile?.email || "",
      grade: s.grade_level || "Not Specified",
      school: s.school_name || "",
      avatarText: initials,
      joined: true,
      attendance: null,
      recentActivity: []
    };
  });

  // 2. Fetch pending student invitations — graceful fallback if RLS blocks
  const { data: dbInvites } = await supabase
    .from("student_invitations")
    .select("*")
    .eq("parent_id", user.id)
    .neq("status", "accepted");

  const invitations = ((dbInvites || []) as any[]).map((i: any) => {
    const name = i.full_name;
    const initials = name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();
    return {
      id: i.id,
      name,
      email: i.email,
      grade: i.grade_level || "Not Specified",
      school: i.school_name || "",
      avatarText: initials,
      joined: false,
      status: i.status,
      attendance: null,
      recentActivity: []
    };
  });

  return [...students, ...invitations];
}

export async function inviteChild(data: {
  name: string;
  email: string;
  grade: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const emailLower = data.email.trim().toLowerCase();
  const adminClient = createAdminClient();

  // 1. Check if email is already in profiles (any registered account)
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("email")
    .eq("email", emailLower)
    .maybeSingle();

  if (existingProfile) {
    throw new Error("This email is already in use by another user.");
  }

  // 2. Check if email is already in student_invitations (pending/invited)
  const { data: existingInvite } = await adminClient
    .from("student_invitations")
    .select("email")
    .eq("email", emailLower)
    .neq("status", "accepted")
    .maybeSingle();

  if (existingInvite) {
    throw new Error("This child email has already been added.");
  }

  const { error } = await supabase
    .from("student_invitations")
    .insert([
      {
        parent_id: user.id,
        email: emailLower,
        full_name: data.name,
        grade_level: data.grade,
        status: "pending"
      }
    ]);

  if (error) throw new Error(error.message);

  // 3. Auto-register a shadow auth account for the child so they are immediately active and bookable
  const prefix = emailLower.split('@')[0];
  const password = `${prefix}123`;

  try {
    await adminClient.auth.admin.createUser({
      email: emailLower,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: data.name,
        role: "student"
      }
    });
  } catch (authError: any) {
    console.error("Shadow auth creation failed for child:", authError.message);
  }

  revalidatePath("/my-children");
  return { success: true };
}

export async function deleteChild(childId: string, isInvitation: boolean) {
  const supabase = createAdminClient(); // Use admin client to allow user cascading / deletion
  
  if (isInvitation) {
    const { error } = await supabase
      .from("student_invitations")
      .delete()
      .eq("id", childId);

    if (error) throw new Error(error.message);
  } else {
    // Delete the student's auth user which cascades to profiles, students, etc.
    const { error } = await supabase.auth.admin.deleteUser(childId);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/my-children");
  return { success: true };
}

export async function resendChildInvitation(invitationId: string) {
  const supabase = await createClient();
  // Simulated resend: update created_at timestamp
  const { error } = await supabase
    .from("student_invitations")
    .update({ created_at: new Date().toISOString() })
    .eq("id", invitationId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getParentBookings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Fetch all bookings for this parent
  const { data: dbBookings, error } = await supabase
    .from("bookings")
    .select(`
      id,
      status,
      payment_status,
      amount_paid,
      student_id,
      session_id,
      course_id,
      created_at,
      student:students(profile:profiles(full_name)),
      session:sessions(title, type, price, subject, color_bg, icon_name, mentor:mentors(profile:profiles(full_name))),
      course:courses(title, format, price, subject, batch_start_date, batch_end_date, duration_days, mentor:mentors(profile:profiles(full_name)))
    `)
    .eq("parent_id", user.id);

  if (error) throw new Error(error.message);

  return (dbBookings || []).map((b: any) => {
    const childName = b.student?.profile?.full_name || "Unknown Child";
    const childInitials = childName.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();

    const isCourse = !!b.course_id;
    const target = isCourse ? b.course : b.session;

    const mentorName = target?.mentor?.profile?.full_name || "Unknown Mentor";

    let dateTimeStr = "";
    let durationStr = "";

    if (!isCourse) {
      dateTimeStr = "Wed, 18 Jun · 9:00 AM";
      durationStr = "60 min";
    } else {
      const format = target?.format || "Live batch";
      if (format === "Recorded") {
        dateTimeStr = "Enrolled · Self-paced";
        durationStr = "Lifetime Access";
      } else {
        const durationDays = target?.duration_days ? Number(target.duration_days) : 0;
        const durationWeeks = durationDays > 0 ? Math.ceil(durationDays / 7) : 8;
        dateTimeStr = `Enrolled · ${durationWeeks} weeks`;

        if (target?.batch_start_date) {
          try {
            const start = new Date(target.batch_start_date);
            const now = new Date();
            const diffMs = now.getTime() - start.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const currentWeek = Math.max(1, Math.ceil((diffDays + 1) / 7));
            if (currentWeek <= durationWeeks) {
              durationStr = `Week ${currentWeek} of ${durationWeeks}`;
            } else {
              durationStr = "Completed";
            }
          } catch (e) {
            durationStr = `Week 1 of ${durationWeeks}`;
          }
        } else {
          durationStr = `Week 1 of ${durationWeeks}`;
        }
      }
    }

    return {
      id: b.id,
      studentId: b.student_id,
      childName,
      childInitials,
      title: target?.title || "Untitled",
      subject: target?.subject || "Subject",
      type: isCourse ? "Course" : (target?.type || "Session"),
      format: isCourse ? (target?.format || "Live batch") : (target?.type || "1-on-1"),
      mentorName,
      price: Number(b.amount_paid || target?.price || 0),
      status: b.status, // pending, confirmed, cancelled, completed
      colorBg: !isCourse ? (target?.color_bg || "#ede9fe") : (target?.subject === "Programming" ? "#dcfce7" : target?.subject === "Mathematics" ? "#dbeafe" : target?.subject === "Science" ? "#fef9c3" : "#ede9fe"),
      iconName: !isCourse ? (target?.icon_name || "writing") : (target?.subject === "Programming" ? "code" : target?.subject === "Mathematics" ? "math" : target?.subject === "Science" ? "flask" : "book"),
      dateTime: dateTimeStr,
      duration: durationStr,
      batchStartDate: isCourse ? target?.batch_start_date : null,
      batchEndDate: isCourse ? target?.batch_end_date : null,
      durationDays: isCourse ? target?.duration_days : null,
      createdAt: b.created_at,
    };
  });
}

// ----------------------------------------------------
// PARENT DASHBOARD — PAGE-LEVEL ACTIONS
// ----------------------------------------------------

export async function getChildOverviewStats(childId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: dbBookings } = await supabase
    .from("bookings")
    .select(`
      id, status, payment_status, amount_paid, student_id, session_id, course_id,
      session:sessions(title, subject, icon_name, mentor:mentors(profile:profiles(full_name))),
      course:courses(title, subject, mentor:mentors(profile:profiles(full_name)))
    `)
    .eq("student_id", childId)
    .neq("status", "cancelled");

  const bookings = (dbBookings || []) as any[];
  const activeCourses = bookings.filter((b: any) => !!b.course_id && b.status === "confirmed").length;
  const activeSessions = bookings.filter((b: any) => !!b.session_id && b.status === "confirmed").length;

  const { data: dbAttendance } = await supabase
    .from("attendance_records")
    .select("id, status, session_date, subject")
    .eq("student_id", childId);

  const attendance = (dbAttendance || []) as any[];
  const totalClasses = attendance.length;
  const attendedClasses = attendance.filter((a: any) => a.status === "present").length;
  const attendanceRate = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : null;

  const subjectMap: Record<string, { total: number; present: number }> = {};
  for (const rec of attendance) {
    const s: string = rec.subject || "General";
    if (!subjectMap[s]) subjectMap[s] = { total: 0, present: 0 };
    subjectMap[s].total++;
    if (rec.status === "present") subjectMap[s].present++;
  }
  const subjectAttendance = Object.entries(subjectMap).map(([name, v]) => ({
    name,
    pct: Math.round((v.present / v.total) * 100),
  }));

  const { data: dbUpcoming } = await supabase
    .from("scheduled_classes")
    .select("*, mentor:mentors(profile:profiles(full_name))")
    .eq("student_id", childId)
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(1);

  const firstUpcoming = (dbUpcoming as any[])?.[0] ?? null;
  const upcomingClass = firstUpcoming
    ? {
        title: firstUpcoming.title as string,
        subject: firstUpcoming.subject as string,
        mentor: (firstUpcoming.mentor as any)?.profile?.full_name as string || "Mentor",
        dateTime: new Date(firstUpcoming.scheduled_at as string).toLocaleString("en-IN", {
          weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
        }),
        iconName: (firstUpcoming.icon_name as string) || "book",
        joinUrl: (firstUpcoming.join_url as string | null),
      }
    : null;

  const { data: dbAssignments } = await supabase
    .from("assignments")
    .select("id, title, subject, due_date, status")
    .eq("student_id", childId)
    .neq("status", "graded");

  const assignments = (dbAssignments || []) as any[];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pendingAssignments = assignments.filter((a: any) => a.status !== "submitted" && a.status !== "graded");
  const overdueAssignments = pendingAssignments.filter(
    (a: any) => a.due_date && new Date(a.due_date) < today
  );

  const recentActivity: { text: string; time: string; type: string }[] = [];
  const recentAttendance = [...attendance]
    .sort((a: any, b: any) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())
    .slice(0, 3);
  for (const rec of recentAttendance as any[]) {
    recentActivity.push({
      text: `${rec.status === "present" ? "Attended" : "Missed"} ${rec.subject as string} session`,
      time: new Date(rec.session_date as string).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" }),
      type: rec.status === "present" ? "attended" : "missed",
    });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thisMonthRecords = attendance.filter((r: any) => new Date(r.session_date as string) >= thirtyDaysAgo);

  return {
    activeCourses,
    activeSessions,
    totalEnrolled: activeCourses + activeSessions,
    attendanceRate,
    attendedClasses,
    totalClasses,
    thisMonthAttended: thisMonthRecords.filter((r: any) => r.status === "present").length,
    thisMonthTotal: thisMonthRecords.length,
    subjectAttendance,
    upcomingClass,
    pendingAssignmentsCount: pendingAssignments.length,
    overdueAssignmentsCount: overdueAssignments.length,
    recentActivity,
  };
}

export async function getChildScheduledClasses(childId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: dbClasses, error } = await supabase
    .from("scheduled_classes")
    .select("*, mentor:mentors(profile:profiles(full_name))")
    .eq("student_id", childId)
    .order("scheduled_at", { ascending: true });

  if (error) throw new Error(error.message);

  return ((dbClasses || []) as any[]).map((c: any) => ({
    id: c.id as string,
    title: c.title as string,
    subject: c.subject as string,
    mentor: (c.mentor as any)?.profile?.full_name as string || "Unknown Mentor",
    scheduledAt: c.scheduled_at as string,
    dateTime: new Date(c.scheduled_at as string).toLocaleString("en-IN", {
      weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    }),
    durationMinutes: c.duration_minutes as number,
    status: c.status as string,
    joinUrl: (c.join_url as string | null),
    iconName: (c.icon_name as string) || "book",
  }));
}

export async function getChildAttendance(childId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: dbRecords, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("student_id", childId)
    .order("session_date", { ascending: false });

  if (error) throw new Error(error.message);

  const records = (dbRecords || []) as any[];
  const totalClasses = records.length;
  const attendedClasses = records.filter((r: any) => r.status === "present").length;
  const attendanceRate = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : null;

  const subjectMap: Record<string, { total: number; present: number }> = {};
  for (const rec of records) {
    const s: string = (rec.subject as string) || "General";
    if (!subjectMap[s]) subjectMap[s] = { total: 0, present: 0 };
    subjectMap[s].total++;
    if (rec.status === "present") subjectMap[s].present++;
  }
  const subjectBreakdown = Object.entries(subjectMap).map(([name, v]) => ({
    name,
    attended: v.present,
    total: v.total,
    pct: Math.round((v.present / v.total) * 100),
  }));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thisMonthRecords = records.filter((r: any) => new Date(r.session_date as string) >= thirtyDaysAgo);

  return {
    attendanceRate,
    attendedClasses,
    totalClasses,
    thisMonthAttended: thisMonthRecords.filter((r: any) => r.status === "present").length,
    thisMonthTotal: thisMonthRecords.length,
    subjectBreakdown,
    records: records.map((r: any) => ({
      id: r.id as string,
      date: r.session_date as string,
      subject: r.subject as string,
      status: r.status as string,
      notes: (r.notes as string) || "",
    })),
  };
}

export async function getChildAssignments(childId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: dbAssignments, error } = await supabase
    .from("assignments")
    .select("*, mentor:mentors(profile:profiles(full_name))")
    .eq("student_id", childId)
    .order("due_date", { ascending: true });

  if (error) throw new Error(error.message);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return ((dbAssignments || []) as any[]).map((a: any) => {
    let status = a.status as string;
    if (status === "pending" && a.due_date && new Date(a.due_date as string) < today) {
      status = "overdue";
    }
    const dueDate = a.due_date ? new Date(a.due_date as string) : null;
    const dueMeta = dueDate
      ? status === "overdue"
        ? `was due ${dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
        : `due ${dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
      : "No deadline";

    return {
      id: a.id as string,
      title: a.title as string,
      subject: a.subject as string,
      status: status.charAt(0).toUpperCase() + status.slice(1),
      dueMeta,
      score: a.score as number | null,
      feedback: (a.feedback as string) || "",
      mentor: (a.mentor as any)?.profile?.full_name as string || "Mentor",
    };
  });
}

export async function getChildEnrolledMentors(childId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: dbBookings, error } = await supabase
    .from("bookings")
    .select(`
      id, session_id, course_id, status,
      session:sessions(title, subject, icon_name, mentor:mentors(id, profile:profiles(full_name, avatar_url))),
      course:courses(title, subject, mentor:mentors(id, profile:profiles(full_name, avatar_url)))
    `)
    .eq("student_id", childId)
    .eq("status", "confirmed");

  if (error) throw new Error(error.message);

  const mentorMap: Record<string, { id: string; name: string; subject: string; initials: string }> = {};

  for (const b of ((dbBookings || []) as any[])) {
    const target = b.session_id ? b.session : b.course;
    if (!target?.mentor) continue;

    const mentorId = target.mentor.id as string;
    const mentorName = (target.mentor.profile?.full_name as string) || "Unknown Mentor";
    const subject = (target.subject as string) || "Tutoring";

    if (!mentorMap[mentorId]) {
      const initials = mentorName
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

      mentorMap[mentorId] = { id: mentorId, name: mentorName, subject, initials };
    }
  }

  return Object.values(mentorMap);
}

// ============================================================
// STUDENT DASHBOARD ACTIONS
// ============================================================

export async function getStudentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url")
    .eq("id", user.id)
    .single();

  const { data: student } = await supabase
    .from("students")
    .select("grade_level, school_name, interests")
    .eq("id", user.id)
    .single();

  return {
    id: profile?.id ?? user.id,
    name: profile?.full_name ?? "Student",
    email: profile?.email ?? user.email ?? "",
    role: profile?.role ?? "student",
    avatarText: (profile?.full_name ?? "S")
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase(),
    gradeLevel: (student as any)?.grade_level ?? null,
    schoolName: (student as any)?.school_name ?? null,
  };
}

export async function getStudentOverviewStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const studentId = user.id;

  // Attendance
  const { data: attRows } = await supabase
    .from("attendance_records")
    .select("status, session_date, subject")
    .eq("student_id", studentId)
    .order("session_date", { ascending: false });

  const allAtt = (attRows || []) as any[];
  const totalAtt = allAtt.length;
  const presentAtt = allAtt.filter((r) => r.status === "present").length;
  const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : null;

  // Subject attendance breakdown
  const subjMap: Record<string, { present: number; total: number }> = {};
  for (const r of allAtt) {
    if (!subjMap[r.subject]) subjMap[r.subject] = { present: 0, total: 0 };
    subjMap[r.subject].total++;
    if (r.status === "present") subjMap[r.subject].present++;
  }
  const subjectAttendance = Object.entries(subjMap).map(([name, v]) => ({
    name,
    pct: Math.round((v.present / v.total) * 100),
  }));

  // Next class
  const now = new Date().toISOString();
  const { data: nextClassRows } = await supabase
    .from("scheduled_classes")
    .select("id, title, subject, scheduled_at, duration_minutes, join_url, mentor:mentors(profile:profiles(full_name))")
    .eq("student_id", studentId)
    .eq("status", "scheduled")
    .gte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(1);

  const nc = (nextClassRows || [])[0] as any;
  const nextClass = nc
    ? {
        id: nc.id,
        title: nc.title,
        subject: nc.subject,
        mentor: nc.mentor?.profile?.full_name ?? "Mentor",
        scheduledAt: nc.scheduled_at,
        dateTime: new Date(nc.scheduled_at).toLocaleString("en-IN", {
          weekday: "short", day: "numeric", month: "short",
          hour: "2-digit", minute: "2-digit",
        }),
        joinUrl: nc.join_url ?? null,
        durationMinutes: nc.duration_minutes,
      }
    : null;

  // Today's classes
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: todayRows } = await supabase
    .from("scheduled_classes")
    .select("id, title, subject, scheduled_at, duration_minutes, join_url, status, mentor:mentors(profile:profiles(full_name))")
    .eq("student_id", studentId)
    .gte("scheduled_at", todayStart.toISOString())
    .lte("scheduled_at", todayEnd.toISOString())
    .order("scheduled_at", { ascending: true });

  const todayClasses = ((todayRows || []) as any[]).map((c) => ({
    id: c.id,
    title: c.title,
    subject: c.subject,
    mentor: c.mentor?.profile?.full_name ?? "Mentor",
    scheduledAt: c.scheduled_at,
    timeLabel: new Date(c.scheduled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    joinUrl: c.join_url ?? null,
    durationMinutes: c.duration_minutes,
    status: c.status,
  }));

  // Pending assignments
  const { data: assignRows } = await supabase
    .from("assignments")
    .select("id, title, subject, due_date, status, score, feedback, created_by, mentor:mentors(profile:profiles(full_name))")
    .eq("student_id", studentId);

  const allAssign = (assignRows || []) as any[];
  const now2 = new Date();
  const pendingAssignments = allAssign
    .filter((a) => a.status === "pending" || a.status === "overdue")
    .map((a) => {
      const due = a.due_date ? new Date(a.due_date) : null;
      const isOverdue = due && due < now2;
      return {
        id: a.id,
        title: a.title,
        subject: a.subject,
        status: isOverdue ? "Overdue" : "Pending",
        dueMeta: due
          ? isOverdue
            ? `was due ${due.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
            : `due ${due.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
          : "No due date",
        mentor: a.mentor?.profile?.full_name ?? "Mentor",
      };
    });

  const overdueCount = pendingAssignments.filter((a) => a.status === "Overdue").length;

  // Recent activity (last 5 attendance records)
  const recentActivity = allAtt.slice(0, 5).map((r) => ({
    type: "attendance",
    text: `${r.status === "present" ? "Attended" : "Missed"} class`,
    subject: r.subject,
    date: new Date(r.session_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    status: r.status,
  }));

  return {
    attendanceRate,
    subjectAttendance,
    nextClass,
    todayClasses,
    pendingAssignments,
    overdueCount,
    recentActivity,
    totalClassesToday: todayClasses.length,
    pendingCount: pendingAssignments.length,
  };
}

export async function getStudentClasses() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const studentId = user.id;
  const now = new Date();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

  const { data: rows } = await supabase
    .from("scheduled_classes")
    .select("id, title, subject, scheduled_at, duration_minutes, status, join_url, recording_url, icon_name, mentor:mentors(id, profile:profiles(full_name))")
    .eq("student_id", studentId)
    .order("scheduled_at", { ascending: false });

  const classes = (rows || []).map((c: any) => {
    const scheduledAt = new Date(c.scheduled_at);
    const endAt = new Date(scheduledAt.getTime() + c.duration_minutes * 60000);
    const isNow = scheduledAt <= now && now <= endAt;
    const isPast = endAt < now;
    const isToday = scheduledAt >= todayStart && scheduledAt <= todayEnd;

    const mentorObj = Array.isArray(c.mentor) ? c.mentor[0] : c.mentor;
    const mentorProfile = mentorObj ? (Array.isArray(mentorObj.profile) ? mentorObj.profile[0] : mentorObj.profile) : null;

    return {
      id: c.id,
      title: c.title,
      subject: c.subject,
      mentor: mentorProfile?.full_name ?? "Mentor",
      scheduledAt: c.scheduled_at,
      dateLabel: scheduledAt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
      timeLabel: `${scheduledAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} – ${endAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
      durationMinutes: c.duration_minutes,
      status: isNow ? "live" : c.status,
      joinUrl: c.join_url ?? null,
      recordingUrl: c.recording_url ?? null,
      iconName: c.icon_name ?? null,
      isToday,
      isUpcoming: !isPast && !isNow && !isToday,
      isPast: isPast && !isNow,
      isLive: isNow,
    };
  });

  return {
    today: classes.filter((c) => c.isToday || c.isLive),
    upcoming: classes.filter((c) => c.isUpcoming),
    recorded: classes.filter((c) => c.isPast && c.recordingUrl),
    history: classes.filter((c) => c.isPast),
  };
}

export async function getStudentAssignments() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const studentId = user.id;
  const now = new Date();

  const { data: rows } = await supabase
    .from("assignments")
    .select("id, title, subject, due_date, status, score, feedback, created_at, mentor:mentors(id, profile:profiles(full_name))")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  return ((rows || []) as any[]).map((a) => {
    const due = a.due_date ? new Date(a.due_date) : null;
    const isOverdue = a.status === "pending" && due && due < now;
    const computedStatus = isOverdue ? "Overdue" : 
      a.status === "pending" ? "Pending" :
      a.status === "submitted" ? "Submitted" :
      a.status === "graded" ? "Graded" : "Pending";
    return {
      id: a.id,
      title: a.title,
      subject: a.subject,
      mentor: a.mentor?.profile?.full_name ?? "Mentor",
      dueDate: a.due_date,
      dueMeta: due
        ? isOverdue
          ? `was due ${due.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
          : `due ${due.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
        : "No due date",
      status: computedStatus,
      score: a.score ?? null,
      feedback: a.feedback ?? null,
    };
  });
}

export async function getStudentPerformance() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const studentId = user.id;

  // Attendance
  const { data: attRows } = await supabase
    .from("attendance_records")
    .select("status, session_date, subject")
    .eq("student_id", studentId)
    .order("session_date", { ascending: false });

  const allAtt = (attRows || []) as any[];
  const totalAtt = allAtt.length;
  const presentAtt = allAtt.filter((r) => r.status === "present").length;
  const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : null;

  // Subject attendance
  const subjMap: Record<string, { present: number; total: number }> = {};
  for (const r of allAtt) {
    if (!subjMap[r.subject]) subjMap[r.subject] = { present: 0, total: 0 };
    subjMap[r.subject].total++;
    if (r.status === "present") subjMap[r.subject].present++;
  }
  const subjectAttendance = Object.entries(subjMap).map(([name, v]) => ({
    name,
    pct: Math.round((v.present / v.total) * 100),
  }));

  // Assignments / scores
  const { data: assignRows } = await supabase
    .from("assignments")
    .select("id, title, subject, due_date, status, score, feedback, created_at, mentor:mentors(id, profile:profiles(full_name))")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  const allAssign = (assignRows || []) as any[];
  const gradedAssign = allAssign.filter((a) => a.status === "graded" && a.score !== null);
  const submittedCount = allAssign.filter((a) => a.status === "graded" || a.status === "submitted").length;
  const avgScore = gradedAssign.length > 0
    ? Math.round(gradedAssign.reduce((sum, a) => sum + Number(a.score), 0) / gradedAssign.length)
    : null;

  // Best subject by avg score
  const subjectScores: Record<string, number[]> = {};
  for (const a of gradedAssign) {
    if (!subjectScores[a.subject]) subjectScores[a.subject] = [];
    subjectScores[a.subject].push(Number(a.score));
  }
  let bestSubject: string | null = null;
  let bestAvg = 0;
  for (const [subj, scores] of Object.entries(subjectScores)) {
    const avg = scores.reduce((s, n) => s + n, 0) / scores.length;
    if (avg > bestAvg) { bestAvg = avg; bestSubject = subj; }
  }

  // Recent scores
  const recentScores = gradedAssign.slice(0, 6).map((a) => ({
    id: a.id,
    title: a.title,
    subject: a.subject,
    date: new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    score: Number(a.score),
  }));

  // Mentor feedback from graded assignments
  const mentorFeedback = allAssign
    .filter((a) => a.feedback && a.mentor?.profile?.full_name)
    .slice(0, 4)
    .map((a) => ({
      mentor: a.mentor.profile.full_name,
      initials: (a.mentor.profile.full_name as string).split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase(),
      date: new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      feedback: a.feedback,
    }));

  return {
    attendanceRate,
    subjectAttendance,
    avgScore,
    submittedCount,
    totalAssignments: allAssign.length,
    bestSubject,
    bestSubjectAvg: bestSubject ? Math.round(bestAvg) : null,
    recentScores,
    mentorFeedback,
  };
}

export async function getStudentMentors() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const studentId = user.id;

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      session_id, course_id, status,
      session:sessions(title, subject, mentor:mentors(id, profile:profiles(full_name))),
      course:courses(title, subject, mentor:mentors(id, profile:profiles(full_name)))
    `)
    .eq("student_id", studentId)
    .eq("status", "confirmed");

  const mentorMap: Record<string, { id: string; name: string; subject: string; initials: string }> = {};
  for (const b of ((bookings || []) as any[])) {
    const target = b.session_id ? b.session : b.course;
    if (!target?.mentor) continue;
    const mentorId = target.mentor.id;
    const mentorName = target.mentor.profile?.full_name ?? "Mentor";
    if (!mentorMap[mentorId]) {
      mentorMap[mentorId] = {
        id: mentorId,
        name: mentorName,
        subject: target.subject ?? "Tutoring",
        initials: mentorName.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase(),
      };
    }
  }
  return Object.values(mentorMap);
}

// ----------------------------------------------------
// MENTOR DASHBOARD ACTIONS
// ----------------------------------------------------

export async function getMentorOverviewStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayEnd = new Date();
  todayEnd.setHours(23,59,59,999);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Run queries in parallel
  const [
    todayClassesRes,
    upcomingClassesRes,
    pendingAssignmentsRes,
    participationsRes,
    bookingsRes
  ] = await Promise.all([
    supabase
      .from("scheduled_classes")
      .select("id")
      .eq("mentor_id", user.id)
      .eq("status", "scheduled")
      .gte("scheduled_at", todayStart.toISOString())
      .lte("scheduled_at", todayEnd.toISOString()),
      
    supabase
      .from("scheduled_classes")
      .select("id")
      .eq("mentor_id", user.id)
      .eq("status", "scheduled")
      .gt("scheduled_at", new Date().toISOString()),
      
    supabase
      .from("assignments")
      .select("id")
      .eq("created_by", user.id)
      .eq("status", "submitted"),
      
    supabase
      .from("chat_participants")
      .select("chat_room_id")
      .eq("user_id", user.id),
      
    supabase
      .from("bookings")
      .select(`
        amount_paid,
        session:sessions(mentor_id),
        course:courses(mentor_id)
      `)
      .eq("payment_status", "paid")
      .gte("created_at", startOfMonth.toISOString())
  ]);

  const todayClasses = todayClassesRes.data;
  const upcomingClasses = upcomingClassesRes.data;
  const pendingAssignments = pendingAssignmentsRes.data;
  const participations = participationsRes.data;
  const bookings = bookingsRes.data;

  // Unread messages
  const roomIds = (participations || []).map(p => p.chat_room_id);
  let unreadCount = 0;
  if (roomIds.length > 0) {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("chat_room_id", roomIds)
      .neq("sender_id", user.id)
      .gte("created_at", last24h);
    unreadCount = count || 0;
  }

  // Earnings this month
  const earningsThisMonth = (bookings || []).reduce((acc: number, b: any) => {
    const targetMentorId = b.session?.mentor_id || b.course?.mentor_id;
    if (targetMentorId === user.id) {
      return acc + Number(b.amount_paid);
    }
    return acc;
  }, 0);

  return {
    todayClassesCount: todayClasses?.length || 0,
    upcomingClassesCount: upcomingClasses?.length || 0,
    pendingAssignmentsCount: pendingAssignments?.length || 0,
    unreadMessagesCount: unreadCount,
    earningsThisMonth,
  };
}

export async function getMentorClasses() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: classes, error } = await supabase
    .from("scheduled_classes")
    .select(`
      *,
      student:students(
        id,
        profile:profiles(full_name, avatar_url, email)
      )
    `)
    .eq("mentor_id", user.id)
    .order("scheduled_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (classes || []).map((c: any) => ({
    ...c,
    studentName: c.student?.profile?.full_name || "Unknown Student",
    studentEmail: c.student?.profile?.email || "",
    studentAvatar: c.student?.profile?.avatar_url || "",
  }));
}

export async function createScheduledClass(data: {
  bookingId: string;
  studentId: string;
  title: string;
  subject: string;
  scheduledAt: string;
  durationMinutes: number;
  joinUrl?: string;
  iconName?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: newClass, error } = await supabase
    .from("scheduled_classes")
    .insert([
      {
        booking_id: data.bookingId,
        student_id: data.studentId,
        mentor_id: user.id,
        title: data.title,
        subject: data.subject,
        scheduled_at: data.scheduledAt,
        duration_minutes: data.durationMinutes,
        join_url: data.joinUrl || null,
        icon_name: data.iconName || "video",
        status: "scheduled",
      }
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/mentor/classes");
  revalidatePath("/mentor/overview");
  return newClass;
}

export async function updateScheduledClass(
  classId: string,
  updates: {
    title?: string;
    subject?: string;
    scheduledAt?: string;
    durationMinutes?: number;
    joinUrl?: string;
    status?: string;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const dbUpdates: any = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.subject !== undefined) dbUpdates.subject = updates.subject;
  if (updates.scheduledAt !== undefined) dbUpdates.scheduled_at = updates.scheduledAt;
  if (updates.durationMinutes !== undefined) dbUpdates.duration_minutes = updates.durationMinutes;
  if (updates.joinUrl !== undefined) dbUpdates.join_url = updates.joinUrl;
  if (updates.status !== undefined) dbUpdates.status = updates.status;

  const { data, error } = await supabase
    .from("scheduled_classes")
    .update(dbUpdates)
    .eq("id", classId)
    .eq("mentor_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/mentor/classes");
  revalidatePath("/mentor/overview");
  return data;
}

export async function cancelScheduledClass(classId: string) {
  return updateScheduledClass(classId, { status: "cancelled" });
}

export async function getMentorStudents() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Fetch bookings for sessions or courses taught by this mentor
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(`
      id,
      status,
      payment_status,
      created_at,
      student_id,
      student:students(
        grade_level,
        school_name,
        profile:profiles(full_name, email, avatar_url),
        parent:parents(profile:profiles(full_name, email, phone))
      ),
      session:sessions(title, subject, mentor_id),
      course:courses(title, subject, mentor_id)
    `);

  if (error) throw new Error(error.message);

  const studentsMap: Record<string, any> = {};
  for (const b of (bookings || []) as any[]) {
    const mentorId = b.session?.mentor_id || b.course?.mentor_id;
    if (mentorId !== user.id) continue;

    const studentId = b.student_id;
    const studentInfo = b.student;
    if (!studentInfo) continue;

    if (!studentsMap[studentId]) {
      studentsMap[studentId] = {
        id: studentId,
        bookingId: b.id,
        name: studentInfo.profile?.full_name || "Student",
        email: studentInfo.profile?.email || "",
        avatarUrl: studentInfo.profile?.avatar_url || "",
        grade: studentInfo.grade_level || "Class 10",
        school: studentInfo.school_name || "High School",
        parentName: studentInfo.parent?.profile?.full_name || "Parent",
        parentPhone: studentInfo.parent?.profile?.phone || "N/A",
        subject: b.session?.subject || b.course?.subject || "General",
        enrolledAt: new Date(b.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        totalClasses: 0,
        attendedClasses: 0,
      };
    }
  }

  // Count attendance/classes for each student
  const studentIds = Object.keys(studentsMap);
  if (studentIds.length > 0) {
    const { data: attendance } = await supabase
      .from("attendance_records")
      .select("student_id, status")
      .in("student_id", studentIds);

    const { data: classes } = await supabase
      .from("scheduled_classes")
      .select("student_id")
      .eq("mentor_id", user.id)
      .in("student_id", studentIds);

    for (const att of (attendance || [])) {
      if (studentsMap[att.student_id]) {
        if (att.status === "present") {
          studentsMap[att.student_id].attendedClasses++;
        }
      }
    }

    for (const cl of (classes || [])) {
      if (studentsMap[cl.student_id]) {
        studentsMap[cl.student_id].totalClasses++;
      }
    }
  }

  return Object.values(studentsMap);
}

export async function getMentorAssignments() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: assignments, error } = await supabase
    .from("assignments")
    .select(`
      *,
      student:students(
        id,
        profile:profiles(full_name, email, avatar_url)
      )
    `)
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (assignments || []).map((a: any) => ({
    ...a,
    studentName: a.student?.profile?.full_name || "Student",
    studentAvatar: a.student?.profile?.avatar_url || "",
  }));
}

export async function createAssignment(data: {
  studentId: string;
  bookingId: string;
  title: string;
  subject: string;
  dueDate: string;
  description?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: newAssign, error } = await supabase
    .from("assignments")
    .insert([
      {
        student_id: data.studentId,
        booking_id: data.bookingId,
        title: data.title,
        subject: data.subject,
        due_date: data.dueDate,
        feedback: data.description || null,
        created_by: user.id,
        status: "pending",
      }
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/mentor/assignments");
  return newAssign;
}

export async function reviewAssignmentSubmission(assignmentId: string, score: number, feedback: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("assignments")
    .update({
      score,
      feedback,
      status: "reviewed",
    })
    .eq("id", assignmentId)
    .eq("created_by", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/mentor/assignments");
  revalidatePath("/mentor/overview");
  return data;
}

export async function getMentorResources() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: resources, error } = await supabase
    .from("resources")
    .select(`
      *,
      student:students(
        profile:profiles(full_name)
      )
    `)
    .eq("mentor_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (resources || []).map((r: any) => ({
    ...r,
    studentName: r.student?.profile?.full_name || "All Students",
  }));
}

export async function createResource(data: {
  name: string;
  type: "pdf" | "video" | "link" | "document";
  subject: string;
  url: string;
  size?: string;
  studentId?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: resource, error } = await supabase
    .from("resources")
    .insert([
      {
        mentor_id: user.id,
        student_id: data.studentId || null,
        name: data.name,
        type: data.type,
        subject: data.subject,
        url: data.url,
        size: data.size || null,
      }
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/mentor/resources");
  return resource;
}

export async function deleteResource(resourceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", resourceId)
    .eq("mentor_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/mentor/resources");
  return { success: true };
}

export async function saveAttendanceRecord(data: {
  studentId: string;
  scheduledClassId: string;
  bookingId?: string;
  sessionDate: string;
  subject: string;
  status: "present" | "absent" | "excused";
  notes?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Check if attendance already exists for this scheduled class
  const { data: existing } = await supabase
    .from("attendance_records")
    .select("id")
    .eq("scheduled_class_id", data.scheduledClassId)
    .eq("student_id", data.studentId)
    .limit(1)
    .single();

  let result;
  if (existing) {
    const { data: updated, error } = await supabase
      .from("attendance_records")
      .update({
        status: data.status,
        notes: data.notes || null,
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    result = updated;
  } else {
    const { data: inserted, error } = await supabase
      .from("attendance_records")
      .insert([
        {
          student_id: data.studentId,
          scheduled_class_id: data.scheduledClassId,
          booking_id: data.bookingId || null,
          session_date: data.sessionDate,
          subject: data.subject,
          status: data.status,
          notes: data.notes || null,
        }
      ])
      .select()
      .single();
    if (error) throw new Error(error.message);
    result = inserted;
  }

  // Mark the scheduled class as completed as well
  await supabase
    .from("scheduled_classes")
    .update({ status: "completed" })
    .eq("id", data.scheduledClassId);

  revalidatePath("/mentor/attendance");
  revalidatePath("/mentor/classes");
  return result;
}

export async function getMentorEarnings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Fetch all paid bookings for sessions or courses taught by this mentor
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(`
      id,
      status,
      payment_status,
      amount_paid,
      created_at,
      student:students(
        profile:profiles(full_name)
      ),
      session:sessions(title, subject, mentor_id, price),
      course:courses(title, subject, mentor_id, price)
    `)
    .eq("payment_status", "paid");

  if (error) throw new Error(error.message);

  const mentorBookings = (bookings || []).filter((b: any) => {
    const mentorId = b.session?.mentor_id || b.course?.mentor_id;
    return mentorId === user.id;
  });

  const totalEarnings = mentorBookings.reduce((acc, b) => acc + Number(b.amount_paid), 0);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const thisMonthEarnings = mentorBookings
    .filter((b) => {
      const d = new Date(b.created_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    })
    .reduce((acc, b) => acc + Number(b.amount_paid), 0);

  // Group by month for chart
  const monthlyData: Record<string, number> = {};
  for (const b of mentorBookings) {
    const d = new Date(b.created_at);
    const monthKey = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(b.amount_paid);
  }

  const chartData = Object.entries(monthlyData).map(([name, amount]) => ({
    name,
    amount,
  })).reverse(); // Order from oldest to newest

  const transactions = mentorBookings.map((b: any) => ({
    id: b.id,
    studentName: b.student?.profile?.full_name || "Student",
    title: b.session?.title || b.course?.title || "Booking",
    subject: b.session?.subject || b.course?.subject || "General",
    type: b.session_id ? "1-on-1 Session" : "Course Batch",
    amount: Number(b.amount_paid),
    date: new Date(b.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
  }));

  return {
    totalEarnings,
    thisMonthEarnings,
    chartData,
    transactions,
  };
}

export async function getMentorProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url")
    .eq("id", user.id)
    .single();

  const { data: mentor } = await supabase
    .from("mentors")
    .select("qualification, expertise, bio, hourly_rate")
    .eq("id", user.id)
    .single();

  return {
    id: profile?.id ?? user.id,
    name: profile?.full_name ?? "Mentor",
    email: profile?.email ?? user.email ?? "",
    role: profile?.role ?? "mentor",
    avatarText: (profile?.full_name ?? "M")
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase(),
    qualification: mentor?.qualification ?? "Educator",
    expertise: mentor?.expertise ?? [],
    bio: mentor?.bio ?? "",
    hourlyRate: Number(mentor?.hourly_rate ?? 0),
  };
}

export async function checkMentorInvitation(email: string) {
  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    return { success: false, error: emailCheck.error };
  }

  try {
    const adminClient = createAdminClient();
    const { data: invite, error: inviteErr } = await adminClient
      .from("mentor_invitations")
      .select("id, status")
      .eq("email", email.trim().toLowerCase())
      .eq("status", "pending")
      .maybeSingle();

    if (inviteErr) {
      return { success: false, error: "Failed to verify invitation status" };
    }

    if (!invite) {
      return { success: false, error: "No pending invitation found for this email address. Tutors must be pre-registered by the administrator." };
    }

    return { success: true };
  } catch (err) {
    console.error("checkMentorInvitation error:", err);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function bookCourseOrSessionAction(data: {
  targetId: string;
  targetType: "course" | "session" | "mentor";
  studentId: string;
  durationMinutes?: number;
  selectedSlot?: { day: string; time: string };
  selectedDate?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized: Please sign in.");

  // Resolve user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  let parentId: string;
  let studentId: string = data.studentId;

  if (profile?.role === "parent") {
    parentId = user.id;
    // Verify student belongs to this parent
    const { data: student } = await supabase
      .from("students")
      .select("parent_id")
      .eq("id", studentId)
      .single();
    if (!student || student.parent_id !== parentId) {
      throw new Error("Invalid student selection.");
    }
  } else if (profile?.role === "student") {
    // Resolve parent
    const { data: student } = await supabase
      .from("students")
      .select("parent_id")
      .eq("id", user.id)
      .single();
    if (!student) throw new Error("Student profile not found.");
    parentId = student.parent_id;
    studentId = user.id;
  } else {
    throw new Error("Only parents and students can make bookings.");
  }

  let amountPaid = 0;
  let title = "";
  let subject = "";
  let mentorId: string | null = null;
  let iconName = "book";
  let isLiveIndividual = false;
  let sessionId: string | null = null;
  let courseId: string | null = null;

  if (data.targetType === "course") {
    const { data: course, error: fetchErr } = await supabase
      .from("courses")
      .select("title, subject, price, mentor_id, format")
      .eq("id", data.targetId)
      .single();
    if (fetchErr || !course) throw new Error("Course not found.");
    amountPaid = Number(course.price);
    title = course.title;
    subject = course.subject;
    mentorId = course.mentor_id;
    iconName = course.subject === "Programming" ? "code" : course.subject === "Mathematics" ? "math" : course.subject === "Science" ? "flask" : "book";
    isLiveIndividual = course.format === "Live individual";
    courseId = data.targetId;
  } else if (data.targetType === "session") {
    const { data: session, error: fetchErr } = await supabase
      .from("sessions")
      .select("title, subject, price, mentor_id, type, icon_name")
      .eq("id", data.targetId)
      .single();
    if (fetchErr || !session) throw new Error("Session not found.");
    
    let basePrice = Number(session.price);
    if (data.durationMinutes === 90) {
      amountPaid = Math.round(basePrice * 1.5);
    } else {
      amountPaid = basePrice;
    }
    title = session.title;
    subject = session.subject;
    mentorId = session.mentor_id;
    iconName = session.icon_name || "book";
    isLiveIndividual = session.type === "1-on-1";
    sessionId = data.targetId;
  } else if (data.targetType === "mentor") {
    const { data: mentor, error: fetchErr } = await supabase
      .from("mentors")
      .select("id, hourly_rate, expertise, profile:profiles(full_name)")
      .eq("id", data.targetId)
      .single();
    if (fetchErr || !mentor) throw new Error("Mentor not found.");

    const profileData = Array.isArray(mentor.profile) ? mentor.profile[0] : mentor.profile;
    const mentorName = (profileData as { full_name?: string } | null)?.full_name || "Mentor";
    const hourlyRate = Number(mentor.hourly_rate) || 500;
    const basePrice = hourlyRate;
    if (data.durationMinutes === 90) {
      amountPaid = Math.round(basePrice * 1.5);
    } else {
      amountPaid = basePrice;
    }
    mentorId = mentor.id;
    subject = mentor.expertise?.[0] || "General";
    title = `1-on-1 Session with ${mentorName}`;
    iconName = subject === "Programming" ? "code" : subject === "Mathematics" ? "math" : subject === "Science" ? "flask" : "book";
    isLiveIndividual = true;

    // Find or create default 1-on-1 session for this mentor
    const { data: existingSession } = await supabase
      .from("sessions")
      .select("id")
      .eq("mentor_id", mentor.id)
      .eq("type", "1-on-1")
      .eq("status", "Active")
      .limit(1)
      .maybeSingle();

    if (existingSession) {
      sessionId = existingSession.id;
    } else {
      const { data: newSession, error: createErr } = await supabase
        .from("sessions")
        .insert({
          mentor_id: mentor.id,
          title: `1-on-1 Session with ${mentorName}`,
          description: `Custom private mentoring session focused on your specific learning needs and academic goals.`,
          type: "1-on-1",
          subject: subject,
          price: hourlyRate,
          status: "Active",
          color_bg: "#ede9fe",
          icon_name: "writing"
        })
        .select("id")
        .single();
      if (createErr || !newSession) {
        throw new Error("Failed to initialize mentor session: " + createErr?.message);
      }
      sessionId = newSession.id;
    }
  }

  const bookingData: any = {
    parent_id: parentId,
    student_id: studentId,
    status: "confirmed",
    payment_status: "paid",
    amount_paid: amountPaid,
  };

  if (courseId) {
    bookingData.course_id = courseId;
  } else if (sessionId) {
    bookingData.session_id = sessionId;
  }

  const { data: newBooking, error: bookingErr } = await supabase
    .from("bookings")
    .insert([bookingData])
    .select("id")
    .single();

  if (bookingErr) {
    if (bookingErr.code === "23505") {
      throw new Error("You have already booked this target for this student.");
    }
    throw new Error(bookingErr.message);
  }

  if (isLiveIndividual && data.selectedSlot) {
    let scheduledAtStr = "";

    if (data.targetType === "mentor" && data.selectedDate) {
      const date = new Date(data.selectedDate);
      const timeMatch = data.selectedSlot.time.match(/^(\d+):?(\d*)\s*(AM|PM)$/i);
      let hours = 9;
      let minutes = 0;
      if (timeMatch) {
        let rawHours = parseInt(timeMatch[1], 10);
        if (timeMatch[2]) {
          minutes = parseInt(timeMatch[2], 10);
        }
        const meridiem = timeMatch[3].toUpperCase();
        if (meridiem === "PM" && rawHours < 12) rawHours += 12;
        if (meridiem === "AM" && rawHours === 12) rawHours = 0;
        hours = rawHours;
      }
      date.setHours(hours, minutes, 0, 0);
      scheduledAtStr = date.toISOString();
    } else {
      const daysOfWeek: Record<string, number> = {
        Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
      };
      const targetDay = daysOfWeek[data.selectedSlot.day] ?? 1;
      
      const timeMatch = data.selectedSlot.time.match(/^(\d+)\s*(AM|PM)$/i);
      let hours = 9;
      if (timeMatch) {
        let rawHours = parseInt(timeMatch[1], 10);
        const meridiem = timeMatch[2].toUpperCase();
        if (meridiem === "PM" && rawHours < 12) rawHours += 12;
        if (meridiem === "AM" && rawHours === 12) rawHours = 0;
        hours = rawHours;
      }
      
      const scheduledAt = new Date();
      const currentDay = scheduledAt.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7;
      
      scheduledAt.setDate(scheduledAt.getDate() + daysToAdd);
      scheduledAt.setHours(hours, 0, 0, 0);
      scheduledAtStr = scheduledAt.toISOString();
    }

    const duration = data.durationMinutes || 60;
    const classData = {
      booking_id: newBooking.id,
      student_id: studentId,
      mentor_id: mentorId,
      title: title,
      subject: subject,
      scheduled_at: scheduledAtStr,
      duration_minutes: duration,
      status: "scheduled",
      join_url: null,
      icon_name: iconName,
    };
    
    const adminClient = createAdminClient();
    const { data: insertedClass, error: classErr } = await adminClient
      .from("scheduled_classes")
      .insert([classData])
      .select("id")
      .single();

    if (classErr) {
      throw new Error("Booking created but failed to schedule class: " + classErr.message);
    }

    // Fire mentor notifications
    if (mentorId) {
      const { data: studentProfile } = await adminClient
        .from("profiles").select("full_name").eq("id", studentId).single();
      await createMentorNotifications({
        mentorId,
        itemTitle: title,
        studentName: studentProfile?.full_name || "A student",
        firstClassAt: scheduledAtStr,
        classId: insertedClass?.id || null,
      }).catch(console.error);
    }
  } else if (data.targetType === "session" && !isLiveIndividual) {
    // Schedule class for Group Session as per configured date/time in admin panel
    const { data: sessionData } = await supabase
      .from("sessions")
      .select("session_date, session_time, is_repeatable")
      .eq("id", data.targetId)
      .single();

    const targetDateStr = sessionData?.is_repeatable ? data.selectedDate : sessionData?.session_date;

    if (sessionData && targetDateStr && sessionData.session_time) {
      const date = new Date(targetDateStr);
      
      // Parse timing like "05:00 PM"
      const timeMatch = sessionData.session_time.match(/^(\d+):?(\d*)\s*(AM|PM)$/i);
      let hours = 9;
      let minutes = 0;
      if (timeMatch) {
        let rawHours = parseInt(timeMatch[1], 10);
        if (timeMatch[2]) {
          minutes = parseInt(timeMatch[2], 10);
        }
        const meridiem = timeMatch[3].toUpperCase();
        if (meridiem === "PM" && rawHours < 12) rawHours += 12;
        if (meridiem === "AM" && rawHours === 12) rawHours = 0;
        hours = rawHours;
      }
      date.setHours(hours, minutes, 0, 0);

      const classData = {
        booking_id: newBooking.id,
        student_id: studentId,
        mentor_id: mentorId,
        title: title,
        subject: subject,
        scheduled_at: date.toISOString(),
        duration_minutes: data.durationMinutes || 60,
        status: "scheduled",
        join_url: null,
        icon_name: iconName,
      };

      const adminClient = createAdminClient();
      const { data: insertedGroupClass, error: classErr } = await adminClient
        .from("scheduled_classes")
        .insert([classData])
        .select("id")
        .single();

      if (classErr) {
        throw new Error("Booking created but failed to schedule group session class: " + classErr.message);
      }

      if (mentorId) {
        const { data: studentProfile } = await adminClient
          .from("profiles").select("full_name").eq("id", studentId).single();
        await createMentorNotifications({
          mentorId,
          itemTitle: title,
          studentName: studentProfile?.full_name || "A student",
          firstClassAt: date.toISOString(),
          classId: insertedGroupClass?.id || null,
        }).catch(console.error);
      }
    }
  } else if (data.targetType === "course" && !isLiveIndividual) {
    // Schedule recurring classes for Live batch courses spanning start to end date
    const { data: courseData } = await supabase
      .from("courses")
      .select("batch_start_date, batch_end_date, class_days, class_timing, format")
      .eq("id", data.targetId)
      .single();

    if (courseData && courseData.format === "Live batch" && courseData.batch_start_date && courseData.batch_end_date && courseData.class_days && courseData.class_timing) {
      const startDate = new Date(courseData.batch_start_date);
      const endDate = new Date(courseData.batch_end_date);
      
      // Parse timing like "05:00 PM"
      const timeMatch = courseData.class_timing.match(/^(\d+):?(\d*)\s*(AM|PM)$/i);
      let hours = 9;
      let minutes = 0;
      if (timeMatch) {
        let rawHours = parseInt(timeMatch[1], 10);
        if (timeMatch[2]) {
          minutes = parseInt(timeMatch[2], 10);
        }
        const meridiem = timeMatch[3].toUpperCase();
        if (meridiem === "PM" && rawHours < 12) rawHours += 12;
        if (meridiem === "AM" && rawHours === 12) rawHours = 0;
        hours = rawHours;
      }

      // Map day names to number indices
      const dayMap: Record<string, number> = {
        sunday: 0, sun: 0,
        monday: 1, mon: 1,
        tuesday: 2, tue: 2,
        wednesday: 3, wed: 3,
        thursday: 4, thu: 4,
        friday: 5, fri: 5,
        saturday: 6, sat: 6
      };

      const targetDays = courseData.class_days
        .split(",")
        .map((d: string) => d.trim().toLowerCase())
        .map((d: string) => dayMap[d])
        .filter((d: any) => d !== undefined);

      const classesToInsert: any[] = [];
      const loopDate = new Date(startDate);

      while (loopDate <= endDate) {
        if (targetDays.includes(loopDate.getDay())) {
          const classDate = new Date(loopDate);
          classDate.setHours(hours, minutes, 0, 0);

          classesToInsert.push({
            booking_id: newBooking.id,
            student_id: studentId,
            mentor_id: mentorId,
            title: `${title} - Session ${classesToInsert.length + 1}`,
            subject: subject,
            scheduled_at: classDate.toISOString(),
            duration_minutes: 60,
            status: "scheduled",
            join_url: null,
            icon_name: iconName,
          });
        }
        loopDate.setDate(loopDate.getDate() + 1);
      }

      if (classesToInsert.length > 0) {
        const adminClient = createAdminClient();
        const { error: classErr } = await adminClient
          .from("scheduled_classes")
          .insert(classesToInsert);

        if (classErr) {
          throw new Error("Booking created but failed to schedule batch course classes: " + classErr.message);
        }

        if (mentorId) {
          const { data: studentProfile } = await adminClient
            .from("profiles").select("full_name").eq("id", studentId).single();
          await createMentorNotifications({
            mentorId,
            itemTitle: title,
            studentName: studentProfile?.full_name || "A student",
            firstClassAt: classesToInsert[0]?.scheduled_at || null,
            classId: null,
          }).catch(console.error);
        }
      }
    }
  }

  revalidatePath("/bookings");
  revalidatePath("/dashboard/overview");
  revalidatePath("/lms/overview");
  revalidatePath("/mentor/classes");
  return { success: true };
}

export async function getMentorAvailability() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("mentors")
    .select("availability")
    .eq("id", user.id)
    .single();

  if (error) {
    if (error.message.includes("column") || error.message.includes("does not exist")) {
      return {};
    }
    throw new Error(error.message);
  }
  return data?.availability || {};
}

export async function updateMentorAvailability(availability: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("mentors")
    .update({ availability })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/mentor/availability");
  revalidatePath("/mentor/overview");
  return { success: true };
}

export async function updateMentorProfile(data: {
  name: string;
  bio: string;
  qualification: string;
  expertise: string[];
  hourlyRate: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const adminClient = createAdminClient();

  const { error: profileErr } = await adminClient
    .from("profiles")
    .update({ full_name: data.name })
    .eq("id", user.id);

  if (profileErr) throw new Error(profileErr.message);

  const { error: mentorErr } = await adminClient
    .from("mentors")
    .update({
      bio: data.bio || null,
      qualification: data.qualification || 'Educator',
      expertise: data.expertise || [],
      hourly_rate: data.hourlyRate || 0,
    })
    .eq("id", user.id);

  if (mentorErr) throw new Error(mentorErr.message);

  revalidatePath("/mentor/profile");
  revalidatePath("/mentor/overview");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// COURSE UNITS (Recorded Courses)
// ─────────────────────────────────────────────────────────────────────────────

export async function getCourseUnits(courseId: string) {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("course_units")
    .select("id, title, description, order_index, duration_seconds, youtube_url, module_name")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

// Returns units with video_id ONLY (never exposes full youtube_url to browser)
export async function getCourseUnitsForStudent(courseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("course_units")
    .select("id, title, description, order_index, duration_seconds, youtube_url, module_name")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });
  if (error) throw new Error(error.message);

  // Strip youtube_url, extract only video_id
  return (data || []).map((u: any) => {
    let videoId = "";
    try {
      const url = new URL(u.youtube_url);
      if (url.hostname.includes("youtu.be")) {
        videoId = url.pathname.slice(1);
      } else {
        videoId = url.searchParams.get("v") || "";
      }
    } catch {}
    return {
      id: u.id,
      title: u.title,
      description: u.description,
      order_index: u.order_index,
      duration_seconds: u.duration_seconds,
      video_id: videoId,
      module_name: u.module_name || "",
    };
  });
}

export async function upsertCourseUnit(data: {
  id?: string;
  courseId: string;
  title: string;
  description?: string;
  youtubeUrl: string;
  orderIndex: number;
  durationSeconds?: number;
  moduleName?: string;
}) {
  const adminClient = createAdminClient();
  const payload: any = {
    course_id: data.courseId,
    title: data.title,
    description: data.description || null,
    youtube_url: data.youtubeUrl,
    order_index: data.orderIndex,
    duration_seconds: data.durationSeconds || 0,
    module_name: data.moduleName || null,
  };
  if (data.id) payload.id = data.id;

  const { error } = await adminClient.from("course_units").upsert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteCourseUnit(unitId: string) {
  const adminClient = createAdminClient();
  const { error } = await adminClient.from("course_units").delete().eq("id", unitId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  return { success: true };
}

export async function reorderCourseUnits(unitIds: string[]) {
  const adminClient = createAdminClient();
  const updates = unitIds.map((id, idx) =>
    adminClient.from("course_units").update({ order_index: idx }).eq("id", id)
  );
  await Promise.all(updates);
  revalidatePath("/admin");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO PROGRESS
// ─────────────────────────────────────────────────────────────────────────────

export async function getVideoProgress(courseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const adminClient = createAdminClient();
  const { data: units } = await adminClient
    .from("course_units")
    .select("id")
    .eq("course_id", courseId);

  if (!units || units.length === 0) return {};

  const unitIds = units.map((u: any) => u.id);
  const { data: progress } = await adminClient
    .from("video_progress")
    .select("unit_id, watch_percentage, completed")
    .eq("student_id", user.id)
    .in("unit_id", unitIds);

  const result: Record<string, { watch_percentage: number; completed: boolean }> = {};
  (progress || []).forEach((p: any) => {
    result[p.unit_id] = {
      watch_percentage: Number(p.watch_percentage),
      completed: p.completed,
    };
  });
  return result;
}

export async function updateVideoProgress(unitId: string, watchPercentage: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const completed = watchPercentage >= 80;

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("video_progress")
    .upsert({
      student_id: user.id,
      unit_id: unitId,
      watch_percentage: watchPercentage,
      completed,
      last_watched_at: new Date().toISOString(),
    }, { onConflict: "student_id,unit_id" });

  if (error) throw new Error(error.message);
  return { success: true, completed };
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────────────────────

export async function getClassAttendance(classId: string) {
  const adminClient = createAdminClient();

  const { data: cls } = await adminClient
    .from("scheduled_classes")
    .select("id, booking_id, student_id, title, subject, scheduled_at")
    .eq("id", classId)
    .single();

  if (!cls) return { class: null, students: [], attendance: {} };

  const { data: booking } = await adminClient
    .from("bookings")
    .select("session_id, course_id")
    .eq("id", cls.booking_id)
    .single();

  let allStudentIds: string[] = [cls.student_id];

  if (booking?.session_id) {
    const { data: siblings } = await adminClient
      .from("bookings")
      .select("student_id")
      .eq("session_id", booking.session_id)
      .eq("status", "confirmed");
    if (siblings) allStudentIds = [...new Set(siblings.map((b: any) => b.student_id))];
  } else if (booking?.course_id) {
    const { data: siblings } = await adminClient
      .from("bookings")
      .select("student_id")
      .eq("course_id", booking.course_id)
      .eq("status", "confirmed");
    if (siblings) allStudentIds = [...new Set(siblings.map((b: any) => b.student_id))];
  }

  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", allStudentIds);

  const { data: attendanceRecords } = await adminClient
    .from("attendance_records")
    .select("student_id, status")
    .eq("scheduled_class_id", classId);

  const attendance: Record<string, string> = {};
  (attendanceRecords || []).forEach((r: any) => {
    attendance[r.student_id] = r.status;
  });

  return { class: cls, students: profiles || [], attendance };
}

export async function markAttendance(
  classId: string,
  records: { studentId: string; status: "present" | "absent" | "excused" }[]
) {
  const adminClient = createAdminClient();

  const { data: cls } = await adminClient
    .from("scheduled_classes")
    .select("scheduled_at, subject, booking_id")
    .eq("id", classId)
    .single();

  if (!cls) throw new Error("Class not found");

  const sessionDate = new Date(cls.scheduled_at).toISOString().split("T")[0];

  for (const r of records) {
    await adminClient
      .from("attendance_records")
      .upsert({
        scheduled_class_id: classId,
        student_id: r.studentId,
        status: r.status,
        booking_id: cls.booking_id,
        session_date: sessionDate,
        subject: cls.subject,
        marked_at: new Date().toISOString(),
      }, { onConflict: "scheduled_class_id,student_id" });
  }

  revalidatePath("/mentor/classes");
  return { success: true };
}

export async function markClassCompleted(classId: string) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("scheduled_classes")
    .update({ status: "completed" })
    .eq("id", classId);

  if (error) throw new Error(error.message);

  revalidatePath("/mentor/classes");
  revalidatePath("/dashboard/classes");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// MENTOR NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function getMentorNotifications() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("mentor_notifications")
    .select("*")
    .eq("mentor_id", user.id)
    .lte("scheduled_for", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getUnreadNotificationCount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const adminClient = createAdminClient();
  const { count } = await adminClient
    .from("mentor_notifications")
    .select("id", { count: "exact", head: true })
    .eq("mentor_id", user.id)
    .eq("is_read", false)
    .lte("scheduled_for", new Date().toISOString());

  return count || 0;
}

export async function markNotificationsRead(ids: string[]) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("mentor_notifications")
    .update({ is_read: true })
    .in("id", ids);
  if (error) throw new Error(error.message);
  return { success: true };
}

async function createMentorNotifications(params: {
  mentorId: string;
  itemTitle: string;
  studentName: string;
  firstClassAt: string | null;
  classId?: string | null;
}) {
  const adminClient = createAdminClient();
  const now = new Date().toISOString();
  const toInsert: any[] = [];

  toInsert.push({
    mentor_id: params.mentorId,
    type: "new_booking",
    title: "New Booking",
    message: `${params.studentName} enrolled in ${params.itemTitle}`,
    link_url: "/mentor/classes",
    class_id: params.classId || null,
    scheduled_for: now,
  });

  if (params.firstClassAt) {
    const classTime = new Date(params.firstClassAt).getTime();
    toInsert.push({
      mentor_id: params.mentorId,
      type: "reminder_3h",
      title: "Session in 3 Hours",
      message: `"${params.itemTitle}" starts in 3 hours — please add your meeting link`,
      link_url: "/mentor/classes",
      class_id: params.classId || null,
      scheduled_for: new Date(classTime - 3 * 60 * 60 * 1000).toISOString(),
    });
    toInsert.push({
      mentor_id: params.mentorId,
      type: "reminder_1h",
      title: "Session in 1 Hour!",
      message: `"${params.itemTitle}" starts in 1 hour — meeting link required`,
      link_url: "/mentor/classes",
      class_id: params.classId || null,
      scheduled_for: new Date(classTime - 1 * 60 * 60 * 1000).toISOString(),
    });
  }

  await adminClient.from("mentor_notifications").insert(toInsert);
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION LINK MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function updateCourseJoinUrl(courseId: string, joinUrl: string) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("courses")
    .update({ join_url: joinUrl || null })
    .eq("id", courseId);
  if (error) throw new Error(error.message);
  revalidatePath("/mentor/classes");
  revalidatePath("/dashboard/classes");
  return { success: true };
}

export async function updateSessionJoinUrl(sessionId: string, joinUrl: string) {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("sessions")
    .update({ join_url: joinUrl || null })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidatePath("/mentor/classes");
  revalidatePath("/dashboard/classes");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// CANCEL BOOKING (Admin)
// ─────────────────────────────────────────────────────────────────────────────

export async function cancelBooking(bookingId: string) {
  const adminClient = createAdminClient();

  const { error: bookErr } = await adminClient
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);
  if (bookErr) throw new Error(bookErr.message);

  const { error: classErr } = await adminClient
    .from("scheduled_classes")
    .update({ status: "cancelled" })
    .eq("booking_id", bookingId);
  if (classErr) throw new Error(classErr.message);

  revalidatePath("/admin");
  revalidatePath("/dashboard/classes");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT: Scheduled classes with resolved join_url by booking type
// ─────────────────────────────────────────────────────────────────────────────

export async function getStudentScheduledClassesResolved(bookingId: string) {
  const adminClient = createAdminClient();

  const { data: classes, error } = await adminClient
    .from("scheduled_classes")
    .select("*, booking:bookings(course_id, session_id, created_at)")
    .eq("booking_id", bookingId)
    .order("scheduled_at", { ascending: true });

  if (error) throw new Error(error.message);

  // Fetch attendance records for this booking to attach status
  const { data: attendance } = await adminClient
    .from("attendance_records")
    .select("*")
    .eq("booking_id", bookingId);

  // For each class, resolve the correct join_url
  const resolved = await Promise.all((classes || []).map(async (cls: any) => {
    let resolvedJoinUrl = cls.join_url;

    if (cls.booking?.course_id) {
      const { data: course } = await adminClient
        .from("courses")
        .select("join_url, format")
        .eq("id", cls.booking.course_id)
        .single();
      if (course?.join_url) resolvedJoinUrl = course.join_url;
    } else if (cls.booking?.session_id) {
      const { data: session } = await adminClient
        .from("sessions")
        .select("join_url, type")
        .eq("id", cls.booking.session_id)
        .single();
      if (session?.join_url) resolvedJoinUrl = session.join_url;
    }

    const attendanceRec = (attendance || []).find((a: any) => a.scheduled_class_id === cls.id);
    const attendanceStatus = attendanceRec ? attendanceRec.status : null;

    return { 
      ...cls, 
      join_url: resolvedJoinUrl,
      attendance_status: attendanceStatus,
      booking_created_at: cls.booking?.created_at || null
    };
  }));

  return resolved;
}

export async function getStudentBookingsWithJoinUrls(studentId: string) {
  const adminClient = createAdminClient();

  const { data: dbBookings, error } = await adminClient
    .from("bookings")
    .select(`
      id,
      status,
      payment_status,
      amount_paid,
      student_id,
      session_id,
      course_id,
      created_at,
      session:sessions(title, type, price, subject, join_url, mentor:mentors(profile:profiles(full_name))),
      course:courses(title, format, price, subject, join_url, mentor:mentors(profile:profiles(full_name)))
    `)
    .eq("student_id", studentId)
    .eq("status", "confirmed");

  if (error) throw new Error(error.message);

  return (dbBookings || []).map((b: any) => {
    const isCourse = !!b.course_id;
    const target = isCourse ? b.course : b.session;
    const mentorName = target?.mentor?.profile?.full_name || "Unknown Mentor";

    return {
      id: b.id,
      bookingType: isCourse ? "Course" : "Session",
      courseFormat: isCourse ? target?.format : null,
      courseId: b.course_id,
      sessionId: b.session_id,
      itemTitle: target?.title || "Untitled",
      mentorName,
      amountPaid: Number(b.amount_paid || 0),
      paymentStatus: b.payment_status,
      status: b.status,
      createdAt: b.created_at,
      joinUrl: target?.join_url || null,
    };
  });
}

export async function getStudentBookingsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return getStudentBookingsWithJoinUrls(user.id);
}

export async function getStudentCourseDetails(courseId: string) {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("courses")
    .select("id, title, description, subject, mentor:mentors(id, profile:profiles(full_name))")
    .eq("id", courseId)
    .single();
  if (error) throw new Error(error.message);
  const mentorObj = Array.isArray(data.mentor) ? data.mentor[0] : (data.mentor as any);
  const mentorProfile = mentorObj ? (Array.isArray(mentorObj.profile) ? mentorObj.profile[0] : mentorObj.profile) : null;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    subject: data.subject,
    mentorName: mentorProfile?.full_name || "Mentor",
  };
}

export async function getItemReviews(itemId: string, type: "course" | "session") {
  const supabase = createAdminClient();
  const query = supabase
    .from("reviews")
    .select(`
      id,
      student_id,
      student_name,
      rating,
      comment,
      created_at,
      profile:profiles(full_name)
    `);

  if (type === "course") {
    query.eq("course_id", itemId);
  } else {
    query.eq("session_id", itemId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (data || []).map((r: any) => {
    const profileName = Array.isArray(r.profile) 
      ? r.profile[0]?.full_name 
      : r.profile?.full_name;
    const name = profileName || r.student_name || "Anonymous Student";
    const init = name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();

    return {
      id: r.id,
      studentName: name,
      avatarText: init || "S",
      rating: Number(r.rating),
      comment: r.comment || "",
      createdAt: r.created_at,
    };
  });
}

export async function addReview(review: {
  itemId: string;
  type: "course" | "session";
  rating: number;
  comment: string;
  studentName?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const insertData: any = {
    rating: Number(review.rating),
    comment: review.comment || "",
  };

  if (user) {
    insertData.student_id = user.id;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    if (profile?.full_name) {
      insertData.student_name = profile.full_name;
    }
  }

  if (review.studentName) {
    insertData.student_name = review.studentName;
  }

  if (review.type === "course") {
    insertData.course_id = review.itemId;
  } else {
    insertData.session_id = review.itemId;
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("reviews").insert([insertData]);
  if (error) throw new Error(error.message);

  revalidatePath(`/courses/${review.itemId}`);
  revalidatePath(`/sessions/${review.itemId}`);
  revalidatePath("/");
  return { success: true };
}

export async function getStudentResources() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: resources, error } = await supabase
    .from("resources")
    .select(`
      *,
      mentor:mentors(
        profile:profiles(full_name)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (resources || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    type: r.type === "video" ? "link" : r.type,
    subject: r.subject,
    mentor: r.mentor?.profile?.full_name || "Unknown Mentor",
    date: new Date(r.created_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }),
    size: r.size || undefined,
    url: r.url
  }));
}

export async function getStudentBookingDashboardDetails(bookingId: string) {
  const adminClient = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Fetch Booking info
  const { data: b, error: bErr } = await adminClient
    .from("bookings")
    .select(`
      id,
      status,
      payment_status,
      amount_paid,
      student_id,
      session_id,
      course_id,
      created_at,
      session:sessions(title, type, price, subject, join_url, mentor:mentors(id, profile:profiles(full_name))),
      course:courses(title, format, price, subject, join_url, mentor:mentors(id, profile:profiles(full_name)))
    `)
    .eq("id", bookingId)
    .single();

  if (bErr || !b) throw new Error("Booking not found: " + (bErr?.message || ""));

  // Verify student owns this booking
  if (b.student_id !== user.id) {
    // If not direct student, check if it's the parent of the student
    const { data: student } = await adminClient
      .from("students")
      .select("parent_id")
      .eq("id", b.student_id)
      .single();
    if (!student || student.parent_id !== user.id) {
      throw new Error("Access denied: Not authorized to view this booking.");
    }
  }

  const isCourse = !!b.course_id;
  const rawTarget = (isCourse ? b.course : b.session) as any;
  const target = Array.isArray(rawTarget) ? rawTarget[0] : rawTarget;

  const rawMentor = target?.mentor;
  const mentorObj = Array.isArray(rawMentor) ? rawMentor[0] : rawMentor;
  const mentorId = mentorObj?.id;

  const mentorProfile = mentorObj?.profile;
  const profileObj = Array.isArray(mentorProfile) ? mentorProfile[0] : mentorProfile;
  const mentorName = profileObj?.full_name || "Unknown Mentor";

  const bookingDetails = {
    id: b.id,
    bookingType: isCourse ? "Course" : "Session",
    courseFormat: isCourse ? target?.format : null,
    courseId: b.course_id,
    sessionId: b.session_id,
    itemTitle: target?.title || "Untitled",
    mentorName,
    mentorId,
    subject: target?.subject || "General",
    amountPaid: Number(b.amount_paid || 0),
    paymentStatus: b.payment_status,
    status: b.status,
    createdAt: b.created_at,
    joinUrl: target?.join_url || null,
  };

  // 2. Fetch Scheduled classes for this booking
  const { data: classes, error: classesErr } = await adminClient
    .from("scheduled_classes")
    .select("*")
    .eq("booking_id", bookingId)
    .order("scheduled_at", { ascending: true });

  // Resolve join URLs
  const resolvedClasses = (classes || []).map((cls: any) => {
    let resolvedJoinUrl = cls.join_url || bookingDetails.joinUrl;
    return { ...cls, join_url: resolvedJoinUrl };
  });

  // 3. Fetch Assignments for this booking
  const { data: assignments } = await adminClient
    .from("assignments")
    .select("*")
    .eq("booking_id", bookingId)
    .order("due_date", { ascending: true });

  // 4. Fetch Attendance records for this booking
  const { data: attendance } = await adminClient
    .from("attendance_records")
    .select("*")
    .eq("booking_id", bookingId);

  // 5. Fetch resources for this mentor
  let mappedResources: any[] = [];
  if (mentorId) {
    const { data: resources } = await adminClient
      .from("resources")
      .select("*")
      .eq("mentor_id", mentorId)
      .order("created_at", { ascending: false });

    mappedResources = (resources || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      type: r.type === "video" ? "link" : r.type,
      subject: r.subject,
      mentor: mentorName,
      date: new Date(r.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      }),
      size: r.size || undefined,
      url: r.url
    }));
  }

  return {
    booking: bookingDetails,
    classes: resolvedClasses,
    assignments: assignments || [],
    attendance: attendance || [],
    resources: mappedResources,
  };
}

export async function getAdminSchedules() {
  noStore();
  const supabase = createAdminClient();

  const { data: dbClasses, error } = await supabase
    .from("scheduled_classes")
    .select(`
      *,
      student:students(id, profile:profiles(full_name, email)),
      mentor:mentors(id, profile:profiles(full_name)),
      booking:bookings(
        id,
        course:courses(id, title, subject, format),
        session:sessions(id, title, subject, type)
      ),
      attendance_records(id, status)
    `)
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("Error fetching scheduled classes:", error);
    return [];
  }

  return (dbClasses || []).map((cls: any) => {
    const courseTitle = cls.booking?.course?.title || cls.booking?.session?.title || "1-on-1 Direct Private Session";
    const lessonTopic = cls.title;
    const mentorName = cls.mentor?.profile?.full_name || "Unknown Mentor";
    
    const dateObj = new Date(cls.scheduled_at);
    const dateStr = dateObj.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).split("/").reverse().join("-");

    const timeStr = dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const subject = cls.booking?.course?.subject || cls.booking?.session?.subject || cls.subject || "General";
    
    let itemType: "course" | "session" = "session";
    let subType = "1 on 1";
    if (cls.booking?.course) {
      itemType = "course";
      const f = cls.booking.course.format?.toLowerCase() || "";
      if (f.includes("batch")) subType = "Live Batch";
      else if (f.includes("individual")) subType = "Live Individual";
      else if (f.includes("recorded")) subType = "Recorded";
      else subType = "Recorded";
    } else if (cls.booking?.session) {
      itemType = "session";
      const t = cls.booking.session.type?.toLowerCase() || "";
      if (t.includes("group")) subType = "Group";
      else subType = "1 on 1";
    }

    return {
      id: cls.id,
      courseTitle,
      lessonTopic,
      date: dateStr,
      time: timeStr,
      scheduledAt: cls.scheduled_at,
      mentor: mentorName,
      mentorId: cls.mentor_id,
      zoomLink: cls.join_url,
      subject,
      itemType,
      subType,
      studentInfo: {
        studentId: cls.student?.id,
        studentName: cls.student?.profile?.full_name || "Unknown Student",
        studentEmail: cls.student?.profile?.email || "",
        bookingId: cls.booking?.id,
        scheduledClassId: cls.id,
        attendanceRecordId: cls.attendance_records?.[0]?.id || null,
        status: cls.attendance_records?.[0]?.status || "unmarked",
      }
    };
  });
}

export async function markAdminAttendance(records: {
  studentId: string;
  scheduledClassId: string;
  bookingId: string;
  status: "present" | "absent" | "excused";
  date: string;
  subject: string;
}[]) {
  noStore();
  const supabase = createAdminClient();

  const results = [];
  for (const record of records) {
    // Check if record exists
    const { data: existing } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("student_id", record.studentId)
      .eq("scheduled_class_id", record.scheduledClassId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Update
      const { data, error } = await supabase
        .from("attendance_records")
        .update({
          status: record.status,
          session_date: record.date,
          subject: record.subject,
        })
        .eq("id", existing.id)
        .select();
      if (error) throw error;
      results.push(data);
    } else {
      // Insert
      const { data, error } = await supabase
        .from("attendance_records")
        .insert({
          student_id: record.studentId,
          scheduled_class_id: record.scheduledClassId,
          booking_id: record.bookingId || null,
          status: record.status,
          session_date: record.date,
          subject: record.subject,
        })
        .select();
      if (error) throw error;
      results.push(data);
    }
  }

  revalidatePath("/admin/schedules");
  return { success: true, count: results.length };
}

export async function getAdminCourseDetails(courseId: string) {
  noStore();
  const supabase = createAdminClient();

  // 1. Fetch Course details
  const { data: course, error } = await supabase
    .from("courses")
    .select("*, mentor:mentors(profile:profiles(full_name, avatar_url, email), qualification, experience, rating)")
    .eq("id", courseId)
    .single();

  if (error || !course) {
    throw new Error(error ? error.message : "Course not found");
  }

  // 2. Fetch bookings for this course
  const { data: dbBookings } = await supabase
    .from("bookings")
    .select(`
      *,
      student:students(profile:profiles(full_name, email)),
      parent:parents(profile:profiles(full_name, email))
    `)
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  const bookings = (dbBookings || []).map((b: any) => {
    return {
      id: b.id,
      studentName: b.student?.profile?.full_name || "Unknown Student",
      studentEmail: b.student?.profile?.email || "",
      parentName: b.parent?.profile?.full_name || "Unknown Parent",
      parentEmail: b.parent?.profile?.email || "",
      amountPaid: Number(b.amount_paid),
      status: b.status,
      paymentStatus: b.payment_status,
      createdAt: b.created_at,
    };
  });

  return {
    course: {
      id: course.id,
      title: course.title,
      description: course.description || "",
      aboutCourse: course.about_course || "",
      coverImageUrl: course.cover_image_url || "",
      subject: course.subject,
      format: course.format,
      price: Number(course.price),
      status: course.status,
      rating: Number(course.rating),
      durationDays: Number(course.duration_days || 30),
      totalSessions: Number(course.total_sessions || 10),
      sessionsPerWeek: Number(course.sessions_per_week || 2),
      classDays: course.class_days || "",
      classTiming: course.class_timing || "",
      languages: course.languages || ["English"],
      mentor: course.mentor ? {
        name: course.mentor.profile?.full_name || "Unknown Mentor",
        email: course.mentor.profile?.email || "",
        avatarUrl: course.mentor.profile?.avatar_url || "",
        qualification: course.mentor.qualification || "Educator",
        experience: course.mentor.experience || 5,
        rating: Number(course.mentor.rating || 5.0),
      } : null,
    },
    bookings,
  };
}

export async function getAdminSessionDetails(sessionId: string) {
  noStore();
  const supabase = createAdminClient();

  // 1. Fetch Session details
  const { data: session, error } = await supabase
    .from("sessions")
    .select("*, mentor:mentors(profile:profiles(full_name, avatar_url, email), qualification, experience, rating)")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    throw new Error(error ? error.message : "Session not found");
  }

  // 2. Fetch bookings for this session
  const { data: dbBookings } = await supabase
    .from("bookings")
    .select(`
      *,
      student:students(profile:profiles(full_name, email)),
      parent:parents(profile:profiles(full_name, email))
    `)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  const bookings = (dbBookings || []).map((b: any) => {
    return {
      id: b.id,
      studentName: b.student?.profile?.full_name || "Unknown Student",
      studentEmail: b.student?.profile?.email || "",
      parentName: b.parent?.profile?.full_name || "Unknown Parent",
      parentEmail: b.parent?.profile?.email || "",
      amountPaid: Number(b.amount_paid),
      status: b.status,
      paymentStatus: b.payment_status,
      createdAt: b.created_at,
    };
  });

  return {
    session: {
      id: session.id,
      title: session.title,
      description: session.description || "",
      aboutSession: session.about_session || "",
      subject: session.subject,
      type: session.type,
      price: Number(session.price),
      status: session.status,
      colorBg: session.color_bg || "#ede9fe",
      iconName: session.icon_name || "writing",
      durationOptions: session.duration_options || "60 or 90 min",
      platform: session.platform || "Zoom",
      language: session.language || "English / Hindi",
      days: session.days || "Mon – Sat",
      reschedulePolicy: session.reschedule_policy || "Up to 4 hrs before",
      sessionDate: session.session_date || "",
      sessionTime: session.session_time || "",
      isRepeatable: session.is_repeatable || false,
      mentor: session.mentor ? {
        name: session.mentor.profile?.full_name || "Unknown Mentor",
        email: session.mentor.profile?.email || "",
        avatarUrl: session.mentor.profile?.avatar_url || "",
        qualification: session.mentor.qualification || "Educator",
        experience: session.mentor.experience || 5,
        rating: Number(session.mentor.rating || 5.0),
      } : null,
    },
    bookings,
  };
}

export async function updateMentorRate(mentorId: string, rate: number) {
  noStore();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("mentors")
    .update({ hourly_rate: rate })
    .eq("id", mentorId);

  if (error) throw error;
  revalidatePath(`/admin/mentors/${mentorId}`);
  return { success: true };
}

export async function updateMentorProfileByAdmin(mentorId: string, data: {
  name: string;
  email: string;
  rate: number;
  verified: boolean;
  qualification: string;
  experience: number;
  bio: string;
}) {
  noStore();
  const supabase = createAdminClient();

  // 1. Update mentors table
  const { error: mentorError } = await supabase
    .from("mentors")
    .update({
      hourly_rate: data.rate,
      verified: data.verified,
      qualification: data.qualification,
      experience: data.experience,
      bio: data.bio
    })
    .eq("id", mentorId);

  if (mentorError) throw mentorError;

  // 2. Update profiles table
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: data.name,
      email: data.email
    })
    .eq("id", mentorId);

  if (profileError) throw profileError;

  revalidatePath(`/admin/mentors/${mentorId}`);
  return { success: true };
}


