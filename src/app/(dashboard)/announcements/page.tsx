"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import { AnnouncementCard } from "@/components/announcement-card";
import { AnnouncementDialog } from "@/components/announcement-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";

interface Announcement {
    _id: string;
    title: string;
    content: string;
    type: "general" | "assignment" | "event" | "urgent";
    priority: "low" | "medium" | "high";
    publishAt: string;
    expiresAt: string | null;
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

    // Fetch announcements
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
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const handleCardClick = (announcement: Announcement) => {
        setSelectedAnnouncement(announcement);
        setDialogOpen(true);
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <SectionHeader
                title="Announcements & Updates"
                description="Stay informed with the latest announcements from your professors"
                icon={Megaphone}
            />

            {/* Filters */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {announcements.length} {announcements.length === 1 ? "announcement" : "announcements"} found
                </p>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
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

            {/* Announcements Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="h-48 rounded-xl bg-muted animate-pulse"
                        />
                    ))}
                </div>
            ) : announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Megaphone className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Announcements</h3>
                    <p className="text-muted-foreground max-w-md">
                        There are no announcements at the moment. Check back later for updates!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {announcements.map((announcement) => (
                        <AnnouncementCard
                            key={announcement._id}
                            {...announcement}
                            onClick={() => handleCardClick(announcement)}
                        />
                    ))}
                </div>
            )}

            {/* Detail Dialog */}
            <AnnouncementDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                announcement={selectedAnnouncement}
            />
        </div>
    );
}
