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

// Import the function mapping or simulate getMentorDetailsData query
const mentorId = "136287b9-bc76-4f3f-bfe7-b34cd89cf288";

async function check() {
  const { data: dbCourses } = await supabase
    .from("courses")
    .select("*, mentor:mentors(profile:profiles(full_name))")
    .eq("mentor_id", mentorId);

  const { data: dbSessions } = await supabase
    .from("sessions")
    .select("*, mentor:mentors(profile:profiles(full_name, avatar_url))")
    .eq("mentor_id", mentorId);

  console.log("dbCourses length:", dbCourses.length);
  console.log("dbSessions length:", dbSessions.length);
}

check();
