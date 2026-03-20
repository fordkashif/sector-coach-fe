export type WellnessReadiness = "green" | "yellow" | "red"

export type WellnessEntry = {
  id: string
  athleteId: string
  entryDate: string
  sleepHours: number
  soreness: number
  fatigue: number
  mood: number
  stress: number
  trainingLoad: number
  readiness: WellnessReadiness
  readinessScore: number
  notes: string | null
  createdAt: string
}

export type WellnessSubmissionInput = {
  entryDate: string
  sleepHours: number
  soreness: number
  fatigue: number
  mood: number
  stress: number
  notes: string | null
}

export type WellnessTrendPoint = {
  date: string
  readiness: number
  fatigue: number
  trainingLoad: number
}
