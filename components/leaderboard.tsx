"use client"

import { Trophy } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

import type { SearchEntry } from "@/lib/search-history"

type LeaderboardProps = {
  refreshKey?: number
}

export function Leaderboard({ refreshKey = 0 }: LeaderboardProps) {
  const [entries, setEntries] = useState<SearchEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function loadLeaderboard() {
      try {
        const response = await fetch("/api/leaderboard?limit=10")
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load leaderboard.")
        }

        if (!cancelled) {
          setEntries(payload.leaderboard ?? [])
        }
      } catch {
        if (!cancelled) {
          setEntries([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadLeaderboard()

    return () => {
      cancelled = true
    }
  }, [refreshKey])

  if (loading) {
    return (
      <div className="pointer-events-auto border border-emerald-300/15 bg-black/45 p-3 text-white shadow-2xl shadow-black/30 backdrop-blur-sm">
        <p className="text-xs text-emerald-100/55">Loading leaderboard...</p>
      </div>
    )
  }

  if (entries.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-auto border border-emerald-300/15 bg-black/45 p-3 text-white shadow-2xl shadow-black/30 backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-2">
        <Trophy className="size-4 text-emerald-300" />
        <h2 className="text-sm font-medium tracking-tight">Top contributors</h2>
      </div>
      <p className="mb-3 text-xs text-emerald-100/55">
        Most commits among searched profiles
      </p>
      <ol className="space-y-2">
        {entries.map((entry, index) => (
          <li key={entry.username}>
            <Link
              href={`/${entry.username}`}
              className="flex items-center gap-2 rounded-none border border-transparent px-1 py-1 transition-colors hover:border-emerald-300/20 hover:bg-emerald-400/5"
            >
              <span className="w-5 shrink-0 text-xs tabular-nums text-emerald-100/45">
                {index + 1}
              </span>
              <Image
                src={entry.avatarUrl}
                alt={`${entry.username} avatar`}
                width={24}
                height={24}
                unoptimized
                className="size-6 shrink-0 rounded-none ring-1 ring-emerald-100/20"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">@{entry.username}</p>
                {entry.name ? (
                  <p className="truncate text-xs text-emerald-100/50">
                    {entry.name}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 text-xs tabular-nums text-emerald-200/80">
                {entry.totalContributions.toLocaleString()}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}