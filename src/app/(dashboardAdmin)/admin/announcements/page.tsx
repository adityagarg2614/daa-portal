"use client"

import type { ComponentType } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { AnnouncementForm } from "@/components/admin/announcement-form"
import {
    BellRing,
    CalendarDays,
    Edit,
    Eye,
    EyeOff,
    Megaphone,
    MoreVertical,
    Plus,
    Search,
    Sparkles,
    Trash2,
    TriangleAlert,
} from "lucide-react"
import { toast } from "sonner"
import {
    formatRelativeTime,
    getPriorityColor,
    getPriorityLabel,
    getTypeColor,
    getTypeLabel,
    isExpired,
    isPublished,
} from "@/lib/announcement"
import { cn } from "@/lib/utils"

interface AnnouncementData {
    _id: string
    title: string
    content: string
    type: "general" | "assignment" | "event" | "urgent"
    priority: "low" | "medium" | "high"
    isActive: boolean
    publishAt?: string
    expiresAt?: string | null
    createdBy: {
        _id: string
        name: string
        email: string
    }
    createdAt: string
    updatedAt: string
}

interface PaginationData {
    currentPage: number
    totalPages: number
    totalAnnouncements: number
    hasNext: boolean
    hasPrev: boolean
}

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<AnnouncementData[]>([])
    const [pagination, setPagination] = useState<PaginationData>({
        currentPage: 1,
        totalPages: 0,
        totalAnnouncements: 0,
        hasNext: false,
        hasPrev: false,
    })
    const [loading, setLoading] = useState(true)
    const [formDialogOpen, setFormDialogOpen] = useState(false)
    const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementData | null>(null)
    const [typeFilter, setTypeFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [limit, setLimit] = useState(20)

    const fetchAnnouncements = useCallback(async () => {
        setLoading(true)

        try {
            const params = new URLSearchParams({
                page: pagination.currentPage.toString(),
                limit: limit.toString(),
                type: typeFilter,
                status: statusFilter,
            })

            const response = await fetch(`/api/admin/announcements?${params}`)
            const data = await response.json()

            if (data.success) {
                setAnnouncements(data.data.announcements)
                setPagination(data.data.pagination)
            } else {
                toast.error(data.message || "Failed to fetch announcements")
            }
        } catch (error) {
            console.error("Error fetching announcements:", error)
            toast.error("Failed to fetch announcements")
        } finally {
            setLoading(false)
        }
    }, [pagination.currentPage, limit, typeFilter, statusFilter])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchAnnouncements()
        }, 0)

        return () => window.clearTimeout(timer)
    }, [fetchAnnouncements])

    const filteredAnnouncements = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()

        return announcements.filter((announcement) => {
            if (!query) return true

            return (
                announcement.title.toLowerCase().includes(query) ||
                announcement.content.toLowerCase().includes(query) ||
                announcement.createdBy?.name?.toLowerCase().includes(query)
            )
        })
    }, [announcements, searchQuery])

    const insights = useMemo(() => {
        const activeCount = announcements.filter((item) => item.isActive).length
        const inactiveCount = announcements.length - activeCount
        const urgentCount = announcements.filter((item) => item.type === "urgent").length
        const highPriorityCount = announcements.filter((item) => item.priority === "high").length

        const headline =
            urgentCount > 0
                ? "Urgent notices are live, so this board needs a quick pass."
                : activeCount > 0
                    ? "Your notice board is active and ready for students."
                    : "The board is quiet right now and ready for the next update."

        return {
            activeCount,
            inactiveCount,
            urgentCount,
            highPriorityCount,
            headline,
        }
    }, [announcements])

    const handleCreate = () => {
        setEditingAnnouncement(null)
        setFormDialogOpen(true)
    }

    const handleEdit = (announcement: AnnouncementData) => {
        setEditingAnnouncement(announcement)
        setFormDialogOpen(true)
    }

    const handleDialogChange = (open: boolean) => {
        setFormDialogOpen(open)

        if (!open) {
            setEditingAnnouncement(null)
        }
    }

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) {
            return
        }

        try {
            const response = await fetch(`/api/admin/announcements/${id}`, {
                method: "DELETE",
            })
            const data = await response.json()

            if (data.success) {
                toast.success("Announcement deleted successfully")
                void fetchAnnouncements()
            } else {
                toast.error(data.message || "Failed to delete announcement")
            }
        } catch (error) {
            console.error("Error deleting announcement:", error)
            toast.error("Failed to delete announcement")
        }
    }

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const response = await fetch(`/api/admin/announcements/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus }),
            })
            const data = await response.json()

            if (data.success) {
                toast.success(
                    `Announcement ${!currentStatus ? "activated" : "deactivated"} successfully`
                )
                void fetchAnnouncements()
            } else {
                toast.error(data.message || "Failed to update announcement")
            }
        } catch (error) {
            console.error("Error toggling status:", error)
            toast.error("Failed to update announcement")
        }
    }

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({ ...prev, currentPage: page }))
    }

    const handleLimitChange = (newLimit: number) => {
        setLimit(newLimit)
        setPagination((prev) => ({ ...prev, currentPage: 1 }))
    }

    const resetFilters = () => {
        setSearchQuery("")
        setTypeFilter("all")
        setStatusFilter("all")
        setLimit(20)
        setPagination((prev) => ({ ...prev, currentPage: 1 }))
    }

    if (loading) {
        return (
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
                <AnnouncementsAdminSkeleton />
            </div>
        )
    }

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
            <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-linear-to-br from-card via-card to-rose-500/8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.12),transparent_30%)]" />
                <div className="relative grid gap-8 px-5 py-6 sm:px-7 sm:py-7 xl:grid-cols-[1.35fr_0.95fr] xl:px-8">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-rose-500 shadow-none">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Announcement Control
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                <Megaphone className="mr-1.5 h-3.5 w-3.5" />
                                Student-facing updates
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Manage the announcement board
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                Publish important notices, keep active updates visible, and tidy older
                                messages from one cleaner admin workspace.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                                    Board Signal
                                </p>
                                <div className="mt-2 flex flex-wrap items-end gap-3">
                                    <span
                                        className={cn(
                                            "text-5xl font-black leading-none tracking-[-0.06em]",
                                            insights.urgentCount > 0 ? "text-rose-500" : "text-slate-400"
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
                                    label="All Posts"
                                    value={String(pagination.totalAnnouncements)}
                                    tone="slate"
                                />
                                <HeroChip
                                    label="Active"
                                    value={String(insights.activeCount)}
                                    tone="emerald"
                                />
                                <HeroChip
                                    label="Urgent"
                                    value={String(insights.urgentCount)}
                                    tone="rose"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <SummaryPanel
                            icon={BellRing}
                            label="Live Notices"
                            value={String(insights.activeCount)}
                            helper="Announcements currently visible to students"
                            tone="emerald"
                        />
                        <SummaryPanel
                            icon={EyeOff}
                            label="Hidden Drafts"
                            value={String(insights.inactiveCount)}
                            helper="Posts that are paused from student view"
                            tone="slate"
                        />
                        <SummaryPanel
                            icon={TriangleAlert}
                            label="High Priority"
                            value={String(insights.highPriorityCount)}
                            helper="Updates marked for immediate attention"
                            tone="amber"
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <SnapshotCard
                    icon={Megaphone}
                    label="Total Announcements"
                    value={String(pagination.totalAnnouncements)}
                    helper="All created updates in the admin board"
                    tone="sky"
                />
                <SnapshotCard
                    icon={Eye}
                    label="Currently Visible"
                    value={String(insights.activeCount)}
                    helper="Posts students can read right now"
                    tone="emerald"
                />
                <SnapshotCard
                    icon={TriangleAlert}
                    label="Urgent Notices"
                    value={String(insights.urgentCount)}
                    helper="Messages tagged as urgent on this page"
                    tone="amber"
                />
            </section>

            <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Filter Board
                        </p>
                        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                            Find the exact announcement you want to manage
                        </h2>
                    </div>

                    <Button
                        onClick={handleCreate}
                        className="h-11 rounded-2xl px-5 shadow-sm xl:self-start"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Announcement
                    </Button>
                </div>

                <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.7fr))]">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search title, content, or creator..."
                            value={searchQuery}
                            onChange={(event) => {
                                setSearchQuery(event.target.value)
                                setPagination((prev) => ({ ...prev, currentPage: 1 }))
                            }}
                            className="h-11 rounded-2xl border-border/60 bg-background/80 pl-10 shadow-sm"
                        />
                    </div>

                    <Select
                        value={typeFilter}
                        onValueChange={(value) => {
                            setTypeFilter(value)
                            setPagination((prev) => ({ ...prev, currentPage: 1 }))
                        }}
                    >
                        <SelectTrigger className="h-11 rounded-2xl border-border/60 bg-background/80 shadow-sm">
                            <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="assignment">Assignment</SelectItem>
                            <SelectItem value="event">Event</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                            setStatusFilter(value)
                            setPagination((prev) => ({ ...prev, currentPage: 1 }))
                        }}
                    >
                        <SelectTrigger className="h-11 rounded-2xl border-border/60 bg-background/80 shadow-sm">
                            <SelectValue placeholder="All status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={limit.toString()}
                        onValueChange={(value) => handleLimitChange(Number.parseInt(value, 10))}
                    >
                        <SelectTrigger className="h-11 rounded-2xl border-border/60 bg-background/80 shadow-sm">
                            <SelectValue placeholder="Rows per page" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10 / page</SelectItem>
                            <SelectItem value="20">20 / page</SelectItem>
                            <SelectItem value="50">50 / page</SelectItem>
                            <SelectItem value="100">100 / page</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                        {filteredAnnouncements.length} {filteredAnnouncements.length === 1 ? "result" : "results"}
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                        {typeFilter === "all" ? "All types" : `${getTypeLabel(typeFilter)} only`}
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                        {statusFilter === "all" ? "All visibility" : `${statusFilter} only`}
                    </Badge>
                    {(searchQuery || typeFilter !== "all" || statusFilter !== "all" || limit !== 20) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
                            className="h-8 rounded-full px-3 text-xs"
                        >
                            Reset filters
                        </Button>
                    )}
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Announcement Cards
                        </p>
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Review, edit, and control notice visibility
                        </h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Page {pagination.currentPage} of {Math.max(pagination.totalPages, 1)}
                    </p>
                </div>

                {filteredAnnouncements.length === 0 ? (
                    <EmptyState
                        title={searchQuery ? "No announcements match this search" : "No announcements yet"}
                        description={
                            searchQuery
                                ? "Try a different keyword or reset the filters to see more results."
                                : "Create the first announcement to start sharing updates with students."
                        }
                        action={
                            <Button onClick={searchQuery ? resetFilters : handleCreate} className="rounded-2xl px-5">
                                {searchQuery ? "Clear filters" : "Create Announcement"}
                            </Button>
                        }
                        icon={<Megaphone className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-60" />}
                        className="rounded-[28px] border-border/60 bg-card/70 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]"
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {filteredAnnouncements.map((announcement) => (
                            <AnnouncementAdminCard
                                key={announcement._id}
                                announcement={announcement}
                                onEdit={() => handleEdit(announcement)}
                                onToggle={() =>
                                    handleToggleStatus(announcement._id, announcement.isActive)
                                }
                                onDelete={() =>
                                    handleDelete(announcement._id, announcement.title)
                                }
                            />
                        ))}
                    </div>
                )}
            </section>

            {!loading && pagination.totalPages > 1 && (
                <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                                Showing {(pagination.currentPage - 1) * limit + 1} to{" "}
                                {Math.min(pagination.currentPage * limit, pagination.totalAnnouncements)} of{" "}
                                {pagination.totalAnnouncements} announcements
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Move through the board without losing your filters.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                className="rounded-2xl"
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={!pagination.hasPrev}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-2xl"
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={!pagination.hasNext}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </section>
            )}

            <Dialog open={formDialogOpen} onOpenChange={handleDialogChange}>
                <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-[28px] border border-border/60 bg-background/95 p-0 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.75)]">
                    <DialogHeader className="border-b border-border/60 px-6 py-5 sm:px-7">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-rose-500 shadow-none">
                                <Megaphone className="mr-1.5 h-3.5 w-3.5" />
                                {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
                            </Badge>
                        </div>
                        <DialogTitle className="text-2xl font-semibold tracking-tight">
                            {editingAnnouncement
                                ? "Refine the message before it goes live"
                                : "Draft a clear update for students"}
                        </DialogTitle>
                        <DialogDescription className="max-w-2xl text-sm leading-6">
                            Keep the message short, scannable, and easy to act on. Type, priority,
                            and visibility can all be adjusted here.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 py-6 sm:px-7">
                        <AnnouncementForm
                            key={editingAnnouncement?._id ?? "create-announcement"}
                            announcement={editingAnnouncement}
                            onSuccess={() => {
                                handleDialogChange(false)
                                void fetchAnnouncements()
                            }}
                            onCancel={() => handleDialogChange(false)}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function AnnouncementAdminCard({
    announcement,
    onEdit,
    onToggle,
    onDelete,
}: {
    announcement: AnnouncementData
    onEdit: () => void
    onToggle: () => void
    onDelete: () => void
}) {
    const timeAgo = formatRelativeTime(new Date(announcement.createdAt))
    const status = getAnnouncementStatus(announcement)
    const accentTone =
        announcement.priority === "high"
            ? "from-rose-500/70 via-rose-500/20 to-transparent"
            : announcement.type === "assignment"
                ? "from-sky-500/70 via-sky-500/20 to-transparent"
                : "from-orange-500/70 via-orange-500/20 to-transparent"

    return (
        <article className="group relative overflow-hidden rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_24px_56px_-32px_rgba(0,0,0,0.55)] sm:p-6">
            <div
                className={cn("absolute inset-x-0 top-0 h-px bg-linear-to-r opacity-80", accentTone)}
                aria-hidden="true"
            />

            <div className="flex items-start justify-between gap-3">
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            <BellRing className="mr-1.5 h-3.5 w-3.5" />
                            #{announcement._id.slice(-4)}
                        </Badge>
                        <Badge
                            className={`${getTypeColor(announcement.type)} rounded-full border-transparent text-white`}
                        >
                            {getTypeLabel(announcement.type)}
                        </Badge>
                        <Badge
                            className={`${getPriorityColor(announcement.priority)} rounded-full border-transparent text-white`}
                        >
                            {getPriorityLabel(announcement.priority)}
                        </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge
                            variant="outline"
                            className={cn(
                                "rounded-full px-3 py-1",
                                status.tone
                            )}
                        >
                            {status.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{timeAgo}</span>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open actions</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-2xl">
                        <DropdownMenuItem onClick={onEdit}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onToggle}>
                            {announcement.isActive ? (
                                <>
                                    <EyeOff className="mr-2 h-4 w-4" />
                                    Deactivate
                                </>
                            ) : (
                                <>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Activate
                                </>
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="mt-5 space-y-3">
                <h3 className="text-2xl font-semibold tracking-tight line-clamp-2">
                    {announcement.title}
                </h3>
                <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">
                    {announcement.content}
                </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MetaPanel
                    icon={CalendarDays}
                    label="Created"
                    value={new Date(announcement.createdAt).toLocaleDateString()}
                />
                <MetaPanel
                    icon={BellRing}
                    label="Posted by"
                    value={announcement.createdBy?.name || "Admin"}
                />
                <MetaPanel
                    icon={announcement.isActive ? Eye : EyeOff}
                    label="Visibility"
                    value={announcement.isActive ? "Visible" : "Hidden"}
                />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                <p className="text-xs text-muted-foreground">
                    Updated {formatRelativeTime(new Date(announcement.updatedAt))}
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-full px-4" onClick={onEdit}>
                        <Edit className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-full px-4" onClick={onToggle}>
                        {announcement.isActive ? "Hide" : "Show"}
                    </Button>
                </div>
            </div>
        </article>
    )
}

function MetaPanel({
    icon: Icon,
    label,
    value,
}: {
    icon: ComponentType<{ className?: string }>
    label: string
    value: string
}) {
    return (
        <div className="rounded-[22px] border border-border/60 bg-background/60 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-[0.18em]">
                    {label}
                </span>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground line-clamp-2">{value}</p>
        </div>
    )
}

function HeroChip({
    label,
    value,
    tone,
}: {
    label: string
    value: string
    tone: "slate" | "emerald" | "rose"
}) {
    const tones = {
        slate: "border-border/60 bg-background/70 text-foreground",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        rose: "border-rose-500/20 bg-rose-500/10 text-rose-500",
    }

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
    )
}

function SummaryPanel({
    icon: Icon,
    label,
    value,
    helper,
    tone,
}: {
    icon: ComponentType<{ className?: string }>
    label: string
    value: string
    helper: string
    tone: "amber" | "emerald" | "slate"
}) {
    const tones = {
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-500",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        slate: "border-border/60 bg-background/70 text-foreground",
    }

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
    )
}

function SnapshotCard({
    icon: Icon,
    label,
    value,
    helper,
    tone,
}: {
    icon: ComponentType<{ className?: string }>
    label: string
    value: string
    helper: string
    tone: "sky" | "amber" | "emerald"
}) {
    const tones = {
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-500",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
    }

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
    )
}

function AnnouncementsAdminSkeleton() {
    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[32px] border bg-background p-6 shadow-sm sm:p-7">
                <div className="grid gap-8 xl:grid-cols-[1.35fr_0.95fr]">
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-3">
                            <Skeleton className="h-8 w-40 rounded-full" />
                            <Skeleton className="h-8 w-48 rounded-full" />
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
                    <Skeleton className="h-11 w-full rounded-2xl xl:w-52" />
                </div>
                <div className="mt-5 grid gap-3 xl:grid-cols-4">
                    <Skeleton className="h-11 rounded-2xl xl:col-span-1" />
                    <Skeleton className="h-11 rounded-2xl" />
                    <Skeleton className="h-11 rounded-2xl" />
                    <Skeleton className="h-11 rounded-2xl" />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                    <Skeleton className="h-8 w-28 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-8 w-32 rounded-full" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {[...Array(4)].map((_, index) => (
                    <Skeleton key={index} className="h-[360px] rounded-[28px]" />
                ))}
            </div>
        </div>
    )
}

function getAnnouncementStatus(announcement: AnnouncementData) {
    if (!announcement.isActive) {
        return {
            label: "Hidden",
            tone: "border-border/60 bg-background/70 text-foreground",
        }
    }

    if (announcement.publishAt && !isPublished(new Date(announcement.publishAt))) {
        return {
            label: "Scheduled",
            tone: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        }
    }

    if (announcement.expiresAt && isExpired(new Date(announcement.expiresAt))) {
        return {
            label: "Expired",
            tone: "border-amber-500/20 bg-amber-500/10 text-amber-500",
        }
    }

    return {
        label: "Live",
        tone: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
    }
}
