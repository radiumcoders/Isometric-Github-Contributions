"use client"

import Image from "next/image"
import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-xs font-medium">{value}</span>
    </div>
  )
}

export function ContributionProfilePanel({
  profile,
  contributions,
  className,
}: ContributionProfilePanelProps) {
  const analysis = useMemo(
    () => analyzeProfile(contributions),
    [contributions]
  )

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-start gap-3">
        <Image
          src={profile.avatarUrl}
          alt={`${profile.username} avatar`}
          width={48}
          height={48}
          unoptimized
          className="size-12 shrink-0 rounded-md ring-1 ring-border"
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-medium tracking-tight">
            @{profile.username}
          </h2>
          {profile.name ? (
            <p className="truncate text-xs text-muted-foreground">
              {profile.name}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Profile analysis
        </h3>
        <div className="mt-2 flex flex-col divide-y divide-border">
          <StatRow
            label="Total contributions"
            value={analysis.totalContributions.toLocaleString()}
          />
          <StatRow
            label="Active days"
            value={`${analysis.activeDays.toLocaleString()} (${Math.round(analysis.activityRate * 100)}%)`}
          />
          <StatRow
            label="Avg per active day"
            value={analysis.averagePerActiveDay.toFixed(1)}
          />
          <StatRow
            label="Avg per week"
            value={analysis.averagePerWeek.toFixed(1)}
          />
          <StatRow
            label="Current streak"
            value={`${analysis.currentStreak} day${analysis.currentStreak === 1 ? "" : "s"}`}
          />
          <StatRow
            label="Longest streak"
            value={`${analysis.longestStreak} day${analysis.longestStreak === 1 ? "" : "s"}`}
          />
          {analysis.peakDay ? (
            <StatRow
              label="Peak day"
              value={`${analysis.peakDay.count} on ${analysis.peakDay.date}`}
            />
          ) : null}
          <StatRow
            label="Busiest weekday"
            value={`${analysis.busiestWeekday} (${analysis.busiestWeekdayCount.toLocaleString()})`}
          />
          <StatRow
            label="Most active month"
            value={`${analysis.mostActiveMonth} (${analysis.mostActiveMonthCount.toLocaleString()})`}
          />
          <StatRow
            label="Last 30 days"
            value={analysis.recentThirtyDayTotal.toLocaleString()}
          />
        </div>
      </div>

      <Separator />

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">
          {analysis.totalContributions.toLocaleString()} contributions
        </Badge>
        {analysis.peakDay ? (
          <Badge variant="outline">Peak: {analysis.peakDay.count}</Badge>
        ) : null}
      </div>
    </div>
  )
}