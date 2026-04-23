import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
    CheckCircle2,
    Clock3,
    Code2,
    FileCode2,
    Trophy,
    type LucideIcon,
} from "lucide-react"

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

export function SubmissionCard({
    submission,
    onAction,
    actionLabel = "View Details",
    className,
}: SubmissionCardProps) {
    const statusConfig = getStatusConfig(submission.status)

    return (
        <article
            className={cn(
                "group relative overflow-hidden rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_24px_56px_-32px_rgba(0,0,0,0.55)] sm:p-6",
                className
            )}
            role="listitem"
        >
            <div
                className={cn(
                    "absolute inset-x-0 top-0 h-px opacity-80",
                    statusConfig.line
                )}
                aria-hidden="true"
            />

            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className={cn("rounded-full px-3 py-1", statusConfig.badge)}
                                >
                                    <statusConfig.icon className="mr-1.5 h-3.5 w-3.5" />
                                    {submission.status}
                                </Badge>
                                <Badge variant="outline" className="rounded-full px-3 py-1">
                                    <Code2 className="mr-1.5 h-3.5 w-3.5" />
                                    {submission.language}
                                </Badge>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                                    {submission.assignmentId?.title}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    Problem: {submission.problemId?.title}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-[22px] border border-border/60 bg-background/65 px-4 py-3 text-sm text-muted-foreground">
                            {submission.status === "Evaluated"
                                ? "Reviewed and scored"
                                : submission.status === "Submitted"
                                  ? "Waiting for evaluation"
                                  : "Draft attempt recorded"}
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <InfoTile
                            icon={Code2}
                            label="Language"
                            value={submission.language}
                        />
                        <InfoTile
                            icon={FileCode2}
                            label="Submitted"
                            value={submission.submittedAt
                                ? new Date(submission.submittedAt).toLocaleString()
                                : "Not submitted yet"}
                        />
                        <InfoTile
                            icon={Clock3}
                            label="Assignment Due"
                            value={submission.assignmentId?.dueAt
                                ? new Date(submission.assignmentId.dueAt).toLocaleString()
                                : "No due date"}
                        />
                        <InfoTile
                            icon={Trophy}
                            label="Score"
                            value={submission.status === "Evaluated"
                                ? String(submission.score ?? 0)
                                : "Pending"}
                        />
                    </div>
                </div>

                <div className="flex min-w-[190px] flex-col items-start gap-3 xl:items-end">
                    <div
                        className={cn(
                            "rounded-2xl border px-4 py-2 text-sm font-semibold",
                            submission.status === "Evaluated"
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                                : "border-border/60 bg-background text-muted-foreground"
                        )}
                    >
                        {submission.status === "Evaluated"
                            ? `Score: ${submission.score ?? 0}`
                            : "Awaiting result"}
                    </div>

                    {onAction && (
                        <button
                            onClick={onAction}
                            className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                        >
                            {actionLabel}
                        </button>
                    )}
                </div>
            </div>
        </article>
    )
}

function InfoTile({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon
    label: string
    value: string
}) {
    return (
        <div className="rounded-[22px] border border-border/60 bg-background/65 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
            </div>
            <p className="mt-3 text-sm font-medium leading-6 text-foreground">{value}</p>
        </div>
    )
}

function getStatusConfig(status: string) {
    switch (status) {
        case "Attempted":
            return {
                badge: "border-amber-500/20 bg-amber-500/10 text-amber-500",
                line: "bg-linear-to-r from-amber-500/70 via-amber-500/20 to-transparent",
                icon: Clock3,
            }
        case "Submitted":
            return {
                badge: "border-sky-500/20 bg-sky-500/10 text-sky-500",
                line: "bg-linear-to-r from-sky-500/70 via-sky-500/20 to-transparent",
                icon: FileCode2,
            }
        default:
            return {
                badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
                line: "bg-linear-to-r from-emerald-500/70 via-emerald-500/20 to-transparent",
                icon: CheckCircle2,
            }
    }
}
