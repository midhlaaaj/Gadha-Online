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

async function main() {
  const { data: bookings } = await supabase.from("bookings").select("id, parent_id, student_id, session_id, course_id, status, amount_paid");
  console.log("Bookings:");
  console.table(bookings);

  const { data: sessions } = await supabase.from("sessions").select("id, title, mentor_id, subject");
  console.log("Sessions:");
  console.table(sessions);

  const { data: courses } = await supabase.from("courses").select("id, title, mentor_id, subject");
  console.log("Courses:");
  console.table(courses);
}

main().catch(console.error);
