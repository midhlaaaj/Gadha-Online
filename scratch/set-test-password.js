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

const studentId = "51f84eba-c1ce-418d-9995-6073d54d5b33"; // mid@gmail.com

async function main() {
  console.log("Setting password for student mid@gmail.com...");
  const { data, error } = await supabase.auth.admin.updateUserById(studentId, {
    password: "password123"
  });

  if (error) {
    console.error("❌ Failed to set password:", error.message);
  } else {
    console.log("✅ Password set successfully to 'password123'.");
  }
}

main().catch(console.error);
