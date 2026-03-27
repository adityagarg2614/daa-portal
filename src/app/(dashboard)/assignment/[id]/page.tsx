'use client'

import { CodeEditor } from "@/components/editor/code-editor"
import axios from "axios"
import { useParams, useRouter } from "next/navigation"
import React, { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { CalendarDays, Clock3 } from "lucide-react"
import { RotateCCWIcon } from "@/components/ui/rotate-ccw"

type Example = {
    input: string
    output: string
    explanation?: string
}

type Problem = {
    _id: string
    title: string
    slug: string
    description: string
    constraints: string[]
    difficulty: "Easy" | "Medium" | "Hard"
    tags: string[]
    starterCode: {
        cpp: string
        java: string
        python: string
        javascript: string
    }
    marks: number
    examples: Example[]
}

type Assignment = {
    _id: string
    title: string
    description: string
    totalProblems: number
    totalMarks: number
    publishAt: string
    dueAt: string
    status: "Upcoming" | "Active" | "Expired"
    problems: Problem[]
}

type SubmissionState = {
    [problemId: string]: {
        code: string
        language: string
        loading: boolean
        message: string
    }
}

type Submission = {
    _id: string
    assignmentId: string
    problemId: string
    userId: string
    code: string
    language: string
    status: "Attempted" | "Submitted" | "Evaluated"
    score?: number
    submittedAt?: string
    createdAt: string
}

const FALLBACK_STARTER_CODE = {
    cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your C++ code here\n    return 0;\n}",
    java: "public class Main {\n    public static void main(String[] args) {\n        // Write your Java code here\n    }\n}",
    python: "def main():\n    # Write your Python code here\n    pass\n\nif __name__ == '__main__':\n    main()",
    javascript: "function main() {\n    // Write your JavaScript code here\n}\n\nmain();",
}

