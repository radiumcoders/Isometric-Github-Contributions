"use client"

import { Check, Share2 } from "lucide-react"
import Image from "next/image"
import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ContributionDay } from "@/lib/contribution-data"
import type { ContributionResult } from "@/lib/github"
import { analyzeProfile } from "@/lib/profile-analysis"

type ProfileAnalysisPanelProps = {
  profile: ContributionResult
  contributions: ContributionDay[]
  copiedShareUrl: boolean
  onShare: () => void
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-emerald-100/10 py-2 last:border-b-0">
      <span className="text-xs text-emerald-100/60">{label}</span>
      <span className="text-right text-xs font-medium text-emerald-50">
        {value}
      </span>
    </div>
  )
}

export function ProfileAnalysisPanel({
  profile,
  contributions,
  copiedShareUrl,
  onShare,
}: ProfileAnalysisPanelProps) {
  const analysis = useMemo(
    () => analyzeProfile(contributions),
    [contributions]
  )

  return (
    <div className="flex flex-col gap-4 border-t border-emerald-100/10 pt-4">
      <div className="flex items-start gap-3">
        <Image
          src={profile.avatarUrl}
          alt={`${profile.username} avatar`}
          width={48}
          height={48}
          unoptimized
          className="size-12 shrink-0 rounded-none ring-1 ring-emerald-100/20"
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-medium tracking-tight">
            @{profile.username}
          </h2>
          {profile.name ? (
            <p className="truncate text-xs text-emerald-100/70">{profile.name}</p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onShare}
            className="mt-2 h-7 rounded-none border-emerald-100/25 bg-transparent text-emerald-50 hover:bg-emerald-400/10 hover:text-emerald-50"
          >
            {copiedShareUrl ? (
              <>
                <Check data-icon="inline-start" />
                Copied
              </>
            ) : (
              <>
                <Share2 data-icon="inline-start" />
                Share
              </>
            )}
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium tracking-wide text-emerald-200/90 uppercase">
          Profile analysis
        </h3>
        <div className="mt-2">
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

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">
          {analysis.totalContributions.toLocaleString()} contributions
        </Badge>
        {analysis.peakDay ? (
          <Badge
            variant="outline"
            className="border-emerald-100/25 text-emerald-50/85"
          >
            Peak: {analysis.peakDay.count}
          </Badge>
        ) : null}
      </div>
    </div>
  )
}