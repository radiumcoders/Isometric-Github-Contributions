import { promises as fs } from "fs"
import path from "path"

import type { ContributionResult } from "@/lib/github"

export type SearchEntry = {
  username: string
  name: string | null
  avatarUrl: string
  totalContributions: number
  searchCount: number
  lastSearchedAt: string
}

const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "search-history.json")

async function readEntries(): Promise<SearchEntry[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8")
    const parsed = JSON.parse(raw) as SearchEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return []
    }
    throw error
  }
}

async function writeEntries(entries: SearchEntry[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), "utf8")
}

export async function recordSearch(result: ContributionResult): Promise<void> {
  const entries = await readEntries()
  const now = new Date().toISOString()
  const existing = entries.find(
    (entry) => entry.username.toLowerCase() === result.username.toLowerCase()
  )

  if (existing) {
    existing.name = result.name
    existing.avatarUrl = result.avatarUrl
    existing.totalContributions = result.totalContributions
    existing.searchCount += 1
    existing.lastSearchedAt = now
  } else {
    entries.push({
      username: result.username,
      name: result.name,
      avatarUrl: result.avatarUrl,
      totalContributions: result.totalContributions,
      searchCount: 1,
      lastSearchedAt: now,
    })
  }

  await writeEntries(entries)
}

export async function getLeaderboard(limit = 10): Promise<SearchEntry[]> {
  const entries = await readEntries()
  return [...entries]
    .sort((a, b) => {
      if (b.totalContributions !== a.totalContributions) {
        return b.totalContributions - a.totalContributions
      }
      return b.searchCount - a.searchCount
    })
    .slice(0, limit)
}