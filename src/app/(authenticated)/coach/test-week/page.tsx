import CoachTestWeekPageClient from "@/components/coach/test-week-page-client"
import { COACH_TEAM_COOKIE, getCookieValue, ROLE_COOKIE } from "@/lib/auth-session"
import type { Role } from "@/lib/mock-data"

export default function CoachTestWeekPage() {
  const role = (getCookieValue(ROLE_COOKIE) as Role | null) ?? "coach"
  const coachTeamId = getCookieValue(COACH_TEAM_COOKIE)

  return <CoachTestWeekPageClient initialRole={role} initialCoachTeamId={coachTeamId} />
}
