import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { mockAthletes, mockTeams } from "@/lib/mock-data"

export default function AthleteProfilePage() {
  const athlete = mockAthletes[0]
  const team = mockTeams.find((item) => item.id === athlete.teamId)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Personal and team information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium">{athlete.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Age</p>
              <p className="font-medium">{athlete.age}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Primary event</p>
              <p className="font-medium">{athlete.primaryEvent}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Event group</p>
              <p className="font-medium">{athlete.eventGroup}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Team</p>
              <p className="font-medium">{team?.name ?? "-"}</p>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium">Settings</p>
            <p className="text-sm text-muted-foreground">Preferences and account controls will be added here.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild variant="outline">
              <Link to="/athlete/trends">View progress trends</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/athlete/join">Join team by invite</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
