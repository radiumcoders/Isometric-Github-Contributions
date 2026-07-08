"use client"

import { Loader2 } from "lucide-react"
import { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type SearchPanelProps = {
  input: string
  loading: boolean
  error: string | null
  showControlsHint: boolean
  onInputChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function SearchPanel({
  input,
  loading,
  error,
  showControlsHint,
  onInputChange,
  onSubmit,
}: SearchPanelProps) {
  return (
    <aside className="pointer-events-auto flex max-h-[calc(100svh-1.5rem)] w-full flex-col gap-4 overflow-y-auto border border-emerald-300/15 bg-black/55 p-3 text-white shadow-2xl shadow-black/30 backdrop-blur-sm sm:max-h-[calc(100svh-2rem)] sm:p-4">
      <div>
        <h1 className="text-base font-medium tracking-tight sm:text-lg">
          Isometric Contribution Graph
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-emerald-100/65 sm:text-sm">
          Paste a GitHub username or profile link. Shareable URLs look like
          /theorcdev or /radiumcoders.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <Input
          type="text"
          placeholder="octocat or https://github.com/octocat"
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          disabled={loading}
          aria-invalid={!!error}
          className="h-9 rounded-none border-emerald-100/20 bg-white/95 text-black placeholder:text-black/50"
        />
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-9 rounded-none bg-emerald-400 text-black hover:bg-emerald-300"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" data-icon="inline-start" />
              Loading
            </>
          ) : (
            "Show graph"
          )}
        </Button>
      </form>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {showControlsHint ? (
        <p className="text-xs text-emerald-100/55">
          Drag to rotate - Scroll to zoom - Height is 1 unit per contribution
        </p>
      ) : null}
    </aside>
  )
}