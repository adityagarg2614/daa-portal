"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AnnouncementCard } from "@/components/announcement-card";
import { AnnouncementDialog } from "@/components/announcement-dialog";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Bell,
    CalendarDays,
    Megaphone,
    Sparkles,
    Target,
    TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Announcement {
    _id: string;
    title: string;
    content: string;
    type: "general" | "assignment" | "event" | "urgent";
    priority: "low" | "medium" | "high";
    createdAt: string;
    createdBy?: {
        name: string;
    };
}

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState("all");
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const fetchAnnouncements = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                type: typeFilter,
                limit: "50",
            });

            const response = await fetch(`/api/student/announcements?${params}`);
            const data = await response.json();

            if (data.success) {
                setAnnouncements(data.data);
            } else {
                toast.error(data.message || "Failed to fetch announcements");
            }
        } catch (error) {
            console.error("Error fetching announcements:", error);
            toast.error("Failed to fetch announcements");
        } finally {
            setLoading(false);
        }
    }, [typeFilter]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchAnnouncements();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [fetchAnnouncements]);

    const insights = useMemo(() => {
        const urgentCount = announcements.filter((item) => item.type === "urgent").length;
        const assignmentCount = announcements.filter((item) => item.type === "assignment").length;
        const highPriorityCount = announcements.filter((item) => item.priority === "high").length;

        const headline =
            urgentCount > 0
                ? "Important updates need your attention."
                : announcements.length > 0
                    ? "Your latest academic updates are organized here."
                    : "Your announcement feed is calm right now.";

        return {
            urgentCount,
            assignmentCount,
            highPriorityCount,
            headline,
        };
    }, [announcements]);

    const handleCardClick = (announcement: Announcement) => {
        setSelectedAnnouncement(announcement);
        setDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
                <AnnouncementsDashboardSkeleton />
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
            <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-linear-to-br from-card via-card to-orange-500/8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(234,179,8,0.12),transparent_30%)]" />
                <div className="relative grid gap-8 px-5 py-6 sm:px-7 sm:py-7 xl:grid-cols-[1.35fr_0.95fr] xl:px-8">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-orange-500 shadow-none">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Announcement Feed
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                <Megaphone className="mr-1.5 h-3.5 w-3.5" />
                                Student updates and notices
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Stay on top of every Announcement
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                Important notices, assignment updates, events, and general messages
                                are collected here in a clearer timeline so you can spot what matters quickly.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                                    Feed Signal
                                </p>
                                <div className="mt-2 flex flex-wrap items-end gap-3">
                                    <span
                                        className={cn(
                                            "text-5xl font-black leading-none tracking-[-0.06em]",
                                            insights.urgentCount > 0 ? "text-orange-500" : "text-slate-400"
                                        )}
                                    >
                                        {insights.urgentCount}
                                    </span>
                                    <div className="mb-1 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground backdrop-blur">
                                        {insights.headline}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <HeroChip
                                    label="All Updates"
                                    value={String(announcements.length)}
                                    tone="slate"
                                />
                                <HeroChip
                                    label="Urgent"
                                    value={String(insights.urgentCount)}
                                    tone="amber"
                                />
                                <HeroChip
                                    label="Assignment"
                                    value={String(insights.assignmentCount)}
                                    tone="sky"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <SummaryPanel
                            icon={TriangleAlert}
                            label="High Priority"
                            value={String(insights.highPriorityCount)}
                            helper="Announcements marked as important"
                            tone="amber"
                        />
                        <SummaryPanel
                            icon={Target}
                            label="Assignment Notices"
                            value={String(insights.assignmentCount)}
                            helper="Posts linked to academic work"
                            tone="sky"
                        />
                        <SummaryPanel
                            icon={CalendarDays}
                            label="Recent Feed"
                            value={announcements.length > 0 ? "Active" : "Quiet"}
                            helper="Latest notices visible to students"
                            tone="emerald"
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <SnapshotCard
                    icon={Megaphone}
                    label="Total Updates"
                    value={String(announcements.length)}
                    helper="Visible announcements in the feed"
                    tone="sky"
                />
                <SnapshotCard
                    icon={TriangleAlert}
                    label="Urgent Notices"
                    value={String(insights.urgentCount)}
                    helper="Updates that should be read first"
                    tone="amber"
                />
                <SnapshotCard
                    icon={Bell}
                    label="High Priority"
                    value={String(insights.highPriorityCount)}
                    helper="Announcements marked important"
                    tone="emerald"
                />
            </section>

            <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Filter Feed
                        </p>
                        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                            Focus on the kind of updates you want to read
                        </h2>
                    </div>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="h-11 w-full rounded-2xl border-border/60 bg-background/80 shadow-sm sm:w-[220px]">
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="assignment">Assignment</SelectItem>
                            <SelectItem value="event">Event</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                        {announcements.length} {announcements.length === 1 ? "announcement" : "announcements"}
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                        {typeFilter === "all" ? "All types" : `${typeFilter} only`}
                    </Badge>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Announcement Cards
                        </p>
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Latest messages from your institute
                        </h2>
                    </div>
                </div>

                {announcements.length === 0 ? (
                    <EmptyState
                        title="No announcements right now"
                        description="There are no announcements at the moment. Check back later for updates."
                        icon={<Megaphone className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-60" />}
                        className="rounded-[28px] border-border/60 bg-card/70 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]"
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {announcements.map((announcement) => (
                            <AnnouncementCard
                                key={announcement._id}
                                {...announcement}
                                onClick={() => handleCardClick(announcement)}
                            />
                        ))}
                    </div>
                )}
            </section>

            <AnnouncementDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                announcement={selectedAnnouncement}
            />
        </div>
    );
}

