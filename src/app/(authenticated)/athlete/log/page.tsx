"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon, CheckmarkCircle02Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { mockAthletes, mockCurrentSession, mockLogs, onSaveLog, type SessionBlock } from "@/lib/mock-data"
import { blockStatus, defaultSessionProgress, progressForCurrentSession, SESSION_PROGRESS_STORAGE_KEY, sessionRowKey, type SessionProgress } from "@/lib/athlete-session"
import { cn } from "@/lib/utils"
import { tenantStorageKey } from "@/lib/tenant-storage"

const blockToneMap: Record<SessionBlock["type"], string> = {
  Sprint: "bg-[#dbeafe] text-[#1d4ed8]",
  Run: "bg-[#fef3c7] text-[#b45309]",
  Strength: "bg-[#ede9fe] text-[#6d28d9]",
  Jumps: "bg-[#dcfce7] text-[#15803d]",
  Throws: "bg-[#fee2e2] text-[#be123c]",
}

function fieldConfigForBlock(type: SessionBlock["type"]) {
  switch (type) {
    case "Strength":
      return [
        { key: "primary", label: "Actual reps", placeholder: "3" },
        { key: "secondary", label: "Actual load", placeholder: "100kg" },
        { key: "effort", label: "RPE", placeholder: "8" },
      ]
    case "Sprint":
      return [
        { key: "primary", label: "10m split", placeholder: "1.82s" },
        { key: "secondary", label: "30m split", placeholder: "4.05s" },
        { key: "effort", label: "Quality", placeholder: "Sharp" },
      ]
    case "Run":
      return [
        { key: "primary", label: "Time", placeholder: "7.05s" },
        { key: "secondary", label: "Pace / split", placeholder: "95%" },
        { key: "effort", label: "RPE", placeholder: "7" },
      ]
    case "Jumps":
      return [
        { key: "primary", label: "Distance / mark", placeholder: "40m" },
        { key: "secondary", label: "Legal / quality", placeholder: "Clean" },
        { key: "effort", label: "Wind / note", placeholder: "Reactive" },
      ]
    case "Throws":
      return [
        { key: "primary", label: "Distance", placeholder: "16.20m" },
        { key: "secondary", label: "Implement", placeholder: "7.26kg" },
        { key: "effort", label: "Legal / note", placeholder: "Legal" },
      ]
  }
}

