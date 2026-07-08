import { LeetCodeGraphLoader } from "@/components/leetcode-graph/leetcode-graph-loader"
import { parseLeetCodeUsername } from "@/lib/leetcode"
import { notFound } from "next/navigation"

type LeetCodeUserPageProps = {
  params: Promise<{ username: string }>
}

export default async function LeetCodeUserPage({
  params,
}: LeetCodeUserPageProps) {
  const { username } = await params
  const parsed = parseLeetCodeUsername(username)

  if (!parsed) {
    notFound()
  }

  return (
    <main className="h-svh overflow-hidden bg-[#010409] text-white">
      <LeetCodeGraphLoader initialUsername={parsed} />
    </main>
  )
}
