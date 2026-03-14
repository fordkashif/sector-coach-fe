import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { mockAthletes, mockCurrentSession, mockPRs, mockTestWeekResults, mockTrendSeries, mockTrainingPlans, mockTeams } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

function buildTrendPath(points: number[], width: number, height: number, padding = 12) {
  if (!points.length) return ""
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = Math.max(max - min, 1)
  return points
    .map((value, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(points.length - 1, 1)
      const y = height - padding - ((value - min) / range) * (height - padding * 2)
      return `${index === 0 ? "M" : "L"} ${x} ${y}`
    })
    .join(" ")
}

export default function AthleteHomePage() {
  const athlete = mockAthletes[0]
  const trend = mockTrendSeries[athlete.id] ?? []
  const featuredPrs = mockPRs.filter((pr) => pr.athleteId === athlete.id).slice(0, 3)
  const upcomingTest = mockTestWeekResults.find((row) => row.athleteId === athlete.id)
  const assignedPlan = mockTrainingPlans.find(
    (plan) => plan.teamId === athlete.teamId || (plan.assignedTo === "athlete" && plan.assignedAthleteIds?.includes(athlete.id)),
  )
  const team = mockTeams.find((item) => item.id === athlete.teamId)

  const readinessValues = trend.map((point) => point.readiness)
  const fatigueValues = trend.map((point) => point.fatigue)
  const readinessPath = buildTrendPath(readinessValues, 520, 180)
  const fatiguePath = buildTrendPath(fatigueValues, 520, 180)

  const readinessTone =
    athlete.readiness === "green"
      ? "bg-emerald-100 text-emerald-700"
      : athlete.readiness === "yellow"
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-700"

  const sessionTypeTones: Record<string, string> = {
    Sprint: "bg-[#dbeafe] text-[#1d4ed8]",
    Strength: "bg-[#ede9fe] text-[#6d28d9]",
    Plyometrics: "bg-[#dcfce7] text-[#15803d]",
    Run: "bg-[#fef3c7] text-[#b45309]",
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6">
      <section className="-mx-4 px-4 py-4 sm:-mx-6 sm:px-6 sm:py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Home</h1>
            <p className="text-sm text-slate-500">
              Track today&apos;s work, your readiness, and the next major checkpoints in one place.
            </p>
          </div>
          <div className="hidden flex-wrap gap-2 md:flex">
            <Button asChild variant="outline" className="h-11 rounded-full border-slate-200 px-5 text-slate-950 hover:border-[#1f8cff] hover:bg-[#eef5ff] hover:text-slate-950">
              <Link to="/athlete/wellness">Check in</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-full border-slate-200 px-5 text-slate-950 hover:border-[#1f8cff] hover:bg-[#eef5ff] hover:text-slate-950">
              <Link to="/athlete/training-plan">My plan</Link>
            </Button>
            <Button asChild className="h-11 rounded-full bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)] px-5 text-white shadow-[0_12px_28px_rgba(31,140,255,0.22)] hover:opacity-95">
              <Link to="/athlete/log">Log Session</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.8fr)]">
        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Today</p>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Session Focus</h2>
              <p className="text-sm text-slate-500">{mockCurrentSession.title}</p>
            </div>
            <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", readinessTone)}>
              {athlete.readiness === "green" ? "Ready" : athlete.readiness === "yellow" ? "Watch" : "Review"}
            </span>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.72fr)]">
            <div className="space-y-3">
              {mockCurrentSession.blocks.map((block) => (
                <div key={block.name} className="rounded-[18px] border border-slate-200 bg-slate-50 px-3.5 py-3.5 sm:rounded-[20px] sm:px-4 sm:py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{block.name}</p>
                      <p className="mt-1 text-sm text-slate-500">Primary block in today&apos;s session.</p>
                    </div>
                    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", sessionTypeTones[block.type] ?? "bg-slate-200 text-slate-700")}>
                      {block.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-3">
              {[
                { label: "Last check-in", value: athlete.lastWellness },
                { label: "Team", value: team?.name ?? "-" },
                { label: "Active plan", value: assignedPlan ? `${assignedPlan.weeks} wk` : "None" },
              ].map((item) => (
                <div key={item.label} className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3 sm:rounded-[22px] sm:px-4 sm:py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                  <p className="mt-1.5 text-lg font-semibold tracking-[-0.04em] text-slate-950 sm:text-2xl">{item.value}</p>
                </div>
              ))}
              <Button asChild className="col-span-2 h-11 rounded-full bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)] text-white shadow-[0_12px_28px_rgba(31,140,255,0.22)] hover:opacity-95 lg:col-span-1">
                <Link to="/athlete/log">Log Session</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
          <div className="space-y-1 border-b border-slate-200 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Next Required Action</p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Today&apos;s Actions</h2>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { title: "Wellness check-in", href: "/athlete/wellness", primary: true },
              { title: "Open training plan", href: "/athlete/training-plan", primary: false },
              { title: "Submit test week", href: "/athlete/test-week", primary: false },
            ].map((item) => (
              <Button
                key={item.title}
                asChild
                variant={item.primary ? "default" : "outline"}
                className={cn(
                  "h-12 w-full rounded-full",
                  item.primary
                    ? "bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)] text-white shadow-[0_12px_28px_rgba(31,140,255,0.22)] hover:opacity-95"
                    : "border-slate-200 text-slate-950 hover:border-[#1f8cff] hover:bg-[#eef5ff] hover:text-slate-950",
                )}
              >
                <Link to={item.href}>{item.title}</Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Readiness Trend</p>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">How You&apos;re Trending</h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#1f8cff]" /> Readiness</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-slate-900" /> Fatigue</span>
            </div>
          </div>

          <div className="mt-4">
            {trend.length > 0 ? (
              <>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-2.5 sm:rounded-[22px] sm:p-3">
                  <svg viewBox="0 0 520 180" className="h-[180px] w-full sm:h-[220px]">
                    <defs>
                      <linearGradient id="athleteReadinessFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#1f8cff" stopOpacity="0.24" />
                        <stop offset="100%" stopColor="#1f8cff" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    {[0, 1, 2, 3].map((line) => (
                      <line key={line} x1="12" x2="508" y1={24 + line * 36} y2={24 + line * 36} stroke="#dbe4f0" strokeDasharray="4 6" />
                    ))}
                    {readinessPath ? (
                      <>
                        <path d={`${readinessPath} L 508 168 L 12 168 Z`} fill="url(#athleteReadinessFill)" opacity="0.9" />
                        <path d={fatiguePath} fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                        <path d={readinessPath} fill="none" stroke="#1f8cff" strokeWidth="4" strokeLinecap="round" />
                      </>
                    ) : null}
                  </svg>
                </div>
                <div className="mt-4 grid grid-cols-6 gap-1.5 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400 sm:gap-2 sm:text-[11px]">
                  {trend.map((point) => (
                    <span key={point.date}>{new Date(point.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No trend data available.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
            <div className="space-y-1 border-b border-slate-200 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">PR Momentum</p>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Recent Bests</h2>
            </div>
            <div className="mt-4 space-y-3">
              {featuredPrs.length > 0 ? (
                featuredPrs.map((pr) => (
                  <div key={pr.id} className="rounded-[18px] border border-slate-200 bg-slate-50 px-3.5 py-3.5 sm:rounded-[20px] sm:px-4 sm:py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{pr.event}</p>
                        <p className="text-sm text-slate-500">{pr.date}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#1f8cff]">
                        <HugeiconsIcon icon={ArrowUp01Icon} className="size-4" />
                        {pr.bestValue}
                      </span>
                    </div>
                    {pr.previousValue ? <p className="mt-2 text-xs text-slate-500">Previous {pr.previousValue}</p> : null}
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  No PR records available.
                </div>
              )}
              <Button asChild variant="outline" className="h-11 w-full rounded-full border-slate-200 text-slate-950 hover:border-[#1f8cff] hover:bg-[#eef5ff] hover:text-slate-950">
                <Link to="/athlete/prs">
                  View all PRs
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
            <div className="space-y-1 border-b border-slate-200 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Testing</p>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Upcoming Test Week</h2>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3.5 py-3.5 sm:rounded-[20px] sm:px-4 sm:py-4">
                <p className="font-semibold text-slate-950">Week 4 Testing</p>
                <p className="mt-1 text-sm text-slate-500">March 2 - March 6, 2026</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "30m", value: upcomingTest?.thirtyM?.value ?? "-" },
                  { label: "Flying 30m", value: upcomingTest?.flyingThirtyM?.value ?? "-" },
                  { label: "CMJ", value: upcomingTest?.cmj?.value ?? "-" },
                  { label: "Squat 1RM", value: upcomingTest?.squat1RM?.value ?? "-" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                    <p className="mt-1.5 text-lg font-semibold tracking-[-0.03em] text-slate-950">{item.value}</p>
                  </div>
                ))}
              </div>
              <Button asChild className="h-11 w-full rounded-full bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)] text-white shadow-[0_12px_28px_rgba(31,140,255,0.22)] hover:opacity-95">
                <Link to="/athlete/test-week">Open test week</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
