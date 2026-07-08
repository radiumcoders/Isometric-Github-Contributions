import { ContributionGraphLoader } from "@/components/contribution-graph/contribution-graph-loader"
import { parseGitHubUsername } from "@/lib/github"
import { notFound } from "next/navigation"

type UserPageProps = {
  params: Promise<{ username: string }>
}

export default async function UserPage({ params }: UserPageProps) {
  const { username } = await params
  const parsed = parseGitHubUsername(username)

  if (!parsed) {
    notFound()
  }

  return (
    <main className="h-svh overflow-hidden bg-[#010409] text-white">
      <ContributionGraphLoader initialUsername={parsed} />
    </main>
  )
}