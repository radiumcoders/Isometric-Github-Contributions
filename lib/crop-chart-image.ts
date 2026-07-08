const BACKGROUND_RGB = { r: 1, g: 4, b: 9 }
const COLOR_THRESHOLD = 14
const ALPHA_THRESHOLD = 8
const DEFAULT_PADDING = 20

type CropBounds = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

function isBackgroundPixel(
  red: number,
  green: number,
  blue: number,
  alpha: number
) {
  if (alpha < ALPHA_THRESHOLD) return true

  return (
    Math.abs(red - BACKGROUND_RGB.r) <= COLOR_THRESHOLD &&
    Math.abs(green - BACKGROUND_RGB.g) <= COLOR_THRESHOLD &&
    Math.abs(blue - BACKGROUND_RGB.b) <= COLOR_THRESHOLD
  )
}

function findContentBounds(
  imageData: ImageData,
  padding: number
): CropBounds | null {
  const { width, height, data } = imageData
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const red = data[index]
      const green = data[index + 1]
      const blue = data[index + 2]
      const alpha = data[index + 3]

      if (isBackgroundPixel(red, green, blue, alpha)) continue

      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }

  if (maxX < minX || maxY < minY) return null

  return {
    minX: Math.max(0, minX - padding),
    minY: Math.max(0, minY - padding),
    maxX: Math.min(width - 1, maxX + padding),
    maxY: Math.min(height - 1, maxY + padding),
  }
}

export function cropChartImage(
  image: HTMLImageElement | HTMLCanvasElement,
  padding = DEFAULT_PADDING
): HTMLCanvasElement {
  const sourceWidth =
    image instanceof HTMLImageElement ? image.naturalWidth : image.width
  const sourceHeight =
    image instanceof HTMLImageElement ? image.naturalHeight : image.height

  const sampleCanvas = document.createElement("canvas")
  sampleCanvas.width = sourceWidth
  sampleCanvas.height = sourceHeight
  const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true })

  if (!sampleContext) {
    throw new Error("Failed to crop chart image.")
  }

  sampleContext.drawImage(image, 0, 0, sourceWidth, sourceHeight)
  const bounds = findContentBounds(
    sampleContext.getImageData(0, 0, sourceWidth, sourceHeight),
    padding
  )

  const output = document.createElement("canvas")

  if (!bounds) {
    output.width = sourceWidth
    output.height = sourceHeight
    const outputContext = output.getContext("2d")
    outputContext?.drawImage(image, 0, 0, sourceWidth, sourceHeight)
    return output
  }

  const cropWidth = bounds.maxX - bounds.minX + 1
  const cropHeight = bounds.maxY - bounds.minY + 1

  output.width = cropWidth
  output.height = cropHeight

  const outputContext = output.getContext("2d")
  if (!outputContext) {
    throw new Error("Failed to crop chart image.")
  }

  outputContext.imageSmoothingEnabled = true
  outputContext.imageSmoothingQuality = "high"
  outputContext.drawImage(
    image,
    bounds.minX,
    bounds.minY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  )

  return output
}