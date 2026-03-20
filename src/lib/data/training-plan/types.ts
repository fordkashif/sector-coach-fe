export type TrainingPlanSummary = {
  id: string
  name: string
  teamId: string | null
  startDate: string
  weeks: number
  status: "draft" | "published" | "archived"
}

export type TrainingPlanDay = {
  id: string
  dayIndex: number
  dayLabel: string
  date: string
  title: string
  sessionType: "Track" | "Gym" | "Recovery" | "Technical" | "Mixed"
  focus: string
  status: "completed" | "scheduled" | "up-next"
  durationMinutes: number | null
  location: string | null
  coachNote: string | null
  blockPreview: string[]
}

export type TrainingPlanWeek = {
  id: string
  weekNumber: number
  emphasis: string | null
  status: "completed" | "current" | "up-next"
  days: TrainingPlanDay[]
}

export type TrainingPlanDetail = {
  planId: string
  weeks: TrainingPlanWeek[]
}
