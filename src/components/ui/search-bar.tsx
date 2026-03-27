"use client"

import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    ariaLabel?: string
}

/**
 * SearchBar - A reusable search input with clear button and animations
 * Used across admin and student dashboards
 */
export function SearchBar({
    value,
    onChange,
    placeholder = "Search...",
    className,
    ariaLabel = "Search",
}: SearchBarProps) {
    return (
        <div className={cn("relative w-full lg:w-80", className)}>
            <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground icon-pulse"
                aria-hidden="true"
            />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-11 w-full rounded-xl border bg-background pl-10 pr-10 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all"
                aria-label={ariaLabel}
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-muted transition-colors"
                    aria-label="Clear search"
                >
                    <X className="h-4 w-4 icon-hover-scale" />
                </button>
            )}
        </div>
    )
}
