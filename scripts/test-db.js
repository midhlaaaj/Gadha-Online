import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const testId = "123e4567-e89b-12d3-a456-426614174000";

  // Cleanup first just in case
  await adminClient.from('profiles').delete().eq('id', testId);

  console.log("Testing insert into profiles...");
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert([{
        id: testId,
        email: 'test_insert@example.com',
        full_name: 'Test Insert',
        role: 'mentor'
    }]);
  if (profileError) {
    console.error("Profiles insert failed:", profileError);
    return;
  }
  console.log("Profiles insert succeeded.");

  console.log("Testing insert into mentors...");
  const { error: mentorError } = await adminClient
    .from('mentors')
    .insert([{
        id: testId,
        hourly_rate: 0.00,
        expertise: []
    }]);
  
  if (mentorError) {
    console.error("Mentors insert failed:", mentorError);
  } else {
    console.log("Mentors insert succeeded.");
  }
}

main().catch(console.error);
