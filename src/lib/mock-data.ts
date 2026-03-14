export type Role = "coach" | "athlete" | "club-admin"

export type EventGroup = "Sprint" | "Mid" | "Distance" | "Jumps" | "Throws"

export type Readiness = "green" | "yellow" | "red"

export interface Athlete {
  id: string
  name: string
  age: number
  eventGroup: EventGroup
  primaryEvent: string
  readiness: Readiness
  adherence: number
  lastWellness: string
  teamId: string
}

export interface Team {
  id: string
  name: string
  eventGroup: EventGroup
  athleteCount: number
  disciplines?: string[]
}

export interface PR {
  id: string
  athleteId: string
  athleteName: string
  event: string
  category: EventGroup | "Strength"
  bestValue: string
  previousValue?: string
  date: string
  legal: boolean
  wind?: string
  type: "Training" | "Competition"
}

export interface WellnessEntry {
  id: string
  athleteId: string
  date: string
  sleep: number
  soreness: number
  fatigue: number
  mood: number
  stress: number
  notes?: string
  readiness: Readiness
}

export interface LogEntry {
  id: string
  athleteId: string
  type: "Strength" | "Run" | "Splits" | "Jumps" | "Throws"
  title: string
  date: string
  details: string
}

export interface TestWeekResult {
  athleteId: string
  athleteName: string
  thirtyM?: { value: string; change: "up" | "down" | "same" }
  flyingThirtyM?: { value: string; change: "up" | "down" | "same" }
  oneHundredFiftyM?: { value: string; change: "up" | "down" | "same" }
  squat1RM?: { value: string; change: "up" | "down" | "same" }
  cmj?: { value: string; change: "up" | "down" | "same" }
}

export interface TrainingPlanSummary {
  id: string
  name: string
  teamId: string
  startDate: string
  weeks: number
  assignedTo: "team" | "athlete"
  assignedAthleteIds?: string[]
}

export interface TrendPoint {
  date: string
  readiness: number
  fatigue: number
  trainingLoad: number
}

export const mockTeams: Team[] = [
  { id: "t1", name: "Sprint Group", eventGroup: "Sprint", athleteCount: 12, disciplines: ["100m", "200m", "400m", "Hurdles"] },
  { id: "t2", name: "Distance Group", eventGroup: "Distance", athleteCount: 10, disciplines: ["800m", "1500m", "5000m"] },
  { id: "t3", name: "Jumps Group", eventGroup: "Jumps", athleteCount: 8, disciplines: ["Long Jump", "High Jump", "Triple Jump"] },
  { id: "t4", name: "Throws Group", eventGroup: "Throws", athleteCount: 12, disciplines: ["Shot Put", "Discus", "Javelin"] },
]

export function getTeamDisciplineLabel(team: Team | null | undefined) {
  if (!team) return ""
  if (team.disciplines?.length) return team.disciplines.join(" / ")
  return team.eventGroup
}

export const mockAthletes: Athlete[] = [
  { id: "a1", name: "Marcus Johnson", age: 22, eventGroup: "Sprint", primaryEvent: "100m", readiness: "green", adherence: 92, lastWellness: "8:15 AM", teamId: "t1" },
  { id: "a2", name: "Sarah Chen", age: 20, eventGroup: "Sprint", primaryEvent: "200m", readiness: "green", adherence: 88, lastWellness: "7:45 AM", teamId: "t1" },
  { id: "a3", name: "David Okafor", age: 23, eventGroup: "Sprint", primaryEvent: "400m", readiness: "yellow", adherence: 75, lastWellness: "9:00 AM", teamId: "t1" },
  { id: "a4", name: "Emily Rodriguez", age: 21, eventGroup: "Distance", primaryEvent: "1500m", readiness: "green", adherence: 95, lastWellness: "6:30 AM", teamId: "t2" },
  { id: "a5", name: "James Wright", age: 24, eventGroup: "Distance", primaryEvent: "5000m", readiness: "yellow", adherence: 70, lastWellness: "8:00 AM", teamId: "t2" },
  { id: "a6", name: "Ava Thompson", age: 19, eventGroup: "Jumps", primaryEvent: "Long Jump", readiness: "green", adherence: 85, lastWellness: "7:30 AM", teamId: "t3" },
  { id: "a7", name: "Noah Martinez", age: 22, eventGroup: "Jumps", primaryEvent: "High Jump", readiness: "red", adherence: 60, lastWellness: "Yesterday", teamId: "t3" },
  { id: "a8", name: "Mia Anderson", age: 21, eventGroup: "Throws", primaryEvent: "Shot Put", readiness: "green", adherence: 90, lastWellness: "8:30 AM", teamId: "t4" },
  { id: "a9", name: "Liam Patel", age: 23, eventGroup: "Throws", primaryEvent: "Discus", readiness: "yellow", adherence: 72, lastWellness: "9:15 AM", teamId: "t4" },
  { id: "a10", name: "Sophia Kim", age: 20, eventGroup: "Sprint", primaryEvent: "100m Hurdles", readiness: "green", adherence: 88, lastWellness: "7:00 AM", teamId: "t1" },
]

