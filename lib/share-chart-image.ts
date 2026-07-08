import type { ContributionDay } from "@/lib/contribution-data"
import type { ContributionResult } from "@/lib/github"
import { analyzeProfile } from "@/lib/profile-analysis"

export type ChartImageExportResult = "downloaded-copied" | "downloaded"

const WATERMARK_TEXT = "Powered by IGC · radiumcoders.com"
const WATERMARK_HEIGHT = 36
const ANALYTICS_PANEL_WIDTH = 300
const BACKGROUND = "#010409"
const TEXT_PRIMARY = "rgba(236, 253, 245, 0.95)"
const TEXT_MUTED = "rgba(167, 243, 208, 0.6)"
const BORDER = "rgba(167, 243, 208, 0.15)"

type BuildChartImageOptions = {
  chartBlob: Blob
  profile: ContributionResult
  contributions: ContributionDay[]
  includeAnalytics: boolean
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to read chart image."))
    }
    image.src = url
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Failed to load avatar."))
    image.src = src
  })
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to compose chart image."))
        return
      }
      resolve(blob)
    }, "image/png", 1)
  })
}

function drawStatRow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string
) {
  const rowHeight = 28

  ctx.strokeStyle = BORDER
  ctx.beginPath()
  ctx.moveTo(x, y + rowHeight)
  ctx.lineTo(x + width, y + rowHeight)
  ctx.stroke()

  ctx.fillStyle = TEXT_MUTED
  ctx.font = "11px system-ui, sans-serif"
  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  ctx.fillText(label, x, y + 6)

  ctx.fillStyle = TEXT_PRIMARY
  ctx.font = "11px system-ui, sans-serif"
  ctx.textAlign = "right"
  const valueText =
    value.length > 24 ? `${value.slice(0, 21)}...` : value
  ctx.fillText(valueText, x + width, y + 6)

  return rowHeight
}

async function drawAnalyticsPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  profile: ContributionResult,
  contributions: ContributionDay[]
) {
  const analysis = analyzeProfile(contributions)
  const padding = 16

  ctx.fillStyle = BACKGROUND
  ctx.fillRect(x, y, width, height)

  ctx.strokeStyle = BORDER
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1)

  let cursorY = y + padding

  try {
    const avatar = await loadImage(profile.avatarUrl)
    const avatarSize = 48
    ctx.drawImage(avatar, x + padding, cursorY, avatarSize, avatarSize)
    ctx.strokeStyle = BORDER
    ctx.strokeRect(x + padding, cursorY, avatarSize, avatarSize)

    ctx.fillStyle = TEXT_PRIMARY
    ctx.font = "600 13px system-ui, sans-serif"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText(`@${profile.username}`, x + padding + avatarSize + 12, cursorY + 4)

    if (profile.name) {
      ctx.fillStyle = TEXT_MUTED
      ctx.font = "11px system-ui, sans-serif"
      ctx.fillText(profile.name, x + padding + avatarSize + 12, cursorY + 24)
    }

    cursorY += avatarSize + 20
  } catch {
    ctx.fillStyle = TEXT_PRIMARY
    ctx.font = "600 13px system-ui, sans-serif"
    ctx.textAlign = "left"
    ctx.fillText(`@${profile.username}`, x + padding, cursorY)
    cursorY += 28
  }

  ctx.fillStyle = "rgba(110, 231, 183, 0.9)"
  ctx.font = "600 10px system-ui, sans-serif"
  ctx.fillText("PROFILE ANALYSIS", x + padding, cursorY)
  cursorY += 18

  const rowWidth = width - padding * 2
  const rows: Array<[string, string]> = [
    ["Total contributions", analysis.totalContributions.toLocaleString()],
    [
      "Active days",
      `${analysis.activeDays.toLocaleString()} (${Math.round(analysis.activityRate * 100)}%)`,
    ],
    ["Avg per active day", analysis.averagePerActiveDay.toFixed(1)],
    ["Avg per week", analysis.averagePerWeek.toFixed(1)],
    [
      "Current streak",
      `${analysis.currentStreak} day${analysis.currentStreak === 1 ? "" : "s"}`,
    ],
    [
      "Longest streak",
      `${analysis.longestStreak} day${analysis.longestStreak === 1 ? "" : "s"}`,
    ],
  ]

  if (analysis.peakDay) {
    rows.push([
      "Peak day",
      `${analysis.peakDay.count} on ${analysis.peakDay.date}`,
    ])
  }

  rows.push(
    [
      "Busiest weekday",
      `${analysis.busiestWeekday} (${analysis.busiestWeekdayCount.toLocaleString()})`,
    ],
    [
      "Most active month",
      `${analysis.mostActiveMonth} (${analysis.mostActiveMonthCount.toLocaleString()})`,
    ],
    ["Last 30 days", analysis.recentThirtyDayTotal.toLocaleString()]
  )

  for (const [label, value] of rows) {
    cursorY += drawStatRow(
      ctx,
      x + padding,
      cursorY,
      rowWidth,
      label,
      value
    )
  }
}

export async function buildChartExportImage({
  chartBlob,
  profile,
  contributions,
  includeAnalytics,
}: BuildChartImageOptions): Promise<Blob> {
  const chartImage = await blobToImage(chartBlob)
  const analyticsWidth = includeAnalytics ? ANALYTICS_PANEL_WIDTH : 0
  const contentWidth = analyticsWidth + chartImage.width
  const contentHeight = chartImage.height
  const totalHeight = contentHeight + WATERMARK_HEIGHT

  const canvas = document.createElement("canvas")
  canvas.width = contentWidth
  canvas.height = totalHeight
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Failed to compose chart image.")
  }

  ctx.fillStyle = BACKGROUND
  ctx.fillRect(0, 0, contentWidth, totalHeight)

  if (includeAnalytics) {
    await drawAnalyticsPanel(
      ctx,
      0,
      0,
      analyticsWidth,
      contentHeight,
      profile,
      contributions
    )
  }

  ctx.drawImage(chartImage, analyticsWidth, 0)

  ctx.strokeStyle = BORDER
  ctx.beginPath()
  ctx.moveTo(0, contentHeight)
  ctx.lineTo(contentWidth, contentHeight)
  ctx.stroke()

  ctx.fillStyle = "rgba(167, 243, 208, 0.55)"
  ctx.font = "12px system-ui, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(
    WATERMARK_TEXT,
    contentWidth / 2,
    contentHeight + WATERMARK_HEIGHT / 2
  )

  return canvasToBlob(canvas)
}

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