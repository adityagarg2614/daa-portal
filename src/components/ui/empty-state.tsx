import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
    title: string
    description?: string
    action?: React.ReactNode
    icon?: React.ReactNode
    className?: string
}

/**
 * EmptyState - A reusable component for empty search/filter results
 * Used when no data matches the current criteria
 */
export function EmptyState({
    title,
    description,
    action,
    icon,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "rounded-2xl border border-dashed bg-background p-10 text-center shadow-sm",
                className
            )}
            role="status"
            aria-label="No results found"
        >
            {icon || <Search className="mx-auto mb-3 h-12 w-12 opacity-50" />}
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && (
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    )
}
