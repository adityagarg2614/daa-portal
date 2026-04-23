"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
    ArrowUpRight,
    BookMarked,
    CheckCircle2,
    CircleAlert,
    Medal,
    Sparkles,
} from "lucide-react"

interface Result {
    id: string
    assignmentTitle: string
    subject: string
    totalProblems: number
    submittedProblems: number
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

export function ResultCard({
    result,
    onAction,
    actionLabel = "View Detailed Result",
    className,
}: ResultCardProps) {
    const statusStyles = getStatusStyles(result.status)
    const completion = result.totalProblems
        ? Math.round((result.submittedProblems / result.totalProblems) * 100)
        : 0

    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_30px_60px_-34px_rgba(0,0,0,0.6)] sm:p-6",
                className
            )}
            role="listitem"
        >
            <div className={cn("absolute inset-x-0 top-0 h-1.5", statusStyles.bar)} />
            <div className={cn("absolute right-0 top-0 h-28 w-28 rounded-full blur-3xl", statusStyles.glow)} />

            <div className="relative flex flex-col gap-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge
                                variant="outline"
                                className={cn(
                                    "rounded-full border px-3 py-1 font-medium",
                                    statusStyles.badge
                                )}
                            >
                                <statusStyles.icon className="mr-1.5 h-3.5 w-3.5" />
                                {result.status}
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                <BookMarked className="mr-1.5 h-3.5 w-3.5" />
                                {result.subject}
                            </Badge>
                        </div>

                        <div>
                            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                                {result.assignmentTitle}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Evaluated on {result.evaluatedAt}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-start rounded-[24px] border border-border/60 bg-background/70 px-4 py-3 shadow-sm">
                        <div
                            className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-2xl border",
                                statusStyles.badge
                            )}
                        >
                            <Medal className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                Score
                            </p>
                            <p className="text-2xl font-black tracking-[-0.04em] text-foreground">
                                {result.obtainedMarks}/{result.totalMarks}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <MetricTile
                            label="Percentage"
                            value={`${result.percentage}%`}
                            hint="Overall performance"
                            tone={statusStyles.metric}
                        />
                        <MetricTile
                            label="Problems Solved"
                            value={`${result.submittedProblems}/${result.totalProblems}`}
                            hint={`${completion}% completion`}
                            tone="sky"
                        />
                        <MetricTile
                            label="Marks Secured"
                            value={`${result.obtainedMarks}`}
                            hint={`Out of ${result.totalMarks}`}
                            tone="violet"
                        />
                    </div>

                    <div className="rounded-[24px] border border-border/60 bg-background/65 p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                    Completion
                                </p>
                                <p className="mt-2 text-lg font-semibold">{completion}% of problems submitted</p>
                            </div>
                            <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>

                        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    statusStyles.progress
                                )}
                                style={{ width: `${completion}%` }}
                            />
                        </div>

                        {onAction && (
                            <button
                                onClick={onAction}
                                className={cn(
                                    "mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all hover:shadow-md",
                                    statusStyles.badge
                                )}
                            >
                                <Sparkles className="h-4 w-4" />
                                {actionLabel}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function MetricTile({
    label,
    value,
    hint,
    tone,
}: {
    label: string
    value: string
    hint: string
    tone: "emerald" | "sky" | "amber" | "rose" | "violet"
}) {
    const toneClass = {
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-500",
        rose: "border-rose-500/20 bg-rose-500/10 text-rose-500",
        violet: "border-violet-500/20 bg-violet-500/10 text-violet-500",
    }

    return (
        <div className="rounded-[24px] border border-border/60 bg-background/65 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {label}
            </p>
            <div className="mt-3 flex items-end justify-between gap-3">
                <span className="text-3xl font-black tracking-[-0.04em] text-foreground">
                    {value}
                </span>
                <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", toneClass[tone])}>
                    Live
                </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
        </div>
    )
}

function getStatusStyles(status: string) {
    switch (status) {
        case "Excellent":
            return {
                bar: "bg-emerald-500",
                glow: "bg-emerald-500/15",
                badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
                progress: "bg-emerald-500",
                metric: "emerald" as const,
                icon: CheckCircle2,
            }
        case "Good":
            return {
                bar: "bg-sky-500",
                glow: "bg-sky-500/15",
                badge: "border-sky-500/20 bg-sky-500/10 text-sky-500",
                progress: "bg-sky-500",
                metric: "sky" as const,
                icon: Sparkles,
            }
        case "Average":
            return {
                bar: "bg-amber-500",
                glow: "bg-amber-500/15",
                badge: "border-amber-500/20 bg-amber-500/10 text-amber-500",
                progress: "bg-amber-500",
                metric: "amber" as const,
                icon: CircleAlert,
            }
        default:
            return {
                bar: "bg-rose-500",
                glow: "bg-rose-500/15",
                badge: "border-rose-500/20 bg-rose-500/10 text-rose-500",
                progress: "bg-rose-500",
                metric: "rose" as const,
                icon: CircleAlert,
            }
    }
}
