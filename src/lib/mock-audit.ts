import { tenantStorageKey } from "@/lib/tenant-storage"

export interface AuditEvent {
  id: string
  at: string
  actor: string
  action: string
  target: string
  detail?: string
}

export const AUDIT_LOGS_KEY = "pacelab:audit-logs"

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadAuditLogs(): AuditEvent[] {
  if (typeof window === "undefined") return []
  return safeParse(window.localStorage.getItem(tenantStorageKey(AUDIT_LOGS_KEY)), [])
}

export function saveAuditLogs(events: AuditEvent[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(tenantStorageKey(AUDIT_LOGS_KEY), JSON.stringify(events))
}

export function logAuditEvent(input: Omit<AuditEvent, "id" | "at">) {
  if (typeof window === "undefined") return
  const current = loadAuditLogs()
  const next: AuditEvent = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    at: new Date().toISOString(),
    ...input,
  }
  saveAuditLogs([next, ...current].slice(0, 500))
}
