import type { ReactNode } from "react"
import { Outlet } from "react-router-dom"
import { AppShell } from "@/components/app-shell"
import { RoleProvider } from "@/lib/role-context"

function AuthenticatedLayoutContent({ children }: { children: ReactNode }) {
  return (
    <RoleProvider>
      <AppShell>{children}</AppShell>
    </RoleProvider>
  )
}

export function AuthenticatedLayout() {
  return (
    <AuthenticatedLayoutContent>
      <Outlet />
    </AuthenticatedLayoutContent>
  )
}
