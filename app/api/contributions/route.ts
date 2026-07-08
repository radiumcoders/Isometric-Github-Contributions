import { NextResponse } from "next/server"

import { fetchGitHubContributions, parseGitHubUsername } from "@/lib/github"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawInput = searchParams.get("user") ?? searchParams.get("username") ?? ""

  const username = parseGitHubUsername(rawInput)
  if (!username) {
    return NextResponse.json(
      { error: "Enter a valid GitHub username or profile link." },
      { status: 400 }
    )
  }

  try {
    const result = await fetchGitHubContributions(username)
    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load contributions."
    const status = message.includes("not found") ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}