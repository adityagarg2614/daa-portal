"use client"

import type { FormEvent } from "react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { BellRing, Eye, EyeOff, FileText, Sparkles, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Announcement {
    _id: string
    title: string
    content: string
    type: "general" | "assignment" | "event" | "urgent"
    priority: "low" | "medium" | "high"
    isActive: boolean
    publishAt?: string
    expiresAt?: string | null
}

interface AnnouncementFormProps {
    announcement: Announcement | null
    onSuccess: () => void
    onCancel: () => void
}

const typeOptions = [
    {
        value: "general",
        label: "General",
        helper: "Broadcast a regular update to students.",
    },
    {
        value: "assignment",
        label: "Assignment",
        helper: "Highlight work, deadlines, or academic follow-ups.",
    },
    {
        value: "event",
        label: "Event",
        helper: "Share time-based notices, sessions, or activities.",
    },
    {
        value: "urgent",
        label: "Urgent",
        helper: "Use for messages that need immediate attention.",
    },
] as const

const priorityOptions = [
    {
        value: "low",
        label: "Low",
        helper: "A calm update students can read later.",
    },
    {
        value: "medium",
        label: "Medium",
        helper: "Important, but not disruptive.",
    },
    {
        value: "high",
        label: "High",
        helper: "Should stand out in the announcement feed.",
    },
] as const

