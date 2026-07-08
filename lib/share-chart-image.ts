export type ChartImageExportResult = "downloaded-copied" | "downloaded"

export async function exportChartImage(
  blob: Blob,
  username: string
): Promise<ChartImageExportResult> {
  const filename = `${username}-contributions.png`

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)

  try {
    if (
      typeof navigator.clipboard?.write === "function" &&
      typeof ClipboardItem !== "undefined"
    ) {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ])
      return "downloaded-copied"
    }
  } catch {
    // Clipboard copy is best-effort; download already succeeded.
  }

  return "downloaded"
}