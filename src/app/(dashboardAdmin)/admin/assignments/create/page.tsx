'use client'

import axios from "axios"
import React, { useEffect, useState } from "react"

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
    const [search, setSearch] = useState("")

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const res = await axios.get("/api/admin/problems")
                setProblems(res.data.problems || [])
            } catch (error) {
                console.error("Error fetching problems:", error)
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
        const q = search.toLowerCase()
        return (
            problem.title.toLowerCase().includes(q) ||
            problem.slug.toLowerCase().includes(q) ||
            problem.tags?.some((tag) => tag.toLowerCase().includes(q))
        )
    })

    const getDifficultyClasses = (difficulty: string) => {
        switch (difficulty) {
            case "Easy":
                return "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
            case "Medium":
                return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
            case "Hard":
                return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
            default:
                return "bg-muted text-muted-foreground"
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage("")

        if (!title || !description || !publishAt || !dueAt) {
            setMessage("Please fill all assignment details")
            return
        }

        if (selectedProblemIds.length === 0) {
            setMessage("Please select at least one problem")
            return
        }

        try {
            setSubmitting(true)

            const payload = {
                title,
                description,
                publishAt: new Date(publishAt).toISOString(),
                dueAt: new Date(dueAt).toISOString(),
                problemIds: selectedProblemIds,
            }

            const res = await axios.post("/api/admin/assignments", payload)

            setMessage(res.data.message || "Assignment created successfully")

            setTitle("")
            setDescription("")
            setPublishAt("")
            setDueAt("")
            setSelectedProblemIds([])
            setSearch("")
        } catch (error: any) {
            setMessage(error?.response?.data?.message || "Failed to create assignment")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
            <div className="rounded-2xl border bg-background p-6 shadow-sm">
                <h1 className="text-2xl font-bold tracking-tight">Create Assignment</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Build a new assignment by selecting problems from the problem bank.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Assignment Details</h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium">Title</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter assignment title"
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">Publish At</label>
                            <input
                                type="datetime-local"
                                value={publishAt}
                                onChange={(e) => setPublishAt(e.target.value)}
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">Due At</label>
                            <input
                                type="datetime-local"
                                value={dueAt}
                                onChange={(e) => setDueAt(e.target.value)}
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="mb-2 block text-sm font-medium">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter assignment description"
                            rows={5}
                            className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                            required
                        />
                    </div>
                </div>

                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Select Problems</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Choose one or more problems for this assignment.
                            </p>
                        </div>

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search problems..."
                            className="h-11 w-full rounded-xl border px-3 text-sm outline-none lg:w-80"
                        />
                    </div>

                    <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-xl border p-4">
                            <p className="text-sm text-muted-foreground">Selected Problems</p>
                            <h2 className="mt-2 text-2xl font-bold">{selectedProblemIds.length}</h2>
                        </div>

                        <div className="rounded-xl border p-4">
                            <p className="text-sm text-muted-foreground">Total Marks</p>
                            <h2 className="mt-2 text-2xl font-bold">{totalMarks}</h2>
                        </div>

                        <div className="rounded-xl border p-4">
                            <p className="text-sm text-muted-foreground">Available Problems</p>
                            <h2 className="mt-2 text-2xl font-bold">{problems.length}</h2>
                        </div>
                    </div>

                    {loadingProblems ? (
                        <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
                            Loading problems...
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredProblems.length > 0 ? (
                                filteredProblems.map((problem) => {
                                    const isSelected = selectedProblemIds.includes(problem._id)

                                    return (
                                        <div
                                            key={problem._id}
                                            className={`rounded-2xl border p-4 transition ${isSelected
                                                    ? "border-primary bg-primary/5"
                                                    : "bg-background"
                                                }`}
                                        >
                                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                                <div className="space-y-3">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <h3 className="text-lg font-semibold">{problem.title}</h3>
                                                        <span
                                                            className={`rounded-full px-3 py-1 text-xs font-medium ${getDifficultyClasses(
                                                                problem.difficulty
                                                            )}`}
                                                        >
                                                            {problem.difficulty}
                                                        </span>
                                                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                                                            {problem.marks} Marks
                                                        </span>
                                                    </div>

                                                    <p className="text-sm text-muted-foreground">
                                                        Slug: {problem.slug}
                                                    </p>

                                                    {problem.tags?.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {problem.tags.map((tag, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleProblemToggle(problem._id)}
                                                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${isSelected
                                                            ? "bg-destructive text-destructive-foreground"
                                                            : "bg-primary text-primary-foreground"
                                                        }`}
                                                >
                                                    {isSelected ? "Remove" : "Select"}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                    No problems found
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {message && (
                    <div className="rounded-xl border bg-background px-4 py-3 text-sm">
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                    {submitting ? "Creating Assignment..." : "Create Assignment"}
                </button>
            </form>
        </div>
    )
}