import type { ContributionDay } from "@/lib/contribution-data"

const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

export type ProfileAnalysis = {
  totalContributions: number
  activeDays: number
  averagePerActiveDay: number
  averagePerWeek: number
  longestStreak: number
  currentStreak: number
  peakDay: ContributionDay | null
  busiestWeekday: string
  busiestWeekdayCount: number
  mostActiveMonth: string
  mostActiveMonthCount: number
  recentThirtyDayTotal: number
  activityRate: number
}

function formatMonthLabel(year: number, monthIndex: number): string {
  return new Date(Date.UTC(year, monthIndex, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

function computeStreaks(days: ContributionDay[]) {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))
  let longestStreak = 0
  let currentStreak = 0
  let runningStreak = 0

  for (const day of sorted) {
    if (day.count > 0) {
      runningStreak += 1
      longestStreak = Math.max(longestStreak, runningStreak)
    } else {
      runningStreak = 0
    }
  }

  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    if (sorted[index].count > 0) {
      currentStreak += 1
    } else {
      break
    }
  }

  return { longestStreak, currentStreak }
}

export function analyzeProfile(contributions: ContributionDay[]): ProfileAnalysis {
  if (contributions.length === 0) {
    return {
      totalContributions: 0,
      activeDays: 0,
      averagePerActiveDay: 0,
      averagePerWeek: 0,
      longestStreak: 0,
      currentStreak: 0,
      peakDay: null,
      busiestWeekday: "—",
      busiestWeekdayCount: 0,
      mostActiveMonth: "—",
      mostActiveMonthCount: 0,
      recentThirtyDayTotal: 0,
      activityRate: 0,
    }
  }

  const totalContributions = contributions.reduce(
    (sum, day) => sum + day.count,
    0
  )
  const activeDays = contributions.filter((day) => day.count > 0).length
  const peakDay = contributions.reduce((best, day) =>
    day.count > best.count ? day : best
  )

  const weekdayTotals = new Array<number>(7).fill(0)
  const monthTotals = new Map<string, number>()

  for (const day of contributions) {
    weekdayTotals[day.day] += day.count

    const [year, month] = day.date.split("-").map(Number)
    const monthKey = `${year}-${month}`
    monthTotals.set(monthKey, (monthTotals.get(monthKey) ?? 0) + day.count)
  }

  const busiestWeekdayIndex = weekdayTotals.reduce(
    (bestIndex, count, index, totals) =>
      count > totals[bestIndex] ? index : bestIndex,
    0
  )

  let mostActiveMonthKey = ""
  let mostActiveMonthCount = 0

  for (const [monthKey, count] of monthTotals) {
    if (count > mostActiveMonthCount) {
      mostActiveMonthKey = monthKey
      mostActiveMonthCount = count
    }
  }

  const [peakYear, peakMonth] = mostActiveMonthKey
    ? mostActiveMonthKey.split("-").map(Number)
    : [0, 0]

  const sortedDates = [...contributions].sort((a, b) =>
    b.date.localeCompare(a.date)
  )
  const recentThirtyDayTotal = sortedDates
    .slice(0, 30)
    .reduce((sum, day) => sum + day.count, 0)

  const weeks = Math.max(...contributions.map((day) => day.week), 0) + 1
  const { longestStreak, currentStreak } = computeStreaks(contributions)

  return {
    totalContributions,
    activeDays,
    averagePerActiveDay:
      activeDays > 0 ? totalContributions / activeDays : 0,
    averagePerWeek: weeks > 0 ? totalContributions / weeks : 0,
    longestStreak,
    currentStreak,
    peakDay: peakDay.count > 0 ? peakDay : null,
    busiestWeekday: WEEKDAY_LABELS[busiestWeekdayIndex] ?? "—",
    busiestWeekdayCount: weekdayTotals[busiestWeekdayIndex] ?? 0,
    mostActiveMonth:
      mostActiveMonthKey.length > 0
        ? formatMonthLabel(peakYear, peakMonth - 1)
        : "—",
    mostActiveMonthCount,
    recentThirtyDayTotal,
    activityRate:
      contributions.length > 0 ? activeDays / contributions.length : 0,
  }
}