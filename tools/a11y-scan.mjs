import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const files = [
  "src/components/app-shell.tsx",
  "src/app/(auth)/login/page.tsx",
  "src/app/(auth)/create-club-account/page.tsx",
  "src/components/athlete/join-team-form.tsx",
  "src/app/(authenticated)/club-admin/users/page.tsx",
  "src/app/(authenticated)/club-admin/teams/page.tsx",
  "src/app/(authenticated)/club-admin/reports/page.tsx",
  "src/app/(authenticated)/club-admin/audit/page.tsx",
]

const failures = []

for (const rel of files) {
  const full = path.join(root, rel)
  const text = fs.readFileSync(full, "utf8")

  const requireHeading = rel.includes("/app/")
  if (requireHeading && !text.includes("<h1") && !text.includes("CardTitle")) {
    failures.push(`${rel}: missing heading semantics (<h1> or CardTitle)`)
  }

  const iconButtonRegex = /<Button[^>]*size="icon"[^>]*>/g
  const iconButtons = text.match(iconButtonRegex) ?? []
  for (const match of iconButtons) {
    if (!/aria-label=/.test(match)) {
      failures.push(`${rel}: icon button missing aria-label (${match.slice(0, 80)}...)`)
    }
  }

  const inputWithId = [...text.matchAll(/<Input[^>]*id="([^"]+)"[^>]*>/g)].map((item) => item[1])
  for (const id of inputWithId) {
    if (!text.includes(`htmlFor="${id}"`)) {
      failures.push(`${rel}: input id "${id}" has no matching Label htmlFor`)
    }
  }
}

if (failures.length > 0) {
  console.error("Accessibility scan failed:")
  for (const item of failures) {
    console.error(`- ${item}`)
  }
  process.exit(1)
}

console.log("Accessibility scan passed for configured routes/components.")
