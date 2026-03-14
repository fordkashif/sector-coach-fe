import CoachTrainingPlanPageClient from "@/components/coach/training-plan-page-client"
import { COACH_TEAM_COOKIE, getCookieValue, ROLE_COOKIE } from "@/lib/auth-session"
import type { Role } from "@/lib/mock-data"

export default function CoachTrainingPlanPage() {
  const role = (getCookieValue(ROLE_COOKIE) as Role | null) ?? "coach"
  const coachTeamId = getCookieValue(COACH_TEAM_COOKIE)

  return <CoachTrainingPlanPageClient initialRole={role} initialCoachTeamId={coachTeamId} />
}