export function AnnouncementForm({
    announcement,
    onSuccess,
    onCancel,
}: AnnouncementFormProps) {
    const [title, setTitle] = useState(announcement?.title ?? "")
    const [content, setContent] = useState(announcement?.content ?? "")
    const [type, setType] = useState<"general" | "assignment" | "event" | "urgent">(
        announcement?.type ?? "general"
    )
    const [priority, setPriority] = useState<"low" | "medium" | "high">(
        announcement?.priority ?? "medium"
    )
    const [isActive, setIsActive] = useState(announcement?.isActive ?? true)
    const [submitting, setSubmitting] = useState(false)

    const titleLength = title.trim().length
    const contentLength = content.trim().length

    const selectedType = typeOptions.find((option) => option.value === type)
    const selectedPriority = priorityOptions.find((option) => option.value === priority)

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        setSubmitting(true)

        const normalizedTitle = title.trim()
        const normalizedContent = content.trim()

        if (normalizedTitle.length < 5 || normalizedTitle.length > 100) {
            toast.error("Title must be between 5 and 100 characters")
            setSubmitting(false)
            return
        }

        if (normalizedContent.length < 10 || normalizedContent.length > 1000) {
            toast.error("Content must be between 10 and 1000 characters")
            setSubmitting(false)
            return
        }

        try {
            const url = announcement
                ? `/api/admin/announcements/${announcement._id}`
                : "/api/admin/announcements"
            const method = announcement ? "PUT" : "POST"

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: normalizedTitle,
                    content: normalizedContent,
                    type,
                    priority,
                    isActive,
                }),
            })

            const data = await response.json()

            if (data.success) {
                toast.success(
                    announcement
                        ? "Announcement updated successfully"
                        : "Announcement created successfully"
                )
                onSuccess()
            } else {
                toast.error(data.message || "Failed to save announcement")
            }
        } catch (error) {
            console.error("Error saving announcement:", error)
            toast.error("Failed to save announcement")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-[24px] border border-border/60 bg-card/70 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-rose-500 shadow-none">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Message setup
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                <FileText className="mr-1.5 h-3.5 w-3.5" />
                                {announcement ? "Editing draft" : "Fresh draft"}
                            </Badge>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold tracking-tight">
                                Keep this update concise and easy to scan
                            </h3>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                Students should understand the purpose of the announcement in one quick read.
                            </p>
                        </div>
                    </div>

                    <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-sm">
                        <QuickInfoCard
                            label="Type"
                            value={selectedType?.label || "General"}
                            helper={selectedType?.helper || ""}
                            tone="sky"
                        />
                        <QuickInfoCard
                            label="Priority"
                            value={selectedPriority?.label || "Medium"}
                            helper={selectedPriority?.helper || ""}
                            tone="amber"
                        />
                    </div>
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
                <section className="space-y-6 rounded-[24px] border border-border/60 bg-card/70 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] sm:p-6">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium">
                            Title
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Enter a short headline for the announcement"
                            className="h-12 rounded-2xl border-border/60 bg-background/80 px-4 text-base shadow-sm"
                            disabled={submitting}
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Make it clear enough to understand in one line.</span>
                            <span>{titleLength}/100</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content" className="text-sm font-medium">
                            Content
                        </Label>
                        <Textarea
                            id="content"
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            placeholder="Write the full update, any next step, and the main context students should know."
                            className="min-h-[220px] rounded-[22px] border-border/60 bg-background/80 px-4 py-3 text-base leading-7 shadow-sm"
                            disabled={submitting}
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Aim for a short paragraph with a clear action or takeaway.</span>
                            <span>{contentLength}/1000</span>
                        </div>
                    </div>
                </section>

                <section className="space-y-6 rounded-[24px] border border-border/60 bg-card/70 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] sm:p-6">
                    <div className="space-y-2">
                        <Label htmlFor="type" className="text-sm font-medium">
                            Type
                        </Label>
                        <Select
                            value={type}
                            onValueChange={(value) =>
                                setType(value as "general" | "assignment" | "event" | "urgent")
                            }
                            disabled={submitting}
                        >
                            <SelectTrigger
                                id="type"
                                className="h-12 rounded-2xl border-border/60 bg-background/80 shadow-sm"
                            >
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {typeOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">{selectedType?.helper}</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="priority" className="text-sm font-medium">
                            Priority
                        </Label>
                        <Select
                            value={priority}
                            onValueChange={(value) =>
                                setPriority(value as "low" | "medium" | "high")
                            }
                            disabled={submitting}
                        >
                            <SelectTrigger
                                id="priority"
                                className="h-12 rounded-2xl border-border/60 bg-background/80 shadow-sm"
                            >
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                {priorityOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">{selectedPriority?.helper}</p>
                    </div>

                    <div className="rounded-[22px] border border-border/60 bg-background/70 p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    {isActive ? (
                                        <Eye className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <Label htmlFor="isActive" className="text-sm font-medium">
                                        Visible to students
                                    </Label>
                                </div>
                                <p className="text-sm leading-6 text-muted-foreground">
                                    {isActive
                                        ? "This announcement will appear in the student feed."
                                        : "This announcement stays hidden until you activate it."}
                                </p>
                            </div>
                            <Switch
                                id="isActive"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                                disabled={submitting}
                            />
                        </div>
                    </div>

                    <div className="rounded-[22px] border border-border/60 bg-background/70 p-4">
                        <div className="flex items-start gap-3">
                            <TriangleAlert className="mt-0.5 h-4 w-4 text-amber-500" />
                            <div>
                                <p className="text-sm font-medium text-foreground">Publishing note</p>
                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    Use high priority only when the notice should stand out immediately in
                                    the student announcement feed.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={submitting}
                    className="h-11 rounded-2xl px-5"
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="h-11 rounded-2xl px-5">
                    <BellRing className="mr-2 h-4 w-4" />
                    {submitting
                        ? "Saving..."
                        : announcement
                            ? "Update Announcement"
                            : "Publish Announcement"}
                </Button>
            </div>
        </form>
    )
}

function QuickInfoCard({
    label,
    value,
    helper,
    tone,
}: {
    label: string
    value: string
    helper: string
    tone: "sky" | "amber"
}) {
    const tones = {
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-500",
    }

    return (
        <div className="rounded-[22px] border border-border/60 bg-background/70 p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                        {value}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
                </div>
                <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone])}>
                    Ready
                </span>
            </div>
        </div>
    )
}
