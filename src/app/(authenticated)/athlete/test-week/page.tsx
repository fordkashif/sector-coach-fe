"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { tenantStorageKey } from "@/lib/tenant-storage"
import { mockAthletes, mockPRs, mockTestDefinitions, onSubmitTestWeek } from "@/lib/mock-data"

type TestSubmission = Record<string, string>
const PR_OVERRIDE_STORAGE_KEY = "pacelab:pr-overrides"

export default function AthleteTestWeekPage() {
  const athlete = mockAthletes[0]
  const [values, setValues] = useState<TestSubmission>(Object.fromEntries(mockTestDefinitions.map((test) => [test, ""])))
  const [prUpdates, setPrUpdates] = useState<string[]>([])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmitTestWeek()

    const updates: string[] = []
    const athletePrs = mockPRs.filter((pr) => pr.athleteId === athlete.id)

    athletePrs.forEach((pr) => {
      const next = values[pr.event]
      if (!next) return
      if (next !== pr.bestValue) {
        updates.push(`${pr.event}: ${pr.bestValue} -> ${next}`)
      }
    })

    if (values["CMJ"] && !athletePrs.some((pr) => pr.event === "CMJ")) {
      updates.push(`CMJ: added new benchmark ${values["CMJ"]}`)
    }

    const key = tenantStorageKey(PR_OVERRIDE_STORAGE_KEY)
    const existing = JSON.parse(window.localStorage.getItem(key) ?? "{}") as Record<string, string>
    const nextOverrides = { ...existing }
    Object.entries(values).forEach(([eventName, value]) => {
      if (value.trim()) {
        nextOverrides[eventName] = value.trim()
      }
    })
    window.localStorage.setItem(key, JSON.stringify(nextOverrides))

    setPrUpdates(updates)
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6">
      <section className="-mx-4 px-4 py-4 sm:-mx-6 sm:px-6 sm:py-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Test Week</h1>
          <p className="text-sm text-slate-500">Submit current benchmark results so your coach can review progress and update records.</p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
          <div className="space-y-1 border-b border-slate-200 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Submission</p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Enter Results</h2>
          </div>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              {mockTestDefinitions.map((test) => (
                <div key={test} className="space-y-2 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <Label htmlFor={test} className="text-sm font-medium text-slate-950">{test}</Label>
                  <Input
                    id={test}
                    placeholder="4.01s or 6.51m"
                    value={values[test]}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [test]: event.target.value,
                      }))
                    }
                    className="h-12 rounded-[16px] border-slate-200 bg-white text-slate-950"
                  />
                </div>
              ))}
            </div>
            <Button type="submit" className="h-12 w-full rounded-full bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)] text-white shadow-[0_12px_28px_rgba(31,140,255,0.22)] hover:opacity-95">
              Submit results
            </Button>
          </form>
        </div>

        <div className="space-y-5">
          <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
            <div className="space-y-1 border-b border-slate-200 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Assessment Mix</p>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Current Battery</h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {mockTestDefinitions.map((test, index) => (
                <div key={test} className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Test {index + 1}</p>
                  <p className="mt-1.5 text-sm font-medium text-slate-950">{test}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
            <div className="space-y-1 border-b border-slate-200 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Auto PR Updates</p>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Detected Changes</h2>
            </div>
            <div className="mt-4 space-y-3">
              {prUpdates.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <p className="text-sm text-slate-500">Submit results to detect PR movement automatically.</p>
                </div>
              ) : (
                prUpdates.map((update) => (
                  <div key={update} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-950">
                    {update}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
