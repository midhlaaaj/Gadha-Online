const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper functions copied from actions.ts mapping logic to run exactly as actions.ts does
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

function mapSubjectToStyle(subject) {
  switch (subject) {
    case "Mathematics": return { colorBg: "bg-blue-50", iconName: "math" };
    case "Science": return { colorBg: "bg-yellow-50", iconName: "flask" };
    case "Programming": return { colorBg: "bg-green-50", iconName: "code" };
    case "English": return { colorBg: "bg-purple-50", iconName: "writing" };
    default: return { colorBg: "bg-slate-50", iconName: "book" };
  }
}

async function testHomepage() {
  const { data: dbCourses } = await supabase
    .from("courses")
    .select("*, mentor:mentors(profile:profiles(full_name))")
    .eq("status", "Active")
    .order("created_at", { ascending: false });

  const courses = (dbCourses || []).map((c) => {
    const style = mapSubjectToStyle(c.subject);
    return {
      title: c.title,
      created_at: c.created_at,
      coverImageUrl: c.cover_image_url
    };
  });

  const { data: dbSessions } = await supabase
    .from("sessions")
    .select("*, mentor:mentors(profile:profiles(full_name, avatar_url))")
    .eq("status", "Active")
    .order("created_at", { ascending: false });

  const sessions = (dbSessions || []).map((s) => {
    return {
      title: s.title,
      created_at: s.created_at
    };
  });

  console.log("Returned Courses:", courses);
  console.log("Returned Sessions:", sessions);
}

testHomepage();
