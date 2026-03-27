import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import { NumberTicker } from "@/components/ui/number-ticker"

interface DashboardStatCardProps {
    icon: LucideIcon
    title: string
    value: number | string
    description?: string
    className?: string
}

/**
 * DashboardStatCard - A card component for displaying dashboard statistics
 * Used in admin and student dashboard homepages
 */
export function DashboardStatCard({
    icon: Icon,
    title,
    value,
    description,
    className,
}: DashboardStatCardProps) {
    const isNumeric = typeof value === "number"

    return (
        <div
            className={cn(
                "rounded-2xl border bg-background p-5 shadow-sm transition-all duration-300 hover:shadow-md",
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <h2 className="mt-2 text-2xl font-bold">
                        {isNumeric ? <NumberTicker value={value} /> : value}
                    </h2>
                    {description && (
                        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
                <div className="rounded-xl bg-muted p-2">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    )
}

interface QuickActionCardProps {
    title: string
    description: string
    icon: LucideIcon
    href: string
    className?: string
}

/**
 * QuickActionCard - A card component for quick action links
 * Used in dashboard homepages for navigation
 */
export function QuickActionCard({
    title,
    description,
    icon: Icon,
    href,
    className,
}: QuickActionCardProps) {
    return (
        <a
            href={href}
            className={cn(
                "group relative overflow-hidden rounded-xl border bg-background p-5 transition-all duration-300 hover:shadow-md hover:border-primary/50",
                className
            )}
        >
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <Icon className="h-5 w-5 icon-hover-scale" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
        </a>
    )
}

import { ArrowRight } from "lucide-react"
