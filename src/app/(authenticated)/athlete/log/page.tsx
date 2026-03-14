"use client"

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { onSaveLog } from "@/lib/mock-data"

function saveWithMockHandler(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  onSaveLog()
}

export default function AthleteLogPage() {
  const [setRows, setSetRows] = useState([0])
  const [splitRows, setSplitRows] = useState([0])

  return (
    <div className="mx-auto w-full max-w-3xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Log Session</CardTitle>
          <CardDescription>Fast mobile entry with minimal typing.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="strength" className="space-y-4">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-transparent p-0 sm:grid-cols-5">
              <TabsTrigger value="strength">Strength</TabsTrigger>
              <TabsTrigger value="run">Run</TabsTrigger>
              <TabsTrigger value="splits">Splits</TabsTrigger>
              <TabsTrigger value="jumps">Jumps</TabsTrigger>
              <TabsTrigger value="throws">Throws</TabsTrigger>
            </TabsList>

            <TabsContent value="strength">
              <form className="space-y-4" onSubmit={saveWithMockHandler}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Exercise</Label>
                    <Select defaultValue="back-squat">
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="back-squat">Back Squat</SelectItem>
                        <SelectItem value="power-clean">Power Clean</SelectItem>
                        <SelectItem value="bench-press">Bench Press</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>RPE</Label>
                    <Input type="number" min={1} max={10} defaultValue={7} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Sets</Label>
                  <div className="space-y-2">
                    {setRows.map((row) => (
                      <div key={row} className="grid grid-cols-3 gap-2">
                        <Input type="number" placeholder="Sets" />
                        <Input type="number" placeholder="Reps" />
                        <Input type="number" placeholder="Load" />
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" onClick={() => setSetRows((prev) => [...prev, prev.length])}>
                    <HugeiconsIcon icon={Add01Icon} className="size-4" />
                    Add set
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="How did it feel?" />
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Save log
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="run">
              <form className="space-y-4" onSubmit={saveWithMockHandler}>
                <div className="space-y-2">
                  <Label>Workout type</Label>
                  <Select defaultValue="tempo">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tempo">Tempo</SelectItem>
                      <SelectItem value="interval">Interval</SelectItem>
                      <SelectItem value="time-trial">Time Trial</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Distance</Label>
                    <Input placeholder="e.g. 1200m" />
                  </div>
                  <div className="space-y-2">
                    <Label>Total time</Label>
                    <Input placeholder="e.g. 3:20" />
                  </div>
                  <div className="space-y-2">
                    <Label>RPE</Label>
                    <Input type="number" min={1} max={10} defaultValue={6} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea />
                </div>
                <Button type="submit" size="lg" className="w-full">
                  Save
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="splits">
              <form className="space-y-4" onSubmit={saveWithMockHandler}>
                <div className="space-y-2">
                  <Label>Split rows</Label>
                  {splitRows.map((row) => (
                    <div key={row} className="grid grid-cols-2 gap-2">
                      <Select defaultValue="30m">
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10m">10m</SelectItem>
                          <SelectItem value="20m">20m</SelectItem>
                          <SelectItem value="30m">30m</SelectItem>
                          <SelectItem value="60m">60m</SelectItem>
                          <SelectItem value="100m">100m</SelectItem>
                          <SelectItem value="150m">150m</SelectItem>
                          <SelectItem value="flying30">Flying 30</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="Time (s)" />
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" onClick={() => setSplitRows((prev) => [...prev, prev.length])}>
                  <HugeiconsIcon icon={Add01Icon} className="size-4" />
                  Add split row
                </Button>
                <Button type="submit" size="lg" className="w-full">
                  Save
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="jumps">
              <form className="space-y-4" onSubmit={saveWithMockHandler}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Event</Label>
                    <Select defaultValue="lj">
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lj">Long Jump</SelectItem>
                        <SelectItem value="tj">Triple Jump</SelectItem>
                        <SelectItem value="hj">High Jump</SelectItem>
                        <SelectItem value="pv">Pole Vault</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Attempt #</Label>
                    <Input type="number" defaultValue={1} min={1} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Distance / Height</Label>
                    <Input placeholder="e.g. 6.42m" />
                  </div>
                  <div className="space-y-2">
                    <Label>Wind</Label>
                    <Input placeholder="+1.2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea />
                </div>
                <Button type="submit" size="lg" className="w-full">
                  Save attempt
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="throws">
              <form className="space-y-4" onSubmit={saveWithMockHandler}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Event</Label>
                    <Select defaultValue="shot">
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shot">Shot Put</SelectItem>
                        <SelectItem value="discus">Discus</SelectItem>
                        <SelectItem value="javelin">Javelin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Implement weight</Label>
                    <Input placeholder="e.g. 7.26kg" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Attempt #</Label>
                    <Input type="number" defaultValue={1} min={1} />
                  </div>
                  <div className="space-y-2">
                    <Label>Distance</Label>
                    <Input placeholder="e.g. 16.20m" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea />
                </div>
                <Button type="submit" size="lg" className="w-full">
                  Save attempt
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
