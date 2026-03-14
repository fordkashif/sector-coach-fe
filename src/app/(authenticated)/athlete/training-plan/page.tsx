"use client"

import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { tenantStorageKey } from "@/lib/tenant-storage"
import { mockAthletes, mockTrainingPlans, mockTeams } from "@/lib/mock-data"
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

export default function AthleteTrainingPlanPage() {
  const athlete = mockAthletes[0]
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
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

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6">
      <section className="-mx-4 px-4 py-4 sm:-mx-6 sm:px-6 sm:py-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">My Training Plan</h1>
          <p className="text-sm text-slate-500">See your assigned blocks by week and inspect what is scheduled before you train.</p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <div className="space-y-4">
          {plans.length > 0 ? (
            plans.map((plan) => {
              const team = mockTeams.find((item) => item.id === plan.teamId)
              const isSelected = selectedPlanId === plan.id
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={cn(
                    "w-full rounded-[26px] border bg-white p-4 text-left shadow-[0_18px_48px_rgba(15,23,42,0.06)] transition sm:rounded-[30px] sm:p-5",
                    isSelected ? "border-[#1f8cff] shadow-[0_20px_40px_rgba(31,140,255,0.14)]" : "border-slate-200 hover:border-[#cfe2ff]",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {team?.name ?? "Assigned Plan"}
                    </span>
                    <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                      {plan.weeks} {plan.weeks === 1 ? "Week" : "Weeks"}
                    </span>
                  </div>

                  <h2 className="mt-4 text-[28px] font-semibold leading-[1.05] tracking-[-0.05em] text-slate-950 sm:max-w-[34rem] sm:text-[32px]">
                    {plan.name}
                  </h2>
                  <p className="mt-3 text-sm text-slate-500">Starts {plan.startDate}</p>
                </button>
              )
            })
          ) : (
            <div className="rounded-[26px] border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px]">
              No assigned plans available yet.
            </div>
          )}
        </div>

        <div className="hidden xl:block">
          <div className="sticky top-6 rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
            {selectedPlan ? (
              <>
                <div className="rounded-[22px] bg-[linear-gradient(135deg,#031733_0%,#0b2d63_100%)] p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8db8ff]">Plan Preview</p>
                  <h2 className="mt-3 text-[30px] font-semibold leading-[1.05] tracking-[-0.05em]">{selectedPlan.name}</h2>
                  <p className="mt-3 text-sm text-white/72">{planRangeLabel(selectedPlan.startDate, selectedPlan.weeks)}</p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  {Array.from({ length: selectedPlan.weeks }).map((_, index) => (
                    <div key={`${selectedPlan.id}-week-${index + 1}`} className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Week {index + 1}</p>
                      <p className="mt-1.5 text-sm font-medium text-slate-950">
                        {index === 0 ? "Acceleration + strength" : index === 1 ? "Power + technical work" : index === 2 ? "Speed endurance + lifts" : "Recovery + sharpen"}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Preview</p>
                <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950">Select a plan</h2>
                <p className="mt-2 text-sm text-slate-500">Choose a plan on the left to inspect the week structure.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {selectedPlan ? (
        <section className="xl:hidden">
          <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
            <div className="space-y-1 border-b border-slate-200 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Weeks</p>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{selectedPlan.name}</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: selectedPlan.weeks }).map((_, index) => (
                <div key={`${selectedPlan.id}-mobile-week-${index + 1}`} className="rounded-[18px] border border-slate-200 bg-slate-50 px-3.5 py-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Week {index + 1}</p>
                  <p className="mt-1.5 text-sm font-medium text-slate-950">
                    {index === 0 ? "Acceleration + strength" : index === 1 ? "Power + technical work" : index === 2 ? "Speed endurance + lifts" : "Recovery + sharpen"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
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
            <Button key={item.href} asChild variant="outline" className="h-11 rounded-full border-slate-200 text-slate-950 hover:border-[#1f8cff] hover:bg-[#eef5ff] hover:text-slate-950">
              <Link to={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>
      </section>
    </div>
  )
}
