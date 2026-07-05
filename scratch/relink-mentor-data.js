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

const supabase = createClient(supabaseUrl, serviceRoleKey);

const OLD_MENTOR_ID = "00000000-0000-0000-0000-000000000001";
const NEW_MENTOR_ID = "ff977d83-c7a4-44d0-86aa-2bc9f3a41344";

async function main() {
  console.log("Re-linking mock mentor data to active mentor account...");

  // Verify active mentor exists in public.mentors
  const { data: mentorExists, error: checkErr } = await supabase
    .from("mentors")
    .select("id")
    .eq("id", NEW_MENTOR_ID)
    .single();

  if (checkErr || !mentorExists) {
    console.log("Active mentor not found in public.mentors, inserting row...");
    await supabase.from("mentors").insert([
      {
        id: NEW_MENTOR_ID,
        hourly_rate: 499.00,
        expertise: ["Mathematics", "Physics"],
        qualification: "IIT Delhi Graduate",
        experience: 8,
        verified: true,
        is_active: true
      }
    ]);
  }

  // 1. Relink sessions
  const { error: sessErr } = await supabase
    .from("sessions")
    .update({ mentor_id: NEW_MENTOR_ID })
    .eq("mentor_id", OLD_MENTOR_ID);
  if (sessErr) console.error("Session update failed:", sessErr.message);
  else console.log("✅ Sessions re-linked successfully.");

  // 2. Relink courses
  const { error: courseErr } = await supabase
    .from("courses")
    .update({ mentor_id: NEW_MENTOR_ID })
    .eq("mentor_id", OLD_MENTOR_ID);
  if (courseErr) console.error("Courses update failed:", courseErr.message);
  else console.log("✅ Courses re-linked successfully.");

  // 3. Relink scheduled classes
  const { error: classErr } = await supabase
    .from("scheduled_classes")
    .update({ mentor_id: NEW_MENTOR_ID })
    .eq("mentor_id", OLD_MENTOR_ID);
  if (classErr) console.error("Scheduled classes update failed:", classErr.message);
  else console.log("✅ Scheduled classes re-linked successfully.");

  // 4. Relink assignments
  const { error: assignErr } = await supabase
    .from("assignments")
    .update({ created_by: NEW_MENTOR_ID })
    .eq("created_by", OLD_MENTOR_ID);
  if (assignErr) console.error("Assignments update failed:", assignErr.message);
  else console.log("✅ Assignments re-linked successfully.");

  // 5. Check scheduled classes and see if we need to add a few for today/tomorrow to demo
  const { data: existingClasses } = await supabase
    .from("scheduled_classes")
    .select("id")
    .eq("mentor_id", NEW_MENTOR_ID);

  if (!existingClasses || existingClasses.length === 0) {
    console.log("No scheduled classes found. Creating a test scheduled class...");
    
    // Find a booking
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, student_id")
      .limit(1);

    if (bookings && bookings.length > 0) {
      const b = bookings[0];
      const today = new Date();
      today.setHours(15, 0, 0, 0); // 3 PM today
      
      const { error: insertErr } = await supabase
        .from("scheduled_classes")
        .insert([
          {
            booking_id: b.id,
            student_id: b.student_id,
            mentor_id: NEW_MENTOR_ID,
            title: "Statistics & Probability Live Session",
            subject: "Mathematics",
            scheduled_at: today.toISOString(),
            duration_minutes: 60,
            status: "scheduled",
            join_url: "https://meet.google.com/abc-defg-hij",
            icon_name: "calculator"
          }
        ]);

      if (insertErr) console.error("Failed to insert class:", insertErr.message);
      else console.log("✅ Created a test scheduled class for today.");
    }
  }

  console.log("All data setup complete!");
}

main().catch(console.error);
