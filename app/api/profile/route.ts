import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } },
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ profile: data })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const {
    role, // used only on first insert; ignored on updates for non-admins
    full_name,
    admission_id,
    recruiter_registration_id,
    institute_email,
    course,
    specialization,
    mentorship_enabled,
  } = body || {}

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } },
  )

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Try to read existing profile
  const { data: existing } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  if (!existing) {
    // First insert: allowed by RLS only if auth.uid() = id. Role 'admin' is blocked by policy unless admin (use bootstrap script).
    const insertPayload: any = {
      id: user.id,
      role: role && role !== "admin" ? role : "student", // safe default if omitted or admin attempted
      full_name: full_name ?? null,
      admission_id: admission_id ?? null,
      recruiter_registration_id: recruiter_registration_id ?? null,
      institute_email: institute_email ?? user.email ?? null,
      course: course ?? null,
      specialization: specialization ?? null,
      mentorship_enabled: role === "alumni" ? Boolean(mentorship_enabled) : null,
    }

    const { error: insertErr } = await supabase.from("profiles").insert(insertPayload)
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 400 })

    return NextResponse.json({ ok: true, created: true })
  }

  // Update: non-admins cannot change role anymore (enforced at DB level via WITH CHECK)
  const updatePayload: any = {
    full_name: full_name ?? existing.full_name,
    admission_id: admission_id ?? existing.admission_id,
    recruiter_registration_id: recruiter_registration_id ?? existing.recruiter_registration_id,
    institute_email: institute_email ?? existing.institute_email,
    course: course ?? existing.course,
    specialization: specialization ?? existing.specialization,
    mentorship_enabled: typeof mentorship_enabled === "boolean" ? mentorship_enabled : existing.mentorship_enabled,
  }

  const { error: updateErr } = await supabase.from("profiles").update(updatePayload).eq("id", user.id)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 })

  return NextResponse.json({ ok: true, updated: true })
}
