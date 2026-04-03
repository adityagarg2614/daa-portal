'use client'

import axios from "axios"
import React, { useEffect, useState } from "react"
import {
    FileText,
    Search,
    X,
    Filter,
    Plus,
    Award,
    CheckCircle2,
    Library,
    Code2,
    Tag,
    Zap,
    AlertCircle,
    Loader2,
    Send,
    Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { FormField } from "@/components/ui/form-field"
import { Alert } from "@/components/ui/alert"
import { StatCard } from "@/components/ui/stat-card"
import {
    ProblemCardSkeleton,
    StatsCardSkeleton,
} from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { DateTimePicker } from "@/components/ui/date-time-picker"

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
    const [pendingSubmission, setPendingSubmission] = useState<null | {
        title: string
        description: string
        publishAt: string
        dueAt: string
        problemIds: string[]
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

    const handleProblemToggle = (problemId: string) => {
        setSelectedProblemIds((prev) =>
            prev.includes(problemId)
                ? prev.filter((id) => id !== problemId)
                : [...prev, problemId]
        )
    }

    const selectedProblems = problems.filter((problem) =>
        selectedProblemIds.includes(problem._id)
    )

    const totalMarks = selectedProblems.reduce(
        (sum, problem) => sum + (problem.marks || 0),
        0
    )

    const filteredProblems = problems.filter((problem) => {
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
    })

    const getDifficultyVariant = (
        difficulty: string
    ): "default" | "secondary" | "destructive" => {
        switch (difficulty) {
            case "Easy":
                return "secondary"
            case "Medium":
                return "default"
            case "Hard":
                return "destructive"
            default:
                return "default"
        }
    }

    const getDifficultyIcon = (difficulty: string) => {
        switch (difficulty) {
            case "Easy":
                return CheckCircle2
            case "Medium":
                return AlertCircle
            case "Hard":
                return Zap
            default:
                return AlertCircle
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

        // Show confirmation dialog before submitting
        setPendingSubmission({
            title,
            description,
            publishAt: new Date(publishAt).toISOString(),
            dueAt: new Date(dueAt).toISOString(),
            problemIds: selectedProblemIds,
        })
        setShowConfirmDialog(true)
    }

    const confirmSubmission = async () => {
        if (!pendingSubmission) return

        try {
            setSubmitting(true)
            setShowConfirmDialog(false)
            setPendingSubmission(null)

            const res = await axios.post("/api/admin/assignments", pendingSubmission)

            setMessage(res.data.message || "Assignment created successfully")
            setMessageType("success")

            setTitle("")
            setDescription("")
            setPublishAt("")
            setDueAt("")
            setSelectedProblemIds([])
            setSearch("")
            setDifficultyFilter("all")
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error && 'response' in error
                    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    : "Failed to create assignment"
            setMessage(errorMessage || "Failed to create assignment")
            setMessageType("destructive")
        } finally {
            setSubmitting(false)
        }
    }

    const dismissMessage = () => {
        setMessage("")
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
            {/* Enhanced Header */}
            {/* Header */}
            <div
                className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-background to-muted p-8 shadow-sm"
                role="banner"
            >
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg"
                            aria-hidden="true"
                        >
                            <FileText className="h-6 w-6 icon-bounce" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight" id="page-heading">
                                Create Assignment
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Build a new assignment by selecting problems from the problem
                                bank
                            </p>
                        </div>
                    </div>
                </div>
                {/* Decorative background elements */}
                <div
                    className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl"
                    aria-hidden="true"
                />
                <div
                    className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl"
                    aria-hidden="true"
                />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" aria-labelledby="page-heading">
                {/* Assignment Details Section */}
                <div
                    className="rounded-2xl border bg-background p-6 shadow-sm"
                    role="region"
                    aria-labelledby="assignment-details-heading"
                >
                    <h2 id="assignment-details-heading" className="mb-4 text-lg font-semibold">
                        Assignment Details
                    </h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            label="Title"
                            required
                            hint="Enter a descriptive title for the assignment"
                        >
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter assignment title"
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all"
                                required
                            />
                        </FormField>

                        <FormField
                            label="Publish At"
                            required
                            hint="When the assignment becomes available"
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
                            hint="Submission deadline"
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
                        hint="Provide detailed instructions for students"
                    >
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter assignment description"
                            rows={5}
                            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all resize-none"
                            required
                        />
                    </FormField>
                </div>

                {/* Problem Selection Section */}
                <div
                    className="rounded-2xl border bg-background p-6 shadow-sm"
                    role="region"
                    aria-labelledby="problem-selection-heading"
                >
                    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 id="problem-selection-heading" className="text-lg font-semibold">
                                Select Problems
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Choose one or more problems for this assignment
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                            {/* Search Input */}
                            <div className="relative w-full lg:w-80">
                                <Search
                                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground icon-pulse"
                                    aria-hidden="true"
                                />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by title, slug, or tags..."
                                    className="h-11 w-full rounded-xl border bg-background pl-10 pr-10 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all"
                                    aria-label="Search problems"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-muted transition-colors"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-4 w-4 icon-hover-scale" />
                                    </button>
                                )}
                            </div>

                            {/* Filter Dropdown */}
                            <Select
                                value={difficultyFilter}
                                onValueChange={setDifficultyFilter}
                            >
                                <SelectTrigger className="w-full lg:w-[180px] gap-2">
                                    <Filter className="h-4 w-4" />
                                    <SelectValue placeholder="All Difficulties" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Difficulties</SelectItem>
                                    <SelectItem value="easy">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-green-500" />
                                            Easy
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="medium">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-yellow-500" />
                                            Medium
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="hard">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-red-500" />
                                            Hard
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    {loadingProblems ? (
                        <div className="mb-4 grid gap-4 md:grid-cols-3" role="status" aria-label="Loading statistics">
                            <StatsCardSkeleton />
                            <StatsCardSkeleton />
                            <StatsCardSkeleton />
                        </div>
                    ) : (
                        <div className="mb-4 grid gap-4 md:grid-cols-3" role="region" aria-label="Assignment statistics">
                            <StatCard
                                icon={CheckCircle2}
                                label="Selected Problems"
                                value={selectedProblemIds.length}
                                variant="primary"
                            />
                            <StatCard
                                icon={Award}
                                label="Total Marks"
                                value={totalMarks}
                                variant="success"
                            />
                            <StatCard
                                icon={Library}
                                label="Available Problems"
                                value={problems.length}
                                variant="default"
                            />
                        </div>
                    )}

                    {/* Selected Problems Panel */}
                    {selectedProblems.length > 0 && (
                        <div
                            className="mb-4 rounded-xl border bg-muted/30 p-4"
                            role="region"
                            aria-label="Selected problems summary"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2
                                        className="h-4 w-4 text-primary icon-bounce"
                                        aria-hidden="true"
                                    />
                                    <h4 className="text-sm font-semibold">
                                        Selected Problems ({selectedProblems.length})
                                    </h4>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedProblemIds([])}
                                    className="h-7 text-xs gap-1.5"
                                    aria-label="Clear all selected problems"
                                >
                                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                    Clear All
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedProblems.map((problem) => (
                                    <div
                                        key={problem._id}
                                        className="group inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm transition-all hover:bg-primary/20"
                                    >
                                        <span className="font-medium">{problem.title}</span>
                                        <Badge variant="outline" className="gap-1">
                                            <Award className="h-3 w-3" />
                                            {problem.marks}
                                        </Badge>
                                        <button
                                            type="button"
                                            onClick={() => handleProblemToggle(problem._id)}
                                            className="rounded-full p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-primary/20"
                                            aria-label={`Remove ${problem.title}`}
                                        >
                                            <X className="h-3.5 w-3.5 icon-hover-scale" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Problem Cards */}
                    {loadingProblems ? (
                        <div className="space-y-4" role="status" aria-label="Loading problems">
                            <ProblemCardSkeleton />
                            <ProblemCardSkeleton />
                            <ProblemCardSkeleton />
                        </div>
                    ) : (
                        <div
                            className="space-y-4"
                            role="list"
                            aria-label="Available problems"
                            aria-live="polite"
                        >
                            {filteredProblems.length > 0 ? (
                                filteredProblems.map((problem) => {
                                    const isSelected = selectedProblemIds.includes(problem._id)
                                    const DifficultyIcon = getDifficultyIcon(problem.difficulty)

                                    return (
                                        <div
                                            key={problem._id}
                                            role="listitem"
                                            className={cn(
                                                "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300",
                                                isSelected
                                                    ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary"
                                                    : "bg-background hover:shadow-md hover:border-muted-foreground/30"
                                            )}
                                        >
                                            {/* Selection indicator */}
                                            {isSelected && (
                                                <div className="absolute -left-1 top-0 bottom-0 w-1 bg-primary" />
                                            )}

                                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                                <div className="space-y-3 flex-1">
                                                    {/* Header */}
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-lg font-semibold">
                                                            {problem.title}
                                                        </h3>
                                                        <Badge
                                                            variant={getDifficultyVariant(problem.difficulty)}
                                                            className="gap-1"
                                                        >
                                                            <DifficultyIcon className="h-3 w-3" />
                                                            {problem.difficulty}
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            className="gap-1"
                                                        >
                                                            <Award className="h-3 w-3" />
                                                            {problem.marks}
                                                        </Badge>
                                                    </div>

                                                    {/* Slug */}
                                                    <div className="flex items-center gap-2">
                                                        <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <p className="font-mono text-xs text-muted-foreground">
                                                            <code className="rounded-md bg-muted/50 px-2 py-0.5">
                                                                {problem.slug}
                                                            </code>
                                                        </p>
                                                    </div>

                                                    {/* Tags */}
                                                    {problem.tags?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {problem.tags.map((tag, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium transition-colors hover:bg-muted/80"
                                                                >
                                                                    <Tag className="h-3 w-3" />
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Button */}
                                                <Button
                                                    type="button"
                                                    variant={isSelected ? "outline" : "default"}
                                                    size="sm"
                                                    onClick={() => handleProblemToggle(problem._id)}
                                                    className={cn(
                                                        "transition-all duration-300",
                                                        isSelected
                                                            ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                            : "icon-hover-scale"
                                                    )}
                                                >
                                                    {isSelected ? (
                                                        <>
                                                            <X className="mr-2 h-4 w-4 icon-shake" />
                                                            Remove
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="mr-2 h-4 w-4 icon-hover-scale" />
                                                            Select
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                    <Search className="mx-auto mb-2 h-8 w-8 opacity-50" />
                                    <p>No problems found matching your criteria</p>
                                    <p className="text-xs mt-1">
                                        Try adjusting your search or filters
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Message Alert */}
                {message && (
                    <Alert
                        variant={messageType}
                        onDismiss={dismissMessage}
                        role="status"
                        aria-live="polite"
                    >
                        {message}
                    </Alert>
                )}

                {/* Submit Button */}
                <div className="flex items-center gap-4">
                    <Button
                        type="submit"
                        disabled={
                            submitting ||
                            selectedProblemIds.length === 0 ||
                            !title ||
                            !description
                        }
                        className="w-full md:w-auto min-w-[200px] gap-2"
                        size="lg"
                        aria-label="Create assignment"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-4 w-4 icon-spin" />
                                <span>Creating Assignment...</span>
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4 icon-hover-scale" />
                                <span>Create Assignment</span>
                            </>
                        )}
                    </Button>

                    {selectedProblemIds.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Select at least one problem to create an assignment
                        </p>
                    )}
                </div>
            </form>

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                open={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
                onConfirm={confirmSubmission}
                title="Confirm Assignment Creation"
                description={
                    pendingSubmission
                        ? `You are about to create "${pendingSubmission.title}" with ${pendingSubmission.problemIds.length} problem(s) and ${selectedProblemIds.reduce((sum, id) => {
                            const problem = problems.find(p => p._id === id)
                            return sum + (problem?.marks || 0)
                        }, 0)} total marks.`
                        : "Are you sure you want to create this assignment?"
                }
                confirmText="Create Assignment"
                cancelText="Cancel"
                variant="default"
            />
        </div>
    )
}
