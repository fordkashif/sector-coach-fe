"use client"

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  completeClubAdminFirstAccessSetup,
  createClubAdminTeam,
  createCoachInvite,
  getCurrentClubAdminActivationState,
  getClubAdminProfileRecord,
  updateCurrentClubAdminOnboardingStep,
  type ClubAdminProfileRecord,
} from "@/lib/data/club-admin/ops-data"
import { getBackendMode } from "@/lib/supabase/config"
import { getBrowserSupabaseClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const defaultProfile: ClubAdminProfileRecord = {
  clubName: "",
  shortName: "",
  primaryColor: "#1368ff",
  seasonYear: "2026",
  seasonStart: "2026-01-10",
  seasonEnd: "2026-10-30",
  passwordSetAt: null,
  onboardingCompletedAt: null,
}

const onboardingSteps = [
  { id: "club-profile", label: "Club profile" },
  { id: "branding", label: "Season setup" },
  { id: "first-team", label: "First team" },
  { id: "coach-access", label: "Coach access" },
  { id: "security", label: "Security and review" },
] as const

const EVENT_GROUP_OPTIONS = ["Sprint", "Mid", "Distance", "Jumps", "Throws"] as const

export default function ClubAdminGetStartedPage() {
  const navigate = useNavigate()
  const isSupabaseMode = getBackendMode() === "supabase"
  const [profile, setProfile] = useState<ClubAdminProfileRecord>(defaultProfile)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(isSupabaseMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [firstTeamName, setFirstTeamName] = useState("")
  const [firstTeamEventGroup, setFirstTeamEventGroup] = useState<(typeof EVENT_GROUP_OPTIONS)[number]>("Sprint")
  const [createdTeamId, setCreatedTeamId] = useState<string | null>(null)
  const [coachInviteEmail, setCoachInviteEmail] = useState("")

  useEffect(() => {
    if (!isSupabaseMode) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      const client = getBrowserSupabaseClient()
      if (!client) {
        setError("Supabase client failed to initialize.")
        setLoading(false)
        return
      }

      const [activationResult, result] = await Promise.all([
        getCurrentClubAdminActivationState(),
        getClubAdminProfileRecord(),
      ])
      if (cancelled) return

      if (activationResult.ok) {
        if (
          activationResult.data.lifecycleStatus === "approved_pending_billing" ||
          activationResult.data.lifecycleStatus === "billing_failed"
        ) {
          navigate("/club-admin/setup/billing", { replace: true })
          return
        }

        const initialStepIndex = (() => {
          switch (activationResult.data.onboardingStep) {
            case "branding":
              return 1
            case "first_team":
              return 2
            case "coach_access":
              return 3
            case "review":
            case "complete":
              return 4
            default:
              return 0
          }
        })()
        setStepIndex(initialStepIndex)
      }

      if (!result.ok) {
        setError(result.error.message)
        setLoading(false)
        return
      }
      if (result.data.passwordSetAt && result.data.onboardingCompletedAt) {
        navigate("/club-admin/dashboard", { replace: true })
        return
      }
      setProfile(result.data)
      setError(null)
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [isSupabaseMode, navigate])

  const currentStep = onboardingSteps[stepIndex]
  const canAdvance = useMemo(() => {
    if (currentStep.id === "club-profile") {
      return Boolean(profile.clubName.trim() && profile.shortName.trim())
    }
    if (currentStep.id === "branding") {
      return Boolean(profile.seasonYear.trim() && profile.seasonStart && profile.seasonEnd)
    }
    if (currentStep.id === "first-team") {
      return Boolean(firstTeamName.trim())
    }
    if (currentStep.id === "coach-access") {
      return Boolean(createdTeamId && coachInviteEmail.trim())
    }
    return true
  }, [coachInviteEmail, createdTeamId, currentStep.id, firstTeamName, profile.clubName, profile.seasonEnd, profile.seasonStart, profile.seasonYear, profile.shortName])

  const handleContinue = async () => {
    setError(null)

    if (currentStep.id === "club-profile") {
      const result = await updateCurrentClubAdminOnboardingStep("branding")
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      setStepIndex(1)
      return
    }

    if (currentStep.id === "branding") {
      const result = await updateCurrentClubAdminOnboardingStep("first_team")
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      setStepIndex(2)
      return
    }

    if (currentStep.id === "first-team") {
      setSaving(true)
      const result = await createClubAdminTeam({
        name: firstTeamName.trim(),
        eventGroup: firstTeamEventGroup,
      })
      setSaving(false)
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      setCreatedTeamId(result.data.id)
      const stepResult = await updateCurrentClubAdminOnboardingStep("coach_access")
      if (!stepResult.ok) {
        setError(stepResult.error.message)
        return
      }
      setStepIndex(3)
      return
    }

    if (currentStep.id === "coach-access") {
      if (!createdTeamId) {
        setError("Create the first team before sending the coach invite.")
        return
      }
      setSaving(true)
      const result = await createCoachInvite({
        email: coachInviteEmail.trim().toLowerCase(),
        teamId: createdTeamId,
      })
      setSaving(false)
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      const stepResult = await updateCurrentClubAdminOnboardingStep("review")
      if (!stepResult.ok) {
        setError(stepResult.error.message)
        return
      }
      setStepIndex(4)
    }
  }

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setSaving(true)
    const result = await completeClubAdminFirstAccessSetup({
      password,
      profile,
    })
    if (!result.ok) {
      setSaving(false)
      setError(result.error.message)
      return
    }

    const stepResult = await updateCurrentClubAdminOnboardingStep("complete")
    setSaving(false)
    if (!stepResult.ok) {
      setError(stepResult.error.message)
      return
    }

    setError(null)
    navigate("/club-admin/dashboard", { replace: true })
  }

  return loading ? (
    <section className="mx-auto mt-6 w-full max-w-4xl rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
      Loading first-access setup...
    </section>
  ) : (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-8">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Club onboarding</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">Finish tenant setup before you enter the workspace</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Billing is complete. Finish the minimum club setup now so the tenant can move from activation into normal operations.
          </p>
        </div>
      </section>

      {error ? <section className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</section> : null}

      <section className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="mobile-card-primary h-fit">
          <div className="space-y-1 border-b border-slate-200 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Steps</p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Onboarding progress</h2>
          </div>
          <div className="mt-4 space-y-3">
            {onboardingSteps.map((step, index) => (
              <div
                key={step.id}
                className={index === stepIndex ? "rounded-[18px] border border-[#cfe2ff] bg-[#eff6ff] px-4 py-3" : "rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3"}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Step {index + 1}</p>
                <p className="mt-1 text-sm font-medium text-slate-950">{step.label}</p>
              </div>
            ))}
          </div>
        </aside>

        <div className="mobile-card-primary">
          {currentStep.id === "club-profile" ? (
            <div className="space-y-5">
              <div className="space-y-1 border-b border-slate-200 pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Club profile</p>
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Set the tenant identity</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-medium text-slate-950">Club name</Label>
                  <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" value={profile.clubName} onChange={(event) => setProfile({ ...profile, clubName: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-950">Short name</Label>
                  <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" value={profile.shortName} onChange={(event) => setProfile({ ...profile, shortName: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-950">Primary color</Label>
                  <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" type="color" value={profile.primaryColor} onChange={(event) => setProfile({ ...profile, primaryColor: event.target.value })} />
                </div>
              </div>
            </div>
          ) : null}

          {currentStep.id === "branding" ? (
            <div className="space-y-5">
              <div className="space-y-1 border-b border-slate-200 pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Season setup</p>
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Set the default operating window</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-950">Season year</Label>
                  <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" value={profile.seasonYear} onChange={(event) => setProfile({ ...profile, seasonYear: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-950">Season start</Label>
                  <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" type="date" value={profile.seasonStart} onChange={(event) => setProfile({ ...profile, seasonStart: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-950">Season end</Label>
                  <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" type="date" value={profile.seasonEnd} onChange={(event) => setProfile({ ...profile, seasonEnd: event.target.value })} />
                </div>
              </div>
            </div>
          ) : null}

          {currentStep.id === "first-team" ? (
            <div className="space-y-5">
              <div className="space-y-1 border-b border-slate-200 pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">First team</p>
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Create the initial operating team</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-medium text-slate-950">Team name</Label>
                  <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" value={firstTeamName} onChange={(event) => setFirstTeamName(event.target.value)} placeholder="Elite Sprint Group" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-950">Event group</Label>
                  <Select value={firstTeamEventGroup} onValueChange={(value) => setFirstTeamEventGroup(value as (typeof EVENT_GROUP_OPTIONS)[number])}>
                    <SelectTrigger className="h-12 w-full rounded-[16px] border-slate-200 bg-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_GROUP_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : null}

          {currentStep.id === "coach-access" ? (
            <div className="space-y-5">
              <div className="space-y-1 border-b border-slate-200 pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Coach access</p>
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Invite the first coach into the tenant</h2>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                The first coach invite is sent into the real invite flow and assigned to the team you just created.
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-medium text-slate-950">Coach email</Label>
                  <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" type="email" value={coachInviteEmail} onChange={(event) => setCoachInviteEmail(event.target.value)} placeholder="coach@club.com" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-950">Assigned team</Label>
                  <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-100 text-slate-600" value={firstTeamName || "Initial team"} disabled />
                </div>
              </div>
            </div>
          ) : null}

          {currentStep.id === "security" ? (
            <div className="space-y-5">
              <div className="space-y-1 border-b border-slate-200 pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Security and review</p>
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Set the password and confirm the setup</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-950">New password</Label>
                  <Input type="password" className="h-12 rounded-[16px] border-slate-200 bg-slate-50" value={password} onChange={(event) => setPassword(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-950">Confirm password</Label>
                  <Input type="password" className="h-12 rounded-[16px] border-slate-200 bg-slate-50" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                </div>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                <p className="font-medium text-slate-950">{profile.clubName || "Club name not set yet"}</p>
                <p>
                  {profile.shortName || "No short name"} · {profile.seasonYear || "No season year"} · {profile.seasonStart || "No start"} to {profile.seasonEnd || "No end"}
                </p>
                <p className="mt-1">
                  {firstTeamName || "No team created yet"} · {coachInviteEmail || "No coach invite sent yet"}
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
            <Button
              type="button"
              variant="outline"
              disabled={stepIndex === 0 || saving}
              className="h-12 rounded-full border-slate-200 bg-white px-5 text-slate-950 hover:border-[#1f8cff] hover:bg-[#eef5ff] hover:text-slate-950"
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            >
              Back
            </Button>
            {stepIndex < onboardingSteps.length - 1 ? (
              <Button
                type="button"
                disabled={!canAdvance || saving}
                className="h-12 rounded-full bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)] px-5 text-white shadow-[0_12px_28px_rgba(31,140,255,0.22)] hover:opacity-95"
                onClick={() => void handleContinue()}
              >
                {saving
                  ? currentStep.id === "first-team"
                    ? "Creating team..."
                    : currentStep.id === "coach-access"
                      ? "Sending invite..."
                      : "Continuing..."
                  : "Continue"}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={saving}
                className="h-12 rounded-full bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)] px-5 text-white shadow-[0_12px_28px_rgba(31,140,255,0.22)] hover:opacity-95"
                onClick={() => void handleSubmit()}
              >
                {saving ? "Completing setup..." : "Complete setup"}
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
