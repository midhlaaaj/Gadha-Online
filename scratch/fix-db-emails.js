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

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log("Reading student invitations...");
  const { data, error } = await supabase.from("student_invitations").select("id, email");
  if (error) {
    console.error("Error reading invitations:", error.message);
    return;
  }

  for (const row of data) {
    const lowerEmail = row.email.toLowerCase();
    if (row.email !== lowerEmail) {
      const { error: updateErr } = await supabase
        .from("student_invitations")
        .update({ email: lowerEmail })
        .eq("id", row.id);
      if (updateErr) {
        console.error(`Failed to update ${row.email}:`, updateErr.message);
      } else {
        console.log(`Updated: ${row.email} -> ${lowerEmail}`);
      }
    }
  }

  console.log("Casing fix complete!");
}

main().catch(console.error);
