import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import OnboardingForm from "./ui/onboarding-form"

export default async function OnboardingPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } },
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
  return <OnboardingForm profile={profile || null} />
}
