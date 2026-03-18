import { mockCurrentSession, type SessionBlock } from "@/lib/mock-data"

export const SESSION_PROGRESS_STORAGE_KEY = "pacelab:athlete-session-progress"

export type SessionProgress = {
  sessionId: string
  currentBlockIndex: number
  completedBlockIds: string[]
  values: Record<string, string>
  blockNotes: Record<string, string>
}

export function defaultSessionProgress(): SessionProgress {
  return {
    sessionId: mockCurrentSession.id,
    currentBlockIndex: 0,
    completedBlockIds: [],
    values: {},
    blockNotes: {},
  }
}

export function progressForCurrentSession(raw: string | null): SessionProgress {
  if (!raw) return defaultSessionProgress()
  try {
    const parsed = JSON.parse(raw) as SessionProgress
    if (parsed.sessionId !== mockCurrentSession.id) return defaultSessionProgress()
    return {
      sessionId: parsed.sessionId,
      currentBlockIndex: Math.min(Math.max(parsed.currentBlockIndex ?? 0, 0), Math.max(mockCurrentSession.blocks.length - 1, 0)),
      completedBlockIds: parsed.completedBlockIds ?? [],
      values: parsed.values ?? {},
      blockNotes: parsed.blockNotes ?? {},
    }
  } catch {
    return defaultSessionProgress()
  }
}

export function sessionRowKey(blockId: string, rowIndex: number, field: string) {
  return `${blockId}:${rowIndex}:${field}`
}

export function blockHasInputs(progress: SessionProgress, block: SessionBlock) {
  return block.rows.some((_, rowIndex) =>
    ["primary", "secondary", "effort"].some((field) => Boolean(progress.values[sessionRowKey(block.id, rowIndex, field)]?.trim())),
  )
}

export function blockStatus(progress: SessionProgress, block: SessionBlock) {
  if (progress.completedBlockIds.includes(block.id)) return "completed"
  if (blockHasInputs(progress, block)) return "in-progress"
  return "up-next"
}
