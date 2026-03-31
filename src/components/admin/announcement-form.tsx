"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Announcement {
    _id: string;
    title: string;
    content: string;
    type: "general" | "assignment" | "event" | "urgent";
    priority: "low" | "medium" | "high";
    isActive: boolean;
    publishAt: string;
    expiresAt: string | null;
}

interface AnnouncementFormProps {
    announcement: Announcement | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export function AnnouncementForm({
    announcement,
    onSuccess,
    onCancel,
}: AnnouncementFormProps) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [type, setType] = useState<"general" | "assignment" | "event" | "urgent">("general");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [isActive, setIsActive] = useState(true);
    const [publishAt, setPublishAt] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Populate form when editing
    useEffect(() => {
        if (announcement) {
            setTitle(announcement.title);
            setContent(announcement.content);
            setType(announcement.type);
            setPriority(announcement.priority);
            setIsActive(announcement.isActive);
            // Format datetime for input
            const publishDate = new Date(announcement.publishAt);
            const publishLocal = new Date(publishDate.getTime() - publishDate.getTimezoneOffset() * 60000);
            setPublishAt(publishLocal.toISOString().slice(0, 16));

            if (announcement.expiresAt) {
                const expiryDate = new Date(announcement.expiresAt);
                const expiryLocal = new Date(expiryDate.getTime() - expiryDate.getTimezoneOffset() * 60000);
                setExpiresAt(expiryLocal.toISOString().slice(0, 16));
            } else {
                setExpiresAt("");
            }
        } else {
            // Default values for new announcement
            const now = new Date();
            const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
            setPublishAt(local.toISOString().slice(0, 16));
            setExpiresAt("");
        }
    }, [announcement]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        // Validation
        if (title.length < 5 || title.length > 100) {
            toast.error("Title must be between 5 and 100 characters");
            setSubmitting(false);
            return;
        }

        if (content.length < 10 || content.length > 1000) {
            toast.error("Content must be between 10 and 1000 characters");
            setSubmitting(false);
            return;
        }

        const publishDate = new Date(publishAt);
        if (publishDate < new Date()) {
            toast.error("Publish date cannot be in the past");
            setSubmitting(false);
            return;
        }

        if (expiresAt) {
            const expiryDate = new Date(expiresAt);
            if (expiryDate <= publishDate) {
                toast.error("Expiry date must be after publish date");
                setSubmitting(false);
                return;
            }
        }

        try {
            const url = announcement
                ? `/api/admin/announcements/${announcement._id}`
                : "/api/admin/announcements";

            const method = announcement ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    content,
                    type,
                    priority,
                    isActive,
                    publishAt: publishAt,
                    expiresAt: expiresAt || null,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(
                    announcement
                        ? "Announcement updated successfully"
                        : "Announcement created successfully"
                );
                onSuccess();
            } else {
                toast.error(data.message || "Failed to save announcement");
            }
        } catch (error) {
            console.error("Error saving announcement:", error);
            toast.error("Failed to save announcement");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter announcement title"
                    disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                    {title.length}/100 characters
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter announcement content"
                    className="min-h-[150px]"
                    disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                    {content.length}/1000 characters
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                        value={type}
                        onValueChange={(val) =>
                            setType(val as "general" | "assignment" | "event" | "urgent")
                        }
                        disabled={submitting}
                    >
                        <SelectTrigger id="type">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="assignment">Assignment</SelectItem>
                            <SelectItem value="event">Event</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                        value={priority}
                        onValueChange={(val) =>
                            setPriority(val as "low" | "medium" | "high")
                        }
                        disabled={submitting}
                    >
                        <SelectTrigger id="priority">
                            <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="publishAt">Publish At</Label>
                    <Input
                        id="publishAt"
                        type="datetime-local"
                        value={publishAt}
                        onChange={(e) => setPublishAt(e.target.value)}
                        disabled={submitting}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                    <Input
                        id="expiresAt"
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        placeholder="Optional"
                        disabled={submitting}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                    <Label htmlFor="isActive">Active Status</Label>
                    <p className="text-xs text-muted-foreground">
                        {isActive ? "Visible to students" : "Hidden from students"}
                    </p>
                </div>
                <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    disabled={submitting}
                />
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                    {submitting
                        ? "Saving..."
                        : announcement
                            ? "Update Announcement"
                            : "Create Announcement"}
                </Button>
            </div>
        </form>
    );
}
