import { Navigate } from "react-router-dom"

export function ClubAdminRedirectPage() {
  return <Navigate to="/club-admin/dashboard" replace />
}
