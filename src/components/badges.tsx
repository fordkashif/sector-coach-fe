import { cn } from "@/lib/utils"
import type { Readiness, EventGroup } from "@/lib/mock-data"

export function ReadinessBadge({ status }: { status: Readiness }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        status === "green" && "bg-[#eef5ff] text-[#1f5fd1]",
        status === "yellow" && "bg-warning/15 text-warning-foreground",
        status === "red" && "bg-destructive/15 text-destructive"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "green" && "bg-[#1f8cff]",
          status === "yellow" && "bg-warning",
          status === "red" && "bg-destructive"
        )}
      />
      {status === "green" ? "Ready" : status === "yellow" ? "Watch" : "Review"}
    </span>
  )
}

const groupColors: Record<EventGroup, string> = {
  Sprint: "bg-chart-1/15 text-chart-1",
  Mid: "bg-chart-3/15 text-chart-3",
  Distance: "bg-chart-2/15 text-chart-2",
  Jumps: "bg-chart-5/15 text-chart-5",
  Throws: "bg-chart-4/15 text-chart-4",
}

export function EventGroupBadge({ group }: { group: EventGroup }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        groupColors[group]
      )}
    >
      {group}
    </span>
  )
}
