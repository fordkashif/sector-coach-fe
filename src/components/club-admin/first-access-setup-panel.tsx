"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ClubAdminProfileRecord } from "@/lib/data/club-admin/ops-data"

type FirstAccessSetupPanelProps = {
  profile: ClubAdminProfileRecord
  password: string
  confirmPassword: string
  saving: boolean
  error: string | null
  loadingCopy: string
  submitLabel: string
  title: string
  intro: string
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onProfileChange: (next: ClubAdminProfileRecord) => void
  onSubmit: () => void
}

export function FirstAccessSetupPanel({
  profile,
  password,
  confirmPassword,
  saving,
  error,
  loadingCopy,
  submitLabel,
  title,
  intro,
  onPasswordChange,
  onConfirmPasswordChange,
  onProfileChange,
  onSubmit,
}: FirstAccessSetupPanelProps) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-8">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Required first access</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">{title}</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">{intro}</p>
        </div>
      </section>

      {error ? (
        <section className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </section>
      ) : null}

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
                onChange={(event) => onPasswordChange(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-950">Confirm password</Label>
              <Input
                type="password"
                className="h-12 rounded-[16px] border-slate-200 bg-slate-50"
                value={confirmPassword}
                onChange={(event) => onConfirmPasswordChange(event.target.value)}
              />
            </div>
            <p className="text-sm text-slate-500">Use a real password here. The first-access link only claims the account. It is not your normal ongoing sign-in method.</p>
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
              <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" value={profile.clubName} onChange={(event) => onProfileChange({ ...profile, clubName: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-950">Short name</Label>
              <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" value={profile.shortName} onChange={(event) => onProfileChange({ ...profile, shortName: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-950">Primary color</Label>
              <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" type="color" value={profile.primaryColor} onChange={(event) => onProfileChange({ ...profile, primaryColor: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-950">Season year</Label>
              <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" value={profile.seasonYear} onChange={(event) => onProfileChange({ ...profile, seasonYear: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-950">Season start</Label>
              <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" type="date" value={profile.seasonStart} onChange={(event) => onProfileChange({ ...profile, seasonStart: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-950">Season end</Label>
              <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" type="date" value={profile.seasonEnd} onChange={(event) => onProfileChange({ ...profile, seasonEnd: event.target.value })} />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Button
              type="button"
              disabled={saving}
              className="h-12 rounded-full bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)] px-5 text-white shadow-[0_12px_28px_rgba(31,140,255,0.22)] hover:opacity-95"
              onClick={onSubmit}
            >
              {saving ? loadingCopy : submitLabel}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
