import { Navigate, Outlet, useLocation } from "react-router-dom"
import { evaluateAccess } from "@/lib/access-control"
import { getCookieValue, ROLE_COOKIE, SESSION_COOKIE, TENANT_COOKIE } from "@/lib/auth-session"
import type { AppRole } from "@/lib/access-control"

function getRoleFromCookie() {
  const role = getCookieValue(ROLE_COOKIE)
  if (role === "athlete" || role === "coach" || role === "club-admin") {
    return role as AppRole
  }
  return null
}

export function GuardedAuthenticatedLayout() {
  const location = useLocation()
  const access = evaluateAccess({
    pathname: location.pathname,
    isAuthenticated: Boolean(getCookieValue(SESSION_COOKIE)),
    role: getRoleFromCookie(),
    tenantId: getCookieValue(TENANT_COOKIE),
  })

  if (!access.allowed) {
    return <Navigate to={access.redirectTo ?? "/login"} replace state={{ from: location }} />
  }

  return <Outlet />
}
