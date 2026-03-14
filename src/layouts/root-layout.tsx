import { useEffect } from "react"
import { Analytics } from "@vercel/analytics/react"
import { Outlet } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

export function RootLayout() {
  useEffect(() => {
    document.title = "PaceLab | Elite Track & Field Performance"
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <div className="font-sans antialiased">
        <Outlet />
        <Toaster />
        <Analytics />
      </div>
    </ThemeProvider>
  )
}
