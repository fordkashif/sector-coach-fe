import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface RouteScaffoldProps {
  title: string
  description: string
  route: string
  planned?: string[]
}

export function RouteScaffold({ title, description, route, planned = [] }: RouteScaffoldProps) {
  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardDescription>Scaffold</CardDescription>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <span className="font-semibold">Route:</span> {route}
          </div>
          {planned.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-semibold">Planned in next card</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {planned.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
