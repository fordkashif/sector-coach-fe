import { getTenantIdFromCookie } from "@/lib/auth-session"

export function tenantStorageKey(baseKey: string) {
  const tenantId = getTenantIdFromCookie() ?? "public"
  return `${baseKey}:${tenantId}`
}
