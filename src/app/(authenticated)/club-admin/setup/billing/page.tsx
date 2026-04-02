"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getPackageById } from "@/lib/billing/package-catalog"
import {
  completeCurrentClubAdminMockBillingSetup,
  getCurrentClubAdminActivationState,
  type ClubAdminActivationState,
} from "@/lib/data/club-admin/ops-data"
import { getBackendMode } from "@/lib/supabase/config"

export default function ClubAdminBillingSetupPage() {
  const navigate = useNavigate()
  const isSupabaseMode = getBackendMode() === "supabase"
  const [loading, setLoading] = useState(isSupabaseMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activationState, setActivationState] = useState<ClubAdminActivationState | null>(null)
  const [billingContactName, setBillingContactName] = useState("")
  const [billingContactEmail, setBillingContactEmail] = useState("")
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")

  useEffect(() => {
    if (!isSupabaseMode) {
      setError("Billing setup is only available in Supabase mode.")
      setLoading(false)
      return
    }

    let cancelled = false
    const load = async () => {
      setLoading(true)
      const result = await getCurrentClubAdminActivationState()
      if (cancelled) return
      if (!result.ok) {
        setError(result.error.message)
        setLoading(false)
        return
      }

      if (result.data.lifecycleStatus !== "approved_pending_billing" && result.data.lifecycleStatus !== "billing_failed") {
        navigate("/club-admin/get-started", { replace: true })
        return
      }

      setActivationState(result.data)
      setBillingContactName(result.data.billingContactName ?? "")
      setBillingContactEmail(result.data.billingContactEmail ?? "")
      setBillingCycle(result.data.billingCycle ?? "monthly")
      setError(null)
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [isSupabaseMode, navigate])

  const handleSubmit = async () => {
    if (!billingContactName.trim()) {
      setError("Billing contact name is required.")
      return
    }
    if (!billingContactEmail.trim()) {
      setError("Billing contact email is required.")
      return
    }

    setSaving(true)
    const result = await completeCurrentClubAdminMockBillingSetup({
      billingContactName,
      billingContactEmail,
      billingCycle,
    })
    setSaving(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }

    setError(null)
    navigate("/club-admin/get-started", { replace: true })
  }

  if (loading) {
    return <section className="mx-auto mt-6 w-full max-w-4xl rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Loading billing setup...</section>
  }

  if (!activationState) {
    return (
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <EmptyStateCard
          eyebrow="Billing setup"
          title="Billing setup is not available."
          description={error ?? "No club-admin activation state was found for this account."}
        />
      </div>
    )
  }

  const packageDefinition = getPackageById(activationState.requestedPlan)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-8">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Billing setup</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">Complete billing before workspace activation</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            This billing step is intentionally mocked for now. Everything else in the tenant flow stays real.
          </p>
        </div>
      </section>

      {activationState.lifecycleStatus === "billing_failed" ? (
        <section className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The previous billing attempt did not complete. Update the billing contact details below and retry the mocked billing step.
        </section>
      ) : null}

      {error ? <section className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</section> : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="mobile-card-primary">
          <div className="space-y-1 border-b border-slate-200 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Billing contact</p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Mock billing details</h2>
          </div>
          <div className="mt-4 grid gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-950">Billing contact name</Label>
              <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" value={billingContactName} onChange={(event) => setBillingContactName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-950">Billing contact email</Label>
              <Input className="h-12 rounded-[16px] border-slate-200 bg-slate-50" type="email" value={billingContactEmail} onChange={(event) => setBillingContactEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-950">Billing cycle</Label>
              <Select value={billingCycle} onValueChange={(value) => setBillingCycle(value as "monthly" | "annual")}>
                <SelectTrigger className="h-12 w-full rounded-[16px] border-slate-200 bg-slate-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              disabled={saving}
              className="h-12 rounded-full bg-[linear-gradient(135deg,#1368ff_0%,#2f80ff_100%)] px-5 text-white shadow-[0_12px_28px_rgba(31,140,255,0.22)] hover:opacity-95"
              onClick={() => void handleSubmit()}
            >
              {saving ? "Activating workspace..." : activationState.lifecycleStatus === "billing_failed" ? "Retry mocked billing" : "Complete mocked billing"}
            </Button>
          </div>
        </div>

        <div className="mobile-card-primary">
          <div className="space-y-1 border-b border-slate-200 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Request summary</p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{activationState.organizationName ?? "Tenant request"}</h2>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Package</p>
              <p className="mt-1 text-sm font-medium text-slate-950">{packageDefinition?.label ?? activationState.requestedPlan ?? "Not specified"}</p>
              {packageDefinition ? <p className="mt-1 text-xs leading-5 text-slate-500">{packageDefinition.description}</p> : null}
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Current lifecycle</p>
              <p className="mt-1 text-sm font-medium text-slate-950">{activationState.lifecycleStatus ?? "Unknown"}</p>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Billing mode</p>
              <p className="mt-1 text-sm font-medium text-slate-950">{activationState.billingProvider ?? "mock-billing"}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Stripe is intentionally not wired yet. This step advances the tenant lifecycle using mocked billing only.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
