import type { ContributionDay } from "@/lib/contribution-data"
import type { ContributionResult } from "@/lib/github"
import { analyzeProfile } from "@/lib/profile-analysis"

export type ChartImageExportResult = "downloaded-copied" | "downloaded"

const WATERMARK_TEXT = "Powered by IGC · radiumcoders.com"
const EXPORT_WIDTH = 1920
const EXPORT_HEIGHT = 1080
const LEFT_PANEL_WIDTH = 760
const WATERMARK_HEIGHT = 52
const PANEL_PADDING = 56

const BACKGROUND = "#010409"
const PANEL_GRADIENT_TOP = "#04140c"
const ACCENT = "#56d364"
const ACCENT_SOFT = "rgba(86, 211, 100, 0.75)"
const TEXT_PRIMARY = "#f4fff8"
const TEXT_MUTED = "rgba(167, 243, 208, 0.72)"
const BORDER = "rgba(86, 211, 100, 0.22)"

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

function getContributionYear(contributions: ContributionDay[]) {
  if (contributions.length === 0) return new Date().getFullYear()

  const latestDate = contributions.reduce((latest, day) =>
    day.date > latest ? day.date : latest
  , contributions[0].date)

  return Number.parseInt(latestDate.slice(0, 4), 10)
}

function fitRect(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number
) {
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight)
  const width = Math.round(sourceWidth * scale)
  const height = Math.round(sourceHeight * scale)
  const x = Math.round((maxWidth - width) / 2)
  const y = Math.round((maxHeight - height) / 2)

  return { x, y, width, height, scale }
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
  ctx.shadowBlur = 18
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
  ctx.closePath()
  ctx.clip()

  try {
    const avatar = await loadImage(avatarUrl)
    ctx.drawImage(avatar, x, y, size, size)
  } catch {
    ctx.fillStyle = "#0d2818"
    ctx.fillRect(x, y, size, size)
    ctx.fillStyle = TEXT_MUTED
    ctx.font = "12px system-ui, sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("?", centerX, centerY)
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
  ctx.fillStyle = "rgba(86, 211, 100, 0.12)"
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
      ctx.moveTo(cx, cy + 8)
      ctx.bezierCurveTo(cx - 8, cy + 2, cx - 6, cy - 8, cx, cy - 12)
      ctx.bezierCurveTo(cx + 6, cy - 8, cx + 8, cy + 2, cx, cy + 8)
      ctx.stroke()
      break
    case "bolt":
      ctx.beginPath()
      ctx.moveTo(cx + 2, cy - 10)
      ctx.lineTo(cx - 4, cy + 1)
      ctx.lineTo(cx + 1, cy + 1)
      ctx.lineTo(cx - 2, cy + 10)
      ctx.lineTo(cx + 4, cy - 1)
      ctx.lineTo(cx - 1, cy - 1)
      ctx.closePath()
      ctx.fill()
      break
    case "peak":
      ctx.beginPath()
      ctx.moveTo(cx - 10, cy + 8)
      ctx.lineTo(cx - 2, cy - 2)
      ctx.lineTo(cx + 4, cy + 4)
      ctx.lineTo(cx + 10, cy - 8)
      ctx.stroke()
      break
    case "crown":
      ctx.beginPath()
      ctx.moveTo(cx - 10, cy + 6)
      ctx.lineTo(cx - 6, cy - 4)
      ctx.lineTo(cx, cy + 2)
      ctx.lineTo(cx + 6, cy - 4)
      ctx.lineTo(cx + 10, cy + 6)
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
  card: MetricCard
) {
  const iconRadius = 22
  const centerX = x + width / 2

  drawMetricIcon(ctx, centerX, y + iconRadius + 4, iconRadius, card.icon)

  ctx.textAlign = "center"
  ctx.textBaseline = "top"
  drawGlowText(
    ctx,
    card.value,
    centerX,
    y + iconRadius * 2 + 18,
    "700 28px system-ui, sans-serif",
    TEXT_PRIMARY,
    ACCENT_SOFT,
    "center"
  )

  ctx.fillStyle = ACCENT_SOFT
  ctx.font = "600 11px system-ui, sans-serif"
  ctx.fillText(card.label, centerX, y + iconRadius * 2 + 54)

  if (card.sublabel) {
    ctx.fillStyle = TEXT_MUTED
    ctx.font = "10px system-ui, sans-serif"
    ctx.fillText(card.sublabel, centerX, y + iconRadius * 2 + 70)
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
  ctx.font = "600 11px system-ui, sans-serif"
  ctx.textAlign = "left"
  ctx.fillText("DETAILED ANALYTICS", x, cursorY)
  cursorY += 22

  for (const [label, value] of rows) {
    ctx.strokeStyle = "rgba(86, 211, 100, 0.12)"
    ctx.beginPath()
    ctx.moveTo(x, cursorY + 24)
    ctx.lineTo(x + width, cursorY + 24)
    ctx.stroke()

    ctx.fillStyle = TEXT_MUTED
    ctx.font = "12px system-ui, sans-serif"
    ctx.fillText(label, x, cursorY + 4)

    ctx.fillStyle = TEXT_PRIMARY
    ctx.textAlign = "right"
    ctx.fillText(value, x + width, cursorY + 4)
    ctx.textAlign = "left"

    cursorY += 30
  }
}

async function drawLeftPanel(
  ctx: CanvasRenderingContext2D,
  profile: ContributionResult,
  contributions: ContributionDay[],
  includeAnalytics: boolean
) {
  const analysis = analyzeProfile(contributions)
  const year = getContributionYear(contributions)
  const panelHeight = EXPORT_HEIGHT - WATERMARK_HEIGHT

  const gradient = ctx.createLinearGradient(0, 0, LEFT_PANEL_WIDTH, panelHeight)
  gradient.addColorStop(0, PANEL_GRADIENT_TOP)
  gradient.addColorStop(1, BACKGROUND)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, LEFT_PANEL_WIDTH, panelHeight)

  ctx.strokeStyle = BORDER
  ctx.beginPath()
  ctx.moveTo(LEFT_PANEL_WIDTH, 0)
  ctx.lineTo(LEFT_PANEL_WIDTH, panelHeight)
  ctx.stroke()

  const x = PANEL_PADDING
  let y = PANEL_PADDING

  await drawCircularAvatar(ctx, x, y, 72, profile.avatarUrl)

  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  drawGlowText(
    ctx,
    `@${profile.username}`,
    x + 88,
    y + 8,
    "700 28px system-ui, sans-serif",
    TEXT_PRIMARY
  )

  if (profile.name) {
    ctx.fillStyle = ACCENT
    ctx.font = "500 20px system-ui, sans-serif"
    ctx.fillText(profile.name, x + 88, y + 42)
  }

  y += 112

  ctx.fillStyle = TEXT_PRIMARY
  ctx.font = "700 22px system-ui, sans-serif"
  ctx.fillText(`YEAR IN CODE ${year}`, x, y)
  y += 34
  drawDivider(ctx, x, y, LEFT_PANEL_WIDTH - PANEL_PADDING * 2)
  y += 36

  const totalText = analysis.totalContributions.toLocaleString()
  drawGlowText(
    ctx,
    totalText,
    x,
    y,
    "800 92px system-ui, sans-serif",
    TEXT_PRIMARY,
    "rgba(86, 211, 100, 0.35)"
  )
  y += 98

  ctx.fillStyle = ACCENT
  ctx.font = "700 16px system-ui, sans-serif"
  ctx.fillText("TOTAL CONTRIBUTIONS", x, y)
  y += 56

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

  const cardWidth = (LEFT_PANEL_WIDTH - PANEL_PADDING * 2) / 4
  metrics.forEach((metric, index) => {
    drawMetricCard(ctx, x + cardWidth * index, y, cardWidth, metric)
  })

  if (includeAnalytics) {
    drawExtendedAnalytics(
      ctx,
      x,
      y + 150,
      LEFT_PANEL_WIDTH - PANEL_PADDING * 2,
      contributions
    )
  }
}

