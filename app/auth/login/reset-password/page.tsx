"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<"idle" | "updating" | "done" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Try to establish a session from the recovery link, then allow the user to set a new password.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // First try code-based exchange (newer links)
        await supabase.auth.exchangeCodeForSession(window.location.href)
      } catch {
        // If the link uses an access_token hash, the auth state change handler below will still catch it.
      }

      // A minimal wait to ensure session propagation
      const { data } = await supabase.auth.getSession()
      if (!cancelled) setReady(!!data.session)
    })()
    const { data: sub } = supabase.auth.onAuthStateChange((_event, _session) => {
      setReady(true)
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("updating")
    setError(null)
    try {
      if (password.length < 8) throw new Error("Password must be at least 8 characters.")
      if (password !== confirm) throw new Error("Passwords do not match.")
      const { error: updateErr } = await supabase.auth.updateUser({ password })
      if (updateErr) throw updateErr
      setStatus("done")
      // Redirect to login after a short delay
      setTimeout(() => router.replace("/auth/login"), 1000)
    } catch (err: any) {
      setStatus("error")
      setError(err?.message || "Unable to update password")
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-2 text-2xl font-semibold text-pretty">Reset your password</h1>
      <p className="mb-6 text-sm text-muted-foreground">Choose a new password for your account.</p>

      {!ready ? (
        <div className="text-sm text-muted-foreground">Preparing secure reset session...</div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm">New password</span>
            <Input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm">Confirm password</span>
            <Input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          <Button type="submit" disabled={status === "updating"}>
            {status === "updating" ? "Updating..." : "Update password"}
          </Button>
          {status === "done" && <p className="text-sm text-green-600">Password updated. Redirecting to login…</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      )}
    </main>
  )
}
