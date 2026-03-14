import { useParams } from "react-router-dom"
import { JoinTeamForm } from "@/components/athlete/join-team-form"

export default function AthleteJoinTeamCodePage() {
  const { code = "" } = useParams()
  return <JoinTeamForm initialCode={code} />
}
