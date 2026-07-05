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
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  const { data: mentors, error: mentorError } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "mentor");

  if (mentorError) {
    console.error("Error fetching mentors:", mentorError.message);
    return;
  }

  console.log(`Found ${mentors.length} mentors. Updating their passwords to 'password123'...`);

  for (const m of mentors) {
    const { error } = await supabase.auth.admin.updateUserById(m.id, {
      password: "password123"
    });

    if (error) {
      console.log(`❌ Failed to update ${m.email} (${m.id}): ${error.message}`);
    } else {
      console.log(`✅ Success: Updated password for ${m.email} (${m.full_name})`);
    }
  }
}

main().catch(console.error);
