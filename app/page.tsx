import { ContributionGraph } from "@/components/contribution-graph/contribution-graph"

export default function Page() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 p-6 md:p-10">
      <div className="flex max-w-5xl flex-col gap-2 text-center">
        <h1 className="font-medium text-2xl tracking-tight">
          GitHub Contributions in 3D
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Paste any GitHub username or profile link to render their contribution
          calendar as an isometric terrain — 29 contributions means 29 units tall,
          zero means flat ground.
        </p>
      </div>
      <ContributionGraph />
    </main>
  )
}