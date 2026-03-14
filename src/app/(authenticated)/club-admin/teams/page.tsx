"use client"

import { useState } from "react"
import { ClubAdminNav } from "@/components/club-admin/admin-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { logAuditEvent } from "@/lib/mock-audit"
import type { ClubTeam } from "@/lib/mock-club-admin"
import type { EventGroup } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { loadTeamsSafe, persistTeams } from "../state"

const groups: EventGroup[] = ["Sprint", "Mid", "Distance", "Jumps", "Throws"]
const groupTones: Record<EventGroup, string> = {
  Sprint: "bg-[#dbeafe] text-[#1d4ed8]",
  Mid: "bg-[#ede9fe] text-[#6d28d9]",
  Distance: "bg-[#dcfce7] text-[#15803d]",
  Jumps: "bg-[#fef3c7] text-[#b45309]",
  Throws: "bg-[#fee2e2] text-[#b91c1c]",
}

export default function ClubAdminTeamsPage() {
  const [teams, setTeams] = useState(loadTeamsSafe)
  const [name, setName] = useState("")
  const [eventGroup, setEventGroup] = useState<EventGroup>("Sprint")
  const [coachEmail, setCoachEmail] = useState("")

  const saveTeams = (next: ClubTeam[]) => {
    setTeams(next)
    persistTeams(next)
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6">
      <section className="-mx-4 px-4 py-4 sm:-mx-6 sm:px-6 sm:py-5">
        <div className="space-y-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Team Management</h1>
            <p className="text-sm text-slate-500">Create teams, assign lead coaches, and maintain active or archived team status.</p>
          </div>
          <ClubAdminNav />
        </div>
      </section>

      <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
        <div className="space-y-1 border-b border-slate-200 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Create Team</p>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Provision New Group</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-950">Team name</Label>
            <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" value={name} onChange={(event) => setName(event.target.value)} placeholder="Sprint Group B" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-950">Event group</Label>
            <Select value={eventGroup} onValueChange={(value) => setEventGroup(value as EventGroup)}>
              <SelectTrigger className="h-12 rounded-[16px] border-slate-200 bg-slate-50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-950">Lead coach email</Label>
            <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" value={coachEmail} onChange={(event) => setCoachEmail(event.target.value)} placeholder="coach@email.com" />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              className="h-12 w-full rounded-full bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)] text-white shadow-[0_12px_28px_rgba(31,140,255,0.22)] hover:opacity-95"
              onClick={() => {
                if (!name.trim()) return
                const next: ClubTeam = {
                  id: `t-${Date.now()}`,
                  name: name.trim(),
                  eventGroup,
                  status: "active",
                  coachEmail: coachEmail.trim() || undefined,
                }
                saveTeams([next, ...teams])
                logAuditEvent({
                  actor: "club-admin",
                  action: "team_create",
                  target: next.name,
                  detail: `${next.eventGroup}${next.coachEmail ? ` (${next.coachEmail})` : ""}`,
                })
                setName("")
                setCoachEmail("")
              }}
            >
              Create
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
        <div className="space-y-1 border-b border-slate-200 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Manage Teams</p>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Current Groups</h2>
        </div>
        <div className="mt-4 space-y-3">
          {teams.map((team) => (
            <div key={team.id} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="grid gap-3 sm:grid-cols-3 xl:flex-1">
                  <Input
                    className="h-11 rounded-[16px] border-slate-200 bg-white"
                    value={team.name}
                    onChange={(event) => {
                      const next = teams.map((item) => (item.id === team.id ? { ...item, name: event.target.value } : item))
                      saveTeams(next)
                    }}
                  />
                  <Select
                    value={team.eventGroup}
                    onValueChange={(value) => {
                      const next = teams.map((item) => (item.id === team.id ? { ...item, eventGroup: value as EventGroup } : item))
                      saveTeams(next)
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-[16px] border-slate-200 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group} value={group}>{group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="h-11 rounded-[16px] border-slate-200 bg-white"
                    value={team.coachEmail ?? ""}
                    placeholder="coach@email.com"
                    onChange={(event) => {
                      const next = teams.map((item) => (item.id === team.id ? { ...item, coachEmail: event.target.value || undefined } : item))
                      saveTeams(next)
                    }}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                  <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", groupTones[team.eventGroup])}>
                    {team.eventGroup}
                  </span>
                  <span className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                    team.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700",
                  )}>
                    {team.status}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-full border-slate-200 text-slate-950 hover:border-[#1f8cff] hover:bg-[#eef5ff] hover:text-slate-950"
                    onClick={() => {
                      const next = teams.map((item) =>
                        item.id === team.id ? { ...item, status: (item.status === "active" ? "archived" : "active") as ClubTeam["status"] } : item,
                      )
                      saveTeams(next)
                      logAuditEvent({ actor: "club-admin", action: team.status === "active" ? "team_archive" : "team_restore", target: team.id })
                    }}
                  >
                    {team.status === "active" ? "Archive" : "Restore"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
