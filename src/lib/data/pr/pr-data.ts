import type { SupabaseClient } from "@supabase/supabase-js"
import { err, mapPostgrestError, ok, type DataError, type Result } from "@/lib/data/result"
import type { PrRecord } from "@/lib/data/pr/types"
import { getBrowserSupabaseClient } from "@/lib/supabase/client"
import { getBackendMode } from "@/lib/supabase/config"

type ClientResolution =
  | { ok: true; client: SupabaseClient }
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

async function getCurrentAthleteId(client: SupabaseClient): Promise<Result<string>> {
  const { data: authSession } = await client.auth.getSession()
  const userId = authSession.session?.user.id
  if (!userId) return err("UNAUTHORIZED", "No authenticated Supabase session found.")

  const { data: athlete, error } = await client
    .from("athletes")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) return { ok: false, error: mapPostgrestError(error) }
  if (!athlete) return err("NOT_FOUND", "No athlete profile found for current user.")

  return ok(athlete.id as string)
}

export async function getCurrentAthletePrRecords(): Promise<Result<PrRecord[]>> {
  const clientResult = requireSupabaseClient("getCurrentAthletePrRecords")
  if (!clientResult.ok) return clientResult

  const athleteIdResult = await getCurrentAthleteId(clientResult.client)
  if (!athleteIdResult.ok) return athleteIdResult

  const { data, error } = await clientResult.client
    .from("pr_records")
    .select("id, athlete_id, event, category, best_value, previous_value, measured_on, source_type, source_ref, is_legal, wind, note")
    .eq("athlete_id", athleteIdResult.data)
    .order("measured_on", { ascending: false })

  if (error) return { ok: false, error: mapPostgrestError(error) }

  return ok(
    ((data as Array<{
      id: string
      athlete_id: string
      event: string
      category: string
      best_value: string
      previous_value: string | null
      measured_on: string
      source_type: PrRecord["sourceType"]
      source_ref: string | null
      is_legal: boolean
      wind: string | null
      note: string | null
    }> | null) ?? []).map((row) => ({
      id: row.id,
      athleteId: row.athlete_id,
      event: row.event,
      category: row.category,
      bestValue: row.best_value,
      previousValue: row.previous_value,
      measuredOn: row.measured_on,
      sourceType: row.source_type,
      sourceRef: row.source_ref,
      isLegal: row.is_legal,
      wind: row.wind,
      note: row.note,
    })),
  )
}
