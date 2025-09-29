// In codetejass/alumni-connect/alumni-connect-46cbb86ccbec6bd05628c9de08ac9a0122f24892/app/onboarding/ui/onboarding-form.tsx

"use client"
import { useState } from "react"
import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function OnboardingForm({ profile }: { profile: any }) {
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

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          course,
          specialization,
          // The API route will automatically handle the user ID and role
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "An unknown error occurred.")
      }

      // On success, redirect and refresh the page to get the new server state
      router.replace("/dashboard")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      console.error("Error saving profile:", err)
    } finally {
      setLoading(false)
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
