"use client"

import { RoleProvider } from "@/lib/role-context"
import { AppShell } from "@/components/app-shell"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleProvider>
      <AppShell>{children}</AppShell>
    </RoleProvider>
  )
}
