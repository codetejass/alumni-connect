"use client"
import { useState } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Role = "student" | "alumni" | "recruiter"

export default function SignUpPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const [role, setRole] = useState<Role>("student")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [admissionId, setAdmissionId] = useState("")
  const [recruiterId, setRecruiterId] = useState("")
  const [course, setCourse] = useState("")
  const [specialization, setSpecialization] = useState("")
  const [docUrl, setDocUrl] = useState("") // alumni document URL for verification
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data: signUp, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_SUPABASE_SIGNUP_REDIRECT || `${window.location.origin}/auth/sign-up-success`,
        },
      })
      if (signUpError) throw signUpError
      // Do NOT insert into DB here: at this point, the user may not have an active session yet.
      // RLS requires auth.uid() = id; without a session, inserts will fail.
      router.replace("/auth/sign-up-success")
    } catch (err: any) {
      setError(err.message || "Sign up failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-balance">Create an account</h1>
          <p className="text-sm text-muted-foreground text-pretty">Choose your role and complete the details.</p>
        </header>

        <form onSubmit={handleSignUp} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          {(role === "student" || role === "alumni") && (
            <>
              <div>
                <Label htmlFor="admissionId">Admission ID</Label>
                <Input id="admissionId" value={admissionId} onChange={(e) => setAdmissionId(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="course">Course</Label>
                <Input id="course" value={course} onChange={(e) => setCourse(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="spec">Specialization</Label>
                <Input id="spec" value={specialization} onChange={(e) => setSpecialization(e.target.value)} required />
              </div>
            </>
          )}

          {role === "recruiter" && (
            <div className="md:col-span-2">
              <Label htmlFor="recruiterId">Recruiter Registration ID (from institute)</Label>
              <Input id="recruiterId" value={recruiterId} onChange={(e) => setRecruiterId(e.target.value)} required />
            </div>
          )}

          {role === "alumni" && (
            <div className="md:col-span-2">
              <Label htmlFor="docUrl">Marksheet/Certificate URL (for verification)</Label>
              <Input id="docUrl" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://..." />
              <p className="mt-1 text-xs text-muted-foreground">
                For secure uploads, we’ll enable storage later. For now, paste a temporary accessible URL for
                verification.
              </p>
            </div>
          )}

          <div className="md:col-span-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="md:col-span-2 text-sm text-destructive">{error}</p>}

          <div className="md:col-span-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
