"use client"

import { Loader2 } from "lucide-react"
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

      {profile ? (
        <div className="pointer-events-none absolute top-0 left-0 bottom-0 z-10 flex w-full max-w-xs justify-start p-3 sm:p-4">
          <ProfileAnalysisPanel
            profile={profile}
            contributions={contributions}
            copiedShareUrl={copiedShareUrl}
            onShare={() => void handleShareProfile()}
          />
        </div>
      ) : null}

      <div className="pointer-events-none absolute top-0 right-0 bottom-0 z-10 flex w-full max-w-xs justify-end p-3 sm:p-4">
        <SearchPanel
          input={input}
          loading={loading}
          error={error}
          showControlsHint={!!profile}
          onInputChange={setInput}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  )
}