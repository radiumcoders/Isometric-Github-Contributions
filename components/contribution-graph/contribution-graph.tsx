"use client"

import { Check, Loader2, Share2 } from "lucide-react"
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

import { ProfileAnalysisPanel } from "@/components/profile-analysis"
import { SearchPanel } from "@/components/search-panel"
import { SidebarMenu } from "@/components/sidebar-menu"
import { Button } from "@/components/ui/button"
import type { ContributionResult } from "@/lib/github"
import { parseGitHubUsername } from "@/lib/github"

const ContributionScene = dynamic(
  () =>
    import("./contribution-scene").then((module) => module.ContributionScene),
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

type ContributionGraphProps = {
  initialUsername?: string
}

export function ContributionGraph({ initialUsername }: ContributionGraphProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [queryUser, setQueryUser] = useQueryState(
    "user",
    parseAsString.withDefault("")
  )
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ContributionResult | null>(null)
  const [copiedShareUrl, setCopiedShareUrl] = useState(false)
  const lastLoadedRef = useRef<string | null>(null)
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const contributions = useMemo(() => profile?.data ?? [], [profile?.data])

  const loadProfile = useCallback(async (rawInput: string) => {
    const username = parseGitHubUsername(rawInput)
    if (!username) {
      setProfile(null)
      setError("Enter a valid GitHub username or profile link.")
      return
    }

    setError(null)
    setLoading(true)
    setProfile(null)

    try {
      const response = await fetch(
        `/api/contributions?user=${encodeURIComponent(username)}`
      )
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load contributions.")
      }

      setProfile(payload as ContributionResult)
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

    const username = parseGitHubUsername(queryUser)
    if (!username) return

    router.replace(`/${username}`)
  }, [initialUsername, queryUser, router])

  useEffect(() => {
    setCopiedShareUrl(false)
    if (copyResetRef.current) {
      clearTimeout(copyResetRef.current)
      copyResetRef.current = null
    }
  }, [profile?.username])

  useEffect(() => {
    return () => {
      if (copyResetRef.current) {
        clearTimeout(copyResetRef.current)
      }
    }
  }, [])

  async function handleShareProfile() {
    if (!profile) return

    const shareUrl = `${window.location.origin}/${profile.username}`

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

    const username = parseGitHubUsername(input.trim())
    if (!username) {
      setError("Enter a valid GitHub username or profile link.")
      return
    }

    setError(null)
    void setQueryUser(null)

    const targetPath = `/${username}`
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
          <ContributionScene key={profile.username} data={contributions} />
        ) : loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-emerald-100/60">
            <Loader2 className="size-6 animate-spin text-emerald-300" />
            <p>
              Loading @
              {parseGitHubUsername(input.trim()) ?? input.trim()}&apos;s
              contribution terrain...
            </p>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-emerald-100/60">
            <p>Enter a GitHub profile to render their contribution terrain.</p>
            <p className="text-xs text-emerald-100/40">
              Try &quot;torvalds&quot; or share a link like /theorcdev
            </p>
          </div>
        )}
      </div>

      <SidebarMenu defaultOpen={!profile && !initialUsername}>
        {({ closeMenu }) => (
          <>
            <SearchPanel
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
                Drag to rotate - Scroll to zoom - Height is 1 unit per contribution
              </p>
            ) : null}

            {profile ? (
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
            ) : null}
          </>
        )}
      </SidebarMenu>
    </section>
  )
}