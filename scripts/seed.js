const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// 1. Load Environment Variables from .env.local
const envPath = path.join(__dirname, "..", ".env.local");
let supabaseUrl = "";
let serviceRoleKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const urlMatch = envContent.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m);
  const keyMatch = envContent.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m);
  
  if (urlMatch) supabaseUrl = urlMatch[1].trim();
  if (keyMatch) serviceRoleKey = keyMatch[1].trim();
}

if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.includes("YOUR_SUPABASE_SERVICE_ROLE_KEY")) {
  console.error("Error: Please set NEXT_PUBLIC_SUPABASE_URL and a valid SUPABASE_SERVICE_ROLE_KEY inside your .env.local file first.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

// 2. Mock Data Definitions
const HERO_COPY = {
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

const MENTORS = [
  {
    name: "Arjun Kapoor",
    email: "arjun@tutoboard.com",
    subject: "Mathematics & Physics",
    rate: 499.00,
    bio: "IIT Delhi graduate with 8 years of experience preparing students for JEE and NEET.",
    qualification: "IIT Delhi",
    experience: 8,
    verified: true,
  },
  {
    name: "Priya Sharma",
    email: "priya@tutoboard.com",
    subject: "English & Literature",
    rate: 399.00,
    bio: "MA English from Delhi University. Specialises in essay coaching and creative writing.",
    qualification: "MA English, DU",
    experience: 6,
    verified: true,
  },
  {
    name: "Rahul Nair",
    email: "rahul@tutoboard.com",
    subject: "Computer Science",
    rate: 549.00,
    bio: "Senior engineer at a top tech firm. Teaches Python, DSA, and web development.",
    qualification: "B.Tech CS, Senior Engineer",
    experience: 7,
    verified: true,
  },
  {
    name: "Sneha Mehta",
    email: "sneha@tutoboard.com",
    subject: "Chemistry & Biology",
    rate: 449.00,
    bio: "MBBS graduate with a passion for making science concepts simple and exam-ready.",
    qualification: "MBBS",
    experience: 5,
    verified: false,
  },
  {
    name: "Vikram Khanna",
    email: "vikram@tutoboard.com",
    subject: "Mathematics & Statistics",
    rate: 459.00,
    bio: "Professional statistician and tutor specializing in exam preparation and data math.",
    qualification: "Actuary",
    experience: 9,
    verified: true,
  }
];

const COURSES = [
  {
    title: "Advanced Calculus & Algebra",
    subject: "Mathematics",
    format: "Live batch",
    price: 4999.00,
    mentor: "Arjun Kapoor",
    students_count: 1240,
    rating: 4.9,
    status: "Active",
  },
  {
    title: "Python for Beginners",
    subject: "Programming",
    format: "Live batch",
    price: 3499.00,
    mentor: "Rahul Nair",
    students_count: 892,
    rating: 4.8,
    status: "Active",
  },
  {
    title: "Chemistry: Class 11 & 12",
    subject: "Science",
    format: "Live batch",
    price: 3999.00,
    mentor: "Sneha Mehta",
    students_count: 643,
    rating: 4.7,
    status: "Active",
  },
  {
    title: "English Essay Writing",
    subject: "English",
    format: "Recorded",
    price: 999.00,
    mentor: "Priya Sharma",
    students_count: 410,
    rating: 4.6,
    status: "Draft",
  },
  {
    title: "NEET Biology Crash Course",
    subject: "Science",
    format: "Live batch",
    price: 6499.00,
    mentor: "Sneha Mehta",
    students_count: 780,
    rating: 4.9,
    status: "Active",
  }
];

const SESSIONS = [
  {
    title: "English Essay Writing",
    mentor: "Priya Sharma",
    type: "1-on-1",
    description: "Improve essay structure, argumentation and grammar with live feedback and doubt-clearing.",
    bookings_count: 98,
    subject: "English",
    price: 399.00,
    status: "Active",
    color_bg: "#ede9fe",
    icon_name: "writing",
  },
  {
    title: "Statistics & Probability",
    mentor: "Arjun Kapoor",
    type: "1-on-1",
    description: "Confidence intervals, hypothesis testing and data interpretation for JEE & board exams.",
    bookings_count: 115,
    subject: "Mathematics",
    price: 449.00,
    status: "Active",
    color_bg: "#dbeafe",
    icon_name: "calculator",
  },
  {
    title: "Python Doubt-Solving",
    mentor: "Rahul Nair",
    type: "Group",
    description: "Live code reviews, debugging help and concept clarification for Python learners of all levels.",
    bookings_count: 203,
    subject: "Programming",
    price: 549.00,
    status: "Active",
    color_bg: "#dcfce7",
    icon_name: "code",
  },
  {
    title: "Physics Problem-Solving",
    mentor: "Arjun Kapoor",
    type: "1-on-1",
    description: "Mechanics, electrostatics and optics problem-sets worked through in real time.",
    bookings_count: 154,
    subject: "Science",
    price: 499.00,
    status: "Inactive",
    color_bg: "#dbeafe",
    icon_name: "science",
  },
  {
    title: "Chemistry Concept Clarification",
    mentor: "Sneha Mehta",
    type: "1-on-1",
    description: "Organic and inorganic chemistry explained simply for NEET and Class 12 students.",
    bookings_count: 86,
    subject: "Science",
    price: 449.00,
    status: "Active",
    color_bg: "#fef9c3",
    icon_name: "flask",
  }
];

const TESTIMONIALS = [
  {
    student_name: "Rohan Agarwal",
    role: "JEE Advanced 2024 — AIR 412",
    quote: "Tutoboard helped me crack JEE Advanced. Arjun sir's sessions were incredibly structured and the doubt-clearing was instant.",
    rating: 5,
    show_on_site: true,
    avatar_bg: "#1B3A6B",
    avatar_text: "RA",
  },
  {
    student_name: "Aisha Naik",
    role: "Class 12, CBSE Board 2024",
    quote: "I improved my English essay score from a C to an A in just 6 sessions. Priya ma'am really knows her craft.",
    rating: 5,
    show_on_site: true,
    avatar_bg: "#993556",
    avatar_text: "AN",
  },
  {
    student_name: "Karan Patel",
    role: "Placed at Google, 2025",
    quote: "Rahul sir made DSA feel like a breeze. Got placed at my dream company within 3 months of starting the course.",
    rating: 5,
    show_on_site: false,
    avatar_bg: "#0F6E56",
    avatar_text: "KP",
  },
  {
    student_name: "Maya Verma",
    role: "Class 10, ICSE 2024",
    quote: "The live math classes were amazing. I could ask questions directly and practice worksheets were really detailed.",
    rating: 4,
    show_on_site: true,
    avatar_bg: "#534AB7",
    avatar_text: "MV",
  }
];

// 3. Execution Function
async function seed() {
  console.log("🚀 Starting programatic Supabase backend seed...");

  // A. Seed Homepage settings (upsert id=1)
  const { error: settingsError } = await supabase
    .from("homepage_settings")
    .upsert({ id: 1, ...HERO_COPY });
  if (settingsError) {
    console.error("❌ Failed to seed homepage settings:", settingsError.message);
  } else {
    console.log("✅ Seeded homepage settings.");
  }

  // B. Seed Mentors (auth + profiles + mentors tables)
  const mentorNameMap = {};

  for (const m of MENTORS) {
    // Check if user already exists
    const { data: existingProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", m.email)
      .maybeSingle();

    let mentorId = existingProfiles?.id;

    if (!mentorId) {
      // Create auth login
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: m.email,
        password: "password123", // default password
        email_confirm: true,
        user_metadata: {
          full_name: m.name,
          role: "mentor",
        }
      });

      if (authError || !authUser.user) {
        console.error(`❌ Failed to create auth profile for ${m.name}:`, authError?.message);
        continue;
      }
      mentorId = authUser.user.id;
    }

    mentorNameMap[m.name] = mentorId;

    // Sync profiles full_name
    await supabase.from("profiles").update({ full_name: m.name }).eq("id", mentorId);

    // Sync mentor fields
    const expertiseArray = m.subject.split("&").map(s => s.trim());
    const { error: mErr } = await supabase
      .from("mentors")
      .update({
        bio: m.bio,
        expertise: expertiseArray,
        hourly_rate: m.rate,
        qualification: m.qualification,
        experience: m.experience,
        verified: m.verified,
        is_active: true,
      })
      .eq("id", mentorId);

    if (mErr) {
      console.error(`❌ Failed to update mentor profile for ${m.name}:`, mErr.message);
    } else {
      console.log(`✅ Provisioned mentor: ${m.name}`);
    }
  }

  // C. Seed Courses
  for (const c of COURSES) {
    const mentorId = mentorNameMap[c.mentor];
    
    // Check if course exists
    const { data: existingCourse } = await supabase
      .from("courses")
      .select("id")
      .eq("title", c.title)
      .maybeSingle();

    const courseData = {
      title: c.title,
      description: `Structured course program in ${c.subject}.`,
      subject: c.subject,
      format: c.format,
      price: c.price,
      mentor_id: mentorId || null,
      students_count: c.students_count,
      rating: c.rating,
      status: c.status,
    };

    if (existingCourse) {
      await supabase.from("courses").update(courseData).eq("id", existingCourse.id);
    } else {
      await supabase.from("courses").insert([courseData]);
    }
  }
  console.log("✅ Seeded popular courses.");

  // D. Seed Sessions
  for (const s of SESSIONS) {
    const mentorId = mentorNameMap[s.mentor];
    if (!mentorId) continue;

    // Check if session exists
    const { data: existingSession } = await supabase
      .from("sessions")
      .select("id")
      .eq("title", s.title)
      .maybeSingle();

    const sessionData = {
      title: s.title,
      description: s.description,
      mentor_id: mentorId,
      subject: s.subject,
      type: s.type,
      bookings_count: s.bookings_count,
      price: s.price,
      status: s.status,
      color_bg: s.color_bg,
      icon_name: s.icon_name,
    };

    if (existingSession) {
      await supabase.from("sessions").update(sessionData).eq("id", existingSession.id);
    } else {
      await supabase.from("sessions").insert([sessionData]);
    }
  }
  console.log("✅ Seeded hourly sessions.");

  // E. Seed Testimonials
  for (const t of TESTIMONIALS) {
    const { data: existingTesti } = await supabase
      .from("testimonials")
      .select("id")
      .eq("student_name", t.student_name)
      .maybeSingle();

    if (existingTesti) {
      await supabase.from("testimonials").update(t).eq("id", existingTesti.id);
    } else {
      await supabase.from("testimonials").insert([t]);
    }
  }
  console.log("✅ Seeded student testimonials.");

  console.log("\n🎉 Database seed complete! All mock systems are fully hydrated.");
}

seed();
