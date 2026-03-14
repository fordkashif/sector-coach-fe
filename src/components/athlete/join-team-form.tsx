"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { mockTeams } from "@/lib/mock-data"

function normalizeInviteCode(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return ""
  if (trimmed.includes("/")) {
    return trimmed.split("/").at(-1)?.trim().toLowerCase() ?? ""
  }
  return trimmed.toLowerCase()
}

export function JoinTeamForm({ initialCode = "" }: { initialCode?: string }) {
  const [inviteInput, setInviteInput] = useState(initialCode)
  const [joinedTeamId, setJoinedTeamId] = useState<string | null>(null)

  const match = useMemo(() => {
    const code = normalizeInviteCode(inviteInput)
    return mockTeams.find((team) => team.id.toLowerCase() === code) ?? null
  }, [inviteInput])

  return (
    <div className="mx-auto w-full max-w-lg space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Join Team</CardTitle>
          <CardDescription>Paste an invite link/code or scan QR and enter code.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite link or code</Label>
            <Input
              id="invite-code"
              placeholder="https://pacelab.app/invite/t1 or t1"
              value={inviteInput}
              onChange={(event) => setInviteInput(event.target.value)}
            />
          </div>
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            QR scan placeholder: mobile camera/deep link support would route here with `?code=&lt;teamId&gt;`.
          </div>
          <Button
            type="button"
            className="w-full"
            disabled={!match}
            onClick={() => setJoinedTeamId(match?.id ?? null)}
          >
            Join team
          </Button>
          {!match ? (
            <p className="text-sm text-destructive">Invite code not recognized.</p>
          ) : null}
          {joinedTeamId ? (
            <p className="text-sm text-[#1f8cff]">
              Joined {mockTeams.find((team) => team.id === joinedTeamId)?.name}.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
