import { Suspense } from "react"

import { LeetCodeGraph } from "@/components/leetcode-graph/leetcode-graph"

type LeetCodeGraphLoaderProps = {
  initialUsername?: string
}

function LeetCodeGraphFallback() {
  return (
    <section className="relative h-full w-full overflow-hidden bg-[#010409]">
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-emerald-100/60">
        <p>Loading contribution graph...</p>
      </div>
    </section>
  )
}

export function LeetCodeGraphLoader({
  initialUsername,
}: LeetCodeGraphLoaderProps) {
  return (
    <Suspense fallback={<LeetCodeGraphFallback />}>
      <LeetCodeGraph initialUsername={initialUsername} />
    </Suspense>
  )
}
