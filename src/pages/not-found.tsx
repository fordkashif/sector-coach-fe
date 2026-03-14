import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl items-center p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Page not found</CardTitle>
          <CardDescription>The requested route does not exist in the PaceLab app.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
