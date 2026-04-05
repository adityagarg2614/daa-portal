"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import { StatsCard } from "@/components/ui/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Megaphone,
    Plus,
    MoreVertical,
    Edit,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Search,
} from "lucide-react";
import { toast } from "sonner";
import {
    getTypeColor,
    getTypeLabel,
    getPriorityColor,
    getPriorityLabel,
    isExpired,
    isPublished,
} from "@/lib/announcement";
import { AnnouncementForm } from "@/components/admin/announcement-form";

interface Announcement {
    _id: string;
    title: string;
    content: string;
    type: "general" | "assignment" | "event" | "urgent";
    priority: "low" | "medium" | "high";
    isActive: boolean;
    publishAt: string;
    expiresAt: string | null;
    createdBy: {
        _id: string;
        name: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface PaginationData {
    currentPage: number;
    totalPages: number;
    totalAnnouncements: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({
        currentPage: 1,
        totalPages: 0,
        totalAnnouncements: 0,
        hasNext: false,
        hasPrev: false,
    });
    const [loading, setLoading] = useState(true);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

    // Filter states
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [limit, setLimit] = useState(20);

    // Fetch announcements
    const fetchAnnouncements = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.currentPage.toString(),
                limit: limit.toString(),
                type: typeFilter,
                status: statusFilter,
            });

            const response = await fetch(`/api/admin/announcements?${params}`);
            const data = await response.json();

            if (data.success) {
                setAnnouncements(data.data.announcements);
                setPagination(data.data.pagination);
            } else {
                toast.error(data.message || "Failed to fetch announcements");
            }
        } catch (error) {
            console.error("Error fetching announcements:", error);
            toast.error("Failed to fetch announcements");
        } finally {
            setLoading(false);
        }
    }, [pagination.currentPage, limit, typeFilter, statusFilter]);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    // Handlers
    const handleCreate = () => {
        setEditingAnnouncement(null);
        setFormDialogOpen(true);
    };

    const handleEdit = (announcement: Announcement) => {
        setEditingAnnouncement(announcement);
        setFormDialogOpen(true);
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/announcements/${id}`, {
                method: "DELETE",
            });
            const data = await response.json();

            if (data.success) {
                toast.success("Announcement deleted successfully");
                fetchAnnouncements();
            } else {
                toast.error(data.message || "Failed to delete announcement");
            }
        } catch (error) {
            console.error("Error deleting announcement:", error);
            toast.error("Failed to delete announcement");
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const response = await fetch(`/api/admin/announcements/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            const data = await response.json();

            if (data.success) {
                toast.success(
                    `Announcement ${!currentStatus ? "activated" : "deactivated"} successfully`
                );
                fetchAnnouncements();
            } else {
                toast.error(data.message || "Failed to update announcement");
            }
        } catch (error) {
            console.error("Error toggling status:", error);
            toast.error("Failed to update announcement");
        }
    };

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({ ...prev, currentPage: page }));
    };

    const handleLimitChange = (newLimit: number) => {
        setLimit(newLimit);
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    // Filter announcements by search query (client-side)
    const filteredAnnouncements = announcements.filter(
        (announcement) =>
            announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate stats
    const activeCount = announcements.filter((a) => a.isActive).length;
    const upcomingCount = announcements.filter(
        (a) => !isPublished(new Date(a.publishAt))
    ).length;
    const expiredCount = announcements.filter((a) =>
        isExpired(a.expiresAt ? new Date(a.expiresAt) : null)
    ).length;

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <SectionHeader
                title="Announcements"
                description="Create and manage announcements for students"
                icon={Megaphone}
                action={
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create New
                    </Button>
                }
            />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatsCard
                    icon={Megaphone}
                    title="Total Announcements"
                    value={pagination.totalAnnouncements}
                    subtitle="All announcements"
                />
                <StatsCard
                    icon={ToggleRight}
                    title="Active Now"
                    value={activeCount}
                    subtitle="Currently visible"
                />
                <StatsCard
                    icon={Megaphone}
                    title="Upcoming"
                    value={upcomingCount}
                    subtitle="Scheduled to publish"
                />
                <StatsCard
                    icon={ToggleLeft}
                    title="Expired"
                    value={expiredCount}
                    subtitle="Past expiry date"
                />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search announcements..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="pl-9"
                        />
                    </div>
                    <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setPagination(prev => ({ ...prev, currentPage: 1 })); }}>
                        <SelectTrigger className="w-full sm:w-[150px]">
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
                    <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPagination(prev => ({ ...prev, currentPage: 1 })); }}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Select value={limit.toString()} onValueChange={(val) => handleLimitChange(parseInt(val))}>
                    <SelectTrigger className="w-full sm:w-[120px]">
                        <SelectValue placeholder="Limit" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10 / page</SelectItem>
                        <SelectItem value="20">20 / page</SelectItem>
                        <SelectItem value="50">50 / page</SelectItem>
                        <SelectItem value="100">100 / page</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Publish Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    Loading announcements...
                                </TableCell>
                            </TableRow>
                        ) : filteredAnnouncements.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    {searchQuery
                                        ? "No announcements match your search."
                                        : "No announcements found. Create one to get started!"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAnnouncements.map((announcement) => (
                                <TableRow key={announcement._id}>
                                    <TableCell className="font-medium max-w-[300px]">
                                        <div className="truncate">{announcement.title}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={`${getTypeColor(announcement.type)} text-white border-transparent`}
                                        >
                                            {getTypeLabel(announcement.type)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={`${getPriorityColor(announcement.priority)} text-white border-transparent`}
                                        >
                                            {getPriorityLabel(announcement.priority)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(announcement.publishAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={announcement.isActive ? "success" : "outline"}>
                                            {announcement.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(announcement)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleToggleStatus(announcement._id, announcement.isActive)
                                                    }
                                                >
                                                    {announcement.isActive ? (
                                                        <>
                                                            <ToggleLeft className="mr-2 h-4 w-4" />
                                                            Deactivate
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ToggleRight className="mr-2 h-4 w-4" />
                                                            Activate
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() =>
                                                        handleDelete(announcement._id, announcement.title)
                                                    }
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        Showing {(pagination.currentPage - 1) * limit + 1} to{" "}
                        {Math.min(pagination.currentPage * limit, pagination.totalAnnouncements)} of{" "}
                        {pagination.totalAnnouncements} announcements
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={!pagination.hasPrev}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={!pagination.hasNext}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
                        </DialogTitle>
                    </DialogHeader>
                    <AnnouncementForm
                        announcement={editingAnnouncement}
                        onSuccess={() => {
                            setFormDialogOpen(false);
                            fetchAnnouncements();
                        }}
                        onCancel={() => setFormDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
