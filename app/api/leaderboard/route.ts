import { NextResponse } from "next/server"

import { getLeaderboard } from "@/lib/search-history"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Number.parseInt(searchParams.get("limit") ?? "10", 10)

  try {
    const leaderboard = await getLeaderboard(
      Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 50) : 10
    )
    return NextResponse.json({ leaderboard })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load leaderboard."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}