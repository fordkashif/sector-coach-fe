import { Navigate, useParams } from "react-router-dom"

export function InviteRedirectPage() {
  const { code = "" } = useParams()
  return <Navigate to={`/athlete/join/${encodeURIComponent(code)}`} replace />
}
