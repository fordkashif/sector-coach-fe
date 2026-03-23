"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  completeClubAdminFirstAccessSetup,
  getClubAdminProfileRecord,
  type ClubAdminProfileRecord,
} from "@/lib/data/club-admin/ops-data"
import { getBackendMode } from "@/lib/supabase/config"

const defaultProfile: ClubAdminProfileRecord = {
  clubName: "",
  shortName: "",
  primaryColor: "#16a34a",
  seasonYear: "2026",
  seasonStart: "2026-01-10",
  seasonEnd: "2026-10-30",
  passwordSetAt: null,
  onboardingCompletedAt: null,
}

export default function ClubAdminGetStartedPage() {
  const navigate = useNavigate()
  const isSupabaseMode = getBackendMode() === "supabase"
  const [profile, setProfile] = useState<ClubAdminProfileRecord>(defaultProfile)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(isSupabaseMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseMode) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      const result = await getClubAdminProfileRecord()
      if (cancelled) return
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
    setSaving(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setError(null)
    navigate("/club-admin/dashboard", { replace: true })
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-8">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Required first access</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">Finish club setup before you enter the workspace</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            This account was provisioned from an approved organization request. Set your password and complete the minimum club setup now. The dashboard stays locked until this is done.
          </p>
        </div>
      </section>

      {error ? (
        <section className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </section>
      ) : null}

      {loading ? (
        <section className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          Loading first-access setup...
        </section>
      ) : (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="mobile-card-primary">
            <div className="space-y-1 border-b border-slate-200 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Security</p>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Set your password</h2>
            </div>
            <div className="mt-4 grid gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-950">New password</Label>
                <Input
                  type="password"
                  className="h-12 rounded-[16px] border-slate-200 bg-slate-50"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-950">Confirm password</Label>
                <Input
                  type="password"
                  className="h-12 rounded-[16px] border-slate-200 bg-slate-50"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              <p className="text-sm text-slate-500">Use a real password here. The magic link is only for first access, not for normal ongoing sign-in.</p>
            </div>
          </div>

          <div className="mobile-card-primary">
            <div className="space-y-1 border-b border-slate-200 pb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Organization</p>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Complete tenant profile</h2>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-medium text-slate-950">Club name</Label>
                <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" value={profile.clubName} onChange={(event) => setProfile((current) => ({ ...current, clubName: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-950">Short name</Label>
                <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" value={profile.shortName} onChange={(event) => setProfile((current) => ({ ...current, shortName: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-950">Primary color</Label>
                <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" type="color" value={profile.primaryColor} onChange={(event) => setProfile((current) => ({ ...current, primaryColor: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-950">Season year</Label>
                <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" value={profile.seasonYear} onChange={(event) => setProfile((current) => ({ ...current, seasonYear: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-950">Season start</Label>
                <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" type="date" value={profile.seasonStart} onChange={(event) => setProfile((current) => ({ ...current, seasonStart: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-950">Season end</Label>
                <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" type="date" value={profile.seasonEnd} onChange={(event) => setProfile((current) => ({ ...current, seasonEnd: event.target.value }))} />
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <Button
                type="button"
                disabled={saving}
                className="h-12 rounded-full bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)] px-5 text-white shadow-[0_12px_28px_rgba(31,140,255,0.22)] hover:opacity-95"
                onClick={() => void handleSubmit()}
              >
                {saving ? "Completing setup..." : "Complete setup"}
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
