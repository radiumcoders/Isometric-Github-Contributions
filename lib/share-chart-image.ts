import type { ContributionDay } from "@/lib/contribution-data"
import type { ContributionResult } from "@/lib/github"
import { analyzeProfile } from "@/lib/profile-analysis"

export type ChartImageExportResult = "downloaded-copied" | "downloaded"

const WATERMARK_TEXT = "Powered by IGC · radiumcoders.com"
const MIN_EXPORT_WIDTH = 1600
const OVERLAY_PADDING = 28
const WATERMARK_SCRIM_HEIGHT = 72

const BACKGROUND = "#010409"
const ACCENT = "#56d364"
const ACCENT_SOFT = "rgba(86, 211, 100, 0.75)"
const TEXT_PRIMARY = "#f4fff8"
const TEXT_MUTED = "rgba(167, 243, 208, 0.72)"
const BORDER = "rgba(86, 211, 100, 0.22)"
const GLASS = "rgba(1, 4, 9, 0.74)"

type BuildChartImageOptions = {
  chartBlob: Blob
  profile: ContributionResult
  contributions: ContributionDay[]
  includeAnalytics: boolean
}

type MetricCard = {
  icon: "flame" | "bolt" | "peak" | "crown"
  value: string
  label: string
  sublabel?: string
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

function getExportSize(chartWidth: number, chartHeight: number) {
  const scale = Math.max(1, MIN_EXPORT_WIDTH / chartWidth)
  return {
    width: Math.round(chartWidth * scale),
    height: Math.round(chartHeight * scale),
    scale,
  }
}

function getContributionYear(contributions: ContributionDay[]) {
  if (contributions.length === 0) return new Date().getFullYear()

  const latestDate = contributions.reduce(
    (latest, day) => (day.date > latest ? day.date : latest),
    contributions[0].date
  )

  return Number.parseInt(latestDate.slice(0, 4), 10)
}

function drawChartBackground(
  ctx: CanvasRenderingContext2D,
  chartImage: HTMLImageElement,
  width: number,
  height: number
) {
  ctx.fillStyle = BACKGROUND
  ctx.fillRect(0, 0, width, height)

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(chartImage, 0, 0, width, height)
}

function drawGlassPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.fillStyle = GLASS
  ctx.fillRect(x, y, width, height)
  ctx.strokeStyle = BORDER
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1)
}

function drawGlowText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string,
  glow = ACCENT_SOFT,
  align: CanvasTextAlign = "left"
) {
  ctx.save()
  ctx.font = font
  ctx.textAlign = align
  ctx.textBaseline = "top"
  ctx.shadowColor = glow
  ctx.shadowBlur = 14
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
  ctx.shadowBlur = 0
  ctx.fillText(text, x, y)
  ctx.restore()
}

async function drawCircularAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  avatarUrl: string
) {
  const centerX = x + size / 2
  const centerY = y + size / 2
  const radius = size / 2

  ctx.save()
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  ctx.clip()

  try {
    const avatar = await loadImage(avatarUrl)
    ctx.drawImage(avatar, x, y, size, size)
  } catch {
    ctx.fillStyle = "#0d2818"
    ctx.fillRect(x, y, size, size)
  }

  ctx.restore()
  ctx.strokeStyle = BORDER
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  ctx.stroke()
}

function drawMetricIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  icon: MetricCard["icon"]
) {
  ctx.fillStyle = "rgba(86, 211, 100, 0.14)"
  ctx.strokeStyle = BORDER
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.strokeStyle = ACCENT
  ctx.fillStyle = ACCENT
  ctx.lineWidth = 2
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  switch (icon) {
    case "flame":
      ctx.beginPath()
      ctx.moveTo(cx, cy + 7)
      ctx.bezierCurveTo(cx - 7, cy + 2, cx - 5, cy - 7, cx, cy - 10)
      ctx.bezierCurveTo(cx + 5, cy - 7, cx + 7, cy + 2, cx, cy + 7)
      ctx.stroke()
      break
    case "bolt":
      ctx.beginPath()
      ctx.moveTo(cx + 2, cy - 8)
      ctx.lineTo(cx - 3, cy + 1)
      ctx.lineTo(cx + 1, cy + 1)
      ctx.lineTo(cx - 2, cy + 8)
      ctx.lineTo(cx + 3, cy - 1)
      ctx.lineTo(cx - 1, cy - 1)
      ctx.closePath()
      ctx.fill()
      break
    case "peak":
      ctx.beginPath()
      ctx.moveTo(cx - 8, cy + 6)
      ctx.lineTo(cx - 2, cy - 2)
      ctx.lineTo(cx + 3, cy + 3)
      ctx.lineTo(cx + 8, cy - 6)
      ctx.stroke()
      break
    case "crown":
      ctx.beginPath()
      ctx.moveTo(cx - 8, cy + 5)
      ctx.lineTo(cx - 5, cy - 3)
      ctx.lineTo(cx, cy + 2)
      ctx.lineTo(cx + 5, cy - 3)
      ctx.lineTo(cx + 8, cy + 5)
      ctx.closePath()
      ctx.stroke()
      break
  }
}

function drawMetricCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  card: MetricCard,
  compact: boolean
) {
  const iconRadius = compact ? 16 : 20
  const centerX = x + width / 2
  const valueSize = compact ? 20 : 24

  drawMetricIcon(ctx, centerX, y + iconRadius + 2, iconRadius, card.icon)

  drawGlowText(
    ctx,
    card.value,
    centerX,
    y + iconRadius * 2 + 12,
    `700 ${valueSize}px system-ui, sans-serif`,
    TEXT_PRIMARY,
    ACCENT_SOFT,
    "center"
  )

  ctx.fillStyle = ACCENT_SOFT
  ctx.font = `600 ${compact ? 9 : 10}px system-ui, sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "top"
  ctx.fillText(card.label, centerX, y + iconRadius * 2 + (compact ? 36 : 42))

  if (card.sublabel) {
    ctx.fillStyle = TEXT_MUTED
    ctx.font = "9px system-ui, sans-serif"
    ctx.fillText(card.sublabel, centerX, y + iconRadius * 2 + (compact ? 50 : 56))
  }
}

function drawDivider(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
  const gradient = ctx.createLinearGradient(x, y, x + width, y)
  gradient.addColorStop(0, "rgba(86, 211, 100, 0)")
  gradient.addColorStop(0.5, ACCENT)
  gradient.addColorStop(1, "rgba(86, 211, 100, 0)")
  ctx.strokeStyle = gradient
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + width, y)
  ctx.stroke()
}

function drawExtendedAnalytics(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  contributions: ContributionDay[]
) {
  const analysis = analyzeProfile(contributions)
  const rows: Array<[string, string]> = [
    ["Avg per active day", analysis.averagePerActiveDay.toFixed(1)],
    ["Avg per week", analysis.averagePerWeek.toFixed(1)],
    [
      "Current streak",
      `${analysis.currentStreak} day${analysis.currentStreak === 1 ? "" : "s"}`,
    ],
    [
      "Busiest weekday",
      `${analysis.busiestWeekday} (${analysis.busiestWeekdayCount.toLocaleString()})`,
    ],
    ["Last 30 days", analysis.recentThirtyDayTotal.toLocaleString()],
  ]

  let cursorY = y

  ctx.fillStyle = ACCENT_SOFT
  ctx.font = "600 10px system-ui, sans-serif"
  ctx.textAlign = "left"
  ctx.fillText("DETAILED ANALYTICS", x, cursorY)
  cursorY += 18

  for (const [label, value] of rows) {
    ctx.fillStyle = TEXT_MUTED
    ctx.font = "11px system-ui, sans-serif"
    ctx.fillText(label, x, cursorY)

    ctx.fillStyle = TEXT_PRIMARY
    ctx.textAlign = "right"
    ctx.fillText(value, x + width, cursorY)
    ctx.textAlign = "left"

    cursorY += 22
  }
}

async function drawProfileOverlay(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  profile: ContributionResult,
  contributions: ContributionDay[],
  includeAnalytics: boolean
) {
  const analysis = analyzeProfile(contributions)
  const year = getContributionYear(contributions)
  const overlayWidth = Math.min(620, canvasWidth - OVERLAY_PADDING * 2)
  const overlayX = OVERLAY_PADDING
  const overlayY = OVERLAY_PADDING
  const innerX = overlayX + 24
  const innerWidth = overlayWidth - 48
  const overlayHeight = includeAnalytics ? 430 : 300

  drawGlassPanel(ctx, overlayX, overlayY, overlayWidth, overlayHeight)

  let y = overlayY + 24

  await drawCircularAvatar(ctx, innerX, y, 56, profile.avatarUrl)

  drawGlowText(
    ctx,
    `@${profile.username}`,
    innerX + 68,
    y + 6,
    "700 22px system-ui, sans-serif",
    TEXT_PRIMARY
  )

  if (profile.name) {
    ctx.fillStyle = ACCENT
    ctx.font = "500 16px system-ui, sans-serif"
    ctx.textAlign = "left"
    ctx.fillText(profile.name, innerX + 68, y + 32)
  }

  y += 76

  ctx.fillStyle = TEXT_PRIMARY
  ctx.font = "700 16px system-ui, sans-serif"
  ctx.fillText(`YEAR IN CODE ${year}`, innerX, y)
  y += 24
  drawDivider(ctx, innerX, y, innerWidth)
  y += 22

  drawGlowText(
    ctx,
    analysis.totalContributions.toLocaleString(),
    innerX,
    y,
    "800 56px system-ui, sans-serif",
    TEXT_PRIMARY,
    "rgba(86, 211, 100, 0.35)"
  )
  y += 62

  ctx.fillStyle = ACCENT
  ctx.font = "700 12px system-ui, sans-serif"
  ctx.fillText("TOTAL CONTRIBUTIONS", innerX, y)
  y += 34

  const metrics: MetricCard[] = [
    {
      icon: "flame",
      value: analysis.activeDays.toLocaleString(),
      label: "ACTIVE DAYS",
    },
    {
      icon: "bolt",
      value: `${analysis.longestStreak} DAYS`,
      label: "LONGEST STREAK",
    },
    {
      icon: "peak",
      value: analysis.peakDay
        ? analysis.peakDay.count.toLocaleString()
        : "0",
      label: "PEAK DAY",
      sublabel: analysis.peakDay ? `ON ${analysis.peakDay.date}` : undefined,
    },
    {
      icon: "crown",
      value:
        analysis.mostActiveMonth === "—"
          ? "—"
          : analysis.mostActiveMonth.toUpperCase(),
      label: "BEST MONTH",
    },
  ]

  const cardWidth = innerWidth / 4
  metrics.forEach((metric, index) => {
    drawMetricCard(ctx, innerX + cardWidth * index, y, cardWidth, metric, true)
  })

  if (includeAnalytics) {
    drawExtendedAnalytics(ctx, innerX, y + 108, innerWidth, contributions)
  }
}

function drawWatermarkOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const scrimTop = height - WATERMARK_SCRIM_HEIGHT
  const gradient = ctx.createLinearGradient(0, scrimTop, 0, height)
  gradient.addColorStop(0, "rgba(1, 4, 9, 0)")
  gradient.addColorStop(0.65, "rgba(1, 4, 9, 0.72)")
  gradient.addColorStop(1, "rgba(1, 4, 9, 0.92)")
  ctx.fillStyle = gradient
  ctx.fillRect(0, scrimTop, width, WATERMARK_SCRIM_HEIGHT)

  ctx.fillStyle = TEXT_MUTED
  ctx.font = "500 13px system-ui, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(WATERMARK_TEXT, width / 2, height - WATERMARK_SCRIM_HEIGHT / 2)
}

export async function buildChartExportImage({
  chartBlob,
  profile,
  contributions,
  includeAnalytics,
}: BuildChartImageOptions): Promise<Blob> {
  const chartImage = await blobToImage(chartBlob)
  const { width, height } = getExportSize(chartImage.width, chartImage.height)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Failed to compose chart image.")
  }

  drawChartBackground(ctx, chartImage, width, height)
  await drawProfileOverlay(ctx, width, profile, contributions, includeAnalytics)
  drawWatermarkOverlay(ctx, width, height)

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