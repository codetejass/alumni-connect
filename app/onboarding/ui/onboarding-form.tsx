// In codetejass/alumni-connect/alumni-connect-46cbb86ccbec6bd05628c9de08ac9a0122f24892/app/onboarding/ui/onboarding-form.tsx

"use client"
import { useState } from "react"
import type React from "react"

import { createBrowserClient } from "@supabase/ssr"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { User } from "@supabase/supabase-js"

export default function OnboardingForm({ profile, user }: { profile: any; user: User }) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const router = useRouter()
  const [fullName, setFullName] = useState(profile?.full_name ?? "")
  const [course, setCourse] = useState(profile?.course ?? "")
  const [specialization, setSpecialization] = useState(profile?.specialization ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.from("profiles").upsert({
      id: user.id, // The user's ID is the primary key
      role: profile?.role ?? "student", // Use existing role or default to "student"
      full_name: fullName,
      course,
      specialization,
    })

    setLoading(false)

    if (!error) {
      // On success, redirect and refresh
      router.replace("/dashboard")
      router.refresh()
    } else {
      setError(error.message)
      console.error("Error saving profile:", error)
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Complete your profile</h1>
        <p className="text-sm text-muted-foreground">Provide the required details to continue.</p>
      </header>
      <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label>Full Name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div>
          <Label>Course</Label>
          <Input value={course} onChange={(e) => setCourse(e.target.value)} />
        </div>
        <div>
          <Label>Specialization</Label>
          <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
        </div>
        {error && <p className="md:col-span-2 text-sm text-destructive">{error}</p>}
        <div className="md:col-span-2">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    </main>
  )
}
