import { Spinner } from "@/components/ui/spinner"

export default function AuthenticatedLoading() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <Spinner className="size-6" />
      <span className="ml-2 text-sm text-muted-foreground">Loading workspace...</span>
    </div>
  )
}
