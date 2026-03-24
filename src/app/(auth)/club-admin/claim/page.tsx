"use client"

import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { FirstAccessSetupPanel } from "@/components/club-admin/first-access-setup-panel"
import {
  completeClubAdminFirstAccessSetup,
  getClubAdminProfileRecord,
  type ClubAdminProfileRecord,
} from "@/lib/data/club-admin/ops-data"
import { resolveSessionActor } from "@/lib/supabase/actor"
import { getBackendMode, isSupabaseEnabled } from "@/lib/supabase/config"
import { getBrowserSupabaseClient } from "@/lib/supabase/client"

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

async function diagnoseClaimFailure(
  supabase: NonNullable<ReturnType<typeof getBrowserSupabaseClient>>,
  userId: string,
  email: string | null,
) {
  if (!email) {
    return "This claim session has no email identity. Open the latest claim link again."
  }

  const normalizedEmail = email.trim().toLowerCase()

  const [profileResult, requestResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, tenant_id")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("tenant_provision_requests")
      .select("status, provisioned_tenant_id")
      .eq("requestor_email", normalizedEmail)
      .order("reviewed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (profileResult.error) {
    return `Claim bootstrap could not inspect your profile record: ${profileResult.error.message}`
  }

  if (profileResult.data && profileResult.data.role !== "club-admin") {
    return `This account resolved to role "${profileResult.data.role}", not "club-admin".`
  }

  if (requestResult.error) {
    return `Claim bootstrap could not inspect the approved request record: ${requestResult.error.message}`
  }

  if (!requestResult.data) {
    return "No tenant request was found for this email. Approve a request for this exact email first."
  }

  if (requestResult.data.status !== "approved") {
    return `The request for this email is "${requestResult.data.status}", not "approved".`
  }

  if (!requestResult.data.provisioned_tenant_id) {
    return "The request was approved, but no tenant has been provisioned for it yet."
  }

  return "The claim session exists, but the club-admin profile bootstrap did not complete."
}

export default function ClubAdminClaimPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isSupabaseMode = getBackendMode() === "supabase"
  const [profile, setProfile] = useState<ClubAdminProfileRecord>(defaultProfile)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(isSupabaseMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseMode) {
      setError("Club-admin claim is only available in Supabase mode.")
      setLoading(false)
      return
    }
    if (!isSupabaseEnabled()) {
      setError("Supabase mode is enabled but URL/key are missing in environment.")
      setLoading(false)
      return
    }

    const supabase = getBrowserSupabaseClient()
    if (!supabase) {
      setError("Supabase client failed to initialize.")
      setLoading(false)
      return
    }

    let cancelled = false

    const bootstrapClaim = async () => {
      setLoading(true)
      const tokenHash = searchParams.get("token_hash")
      const tokenType = searchParams.get("type")

      if (tokenHash && tokenType) {
        const verifyResult = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: tokenType as "magiclink" | "invite",
        })
        if (cancelled) return
        if (verifyResult.error) {
          setError(verifyResult.error.message)
          setLoading(false)
          return
        }
      }

      const { data } = await supabase.auth.getSession()
      const session = data.session
      if (cancelled) return
      if (!session) {
        setError("No first-access session found. Open the latest claim link again.")
        setLoading(false)
        return
      }

      const actor = await resolveSessionActor(supabase, session)
      if (cancelled) return
      if (!actor || actor.role !== "club-admin") {
        const diagnosis = await diagnoseClaimFailure(supabase, session.user.id, session.user.email ?? null)
        if (cancelled) return
        setError(diagnosis)
        setLoading(false)
        return
      }

      const profileResult = await getClubAdminProfileRecord()
      if (cancelled) return
      if (!profileResult.ok) {
        setError(profileResult.error.message)
        setLoading(false)
        return
      }

      if (profileResult.data.passwordSetAt && profileResult.data.onboardingCompletedAt) {
        navigate("/club-admin/dashboard", { replace: true })
        return
      }

      setProfile(profileResult.data)
      setError(null)
      setLoading(false)
    }

    void bootstrapClaim()

    return () => {
      cancelled = true
    }
  }, [isSupabaseMode, navigate, searchParams])

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

  return loading ? (
    <section className="mx-auto mt-10 w-full max-w-4xl rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
      Loading claim flow...
    </section>
  ) : (
    <FirstAccessSetupPanel
      profile={profile}
      password={password}
      confirmPassword={confirmPassword}
      saving={saving}
      error={error}
      loadingCopy="Claiming account..."
      submitLabel="Claim account and continue"
      title="Claim your club-admin account"
      intro="This is the first-access claim flow for your approved organization request. Set your password and complete the minimum club setup before entering the PaceLab workspace."
      onPasswordChange={setPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onProfileChange={setProfile}
      onSubmit={() => void handleSubmit()}
    />
  )
}
