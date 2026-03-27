import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface InfoCardProps {
    title: string
    children: React.ReactNode
    icon?: LucideIcon
    action?: React.ReactNode
    className?: string
}

/**
 * InfoCard - A reusable card component for displaying content sections
 * Used for lists, forms, and content areas throughout the dashboard
 */
export function InfoCard({
    title,
    children,
    icon: Icon,
    action,
    className,
}: InfoCardProps) {
    return (
        <div
            className={cn(
                "rounded-2xl border bg-background p-6 shadow-sm",
                className
            )}
            role="region"
        >
            {(title || action) && (
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-5 w-5 text-primary" />}
                        <h2 className="text-lg font-semibold">{title}</h2>
                    </div>
                    {action}
                </div>
            )}
            {children}
        </div>
    )
}
