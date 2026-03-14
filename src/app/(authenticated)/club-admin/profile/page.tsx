"use client"

import { useState } from "react"
import { ClubAdminNav } from "@/components/club-admin/admin-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { logAuditEvent } from "@/lib/mock-audit"
import { loadProfileSafe, persistProfile } from "../state"

export default function ClubAdminProfilePage() {
  const [profile, setProfile] = useState(loadProfileSafe)
  const [saved, setSaved] = useState(false)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6">
      <section className="-mx-4 px-4 py-4 sm:-mx-6 sm:px-6 sm:py-5">
        <div className="space-y-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Club Profile</h1>
            <p className="text-sm text-slate-500">Manage branding, season configuration, and the club identity used across the tenant.</p>
          </div>
          <ClubAdminNav />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
          <div className="space-y-1 border-b border-slate-200 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Branding & Season</p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Tenant Identity</h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
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
              className="h-12 rounded-full bg-[linear-gradient(135deg,#1f8cff_0%,#4759ff_100%)] px-5 text-white shadow-[0_12px_28px_rgba(31,140,255,0.22)] hover:opacity-95"
              onClick={() => {
                persistProfile(profile)
                setSaved(true)
                logAuditEvent({ actor: "club-admin", action: "profile_update", target: "club-profile", detail: `${profile.clubName} (${profile.seasonYear})` })
              }}
            >
              Save profile
            </Button>
            {saved ? <p className="text-sm text-[#1f8cff]">Saved.</p> : null}
          </div>
        </div>

        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5">
          <div className="space-y-1 border-b border-slate-200 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Preview</p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Identity Summary</h2>
          </div>
          <div className="mt-4 rounded-[22px] bg-[linear-gradient(135deg,#031733_0%,#0b2d63_100%)] p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8db8ff]">{profile.shortName}</p>
            <h3 className="mt-3 text-[30px] font-semibold leading-[1.05] tracking-[-0.05em]">{profile.clubName}</h3>
            <p className="mt-3 text-sm text-white/72">Season {profile.seasonYear}</p>
          </div>
          <div className="mt-4 grid gap-2">
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Primary Color</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="size-8 rounded-full border border-slate-200" style={{ backgroundColor: profile.primaryColor }} />
                <span className="text-sm font-medium text-slate-950">{profile.primaryColor}</span>
              </div>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
              {profile.seasonStart} to {profile.seasonEnd}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
