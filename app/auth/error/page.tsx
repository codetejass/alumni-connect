export default function AuthErrorPage() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-2xl font-semibold">Authentication Error</h1>
        <p className="text-muted-foreground">There was a problem with authentication. Please try again.</p>
      </div>
    </main>
  )
}
