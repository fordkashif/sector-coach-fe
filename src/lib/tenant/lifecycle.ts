export type TenantLifecycleStatus =
  | "pending_review"
  | "approved_pending_billing"
  | "billing_failed"
  | "active_onboarding"
  | "active"
  | "suspended"
  | "cancelled"

export type TenantBillingStatus =
  | "pending"
  | "mocked_complete"
  | "failed"
  | "active"
  | "past_due"
  | "cancelled"

export type TenantOnboardingStep =
  | "club_profile"
  | "branding"
  | "first_team"
  | "coach_access"
  | "review"
  | "complete"

export const tenantLifecycleLabels: Record<TenantLifecycleStatus, string> = {
  pending_review: "Pending review",
  approved_pending_billing: "Approved pending billing",
  billing_failed: "Billing failed",
  active_onboarding: "Active onboarding",
  active: "Active",
  suspended: "Suspended",
  cancelled: "Cancelled",
}
