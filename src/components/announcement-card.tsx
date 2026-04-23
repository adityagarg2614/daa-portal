"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bell, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
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
    _id,
    title,
    content,
    type,
    priority,
    createdAt,
    createdBy,
    onClick,
}: AnnouncementCardProps) {
    const timeAgo = formatRelativeTime(new Date(createdAt));
    const accentTone =
        priority === "high"
            ? "from-amber-500/70 via-amber-500/20 to-transparent"
            : type === "assignment"
              ? "from-sky-500/70 via-sky-500/20 to-transparent"
              : "from-orange-500/70 via-orange-500/20 to-transparent";

    return (
        <Card
            className="group relative cursor-pointer overflow-hidden rounded-[28px] border border-border/60 bg-card/80 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_24px_56px_-32px_rgba(0,0,0,0.55)]"
            onClick={onClick}
        >
            <div
                className={cn(
                    "absolute inset-x-0 top-0 h-px opacity-80 bg-linear-to-r",
                    accentTone
                )}
                aria-hidden="true"
            />

            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                <Bell className="mr-1.5 h-3.5 w-3.5" />
                                #{_id.slice(-4)}
                            </Badge>
                            {priority === "high" && (
                                <Badge className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-500 shadow-none">
                                    <TriangleAlert className="mr-1.5 h-3.5 w-3.5" />
                                    High focus
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                                className={`${getTypeColor(type)} text-white border-transparent rounded-full`}
                            >
                                {getTypeLabel(type)}
                            </Badge>
                            <Badge
                                variant="outline"
                                className={`${getPriorityColor(priority)} text-white border-transparent rounded-full`}
                            >
                                {getPriorityLabel(priority)}
                            </Badge>
                        </div>
                    </div>

                    <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground whitespace-nowrap">
                        {timeAgo}
                    </span>
                </div>

                <div className="pt-1">
                    <h3 className="font-heading text-xl font-semibold tracking-tight line-clamp-2">
                        {title}
                    </h3>
                </div>
            </CardHeader>

            <CardContent className="flex-1 pb-4">
                <p className="text-sm leading-6 text-muted-foreground line-clamp-4">{content}</p>
            </CardContent>

            <CardFooter className="border-t border-border/60 pt-4">
                <div className="flex items-center justify-between w-full gap-3">
                    <div className="text-xs text-muted-foreground">
                        {createdBy ? (
                            <span>Posted by <span className="text-foreground font-medium">{createdBy.name}</span></span>
                        ) : (
                            <span>Student announcement</span>
                        )}
                    </div>

                    <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs">
                        Read More
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
