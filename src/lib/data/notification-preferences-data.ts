import { err, mapPostgrestError, ok, type DataError, type Result } from "@/lib/data/result"
import { getBrowserSupabaseClient } from "@/lib/supabase/client"
import { getBackendMode } from "@/lib/supabase/config"

export type NotificationChannel = "email" | "in-app"

export type NotificationPreferenceRecord = {
  channel: NotificationChannel
  eventType: string
  enabled: boolean
}

type ClientResolution =
  | { ok: true; client: NonNullable<ReturnType<typeof getBrowserSupabaseClient>> }
  | { ok: false; error: DataError }

function requireSupabaseClient(operation: string): ClientResolution {
  if (getBackendMode() !== "supabase") {
    return {
      ok: false,
      error: { code: "UNKNOWN", message: `[${operation}] backend mode is not 'supabase'.` },
    }
  }

  const client = getBrowserSupabaseClient()
  if (!client) {
    return {
      ok: false,
      error: { code: "UNKNOWN", message: `[${operation}] Supabase client is not configured.` },
    }
  }

  return { ok: true, client }
}

async function getCurrentRecipientIdentity(client: NonNullable<ReturnType<typeof getBrowserSupabaseClient>>) {
  const { data } = await client.auth.getSession()
  const session = data.session
  if (!session) return err("UNAUTHORIZED", "No authenticated session found.")

  return ok({
    userId: session.user.id,
    email: session.user.email?.trim().toLowerCase() ?? null,
  })
}

export async function getCurrentNotificationPreferences(): Promise<Result<NotificationPreferenceRecord[]>> {
  const clientResult = requireSupabaseClient("getCurrentNotificationPreferences")
  if (!clientResult.ok) return clientResult

  const identityResult = await getCurrentRecipientIdentity(clientResult.client)
  if (!identityResult.ok) return identityResult

  const { data, error } = await clientResult.client
    .from("notification_preferences")
    .select("channel, event_type, enabled")
    .or(
      [
        `user_id.eq.${identityResult.data.userId}`,
        identityResult.data.email ? `email.eq.${identityResult.data.email}` : null,
      ]
        .filter(Boolean)
        .join(","),
    )
    .order("channel", { ascending: true })
    .order("event_type", { ascending: true })

  if (error) return { ok: false, error: mapPostgrestError(error) }

  return ok(
    ((data as Array<{ channel: NotificationChannel; event_type: string; enabled: boolean }> | null) ?? []).map((row) => ({
      channel: row.channel,
      eventType: row.event_type,
      enabled: row.enabled,
    })),
  )
}

export async function upsertCurrentNotificationPreference(params: {
  channel: NotificationChannel
  eventType?: string
  enabled: boolean
}): Promise<Result<void>> {
  const clientResult = requireSupabaseClient("upsertCurrentNotificationPreference")
  if (!clientResult.ok) return clientResult

  const identityResult = await getCurrentRecipientIdentity(clientResult.client)
  if (!identityResult.ok) return identityResult
  if (!identityResult.data.email) return err("VALIDATION", "Authenticated user is missing an email address.")

  const eventType = params.eventType?.trim() || "*"
  const { data: existing, error: existingError } = await clientResult.client
    .from("notification_preferences")
    .select("id")
    .eq("user_id", identityResult.data.userId)
    .eq("channel", params.channel)
    .eq("event_type", eventType)
    .maybeSingle()

  if (existingError) return { ok: false, error: mapPostgrestError(existingError) }

  if (existing?.id) {
    const { error } = await clientResult.client
      .from("notification_preferences")
      .update({ enabled: params.enabled, email: identityResult.data.email })
      .eq("id", existing.id)

    if (error) return { ok: false, error: mapPostgrestError(error) }
    return ok(undefined)
  }

  const { error } = await clientResult.client.from("notification_preferences").insert({
    user_id: identityResult.data.userId,
    email: identityResult.data.email,
    channel: params.channel,
    event_type: eventType,
    enabled: params.enabled,
  })

  if (error) return { ok: false, error: mapPostgrestError(error) }
  return ok(undefined)
}
