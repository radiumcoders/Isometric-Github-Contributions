"use client"

import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SidebarMenuProps = {
  defaultOpen?: boolean
  children: (helpers: { closeMenu: () => void }) => React.ReactNode
}

export function SidebarMenu({ defaultOpen = false, children }: SidebarMenuProps) {
  const [open, setOpen] = useState(false)

  const closeMenu = useCallback(() => {
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!defaultOpen) return

    const media = window.matchMedia("(max-width: 767px)")
    if (media.matches) setOpen(true)
  }, [defaultOpen])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, closeMenu])

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-expanded={open}
        aria-controls="app-sidebar"
        onClick={() => setOpen(true)}
        className={cn(
          "pointer-events-auto fixed top-3 left-3 z-20 h-9 rounded-none border-emerald-100/25 bg-black/70 text-emerald-50 shadow-lg shadow-black/30 backdrop-blur-sm hover:bg-emerald-400/10 hover:text-emerald-50 md:hidden",
          open && "pointer-events-none opacity-0"
        )}
      >
        <PanelLeftOpen data-icon="inline-start" />
        Menu
      </Button>

      <button
        type="button"
        aria-label="Close menu"
        onClick={closeMenu}
        className={cn(
          "fixed inset-0 z-10 bg-black/55 transition-opacity md:hidden",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
      />

      <div className="pointer-events-none absolute top-0 left-0 bottom-0 z-10 flex w-full max-w-xs justify-start p-3 sm:max-w-sm sm:p-4 md:max-w-xs">
        <aside
          id="app-sidebar"
          className={cn(
            "pointer-events-auto flex max-h-[calc(100svh-1.5rem)] w-full flex-col gap-4 overflow-y-auto border border-emerald-300/15 bg-black/80 p-3 text-white shadow-2xl shadow-black/30 backdrop-blur-sm transition-transform duration-300 ease-out sm:max-h-[calc(100svh-2rem)] sm:p-4 md:translate-x-0",
            "max-md:fixed max-md:top-0 max-md:left-0 max-md:bottom-0 max-md:z-20 max-md:max-h-none max-md:w-[min(100%,20rem)] max-md:rounded-none max-md:p-4",
            open ? "max-md:translate-x-0" : "max-md:-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between md:hidden">
            <span className="text-sm font-medium text-emerald-50">Menu</span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Close menu"
              onClick={closeMenu}
              className="rounded-none border-emerald-100/25 bg-transparent text-emerald-50 hover:bg-emerald-400/10 hover:text-emerald-50"
            >
              <PanelLeftClose />
            </Button>
          </div>

          {children({ closeMenu })}
        </aside>
      </div>
    </>
  )
}