import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function InvalidEntityPage({
  title,
  description,
  backTo,
}: {
  title: string
  description: string
  backTo: string
}) {
  return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to={backTo}>Go back</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
