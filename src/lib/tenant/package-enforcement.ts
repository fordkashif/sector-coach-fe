import type { SupabaseClient } from "@supabase/supabase-js"
import { getPackageById, type PackageDefinition, type PackageId } from "@/lib/billing/package-catalog"
import { err, mapPostgrestError, ok, type Result } from "@/lib/data/result"

export type TenantPackageUsage = {
  packageId: PackageId | null
  packageDefinition: PackageDefinition | null
  usage: {
    teams: number
    coaches: number
    athletes: number
  }
}

export async function getTenantPackageUsage(
  client: SupabaseClient,
  tenantId: string,
): Promise<Result<TenantPackageUsage>> {
  const [requestResult, teamsResult, coachesResult, athletesResult] = await Promise.all([
    client
      .from("tenant_provision_requests")
      .select("requested_plan")
      .eq("provisioned_tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client.from("teams").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).neq("status", "archived"),
    client
      .from("profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("role", "coach")
      .eq("is_active", true),
    client.from("athletes").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
  ])

  if (requestResult.error) return { ok: false, error: mapPostgrestError(requestResult.error) }
  if (teamsResult.error) return { ok: false, error: mapPostgrestError(teamsResult.error) }
  if (coachesResult.error) return { ok: false, error: mapPostgrestError(coachesResult.error) }
  if (athletesResult.error) return { ok: false, error: mapPostgrestError(athletesResult.error) }

  const packageId = (requestResult.data?.requested_plan as PackageId | null | undefined) ?? null
  return ok({
    packageId,
    packageDefinition: getPackageById(packageId),
    usage: {
      teams: teamsResult.count ?? 0,
      coaches: coachesResult.count ?? 0,
      athletes: athletesResult.count ?? 0,
    },
  })
}

export function buildPackageLimitError(params: {
  packageDefinition: PackageDefinition
  resourceLabel: "teams" | "coaches" | "athletes"
}) {
  const limit = params.packageDefinition.limits[params.resourceLabel]
  if (!Number.isFinite(limit)) {
    return err("UNKNOWN", "This package does not define a limit for the requested resource.")
  }

  const resourceName =
    params.resourceLabel === "teams" ? "team" : params.resourceLabel === "coaches" ? "coach" : "athlete"

  return err(
    "VALIDATION",
    `${params.packageDefinition.label} allows up to ${limit} ${resourceName}${limit === 1 ? "" : "s"}. Upgrade the package before adding more ${params.resourceLabel}.`,
  )
}
