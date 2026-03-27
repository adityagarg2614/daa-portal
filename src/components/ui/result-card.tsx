import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface Result {
    id: number
    assignmentTitle: string
    subject: string
    totalProblems: number
    obtainedMarks: number
    totalMarks: number
    percentage: number
    evaluatedAt: string
    status: string
}

interface ResultCardProps {
    result: Result
    onAction?: () => void
    actionLabel?: string
    className?: string
}

/**
 * ResultCard - A reusable card for displaying result/grade information
 * Used in student results page
 */
export function ResultCard({
    result,
    onAction,
    actionLabel = "View Detailed Result",
    className,
}: ResultCardProps) {
    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case "Excellent":
                return "outline"
            case "Good":
                return "secondary"
            case "Average":
                return "default"
            case "Needs Improvement":
                return "destructive"
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
                    result.status === "Excellent" && "bg-green-500",
                    result.status === "Good" && "bg-blue-500",
                    result.status === "Average" && "bg-yellow-500",
                    result.status === "Needs Improvement" && "bg-red-500"
                )}
                aria-hidden="true"
            />

            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold">{result.assignmentTitle}</h2>
                        <Badge variant={getStatusVariant(result.status)} className="gap-1">
                            {result.status}
                        </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">{result.subject}</p>

                    <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                        <div>
                            <span className="font-medium text-foreground">Problems:</span>{" "}
                            {result.totalProblems}
                        </div>
                        <div>
                            <span className="font-medium text-foreground">Marks:</span>{" "}
                            {result.obtainedMarks}/{result.totalMarks}
                        </div>
                        <div>
                            <span className="font-medium text-foreground">Percentage:</span>{" "}
                            {result.percentage}%
                        </div>
                        <div>
                            <span className="font-medium text-foreground">Evaluated:</span>{" "}
                            {result.evaluatedAt}
                        </div>
                    </div>
                </div>

                <div className="flex min-w-[180px] flex-col items-start gap-3 xl:items-end">
                    <div className="rounded-xl bg-muted px-4 py-2 text-sm font-semibold">
                        Score: {result.obtainedMarks}/{result.totalMarks}
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