function drawChartArea(ctx: CanvasRenderingContext2D, chartImage: HTMLImageElement) {
  const areaX = LEFT_PANEL_WIDTH
  const areaY = 36
  const areaWidth = EXPORT_WIDTH - LEFT_PANEL_WIDTH - 36
  const areaHeight = EXPORT_HEIGHT - WATERMARK_HEIGHT - 72
  const fit = fitRect(chartImage.width, chartImage.height, areaWidth, areaHeight)

  ctx.save()
  ctx.shadowColor = "rgba(86, 211, 100, 0.18)"
  ctx.shadowBlur = 42
  ctx.drawImage(
    chartImage,
    areaX + fit.x,
    areaY + fit.y,
    fit.width,
    fit.height
  )
  ctx.restore()
}

function drawWatermark(ctx: CanvasRenderingContext2D) {
  const y = EXPORT_HEIGHT - WATERMARK_HEIGHT

  ctx.fillStyle = BACKGROUND
  ctx.fillRect(0, y, EXPORT_WIDTH, WATERMARK_HEIGHT)

  drawDivider(ctx, EXPORT_WIDTH * 0.2, y + 1, EXPORT_WIDTH * 0.6)

  ctx.fillStyle = TEXT_MUTED
  ctx.font = "500 14px system-ui, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(WATERMARK_TEXT, EXPORT_WIDTH / 2, y + WATERMARK_HEIGHT / 2)
}

export async function buildChartExportImage({
  chartBlob,
  profile,
  contributions,
  includeAnalytics,
}: BuildChartImageOptions): Promise<Blob> {
  const chartImage = await blobToImage(chartBlob)

  const canvas = document.createElement("canvas")
  canvas.width = EXPORT_WIDTH
  canvas.height = EXPORT_HEIGHT
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Failed to compose chart image.")
  }

  ctx.fillStyle = BACKGROUND
  ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT)

  await drawLeftPanel(ctx, profile, contributions, includeAnalytics)
  drawChartArea(ctx, chartImage)
  drawWatermark(ctx)

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