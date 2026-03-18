import { useSearchParams } from "react-router-dom"
import { JoinTeamForm } from "@/components/athlete/join-team-form"

export default function AthleteJoinTeamPage() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get("code") ?? ""

  return <JoinTeamForm initialCode={code} />
}
