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

const MENTOR_IDS = [
  "00000000-0000-0000-0000-000000000001", // arjun@tutoboard.com
  "00000000-0000-0000-0000-000000000002", // priya@tutoboard.com
  "00000000-0000-0000-0000-000000000003", // rahul@tutoboard.com
  "00000000-0000-0000-0000-000000000004", // sneha@tutoboard.com
  "00000000-0000-0000-0000-000000000005"  // vikram@tutoboard.com
];

async function main() {
  console.log("Setting passwords to 'password123' for all mentor test accounts...");
  
  for (const mentorId of MENTOR_IDS) {
    const { data: user, error: getError } = await supabase.auth.admin.getUserById(mentorId);
    if (getError || !user) {
      console.log(`⚠️ User ID ${mentorId} not found in auth.users, skipping.`);
      continue;
    }

    const email = user.user.email;
    const { error } = await supabase.auth.admin.updateUserById(mentorId, {
      password: "password123"
    });

    if (error) {
      console.error(`❌ Failed to set password for ${email}:`, error.message);
    } else {
      console.log(`✅ Password set to 'password123' for ${email}`);
    }
  }
}

main().catch(console.error);
