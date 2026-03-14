import { useParams } from "react-router-dom"
import { CoachTeamDetailContent } from "@/components/coach/team-detail-content"
import { COACH_TEAM_COOKIE, getCookieValue, ROLE_COOKIE } from "@/lib/auth-session"
import { mockTeams } from "@/lib/mock-data"
import { InvalidEntityPage } from "@/pages/invalid-entity"

export default function CoachTeamDetailPage() {
  const { teamId = "" } = useParams()
  const team = mockTeams.find((item) => item.id === teamId)
  const role = getCookieValue(ROLE_COOKIE)
  const coachTeamId = getCookieValue(COACH_TEAM_COOKIE)

  if (!team) {
    return (
      <InvalidEntityPage
        title="Team not found"
        description="The requested team does not exist in the current PaceLab workspace."
        backTo="/coach/teams"
      />
    )
  }

  if (role === "coach" && coachTeamId && coachTeamId !== team.id) {
    return (
      <InvalidEntityPage
        title="Team unavailable"
        description="This team is outside the currently assigned coach scope."
        backTo="/coach/teams"
      />
    )
  }

  return <CoachTeamDetailContent teamId={team.id} />
}
