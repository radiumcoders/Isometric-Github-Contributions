"use client"

import { Loader2 } from "lucide-react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { FormEvent, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

  const contributions = useMemo(() => profile?.data ?? [], [profile?.data])

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
    <section className="relative h-full w-full overflow-hidden bg-[#010409]">
      <div className="absolute inset-0">
        {profile ? (
          <ContributionScene key={profile.username} data={contributions} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-emerald-100/60">
            <p>Enter a GitHub profile to render their contribution terrain.</p>
            <p className="text-xs text-emerald-100/40">
              Try &quot;torvalds&quot; to start.
            </p>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3 sm:p-4">
        <div className="pointer-events-auto flex w-full max-w-xl flex-col gap-3 border border-emerald-300/15 bg-black/45 p-3 text-white shadow-2xl shadow-black/30 backdrop-blur-sm">
          <div>
            <h1 className="text-base font-medium tracking-tight sm:text-lg">
              Isometric Contribution Graph
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-emerald-100/65 sm:text-sm">
              Paste a GitHub username or profile link. Each square&apos;s height
              equals that day&apos;s contribution count.
            </p>
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
              className="h-9 rounded-none border-emerald-100/20 bg-white/95 text-black placeholder:text-black/50 sm:flex-1"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-9 rounded-none bg-emerald-400 text-black hover:bg-emerald-300"
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
            <p className="text-sm text-red-300">{error}</p>
          ) : null}

          {profile ? (
            <div className="flex flex-wrap items-center gap-3">
              <Image
                src={profile.avatarUrl}
                alt={`${profile.username} avatar`}
                width={32}
                height={32}
                unoptimized
                className="size-8 rounded-none ring-1 ring-emerald-100/20"
              />
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  @{profile.username}
                  {profile.name ? ` - ${profile.name}` : ""}
                </Badge>
                <Badge variant="secondary">
                  {profile.totalContributions.toLocaleString()} contributions
                </Badge>
                {maxDay && maxDay.count > 0 ? (
                  <Badge variant="outline" className="border-white/30">
                    Peak: {maxDay.count} on {maxDay.date}
                  </Badge>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {profile ? (
          <p className="pointer-events-auto mt-2 max-w-xl text-xs text-emerald-100/55">
            Drag to rotate - Scroll to zoom - Height is 1 unit per contribution
          </p>
        ) : null}
      </div>
    </section>
  )
}
