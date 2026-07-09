import { NextResponse } from "next/server"

import { fetchLeetCodeContributions, parseLeetCodeUsername } from "@/lib/leetcode"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawInput = searchParams.get("user") ?? searchParams.get("username") ?? ""

  const username = parseLeetCodeUsername(rawInput)
  if (!username) {
    return NextResponse.json(
      { error: "Enter a valid LeetCode username or profile link." },
      { status: 400 }
    )
  }

  try {
    const result = await fetchLeetCodeContributions(username)
    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load contributions."
    const status = message.includes("not found") ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
