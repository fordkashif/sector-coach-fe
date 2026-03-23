import { Suspense, lazy } from "react"
import { COACH_TEAM_COOKIE, getCookieValue, ROLE_COOKIE } from "@/lib/auth-session"
import { getBackendMode } from "@/lib/supabase/config"

const CoachTrainingPlanPageClient = lazy(() => import("@/components/coach/training-plan-page-client"))
const CoachTrainingPlanPageSupabaseClient = lazy(() => import("@/components/coach/training-plan-page-supabase-client"))
type CoachPageRole = "coach" | "club-admin"

export default function CoachTrainingPlanPage() {
  const backendMode = getBackendMode()
  const cookieRole = getCookieValue(ROLE_COOKIE)
  const role: CoachPageRole = cookieRole === "club-admin" ? "club-admin" : "coach"
  const coachTeamId = getCookieValue(COACH_TEAM_COOKIE)

  return (
    <Suspense fallback={null}>
      {backendMode === "supabase" ? (
        <CoachTrainingPlanPageSupabaseClient initialRole={role} initialCoachTeamId={coachTeamId} />
      ) : (
        <CoachTrainingPlanPageClient initialRole={role} initialCoachTeamId={coachTeamId} />
      )}
    </Suspense>
  )
}