export default function AthleteLogPage() {
  const athlete = mockAthletes[0]
  const [progress, setProgress] = useState<SessionProgress>(() => {
    if (typeof window === "undefined") return defaultSessionProgress()
    return progressForCurrentSession(window.localStorage.getItem(tenantStorageKey(SESSION_PROGRESS_STORAGE_KEY)))
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(tenantStorageKey(SESSION_PROGRESS_STORAGE_KEY), JSON.stringify(progress))
  }, [progress])

  const currentBlock = mockCurrentSession.blocks[progress.currentBlockIndex] ?? mockCurrentSession.blocks[0]
  const completedCount = progress.completedBlockIds.length
  const progressPercent = Math.round((completedCount / mockCurrentSession.blocks.length) * 100)
  const allComplete = completedCount === mockCurrentSession.blocks.length
  const recentLogs = mockLogs.filter((log) => log.athleteId === athlete.id).slice(0, 3)

  const sessionState = useMemo(() => {
    if (allComplete) return { label: "Completed", tone: "bg-emerald-100 text-emerald-700" }
    if (completedCount > 0 || mockCurrentSession.status === "in-progress") {
      return { label: "In Progress", tone: "bg-amber-100 text-amber-700" }
    }
    return { label: "Not Started", tone: "bg-slate-200 text-slate-700" }
  }, [allComplete, completedCount])

  if (!currentBlock) return null

  const fieldConfig = fieldConfigForBlock(currentBlock.type)

  const handleValueChange = (key: string, value: string) => {
    setProgress((current) => ({
      ...current,
      values: {
        ...current.values,
        [key]: value,
      },
    }))
  }

  const handleBlockNoteChange = (blockId: string, value: string) => {
    setProgress((current) => ({
      ...current,
      blockNotes: {
        ...current.blockNotes,
        [blockId]: value,
      },
    }))
  }

  const handleCompleteBlock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSaveLog()

    setProgress((current) => {
      const completedBlockIds = current.completedBlockIds.includes(currentBlock.id)
        ? current.completedBlockIds
        : [...current.completedBlockIds, currentBlock.id]

      return {
        ...current,
        completedBlockIds,
        currentBlockIndex: Math.min(current.currentBlockIndex + 1, mockCurrentSession.blocks.length - 1),
      }
    })
  }

  const jumpToBlock = (blockIndex: number) => {
    setProgress((current) => ({
      ...current,
      currentBlockIndex: blockIndex,
    }))
  }

  const resetSession = () => {
    setProgress(defaultSessionProgress())
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6">
      <section className="page-intro">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="page-intro-title">Log</h1>
            <p className="page-intro-copy">Move through today&apos;s session block by block and record the work as it happens.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="h-11 rounded-full border-slate-200 px-5 text-slate-950 hover:border-[#1f8cff] hover:bg-[#eef5ff] hover:text-slate-950">
              <Link to="/athlete/training-plan">View plan</Link>
            </Button>
            <Button type="button" variant="outline" className="h-11 rounded-full border-slate-200 px-5 text-slate-950 hover:border-[#1f8cff] hover:bg-[#eef5ff] hover:text-slate-950" onClick={resetSession}>
              Reset session
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="mobile-card-primary">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Today&apos;s Workout</p>
              <h2 className="text-[28px] font-semibold leading-[1.05] tracking-[-0.05em] text-slate-950">{mockCurrentSession.title}</h2>
              <p className="text-sm text-slate-500">{mockCurrentSession.scheduledFor}</p>
            </div>
            <span className={cn("inline-flex rounded-full px-3 py-1.5 text-xs font-semibold", sessionState.tone)}>{sessionState.label}</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Estimated duration", value: mockCurrentSession.estimatedDuration },
              { label: "Current block", value: `${progress.currentBlockIndex + 1} / ${mockCurrentSession.blocks.length}` },
              { label: "Completed", value: `${completedCount} of ${mockCurrentSession.blocks.length}` },
            ].map((item) => (
              <div key={item.label} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                <p className="mt-1.5 text-xl font-semibold tracking-[-0.04em] text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-950">Session progress</span>
              <span className="text-slate-500">{progressPercent}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)]" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="mt-4 rounded-[20px] border border-slate-200 bg-[#031733] px-4 py-4 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8db8ff]">Coach note</p>
            <p className="mt-2 text-sm text-white/78">{mockCurrentSession.coachNote}</p>
          </div>
        </div>

        <div className="mobile-card-primary">
          <div className="space-y-1 border-b border-slate-200 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Workout Order</p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Session Blocks</h2>
          </div>
          <div className="mt-4 space-y-3">
            {mockCurrentSession.blocks.map((block, index) => {
              const status = blockStatus(progress, block)
              const isActive = index === progress.currentBlockIndex
              return (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => jumpToBlock(index)}
                  className={cn(
                    "w-full rounded-[18px] border px-4 py-4 text-left transition",
                    isActive ? "border-[#1f8cff] bg-[#eef5ff]" : "border-slate-200 bg-slate-50 hover:border-[#cfe2ff]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{index + 1}. {block.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{block.focus}</p>
                    </div>
                    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", blockToneMap[block.type])}>{block.type}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{block.rest ? `Rest ${block.rest}` : "No rest target"}</span>
                    <span
                      className={cn(
                        "font-semibold",
                        status === "completed" ? "text-emerald-700" : status === "in-progress" ? "text-[#1368ff]" : "text-slate-400",
                      )}
                    >
                      {status === "completed" ? "Completed" : status === "in-progress" ? "In progress" : "Up next"}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <form onSubmit={handleCompleteBlock} className="mobile-card-primary">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Current Block</p>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{currentBlock.name}</h2>
              <p className="text-sm text-slate-500">{currentBlock.focus}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <HugeiconsIcon icon={Clock01Icon} className="size-4" />
              {currentBlock.rest ? `Rest ${currentBlock.rest}` : "Move continuously"}
            </div>
          </div>

          <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
            <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", blockToneMap[currentBlock.type])}>{currentBlock.type}</span>
            <p className="mt-3 text-sm text-slate-500">{currentBlock.coachNote}</p>
            {currentBlock.previousResult ? (
              <div className="mt-3 rounded-[16px] border border-slate-200 bg-white px-3.5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Previous result</p>
                <p className="mt-1 text-sm font-medium text-slate-950">{currentBlock.previousResult}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-4 space-y-3">
            {currentBlock.rows.map((row, rowIndex) => (
              <div key={`${currentBlock.id}-${row.label}`} className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{row.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{row.target}</p>
                    {row.helper ? <p className="mt-1 text-xs text-slate-400">{row.helper}</p> : null}
                  </div>
                  <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">Target</span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {fieldConfig.map((field) => {
                    const key = sessionRowKey(currentBlock.id, rowIndex, field.key)
                    return (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={key} className="text-sm font-medium text-slate-950">{field.label}</Label>
                        <Input
                          id={key}
                          value={progress.values[key] ?? ""}
                          placeholder={field.placeholder}
                          onChange={(event) => handleValueChange(key, event.target.value)}
                          className="h-12 rounded-[16px] border-slate-200 bg-white text-slate-950"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor={`${currentBlock.id}-notes`} className="text-sm font-medium text-slate-950">Block notes</Label>
            <Textarea
              id={`${currentBlock.id}-notes`}
              value={progress.blockNotes[currentBlock.id] ?? ""}
              onChange={(event) => handleBlockNoteChange(currentBlock.id, event.target.value)}
              placeholder="How did this block feel? Any coach-relevant context?"
              className="min-h-[110px] rounded-[18px] border-slate-200 bg-slate-50 text-slate-950"
            />
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 rounded-full border-slate-200 text-slate-950 hover:border-[#1f8cff] hover:bg-[#eef5ff] hover:text-slate-950"
              disabled={progress.currentBlockIndex === 0}
              onClick={() => jumpToBlock(progress.currentBlockIndex - 1)}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
              Previous block
            </Button>
            <Button type="submit" className="h-12 flex-[1.2] rounded-full bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)] text-white shadow-[0_12px_28px_rgba(31,140,255,0.22)] hover:opacity-95">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
              {progress.currentBlockIndex === mockCurrentSession.blocks.length - 1 ? "Complete session" : "Complete block"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 rounded-full border-slate-200 text-slate-950 hover:border-[#1f8cff] hover:bg-[#eef5ff] hover:text-slate-950"
              disabled={progress.currentBlockIndex === mockCurrentSession.blocks.length - 1}
              onClick={() => jumpToBlock(progress.currentBlockIndex + 1)}
            >
              Next block
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
            </Button>
          </div>

          {allComplete ? (
            <div className="mt-4 rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-4">
              <p className="text-sm font-semibold text-emerald-700">Session complete</p>
              <p className="mt-1 text-sm text-emerald-700/80">All blocks are logged. You can review notes here or return to the home screen.</p>
            </div>
          ) : null}
        </form>

        <div className="space-y-5">
          <div className="mobile-card-primary">
            <div className="space-y-1 border-b border-slate-200 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Workflow</p>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Quick Links</h2>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                { label: "Back to home", href: "/athlete/home" },
                { label: "Open wellness", href: "/athlete/wellness" },
                { label: "Review plan", href: "/athlete/training-plan" },
              ].map((item) => (
                <Button key={item.href} asChild variant="outline" className="mobile-action-secondary">
                  <Link to={item.href}>{item.label}</Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="mobile-card-primary">
            <div className="space-y-1 border-b border-slate-200 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Recent History</p>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Last Logged Sessions</h2>
            </div>
            <div className="mt-4 space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{log.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{log.details}</p>
                    </div>
                    <span className="text-xs font-medium text-slate-400">{log.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
