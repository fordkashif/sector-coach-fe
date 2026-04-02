"use client"

import { useEffect, useState } from "react"
import { Mail01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { DataSurfaceToolbar } from "@/components/ui/data-surface-toolbar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { StandardPageHeader } from "@/components/ui/standard-page-header"
import { useClubAdmin } from "@/lib/club-admin-context"
import {
  createCoachInvite,
  getClubAdminPackageUpgradeRequests,
  getCurrentClubAdminActivationState,
  insertAuditEvent,
  submitClubAdminPackageUpgradeRequest,
  updateProfileRoleAndStatus,
} from "@/lib/data/club-admin/ops-data"
import { getNextPackageTier, getPackageById, type PackageId } from "@/lib/billing/package-catalog"
import type { ClubUser, CoachInvite, UserRole } from "@/lib/mock-club-admin"
import { getBackendMode } from "@/lib/supabase/config"
import {
  loadInvitesSafe,
  loadTeamsSafe,
  loadUsersSafe,
  persistInvites,
  persistUsers,
} from "../state"
import { cn } from "@/lib/utils"

function formatInviteTeamLabel(teamId: string | undefined, teams: Array<{ id: string; name: string }>) {
  if (!teamId) return "No team"
  return teams.find((team) => team.id === teamId)?.name ?? teamId
}

export default function ClubAdminUsersPage() {
  const backendMode = getBackendMode()
  const isSupabaseMode = backendMode === "supabase"
  const clubAdmin = useClubAdmin()
  const isLocalPreviewEnabled =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  const [users, setUsers] = useState<ClubUser[]>(() => (isSupabaseMode ? [] : loadUsersSafe()))
  const [invites, setInvites] = useState<CoachInvite[]>(() => (isSupabaseMode ? [] : loadInvitesSafe()))
  const [coachInviteEmail, setCoachInviteEmail] = useState("")
  const [coachInviteTeamId, setCoachInviteTeamId] = useState<string>("none")
  const [inviteComposerOpen, setInviteComposerOpen] = useState(false)
  const [requestedPlan, setRequestedPlan] = useState<PackageId | null>(null)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState("")
  const [upgradeSaving, setUpgradeSaving] = useState(false)
  const [pendingUpgradeRequest, setPendingUpgradeRequest] = useState<{ requestedPackage: PackageId; createdAt: string } | null>(null)
  const [useDesktopInviteDialog, setUseDesktopInviteDialog] = useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(min-width: 640px)").matches
  })
  const [teams, setTeams] = useState(() => (isSupabaseMode ? [] : loadTeamsSafe()))
  const [backendLoading, setBackendLoading] = useState(isSupabaseMode && !clubAdmin.opsSnapshot)
  const [backendError, setBackendError] = useState<string | null>(clubAdmin.opsError)
  const [mockAuditLogger, setMockAuditLogger] = useState<((event: {
    actor: string
    action: string
    target: string
    detail?: string
  }) => void) | null>(null)

  const saveUsers = (next: ClubUser[]) => {
    setUsers(next)
    if (backendMode !== "supabase") persistUsers(next)
  }

  const emitAudit = async (action: string, target: string, detail?: string) => {
    if (backendMode === "supabase") {
      const result = await insertAuditEvent({ action, target, detail })
      if (!result.ok) setBackendError((current) => current ?? result.error.message)
      return
    }
    mockAuditLogger?.({ actor: "club-admin", action, target, detail })
  }

  useEffect(() => {
    if (!isSupabaseMode) return
    setBackendLoading(clubAdmin.opsLoading)
    setBackendError(clubAdmin.opsError)
    if (!clubAdmin.opsSnapshot) return

    setUsers(
      clubAdmin.opsSnapshot.users.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        status: row.status,
        teamId: row.teamId,
      })),
    )
    setInvites(
      clubAdmin.opsSnapshot.invites.map((row) => ({
        id: row.id,
        email: row.email,
        teamId: row.teamId,
        status: row.status === "revoked" ? "expired" : row.status,
        createdAt: row.createdAt,
        inviteUrl: row.inviteUrl ?? `/invite/coach/${row.id}`,
      })),
    )
    setTeams(
      clubAdmin.opsSnapshot.teams.map((row) => ({
        id: row.id,
        name: row.name,
        eventGroup: "Sprint",
        status: "active",
      })),
    )
  }, [clubAdmin.opsError, clubAdmin.opsLoading, clubAdmin.opsSnapshot, isSupabaseMode])

  useEffect(() => {
    if (isSupabaseMode) return
    let cancelled = false

    void import("@/lib/mock-audit").then((module) => {
      if (!cancelled) {
        setMockAuditLogger(() => module.logAuditEvent)
      }
    })

    return () => {
      cancelled = true
    }
  }, [isSupabaseMode])

  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia("(min-width: 640px)")
    const sync = () => setUseDesktopInviteDialog(mediaQuery.matches)

    sync()
    mediaQuery.addEventListener("change", sync)
    return () => mediaQuery.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    if (!isSupabaseMode) return
    let cancelled = false

    void Promise.all([getCurrentClubAdminActivationState(), getClubAdminPackageUpgradeRequests()]).then(([activationResult, upgradeResult]) => {
      if (cancelled) return
      if (activationResult.ok) setRequestedPlan(activationResult.data.requestedPlan)
      if (upgradeResult.ok) {
        const firstPendingUpgrade = upgradeResult.data.find((item) => item.status === "pending") ?? null
        setPendingUpgradeRequest(
          firstPendingUpgrade
            ? { requestedPackage: firstPendingUpgrade.requestedPackage, createdAt: firstPendingUpgrade.createdAt }
            : null,
        )
      }
    })

    return () => {
      cancelled = true
    }
  }, [isSupabaseMode])

  const handleSendCoachInvite = async () => {
    if (!coachInviteEmail.trim()) return
    if (coachLimitReached) {
      setBackendError(
        packageDefinition
          ? `${packageDefinition.label} allows up to ${packageDefinition.limits.coaches} coach${packageDefinition.limits.coaches === 1 ? "" : "es"}. Upgrade the package before inviting another coach.`
          : "This tenant has reached the package limit for coaches.",
      )
      return
    }
    if (backendMode === "supabase") {
      const result = await createCoachInvite({
        email: coachInviteEmail.trim().toLowerCase(),
        teamId: coachInviteTeamId !== "none" ? coachInviteTeamId : undefined,
      })
      if (!result.ok) {
        setBackendError(result.error.message)
        return
      }
      setInvites((current) => [
        {
          id: result.data.id,
          email: result.data.email,
          teamId: result.data.teamId,
          status: result.data.status === "revoked" ? "expired" : result.data.status,
          createdAt: result.data.createdAt,
          inviteUrl: result.data.inviteUrl,
        },
        ...current,
      ])
      await emitAudit(
        "coach_invite_send",
        coachInviteEmail.trim().toLowerCase(),
        coachInviteTeamId !== "none" ? `team ${coachInviteTeamId}` : "no team",
      )
      setCoachInviteEmail("")
      setCoachInviteTeamId("none")
      setInviteComposerOpen(false)
      return
    }

    const next = [
      {
        id: `invite-${Date.now()}`,
        email: coachInviteEmail.trim().toLowerCase(),
        teamId: coachInviteTeamId !== "none" ? coachInviteTeamId : undefined,
        status: "pending" as const,
        createdAt: new Date().toISOString().slice(0, 10),
      },
      ...invites,
    ]
    setInvites(next)
    persistInvites(next)
    await emitAudit(
      "coach_invite_send",
      coachInviteEmail.trim().toLowerCase(),
      coachInviteTeamId !== "none" ? `team ${coachInviteTeamId}` : "no team",
    )
    setCoachInviteEmail("")
    setCoachInviteTeamId("none")
    setInviteComposerOpen(false)
  }

  const headerStats = [
    { label: "Users", value: users.length },
    { label: "Invites", value: invites.length },
    { label: "Active", value: users.filter((user) => user.status === "active").length },
    { label: "Suspended", value: users.filter((user) => user.status !== "active").length },
  ]
  const pendingInvites = invites.filter((invite) => invite.status === "pending").length
  const packageDefinition = getPackageById(requestedPlan)
  const activeCoachCount = users.filter((user) => user.role === "coach" && user.status === "active").length
  const coachLimitReached = Boolean(packageDefinition && activeCoachCount >= packageDefinition.limits.coaches)
  const suggestedUpgradePackage = getNextPackageTier(requestedPlan)

  const handleSubmitUpgradeRequest = async () => {
    if (!isSupabaseMode || !suggestedUpgradePackage || pendingUpgradeRequest) return
    setUpgradeSaving(true)
    const result = await submitClubAdminPackageUpgradeRequest({
      requestedPackage: suggestedUpgradePackage,
      reason: upgradeReason,
    })
    setUpgradeSaving(false)

    if (!result.ok) {
      setBackendError(result.error.message)
      return
    }

    setPendingUpgradeRequest({
      requestedPackage: suggestedUpgradePackage,
      createdAt: new Date().toISOString(),
    })
    setUpgradeReason("")
    setUpgradeDialogOpen(false)
    setBackendError(null)
  }

  const inviteComposer = (
    <div className="space-y-4">
      <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
        Club admins can invite users into the tenant, but they should never create user accounts manually. SKTR Coach checks whether the invited email already exists and routes the invite flow automatically.
      </div>
      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-950">Coach email</label>
          <Input
            className="h-12 rounded-[16px] border-slate-200 bg-slate-50"
            type="email"
            placeholder="coach@email.com"
            value={coachInviteEmail}
            onChange={(event) => setCoachInviteEmail(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-950">Team assignment</label>
          <Select value={coachInviteTeamId} onValueChange={setCoachInviteTeamId}>
            <SelectTrigger className="h-12 rounded-[16px] border-slate-200 bg-slate-50">
              <SelectValue placeholder="Team assignment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No team</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {coachLimitReached && packageDefinition ? (
          <p className="rounded-[16px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {packageDefinition.label} allows up to {packageDefinition.limits.coaches} coach{packageDefinition.limits.coaches === 1 ? "" : "es"}. Upgrade the package before sending another invite.
          </p>
        ) : null}
      </div>
    </div>
  )

  return (
    <div className="mx-auto w-full max-w-8xl space-y-5 p-4 sm:space-y-6 sm:p-6">
      <StandardPageHeader
        variant="admin"
        eyebrow="Club admin users"
        title="Invite and access control."
        description="Send invites and manage active user access. Club admins should never provision accounts manually."
        stats={headerStats}
      />
      {backendError ? (
        <section className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Backend sync issue: {backendError}
        </section>
      ) : null}
      {packageDefinition ? (
        <section className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
          <p className="font-medium text-slate-950">{packageDefinition.label} package</p>
          <p className="mt-1">
            Active coaches: {activeCoachCount}/{Number.isFinite(packageDefinition.limits.coaches) ? packageDefinition.limits.coaches : "Unlimited"}
          </p>
        {coachLimitReached ? (
            <p className="mt-2 text-sm text-amber-700">
              This tenant is at coach capacity. Upgrade the package before sending another coach invite.
            </p>
          ) : null}
          {coachLimitReached ? (
            pendingUpgradeRequest ? (
              <p className="mt-2 text-sm text-[#1368ff]">
                Upgrade request pending for {getPackageById(pendingUpgradeRequest.requestedPackage)?.label ?? pendingUpgradeRequest.requestedPackage}.
              </p>
            ) : suggestedUpgradePackage ? (
              <div className="mt-3">
                <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" className="h-10 rounded-full border-slate-200 px-4">
                      Request upgrade to {getPackageById(suggestedUpgradePackage)?.label ?? suggestedUpgradePackage}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Request package upgrade</DialogTitle>
                      <DialogDescription>
                        Submit an upgrade request to move this tenant from {packageDefinition.label} to {getPackageById(suggestedUpgradePackage)?.label ?? suggestedUpgradePackage}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Current package: <span className="font-medium text-slate-950">{packageDefinition.label}</span><br />
                        Requested package: <span className="font-medium text-slate-950">{getPackageById(suggestedUpgradePackage)?.label ?? suggestedUpgradePackage}</span>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="coach-upgrade-reason" className="text-sm font-medium text-slate-950">Reason</label>
                        <Textarea
                          id="coach-upgrade-reason"
                          value={upgradeReason}
                          onChange={(event) => setUpgradeReason(event.target.value)}
                          placeholder="Explain why this tenant needs more coach capacity."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" className="border-slate-200" onClick={() => setUpgradeDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="button" disabled={upgradeSaving} onClick={() => void handleSubmitUpgradeRequest()}>
                        {upgradeSaving ? "Submitting..." : "Submit upgrade request"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : null
          ) : null}
        </section>
      ) : null}
      {isSupabaseMode && backendLoading ? (
        <section className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          Loading users and access controls...
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:items-start">
        <div className="mobile-card-primary">
          <DataSurfaceToolbar
            className="mb-4"
            eyebrow="Invite access"
            title="Send coach invite"
            description="Start coach access from an invite instead of exposing the form inline on the page."
            status={
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-500">
                Pending invites: <span className="ml-1 font-medium text-slate-700">{pendingInvites}</span>
              </div>
            }
            controls={
              useDesktopInviteDialog ? (
                <Dialog open={inviteComposerOpen} onOpenChange={setInviteComposerOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      disabled={coachLimitReached}
                      className="h-11 rounded-full bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)] px-5 text-white shadow-[0_12px_28px_rgba(31,140,255,0.22)] hover:opacity-95"
                    >
                      New invite
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader className="text-left">
                      <DialogTitle>Send coach invite</DialogTitle>
                      <DialogDescription>
                        Invite a coach into this tenant and optionally attach the invite to a team.
                      </DialogDescription>
                    </DialogHeader>
                    {inviteComposer}
                    <DialogFooter className="gap-3 sm:justify-start">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-full border-slate-200"
                        onClick={() => setInviteComposerOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        disabled={coachLimitReached}
                        className="h-11 rounded-full bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)] px-5 text-white shadow-[0_12px_28px_rgba(31,140,255,0.22)] hover:opacity-95"
                        onClick={() => void handleSendCoachInvite()}
                      >
                        Send invite
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Drawer open={inviteComposerOpen} onOpenChange={setInviteComposerOpen}>
                  <DrawerTrigger asChild>
                    <Button
                      type="button"
                      disabled={coachLimitReached}
                      className="h-11 rounded-full bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)] px-5 text-white shadow-[0_12px_28px_rgba(31,140,255,0.22)] hover:opacity-95"
                    >
                      New invite
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[88dvh]">
                    <DrawerHeader className="text-left">
                      <DrawerTitle>Send coach invite</DrawerTitle>
                      <DrawerDescription>
                        Invite a coach into this tenant and optionally attach the invite to a team.
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 pb-2">{inviteComposer}</div>
                    <DrawerFooter className="gap-3">
                      <Button
                        type="button"
                        disabled={coachLimitReached}
                        className="h-11 rounded-full bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)] px-5 text-white shadow-[0_12px_28px_rgba(31,140,255,0.22)] hover:opacity-95"
                        onClick={() => void handleSendCoachInvite()}
                      >
                        Send invite
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-full border-slate-200"
                        onClick={() => setInviteComposerOpen(false)}
                      >
                        Cancel
                      </Button>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              )
            }
          />
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              {invites.length === 0 ? (
                <EmptyStateCard
                  eyebrow="Invite access"
                  title="No coach invites yet."
                  description="Coach access begins from an invite, not by creating accounts manually. Send the first coach invite when a new staff member is ready to join."
                  hint="You can optionally assign the invite to a team so the coach lands in the correct scope immediately."
                  icon={<HugeiconsIcon icon={Mail01Icon} className="size-5" />}
                  className="rounded-[18px] bg-slate-50 px-4 py-6 shadow-none"
                  contentClassName="gap-3"
                  actions={
                    <Button
                      type="button"
                      disabled={coachLimitReached}
                      className="h-10 rounded-full bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)] px-4 text-white shadow-[0_12px_28px_rgba(31,140,255,0.22)] hover:opacity-95"
                      onClick={() => setInviteComposerOpen(true)}
                    >
                      Send first coach invite
                    </Button>
                  }
                />
              ) : (
                invites.map((invite) => (
                  <div key={invite.id} className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[16px] border border-slate-200 bg-white px-3 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Email</p>
                          <p className="mt-1 break-all text-sm font-medium text-slate-950">{invite.email}</p>
                        </div>
                        <div className="rounded-[16px] border border-slate-200 bg-white px-3 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Status</p>
                          <p className="mt-1">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                                invite.status === "pending" && "status-chip-warning",
                                invite.status === "accepted" && "status-chip-success",
                                invite.status === "expired" && "status-chip-neutral",
                              )}
                            >
                              {invite.status}
                            </span>
                          </p>
                        </div>
                        <div className="rounded-[16px] border border-slate-200 bg-white px-3 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Team</p>
                          <p className="mt-1 text-sm font-medium text-slate-950">
                            {formatInviteTeamLabel(invite.teamId, teams)}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-[16px] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-500">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Created</p>
                        <p className="mt-1 text-sm font-medium text-slate-950">{invite.createdAt}</p>
                      </div>
                    </div>
                    {invite.inviteUrl ? (
                      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                        <div className="rounded-[16px] border border-slate-200 bg-white px-3 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Invite link</p>
                          <code className="mt-1 block break-all text-xs text-slate-700">{invite.inviteUrl}</code>
                        </div>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          {isLocalPreviewEnabled ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="h-9 rounded-full px-4 text-xs"
                              onClick={() => {
                                const absoluteUrl = `${window.location.origin}${invite.inviteUrl}`
                                window.open(absoluteUrl, "_blank", "noopener,noreferrer")
                              }}
                            >
                              Open invite
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 rounded-full px-4 text-xs"
                            onClick={() => {
                              const absoluteUrl = `${window.location.origin}${invite.inviteUrl}`
                              void navigator.clipboard.writeText(absoluteUrl)
                            }}
                          >
                            Copy link
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="mobile-card-primary">
          <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">User Directory</p>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Access Control</h2>
            </div>
            <div className="hidden sm:flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-500">
              Active users: <span className="ml-1 font-medium text-slate-700">{headerStats[2].value}</span>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-950">{user.name}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {user.role}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {formatInviteTeamLabel(user.teamId, teams)}
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[150px_120px_auto] sm:items-center">
                    <Select
                      value={user.role}
                      onValueChange={async (value) => {
                        if (backendMode === "supabase") {
                          const result = await updateProfileRoleAndStatus({
                            userId: user.id,
                            role: value as UserRole,
                            status: user.status,
                          })
                          if (!result.ok) {
                            setBackendError(result.error.message)
                            return
                          }
                          const next = users.map((item) => (item.id === user.id ? { ...item, role: value as UserRole } : item))
                          saveUsers(next)
                          await emitAudit("role_assign", user.email, `role ${value}`)
                          return
                        }

                        const next = users.map((item) => (item.id === user.id ? { ...item, role: value as UserRole } : item))
                        saveUsers(next)
                        await emitAudit("role_assign", user.email, `role ${value}`)
                      }}
                    >
                      <SelectTrigger className="h-11 rounded-[16px] border-slate-200 bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="club-admin">Club Admin</SelectItem>
                        <SelectItem value="coach">Coach</SelectItem>
                        <SelectItem value="athlete">Athlete</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className={cn(
                      "inline-flex h-11 items-center justify-center rounded-full px-3 text-sm font-semibold capitalize",
                      user.status === "active" ? "status-chip-neutral" : "status-chip-danger",
                    )}>
                      {user.status}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      className="mobile-action-secondary"
                      onClick={async () => {
                        if (backendMode === "supabase") {
                          const nextStatus = (user.status === "active" ? "disabled" : "active") as ClubUser["status"]
                          const result = await updateProfileRoleAndStatus({
                            userId: user.id,
                            role: user.role,
                            status: nextStatus,
                          })
                          if (!result.ok) {
                            setBackendError(result.error.message)
                            return
                          }
                          const next = users.map((item) => (item.id === user.id ? { ...item, status: nextStatus } : item))
                          saveUsers(next)
                          await emitAudit(nextStatus === "disabled" ? "user_disable" : "user_enable", user.email)
                          return
                        }

                        const next = users.map((item) =>
                          item.id === user.id ? { ...item, status: (item.status === "active" ? "disabled" : "active") as ClubUser["status"] } : item,
                        )
                        saveUsers(next)
                        await emitAudit(user.status === "active" ? "user_disable" : "user_enable", user.email)
                      }}
                    >
                      {user.status === "active" ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
