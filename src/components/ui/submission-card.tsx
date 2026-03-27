import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface Submission {
    _id: string
    assignmentId: {
        _id: string
        title: string
        dueAt?: string
    }
    problemId: {
        _id: string
        title: string
    }
    language: string
    status: string
    score?: number
    submittedAt?: string
}

interface SubmissionCardProps {
    submission: Submission
    onAction?: () => void
    actionLabel?: string
    className?: string
}

/**
 * SubmissionCard - A reusable card for displaying submission information
 * Used in student submissions page
 */
export function SubmissionCard({
    submission,
    onAction,
    actionLabel = "View Details",
    className,
}: SubmissionCardProps) {
    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case "Attempted":
                return "secondary"
            case "Submitted":
                return "default"
            case "Evaluated":
                return "outline"
            default:
                return "default"
        }
    }

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
                    submission.status === "Attempted" && "bg-yellow-500",
                    submission.status === "Submitted" && "bg-blue-500",
                    submission.status === "Evaluated" && "bg-green-500"
                )}
                aria-hidden="true"
            />

            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold">
                            {submission.assignmentId?.title}
                        </h2>
                        <Badge variant={getStatusVariant(submission.status)} className="gap-1">
                            {submission.status}
                        </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Problem: {submission.problemId?.title}
                    </p>

                    <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-3">
                        <div>
                            <span className="font-medium text-foreground">Language:</span>{" "}
                            {submission.language}
                        </div>
                        <div>
                            <span className="font-medium text-foreground">Submitted:</span>{" "}
                            {submission.submittedAt
                                ? new Date(submission.submittedAt).toLocaleString()
                                : "N/A"}
                        </div>
                        <div>
                            <span className="font-medium text-foreground">Due:</span>{" "}
                            {submission.assignmentId?.dueAt
                                ? new Date(submission.assignmentId.dueAt).toLocaleString()
                                : "N/A"}
                        </div>
                    </div>
                </div>

                <div className="flex min-w-[180px] flex-col items-start gap-3 xl:items-end">
                    <div className="rounded-xl bg-muted px-4 py-2 text-sm font-semibold">
                        Score: {submission.score ?? 0}
                    </div>

                    {onAction && (
                        <button
                            onClick={onAction}
                            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                        >
                            {actionLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
