import { getCookieValue, ROLE_COOKIE, SESSION_COOKIE, TENANT_COOKIE } from "@/lib/auth-session"
import type { AppRole } from "@/lib/supabase/actor"
import { getBackendMode } from "@/lib/supabase/config"
import { getBrowserSupabaseClient } from "@/lib/supabase/client"
import { resolveSessionActor } from "@/lib/supabase/actor"

export type GuardAuthContext = {
  isAuthenticated: boolean
  role: AppRole | null
  tenantId: string | null
  clubAdminOnboardingComplete: boolean
}

function isAppRole(value: unknown): value is AppRole {
  return value === "athlete" || value === "coach" || value === "club-admin" || value === "platform-admin"
}

function getRoleFromCookie() {
  const role = getCookieValue(ROLE_COOKIE)
  return isAppRole(role) ? role : null
}

async function getMockGuardAuthContext(): Promise<GuardAuthContext> {
  return {
    isAuthenticated: Boolean(getCookieValue(SESSION_COOKIE)),
    role: getRoleFromCookie(),
    tenantId: getCookieValue(TENANT_COOKIE),
    clubAdminOnboardingComplete: true,
  }
}

async function getSupabaseGuardAuthContext(): Promise<GuardAuthContext> {
  const supabase = getBrowserSupabaseClient()
  if (!supabase) {
    return {
      isAuthenticated: false,
      role: null,
      tenantId: null,
      clubAdminOnboardingComplete: true,
    }
  }

  const { data } = await supabase.auth.getSession()
  const session = data.session
  if (!session) {
    return {
      isAuthenticated: false,
      role: null,
      tenantId: null,
      clubAdminOnboardingComplete: true,
    }
  }

  const actor = await resolveSessionActor(supabase, session)
  if (!actor || !isAppRole(actor.role)) {
    return {
      isAuthenticated: true,
      role: null,
      tenantId: null,
      clubAdminOnboardingComplete: true,
    }
  }

  let clubAdminOnboardingComplete = true
  if (actor.role === "club-admin" && actor.tenantId) {
    const onboardingResult = await supabase
      .from("club_profiles")
      .select("password_set_at, onboarding_completed_at")
      .eq("tenant_id", actor.tenantId)
      .maybeSingle()

    if (!onboardingResult.error) {
      const row = onboardingResult.data as {
        password_set_at: string | null
        onboarding_completed_at: string | null
      } | null

      clubAdminOnboardingComplete = Boolean(row?.password_set_at && row?.onboarding_completed_at)
    }
  }

  return {
    isAuthenticated: true,
    role: actor.role,
    tenantId: actor.tenantId,
    clubAdminOnboardingComplete,
  }
}

export async function getCurrentGuardAuthContext(): Promise<GuardAuthContext> {
  return getBackendMode() === "supabase" ? getSupabaseGuardAuthContext() : getMockGuardAuthContext()
}
