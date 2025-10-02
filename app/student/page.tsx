// In codetejass/alumni-connect/alumni-connect-46cbb86ccbec6bd05628c9de08ac9a0122f24892/app/student/page.tsx

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Dashboard from "@/components/kokonutui/dashboard"; // Import the dashboard component

export default async function StudentDashboard() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
  
  // This part is important for security - we keep it!
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Now, instead of returning the simple text, we return the full dashboard component.
  return <Dashboard />;
}
