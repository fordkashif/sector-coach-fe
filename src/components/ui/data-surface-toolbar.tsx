import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface DataSurfaceToolbarProps {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  status?: ReactNode
  controls?: ReactNode
  search?: ReactNode
  className?: string
}

export function DataSurfaceToolbar({
  eyebrow,
  title,
  description,
  status,
  controls,
  search,
  className,
}: DataSurfaceToolbarProps) {
  return (
    <section className={cn("flex justify-end", className)}>
      <div className="flex w-full flex-col gap-4 rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p> : null}
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{title}</h2>
            {description ? <p className="max-w-[64ch] text-sm text-slate-500">{description}</p> : null}
            {status}
          </div>
          {controls ? <div className="flex flex-wrap items-center gap-2 self-start">{controls}</div> : null}
        </div>
        {search ? <div className="pt-1">{search}</div> : null}
      </div>
    </section>
  )
}
