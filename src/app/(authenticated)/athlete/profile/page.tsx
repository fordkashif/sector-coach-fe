"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, Notification03Icon, UserAccountIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { tenantStorageKey } from "@/lib/tenant-storage"
import { getTeamDisciplineLabel, mockAthletes, mockTeams } from "@/lib/mock-data"

type AthletePreferences = {
  units: "metric" | "imperial"
  sessionReminders: boolean
  wellnessReminders: boolean
  showPreviousResults: boolean
}

const PROFILE_PREFERENCES_STORAGE_KEY = "pacelab:athlete-profile-preferences"

const defaultPreferences: AthletePreferences = {
  units: "metric",
  sessionReminders: true,
  wellnessReminders: true,
  showPreviousResults: true,
}

function loadPreferences(): AthletePreferences {
  if (typeof window === "undefined") return defaultPreferences

  try {
    const stored = window.localStorage.getItem(tenantStorageKey(PROFILE_PREFERENCES_STORAGE_KEY))
    if (!stored) return defaultPreferences
    return { ...defaultPreferences, ...(JSON.parse(stored) as Partial<AthletePreferences>) }
  } catch {
    return defaultPreferences
  }
}

export default function AthleteProfilePage() {
  const athlete = mockAthletes[0]
  const team = mockTeams.find((item) => item.id === athlete.teamId)
  const [preferences, setPreferences] = useState<AthletePreferences>(() => loadPreferences())

  useEffect(() => {
    window.localStorage.setItem(
      tenantStorageKey(PROFILE_PREFERENCES_STORAGE_KEY),
      JSON.stringify(preferences),
    )
  }, [preferences])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:space-y-6 sm:p-6">
      <section className="mobile-hero-surface">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mobile-pill-accent">
              Athlete
            </span>
            <span className="mobile-pill-muted">
              {team?.name ?? "Unassigned"}
            </span>
          </div>
          <h1 className="mobile-hero-title">Profile</h1>
          <p className="mobile-hero-copy">
            Keep identity, reminders, and training preferences lightweight so the athlete side stays focused on execution.
          </p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <Card className="mobile-card-primary">
          <CardContent className="space-y-6 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Identity</p>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">{athlete.name}</h2>
                <p className="text-sm text-slate-500">{athlete.primaryEvent} | {athlete.eventGroup} | Age {athlete.age}</p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Last Wellness</p>
                <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">{athlete.lastWellness}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Team", value: team?.name ?? "-" },
                { label: "Discipline Group", value: getTeamDisciplineLabel(team) || athlete.eventGroup },
                { label: "Readiness", value: athlete.readiness },
                { label: "Adherence", value: `${athlete.adherence}%` },
              ].map((item) => (
                <div key={item.label} className="mobile-card-utility">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                  <p className="mt-1.5 text-base font-semibold text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mobile-card-primary">
          <CardContent className="space-y-5 p-4 sm:p-5">
            <div className="border-b border-slate-200 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Preferences</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">Training Defaults</h2>
              <p className="mt-1 text-sm text-slate-500">These settings stay athlete-facing and intentionally light.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-950" htmlFor="profile-units">
                  Units
                </label>
                <Select
                  value={preferences.units}
                  onValueChange={(value: AthletePreferences["units"]) =>
                    setPreferences((current) => ({ ...current, units: value }))
                  }
                >
                  <SelectTrigger id="profile-units" className="h-12 w-full rounded-[16px] border-slate-200 bg-slate-50 text-slate-950">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric</SelectItem>
                    <SelectItem value="imperial">Imperial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {[
                {
                  key: "sessionReminders" as const,
                  title: "Session reminders",
                  description: "Remind me before the assigned workout window starts.",
                },
                {
                  key: "wellnessReminders" as const,
                  title: "Wellness reminders",
                  description: "Prompt the daily readiness check before training.",
                },
                {
                  key: "showPreviousResults" as const,
                  title: "Show previous results",
                  description: "Keep prior benchmarks visible during workout logging.",
                },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-950">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                  <Switch
                    checked={preferences[item.key]}
                    onCheckedChange={(checked) =>
                      setPreferences((current) => ({
                        ...current,
                        [item.key]: checked,
                      }))
                    }
                    aria-label={item.title}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="mobile-card-primary">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="border-b border-slate-200 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Quick Actions</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">Stay in Training Flow</h2>
            </div>
            <div className="grid gap-3">
              {[
                { label: "Open progress", href: "/athlete/trends", icon: ArrowRight01Icon },
                { label: "Join or switch team", href: "/athlete/join", icon: UserAccountIcon },
                { label: "Complete wellness", href: "/athlete/wellness", icon: Notification03Icon },
              ].map((item) => (
                <Button key={item.href} asChild variant="outline" className="mobile-action-secondary justify-between">
                  <Link to={item.href}>
                    {item.label}
                    <HugeiconsIcon icon={item.icon} className="size-4" />
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mobile-card-primary">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="border-b border-slate-200 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Account</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">Support and Access</h2>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              Team assignment, reminders, and visibility defaults are athlete-editable here. Sensitive account and billing controls remain outside the athlete workflow.
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Primary Event</p>
                <p className="mt-1.5 text-base font-semibold text-slate-950">{athlete.primaryEvent}</p>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Current Team</p>
                <p className="mt-1.5 text-base font-semibold text-slate-950">{team?.name ?? "Pending assignment"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
