import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  const email = `test_mentor_${Date.now()}@tutoboard.com`;
  console.log("Creating user:", email);
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: "password123",
    email_confirm: true,
  });

  if (error) {
    console.error("Failed to create user:");
    console.error(JSON.stringify(error, null, 2));
    console.error("Error details:", error);
  } else {
    console.log("Successfully created user:", data.user.id);
  }
}

main().catch(console.error);
