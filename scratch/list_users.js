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
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role");

  if (error) {
    console.error("Error fetching profiles:", error.message);
    return;
  }

  console.log("Profiles list in DB:");
  console.table(profiles);
}

main().catch(console.error);
