import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import { NumberTicker } from "@/components/ui/number-ticker"

interface StatsCardProps {
    icon: LucideIcon
    title: string
    value: string | number
    subtitle?: string
    className?: string
}

/**
 * StatsCard - A card component for displaying statistics with an icon
 * Used in dashboard homepages and overview sections
 */
export function StatsCard({
    icon: Icon,
    title,
    value,
    subtitle,
    className,
}: StatsCardProps) {
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
                    {subtitle && (
                        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
                    )}
                </div>
                <div className="rounded-xl bg-muted p-2">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    )
}
