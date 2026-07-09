"use client"

import { Check, Download, Loader2, Share2 } from "lucide-react"
import dynamic from "next/dynamic"
import { usePathname, useRouter } from "next/navigation"
import { parseAsString, useQueryState } from "nuqs"
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { LeetCodeSearchPanel } from "@/components/leetcode-search-panel"
import { ProfileAnalysisPanel } from "@/components/profile-analysis"
import { SidebarMenu } from "@/components/sidebar-menu"
import { Button } from "@/components/ui/button"
import type { LeetCodeResult } from "@/lib/leetcode"
import { parseLeetCodeUsername } from "@/lib/leetcode"
import {
  buildChartExportImage,
  type ChartImageExportResult,
  exportChartImage,
} from "@/lib/share-chart-image"

const ContributionScene = dynamic(
  () =>
    import("@/components/contribution-graph/contribution-scene").then(
      (module) => module.ContributionScene
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-emerald-100/60">
        <Loader2 className="size-6 animate-spin text-emerald-300" />
        <p>Preparing 3D scene...</p>
      </div>
    ),
  }
)

type LeetCodeGraphProps = {
  initialUsername?: string
}

export function LeetCodeGraph({ initialUsername }: LeetCodeGraphProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [queryUser, setQueryUser] = useQueryState(
    "user",
    parseAsString.withDefault("")
  )
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<LeetCodeResult | null>(null)
  const [copiedShareUrl, setCopiedShareUrl] = useState(false)
  const [exportingChartImage, setExportingChartImage] = useState(false)
  const [includeAnalyticsInExport, setIncludeAnalyticsInExport] =
    useState(false)
  const [chartImageExportResult, setChartImageExportResult] =
    useState<ChartImageExportResult | null>(null)
  const lastLoadedRef = useRef<string | null>(null)
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const chartShareResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const captureSceneRef = useRef<(() => Promise<Blob | null>) | null>(null)

  const contributions = useMemo(() => profile?.data ?? [], [profile?.data])

  const handleCaptureReady = useCallback(
    (capture: () => Promise<Blob | null>) => {
      captureSceneRef.current = capture
    },
    []
  )

  const loadProfile = useCallback(async (rawInput: string) => {
    const username = parseLeetCodeUsername(rawInput)
    if (!username) {
      setProfile(null)
      setError("Enter a valid LeetCode username or profile link.")
      return
    }

    setError(null)
    setLoading(true)
    setProfile(null)

    try {
      const response = await fetch(
        `/api/leetcode?user=${encodeURIComponent(username)}`
      )
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load contributions.")
      }

      setProfile(payload as LeetCodeResult)
      setInput(username)
      lastLoadedRef.current = username
    } catch (fetchError) {
      setProfile(null)
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load contributions."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialUsername) {
      setInput(initialUsername)
      return
    }

    if (queryUser) {
      setInput(queryUser)
    }
  }, [initialUsername, queryUser])

  useEffect(() => {
    if (!initialUsername) return

    if (
      lastLoadedRef.current?.toLowerCase() === initialUsername.toLowerCase()
    ) {
      return
    }

    void loadProfile(initialUsername)
  }, [initialUsername, loadProfile])

  useEffect(() => {
    if (initialUsername) return
    if (!queryUser) return

    const username = parseLeetCodeUsername(queryUser)
    if (!username) return

    router.replace(`/leetcode/${username}`)
  }, [initialUsername, queryUser, router])

  useEffect(() => {
    setCopiedShareUrl(false)
    setChartImageExportResult(null)
    captureSceneRef.current = null
    if (copyResetRef.current) {
      clearTimeout(copyResetRef.current)
      copyResetRef.current = null
    }
    if (chartShareResetRef.current) {
      clearTimeout(chartShareResetRef.current)
      chartShareResetRef.current = null
    }
  }, [profile?.username])

  useEffect(() => {
    return () => {
      if (copyResetRef.current) {
        clearTimeout(copyResetRef.current)
      }
      if (chartShareResetRef.current) {
        clearTimeout(chartShareResetRef.current)
      }
    }
  }, [])

  async function handleExportChartImage() {
    if (!profile) return

    const capture = captureSceneRef.current
    if (!capture) {
      setError("The chart is still loading. Try again in a moment.")
      return
    }

    setExportingChartImage(true)
    setChartImageExportResult(null)

    try {
      const chartBlob = await capture()
      if (!chartBlob) {
        throw new Error("Failed to capture chart image.")
      }

      const blob = await buildChartExportImage({
        chartBlob,
        profile,
        contributions,
        includeAnalytics: includeAnalyticsInExport,
      })

      const result = await exportChartImage(blob, profile.username)
      setChartImageExportResult(result)
      if (chartShareResetRef.current) clearTimeout(chartShareResetRef.current)
      chartShareResetRef.current = setTimeout(
        () => setChartImageExportResult(null),
        2000
      )
    } catch {
      setError("Could not save the chart image. Please try again.")
    } finally {
      setExportingChartImage(false)
    }
  }

  async function handleShareProfile() {
    if (!profile) return

    const shareUrl = `${window.location.origin}/leetcode/${profile.username}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedShareUrl(true)
      if (copyResetRef.current) clearTimeout(copyResetRef.current)
      copyResetRef.current = setTimeout(() => setCopiedShareUrl(false), 2000)
    } catch {
      setError("Could not copy the share link. Please copy it manually.")
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
    closeMenu?: () => void
  ) {
    event.preventDefault()

    const username = parseLeetCodeUsername(input.trim())
    if (!username) {
      setError("Enter a valid LeetCode username or profile link.")
      return
    }

    setError(null)
    void setQueryUser(null)

    const targetPath = `/leetcode/${username}`
    if (pathname !== targetPath) {
      router.push(targetPath)
    }

    await loadProfile(username)
    closeMenu?.()
  }

  return (
    <section className="relative h-full w-full overflow-hidden bg-[#010409]">
      <div className="absolute inset-0">
        {profile ? (
          <ContributionScene
            key={profile.username}
            data={contributions}
            onCaptureReady={handleCaptureReady}
          />
        ) : loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-emerald-100/60">
            <Loader2 className="size-6 animate-spin text-emerald-300" />
            <p>
              Loading @{parseLeetCodeUsername(input.trim()) ?? input.trim()}
              &apos;s contribution terrain...
            </p>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-emerald-100/60">
            <p>
              Enter a LeetCode profile to render their contribution terrain.
            </p>
            <p className="text-xs text-emerald-100/40">
              Try &quot;theorcdev&quot; or share a link like /leetcode/theorcdev
            </p>
          </div>
        )}
      </div>

      <SidebarMenu defaultOpen={!profile && !initialUsername}>
        {({ closeMenu }) => (
          <>
            <LeetCodeSearchPanel
              input={input}
              loading={loading}
              error={error}
              onInputChange={setInput}
              onSubmit={(event) => void handleSubmit(event, closeMenu)}
            />

            {profile ? (
              <ProfileAnalysisPanel
                profile={profile}
                contributions={contributions}
              />
            ) : null}

            {profile ? (
              <p className="text-xs text-emerald-100/55">
                Drag to rotate - Scroll to zoom - Height is 1 units per
                contribution
              </p>
            ) : null}

            {profile ? (
              <div className="flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-2.5 text-xs text-emerald-100/70">
                  <input
                    type="checkbox"
                    checked={includeAnalyticsInExport}
                    onChange={(event) =>
                      setIncludeAnalyticsInExport(event.target.checked)
                    }
                    className="size-4 shrink-0 rounded-none border border-emerald-100/25 accent-emerald-400"
                  />
                  Include analytics in image
                </label>

                <Button
                  type="button"
                  variant="outline"
                  disabled={exportingChartImage}
                  onClick={() => void handleExportChartImage()}
                  className="h-9 w-full rounded-none border-emerald-100/25 bg-transparent text-emerald-50 hover:bg-emerald-400/10 hover:text-emerald-50"
                >
                  {exportingChartImage ? (
                    <>
                      <Loader2
                        className="animate-spin"
                        data-icon="inline-start"
                      />
                      Capturing chart
                    </>
                  ) : chartImageExportResult === "downloaded-copied" ? (
                    <>
                      <Check data-icon="inline-start" />
                      Downloaded & copied
                    </>
                  ) : chartImageExportResult === "downloaded" ? (
                    <>
                      <Check data-icon="inline-start" />
                      Downloaded
                    </>
                  ) : (
                    <>
                      <Download data-icon="inline-start" />
                      Download chart image
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleShareProfile()}
                  className="h-9 w-full rounded-none border-emerald-100/25 bg-transparent text-emerald-50 hover:bg-emerald-400/10 hover:text-emerald-50"
                >
                  {copiedShareUrl ? (
                    <>
                      <Check data-icon="inline-start" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Share2 data-icon="inline-start" />
                      Share profile
                    </>
                  )}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </SidebarMenu>
    </section>
  )
}
