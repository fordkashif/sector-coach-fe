import {
  defaultClubProfile,
  defaultClubTeams,
  defaultClubUsers,
  type ClubProfile,
  type ClubTeam,
  type ClubUser,
  type CoachInvite,
  type AccountRequest,
  loadAccountRequests as loadAccountRequestsFromStorage,
  loadClubProfile as loadClubProfileFromStorage,
  loadClubTeams as loadClubTeamsFromStorage,
  loadClubUsers as loadClubUsersFromStorage,
  loadCoachInvites as loadCoachInvitesFromStorage,
  saveAccountRequests,
  saveClubProfile,
  saveClubTeams,
  saveClubUsers,
  saveCoachInvites,
} from "@/lib/mock-club-admin"

export function loadProfileSafe() {
  return typeof window === "undefined" ? defaultClubProfile : loadClubProfileFromStorage()
}

export function loadUsersSafe() {
  return typeof window === "undefined" ? defaultClubUsers : loadClubUsersFromStorage()
}

export function loadTeamsSafe() {
  return typeof window === "undefined" ? defaultClubTeams : loadClubTeamsFromStorage()
}

export function loadInvitesSafe() {
  return typeof window === "undefined" ? ([] as CoachInvite[]) : loadCoachInvitesFromStorage()
}

export function loadAccountRequestsSafe() {
  return typeof window === "undefined" ? ([] as AccountRequest[]) : loadAccountRequestsFromStorage()
}

export function persistProfile(profile: ClubProfile) {
  saveClubProfile(profile)
}

export function persistUsers(users: ClubUser[]) {
  saveClubUsers(users)
}

export function persistTeams(teams: ClubTeam[]) {
  saveClubTeams(teams)
}

export function persistInvites(invites: CoachInvite[]) {
  saveCoachInvites(invites)
}

export function persistAccountRequests(requests: AccountRequest[]) {
  saveAccountRequests(requests)
}

export const loadClubUsers = loadUsersSafe
export const loadClubTeams = loadTeamsSafe
export const loadClubInvites = loadInvitesSafe
export const loadClubAccountRequests = loadAccountRequestsSafe
