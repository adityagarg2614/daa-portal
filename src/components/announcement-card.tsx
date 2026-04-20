"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    getTypeColor,
    getTypeLabel,
    getPriorityColor,
    getPriorityLabel,
    formatRelativeTime,
} from "@/lib/announcement";

interface AnnouncementCardProps {
    _id: string;
    title: string;
    content: string;
    type: "general" | "assignment" | "event" | "urgent";
    priority: "low" | "medium" | "high";
    createdAt: string;
    createdBy?: {
        name: string;
    };
    onClick?: () => void;
}

export function AnnouncementCard({
    title,
    content,
    type,
    priority,
    createdAt,
    createdBy,
    onClick,
}: AnnouncementCardProps) {
    const timeAgo = formatRelativeTime(new Date(createdAt));

    return (
        <Card
            className="cursor-pointer transition-all hover:shadow-lg"
            onClick={onClick}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                            className={`${getTypeColor(type)} text-white border-transparent`}
                        >
                            {getTypeLabel(type)}
                        </Badge>
                        <Badge
                            variant="outline"
                            className={`${getPriorityColor(priority)} text-white border-transparent`}
                        >
                            {getPriorityLabel(priority)}
                        </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {timeAgo}
                    </span>
                </div>
                <h3 className="font-heading text-lg font-medium line-clamp-1">
                    {title}
                </h3>
            </CardHeader>

            <CardContent className="flex-1">
                <p className="text-muted-foreground line-clamp-3">{content}</p>
            </CardContent>

            <CardFooter className="pt-2 border-t">
                <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                    {createdBy && <span>By: {createdBy.name}</span>}
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                        Read More
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
