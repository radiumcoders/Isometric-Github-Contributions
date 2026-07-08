export type ChartImageShareResult = "shared" | "downloaded"

export async function shareChartImage(
  blob: Blob,
  username: string
): Promise<ChartImageShareResult> {
  const filename = `${username}-contributions.png`
  const file = new File([blob], filename, { type: "image/png" })

  if (
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({
      title: `${username} GitHub contributions`,
      text: `Isometric contribution graph for @${username}`,
      files: [file],
    })
    return "shared"
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
  return "downloaded"
}