export const mockPRs: PR[] = [
  { id: "pr1", athleteId: "a1", athleteName: "Marcus Johnson", event: "100m", category: "Sprint", bestValue: "10.28s", previousValue: "10.41s", date: "Feb 18, 2026", legal: true, wind: "+1.2", type: "Competition" },
  { id: "pr2", athleteId: "a2", athleteName: "Sarah Chen", event: "200m", category: "Sprint", bestValue: "23.15s", previousValue: "23.42s", date: "Feb 20, 2026", legal: true, wind: "+0.8", type: "Competition" },
  { id: "pr3", athleteId: "a6", athleteName: "Ava Thompson", event: "Long Jump", category: "Jumps", bestValue: "6.45m", previousValue: "6.32m", date: "Feb 17, 2026", legal: true, wind: "+1.0", type: "Training" },
  { id: "pr4", athleteId: "a8", athleteName: "Mia Anderson", event: "Shot Put", category: "Throws", bestValue: "16.20m", previousValue: "15.85m", date: "Feb 22, 2026", legal: true, type: "Competition" },
  { id: "pr5", athleteId: "a1", athleteName: "Marcus Johnson", event: "Back Squat", category: "Strength", bestValue: "185kg", previousValue: "180kg", date: "Feb 19, 2026", legal: true, type: "Training" },
  { id: "pr6", athleteId: "a4", athleteName: "Emily Rodriguez", event: "1500m", category: "Mid", bestValue: "4:12.5", previousValue: "4:15.8", date: "Feb 21, 2026", legal: true, type: "Competition" },
  { id: "pr7", athleteId: "a7", athleteName: "Noah Martinez", event: "High Jump", category: "Jumps", bestValue: "2.10m", previousValue: "2.05m", date: "Feb 16, 2026", legal: true, type: "Training" },
  { id: "pr8", athleteId: "a3", athleteName: "David Okafor", event: "400m", category: "Sprint", bestValue: "46.82s", previousValue: "47.15s", date: "Feb 23, 2026", legal: true, type: "Competition" },
]

export const mockWellness: WellnessEntry[] = [
  { id: "w1", athleteId: "a1", date: "2026-02-25", sleep: 8, soreness: 2, fatigue: 2, mood: 4, stress: 2, readiness: "green" },
  { id: "w2", athleteId: "a2", date: "2026-02-25", sleep: 7, soreness: 3, fatigue: 2, mood: 4, stress: 2, readiness: "green" },
  { id: "w3", athleteId: "a3", date: "2026-02-25", sleep: 6, soreness: 3, fatigue: 4, mood: 3, stress: 3, readiness: "yellow" },
  { id: "w4", athleteId: "a7", date: "2026-02-24", sleep: 5, soreness: 4, fatigue: 4, mood: 2, stress: 4, notes: "Knee pain after practice", readiness: "red" },
]

export const mockLogs: LogEntry[] = [
  { id: "l1", athleteId: "a1", type: "Strength", title: "Lower Body Power", date: "Feb 25, 2026", details: "Back Squat 3x5 @ 170kg, RDL 3x8 @ 120kg" },
  { id: "l2", athleteId: "a1", type: "Run", title: "Speed Endurance", date: "Feb 24, 2026", details: "4x150m @ 95%, Rest 8min" },
  { id: "l3", athleteId: "a1", type: "Splits", title: "Block Starts", date: "Feb 23, 2026", details: "10m: 1.82s, 20m: 3.01s, 30m: 4.05s" },
  { id: "l4", athleteId: "a2", type: "Run", title: "Tempo 200s", date: "Feb 25, 2026", details: "6x200m @ 80%, Rest 3min" },
  { id: "l5", athleteId: "a6", type: "Jumps", title: "Long Jump Practice", date: "Feb 25, 2026", details: "Full approach: 6.45m, 6.32m, 6.20m, 6.38m" },
  { id: "l6", athleteId: "a8", type: "Throws", title: "Shot Put Drill", date: "Feb 25, 2026", details: "Standing throws: 14.5m, 14.8m, 15.0m. Full: 16.2m PR" },
]

