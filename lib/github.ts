import type { ContributionDay } from "@/lib/contribution-data"

const WEEKDAY_MAP: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
}

const USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/

type GitHubContributionDay = {
  contributionCount: number
  date: string
  weekday: number | string
}

type GitHubWeek = {
  contributionDays: GitHubContributionDay[]
}

type GitHubContributionsResponse = {
  data?: {
    user?: {
      login: string
      name: string | null
      avatarUrl: string
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number
          weeks: GitHubWeek[]
        }
      }
    } | null
  }
  errors?: { message: string }[]
}

export type ContributionResult = {
  username: string
  name: string | null
  avatarUrl: string
  totalContributions: number
  data: ContributionDay[]
}

export function parseGitHubUsername(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  if (USERNAME_RE.test(trimmed)) return trimmed

  try {
    const withProtocol = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
    const url = new URL(withProtocol)

    if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
      return null
    }

    const [segment] = url.pathname.split("/").filter(Boolean)
    if (!segment) return null

    const reserved = new Set([
      "orgs",
      "organizations",
      "settings",
      "login",
      "signup",
      "marketplace",
      "explore",
      "topics",
      "collections",
      "events",
      "sponsors",
    ])

    if (reserved.has(segment.toLowerCase())) return null
    return USERNAME_RE.test(segment) ? segment : null
  } catch {
    return null
  }
}

function parseCountFromTooltip(text: string): number {
  if (text.toLowerCase().includes("no contributions")) return 0

  const match = text.match(/([\d,]+)\s+contributions?\s+on/i)
  return match ? Number.parseInt(match[1].replace(/,/g, ""), 10) : 0
}

function dayFromDate(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay()
}

function resolveDayIndex(weekday: number | string, date: string): number {
  if (typeof weekday === "number" && weekday >= 0 && weekday <= 6) {
    return weekday
  }

  if (typeof weekday === "string") {
    const mapped = WEEKDAY_MAP[weekday.toUpperCase()]
    if (mapped !== undefined) return mapped
  }

  return dayFromDate(date)
}

function dedupeContributionDays(days: ContributionDay[]): ContributionDay[] {
  const byDate = new Map<string, ContributionDay>()

  for (const day of days) {
    const existing = byDate.get(day.date)
    if (!existing || day.count > existing.count) {
      byDate.set(day.date, day)
    }
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

function transformGraphQLWeeks(weeks: GitHubWeek[]): ContributionDay[] {
  const days: ContributionDay[] = []

  weeks.forEach((week, weekIndex) => {
    week.contributionDays.forEach((day) => {
      days.push({
        date: day.date,
        count: day.contributionCount,
        week: weekIndex,
        day: resolveDayIndex(day.weekday, day.date),
      })
    })
  })

  return dedupeContributionDays(days)
}

async function fetchContributionsFromHtml(
  username: string
): Promise<ContributionResult> {
  const response = await fetch(
    `https://github.com/users/${username}/contributions`,
    {
      headers: {
        Accept: "text/html",
        "User-Agent": "iso-git-contri",
      },
      next: { revalidate: 3600 },
    }
  )

  if (response.status === 404) {
    throw new Error(`User "${username}" was not found on GitHub.`)
  }

  if (!response.ok) {
    throw new Error("Failed to load contributions from GitHub.")
  }

  const html = await response.text()

  if (!html.includes("ContributionCalendar-grid")) {
    throw new Error(`User "${username}" was not found on GitHub.`)
  }

  const totalMatch = html.match(
    /id="js-contribution-activity-description"[\s\S]*?([\d,]+)\s+contributions/i
  )
  const totalContributions = totalMatch
    ? Number.parseInt(totalMatch[1].replace(/,/g, ""), 10)
    : 0

  const tooltips = new Map<string, string>()
  const tooltipRegex =
    /for="contribution-day-component-(\d+)-(\d+)"[^>]*>([^<]+)<\/tool-tip>/g

  for (const match of html.matchAll(tooltipRegex)) {
    tooltips.set(`${match[1]}-${match[2]}`, match[3].trim())
  }

  const data: ContributionDay[] = []
  const cellRegex =
    /<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="contribution-day-component-(\d+)-(\d+)"/g

  for (const match of html.matchAll(cellRegex)) {
    const date = match[1]
    const day = Number.parseInt(match[2], 10)
    const week = Number.parseInt(match[3], 10)
    const tooltip = tooltips.get(`${day}-${week}`) ?? ""
    data.push({
      week,
      day,
      date,
      count: parseCountFromTooltip(tooltip),
    })
  }

  return {
    username,
    name: null,
    avatarUrl: `https://github.com/${username}.png`,
    totalContributions,
    data: dedupeContributionDays(data),
  }
}

async function fetchContributionsFromGraphQL(
  username: string,
  token: string
): Promise<ContributionResult> {
  const query = `
    query ($username: String!) {
      user(login: $username) {
        login
        name
        avatarUrl
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
                weekday
              }
            }
          }
        }
      }
    }
  `

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "iso-git-contri",
    },
    body: JSON.stringify({ query, variables: { username } }),
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    throw new Error("Failed to reach GitHub GraphQL API.")
  }

  const payload = (await response.json()) as GitHubContributionsResponse

  if (payload.errors?.length) {
    const message = payload.errors[0]?.message ?? "GitHub API error"
    if (message.toLowerCase().includes("could not resolve")) {
      throw new Error(`User "${username}" was not found on GitHub.`)
    }
    throw new Error(message)
  }

  const user = payload.data?.user
  if (!user) {
    throw new Error(`User "${username}" was not found on GitHub.`)
  }

  const calendar = user.contributionsCollection.contributionCalendar

  return {
    username: user.login,
    name: user.name,
    avatarUrl: user.avatarUrl,
    totalContributions: calendar.totalContributions,
    data: transformGraphQLWeeks(calendar.weeks),
  }
}

export async function fetchGitHubContributions(
  username: string
): Promise<ContributionResult> {
  const token = process.env.GITHUB_TOKEN

  if (token) {
    try {
      return await fetchContributionsFromGraphQL(username, token)
    } catch {
      return fetchContributionsFromHtml(username)
    }
  }

  return fetchContributionsFromHtml(username)
}