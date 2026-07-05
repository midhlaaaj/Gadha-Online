const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

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

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const studentId = "22222222-2222-2222-2222-222222222222";

async function main() {
  console.log("🚀 Seeding LMS backend data for student Aarav Kumar...");

  // 1. Fetch student bookings to link correctly
  const { data: bookings, error: bookingsErr } = await supabase
    .from("bookings")
    .select("id, session_id, course_id")
    .eq("student_id", studentId);

  if (bookingsErr || !bookings || bookings.length === 0) {
    console.error("❌ No bookings found for the test student. Run parent_pages_setup.sql / seed.js first.");
    return;
  }

  const mainBooking = bookings[0];

  // 2. Fetch mentor ids
  const { data: mentors } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "mentor");

  const arjunMentor = mentors.find(m => m.full_name.includes("Arjun")) || mentors[0];
  const priyaMentor = mentors.find(m => m.full_name.includes("Priya")) || mentors[0];
  const rahulMentor = mentors.find(m => m.full_name.includes("Rahul")) || mentors[0];

  // 3. Clear existing classes, attendance, and assignments for clean seed
  console.log("🧹 Cleaning old LMS records...");
  await supabase.from("attendance_records").delete().eq("student_id", studentId);
  await supabase.from("assignments").delete().eq("student_id", studentId);
  await supabase.from("scheduled_classes").delete().eq("student_id", studentId);

  // 4. Seed Scheduled Classes
  console.log("📅 Seeding scheduled classes...");
  const now = new Date();
  
  // Class 1: Live right now (started 5 mins ago)
  const liveClassTime = new Date(now.getTime() - 5 * 60 * 1000);
  
  // Class 2: Upcoming tomorrow
  const upcomingClassTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Class 3: Completed yesterday
  const completedClassTime1 = new Date(now.getTime() - 25 * 60 * 60 * 1000);

  // Class 4: Completed 3 days ago
  const completedClassTime2 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const classesToInsert = [
    {
      booking_id: mainBooking.id,
      student_id: studentId,
      mentor_id: arjunMentor.id,
      title: "Introduction to Probability & Statistics",
      subject: "Mathematics",
      scheduled_at: liveClassTime.toISOString(),
      duration_minutes: 60,
      status: "scheduled",
      join_url: "https://zoom.us/j/1234567890",
      icon_name: "calculator"
    },
    {
      booking_id: mainBooking.id,
      student_id: studentId,
      mentor_id: rahulMentor.id,
      title: "Mastering Python Loops & Lists",
      subject: "Programming",
      scheduled_at: upcomingClassTime.toISOString(),
      duration_minutes: 90,
      status: "scheduled",
      join_url: "https://zoom.us/j/0987654321",
      icon_name: "code"
    },
    {
      booking_id: mainBooking.id,
      student_id: studentId,
      mentor_id: priyaMentor.id,
      title: "English Writing: Structuring Essays",
      subject: "English",
      scheduled_at: completedClassTime1.toISOString(),
      duration_minutes: 60,
      status: "completed",
      recording_url: "https://vimeo.com/showcase/123",
      icon_name: "pencil"
    },
    {
      booking_id: mainBooking.id,
      student_id: studentId,
      mentor_id: arjunMentor.id,
      title: "Algebra & Permutations Practice",
      subject: "Mathematics",
      scheduled_at: completedClassTime2.toISOString(),
      duration_minutes: 60,
      status: "completed",
      recording_url: "https://vimeo.com/showcase/456",
      icon_name: "math"
    }
  ];

  const { data: insertedClasses, error: classErr } = await supabase
    .from("scheduled_classes")
    .insert(classesToInsert)
    .select();

  if (classErr) {
    console.error("❌ Failed to seed scheduled classes:", classErr.message);
    return;
  }
  console.log("✅ Seeded scheduled classes.");

  // 5. Seed Attendance Records
  console.log("📝 Seeding attendance records...");
  const completedClass1 = insertedClasses.find(c => c.title.includes("English"));
  const completedClass2 = insertedClasses.find(c => c.title.includes("Algebra"));

  const attendanceToInsert = [
    {
      student_id: studentId,
      scheduled_class_id: completedClass1.id,
      booking_id: mainBooking.id,
      session_date: new Date(completedClassTime1).toISOString().split('T')[0],
      subject: "English",
      status: "present",
      notes: "Aarav participated actively in structured essay drafting."
    },
    {
      student_id: studentId,
      scheduled_class_id: completedClass2.id,
      booking_id: mainBooking.id,
      session_date: new Date(completedClassTime2).toISOString().split('T')[0],
      subject: "Mathematics",
      status: "present",
      notes: "Late to class by 5 minutes, but completed all worksheets."
    },
    // Adding general attendance rows for stats rate calculation (e.g. 5 present, 1 absent)
    {
      student_id: studentId,
      booking_id: mainBooking.id,
      session_date: "2026-06-20",
      subject: "Mathematics",
      status: "present"
    },
    {
      student_id: studentId,
      booking_id: mainBooking.id,
      session_date: "2026-06-18",
      subject: "Programming",
      status: "present"
    },
    {
      student_id: studentId,
      booking_id: mainBooking.id,
      session_date: "2026-06-15",
      subject: "Mathematics",
      status: "absent",
      notes: "Absent due to school tournament."
    },
    {
      student_id: studentId,
      booking_id: mainBooking.id,
      session_date: "2026-06-12",
      subject: "English",
      status: "present"
    }
  ];

  const { error: attErr } = await supabase
    .from("attendance_records")
    .insert(attendanceToInsert);

  if (attErr) {
    console.error("❌ Failed to seed attendance:", attErr.message);
  } else {
    console.log("✅ Seeded attendance history.");
  }

  // 6. Seed Assignments
  console.log("📚 Seeding assignments...");
  const assignmentsToInsert = [
    {
      student_id: studentId,
      booking_id: mainBooking.id,
      title: "Probability Distribution Worksheet",
      subject: "Mathematics",
      due_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
      status: "pending",
      created_by: arjunMentor.id
    },
    {
      student_id: studentId,
      booking_id: mainBooking.id,
      title: "Basic Python Syntax Practice",
      subject: "Programming",
      due_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
      status: "pending",
      created_by: rahulMentor.id
    },
    {
      student_id: studentId,
      booking_id: mainBooking.id,
      title: "Essay Draft: Argumentative Writing",
      subject: "English",
      due_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "submitted",
      score: 85.00,
      feedback: "Great structure. Watch out for grammatical transitions in body paragraphs.",
      created_by: priyaMentor.id
    },
    {
      student_id: studentId,
      booking_id: mainBooking.id,
      title: "Permutations & Combinations Quiz",
      subject: "Mathematics",
      due_date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "submitted",
      score: 95.00,
      feedback: "Perfect score on combinations logic!",
      created_by: arjunMentor.id
    }
  ];

  const { error: assignErr } = await supabase
    .from("assignments")
    .insert(assignmentsToInsert);

  if (assignErr) {
    console.error("❌ Failed to seed assignments:", assignErr.message);
  } else {
    console.log("✅ Seeded assignments.");
  }

  console.log("\n🎉 LMS database seeding completed successfully!");
}

main().catch(console.error);
