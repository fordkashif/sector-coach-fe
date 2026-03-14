export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
