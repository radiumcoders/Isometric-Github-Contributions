"use client"

import { ContributionProfilePanel } from "@/registry/blocks/isometric-contribution-graph/contribution-profile-panel"
import type { ContributionDay } from "@/lib/contribution-data"
import type { ContributionResult } from "@/lib/github"

type ProfileAnalysisPanelProps = {
  profile: ContributionResult
  contributions: ContributionDay[]
}

export function ProfileAnalysisPanel({
  profile,
  contributions,
}: ProfileAnalysisPanelProps) {
  return (
    <ContributionProfilePanel
      profile={{
        username: profile.username,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      }}
      contributions={contributions}
      className="border-t border-emerald-100/10 pt-4"
    />
  )
}