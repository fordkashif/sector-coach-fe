import type { Role } from "@/lib/mock-data"
import {
  getMockCoachConfig,
  MOCK_COACH_TEAM_STORAGE_KEY,
  MOCK_USER_EMAIL_STORAGE_KEY,
} from "@/lib/mock-auth"

export interface CoachScope {
  isScopedCoach: boolean
  teamId: string | null
  allowTeamSwitcher: boolean
}

export function getCoachScope(role: Role): CoachScope {
  if (role !== "coach" || typeof window === "undefined") {
    return { isScopedCoach: false, teamId: null, allowTeamSwitcher: false }
  }

  const userEmail = window.localStorage.getItem(MOCK_USER_EMAIL_STORAGE_KEY)
  const config = getMockCoachConfig(userEmail)
  const teamId = window.localStorage.getItem(MOCK_COACH_TEAM_STORAGE_KEY) ?? config?.defaultTeamId ?? null
  const isScopedCoach = config?.teamScope === "single-team"

  return {
    isScopedCoach,
    teamId,
    allowTeamSwitcher: Boolean(config?.allowTeamSwitcher),
  }
}
