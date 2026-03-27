'use client'

import { CodeEditor } from "@/components/editor/code-editor"
import axios from "axios"
import { useParams, useRouter } from "next/navigation"
import React, { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import {
    CalendarDays,
    Clock3,
    FileText,
    Award,
    Clock,
    CheckCircle2,
    AlertCircle,
    Lightbulb,
    Code2,
    Save,
    RotateCcw,
    Loader2,
    BookOpen,
    Tag,
} from "lucide-react"
import { RotateCCWIcon } from "@/components/ui/rotate-ccw"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"
import { ExampleCard } from "@/components/ui/example-card"
import { Progress } from "@/components/ui/progress"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import { useTimeRemaining } from "@/hooks/use-time-remaining"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { AssignmentDetailSkeleton } from "@/components/ui/skeleton"

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

function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
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

    const { timeRemaining, isExpiringSoon } = useTimeRemaining(assignment?.dueAt || "")

    // Count submitted problems
    const submittedCount = Object.values(submissionState).filter(
        (state) => state.message === "Submission saved successfully"
    ).length

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

    const getDifficultyVariant = (difficulty: string) => {
        switch (difficulty) {
            case "Easy":
                return "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400"
            case "Medium":
                return "border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
            case "Hard":
                return "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400"
            default:
                return "border-muted bg-muted text-muted-foreground"
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

    // Keyboard shortcuts for save and reset
    useKeyboardShortcuts({
        onSave: () => {
            const firstProblemId = assignment?.problems[0]?._id
            if (firstProblemId) {
                handleSubmitSolution(firstProblemId)
            }
        },
        onReset: () => {
            const firstProblemId = assignment?.problems[0]?._id
            if (firstProblemId) {
                handleResetCode(firstProblemId, assignment.problems[0].starterCode)
            }
        },
        enabled: accessStatus === "active" && !!assignment,
    })

    if (loading) {
        return <AssignmentDetailSkeleton />
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
            {/* Enhanced Header */}
            <div className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-background to-muted p-8 shadow-sm">
                {/* Decorative background */}
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />

                <div className="relative z-10">
                    {/* Header with icon */}
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                            <FileText className="h-7 w-7" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold tracking-tight">{assignment.title}</h1>
                            <p className="mt-2 text-sm text-muted-foreground">{assignment.description}</p>
                        </div>
                        <Badge variant="outline" className="gap-1">
                            <BookOpen className="h-3 w-3" />
                            {assignment.totalProblems} Problems
                        </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-muted-foreground">Submission Progress</span>
                            <span className="font-medium text-primary">
                                {submittedCount}/{assignment.totalProblems} Completed
                            </span>
                        </div>
                        <Progress
                            value={(submittedCount / assignment.totalProblems) * 100}
                            className="mt-2 h-2"
                        />
                    </div>

                    {/* Enhanced Stats Grid */}
                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border bg-primary/5 p-4 transition-all duration-300 hover:shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                                    <Award className="h-5 w-5 icon-hover-scale" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Total Marks</p>
                                    <p className="text-2xl font-bold text-primary">{assignment.totalMarks}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border bg-background p-4 transition-all duration-300 hover:shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                                    <CalendarDays className="h-5 w-5 icon-hover-scale" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Published</p>
                                    <p className="text-sm font-medium">{formatDate(assignment.publishAt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border bg-background p-4 transition-all duration-300 hover:shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                                    <Clock3 className="h-5 w-5 icon-hover-scale" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Due Date</p>
                                    <p className="text-sm font-medium">{formatDate(assignment.dueAt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className={`rounded-xl border p-4 transition-all duration-300 hover:shadow-md ${isExpiringSoon
                            ? "border-yellow-500/50 bg-yellow-500/10"
                            : "border-green-500/50 bg-green-500/10"
                            }`}>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                                    <Clock className={`h-5 w-5 icon-pulse ${isExpiringSoon ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"
                                        }`} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Time Remaining</p>
                                    <p className={`text-sm font-bold ${isExpiringSoon ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"
                                        }`}>
                                        {timeRemaining}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Problem Cards */}
            <div className="grid gap-6">
                {assignment.problems?.map((problem, index) => {
                    const isSubmitted = submissionState[problem._id]?.message === "Submission saved successfully"

                    return (
                        <div
                            key={problem._id}
                            className="group relative overflow-hidden rounded-2xl border bg-background shadow-sm transition-all duration-300 hover:shadow-md"
                        >
                            {/* Submission Status Indicator */}
                            {isSubmitted && (
                                <div className="absolute -right-1 -top-1 z-10">
                                    <div className="flex items-center gap-1 rounded-bl-xl rounded-tr-xl bg-green-500 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Saved
                                    </div>
                                </div>
                            )}

                            <div className="p-6">
                                {/* Enhanced Header */}
                                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                                                {index + 1}
                                            </span>
                                            <h2 className="text-xl font-semibold">{problem.title}</h2>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className={`gap-1 ${getDifficultyVariant(problem.difficulty)}`}
                                            >
                                                {problem.difficulty === 'Easy' && <CheckCircle2 className="h-3 w-3" />}
                                                {problem.difficulty === 'Medium' && <AlertCircle className="h-3 w-3" />}
                                                {problem.difficulty === 'Hard' && <Lightbulb className="h-3 w-3" />}
                                                {problem.difficulty}
                                            </Badge>
                                            <Badge variant="secondary" className="gap-1">
                                                <Award className="h-3 w-3" />
                                                {problem.marks} marks
                                            </Badge>
                                            {isSubmitted && (
                                                <Badge variant="success" className="gap-1">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Submitted
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs for Description, Examples */}
                                <Tabs defaultValue="description" className="mb-6">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="description" className="gap-2">
                                            <FileText className="h-4 w-4" />
                                            Description
                                        </TabsTrigger>
                                        <TabsTrigger value="examples" className="gap-2">
                                            <Lightbulb className="h-4 w-4" />
                                            Examples
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Description Tab */}
                                    <TabsContent value="description" className="space-y-4">
                                        <div>
                                            <h3 className="mb-2 flex items-center gap-2 font-medium">
                                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                Problem Statement
                                            </h3>
                                            <p className="text-sm leading-7 text-muted-foreground">
                                                {problem.description}
                                            </p>
                                        </div>

                                        {problem.constraints?.length > 0 && (
                                            <Collapsible defaultOpen={false}>
                                                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-muted/50 p-3 text-sm font-medium hover:bg-muted/80 transition-colors">
                                                    <span className="flex items-center gap-2">
                                                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                                        Constraints ({problem.constraints.length})
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <ul className="mt-3 space-y-2 rounded-lg border bg-background p-4">
                                                        {problem.constraints.map((constraint, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                                                {constraint}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        )}

                                        {problem.tags?.length > 0 && (
                                            <div>
                                                <h3 className="mb-2 flex items-center gap-2 font-medium">
                                                    <Code2 className="h-4 w-4 text-muted-foreground" />
                                                    Topics
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {problem.tags.map((tag, idx) => (
                                                        <Badge
                                                            key={idx}
                                                            variant="outline"
                                                            className="gap-1 hover:bg-muted transition-colors cursor-default"
                                                        >
                                                            <Tag className="h-3 w-3" />
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* Examples Tab */}
                                    <TabsContent value="examples" className="space-y-4">
                                        {problem.examples?.map((example, idx) => (
                                            <ExampleCard
                                                key={idx}
                                                example={example}
                                                exampleNumber={idx + 1}
                                            />
                                        ))}
                                    </TabsContent>
                                </Tabs>

                                {/* Enhanced Code Editor Area */}
                                <div className="rounded-xl border bg-muted/30 p-4">
                                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <label className="text-sm font-medium">Language</label>
                                            <Select
                                                value={submissionState[problem._id]?.language || "cpp"}
                                                onValueChange={(lang) => handleLanguageChange(problem._id, lang, problem.starterCode)}
                                            >
                                                <SelectTrigger className="w-[160px] gap-2">
                                                    <Code2 className="h-4 w-4" />
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cpp">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                                            C++
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="java">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-red-500" />
                                                            Java
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="python">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                                            Python
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="javascript">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-green-500" />
                                                            JavaScript
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleResetCode(problem._id, problem.starterCode)}
                                                className="gap-1.5"
                                                disabled={submissionState[problem._id]?.loading || accessStatus !== "active"}
                                            >
                                                <RotateCcw className="h-4 w-4 icon-hover-scale" />
                                                Reset
                                            </Button>
                                            <Button
                                                onClick={() => handleSubmitSolution(problem._id)}
                                                disabled={submissionState[problem._id]?.loading || accessStatus !== "active"}
                                                className="gap-1.5"
                                                size="sm"
                                            >
                                                {submissionState[problem._id]?.loading ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 icon-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4 icon-hover-scale" />
                                                        Save
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    <CodeEditor
                                        language={submissionState[problem._id]?.language || "cpp"}
                                        value={submissionState[problem._id]?.code || ""}
                                        onChange={(value) => handleInputChange(problem._id, "code", value)}
                                    />

                                    {/* Status Message */}
                                    {submissionState[problem._id]?.message && (
                                        <Alert
                                            variant={
                                                submissionState[problem._id]?.message.includes("successfully")
                                                    ? "success"
                                                    : submissionState[problem._id]?.message.includes("reset")
                                                        ? "info"
                                                        : "default"
                                            }
                                            className="mt-4"
                                        >
                                            {submissionState[problem._id]?.message}
                                        </Alert>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
