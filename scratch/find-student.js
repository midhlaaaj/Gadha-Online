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

async function main() {
  const { data: users, error: err1 } = await supabase.auth.admin.listUsers();
  if (err1) {
    console.error("Error listing users:", err1.message);
    return;
  }
  console.log("Auth users count:", users.users.length);
  for (const u of users.users) {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Metadata:`, u.user_metadata);
  }

  const { data: students, error: err2 } = await supabase.from("students").select("*, profiles(*)");
  if (err2) {
    console.error("Error fetching students:", err2.message);
  } else {
    console.log("Students rows:", students);
  }
}

main().catch(console.error);
