"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { tenantStorageKey } from "@/lib/tenant-storage"
import { mockPRs } from "@/lib/mock-data"

const categories = ["All", "Sprint", "Mid", "Distance", "Jumps", "Throws", "Strength"] as const
type Category = (typeof categories)[number]
const PR_OVERRIDE_STORAGE_KEY = "pacelab:pr-overrides"

export default function AthletePrsPage() {
  const [category, setCategory] = useState<Category>("All")
  const [overrides] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {}
    const raw = window.localStorage.getItem(tenantStorageKey(PR_OVERRIDE_STORAGE_KEY))
    if (!raw) return {}
    try {
      return JSON.parse(raw) as Record<string, string>
    } catch {
      return {}
    }
  })

  const prs = useMemo(() => {
    const source = category === "All" ? mockPRs : mockPRs.filter((pr) => pr.category === category)
    return source.map((pr) => {
      const overrideValue = overrides[pr.event]
      if (!overrideValue || overrideValue === pr.bestValue) return pr
      return {
        ...pr,
        previousValue: pr.bestValue,
        bestValue: overrideValue,
      }
    })
  }, [category, overrides])

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>My PRs</CardTitle>
            <CardDescription>Track your best marks across categories.</CardDescription>
          </div>
          <Select value={category} onValueChange={(value) => setCategory(value as Category)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {prs.map((pr) => (
            <div key={pr.id} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{pr.event}</p>
                <Badge variant="secondary">{pr.category}</Badge>
              </div>
              <p className="text-lg font-semibold">{pr.bestValue}</p>
              {pr.previousValue ? (
                <p className="text-xs text-muted-foreground">Auto-updated from {pr.previousValue}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">{pr.date}</p>
              <Badge variant={pr.legal ? "secondary" : "destructive"}>
                {pr.wind ? `Legal (${pr.wind})` : pr.legal ? "Legal" : "Wind assisted"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
