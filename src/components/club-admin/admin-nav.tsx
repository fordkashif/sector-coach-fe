"use client"

import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

const links = [
  { href: "/club-admin/dashboard", label: "Dashboard" },
  { href: "/club-admin/profile", label: "Club Profile" },
  { href: "/club-admin/users", label: "Users & Roles" },
  { href: "/club-admin/teams", label: "Teams" },
  { href: "/club-admin/reports", label: "Reports" },
  { href: "/club-admin/billing", label: "Billing" },
]

export function ClubAdminNav() {
  const { pathname } = useLocation()

  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          to={link.href}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm",
            pathname === link.href ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
