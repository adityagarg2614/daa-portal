"use client"

import { cn } from "@/lib/utils"

interface FilterTabsProps<T extends string> {
    tabs: T[]
    activeTab: T
    onTabChange: (tab: T) => void
    className?: string
}

/**
 * FilterTabs - A reusable tab component for filtering content
 * Used for status filters (All, Active, Upcoming, etc.)
 */
export function FilterTabs<T extends string>({
    tabs,
    activeTab,
    onTabChange,
    className,
}: FilterTabsProps<T>) {
    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab
                return (
                    <button
                        key={tab}
                        onClick={() => onTabChange(tab)}
                        className={cn(
                            "rounded-full px-4 py-2 text-sm font-medium transition-all",
                            isActive
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                        aria-pressed={isActive}
                    >
                        {tab}
                    </button>
                )
            })}
        </div>
    )
}
