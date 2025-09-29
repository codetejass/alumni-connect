import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export default async function AlumniDashboard() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } },
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Alumni Dashboard</h1>
      <p className="text-muted-foreground mt-1">Share updates, manage mentorship.</p>
    </main>
  )
}
