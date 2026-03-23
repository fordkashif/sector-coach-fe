import { Suspense, lazy } from "react"
import { COACH_TEAM_COOKIE, getCookieValue, ROLE_COOKIE } from "@/lib/auth-session"
import { getBackendMode } from "@/lib/supabase/config"

const CoachTestWeekPageClient = lazy(() => import("@/components/coach/test-week-page-client"))
const CoachTestWeekPageSupabaseClient = lazy(() => import("@/components/coach/test-week-page-supabase-client"))
type CoachPageRole = "coach" | "club-admin"

export default function CoachTestWeekPage() {
  const backendMode = getBackendMode()
  const cookieRole = getCookieValue(ROLE_COOKIE)
  const role: CoachPageRole = cookieRole === "club-admin" ? "club-admin" : "coach"
  const coachTeamId = getCookieValue(COACH_TEAM_COOKIE)

  return (
    <Suspense fallback={null}>
      {backendMode === "supabase" ? (
        <CoachTestWeekPageSupabaseClient initialRole={role} initialCoachTeamId={coachTeamId} />
      ) : (
        <CoachTestWeekPageClient initialRole={role} initialCoachTeamId={coachTeamId} />
      )}
    </Suspense>
  )
}
