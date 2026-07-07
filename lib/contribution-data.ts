export type ContributionDay = {
  date: string
  count: number
  week: number
  day: number
}

const WEEKS = 53
const DAYS = 7

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function generateMockContributions(): ContributionDay[] {
  const today = new Date()
  const contributions: ContributionDay[] = []

  for (let week = WEEKS - 1; week >= 0; week--) {
    for (let day = 0; day < DAYS; day++) {
      const date = new Date(today)
      date.setDate(today.getDate() - (WEEKS - 1 - week) * 7 - (6 - day))

      const seed = week * 7 + day
      const roll = seededRandom(seed)

      let count = 0
      if (roll > 0.25) count = Math.floor(roll * 6)
      if (roll > 0.92) count = Math.floor(roll * 35)
      if (week === 20 && day === 3) count = 29

      contributions.push({
        date: date.toISOString().split("T")[0],
        count,
        week,
        day,
      })
    }
  }

  return contributions
}

// GitHub contribution calendar colors, sampled from github.com dark theme on 2026-07-07.
export const GITHUB_CONTRIBUTION_COLORS = [
  "#151b23",
  "#033a16",
  "#196c2e",
  "#2ea043",
  "#56d364",
] as const

export function getContributionLevel(count: number, maxCount = 0): number {
  if (count <= 0 || maxCount <= 0) return 0

  const intensity = Math.sqrt(count / maxCount)
  if (intensity <= 0.25) return 1
  if (intensity <= 0.5) return 2
  if (intensity <= 0.75) return 3
  return 4
}

export function getContributionColor(count: number, maxCount = 0): string {
  return GITHUB_CONTRIBUTION_COLORS[getContributionLevel(count, maxCount)]
}

export const GRAPH_CONFIG = {
  weeks: WEEKS,
  days: DAYS,
  cellSize: 1,
  gap: 0.12,
  heightUnit: 0.08,
} as const
