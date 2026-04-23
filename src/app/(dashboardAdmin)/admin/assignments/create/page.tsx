'use client'

import axios from "axios"
import React, { useEffect, useMemo, useState } from "react"
import {
    AlertCircle,
    Award,
    BookOpen,
    CalendarClock,
    CheckCircle2,
    Filter,
    Library,
    Loader2,
    Plus,
    Search,
    Send,
    Sparkles,
    Trash2,
    X,
    Zap,
} from "lucide-react"
import { Alert } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { EmptyState } from "@/components/ui/empty-state"
import { FormField } from "@/components/ui/form-field"
import {
    ProblemCardSkeleton,
} from "@/components/ui/skeleton"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type Problem = {
    _id: string
    title: string
    slug: string
    difficulty: "Easy" | "Medium" | "Hard"
    marks: number
    tags: string[]
}

export default function CreateAssignmentPage() {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [publishAt, setPublishAt] = useState("")
    const [dueAt, setDueAt] = useState("")
    const [problems, setProblems] = useState<Problem[]>([])
    const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([])
    const [loadingProblems, setLoadingProblems] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState<"success" | "destructive" | "info">(
        "info"
    )
    const [search, setSearch] = useState("")
    const [difficultyFilter, setDifficultyFilter] = useState("all")
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [isSebRequired, setIsSebRequired] = useState(false)
    const [pendingSubmission, setPendingSubmission] = useState<null | {
        title: string
        description: string
        publishAt: string
        dueAt: string
        problemIds: string[]
        isSebRequired: boolean
    }>(null)

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const res = await axios.get("/api/admin/problems")
                setProblems(res.data.problems || [])
            } catch (error) {
                console.error("Error fetching problems:", error)
                setMessage("Failed to load problems")
                setMessageType("destructive")
            } finally {
                setLoadingProblems(false)
            }
        }

        fetchProblems()
    }, [])

    const searchParams = useSearchParams()
    const editId = searchParams.get("id")

    useEffect(() => {
        const fetchAssignment = async () => {
            if (!editId) return
            try {
                const res = await axios.get(`/api/admin/assignments/${editId}`)
                const a = res.data.data
                setTitle(a.title)
                setDescription(a.description)
                setPublishAt(new Date(a.publishAt).toISOString().slice(0, 16))
                setDueAt(new Date(a.dueAt).toISOString().slice(0, 16))
                setSelectedProblemIds(a.problemIds.map((p: any) => p._id))
                setIsSebRequired(a.isSebRequired || false)
            } catch (error) {
                console.error("Error fetching assignment:", error)
            }
        }
        fetchAssignment()
    }, [editId])

    const handleProblemToggle = (problemId: string) => {
        setSelectedProblemIds((prev) =>
            prev.includes(problemId)
                ? prev.filter((id) => id !== problemId)
                : [...prev, problemId]
        )
    }

    const selectedProblems = useMemo(
        () => problems.filter((problem) => selectedProblemIds.includes(problem._id)),
        [problems, selectedProblemIds]
    )

    const totalMarks = selectedProblems.reduce(
        (sum, problem) => sum + (problem.marks || 0),
        0
    )

    const filteredProblems = useMemo(
        () =>
            problems.filter((problem) => {
                const matchesSearch =
                    search === "" ||
                    problem.title.toLowerCase().includes(search.toLowerCase()) ||
                    problem.slug.toLowerCase().includes(search.toLowerCase()) ||
                    problem.tags?.some((tag) =>
                        tag.toLowerCase().includes(search.toLowerCase())
                    )

                const matchesDifficulty =
                    difficultyFilter === "all" ||
                    problem.difficulty.toLowerCase() === difficultyFilter.toLowerCase()

                return matchesSearch && matchesDifficulty
            }),
        [problems, search, difficultyFilter]
    )

    const insights = useMemo(() => {
        const easyCount = selectedProblems.filter((problem) => problem.difficulty === "Easy").length
        const mediumCount = selectedProblems.filter((problem) => problem.difficulty === "Medium").length
        const hardCount = selectedProblems.filter((problem) => problem.difficulty === "Hard").length

        const readiness =
            title && description && publishAt && dueAt && selectedProblemIds.length > 0
                ? "Ready to publish"
                : "Still needs a few details"

        return {
            easyCount,
            mediumCount,
            hardCount,
            readiness,
        }
    }, [title, description, publishAt, dueAt, selectedProblemIds.length, selectedProblems])

    const getDifficultyStyles = (difficulty: Problem["difficulty"]) => {
        switch (difficulty) {
            case "Easy":
                return {
                    badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
                    icon: CheckCircle2,
                }
            case "Medium":
                return {
                    badge: "border-amber-500/20 bg-amber-500/10 text-amber-500",
                    icon: AlertCircle,
                }
            case "Hard":
                return {
                    badge: "border-rose-500/20 bg-rose-500/10 text-rose-500",
                    icon: Zap,
                }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage("")

        if (!title || !description || !publishAt || !dueAt) {
            setMessage("Please fill all assignment details")
            setMessageType("destructive")
            return
        }

        if (selectedProblemIds.length === 0) {
            setMessage("Please select at least one problem")
            setMessageType("destructive")
            return
        }

        setPendingSubmission({
            title,
            description,
            publishAt: new Date(publishAt).toISOString(),
            dueAt: new Date(dueAt).toISOString(),
            problemIds: selectedProblemIds,
            isSebRequired,
        })
        setShowConfirmDialog(true)
    }

    const confirmSubmission = async () => {
        if (!pendingSubmission) return

        try {
            setSubmitting(true)
            setShowConfirmDialog(false)
            setPendingSubmission(null)

            const res = editId 
                ? await axios.patch(`/api/admin/assignments/${editId}`, pendingSubmission)
                : await axios.post("/api/admin/assignments", pendingSubmission)

            setMessage(res.data.message || (editId ? "Assignment updated successfully" : "Assignment created successfully"))
            setMessageType("success")

            if (!editId) {
                setTitle("")
                setDescription("")
                setPublishAt("")
                setDueAt("")
                setSelectedProblemIds([])
                setIsSebRequired(false)
                setSearch("")
                setDifficultyFilter("all")
            }
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error && "response" in error
                    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    : "Failed to create assignment"
            setMessage(errorMessage || "Failed to create assignment")
            setMessageType("destructive")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
            <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-linear-to-br from-card via-card to-violet-500/8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.10),transparent_30%)]" />
                <div className="relative grid gap-6 px-5 py-6 sm:px-7 sm:py-7 xl:grid-cols-[1.25fr_0.9fr] xl:px-8">
                    <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-violet-500 shadow-none">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Assignment Builder
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                                Admin creation workspace
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Create assignments with less clutter and more control
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                Define the schedule, write the instructions, and build a balanced
                                problem set from one cleaner workspace.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <CompactMetric
                                label="Problems"
                                value={String(selectedProblemIds.length)}
                                helper="currently selected"
                            />
                            <CompactMetric
                                label="Marks"
                                value={String(totalMarks)}
                                helper="total assignment weight"
                            />
                            <CompactMetric
                                label="Status"
                                value={insights.readiness}
                                helper="based on required fields"
                                highlight={selectedProblemIds.length > 0 && Boolean(publishAt && dueAt)}
                            />
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-border/60 bg-background/70 p-5 backdrop-blur-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                    Builder Pulse
                                </p>
                                <h2 className="mt-2 text-xl font-semibold tracking-tight">
                                    Current assignment snapshot
                                </h2>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-500">
                                <Library className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                            <StatusRow
                                icon={Award}
                                label="Problem mix"
                                value={`${insights.easyCount} easy, ${insights.mediumCount} medium, ${insights.hardCount} hard`}
                            />
                            <StatusRow
                                icon={CalendarClock}
                                label="Publish window"
                                value={publishAt && dueAt ? "Configured" : "Waiting for dates"}
                            />
                            <StatusRow
                                icon={BookOpen}
                                label="Brief"
                                value={description.trim() ? "Instructions added" : "Description still missing"}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {message && (
                <Alert
                    variant={messageType === "destructive" ? "destructive" : "default"}
                    className="rounded-[24px]"
                >
                    {message}
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card className="rounded-[28px] border border-border/60 bg-card/80 py-0 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
                        <CardContent className="p-5 sm:p-6">
                            <div className="mb-5">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                    Assignment Blueprint
                                </p>
                                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                                    Core details
                                </h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Keep this part simple: define the assignment, schedule it, and
                                    add the instructions students need.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    label="Title"
                                    required
                                    hint="Choose a strong name that makes the assignment purpose obvious"
                                >
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Greedy + DP Practice Set"
                                        className="h-11 w-full rounded-2xl border px-3 py-2 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                        required
                                    />
                                </FormField>

                                <FormField
                                    label="Publish At"
                                    required
                                    hint="When students should first see this assignment"
                                >
                                    <DateTimePicker
                                        value={publishAt}
                                        onChange={(val) => setPublishAt(val)}
                                        placeholder="Select publish date"
                                        clearable
                                    />
                                </FormField>

                                <FormField
                                    label="Due At"
                                    required
                                    hint="Set a clear deadline for submissions"
                                >
                                    <DateTimePicker
                                        value={dueAt}
                                        onChange={(val) => setDueAt(val)}
                                        placeholder="Select due date"
                                        clearable
                                        minDate={publishAt ? new Date(publishAt) : undefined}
                                    />
                                </FormField>
                            </div>

                            <FormField
                                label="Description"
                                required
                                className="mt-4"
                                hint="Give students context, expectations, and submission guidance"
                            >
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Write assignment instructions, expectations, and any special notes..."
                                    rows={6}
                                    className="w-full resize-none rounded-[24px] border px-4 py-3 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                    required
                                />
                            </FormField>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[28px] border border-border/60 bg-card/80 py-0 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] xl:sticky xl:top-6">
                        <CardContent className="p-5 sm:p-6">
                            <div className="mb-5 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                        Selected Loadout
                                    </p>
                                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                                        Assignment composition
                                    </h2>
                                </div>
                                <Badge variant="outline" className="rounded-full px-3 py-1">
                                    {selectedProblemIds.length} chosen
                                </Badge>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <StatPill
                                    label="Easy"
                                    value={insights.easyCount}
                                    tone="emerald"
                                />
                                <StatPill
                                    label="Medium"
                                    value={insights.mediumCount}
                                    tone="amber"
                                />
                                <StatPill
                                    label="Hard"
                                    value={insights.hardCount}
                                    tone="rose"
                                />
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-[24px] border border-border/60 bg-background/65 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                        Total marks
                                    </p>
                                    <p className="mt-2 text-3xl font-black tracking-tighter text-foreground">
                                        {totalMarks}
                                    </p>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Updates automatically as you build the set.
                                    </p>
                                </div>

                                <div className="rounded-[24px] border border-border/60 bg-background/65 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                        Publish window
                                    </p>
                                    <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                                        {publishAt && dueAt ? "Configured" : "Pending setup"}
                                    </p>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {publishAt && dueAt
                                            ? "Both publish and due dates are set."
                                            : "Add both dates to make the assignment ready."}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-foreground">
                                        Selected problems
                                    </p>
                                    {selectedProblemIds.length > 0 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="rounded-full"
                                            onClick={() => setSelectedProblemIds([])}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Clear all
                                        </Button>
                                    )}
                                </div>

                                {selectedProblems.length === 0 ? (
                                    <EmptyState
                                        title="No problems selected yet"
                                        description="Start picking problems from the bank below to shape this assignment."
                                        className="rounded-[24px] border-border/60 bg-background/55 p-8 shadow-none"
                                    />
                                ) : (
                                    <div className="max-h-[360px] space-y-3 overflow-auto pr-1">
                                        {selectedProblems.map((problem, index) => {
                                            const difficulty = getDifficultyStyles(problem.difficulty)
                                            const DifficultyIcon = difficulty.icon

                                            return (
                                                <div
                                                    key={problem._id}
                                                    className="rounded-[24px] border border-border/60 bg-background/65 p-4 shadow-sm"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                                                    #{index + 1}
                                                                </span>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn("rounded-full px-3 py-1", difficulty.badge)}
                                                                >
                                                                    <DifficultyIcon className="mr-1.5 h-3.5 w-3.5" />
                                                                    {problem.difficulty}
                                                                </Badge>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-foreground">
                                                                    {problem.title}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {problem.slug}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <div className="text-right">
                                                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                                                    Marks
                                                                </p>
                                                                <p className="mt-1 text-2xl font-bold tracking-tight">
                                                                    {problem.marks}
                                                                </p>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="rounded-full"
                                                                onClick={() => handleProblemToggle(problem._id)}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                Problem Bank
                            </p>
                            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                                Browse and select problems
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Filter the bank, compare difficulty, and add the right mix to your assignment.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative w-full sm:w-80">
                                <Search
                                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                                    aria-hidden="true"
                                />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by title, slug, or tags..."
                                    className="h-11 w-full rounded-2xl border bg-background pl-10 pr-10 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                    aria-label="Search problems"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-muted transition-colors"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                                <SelectTrigger className="w-full rounded-2xl gap-2 sm:w-[190px]">
                                    <Filter className="h-4 w-4" />
                                    <SelectValue placeholder="All Difficulties" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Difficulties</SelectItem>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            {problems.length} total problems
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            {filteredProblems.length} matching
                        </Badge>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        {loadingProblems ? (
                            <>
                                <ProblemCardSkeleton />
                                <ProblemCardSkeleton />
                                <ProblemCardSkeleton />
                                <ProblemCardSkeleton />
                            </>
                        ) : filteredProblems.length === 0 ? (
                            <div className="lg:col-span-2">
                                <EmptyState
                                    title="No matching problems found"
                                    description="Try changing the search query or difficulty filter."
                                    className="rounded-[28px] border-border/60 bg-background/55 shadow-none"
                                />
                            </div>
                        ) : (
                            filteredProblems.map((problem) => {
                                const isSelected = selectedProblemIds.includes(problem._id)
                                const difficulty = getDifficultyStyles(problem.difficulty)
                                const DifficultyIcon = difficulty.icon

                                return (
                                    <div
                                        key={problem._id}
                                        className={cn(
                                            "group rounded-[28px] border p-5 transition-all duration-300",
                                            isSelected
                                                ? "border-violet-500/30 bg-violet-500/6 shadow-[0_18px_40px_-28px_rgba(139,92,246,0.45)]"
                                                : "border-border/60 bg-background/65 shadow-sm hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_40px_-28px_rgba(0,0,0,0.4)]"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn("rounded-full px-3 py-1", difficulty.badge)}
                                                    >
                                                        <DifficultyIcon className="mr-1.5 h-3.5 w-3.5" />
                                                        {problem.difficulty}
                                                    </Badge>
                                                    <Badge variant="outline" className="rounded-full px-3 py-1">
                                                        <Award className="mr-1.5 h-3.5 w-3.5" />
                                                        {problem.marks} marks
                                                    </Badge>
                                                </div>

                                                <div>
                                                    <h3 className="text-xl font-semibold tracking-tight text-foreground">
                                                        {problem.title}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {problem.slug}
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {problem.tags?.length > 0 ? (
                                                        problem.tags.map((tag) => (
                                                            <Badge
                                                                key={tag}
                                                                variant="secondary"
                                                                className="rounded-full px-3 py-1"
                                                            >
                                                                {tag}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            No tags
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <Button
                                                type="button"
                                                onClick={() => handleProblemToggle(problem._id)}
                                                className={cn(
                                                    "rounded-full",
                                                    isSelected &&
                                                    "bg-violet-500 text-white hover:bg-violet-500/90"
                                                )}
                                                variant={isSelected ? "default" : "outline"}
                                            >
                                                {isSelected ? (
                                                    <>
                                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                                        Added
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Add
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </section>

                <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-end">
                    <Button type="submit" className="rounded-full" disabled={submitting}>
                        {submitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        {submitting ? "Creating Assignment..." : "Create Assignment"}
                    </Button>
                </div>
            </form>

            <ConfirmationDialog
                open={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
                onConfirm={confirmSubmission}
                title="Create Assignment?"
                description={`You're about to create "${pendingSubmission?.title || title}" with ${selectedProblemIds.length} problem(s) and ${totalMarks} total marks.`}
                confirmText="Create Assignment"
                cancelText="Review Again"
            />
        </div>
    )
}

function CompactMetric({
    label,
    value,
    helper,
    highlight = false,
}: {
    label: string
    value: string
    helper: string
    highlight?: boolean
}) {
    return (
        <div
            className={cn(
                "rounded-[22px] border bg-background/75 p-4 backdrop-blur-sm",
                highlight ? "border-emerald-500/20" : "border-border/60"
            )}
        >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {label}
            </p>
            <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
                {helper}
            </p>
        </div>
    )
}

function StatusRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
}) {
    return (
        <div className="flex items-start gap-3 rounded-[22px] border border-border/60 bg-background/65 p-4">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background text-muted-foreground">
                <Icon className="h-4 w-4" />
            </div>
            <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{value}</p>
            </div>
        </div>
    )
}

function StatPill({
    label,
    value,
    tone,
}: {
    label: string
    value: number
    tone: "emerald" | "amber" | "rose"
}) {
    const tones = {
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-500",
        rose: "border-rose-500/20 bg-rose-500/10 text-rose-500",
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
                <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone])}>
                    Mix
                </span>
            </div>
        </div>
    )
}
