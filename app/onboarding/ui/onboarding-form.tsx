// In codetejass/alumni-connect/alumni-connect-46cbb86ccbec6bd05628c9de08ac9a0122f24892/app/onboarding/ui/onboarding-form.tsx

"use client"
import { useState } from "react"
import type React from "react"

import { createBrowserClient } from "@supabase/ssr"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { User } from "@supabase/supabase-js" // Import the User type for better type safety

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

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    // Since this page is for onboarding, we create a new profile using 'insert'.
    const { error } = await supabase.from("profiles").insert({
      id: user.id, // Use the user's ID from the prop
      role: "student", // Set a default role for new users
      full_name: fullName,
      course,
      specialization,
    })

    setLoading(false)

    if (!error) {
      // Redirect to the dashboard and refresh to get the new server state
      router.replace("/dashboard")
      router.refresh()
    } else {
      console.error("Error creating profile:", error)
      // You could add UI feedback here, like a toast notification
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
        <div className="md:col-span-2">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    </main>
  )
}
