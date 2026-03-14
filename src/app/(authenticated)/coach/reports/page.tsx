"use client"

import { ArrowUp01Icon, FileDownloadIcon, PrinterIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { BarChart, PieChart } from "@mui/x-charts"
import { Button } from "@/components/ui/button"
import { COACH_TEAM_COOKIE, getCookieValue, ROLE_COOKIE } from "@/lib/auth-session"
import { mockAthletes, mockPRs, mockTeams, mockWellness } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const chartSx = {
  "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
    stroke: "#cbd5e1",
  },
  "& .MuiChartsAxis-tickLabel": {
    fill: "#64748b",
    fontSize: 11,
    fontFamily: "inherit",
  },
  "& .MuiChartsGrid-line": {
    stroke: "#dbe4f0",
    strokeDasharray: "4 6",
  },
  "& .MuiBarElement-root": {
    rx: 8,
    ry: 8,
  },
}

const pieSx = {
  "& .MuiPieArc-root": {
    stroke: "#ffffff",
    strokeWidth: 3,
  },
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function CoachReportsPage() {
  const role = getCookieValue(ROLE_COOKIE)
  const coachTeamId = getCookieValue(COACH_TEAM_COOKIE)
  const scopedAthletes =
    role === "coach" && coachTeamId ? mockAthletes.filter((athlete) => athlete.teamId === coachTeamId) : mockAthletes
  const athleteIds = new Set(scopedAthletes.map((athlete) => athlete.id))
  const scopedPrs = mockPRs.filter((pr) => athleteIds.has(pr.athleteId))
  const scopedWellness = mockWellness.filter((entry) => athleteIds.has(entry.athleteId))
  const scopedTeam = mockTeams.find((team) => team.id === coachTeamId)

  const readinessSummary = {
    green: scopedAthletes.filter((athlete) => athlete.readiness === "green").length,
    yellow: scopedAthletes.filter((athlete) => athlete.readiness === "yellow").length,
    red: scopedAthletes.filter((athlete) => athlete.readiness === "red").length,
  }

  const readinessTotal = readinessSummary.green + readinessSummary.yellow + readinessSummary.red
  const adherenceAverage =
    scopedAthletes.length > 0
      ? Math.round(scopedAthletes.reduce((sum, athlete) => sum + athlete.adherence, 0) / scopedAthletes.length)
      : 0

  const lowAdherenceRows = [...scopedAthletes].sort((left, right) => left.adherence - right.adherence).slice(0, 6)
  const recentPrs = [...scopedPrs].slice(0, 5)
  const prByCategory = Object.entries(
    scopedPrs.reduce<Record<string, number>>((acc, pr) => {
      acc[pr.category] = (acc[pr.category] ?? 0) + 1
      return acc
    }, {}),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
  const readinessPieData = [
    { id: "ready", value: readinessSummary.green, label: "Ready", color: "#1f8cff" },
    { id: "watch", value: readinessSummary.yellow, label: "Watch", color: "#fbbf24" },
    { id: "review", value: readinessSummary.red, label: "Review", color: "#f43f5e" },
  ]
  const prChartRows = prByCategory.map(([category, count]) => ({ category, count }))
  const adherenceChartRows = lowAdherenceRows.map((athlete) => ({
    athlete: athlete.name.split(" ")[0],
    adherence: athlete.adherence,
  }))

  const wellnessAverages = scopedWellness.length
    ? {
        sleep: Number((scopedWellness.reduce((sum, entry) => sum + entry.sleep, 0) / scopedWellness.length).toFixed(1)),
        soreness: Number((scopedWellness.reduce((sum, entry) => sum + entry.soreness, 0) / scopedWellness.length).toFixed(1)),
        fatigue: Number((scopedWellness.reduce((sum, entry) => sum + entry.fatigue, 0) / scopedWellness.length).toFixed(1)),
        mood: Number((scopedWellness.reduce((sum, entry) => sum + entry.mood, 0) / scopedWellness.length).toFixed(1)),
        stress: Number((scopedWellness.reduce((sum, entry) => sum + entry.stress, 0) / scopedWellness.length).toFixed(1)),
      }
    : { sleep: 0, soreness: 0, fatigue: 0, mood: 0, stress: 0 }

  const wellnessBars = [
    { label: "Sleep", value: wellnessAverages.sleep, max: 10, tone: "bg-[#1f8cff]" },
    { label: "Mood", value: wellnessAverages.mood, max: 5, tone: "bg-[#4759ff]" },
    { label: "Fatigue", value: wellnessAverages.fatigue, max: 5, tone: "bg-amber-400" },
    { label: "Stress", value: wellnessAverages.stress, max: 5, tone: "bg-rose-400" },
  ]

  const exportAthleteAdherence = () => {
    const rows = [
      ["Athlete", "Group", "Readiness", "Plan Adherence", "Last Wellness"],
      ...scopedAthletes.map((athlete) => [
        athlete.name,
        athlete.eventGroup,
        athlete.readiness,
        `${athlete.adherence}%`,
        athlete.lastWellness,
      ]),
    ]
    downloadCsv("coach-athlete-adherence.csv", rows)
  }

  const exportPrs = () => {
    const rows = [
      ["Athlete", "Event", "Best", "Previous", "Date", "Legal/Wind"],
      ...scopedPrs.map((pr) => [
        pr.athleteName,
        pr.event,
        pr.bestValue,
        pr.previousValue ?? "-",
        pr.date,
        pr.wind ? `Legal (${pr.wind})` : pr.legal ? "Legal" : "Wind assisted",
      ]),
    ]
    downloadCsv("coach-pr-report.csv", rows)
  }

  const exportWellness = () => {
    const rows = [
      ["Athlete ID", "Date", "Sleep", "Soreness", "Fatigue", "Mood", "Stress", "Readiness"],
      ...scopedWellness.map((entry) => [
        entry.athleteId,
        entry.date,
        String(entry.sleep),
        String(entry.soreness),
        String(entry.fatigue),
        String(entry.mood),
        String(entry.stress),
        entry.readiness,
      ]),
    ]
    downloadCsv("coach-wellness-export.csv", rows)
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6 print:p-0">
      <section className="rounded-[28px] border border-[#d7e5f8] bg-[linear-gradient(135deg,#ffffff_0%,#f4f8fc_58%,#eef5ff_100%)] p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-[#eef5ff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1f5fd1]">
                {scopedTeam?.eventGroup ?? "Coach"}
              </span>
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                {scopedAthletes.length} athletes
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">Reports</h1>
            <p className="max-w-2xl text-sm text-slate-500">
              Review adherence risk, wellness signals, and PR movement across the active squad.
              {scopedTeam ? ` Viewing ${scopedTeam.name}.` : ""}
            </p>
          </div>
          <div className="hidden flex-wrap gap-2 lg:flex">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full border-slate-200 px-5 text-slate-950 hover:border-[#1f8cff] hover:bg-[#eef5ff] hover:text-slate-950"
              onClick={exportAthleteAdherence}
            >
              <HugeiconsIcon icon={FileDownloadIcon} className="size-4" />
              Adherence CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full border-slate-200 px-5 text-slate-950 hover:border-[#1f8cff] hover:bg-[#eef5ff] hover:text-slate-950"
              onClick={exportPrs}
            >
              <HugeiconsIcon icon={FileDownloadIcon} className="size-4" />
              PR CSV
            </Button>
            <Button
              type="button"
              className="h-11 rounded-full bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)] px-5 text-white shadow-[0_12px_28px_rgba(31,140,255,0.22)] hover:opacity-95"
              onClick={exportWellness}
            >
              <HugeiconsIcon icon={FileDownloadIcon} className="size-4" />
              Wellness CSV
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Report Snapshot</p>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Current Squad State</h2>
              <p className="text-sm text-slate-500">Readiness mix, plan adherence, and scoped data volume.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:w-[240px]">
              {[
                { label: "Athletes", value: scopedAthletes.length },
                { label: "PRs", value: scopedPrs.length },
                { label: "Logs", value: scopedWellness.length },
              ].map((item) => (
                <div key={item.label} className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                  <p className="mt-1.5 text-2xl font-semibold tracking-[-0.05em] text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)]">
            <div className="space-y-4">
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-3.5 sm:rounded-[22px] sm:p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-950">Readiness Mix</p>
                  <p className="text-xs text-slate-500">{readinessTotal} athletes</p>
                </div>
                <div className="relative h-[220px] overflow-hidden rounded-[18px] border border-slate-200 bg-[radial-gradient(circle_at_top,rgba(31,140,255,0.10),transparent_48%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
                  <PieChart
                    series={[
                      {
                        innerRadius: 52,
                        outerRadius: 82,
                        paddingAngle: 3,
                        cornerRadius: 6,
                        data: readinessPieData,
                        cx: 110,
                        cy: 108,
                      },
                    ]}
                    hideLegend
                    margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    height={220}
                    sx={pieSx}
                  />
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">In Scope</p>
                    <p className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-slate-950">{readinessTotal}</p>
                    <p className="mt-1 text-sm text-slate-500">athletes</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: "Ready", value: readinessSummary.green, tone: "bg-[#1f8cff]" },
                    { label: "Watch", value: readinessSummary.yellow, tone: "bg-amber-400" },
                    { label: "Review", value: readinessSummary.red, tone: "bg-rose-500" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={cn("size-2 rounded-full", item.tone)} />
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                      </div>
                      <p className="mt-1.5 text-xl font-semibold tracking-[-0.04em] text-slate-950">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-3.5 sm:rounded-[22px] sm:p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Plan Adherence</p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="text-3xl font-semibold tracking-[-0.05em] text-slate-950">{adherenceAverage}%</p>
                  <p className="hidden max-w-[13rem] text-right text-sm text-slate-500 sm:block">
                    Baseline adherence for the current reporting scope.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Wellness Signals</p>
                  <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">Daily Recovery</h3>
                </div>
                <p className="text-xs text-slate-500">Avg values</p>
              </div>
              <div className="mt-4 space-y-3">
                {wellnessBars.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-950">{item.label}</span>
                      <span className="text-slate-500">{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div className={cn("h-2 rounded-full", item.tone)} style={{ width: `${(item.value / item.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
          <div className="space-y-1 border-b border-slate-200 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Exports</p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Output Actions</h2>
          </div>
          <div className="mt-4 space-y-3">
            {[
              {
                title: "Adherence CSV",
                body: "Roster-level readiness, plan adherence, and last wellness timestamp.",
                action: exportAthleteAdherence,
                primary: true,
              },
              {
                title: "PR CSV",
                body: "Scoped record movement with previous marks and legality context.",
                action: exportPrs,
                primary: false,
              },
              {
                title: "Wellness CSV",
                body: "Daily wellness responses for meetings, review, and historical export.",
                action: exportWellness,
                primary: false,
              },
            ].map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={item.action}
                className={cn(
                  "w-full rounded-[18px] border px-4 py-4 text-left transition hover:-translate-y-0.5",
                  item.primary
                    ? "border-[#cfe2ff] bg-[linear-gradient(135deg,#eff6ff_0%,#f8fbff_100%)] shadow-[0_12px_28px_rgba(31,140,255,0.12)]"
                    : "border-slate-200 bg-slate-50 hover:border-[#cfe2ff] hover:bg-[#f8fbff]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.body}</p>
                  </div>
                  <HugeiconsIcon icon={FileDownloadIcon} className="mt-0.5 size-4 text-[#1f8cff]" />
                </div>
              </button>
            ))}
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-full border-slate-200 text-slate-950 hover:border-[#1f8cff] hover:bg-[#eef5ff] hover:text-slate-950"
              onClick={() => window.print()}
            >
              <HugeiconsIcon icon={PrinterIcon} className="size-4" />
              Print / PDF
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
          <div className="space-y-1 border-b border-slate-200 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Adherence Risk</p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Who Needs Follow-Up</h2>
          </div>
          <div className="mt-4">
            {lowAdherenceRows.length > 0 ? (
              <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f4f8fc_100%)] p-2.5 sm:rounded-[22px] sm:p-3">
                <BarChart
                  dataset={adherenceChartRows}
                  xAxis={[{ scaleType: "band", dataKey: "athlete" }]}
                  yAxis={[{ min: 0, max: 100 }]}
                  series={[{ dataKey: "adherence", label: "Plan Adherence", color: "#1f8cff" }]}
                  grid={{ horizontal: true }}
                  margin={{ left: 28, right: 16, top: 18, bottom: 24 }}
                  height={280}
                  sx={chartSx}
                />
              </div>
            ) : (
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                No adherence risks in the current scope.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
          <div className="space-y-1 border-b border-slate-200 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">PR Movement</p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Where Improvement Is Landing</h2>
          </div>
          <div className="mt-4">
            {prByCategory.length > 0 ? (
              <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f4f8fc_100%)] p-2.5 sm:rounded-[22px] sm:p-3">
                <BarChart
                  dataset={prChartRows}
                  xAxis={[{ scaleType: "band", dataKey: "category" }]}
                  series={[{ dataKey: "count", label: "PR count", color: "#4759ff" }]}
                  grid={{ horizontal: true }}
                  margin={{ left: 28, right: 16, top: 18, bottom: 24 }}
                  height={260}
                  sx={chartSx}
                />
              </div>
            ) : (
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                No PR movement in the current scope.
              </div>
            )}
          </div>

          <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Recent Records</p>
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">Latest Improvements</h3>
            </div>
            <div className="mt-4 space-y-3">
              {recentPrs.length > 0 ? (
                recentPrs.map((pr) => (
                  <div key={pr.id} className="rounded-[16px] border border-slate-200 bg-white px-3.5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{pr.athleteName}</p>
                        <p className="text-sm text-slate-500">{pr.event}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#1f8cff]">
                        <HugeiconsIcon icon={ArrowUp01Icon} className="size-4" />
                        {pr.bestValue}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {pr.previousValue ? `${pr.previousValue} -> ` : ""}{pr.date}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No PR records available.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
