"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { Role } from "@/lib/mock-data"
import { MOCK_ROLE_STORAGE_KEY } from "@/lib/mock-auth"

interface RoleContextValue {
  role: Role
  setRole: (role: Role) => void
}

const RoleContext = createContext<RoleContextValue>({
  role: "club-admin",
  setRole: () => {},
})

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("club-admin")

  useEffect(() => {
    const storedRole = window.localStorage.getItem(MOCK_ROLE_STORAGE_KEY)
    if ((storedRole === "coach" || storedRole === "athlete" || storedRole === "club-admin") && storedRole !== role) {
      const frameId = window.requestAnimationFrame(() => {
        setRole(storedRole)
      })
      return () => window.cancelAnimationFrame(frameId)
    }
    return undefined
  }, [role])

  const handleSetRole = (nextRole: Role) => {
    setRole(nextRole)
    window.localStorage.setItem(MOCK_ROLE_STORAGE_KEY, nextRole)
  }

  return (
    <RoleContext.Provider value={{ role, setRole: handleSetRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
