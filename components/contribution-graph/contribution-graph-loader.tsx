import { Suspense } from "react"

import { ContributionGraph } from "@/components/contribution-graph/contribution-graph"

type ContributionGraphLoaderProps = {
  initialUsername?: string
}

function ContributionGraphFallback() {
  return (
    <section className="relative h-full w-full overflow-hidden bg-[#010409]">
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-emerald-100/60">
        <p>Loading contribution graph...</p>
      </div>
    </section>
  )
}

export function ContributionGraphLoader({
  initialUsername,
}: ContributionGraphLoaderProps) {
  return (
    <Suspense fallback={<ContributionGraphFallback />}>
      <ContributionGraph initialUsername={initialUsername} />
    </Suspense>
  )
}