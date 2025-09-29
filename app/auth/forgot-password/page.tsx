"use client"

import type React from "react"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")
    setError(null)
    try {
      const redirectTo =
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/reset-password`

      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })
      if (resetErr) throw resetErr
      setStatus("sent")
    } catch (err: any) {
      setError(err?.message || "Something went wrong")
      setStatus("error")
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-2 text-2xl font-semibold text-pretty">Forgot password</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Enter your account email and we’ll send you a secure link to reset your password.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm">Email</span>
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu"
          />
        </label>
        <Button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Sending..." : "Send reset link"}
        </Button>
        {status === "sent" && <p className="text-sm text-green-600">Check your email for the reset link.</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </main>
  )
}