function HeroChip({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone: "slate" | "amber" | "sky";
}) {
    const tones = {
        slate: "border-border/60 bg-background/70 text-foreground",
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-500",
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
    };

    return (
        <div className="rounded-2xl border border-border/60 bg-background/60 p-3 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {label}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-lg font-semibold tracking-tight">{value}</span>
                <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone])}>
                    Live
                </span>
            </div>
        </div>
    );
}

function SummaryPanel({
    icon: Icon,
    label,
    value,
    helper,
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    helper: string;
    tone: "amber" | "sky" | "emerald";
}) {
    const tones = {
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-500",
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
    };

    return (
        <div className="rounded-[24px] border border-border/60 bg-background/70 p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
                </div>
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border", tones[tone])}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function SnapshotCard({
    icon: Icon,
    label,
    value,
    helper,
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    helper: string;
    tone: "sky" | "amber" | "emerald";
}) {
    const tones = {
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-500",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
    };

    return (
        <div className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="mt-2 text-4xl font-black tracking-tighter text-foreground">
                        {value}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
                </div>
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border", tones[tone])}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function AnnouncementsDashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[32px] border bg-background p-6 shadow-sm sm:p-7">
                <div className="grid gap-8 xl:grid-cols-[1.35fr_0.95fr]">
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-3">
                            <Skeleton className="h-8 w-40 rounded-full" />
                            <Skeleton className="h-8 w-56 rounded-full" />
                        </div>
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-4/5" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-16 w-20" />
                            <div className="grid gap-3 sm:grid-cols-3">
                                <Skeleton className="h-20 rounded-2xl" />
                                <Skeleton className="h-20 rounded-2xl" />
                                <Skeleton className="h-20 rounded-2xl" />
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <Skeleton className="h-28 rounded-[24px]" />
                        <Skeleton className="h-28 rounded-[24px]" />
                        <Skeleton className="h-28 rounded-[24px]" />
                    </div>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <Skeleton className="h-32 rounded-[28px]" />
                <Skeleton className="h-32 rounded-[28px]" />
                <Skeleton className="h-32 rounded-[28px]" />
            </div>

            <div className="rounded-[28px] border bg-background p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-72" />
                    </div>
                    <Skeleton className="h-11 w-full rounded-2xl sm:w-[220px]" />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                    <Skeleton className="h-8 w-28 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, index) => (
                    <Skeleton key={index} className="h-56 rounded-[28px]" />
                ))}
            </div>
        </div>
    );
}
