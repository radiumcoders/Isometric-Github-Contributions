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

/** GitHub dark-theme contribution graph palette */
export const GITHUB_CONTRIBUTION_COLORS = [
  "#161b22",
  "#0e4429",
  "#006d32",
  "#26a641",
  "#39d353",
] as const

export function getContributionColor(count: number): string {
  if (count === 0) return GITHUB_CONTRIBUTION_COLORS[0]
  if (count <= 3) return GITHUB_CONTRIBUTION_COLORS[1]
  if (count <= 8) return GITHUB_CONTRIBUTION_COLORS[2]
  if (count <= 15) return GITHUB_CONTRIBUTION_COLORS[3]
  return GITHUB_CONTRIBUTION_COLORS[4]
}

export const GRAPH_CONFIG = {
  weeks: WEEKS,
  days: DAYS,
  cellSize: 1,
  gap: 0.12,
  heightUnit: 0.08,
} as const