export const mockTestWeekResults: TestWeekResult[] = [
  { athleteId: "a1", athleteName: "Marcus Johnson", thirtyM: { value: "4.05s", change: "up" }, flyingThirtyM: { value: "2.89s", change: "up" }, oneHundredFiftyM: { value: "16.8s", change: "same" }, squat1RM: { value: "185kg", change: "up" }, cmj: { value: "72cm", change: "up" } },
  { athleteId: "a2", athleteName: "Sarah Chen", thirtyM: { value: "4.22s", change: "up" }, flyingThirtyM: { value: "3.05s", change: "same" }, oneHundredFiftyM: { value: "17.5s", change: "up" }, squat1RM: { value: "120kg", change: "up" }, cmj: { value: "58cm", change: "same" } },
  { athleteId: "a3", athleteName: "David Okafor", thirtyM: { value: "4.10s", change: "down" }, flyingThirtyM: { value: "3.02s", change: "down" }, oneHundredFiftyM: { value: "16.2s", change: "up" }, squat1RM: { value: "175kg", change: "same" }, cmj: { value: "68cm", change: "down" } },
  { athleteId: "a10", athleteName: "Sophia Kim", thirtyM: { value: "4.35s", change: "up" }, flyingThirtyM: { value: "3.18s", change: "up" }, oneHundredFiftyM: { value: "18.1s", change: "same" }, squat1RM: { value: "105kg", change: "up" }, cmj: { value: "52cm", change: "up" } },
]

export const mockCurrentSession = {
  title: "Speed Day - Block Starts + Accel",
  blocks: [
    { type: "Sprint", name: "Block Starts 4x30m" },
    { type: "Sprint", name: "Acceleration 3x60m" },
    { type: "Strength", name: "Power Cleans 4x3" },
    { type: "Plyometrics", name: "Bounding 3x40m" },
  ],
}

export const mockTrainingPlans: TrainingPlanSummary[] = [
  {
    id: "plan-1",
    name: "Spring Build Phase",
    teamId: "t1",
    startDate: "2026-03-02",
    weeks: 4,
    assignedTo: "team",
  },
  {
    id: "plan-2",
    name: "Jump Power Microcycle",
    teamId: "t3",
    startDate: "2026-03-09",
    weeks: 2,
    assignedTo: "athlete",
    assignedAthleteIds: ["a6", "a7"],
  },
]

export const mockTrendSeries: Record<string, TrendPoint[]> = {
  a1: [
    { date: "2026-02-20", readiness: 86, fatigue: 28, trainingLoad: 74 },
    { date: "2026-02-21", readiness: 82, fatigue: 32, trainingLoad: 70 },
    { date: "2026-02-22", readiness: 78, fatigue: 37, trainingLoad: 83 },
    { date: "2026-02-23", readiness: 84, fatigue: 29, trainingLoad: 76 },
    { date: "2026-02-24", readiness: 88, fatigue: 24, trainingLoad: 68 },
    { date: "2026-02-25", readiness: 91, fatigue: 20, trainingLoad: 62 },
  ],
  a2: [
    { date: "2026-02-20", readiness: 80, fatigue: 31, trainingLoad: 72 },
    { date: "2026-02-21", readiness: 81, fatigue: 29, trainingLoad: 73 },
    { date: "2026-02-22", readiness: 79, fatigue: 33, trainingLoad: 75 },
    { date: "2026-02-23", readiness: 84, fatigue: 27, trainingLoad: 68 },
    { date: "2026-02-24", readiness: 85, fatigue: 25, trainingLoad: 66 },
    { date: "2026-02-25", readiness: 87, fatigue: 23, trainingLoad: 64 },
  ],
  a7: [
    { date: "2026-02-20", readiness: 64, fatigue: 58, trainingLoad: 77 },
    { date: "2026-02-21", readiness: 60, fatigue: 62, trainingLoad: 80 },
    { date: "2026-02-22", readiness: 58, fatigue: 65, trainingLoad: 84 },
    { date: "2026-02-23", readiness: 56, fatigue: 67, trainingLoad: 82 },
    { date: "2026-02-24", readiness: 52, fatigue: 70, trainingLoad: 79 },
    { date: "2026-02-25", readiness: 55, fatigue: 66, trainingLoad: 74 },
  ],
}

export const mockTestDefinitions = [
  "30m",
  "Flying 30m",
  "150m",
  "Long Jump",
  "Shot Put",
  "Squat 1RM",
  "CMJ",
] as const

// Placeholder handlers
export const onCreateTestWeek = () => { console.log("Create test week") }
export const onGenerateInvite = () => { console.log("Generate invite") }
export const onSaveWellness = () => { console.log("Save wellness") }
export const onSaveLog = () => { console.log("Save log") }
export const onPublishPlan = () => { console.log("Publish plan") }
export const onAssignTrainingPlan = () => { console.log("Assign training plan") }
export const onSubmitTestWeek = () => { console.log("Submit test week") }
