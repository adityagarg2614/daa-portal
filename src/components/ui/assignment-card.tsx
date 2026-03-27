import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { LucideIcon } from "lucide-react"

interface Assignment {
    _id: string
    title: string
    description: string
    totalProblems: number
    totalMarks: number
    publishAt: string
    dueAt: string
    status: string
}

interface AssignmentCardProps {
    assignment: Assignment
    statusIcon?: LucideIcon
    onAction?: () => void
    actionLabel?: string
    actionDisabled?: boolean
    className?: string
}

/**
 * AssignmentCard - A reusable card for displaying assignment information
 * Used in both admin and student assignment lists
 */
export function AssignmentCard({
    assignment,
    statusIcon: StatusIcon,
    onAction,
    actionLabel = "View Details",
    actionDisabled = false,
    className,
}: AssignmentCardProps) {
    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-2xl border bg-background p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/50",
                className
            )}
            role="listitem"
        >
            {/* Status indicator bar */}
            <div
                className={cn(
                    "absolute -left-1 top-0 bottom-0 w-1",
                    assignment.status === "Active" && "bg-green-500",
                    assignment.status === "Upcoming" && "bg-blue-500",
                    assignment.status === "Completed" && "bg-purple-500",
                    assignment.status === "Expired" && "bg-red-500"
                )}
                aria-hidden="true"
            />

            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold">{assignment.title}</h2>
                        <Badge
                            variant={
                                assignment.status === "Active"
                                    ? "secondary"
                                    : assignment.status === "Upcoming"
                                        ? "default"
                                        : assignment.status === "Completed"
                                            ? "outline"
                                            : "destructive"
                            }
                            className="gap-1"
                        >
                            {StatusIcon && <StatusIcon className="h-3 w-3" />}
                            {assignment.status}
                        </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {assignment.description}
                    </p>

                    <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                        <div>
                            <span className="font-medium text-foreground">Problems:</span>{" "}
                            {assignment.totalProblems}
                        </div>
                        <div>
                            <span className="font-medium text-foreground">Marks:</span>{" "}
                            {assignment.totalMarks}
                        </div>
                        <div>
                            <span className="font-medium text-foreground">Published:</span>{" "}
                            {new Date(assignment.publishAt).toLocaleString()}
                        </div>
                        <div>
                            <span className="font-medium text-foreground">Due:</span>{" "}
                            {new Date(assignment.dueAt).toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="flex min-w-[180px] flex-col items-start gap-3 xl:items-end">
                    <div className="rounded-xl bg-muted px-4 py-2 text-sm text-muted-foreground">
                        {actionDisabled ? "Not available yet" : "Ready to attempt"}
                    </div>

                    {onAction && (
                        <button
                            onClick={onAction}
                            disabled={actionDisabled}
                            className={cn(
                                "rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90",
                                actionDisabled && "cursor-not-allowed opacity-50"
                            )}
                        >
                            {actionLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
