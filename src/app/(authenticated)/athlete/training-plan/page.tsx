"use client"

import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { tenantStorageKey } from "@/lib/tenant-storage"
import { mockAthleteTrainingPlanDetails, mockAthletes, mockTeams, mockTrainingPlans, type AthletePlanDay } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const ASSIGNMENT_STORAGE_KEY = "pacelab:plan-assignments"

interface PlanAssignment {
  planId: string
  scope: "team" | "athlete"
  teamId: string
  athleteId?: string
}

function planRangeLabel(startDate: string, weeks: number) {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(start)
  end.setDate(start.getDate() + weeks * 7 - 1)
  return `${start.toLocaleDateString(undefined, { month: "long", day: "numeric" })} - ${end.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}`
}

function formatDayDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

const typeToneMap: Record<AthletePlanDay["type"], string> = {
  Track: "bg-[#dbeafe] text-[#1d4ed8]",
  Gym: "bg-[#ede9fe] text-[#6d28d9]",
  Recovery: "bg-[#dcfce7] text-[#15803d]",
  Technical: "bg-[#fef3c7] text-[#b45309]",
  Mixed: "bg-[#fee2e2] text-[#be123c]",
}

export default function AthleteTrainingPlanPage() {
  const athlete = mockAthletes[0]
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number | null>(null)
  const [storageAssignments] = useState<PlanAssignment[]>(() => {
    if (typeof window === "undefined") return []
    const raw = window.localStorage.getItem(tenantStorageKey(ASSIGNMENT_STORAGE_KEY))
    if (!raw) return []
    try {
      return JSON.parse(raw) as PlanAssignment[]
    } catch {
      return []
    }
  })

  const plans = useMemo(() => {
    const base = mockTrainingPlans.filter(
      (plan) => plan.teamId === athlete.teamId || (plan.assignedTo === "athlete" && plan.assignedAthleteIds?.includes(athlete.id)),
    )

    const fromAssignments = storageAssignments
      .filter((assignment) => {
        if (assignment.scope === "team") return assignment.teamId === athlete.teamId
        return assignment.athleteId === athlete.id
      })
      .map((assignment) => mockTrainingPlans.find((plan) => plan.id === assignment.planId))
      .filter((plan): plan is (typeof mockTrainingPlans)[number] => Boolean(plan))

    const deduped = new Map([...base, ...fromAssignments].map((plan) => [plan.id, plan]))
    return [...deduped.values()]
  }, [athlete.id, athlete.teamId, storageAssignments])

  const activePlan = plans[0] ?? null
  const activePlanDetail = mockAthleteTrainingPlanDetails.find((detail) => detail.planId === activePlan?.id) ?? null
  const currentWeek = activePlanDetail?.weeks.find((week) => week.status === "current") ?? activePlanDetail?.weeks[0] ?? null
  const selectedWeek =
    activePlanDetail?.weeks.find((week) => week.weekNumber === selectedWeekNumber) ??
    currentWeek ??
    null
  const team = mockTeams.find((item) => item.id === activePlan?.teamId)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6">
      <section className="page-intro">
        <div>
          <h1 className="page-intro-title">My Training Plan</h1>
          <p className="page-intro-copy">See the current week first, then look ahead day by day without leaving the athlete workflow.</p>
        </div>
      </section>

      {activePlan && activePlanDetail && selectedWeek ? (
        <>
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div className="mobile-card-primary">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Active Plan</p>
                  <h2 className="text-[28px] font-semibold leading-[1.05] tracking-[-0.05em] text-slate-950">{activePlan.name}</h2>
                  <p className="text-sm text-slate-500">{planRangeLabel(activePlan.startDate, activePlan.weeks)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {team?.name ?? "Assigned team"}
                  </span>
                  <span className="inline-flex rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                    {activePlan.weeks} weeks
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Current week", value: `Week ${selectedWeek.weekNumber}` },
                  { label: "Emphasis", value: selectedWeek.emphasis },
                  { label: "Scheduled days", value: `${selectedWeek.days.length}` },
                ].map((item) => (
                  <div key={item.label} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                    <p className="mt-1.5 text-sm font-semibold tracking-[-0.03em] text-slate-950 sm:text-lg">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-[20px] border border-slate-200 bg-[#031733] px-4 py-4 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8db8ff]">Week emphasis</p>
                <p className="mt-2 text-sm text-white/80">{selectedWeek.emphasis}</p>
              </div>
            </div>

            <div className="mobile-card-primary">
              <div className="space-y-1 border-b border-slate-200 pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Week Navigation</p>
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Plan Weeks</h2>
              </div>
              <div className="mt-4 space-y-3">
                {activePlanDetail.weeks.map((week) => {
                  const isSelected = week.weekNumber === selectedWeek.weekNumber
                  const statusTone =
                    week.status === "completed"
                      ? "text-emerald-700"
                      : week.status === "current"
                        ? "text-[#1368ff]"
                        : "text-slate-400"

                  return (
                    <button
                      key={`${activePlan.id}-week-${week.weekNumber}`}
                      type="button"
                      onClick={() => setSelectedWeekNumber(week.weekNumber)}
                      className={cn(
                        "w-full rounded-[18px] border px-4 py-4 text-left transition",
                        isSelected ? "border-[#1f8cff] bg-[#eef5ff]" : "border-slate-200 bg-slate-50 hover:border-[#cfe2ff]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">Week {week.weekNumber}</p>
                          <p className="mt-1 text-sm text-slate-500">{week.emphasis}</p>
                        </div>
                        <span className={cn("text-xs font-semibold uppercase tracking-[0.14em]", statusTone)}>
                          {week.status === "completed" ? "Completed" : week.status === "current" ? "Current" : "Up next"}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="mobile-card-primary">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Week {selectedWeek.weekNumber}</p>
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Daily Schedule</h2>
                <p className="text-sm text-slate-500">Day-by-day structure with focus, location, and a preview of the prescribed work.</p>
              </div>
              <Button asChild variant="outline" className="h-11 rounded-full border-slate-200 px-5 text-slate-950 hover:border-[#1f8cff] hover:bg-[#eef5ff] hover:text-slate-950">
                <Link to="/athlete/log">Open today&apos;s session</Link>
              </Button>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {selectedWeek.days.map((day) => {
                const statusTone =
                  day.status === "completed"
                    ? "bg-emerald-100 text-emerald-700"
                    : day.status === "scheduled"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-200 text-slate-700"

                return (
                  <div key={day.id} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-950">{day.dayLabel}</p>
                          <span className="text-sm text-slate-400">{formatDayDate(day.date)}</span>
                        </div>
                        <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950">{day.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{day.focus}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", typeToneMap[day.type])}>{day.type}</span>
                        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", statusTone)}>
                          {day.status === "completed" ? "Completed" : day.status === "scheduled" ? "Scheduled" : "Up next"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-[16px] border border-slate-200 bg-white px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Duration</p>
                        <p className="mt-1.5 text-sm font-semibold text-slate-950">{day.duration}</p>
                      </div>
                      <div className="rounded-[16px] border border-slate-200 bg-white px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Location</p>
                        <p className="mt-1.5 text-sm font-semibold text-slate-950">{day.location}</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[18px] border border-slate-200 bg-white px-3.5 py-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Block preview</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {day.blockPreview.map((block) => (
                          <span key={`${day.id}-${block}`} className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {block}
                          </span>
                        ))}
                      </div>
                    </div>

                    {day.coachNote ? (
                      <div className="mt-4 rounded-[18px] border border-[#c9dcff] bg-[#eef5ff] px-3.5 py-3.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1f5fd1]">Coach note</p>
                        <p className="mt-1.5 text-sm text-slate-600">{day.coachNote}</p>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-[26px] border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px]">
          No assigned plans available yet.
        </section>
      )}

      <section className="mobile-card-primary">
        <div className="space-y-1 border-b border-slate-200 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Quick Actions</p>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Related Workflow</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Open wellness", href: "/athlete/wellness" },
            { label: "Open trends", href: "/athlete/trends" },
            { label: "Open session log", href: "/athlete/log" },
          ].map((item) => (
            <Button key={item.href} asChild variant="outline" className="mobile-action-secondary">
              <Link to={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>
      </section>
    </div>
  )
}
