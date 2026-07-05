const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

const mentorId = "136287b9-bc76-4f3f-bfe7-b34cd89cf288";

async function check() {
  const { data: m, error } = await supabase
    .from("mentors")
    .select("*, profile:profiles(full_name, avatar_url, email)")
    .eq("id", mentorId)
    .single();

  const { data: dbCourses } = await supabase
    .from("courses")
    .select("*, mentor:mentors(profile:profiles(full_name))")
    .eq("mentor_id", mentorId)
    .eq("status", "Active")
    .order("created_at", { ascending: false });

  const { data: dbSessions } = await supabase
    .from("sessions")
    .select("*, mentor:mentors(profile:profiles(full_name, avatar_url))")
    .eq("mentor_id", mentorId)
    .eq("status", "Active")
    .order("created_at", { ascending: false });

  console.log("courses count:", dbCourses ? dbCourses.length : 0);
  console.log("sessions count:", dbSessions ? dbSessions.length : 0);
  console.log("courses:", dbCourses);
  console.log("sessions:", dbSessions);
}

check();
