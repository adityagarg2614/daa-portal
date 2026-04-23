import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
    AlertCircle,
    ArrowRight,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Lock,
    type LucideIcon,
} from "lucide-react"

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

export function AssignmentCard({
    assignment,
    onAction,
    actionLabel = "View Details",
    actionDisabled = false,
    className,
}: AssignmentCardProps) {
    const statusConfig = getStatusConfig(assignment.status)

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
                                    {assignment.status}
                                </Badge>
                                <Badge variant="outline" className="rounded-full px-3 py-1">
                                    <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                                    {assignment.totalProblems} problems
                                </Badge>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                                    {assignment.title}
                                </h3>
                                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                                    {assignment.description}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-[22px] border border-border/60 bg-background/65 px-4 py-3 text-sm text-muted-foreground">
                            {actionDisabled
                                ? assignment.status === "Upcoming"
                                    ? "Unlocks when published"
                                    : "No longer open to start"
                                : assignment.status === "Completed"
                                  ? "Ready to review"
                                  : "Ready to attempt"}
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <InfoTile
                            icon={CalendarDays}
                            label="Published"
                            value={new Date(assignment.publishAt).toLocaleString()}
                        />
                        <InfoTile
                            icon={Clock3}
                            label="Due"
                            value={new Date(assignment.dueAt).toLocaleString()}
                        />
                        <InfoTile
                            icon={CheckCircle2}
                            label="Marks"
                            value={`${assignment.totalMarks} total`}
                        />
                        <InfoTile
                            icon={statusConfig.icon}
                            label="Availability"
                            value={statusConfig.helper}
                        />
                    </div>
                </div>

                <div className="flex min-w-[220px] flex-col items-start gap-3 xl:items-end">
                    {onAction && (
                        <button
                            onClick={onAction}
                            disabled={actionDisabled}
                            className={cn(
                                "inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-medium transition",
                                actionDisabled
                                    ? "cursor-not-allowed border border-border/60 bg-background text-muted-foreground opacity-70"
                                    : "bg-primary text-primary-foreground shadow-sm hover:opacity-90"
                            )}
                        >
                            {actionDisabled ? (
                                <Lock className="mr-2 h-4 w-4" />
                            ) : (
                                <ArrowRight className="mr-2 h-4 w-4" />
                            )}
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
        case "Active":
            return {
                badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
                line: "bg-linear-to-r from-emerald-500/70 via-emerald-500/20 to-transparent",
                icon: Clock3,
                helper: "Available now",
            }
        case "Upcoming":
            return {
                badge: "border-sky-500/20 bg-sky-500/10 text-sky-500",
                line: "bg-linear-to-r from-sky-500/70 via-sky-500/20 to-transparent",
                icon: CalendarDays,
                helper: "Opens later",
            }
        case "Completed":
            return {
                badge: "border-violet-500/20 bg-violet-500/10 text-violet-500",
                line: "bg-linear-to-r from-violet-500/70 via-violet-500/20 to-transparent",
                icon: CheckCircle2,
                helper: "Already submitted",
            }
        default:
            return {
                badge: "border-amber-500/20 bg-amber-500/10 text-amber-500",
                line: "bg-linear-to-r from-amber-500/70 via-amber-500/20 to-transparent",
                icon: AlertCircle,
                helper: "Closed",
            }
    }
}
