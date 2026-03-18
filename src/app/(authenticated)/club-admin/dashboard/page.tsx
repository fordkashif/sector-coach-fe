"use client"

import { BarChart, PieChart } from "@mui/x-charts"
import { Link } from "react-router-dom"
import { ClubAdminNav } from "@/components/club-admin/admin-nav"
import { Button } from "@/components/ui/button"
import { mockAthletes } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { loadClubAccountRequests, loadClubInvites, loadClubTeams, loadClubUsers } from "../state"

const pieSx = {
  "& .MuiPieArc-root": {
    stroke: "#ffffff",
    strokeWidth: 3,
  },
}

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

function kpiData() {
  const users = loadClubUsers()
  const teams = loadClubTeams()
  const invites = loadClubInvites()
  const accountRequests = loadClubAccountRequests()
  const activeAthletes = users.filter((user) => user.role === "athlete" && user.status === "active").length
  const activeCoaches = users.filter((user) => user.role === "coach" && user.status === "active").length
  const adherenceAverage = Math.round(
    mockAthletes.reduce((acc, athlete) => acc + athlete.adherence, 0) / Math.max(mockAthletes.length, 1)
  )

  return {
    users: users.length,
    teams: teams.filter((team) => team.status === "active").length,
    activeAthletes,
    activeCoaches,
    pendingInvites: invites.filter((invite) => invite.status === "pending").length,
    pendingRequests: accountRequests.filter((request) => request.status === "pending").length,
    adherenceAverage,
  }
}

export default function ClubAdminDashboardPage() {
  const kpi = kpiData()
  const users = loadClubUsers()
  const readinessSummary = {
    green: mockAthletes.filter((athlete) => athlete.readiness === "green").length,
    yellow: mockAthletes.filter((athlete) => athlete.readiness === "yellow").length,
    red: mockAthletes.filter((athlete) => athlete.readiness === "red").length,
  }
  const readinessTotal = readinessSummary.green + readinessSummary.yellow + readinessSummary.red
  const readinessPieData = [
    { id: "ready", value: readinessSummary.green, label: "Ready", color: "#3b82f6" },
    { id: "watch", value: readinessSummary.yellow, label: "Watch", color: "#fbbf24" },
    { id: "review", value: readinessSummary.red, label: "Review", color: "#f43f5e" },
  ]
  const peopleMixRows = [
    { label: "Athletes", value: users.filter((user) => user.role === "athlete").length },
    { label: "Coaches", value: users.filter((user) => user.role === "coach").length },
    { label: "Club Admins", value: users.filter((user) => user.role === "club-admin").length },
  ]
  const readinessSegments = [
    { label: "Ready", value: readinessSummary.green, tone: "bg-[#3b82f6]", surface: "bg-[#e0edff]", text: "text-[#1f5fd1]" },
    { label: "Watch", value: readinessSummary.yellow, tone: "bg-amber-400", surface: "bg-amber-50", text: "text-amber-700" },
    { label: "Review", value: readinessSummary.red, tone: "bg-rose-500", surface: "bg-rose-50", text: "text-rose-700" },
  ]

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6">
      <section className="page-intro">
        <div className="space-y-3">
          <div>
            <h1 className="page-intro-title">Club Admin Dashboard</h1>
            <p className="page-intro-copy">Tenant-wide view for users, teams, access requests, and readiness state.</p>
          </div>
          <ClubAdminNav />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="mobile-card-primary">
          <div className="space-y-1 border-b border-slate-200 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Tenant Snapshot</p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Operations Overview</h2>
            <p className="text-sm text-slate-500">Users, teams, readiness distribution, and pending access work.</p>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.78fr)]">
            <div className="space-y-4">
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-3.5 sm:rounded-[22px] sm:p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-950">Readiness Overview</p>
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
                  {readinessSegments.map((item) => (
                    <div key={item.label} className={cn("rounded-[16px] border border-transparent px-3 py-2.5", item.surface)}>
                      <div className="flex items-center gap-2">
                        <span className={cn("size-2 rounded-full", item.tone)} />
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                      </div>
                      <p className={cn("mt-1.5 text-xl font-semibold tracking-[-0.04em]", item.text)}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[18px] border border-[#d7e5f8] bg-[linear-gradient(180deg,#fbfdff_0%,#f4f8fc_100%)] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:rounded-[22px] sm:p-4">
              <div className="space-y-1 border-b border-slate-200 pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Admin Signals</p>
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">Access + People Mix</h3>
              </div>

              <div className="mt-4 rounded-[18px] border border-[#d7e5f8] bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">People Mix</p>
                <div className="mt-3 overflow-hidden rounded-[16px] border border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f4f8fc_100%)] p-2.5">
                  <BarChart
                    dataset={peopleMixRows}
                    xAxis={[{ scaleType: "band", dataKey: "label" }]}
                    yAxis={[{ min: 0 }]}
                    series={[{ dataKey: "value", label: "Users", color: "#1f8cff" }]}
                    grid={{ horizontal: true }}
                    margin={{ left: 28, right: 12, top: 16, bottom: 24 }}
                    height={188}
                    sx={chartSx}
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: "Users", value: kpi.users },
                    { label: "Teams", value: kpi.teams },
                    { label: "Plan Adherence", value: `${kpi.adherenceAverage}%` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                      <p className="mt-1 text-lg font-semibold tracking-[-0.04em] text-slate-950">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 space-y-2.5">
                {[
                  {
                    label: "Pending invites",
                    value: kpi.pendingInvites,
                    body: "Outbound invites still waiting for acceptance.",
                    tone: kpi.pendingInvites > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600",
                  },
                  {
                    label: "Pending requests",
                    value: kpi.pendingRequests,
                    body: "New club-admin access requests awaiting review.",
                    tone: kpi.pendingRequests > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600",
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-[16px] border border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                        <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">{item.value}</p>
                      </div>
                      <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", item.tone)}>
                        {item.value > 0 ? "Needs action" : "Clear"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{item.body}</p>
                  </div>
                ))}
              </div>

              <Button asChild className="mt-3 h-11 w-full rounded-full bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)] text-white shadow-[0_12px_28px_rgba(31,140,255,0.22)] hover:opacity-95">
                <Link to="/club-admin/users">Open users</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mobile-card-primary">
          <div className="space-y-1 border-b border-slate-200 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Operations</p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Admin Actions</h2>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { title: "Users & Roles", body: "Create users, review account requests, and update access.", href: "/club-admin/users" },
              { title: "Teams", body: "Maintain team structure and coach assignment coverage.", href: "/club-admin/teams" },
              { title: "Billing & Audit", body: "Review billing state and exported audit records.", href: "/club-admin/billing" },
            ].map((item, index) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "block rounded-[18px] border px-4 py-4 transition hover:-translate-y-0.5",
                  index === 0
                    ? "border-[#cfe2ff] bg-[linear-gradient(135deg,#eff6ff_0%,#f8fbff_100%)] shadow-[0_12px_28px_rgba(31,140,255,0.12)]"
                    : "border-slate-200 bg-slate-50 hover:border-[#cfe2ff] hover:bg-[#f8fbff]",
                )}
              >
                <p className="font-semibold text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">{item.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
