import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface SectionHeaderProps {
    title: string
    description?: string
    icon?: LucideIcon
    action?: React.ReactNode
    className?: string
}

/**
 * SectionHeader - A reusable header component with optional icon and action
 * Used for page headers and section headers throughout the dashboard
 */
export function SectionHeader({
    title,
    description,
    icon: Icon,
    action,
    className,
}: SectionHeaderProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl border bg-linear-to-br from-background to-muted p-8 shadow-sm",
                className
            )}
            role="banner"
        >
            <div className="relative z-10">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg"
                            aria-hidden="true"
                        >
                            <Icon className="h-6 w-6 icon-bounce" />
                        </div>
                    )}
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                        {description && (
                            <p className="text-sm text-muted-foreground">{description}</p>
                        )}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            </div>
            {/* Decorative background elements */}
            <div
                className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl"
                aria-hidden="true"
            />
            <div
                className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl"
                aria-hidden="true"
            />
        </div>
    )
}
