"use client"

import { Loader2 } from "lucide-react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { FormEvent, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { ContributionResult } from "@/lib/github"

const ContributionScene = dynamic(
  () =>
    import("./contribution-scene").then((module) => module.ContributionScene),
  { ssr: false }
)

export function ContributionGraph() {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ContributionResult | null>(null)

  const contributions = useMemo(
    () => profile?.data ?? [],
    [profile?.data]
  )

  const maxDay = useMemo(() => {
    if (contributions.length === 0) return null
    return contributions.reduce((best, day) =>
      day.count > best.count ? day : best
    )
  }, [contributions])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(
        `/api/contributions?user=${encodeURIComponent(input.trim())}`
      )
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load contributions.")
      }

      setProfile(payload as ContributionResult)
    } catch (fetchError) {
      setProfile(null)
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load contributions."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-5xl rounded-none">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle>Isometric Contribution Graph</CardTitle>
            <CardDescription>
              Paste a GitHub username or profile link. Each square&apos;s height
              equals that day&apos;s contribution count — zero stays flat.
            </CardDescription>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <Input
              type="text"
              placeholder="octocat or https://github.com/octocat"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={loading}
              aria-invalid={!!error}
              className="rounded-none sm:flex-1"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-none"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                  Loading
                </>
              ) : (
                "Show graph"
              )}
            </Button>
          </form>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          {profile ? (
            <div className="flex flex-wrap items-center gap-3">
              <Image
                src={profile.avatarUrl}
                alt={`${profile.username} avatar`}
                width={32}
                height={32}
                unoptimized
                className="size-8 rounded-none ring-1 ring-foreground/10"
              />
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  @{profile.username}
                  {profile.name ? ` · ${profile.name}` : ""}
                </Badge>
                <Badge variant="secondary">
                  {profile.totalContributions.toLocaleString()} contributions
                </Badge>
                {maxDay && maxDay.count > 0 ? (
                  <Badge variant="outline">
                    Peak: {maxDay.count} on {maxDay.date}
                  </Badge>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        <div className="relative h-[480px] w-full overflow-hidden rounded-none border bg-[#010409]">
          {profile ? (
            <ContributionScene key={profile.username} data={contributions} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
              <p>Enter a GitHub profile to render their contribution terrain.</p>
              <p className="text-xs">Try &quot;torvalds&quot; to start.</p>
            </div>
          )}
        </div>
        {profile ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Drag to rotate · Scroll to zoom · Height is 1 unit per contribution
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}