"use client"

import { Loader2 } from "lucide-react"
import { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type SearchPanelProps = {
  input: string
  loading: boolean
  error: string | null
  onInputChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function SearchPanel({
  input,
  loading,
  error,
  onInputChange,
  onSubmit,
}: SearchPanelProps) {
  return (
    <div className="flex flex-col gap-4">
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
          className="h-9 rounded-none border-emerald-100/20 bg-transparent text-white placeholder:text-white"
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
    </div>
  )
}