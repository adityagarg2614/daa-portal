"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    getTypeColor,
    getTypeLabel,
    getPriorityColor,
    getPriorityLabel,
    formatRelativeTime,
} from "@/lib/announcement";

interface AnnouncementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    announcement: {
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
    } | null;
}

export function AnnouncementDialog({
    open,
    onOpenChange,
    announcement,
}: AnnouncementDialogProps) {
    if (!announcement) return null;

    const isExpired = announcement.expiresAt
        ? new Date(announcement.expiresAt) < new Date()
        : false;
    const timeAgo = formatRelativeTime(new Date(announcement.publishAt));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge
                            className={`${getTypeColor(announcement.type)} text-white border-transparent`}
                        >
                            {getTypeLabel(announcement.type)}
                        </Badge>
                        <Badge
                            variant="outline"
                            className={`${getPriorityColor(announcement.priority)} text-white border-transparent`}
                        >
                            {getPriorityLabel(announcement.priority)}
                        </Badge>
                        {isExpired && (
                            <Badge variant="outline">Expired</Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                            {timeAgo}
                        </span>
                    </div>
                    <DialogTitle className="text-xl">{announcement.title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="prose dark:prose-invert max-w-none">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {announcement.content}
                        </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
                        <div className="space-y-1">
                            {announcement.createdBy && (
                                <p>Posted by: <span className="text-foreground">{announcement.createdBy.name}</span></p>
                            )}
                            <p>
                                Published:{" "}
                                <span className="text-foreground">
                                    {new Date(announcement.publishAt).toLocaleString()}
                                </span>
                            </p>
                            {announcement.expiresAt && (
                                <p>
                                    Expires:{" "}
                                    <span className={isExpired ? "text-destructive" : "text-foreground"}>
                                        {new Date(announcement.expiresAt).toLocaleString()}
                                        {isExpired && " (Expired)"}
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
