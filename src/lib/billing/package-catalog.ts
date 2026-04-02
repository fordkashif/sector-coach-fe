export type PackageId = "starter" | "pro" | "enterprise"

export type PackageDefinition = {
  id: PackageId
  label: string
  description: string
  limits: {
    teams: number
    coaches: number
    athletes: number
  }
}

export const packageCatalog: Record<PackageId, PackageDefinition> = {
  starter: {
    id: "starter",
    label: "Starter",
    description: "Single-team launch for smaller clubs getting into digital planning and testing.",
    limits: {
      teams: 1,
      coaches: 3,
      athletes: 40,
    },
  },
  pro: {
    id: "pro",
    label: "Pro",
    description: "Multi-coach operating package for growing clubs with broader athlete management needs.",
    limits: {
      teams: 5,
      coaches: 10,
      athletes: 150,
    },
  },
  enterprise: {
    id: "enterprise",
    label: "Enterprise",
    description: "Multi-program rollout with provisioning, oversight, and support expectations.",
    limits: {
      teams: Number.POSITIVE_INFINITY,
      coaches: Number.POSITIVE_INFINITY,
      athletes: Number.POSITIVE_INFINITY,
    },
  },
}

export const packageOptions = Object.values(packageCatalog)

export function getPackageById(packageId: PackageId | string | null | undefined) {
  if (!packageId) return null
  return packageCatalog[packageId as PackageId] ?? null
}

export function doesPackageFitRollout(params: {
  packageId: PackageId
  coachCount: number
  athleteCount: number
}) {
  const definition = packageCatalog[params.packageId]
  return {
    fitsCoaches: params.coachCount <= definition.limits.coaches,
    fitsAthletes: params.athleteCount <= definition.limits.athletes,
    fits: params.coachCount <= definition.limits.coaches && params.athleteCount <= definition.limits.athletes,
  }
}

export function getRecommendedPackage(coachCount: number, athleteCount: number): PackageId {
  for (const packageId of ["starter", "pro", "enterprise"] as const) {
    const fit = doesPackageFitRollout({
      packageId,
      coachCount,
      athleteCount,
    })
    if (fit.fits) return packageId
  }

  return "enterprise"
}

export function getNextPackageTier(packageId: PackageId | null | undefined): PackageId | null {
  if (packageId === "starter") return "pro"
  if (packageId === "pro") return "enterprise"
  return null
}
