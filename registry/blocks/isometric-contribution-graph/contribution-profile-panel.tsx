"use client"

import Image from "next/image"
import { useMemo } from "react"

import type { ContributionDay } from "@/lib/contribution-data"
import { analyzeProfile } from "@/lib/profile-analysis"
import { cn } from "@/lib/utils"

export type ContributionProfile = {
  username: string
  name?: string | null
  avatarUrl: string
}

export type ContributionProfilePanelProps = {
  profile: ContributionProfile
  contributions: ContributionDay[]
  className?: string
  variant?: "default" | "sidebar"
}

function formatPeakDate(date: string) {
  const [year, month, day] = date.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

function StatRow({
  label,
  value,
  variant,
}: {
  label: string
  value: string
  variant: "default" | "sidebar"
}) {
  const isSidebar = variant === "sidebar"

  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span
        className={cn(
          "shrink-0 text-xs",
          isSidebar ? "text-emerald-100/55" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 truncate text-right text-xs font-medium",
          isSidebar ? "text-emerald-50" : "text-foreground"
        )}
        title={value}
      >
        {value}
      </span>
    </div>
  )
}

export function ContributionProfilePanel({
  profile,
  contributions,
  className,
  variant = "default",
}: ContributionProfilePanelProps) {
  const analysis = useMemo(
    () => analyzeProfile(contributions),
    [contributions]
  )
  const isSidebar = variant === "sidebar"

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start gap-3">
        <Image
          src={profile.avatarUrl}
          alt={`${profile.username} avatar`}
          width={48}
          height={48}
          unoptimized
          className={cn(
            "size-12 shrink-0 rounded-md ring-1",
            isSidebar ? "ring-emerald-100/20" : "ring-border"
          )}
        />
        <div className="min-w-0 flex-1">
          <h2
            className={cn(
              "truncate text-sm font-medium tracking-tight",
              isSidebar ? "text-emerald-50" : "text-foreground"
            )}
          >
            @{profile.username}
          </h2>
          {profile.name ? (
            <p
              className={cn(
                "truncate text-xs",
                isSidebar ? "text-emerald-100/55" : "text-muted-foreground"
              )}
            >
              {profile.name}
            </p>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "grid grid-cols-2 gap-x-3 gap-y-1 rounded-md border p-2.5",
          isSidebar
            ? "border-emerald-100/10 bg-emerald-400/5"
            : "border-border bg-muted/30"
        )}
      >
        <StatRow
          variant={variant}
          label="Total"
          value={analysis.totalContributions.toLocaleString()}
        />
        <StatRow
          variant={variant}
          label="Active days"
          value={`${analysis.activeDays.toLocaleString()} (${Math.round(analysis.activityRate * 100)}%)`}
        />
        <StatRow
          variant={variant}
          label="Avg / active day"
          value={analysis.averagePerActiveDay.toFixed(1)}
        />
        <StatRow
          variant={variant}
          label="Avg / week"
          value={analysis.averagePerWeek.toFixed(1)}
        />
        <StatRow
          variant={variant}
          label="Current streak"
          value={`${analysis.currentStreak}d`}
        />
        <StatRow
          variant={variant}
          label="Longest streak"
          value={`${analysis.longestStreak}d`}
        />
        {analysis.peakDay ? (
          <StatRow
            variant={variant}
            label="Peak day"
            value={`${analysis.peakDay.count} · ${formatPeakDate(analysis.peakDay.date)}`}
          />
        ) : null}
        <StatRow
          variant={variant}
          label="Busiest weekday"
          value={`${analysis.busiestWeekday.slice(0, 3)} · ${analysis.busiestWeekdayCount.toLocaleString()}`}
        />
        <StatRow
          variant={variant}
          label="Top month"
          value={`${analysis.mostActiveMonth.split(" ")[0]} · ${analysis.mostActiveMonthCount.toLocaleString()}`}
        />
        <StatRow
          variant={variant}
          label="Last 30 days"
          value={analysis.recentThirtyDayTotal.toLocaleString()}
        />
      </div>
    </div>
  )
}