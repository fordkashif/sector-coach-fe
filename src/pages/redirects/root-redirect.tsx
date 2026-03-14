import { Navigate } from "react-router-dom"

export function RootRedirectPage() {
  return <Navigate to="/login" replace />
}
