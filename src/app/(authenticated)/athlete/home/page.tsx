"use client"

import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Clock01Icon,
  Dumbbell01Icon,
  Fire03Icon,
  RepeatIcon,
} from "@hugeicons/core-free-icons"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { mockAthletes, mockCurrentSession } from "@/lib/mock-data"
import {
  defaultSessionProgress,
  progressForCurrentSession,
  SESSION_PROGRESS_STORAGE_KEY,
  type SessionProgress,
} from "@/lib/athlete-session"
import { tenantStorageKey } from "@/lib/tenant-storage"

type PreviewBlock = {
  id: string
  label: string
  helper: string
  value: string
  tone: string
  glyph: "clock" | "strength" | "repeat"
}

export default function AthleteHomePage() {
  const athlete = mockAthletes[0]
  const [progress, setProgress] = useState<SessionProgress>(() => {
    if (typeof window === "undefined") return defaultSessionProgress()
    return progressForCurrentSession(window.localStorage.getItem(tenantStorageKey(SESSION_PROGRESS_STORAGE_KEY)))
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    const syncProgress = () => {
      setProgress(progressForCurrentSession(window.localStorage.getItem(tenantStorageKey(SESSION_PROGRESS_STORAGE_KEY))))
    }

    syncProgress()
    window.addEventListener("focus", syncProgress)
    window.addEventListener("storage", syncProgress)

    return () => {
      window.removeEventListener("focus", syncProgress)
      window.removeEventListener("storage", syncProgress)
    }
  }, [])

  const completedCount = progress.completedBlockIds.length
  const allComplete = completedCount === mockCurrentSession.blocks.length
  const nextActionLabel = allComplete ? "Review Workout" : completedCount > 0 ? "Resume Workout" : "Start Workout"

  const previewBlocks: PreviewBlock[] = [
    {
      id: "warm-up",
      label: "Warm up",
      helper: "",
      value: "5:00",
      tone: "bg-[#eaf4ff]",
      glyph: "clock",
    },
    {
      id: "block-1",
      label: "Squats",
      helper: "120kg",
      value: "3x12",
      tone: "bg-[#eef2ff]",
      glyph: "strength",
    },
    {
      id: "block-2",
      label: "Lunges",
      helper: "60kg",
      value: "4x20",
      tone: "bg-[#eaf4ff]",
      glyph: "repeat",
    },
    {
      id: "block-3",
      label: "RDL",
      helper: "95kg",
      value: "3x10",
      tone: "bg-[#eef2ff]",
      glyph: "strength",
    },
  ]

  return (
    <div className="mx-auto min-h-[calc(100dvh-env(safe-area-inset-top)-2rem)] w-full max-w-7xl px-4 pb-6 pt-4 sm:min-h-0 sm:p-6">
      <section className="flex min-h-full max-w-xl flex-col">
        <div className="flex min-h-full flex-col">
          <div className="flex items-start justify-between gap-4 pb-4">
            <div className="space-y-3">
              <h1 className="text-[2.2rem] leading-[0.95] font-semibold tracking-[-0.07em] text-slate-950 sm:text-[2.6rem]">
                Hey, {athlete.name.split(" ")[0]}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-[#f5ecff] px-3 py-1 text-xs font-medium text-slate-700 shadow-[0_6px_14px_rgba(15,23,42,0.04)]">
                  Stretch: +8%
                </span>
                <span className="inline-flex rounded-full bg-[#eef5ff] px-3 py-1 text-xs font-medium text-slate-700 shadow-[0_6px_14px_rgba(15,23,42,0.04)]">
                  Endurance: +4%
                </span>
              </div>
            </div>
            <div className="shrink-0 rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-2 text-slate-950">
                <HugeiconsIcon icon={Fire03Icon} className="size-4 text-[#ff7a2f]" />
                <span className="text-xl font-semibold tracking-[-0.04em]">11</span>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <p className="text-[3rem] leading-none font-medium tracking-[-0.07em] text-slate-950">2:35 pm</p>
            <div className="inline-flex rounded-full bg-[#eef5ff] px-3 py-1 text-sm font-medium text-slate-700">
              Lower Body
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <HugeiconsIcon icon={Clock01Icon} className="size-3.5 text-slate-400" />
                20 min
              </span>
              <span className="inline-flex items-center gap-1.5">
                <HugeiconsIcon icon={Fire03Icon} className="size-3.5 text-[#ff7a2f]" />
                234 kcal
              </span>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_16px_34px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="size-2.5 rounded-full bg-[#1368ff]" />
                    <span className="size-2.5 rounded-full bg-[#0f172a]" />
                  </div>
                  <p className="text-[1.2rem] font-semibold tracking-[-0.04em] text-slate-950">Today&apos;s Workout</p>
                </div>
                <button
                  type="button"
                  aria-label="Open workout"
                  className="flex size-10 items-center justify-center rounded-[16px] border border-slate-200 bg-white text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.06)]"
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {previewBlocks.map((block) => (
                  <div key={block.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-10 items-center justify-center rounded-full ${block.tone}`}>
                        {block.glyph === "clock" ? (
                          <HugeiconsIcon icon={Clock01Icon} className="size-4 text-slate-950" />
                        ) : block.glyph === "repeat" ? (
                          <HugeiconsIcon icon={RepeatIcon} className="size-4 text-slate-950" />
                        ) : (
                          <HugeiconsIcon icon={Dumbbell01Icon} className="size-4 text-slate-950" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{block.label}</p>
                        {block.helper ? <p className="text-xs text-slate-500">{block.helper}</p> : null}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-950">{block.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <Button
              asChild
              className="mt-4 hidden h-[60px] w-full rounded-[28px] bg-[linear-gradient(135deg,rgba(7,17,34,0.94)_0%,rgba(9,20,39,0.92)_100%)] px-5 text-base font-semibold text-white shadow-[0_20px_60px_rgba(5,12,24,0.34)] hover:opacity-95 sm:inline-flex"
            >
              <Link to="/athlete/log">
                {nextActionLabel}
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
