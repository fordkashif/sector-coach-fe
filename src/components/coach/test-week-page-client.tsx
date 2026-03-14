"use client"

import { Add01Icon, ArrowLeft01Icon, ArrowRight01Icon, Delete01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { EventGroup, mockAthletes, mockTeams, onCreateTestWeek, type Role } from "@/lib/mock-data"
import { tenantStorageKey } from "@/lib/tenant-storage"
import { cn } from "@/lib/utils"

type Step = 1 | 2 | 3
type AssignTarget = "team" | "subgroup" | "selected"

interface TestDefinition {
  id: string
  name: string
  unit: "time" | "distance" | "weight" | "height"
}

interface TestWeekDraft {
  name: string
  teamId: string
  startDate: string
  endDate: string
  notes: string
}

interface TestWeekListItem {
  id: string
  name: string
  teamId: string
  startDate: string
  endDate: string
  testCount: number
  status: "Draft" | "Published"
}

interface CoachTestWeekPageClientProps {
  initialRole: Role
  initialCoachTeamId: string | null
}

const INITIAL_TESTS: TestDefinition[] = [
  { id: "test-30m", name: "30m", unit: "time" },
  { id: "test-flying30", name: "Flying 30m", unit: "time" },
  { id: "test-150m", name: "150m", unit: "time" },
  { id: "test-lj", name: "Long Jump", unit: "distance" },
  { id: "test-shot", name: "Shot Put", unit: "distance" },
  { id: "test-squat", name: "Squat 1RM", unit: "weight" },
  { id: "test-cmj", name: "CMJ", unit: "height" },
]

const TEST_WEEK_HISTORY_KEY = "pacelab:test-week-history"
const STEP_META = [
  { value: 1, label: "Setup" },
  { value: 2, label: "Build" },
  { value: 3, label: "Publish" },
] as const

const AVATAR_SWATCHES = [
  "bg-[#dbeafe] text-[#1d4ed8]",
  "bg-[#ede9fe] text-[#6d28d9]",
  "bg-[#dcfce7] text-[#15803d]",
  "bg-[#fee2e2] text-[#b91c1c]",
  "bg-[#fef3c7] text-[#b45309]",
]

function athleteInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

const MOCK_TEST_WEEKS: TestWeekListItem[] = [
  {
    id: "mock-test-week-1",
    name: "January Speed Testing",
    teamId: "t1",
    startDate: "2026-01-12",
    endDate: "2026-01-16",
    testCount: 5,
    status: "Published",
  },
  {
    id: "mock-test-week-2",
    name: "February Power + Jump Check",
    teamId: "t3",
    startDate: "2026-02-09",
    endDate: "2026-02-13",
    testCount: 4,
    status: "Published",
  },
  {
    id: "mock-test-week-3",
    name: "March Throwing Benchmark",
    teamId: "t4",
    startDate: "2026-03-02",
    endDate: "2026-03-06",
    testCount: 6,
    status: "Published",
  },
]

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export default function CoachTestWeekPageClient({
  initialRole,
  initialCoachTeamId,
}: CoachTestWeekPageClientProps) {
  const scopedTeamId = useMemo(
    () => (initialRole === "coach" ? initialCoachTeamId : null),
    [initialCoachTeamId, initialRole]
  )
  const today = new Date()
  const [view, setView] = useState<"list" | "wizard">("list")
  const [step, setStep] = useState<Step>(1)
  const [draft, setDraft] = useState<TestWeekDraft>({
    name: "",
    teamId: scopedTeamId ?? mockTeams[0]?.id ?? "",
    startDate: toInputDate(today),
    endDate: toInputDate(addDays(today, 4)),
    notes: "",
  })
  const [tests, setTests] = useState<TestDefinition[]>(INITIAL_TESTS)
  const [newTestName, setNewTestName] = useState("")
  const [newTestUnit, setNewTestUnit] = useState<TestDefinition["unit"]>("time")
  const [assignTarget, setAssignTarget] = useState<AssignTarget>("team")
  const [assignSubgroup, setAssignSubgroup] = useState<EventGroup>("Sprint")
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([])
  const [publishedCount, setPublishedCount] = useState<number | null>(null)
  const [createdTestWeeks, setCreatedTestWeeks] = useState<TestWeekListItem[]>([])

  const isScopedCoach = initialRole === "coach" && Boolean(scopedTeamId)
  const effectiveTeamId = scopedTeamId ?? draft.teamId
  const effectiveTeam = mockTeams.find((team) => team.id === effectiveTeamId)
  const teamAthletes = mockAthletes.filter((athlete) => athlete.teamId === effectiveTeamId)

  const getAssignedCount = () => {
    if (isScopedCoach) return teamAthletes.length
    if (assignTarget === "team") return teamAthletes.length
    if (assignTarget === "subgroup") return teamAthletes.filter((athlete) => athlete.eventGroup === assignSubgroup).length
    return selectedAthleteIds.length
  }

  const assignedCount = getAssignedCount()
  const testsByUnit = tests.reduce<Record<TestDefinition["unit"], number>>(
    (acc, test) => {
      acc[test.unit] += 1
      return acc
    },
    { time: 0, distance: 0, weight: 0, height: 0 },
  )
  const listedTestWeeks = useMemo(
    () => [
      ...createdTestWeeks,
      ...MOCK_TEST_WEEKS.filter((testWeek) => (scopedTeamId ? testWeek.teamId === scopedTeamId : true)),
    ],
    [createdTestWeeks, scopedTeamId],
  )

  const openWizard = () => {
    setView("wizard")
    setStep(1)
    setPublishedCount(null)
  }

  const addTest = () => {
    if (!newTestName.trim()) return
    setTests((prev) => [...prev, { id: makeId("test"), name: newTestName.trim(), unit: newTestUnit }])
    setNewTestName("")
    setNewTestUnit("time")
  }

  const removeTest = (id: string) => {
    setTests((prev) => prev.filter((test) => test.id !== id))
  }

  useEffect(() => {
    if (!isScopedCoach) return
    setAssignTarget("team")
    setAssignSubgroup(effectiveTeam?.eventGroup ?? "Sprint")
    setSelectedAthleteIds([])
  }, [effectiveTeam?.eventGroup, isScopedCoach])

  const publishTestWeek = () => {
    onCreateTestWeek()
    setPublishedCount(assignedCount)
    const created: TestWeekListItem = {
      id: makeId("tw"),
      name: draft.name,
      teamId: effectiveTeamId,
      startDate: draft.startDate,
      endDate: draft.endDate,
      testCount: tests.length,
      status: "Published",
    }
    setCreatedTestWeeks((prev) => [created, ...prev])
    const key = tenantStorageKey(TEST_WEEK_HISTORY_KEY)
    const current = JSON.parse(window.localStorage.getItem(key) ?? "[]") as TestWeekListItem[]
    window.localStorage.setItem(key, JSON.stringify([created, ...current].slice(0, 50)))
  }

  if (view === "list") {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
        <section className="-mx-4 px-4 py-4 sm:-mx-6 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Test Weeks</h1>
              <p className="text-sm text-slate-500">Build and publish testing blocks.</p>
            </div>
            <Button
              type="button"
              size="icon"
              aria-label="Create test week"
              onClick={openWizard}
              className="rounded-full bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_14px_34px_rgba(31,140,255,0.32),0_0_28px_rgba(71,89,255,0.18)] hover:opacity-95"
            >
              <HugeiconsIcon icon={Add01Icon} className="size-5" />
            </Button>
          </div>

          <div className="hidden gap-3 md:grid-cols-3 lg:grid">
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-sm text-muted-foreground">Published test weeks</p>
              <p className="mt-1 text-xl font-semibold">{listedTestWeeks.length}</p>
            </div>
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-sm text-muted-foreground">Tests in current template</p>
              <p className="mt-1 text-xl font-semibold">{tests.length}</p>
            </div>
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-sm text-muted-foreground">Team in scope</p>
              <p className="mt-1 text-xl font-semibold">{effectiveTeam?.name ?? "Assigned team"}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            {listedTestWeeks.length === 0 ? (
              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
                <p className="text-sm text-muted-foreground">No test weeks yet.</p>
              </div>
            ) : null}
            {listedTestWeeks.map((testWeek) => {
              const teamName = mockTeams.find((team) => team.id === testWeek.teamId)?.name ?? "Assigned team"
              const testWeekAthletes = mockAthletes.filter((athlete) => athlete.teamId === testWeek.teamId)
              return (
                <article
                  key={testWeek.id}
                  className="rounded-[26px] border border-slate-200 bg-white px-4 py-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] transition-all sm:px-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {teamName}
                        </span>
                        <span className="inline-flex rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                          {testWeek.testCount} test{testWeek.testCount === 1 ? "" : "s"}
                        </span>
                      </div>
                      <p className="text-[1.15rem] font-semibold leading-tight tracking-[-0.03em] text-slate-950">{testWeek.name}</p>
                      <p className="text-sm text-slate-500">
                        {testWeek.startDate} to {testWeek.endDate}
                      </p>
                      <div className="flex items-center gap-3 pt-1">
                        <div className="flex -space-x-2">
                          {testWeekAthletes.slice(0, 5).map((athlete, index) => (
                            <div
                              key={athlete.id}
                              className={cn(
                                "flex size-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-semibold shadow-sm",
                                AVATAR_SWATCHES[index % AVATAR_SWATCHES.length],
                              )}
                              title={athlete.name}
                            >
                              {athleteInitials(athlete.name)}
                            </div>
                          ))}
                          {testWeekAthletes.length > 5 ? (
                            <div className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-slate-950 text-[11px] font-semibold text-white shadow-sm">
                              +{testWeekAthletes.length - 5}
                            </div>
                          ) : null}
                        </div>
                        <p className="text-xs text-slate-500">
                          {testWeekAthletes.length} athlete{testWeekAthletes.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex rounded-full bg-[#1f8cff] px-3 py-1.5 text-xs font-semibold text-white">
                      {testWeek.status}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>

          <aside className="hidden rounded-2xl border bg-card p-5 xl:block">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Current template</p>
              <h2 className="text-lg font-semibold tracking-tight">Assessment mix</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border p-3">
                <p className="text-muted-foreground">Time tests</p>
                <p className="mt-1 text-lg font-semibold">{testsByUnit.time}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-muted-foreground">Distance tests</p>
                <p className="mt-1 text-lg font-semibold">{testsByUnit.distance}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-muted-foreground">Strength / jump tests</p>
                <p className="mt-1 text-lg font-semibold">{testsByUnit.weight + testsByUnit.height}</p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      <header className="rounded-[28px] border border-[#d7e5f8] bg-[linear-gradient(135deg,#ffffff_0%,#f4f8fc_58%,#eef5ff_100%)] p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
        <div className="flex items-start gap-3">
          <Button type="button" variant="outline" size="icon" className="mt-0.5 rounded-full border-slate-200 bg-white text-slate-950 hover:border-[#1f8cff] hover:bg-[#eef5ff] hover:text-slate-950" aria-label="Back to list" onClick={() => setView("list")}>
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
          </Button>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-[#eef5ff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1f5fd1]">Testing</span>
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">{effectiveTeam?.name ?? "Assigned team"}</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">Create Test Week</h1>
            <p className="max-w-2xl text-sm text-slate-500">
              Set the window, add tests, and publish.
              {scopedTeamId ? ` Scoped to ${effectiveTeam?.name ?? "assigned team"}.` : ""}
            </p>
          </div>
        </div>
      </header>

      <div className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
        <div className="grid grid-cols-3 gap-3">
          {STEP_META.map(({ value, label }) => (
            <div key={value} className="space-y-1">
              <div className={cn("h-1.5 rounded-full", step >= value ? "bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)]" : "bg-slate-200")} />
              <div className="text-center">
                <p className="text-xs font-medium text-slate-950">{label}</p>
                <p className="text-[11px] text-slate-500">Step {value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="hidden rounded-2xl border bg-card p-4 lg:block">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Team</p>
            <p className="mt-1 text-lg font-semibold">{effectiveTeam?.name ?? "Assigned team"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tests configured</p>
            <p className="mt-1 text-lg font-semibold">{tests.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Publish target</p>
            <p className="mt-1 text-lg font-semibold">{assignedCount} athletes</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Testing window</p>
            <p className="mt-1 text-lg font-semibold">{draft.startDate} to {draft.endDate}</p>
          </div>
        </div>
      </section>

      {step === 1 ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4 rounded-2xl border bg-card p-4">
            <div>
              <h2 className="text-lg font-semibold">Setup</h2>
              <p className="text-sm text-muted-foreground">
                {isScopedCoach ? "Set the testing window." : "Set the name, team, and dates."}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Test week name</Label>
                <Input value={draft.name} placeholder="Week 4 Testing" onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
              </div>
              {scopedTeamId ? null : (
                <div className="space-y-2">
                  <Label>Team</Label>
                  <Select value={draft.teamId} onValueChange={(value) => setDraft((p) => ({ ...p, teamId: value }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{mockTeams.map((team) => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Start date</Label>
                <Input type="date" value={draft.startDate} onChange={(e) => setDraft((p) => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>End date</Label>
                <Input type="date" value={draft.endDate} onChange={(e) => setDraft((p) => ({ ...p, endDate: e.target.value }))} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Notes (optional)</Label>
                <Textarea rows={3} value={draft.notes} onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={() => setStep(2)}>
                Continue to build
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
              </Button>
            </div>
          </div>

          <aside className="hidden rounded-2xl border bg-card p-4 xl:block">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Summary</p>
              <h3 className="text-lg font-semibold tracking-tight">Context</h3>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border p-3">
                <p className="text-muted-foreground">Team</p>
                <p className="mt-1 font-medium">{effectiveTeam?.name ?? "Assigned team"}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-muted-foreground">Window</p>
                <p className="mt-1 font-medium">{draft.startDate} to {draft.endDate}</p>
              </div>
            </div>
          </aside>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4 rounded-2xl border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">Build</h2>
                <p className="text-sm text-muted-foreground">Add and adjust tests.</p>
              </div>
              <Drawer>
                <DrawerTrigger asChild>
                  <Button type="button" size="icon" aria-label="Add test">
                    <HugeiconsIcon icon={Add01Icon} className="size-5" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader className="text-left">
                    <DrawerTitle>Add test</DrawerTitle>
                    <DrawerDescription>Create a custom test definition for this test week.</DrawerDescription>
                  </DrawerHeader>
                  <div className="space-y-3 px-4 pb-2">
                    <div className="space-y-2">
                      <Label>Test name</Label>
                      <Input value={newTestName} onChange={(e) => setNewTestName(e.target.value)} placeholder="e.g. 300m" />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Select value={newTestUnit} onValueChange={(value) => setNewTestUnit(value as TestDefinition["unit"])}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="time">time</SelectItem>
                          <SelectItem value="distance">distance</SelectItem>
                          <SelectItem value="weight">weight</SelectItem>
                          <SelectItem value="height">height</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button type="button" onClick={addTest}>Add test</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </div>

            <div className="space-y-2">
              {tests.map((test) => (
                <div key={test.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{test.name}</p>
                    <p className="text-xs text-muted-foreground">Type: {test.unit}</p>
                  </div>
                  <Button type="button" size="icon" variant="outline" aria-label="Remove test" onClick={() => removeTest(test.id)}>
                    <HugeiconsIcon icon={Delete01Icon} className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
                Back
              </Button>
              <Button type="button" onClick={() => setStep(3)}>
                Continue to publish
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
              </Button>
            </div>
          </div>

          <aside className="hidden rounded-2xl border bg-card p-4 xl:block">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Summary</p>
              <h3 className="text-lg font-semibold tracking-tight">Coverage</h3>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border p-3">
                <p className="text-muted-foreground">Time tests</p>
                <p className="mt-1 font-medium">{testsByUnit.time}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-muted-foreground">Distance tests</p>
                <p className="mt-1 font-medium">{testsByUnit.distance}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-muted-foreground">Strength tests</p>
                <p className="mt-1 font-medium">{testsByUnit.weight}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-muted-foreground">Jump tests</p>
                <p className="mt-1 font-medium">{testsByUnit.height}</p>
              </div>
            </div>
          </aside>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4 rounded-2xl border bg-card p-4">
            <div>
              <h2 className="text-lg font-semibold">{isScopedCoach ? "Publish" : "Review and Publish"}</h2>
              <p className="text-sm text-muted-foreground">
                {isScopedCoach ? "Publish to your assigned team." : "Confirm targeting and publish."}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-sm text-muted-foreground">Tests configured</p>
                <p className="mt-1 text-xl font-semibold">{tests.length}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-sm text-muted-foreground">Publish target</p>
                <p className="mt-1 text-xl font-semibold">{assignedCount}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-sm text-muted-foreground">Schedule window</p>
                <p className="mt-1 text-xl font-semibold">{draft.startDate} to {draft.endDate}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Team</Label>
                <Input value={effectiveTeam?.name ?? "Assigned team"} readOnly />
              </div>
              {isScopedCoach ? (
                <div className="space-y-2">
                  <Label>Publish target</Label>
                  <Input value={`Whole team (${teamAthletes.length} athletes)`} readOnly />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Assign to</Label>
                    <Select value={assignTarget} onValueChange={(value) => setAssignTarget(value as AssignTarget)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="team">Whole team</SelectItem>
                        <SelectItem value="subgroup">Subgroup</SelectItem>
                        <SelectItem value="selected">Selected athletes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {assignTarget === "subgroup" ? (
                    <div className="space-y-2">
                      <Label>Subgroup</Label>
                      <Select value={assignSubgroup} onValueChange={(value) => setAssignSubgroup(value as EventGroup)}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sprint">Sprint</SelectItem>
                          <SelectItem value="Mid">Middle</SelectItem>
                          <SelectItem value="Distance">Distance</SelectItem>
                          <SelectItem value="Jumps">Jumps</SelectItem>
                          <SelectItem value="Throws">Throws</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                  {assignTarget === "selected" ? (
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Selected athletes</Label>
                      <div className="grid gap-2 rounded-xl border p-3 sm:grid-cols-2">
                        {teamAthletes.map((athlete) => (
                          <button
                            key={athlete.id}
                            type="button"
                            className={cn(
                              "flex items-center justify-between rounded-lg border px-3 py-2 text-left",
                              selectedAthleteIds.includes(athlete.id) ? "border-primary bg-primary/5" : "border-border",
                            )}
                            onClick={() =>
                              setSelectedAthleteIds((prev) =>
                                prev.includes(athlete.id) ? prev.filter((id) => id !== athlete.id) : [...prev, athlete.id],
                              )
                            }
                          >
                            <span className="text-sm font-medium">{athlete.name}</span>
                            <Badge variant="outline">{athlete.eventGroup}</Badge>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
                Back
              </Button>
              <Button type="button" onClick={publishTestWeek}>Publish Test Week</Button>
            </div>
            {publishedCount !== null ? (
              <div className="rounded-xl border bg-primary/5 p-4">
                <p className="font-semibold">Test week published to {publishedCount} athletes</p>
                <div className="mt-3 flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setView("list")}>View test weeks</Button>
                </div>
              </div>
            ) : null}
          </div>

          <aside className="hidden rounded-2xl border bg-card p-4 xl:block">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Summary</p>
              <h3 className="text-lg font-semibold tracking-tight">Publish Check</h3>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border p-3">
                <p className="text-muted-foreground">Name</p>
                <p className="mt-1 font-medium">{draft.name || "Untitled test week"}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-muted-foreground">Tests</p>
                <p className="mt-1 font-medium">{tests.map((test) => test.name).join(", ")}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-muted-foreground">Audience</p>
                <p className="mt-1 font-medium">
                  {isScopedCoach ? `Whole team (${teamAthletes.length})` : `${assignedCount} athletes targeted`}
                </p>
              </div>
            </div>
          </aside>
        </section>
      ) : null}
    </div>
  )
}
