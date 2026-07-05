const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load Environment Variables from .env.local
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
  const { data, error } = await supabase
    .from("resources")
    .select("id")
    .limit(1);

  if (error) {
    console.log("Table check failed. Details:", error.message);
  } else {
    console.log("Table 'resources' exists! Data:", data);
  }
}

main().catch(console.error);
