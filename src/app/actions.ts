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
    subject: course.subject,
    format: course.format,
    price: Number(course.price),
    mentor_id: mentorId,
    status: course.status,
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