export default function SingleAssignmentPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [assignment, setAssignment] = useState<Assignment | null>(null)
    const [loading, setLoading] = useState(true)
    const [dbUserId, setDbUserId] = useState("")
    const [submissionState, setSubmissionState] = useState<SubmissionState>({})
    const [accessStatus, setAccessStatus] = useState<"not-published" | "active" | "expired">("active")
    const [autoSubmitting, setAutoSubmitting] = useState(false)
    const [previousAccessStatus, setPreviousAccessStatus] = useState<"not-published" | "active" | "expired">("active")

    // Memoized version of handleAutoSubmit for use in useCallback
    const handleAutoSubmitMemo = useCallback(async (currentAssignment: Assignment, currentUserId: string, currentState: SubmissionState) => {
        if (autoSubmitting) return

        setAutoSubmitting(true)

        try {
            const submissionPromises = currentAssignment.problems.map((problem) => {
                const problemState = currentState[problem._id]
                const codeToSubmit = problemState?.code || problem.starterCode?.cpp || ""

                return axios.post("/api/student/submissions", {
                    assignmentId: currentAssignment._id,
                    problemId: problem._id,
                    userId: currentUserId,
                    code: codeToSubmit,
                    language: problemState?.language || "cpp",
                })
            })

            await Promise.all(submissionPromises)

            toast.success("Assignment submitted successfully", {
                description: "Your code has been automatically submitted.",
            })

            router.push("/assignment")
        } catch (error) {
            console.error("Auto-submit failed:", error)
            toast.error("Auto-submit failed", {
                description: "Please contact support if you believe this is an error.",
            })
            router.push("/assignment")
        } finally {
            setAutoSubmitting(false)
        }
    }, [autoSubmitting, router])

    // Function to check and update access status in real-time
    const checkAccessStatus = useCallback(() => {
        if (!assignment || !dbUserId) return

        const now = new Date()
        const publishDate = new Date(assignment.publishAt)
        const dueDate = new Date(assignment.dueAt)

        let newStatus: "not-published" | "active" | "expired" = "active"

        if (now < publishDate) {
            newStatus = "not-published"
        } else if (now > dueDate) {
            newStatus = "expired"
        }

        // Only trigger actions if status actually changed
        if (newStatus !== accessStatus) {
            setPreviousAccessStatus(accessStatus)
            setAccessStatus(newStatus)

            // Trigger auto-submit if transitioning from active to expired
            if (newStatus === "expired" && accessStatus === "active") {
                handleAutoSubmitMemo(assignment, dbUserId, submissionState)
            }
        }
    }, [assignment, accessStatus, dbUserId, submissionState, handleAutoSubmitMemo])

    // Initial data fetch
    useEffect(() => {
        const fetchAssignmentAndUser = async () => {
            try {
                const [assignmentRes, userRes] = await Promise.all([
                    axios.get(`/api/student/assignments/${id}`),
                    axios.get("/api/users/me"),
                ])

                const fetchedAssignment = assignmentRes.data.assignment
                const fetchedUserId = userRes.data.user._id

                setAssignment(fetchedAssignment)
                setDbUserId(fetchedUserId)

                // Set initial access status (will be monitored by real-time checker)
                const now = new Date()
                const publishDate = new Date(fetchedAssignment.publishAt)
                const dueDate = new Date(fetchedAssignment.dueAt)

                if (now < publishDate) {
                    setAccessStatus("not-published")
                } else if (now > dueDate) {
                    setAccessStatus("expired")
                    // If already expired on page load, auto-submit immediately
                    await handleAutoSubmitMemo(fetchedAssignment, fetchedUserId, submissionState)
                    return
                } else {
                    setAccessStatus("active")
                }

                const submissionsRes = await axios.get(
                    `/api/student/submissions/by-assignment/${id}?userId=${fetchedUserId}`
                )

                const submissions: Submission[] = submissionsRes.data.submissions || []

                const initialState: SubmissionState = {}

                fetchedAssignment.problems.forEach((problem: Problem) => {
                    const existingSubmission = submissions.find(
                        (submission) => submission.problemId === problem._id
                    )

                    const savedLanguage =
                        existingSubmission?.language || "cpp"

                    const starterForSavedLanguage =
                        problem.starterCode?.[savedLanguage as keyof typeof problem.starterCode] ||
                        FALLBACK_STARTER_CODE[savedLanguage as keyof typeof FALLBACK_STARTER_CODE]

                    initialState[problem._id] = {
                        code: existingSubmission?.code || starterForSavedLanguage,
                        language: savedLanguage,
                        loading: false,
                        message: existingSubmission
                            ? "Loaded your latest saved submission"
                            : "",
                    }
                })

                setSubmissionState(initialState)
            } catch (error) {
                console.error("Error fetching assignment or user:", error)
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchAssignmentAndUser()
        }
    }, [id])

    // Real-time access status checker - runs every second
    useEffect(() => {
        if (!assignment) return

        // Check immediately on mount
        checkAccessStatus()

        // Set up interval to check every second
        const interval = setInterval(checkAccessStatus, 1000)

        // Cleanup on unmount
        return () => clearInterval(interval)
    }, [assignment, checkAccessStatus])

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

    const handleInputChange = (
        problemId: string,
        field: "code" | "language",
        value: string
    ) => {
        setSubmissionState((prev) => ({
            ...prev,
            [problemId]: {
                ...prev[problemId],
                [field]: value,
            },
        }))
    }

    const handleLanguageChange = (
        problemId: string,
        language: string,
        starterCode?: {
            cpp?: string
            java?: string
            python?: string
            javascript?: string
        }
    ) => {
        setSubmissionState((prev) => ({
            ...prev,
            [problemId]: {
                ...prev[problemId],
                language,
                code:
                    starterCode?.[language as keyof typeof starterCode] ||
                    FALLBACK_STARTER_CODE[language as keyof typeof FALLBACK_STARTER_CODE],
                message: "",
            },
        }))
    }

    const handleResetCode = (
        problemId: string,
        starterCode?: {
            cpp?: string
            java?: string
            python?: string
            javascript?: string
        }
    ) => {
        const language = submissionState[problemId]?.language || "cpp"
        const code =
            starterCode?.[language as keyof typeof starterCode] ||
            FALLBACK_STARTER_CODE[language as keyof typeof FALLBACK_STARTER_CODE]

        setSubmissionState((prev) => ({
            ...prev,
            [problemId]: {
                ...prev[problemId],
                code,
                message: "Code reset to starter template",
            },
        }))
    }

    const handleSubmitSolution = async (problemId: string) => {
        // Prevent submission if assignment is not active
        if (accessStatus !== "active") {
            setSubmissionState((prev) => ({
                ...prev,
                [problemId]: {
                    ...prev[problemId],
                    message: accessStatus === "not-published"
                        ? "Assignment is not yet available for submission"
                        : "Assignment deadline has passed",
                },
            }))
            return
        }

        const current = submissionState[problemId]

        if (!current?.code.trim()) {
            setSubmissionState((prev) => ({
                ...prev,
                [problemId]: {
                    ...prev[problemId],
                    message: "Code is required",
                },
            }))
            return
        }

        try {
            setSubmissionState((prev) => ({
                ...prev,
                [problemId]: {
                    ...prev[problemId],
                    loading: true,
                    message: "",
                },
            }))

            await axios.post("/api/student/submissions", {
                assignmentId: assignment?._id,
                problemId,
                userId: dbUserId,
                code: current.code,
                language: current.language,
            })

            setSubmissionState((prev) => ({
                ...prev,
                [problemId]: {
                    ...prev[problemId],
                    loading: false,
                    message: "Submission saved successfully",
                },
            }))
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error && 'response' in error
                    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    : "Failed to save submission"
            setSubmissionState((prev) => ({
                ...prev,
                [problemId]: {
                    ...prev[problemId],
                    loading: false,
                    message: errorMessage || "Failed to save submission",
                },
            }))
        }
    }

    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
                <div className="rounded-2xl border bg-background p-10 text-center shadow-sm">
                    <p className="text-sm text-muted-foreground">Loading assignment...</p>
                </div>
            </div>
        )
    }

    if (!assignment) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
                <div className="rounded-2xl border bg-background p-10 text-center shadow-sm">
                    <h2 className="text-lg font-semibold">Assignment not found</h2>
                </div>
            </div>
        )
    }

    if (accessStatus === "not-published") {
        const publishDate = new Date(assignment.publishAt)
        return (
            <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
                <div className="rounded-2xl border bg-background p-10 text-center shadow-sm">
                    <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-4 text-lg font-semibold">Assignment Not Yet Available</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        This assignment will be available on{" "}
                        <span className="font-medium text-foreground">
                            {publishDate.toLocaleString()}
                        </span>
                    </p>
                    <p className="mt-4 text-sm text-muted-foreground">
                        Please check back later to view and submit your solutions.
                    </p>
                </div>
            </div>
        )
    }

    if (accessStatus === "expired" || autoSubmitting) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
                <div className="rounded-2xl border bg-background p-10 text-center shadow-sm">
                    <Clock3 className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-4 text-lg font-semibold">
                        {autoSubmitting ? "Submitting your assignment..." : "Assignment Deadline Passed"}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {autoSubmitting
                            ? "Please wait while we submit your code."
                            : "Redirecting you to the assignments page..."}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
            <div className="rounded-2xl border bg-background p-6 shadow-sm">
                <div className="space-y-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{assignment.title}</h1>
                        <p className="mt-2 text-sm text-muted-foreground">{assignment.description}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border p-4">
                            <p className="text-sm text-muted-foreground">Total Problems</p>
                            <h2 className="mt-2 text-xl font-bold">{assignment.totalProblems}</h2>
                        </div>

                        <div className="rounded-xl border p-4">
                            <p className="text-sm text-muted-foreground">Total Marks</p>
                            <h2 className="mt-2 text-xl font-bold">{assignment.totalMarks}</h2>
                        </div>

                        <div className="rounded-xl border p-4">
                            <p className="text-sm text-muted-foreground">Published</p>
                            <h2 className="mt-2 text-sm font-medium">
                                {new Date(assignment.publishAt).toLocaleString()}
                            </h2>
                        </div>

                        <div className="rounded-xl border p-4">
                            <p className="text-sm text-muted-foreground">Due Date</p>
                            <h2 className="mt-2 text-sm font-medium">
                                {new Date(assignment.dueAt).toLocaleString()}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                {assignment.problems?.map((problem, index) => (
                    <div
                        key={problem._id}
                        className="rounded-2xl border bg-background p-6 shadow-sm"
                    >
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-semibold">
                                        Problem {index + 1}: {problem.title}
                                    </h2>
                                    <div className="mt-2 flex flex-wrap gap-2">
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
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-2 font-medium">Description</h3>
                                <p className="text-sm leading-6 text-muted-foreground">
                                    {problem.description}
                                </p>
                            </div>

                            {problem.constraints?.length > 0 && (
                                <div>
                                    <h3 className="mb-2 font-medium">Constraints</h3>
                                    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                                        {problem.constraints.map((constraint, idx) => (
                                            <li key={idx}>{constraint}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {problem.examples?.length > 0 && (
                                <div>
                                    <h3 className="mb-3 font-medium">Examples</h3>
                                    <div className="space-y-4">
                                        {problem.examples.map((example, idx) => (
                                            <div key={idx} className="rounded-xl border p-4">
                                                <p className="text-sm">
                                                    <span className="font-medium text-foreground">Input:</span>{" "}
                                                    <span className="text-muted-foreground">{example.input}</span>
                                                </p>
                                                <p className="mt-2 text-sm">
                                                    <span className="font-medium text-foreground">Output:</span>{" "}
                                                    <span className="text-muted-foreground">{example.output}</span>
                                                </p>
                                                {example.explanation && (
                                                    <p className="mt-2 text-sm">
                                                        <span className="font-medium text-foreground">Explanation:</span>{" "}
                                                        <span className="text-muted-foreground">{example.explanation}</span>
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {problem.tags?.length > 0 && (
                                <div>
                                    <h3 className="mb-2 font-medium">Tags</h3>
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
                                </div>
                            )}

                            <div className="space-y-4 rounded-xl border p-4">
                                <div className="grid gap-4 md:grid-cols-4">
                                    <div className="md:col-span-1">
                                        <label className="mb-2 block text-sm font-medium">Language</label>
                                        <select
                                            value={submissionState[problem._id]?.language || "cpp"}
                                            onChange={(e) =>
                                                handleLanguageChange(problem._id, e.target.value, problem.starterCode)
                                            }
                                            className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none"
                                        >
                                            <option value="cpp">C++</option>
                                            <option value="java">Java</option>
                                            <option value="python">Python</option>
                                            <option value="javascript">JavaScript</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-3">
                                        <div className="mb-2 flex items-center justify-between">
                                            <label className="block text-sm font-medium">Your Code</label>
                                            <button
                                                onClick={() => handleResetCode(problem._id, problem.starterCode)}
                                                className="inline-flex items-center gap-1.5 rounded-md border border-muted bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                title="Reset to starter code"
                                            >
                                                <RotateCCWIcon size={14} />
                                                <span>Reset</span>
                                            </button>
                                        </div>
                                        <CodeEditor
                                            language={submissionState[problem._id]?.language || "cpp"}
                                            value={submissionState[problem._id]?.code || ""}
                                            onChange={(value) => handleInputChange(problem._id, "code", value)}
                                        />
                                    </div>
                                </div>

                                {submissionState[problem._id]?.message && (
                                    <p className="text-sm text-muted-foreground">
                                        {submissionState[problem._id].message}
                                    </p>
                                )}

                                <button
                                    onClick={() => handleSubmitSolution(problem._id)}
                                    disabled={submissionState[problem._id]?.loading}
                                    className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                                >
                                    {submissionState[problem._id]?.loading
                                        ? "Submitting..."
                                        : "Submit Solution"}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}