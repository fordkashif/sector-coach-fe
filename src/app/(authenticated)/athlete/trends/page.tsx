"use client"

import { LineChart } from "@mui/x-charts"
import { mockAthletes, mockTrendSeries } from "@/lib/mock-data"

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
  "& .MuiLineElement-root": {
    strokeLinecap: "round",
  },
  "& .MuiMarkElement-root": {
    stroke: "#ffffff",
    strokeWidth: 2,
  },
}

export default function AthleteTrendsPage() {
  const athlete = mockAthletes[0]
  const trend = mockTrendSeries[athlete.id] ?? []

  const averages = trend.length
    ? {
        readiness: Math.round(trend.reduce((sum, point) => sum + point.readiness, 0) / trend.length),
        fatigue: Math.round(trend.reduce((sum, point) => sum + point.fatigue, 0) / trend.length),
        load: Math.round(trend.reduce((sum, point) => sum + point.trainingLoad, 0) / trend.length),
      }
    : { readiness: 0, fatigue: 0, load: 0 }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6">
      <section className="-mx-4 px-4 py-4 sm:-mx-6 sm:px-6 sm:py-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Trends</h1>
          <p className="text-sm text-slate-500">Readiness, fatigue, and training load over your recent training days.</p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Trend Lines</p>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Performance Signals</h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#1f8cff]" /> Readiness</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#4759ff]" /> Load</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-slate-900" /> Fatigue</span>
            </div>
          </div>

          <div className="mt-4">
            {trend.length > 0 ? (
              <div className="overflow-hidden rounded-[18px] border border-[#d9e6f7] bg-[radial-gradient(circle_at_top,rgba(31,140,255,0.16),transparent_45%),linear-gradient(180deg,#fbfdff_0%,#eef5ff_100%)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:rounded-[22px] sm:p-3">
                <div className="mb-3 grid grid-cols-3 gap-2">
                  {[
                    { label: "Readiness", value: trend[trend.length - 1].readiness, tone: "bg-[#1f8cff]" },
                    { label: "Load", value: trend[trend.length - 1].trainingLoad, tone: "bg-[#4759ff]" },
                    { label: "Fatigue", value: trend[trend.length - 1].fatigue, tone: "bg-slate-900" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[14px] border border-white/80 bg-white/80 px-3 py-2.5 backdrop-blur">
                      <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${item.tone}`} />
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                      </div>
                      <p className="mt-1 text-lg font-semibold tracking-[-0.04em] text-slate-950">{item.value}</p>
                    </div>
                  ))}
                </div>
                <LineChart
                  xAxis={[
                    {
                      scaleType: "point",
                      data: trend.map((point) => new Date(point.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })),
                    },
                  ]}
                  yAxis={[{ min: 0, max: 100 }]}
                  series={[
                    { data: trend.map((point) => point.readiness), label: "Readiness", color: "#1f8cff", curve: "monotoneX", showMark: true },
                    { data: trend.map((point) => point.trainingLoad), label: "Load", color: "#4759ff", curve: "monotoneX", showMark: false },
                    { data: trend.map((point) => point.fatigue), label: "Fatigue", color: "#0f172a", curve: "monotoneX", showMark: false },
                  ]}
                  grid={{ horizontal: true }}
                  margin={{ left: 28, right: 16, top: 18, bottom: 24 }}
                  height={248}
                  sx={chartSx}
                />
              </div>
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Averages</p>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Baseline View</h2>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "Readiness", value: averages.readiness },
                { label: "Fatigue", value: averages.fatigue },
                { label: "Load", value: averages.load },
              ].map((item) => (
                <div key={item.label} className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                  <p className="mt-1.5 text-2xl font-semibold tracking-[-0.05em] text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
            <div className="space-y-1 border-b border-slate-200 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Latest Day</p>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Most Recent Check</h2>
            </div>
            {trend.length > 0 ? (
              <div className="mt-4 space-y-3">
                {[
                  { label: "Readiness", value: trend[trend.length - 1].readiness, tone: "bg-[#1f8cff]" },
                  { label: "Fatigue", value: trend[trend.length - 1].fatigue, tone: "bg-slate-900" },
                  { label: "Training load", value: trend[trend.length - 1].trainingLoad, tone: "bg-[#4759ff]" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-950">{item.label}</span>
                      <span className="text-slate-500">{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div className={item.tone} style={{ width: `${item.value}%`, height: "100%", borderRadius: 9999 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                No recent trend point available.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
