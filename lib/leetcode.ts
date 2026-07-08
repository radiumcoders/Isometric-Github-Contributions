import type { ContributionDay } from "@/lib/contribution-data"
import { GRAPH_CONFIG } from "@/lib/contribution-data"

const USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]{0,23})$/

type LeetCodeCalendar = {
  submissionCalendar: string
}

type LeetCodeProfile = {
  realName: string | null
  userAvatar: string
}

type LeetCodeMatchedUser = {
  username: string
  profile: LeetCodeProfile
  currentYearCalendar: LeetCodeCalendar | null
  previousYearCalendar: LeetCodeCalendar | null
}

type LeetCodeGraphQLResponse = {
  data?: {
    matchedUser?: LeetCodeMatchedUser | null
  }
  errors?: { message: string }[]
}

export type LeetCodeResult = {
  username: string
  name: string | null
  avatarUrl: string
  totalContributions: number
  data: ContributionDay[]
}

export function parseLeetCodeUsername(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  if (USERNAME_RE.test(trimmed)) return trimmed

  try {
    const withProtocol = trimmed.startsWith("http")
      ? trimmed
      : `https://${trimmed}`
    const url = new URL(withProtocol)

    if (url.hostname !== "leetcode.com" && url.hostname !== "www.leetcode.com") {
      return null
    }

    const segments = url.pathname.split("/").filter(Boolean)
    const [first, second] = segments

    const reserved = new Set([
      "problems",
      "contest",
      "discuss",
      "explore",
      "study-plan",
      "u",
      "profile",
      "circle",
    ])

    let candidate = first
    if (first === "u" && second) {
      candidate = second
    } else if (first && reserved.has(first.toLowerCase()) && first !== "u") {
      return null
    }

    if (!candidate) return null
    return USERNAME_RE.test(candidate) ? candidate : null
  } catch {
    return null
  }
}

function startOfWeek(date: Date): Date {
  const normalized = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
  normalized.setUTCDate(normalized.getUTCDate() - normalized.getUTCDay())
  return normalized
}

function parseSubmissionCalendar(raw: string | undefined): Map<string, number> {
  const counts = new Map<string, number>()
  if (!raw) return counts

  try {
    const parsed = JSON.parse(raw) as Record<string, number>
    for (const [timestamp, count] of Object.entries(parsed)) {
      const date = new Date(Number.parseInt(timestamp, 10) * 1000)
      const dateKey = date.toISOString().split("T")[0]
      counts.set(dateKey, (counts.get(dateKey) ?? 0) + count)
    }
  } catch {
    // Ignore malformed calendar payloads; the grid will simply show zeros.
  }

  return counts
}

function buildContributionGrid(counts: Map<string, number>): ContributionDay[] {
  const { weeks, days } = GRAPH_CONFIG
  const today = new Date()
  const todayUTC = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  )
  const todayKey = todayUTC.toISOString().split("T")[0]

  const currentWeekStart = startOfWeek(todayUTC)
  const gridStart = new Date(currentWeekStart)
  gridStart.setUTCDate(gridStart.getUTCDate() - (weeks - 1) * 7)

  const contributions: ContributionDay[] = []

  for (let week = 0; week < weeks; week++) {
    for (let day = 0; day < days; day++) {
      const date = new Date(gridStart)
      date.setUTCDate(date.getUTCDate() + week * 7 + day)
      const dateKey = date.toISOString().split("T")[0]

      // Skip dates beyond today so the grid never pads in future zero-count
      // days, which would otherwise reset streak calculations to 0.
      if (dateKey > todayKey) continue

      contributions.push({
        date: dateKey,
        count: counts.get(dateKey) ?? 0,
        week,
        day,
      })
    }
  }

  return contributions
}

async function fetchLeetCodeGraphQL(
  username: string
): Promise<LeetCodeMatchedUser | null> {
  const currentYear = new Date().getUTCFullYear()
  const previousYear = currentYear - 1

  const query = `
    query userProfileCalendar($username: String!, $currentYear: Int!, $previousYear: Int!) {
      matchedUser(username: $username) {
        username
        profile {
          realName
          userAvatar
        }
        currentYearCalendar: userCalendar(year: $currentYear) {
          submissionCalendar
        }
        previousYearCalendar: userCalendar(year: $previousYear) {
          submissionCalendar
        }
      }
    }
  `

  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Referer: "https://leetcode.com",
    },
    body: JSON.stringify({
      query,
      variables: { username, currentYear, previousYear },
    }),
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    throw new Error("Failed to reach LeetCode's API.")
  }

  const payload = (await response.json()) as LeetCodeGraphQLResponse

  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? "LeetCode API error")
  }

  return payload.data?.matchedUser ?? null
}

export async function fetchLeetCodeContributions(
  username: string
): Promise<LeetCodeResult> {
  const user = await fetchLeetCodeGraphQL(username)

  if (!user) {
    throw new Error(`User "${username}" was not found on LeetCode.`)
  }

  const counts = new Map<string, number>()
  for (const [key, value] of parseSubmissionCalendar(
    user.previousYearCalendar?.submissionCalendar
  )) {
    counts.set(key, value)
  }
  for (const [key, value] of parseSubmissionCalendar(
    user.currentYearCalendar?.submissionCalendar
  )) {
    counts.set(key, value)
  }

  const data = buildContributionGrid(counts)
  const totalContributions = data.reduce((sum, day) => sum + day.count, 0)

  return {
    username: user.username,
    name: user.profile?.realName?.trim() ? user.profile.realName : null,
    avatarUrl: user.profile?.userAvatar ?? "",
    totalContributions,
    data,
  }
}
