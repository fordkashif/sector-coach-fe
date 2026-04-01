import CoachTrainingPlanPageClient from "@/components/coach/training-plan-page-client"
import CoachTrainingPlanPageSupabaseClient from "@/components/coach/training-plan-page-supabase-client"
import { COACH_TEAM_COOKIE, getCookieValue, ROLE_COOKIE } from "@/lib/auth-session"
import { getBackendMode } from "@/lib/supabase/config"
type CoachPageRole = "coach" | "club-admin"

export default function CoachTrainingPlanPage() {
  const backendMode = getBackendMode()
  const cookieRole = getCookieValue(ROLE_COOKIE)
  const role: CoachPageRole = cookieRole === "club-admin" ? "club-admin" : "coach"
  const coachTeamId = getCookieValue(COACH_TEAM_COOKIE)

  return (
    backendMode === "supabase" ? (
      <CoachTrainingPlanPageSupabaseClient initialRole={role} initialCoachTeamId={coachTeamId} />
    ) : (
      <CoachTrainingPlanPageClient initialRole={role} initialCoachTeamId={coachTeamId} />
    )
  )
}
