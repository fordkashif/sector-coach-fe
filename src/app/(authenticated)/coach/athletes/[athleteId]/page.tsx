import { useParams } from "react-router-dom"
import { CoachAthleteDetailContent } from "@/components/coach/athlete-detail-content"
import { COACH_TEAM_COOKIE, getCookieValue, ROLE_COOKIE } from "@/lib/auth-session"
import { mockAthletes } from "@/lib/mock-data"
import { InvalidEntityPage } from "@/pages/invalid-entity"

export default function CoachAthleteDetailPage() {
  const { athleteId = "" } = useParams()
  const athlete = mockAthletes.find((item) => item.id === athleteId)
  const role = getCookieValue(ROLE_COOKIE)
  const coachTeamId = getCookieValue(COACH_TEAM_COOKIE)

  if (!athlete) {
    return (
      <InvalidEntityPage
        title="Athlete not found"
        description="The requested athlete does not exist in the current PaceLab workspace."
        backTo="/coach/teams"
      />
    )
  }

  if (role === "coach" && coachTeamId && athlete.teamId !== coachTeamId) {
    return (
      <InvalidEntityPage
        title="Athlete unavailable"
        description="This athlete is outside the currently assigned coach scope."
        backTo="/coach/teams"
      />
    )
  }

  return <CoachAthleteDetailContent athlete={athlete} />
}
