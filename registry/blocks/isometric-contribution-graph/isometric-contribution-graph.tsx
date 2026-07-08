"use client"

import { Loader2Icon } from "lucide-react"
import dynamic from "next/dynamic"
import { type ReactNode, useCallback, useRef } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ContributionDay } from "@/lib/contribution-data"
import { cn } from "@/lib/utils"

import {
  ContributionProfilePanel,
  type ContributionProfile,
} from "./contribution-profile-panel"

const IsometricContributionScene = dynamic(
  () =>
    import("./isometric-contribution-scene").then(
      (module) => module.IsometricContributionScene
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex size-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
        <Loader2Icon className="size-6 animate-spin" />
        <p>Preparing 3D scene...</p>
      </div>
    ),
  }
)

export type IsometricContributionGraphProps = {
  data: ContributionDay[]
  className?: string
  loading?: boolean
  emptyState?: ReactNode
  profile?: ContributionProfile
  showProfilePanel?: boolean
  title?: string
  description?: string
  onCaptureReady?: (capture: () => Promise<Blob | null>) => void
}

export function IsometricContributionGraph({
  data,
  className,
  loading = false,
  emptyState,
  profile,
  showProfilePanel = false,
  title = "Isometric contribution graph",
  description = "Hover a box for daily count. Drag to rotate. Scroll to zoom.",
  onCaptureReady,
}: IsometricContributionGraphProps) {
  const captureRef = useRef<((() => Promise<Blob | null>) | null)>(null)

  const handleCaptureReady = useCallback(
    (capture: () => Promise<Blob | null>) => {
      captureRef.current = capture
      onCaptureReady?.(capture)
    },
    [onCaptureReady]
  )

  const hasData = data.length > 0

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid min-h-80 lg:min-h-112 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="relative min-h-80 bg-[#010409]">
            {loading ? (
              <div className="flex size-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-emerald-100/60">
                <Loader2Icon className="size-6 animate-spin text-emerald-300" />
                <p>Loading contribution terrain...</p>
              </div>
            ) : hasData ? (
              <IsometricContributionScene
                data={data}
                onCaptureReady={handleCaptureReady}
              />
            ) : (
              (emptyState ?? (
                <div className="flex size-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-emerald-100/60">
                  <p>No contribution data to render.</p>
                  <p className="text-xs text-emerald-100/40">
                    Pass a ContributionDay[] array to visualize activity.
                  </p>
                </div>
              ))
            )}
          </div>

          {showProfilePanel && profile && hasData ? (
            <div className="border-t p-4 lg:border-t-0 lg:border-l">
              <ContributionProfilePanel
                profile={profile}
                contributions={data}
              />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

export {
  ContributionProfilePanel,
  type ContributionProfile,
} from "./contribution-profile-panel"
export { IsometricContributionScene } from "./isometric-contribution-scene"
export {
  generateMockContributions,
  type ContributionDay,
} from "@/lib/contribution-data"