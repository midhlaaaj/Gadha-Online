"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

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

  const mentors = (dbMentors || []).map((m: any) => {
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
  const supabase = await createClient();

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

  // 3. Get All Courses
  const { data: dbCourses } = await supabase
    .from("courses")
    .select("*, mentor:mentors(profile:profiles(full_name))")
    .order("created_at", { ascending: false });

  const courses = (dbCourses || []).map((c: any) => {
    const style = mapSubjectToStyle(c.subject);
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
      students: c.students_count,
      rating: Number(c.rating),
      status: c.status,
      learningOutcomes: c.learning_outcomes || [],
      curriculum: c.curriculum || [],
      inclusions: c.inclusions || [],
      batchStartDate: c.batch_start_date || "",
      batchEndDate: c.batch_end_date || "",
      classDays: c.class_days || "",
      classTiming: c.class_timing || "",
      colorBg: style.colorBg,
      iconName: style.iconName,
    };
  });

  // 4. Get All Sessions
  const { data: dbSessions } = await supabase
    .from("sessions")
    .select("*, mentor:mentors(profile:profiles(full_name, avatar_url))")
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
      aboutSession: s.about_session || "",
      whatsCovered: s.whats_covered || [],
      inclusions: s.inclusions || [],
      durationOptions: s.duration_options || "60 or 90 min",
      platform: s.platform || "Zoom",
      language: s.language || "English / Hindi",
      days: s.days || "Mon – Sat",
      reschedulePolicy: s.reschedule_policy || "Up to 4 hrs before",
    };
  });

  // 5. Get All Mentors
  const { data: dbMentors } = await supabase
    .from("mentors")
    .select("*, profile:profiles(full_name, avatar_url, email)")
    .order("created_at", { ascending: false });

  const mentors = (dbMentors || []).map((m: any) => {
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
    updated_at: new Date().toISOString(),
  };

  const isNew = !course.id || course.id.startsWith("c-");

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
    status: session.status,
    color_bg: session.colorBg || "#ede9fe",
    icon_name: session.iconName || "writing",
    about_session: session.aboutSession || "",
    whats_covered: session.whatsCovered || [],
    inclusions: session.inclusions || [],
    duration_options: session.durationOptions || "60 or 90 min",
    platform: session.platform || "Zoom",
    language: session.language || "English / Hindi",
    days: session.days || "Mon – Sat",
    reschedule_policy: session.reschedulePolicy || "Up to 4 hrs before",
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
  const adminClient = createAdminClient();

  const isNew = !mentor.id || mentor.id.startsWith("m-");

  if (isNew) {
    const email = `${mentor.name.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now()}@tutoboard.com`;
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: "password123",
      email_confirm: true,
      user_metadata: {
        full_name: mentor.name,
        role: "mentor",
      },
    });

    if (authError || !authUser.user) {
      console.error("DEBUG AUTH ERROR:", authError);
      throw new Error(authError ? `AuthError: ${authError.message || JSON.stringify(authError)}` : "Failed to create authentication profile.");
    }

    const mentorId = authUser.user.id;

    const expertiseArray = mentor.subject
      ? mentor.subject.split("&").map((s: string) => s.trim())
      : ["Mathematics"];

    const { error: mentorUpdateErr } = await supabase
      .from("mentors")
      .update({
        bio: mentor.bio || "",
        expertise: expertiseArray,
        hourly_rate: Number(mentor.rate),
        qualification: mentor.qualification || "Educator",
        experience: Number(mentor.experience || 1),
        verified: mentor.verified || false,
      })
      .eq("id", mentorId);

    if (mentorUpdateErr) throw new Error(mentorUpdateErr.message);
  } else {
    const expertiseArray = mentor.subject
      ? mentor.subject.split("&").map((s: string) => s.trim())
      : ["Mathematics"];

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ full_name: mentor.name })
      .eq("id", mentor.id);

    if (profileErr) throw new Error(profileErr.message);

    const { error: mentorErr } = await supabase
      .from("mentors")
      .update({
        bio: mentor.bio,
        expertise: expertiseArray,
        hourly_rate: Number(mentor.rate),
        qualification: mentor.qualification,
        experience: Number(mentor.experience),
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
  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
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
    };
  });
}

export async function getCourseDetails(id: string) {
  const supabase = await createClient();

  // 1. Fetch Course details
  const { data: c, error } = await supabase
    .from("courses")
    .select("*, mentor:mentors(profile:profiles(full_name, avatar_url, email), expertise, rating, qualification, experience, bio)")
    .eq("id", id)
    .single();

  if (error || !c) {
    throw new Error(error ? error.message : "Course not found");
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
    },
    students: c.students_count,
    rating: Number(c.rating),
    learningOutcomes: c.learning_outcomes || [],
    curriculum: c.curriculum || [],
    inclusions: c.inclusions || [],
    batchStartDate: c.batch_start_date || "",
    batchEndDate: c.batch_end_date || "",
    classDays: c.class_days || "",
    classTiming: c.class_timing || "",
    coverImageUrl: c.cover_image_url || "",
    colorBg: style.colorBg,
    iconName: style.iconName,
  };

  // 2. Fetch Related Courses (same category/subject, excluding current course)
  const { data: dbRelated } = await supabase
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
    const { data: dbBackup } = await supabase
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
    aboutSession: s.about_session || "",
    whatsCovered: s.whats_covered || [],
    inclusions: s.inclusions || [],
    durationOptions: s.duration_options || "60 or 90 min",
    platform: s.platform || "Zoom",
    language: s.language || "English / Hindi",
    days: s.days || "Mon – Sat",
    reschedulePolicy: s.reschedule_policy || "Up to 4 hrs before",
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

  return (dbMentors || []).map((m: any) => {
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

  return {
    mentor: mentorMapped,
    courses: coursesMapped,
    sessions: sessionsMapped,
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
    .eq("parent_id", user.id);

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

  const { error } = await supabase
    .from("student_invitations")
    .insert([
      {
        parent_id: user.id,
        email: data.email,
        full_name: data.name,
        grade_level: data.grade,
        status: "pending"
      }
    ]);

  if (error) throw new Error(error.message);

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
      student:students(profile:profiles(full_name)),
      session:sessions(title, type, price, subject, color_bg, icon_name, mentor:mentors(profile:profiles(full_name))),
      course:courses(title, format, price, subject, mentor:mentors(profile:profiles(full_name)))
    `)
    .eq("parent_id", user.id);

  if (error) throw new Error(error.message);

  return (dbBookings || []).map((b: any) => {
    const childName = b.student?.profile?.full_name || "Unknown Child";
    const childInitials = childName.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();

    const isCourse = !!b.course_id;
    const target = isCourse ? b.course : b.session;

    const mentorName = target?.mentor?.profile?.full_name || "Unknown Mentor";

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
      dateTime: !isCourse ? "Wed, 18 Jun · 9:00 AM" : "Enrolled · 8 weeks", // Mock default timestamps
      duration: !isCourse ? "60 min" : "Week 3 of 8",
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
