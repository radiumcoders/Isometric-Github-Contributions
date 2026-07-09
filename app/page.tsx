import Link from "next/link"

import { ContributionGraphLoader } from "@/components/contribution-graph/contribution-graph-loader"

export default function Page() {
  return (
    <main className="h-svh overflow-hidden bg-[#010409] text-white">
      <ContributionGraphLoader />

      <Link
        href="/leetcode"
        className="pointer-events-auto fixed top-3 right-3 z-20 rounded-none border border-emerald-100/25 bg-black/70 px-3 py-2 text-xs font-medium text-emerald-50 shadow-lg shadow-black/30 backdrop-blur-sm hover:bg-emerald-400/10"
      >
        Check your leetcode here
      </Link>
    </main>
  )
}
