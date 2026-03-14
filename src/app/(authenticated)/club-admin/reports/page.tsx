"use client"

import { BarChart, PieChart } from "@mui/x-charts"
import { ClubAdminNav } from "@/components/club-admin/admin-nav"
import { Button } from "@/components/ui/button"
import { loadClubInvites, loadClubTeams, loadClubUsers } from "../state"
import { mockAthletes, mockPRs } from "@/lib/mock-data"
import { logAuditEvent } from "@/lib/mock-audit"
import { HugeiconsIcon } from "@hugeicons/react"
import { FileDownloadIcon, PrinterIcon } from "@hugeicons/core-free-icons"
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
  "& .MuiChartsLegend-root": {
    display: "none",
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

export default function ClubAdminReportsPage() {
  const users = loadClubUsers()
  const teams = loadClubTeams()
  const invites = loadClubInvites()

  const exportClubUsers = () => {
    const rows = [["Name", "Email", "Role", "Status", "Team"], ...users.map((user) => [user.name, user.email, user.role, user.status, user.teamId ?? "-"])]
    downloadCsv("club-users.csv", rows)
    logAuditEvent({ actor: "club-admin", action: "export_csv", target: "users", detail: "club-users.csv" })
  }

  const exportTeams = () => {
    const rows = [["Team", "Event Group", "Status", "Coach"], ...teams.map((team) => [team.name, team.eventGroup, team.status, team.coachEmail ?? "-"])]
    downloadCsv("club-teams.csv", rows)
    logAuditEvent({ actor: "club-admin", action: "export_csv", target: "teams", detail: "club-teams.csv" })
  }

  const exportPerformance = () => {
    const rows = [
      ["Athlete", "Readiness", "Plan Adherence", "Latest PR Event", "Latest PR"],
      ...mockAthletes.map((athlete) => {
        const lastPr = mockPRs.find((pr) => pr.athleteId === athlete.id)
        return [athlete.name, athlete.readiness, `${athlete.adherence}%`, lastPr?.event ?? "-", lastPr?.bestValue ?? "-"]
      }),
    ]
    downloadCsv("club-performance.csv", rows)
    logAuditEvent({ actor: "club-admin", action: "export_csv", target: "performance", detail: "club-performance.csv" })
  }

  const readinessSummary = {
    green: mockAthletes.filter((athlete) => athlete.readiness === "green").length,
    yellow: mockAthletes.filter((athlete) => athlete.readiness === "yellow").length,
    red: mockAthletes.filter((athlete) => athlete.readiness === "red").length,
  }
  const readinessTotal = readinessSummary.green + readinessSummary.yellow + readinessSummary.red
  const readinessPieData = [
    { id: "ready", value: readinessSummary.green, label: "Ready", color: "#10b981" },
    { id: "watch", value: readinessSummary.yellow, label: "Watch", color: "#fbbf24" },
    { id: "review", value: readinessSummary.red, label: "Review", color: "#f43f5e" },
  ]

  const prByCategory = Object.entries(
    mockPRs.reduce<Record<string, number>>((acc, pr) => {
      acc[pr.category] = (acc[pr.category] ?? 0) + 1
      return acc
    }, {}),
  ).sort((left, right) => right[1] - left[1])
  const prChartRows = prByCategory.map(([category, count]) => ({ category, count }))

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6 print:p-0">
      <section className="-mx-4 px-4 py-4 sm:-mx-6 sm:px-6 sm:py-5">
        <div className="space-y-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Reports & Exports</h1>
            <p className="text-sm text-slate-500">Export tenant-level user, team, and performance data from one reporting surface.</p>
          </div>
          <ClubAdminNav />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Snapshot</p>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Tenant Footprint</h2>
              <p className="text-sm text-slate-500">Users, teams, invites, and overall readiness state.</p>
            </div>
            <div className="grid grid-cols-4 gap-2 lg:w-[360px]">
              {[
                { label: "Users", value: users.length },
                { label: "Teams", value: teams.length },
                { label: "Invites", value: invites.length },
                { label: "PR rows", value: mockPRs.length },
              ].map((item) => (
                <div key={item.label} className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                  <p className="mt-1.5 text-2xl font-semibold tracking-[-0.05em] text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.72fr)]">
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-3.5 sm:rounded-[22px] sm:p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-950">Readiness Distribution</p>
                <p className="text-xs text-slate-500">{readinessTotal} athletes</p>
              </div>
              <div className="relative h-[220px] overflow-hidden rounded-[18px] border border-slate-200 bg-[radial-gradient(circle_at_top,rgba(31,140,255,0.10),transparent_48%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
                <PieChart
                  series={[
                    { innerRadius: 52, outerRadius: 82, paddingAngle: 3, cornerRadius: 6, data: readinessPieData, cx: 110, cy: 108 },
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
                  { label: "Ready", value: readinessSummary.green, tone: "bg-emerald-500" },
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

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">PR Distribution</p>
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">Event Mix</h3>
              </div>
              <div className="mt-4 overflow-hidden rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f4f8fc_100%)] p-2.5">
                <BarChart
                  dataset={prChartRows}
                  xAxis={[{ scaleType: "band", dataKey: "category" }]}
                  series={[{ dataKey: "count", label: "PR count", color: "#4759ff" }]}
                  grid={{ horizontal: true }}
                  margin={{ left: 28, right: 16, top: 18, bottom: 24 }}
                  height={220}
                  sx={chartSx}
                />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {prChartRows.slice(0, 3).map((item) => (
                  <div key={item.category} className="rounded-[14px] border border-slate-200 bg-white px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.category}</p>
                    <p className="mt-1 text-lg font-semibold tracking-[-0.04em] text-slate-950">{item.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
          <div className="space-y-1 border-b border-slate-200 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Export Center</p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Output Actions</h2>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { title: "Users CSV", body: "All users with role, status, and current team assignment.", action: exportClubUsers, primary: true },
              { title: "Teams CSV", body: "Team structure, event group, status, and coach assignment.", action: exportTeams, primary: false },
              { title: "Performance CSV", body: "Readiness, plan adherence, and latest PR data for athletes.", action: exportPerformance, primary: false },
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
              onClick={() => {
                window.print()
                logAuditEvent({ actor: "club-admin", action: "export_pdf", target: "reports", detail: "print flow" })
              }}
            >
              <HugeiconsIcon icon={PrinterIcon} className="size-4" />
              Export PDF (print)
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
