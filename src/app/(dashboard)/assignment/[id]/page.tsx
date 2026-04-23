'use client'

import { CodeEditor } from "@/components/editor/code-editor"
import axios from "axios"
import { useParams, useRouter } from "next/navigation"
import React, { useEffect, useState, useCallback, useRef } from "react"
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus"
import { toast } from "sonner"
import {
    AlertCircle,
    ArrowLeft,
    Award,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Clock3,
    Code2,
    FileText,
    Lightbulb,
    Loader2,
    Play,
    RotateCcw,
    Save,
    Send,
    Terminal,
} from "lucide-react"
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
import { useTimeRemaining } from "@/hooks/use-time-remaining"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { AssignmentDetailSkeleton } from "@/components/ui/skeleton"
import { TestResultsDisplay, TestResult } from "@/components/ui/test-results-display"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

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
        loadingAction?: "running" | "submitting"
        message: string
        messageType?: "success" | "error" | "info" | "compile-error"
        compilationError?: string
        testResults?: TestResult[]
        executionTime?: number
        memoryUsed?: number
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
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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
    const [submitAssignmentDialogOpen, setSubmitAssignmentDialogOpen] = useState(false)
    const [submittingAssignment, setSubmittingAssignment] = useState(false)
    const [activeProblemIndex, setActiveProblemIndex] = useState(0)
    const [leftTab, setLeftTab] = useState("description")
    const [bottomTab, setBottomTab] = useState("console")

    const submissionStateRef = useRef(submissionState)
    useEffect(() => {
        submissionStateRef.current = submissionState
    }, [submissionState])

    const { timeRemaining, isExpiringSoon } = useTimeRemaining(assignment?.dueAt || "")

    const submittedCount = Object.values(submissionState).filter(
        (state) => state.messageType === "success"
    ).length

    const safeActiveProblemIndex = assignment?.problems?.length
        ? Math.min(activeProblemIndex, assignment.problems.length - 1)
        : 0
    const activeProblem = assignment?.problems?.[safeActiveProblemIndex] || null
    const activeSubmission = activeProblem ? submissionState[activeProblem._id] : undefined

    const handleAutoSubmitMemo = useCallback(async (currentAssignment: Assignment, currentUserId: string, currentState: SubmissionState) => {
        if (autoSubmitting) return

        setAutoSubmitting(true)

        try {
            const submissionPromises = currentAssignment.problems.map((problem) => {
                const problemState = currentState[problem._id]
                const codeToSubmit = problemState?.code || problem.starterCode?.cpp || ""
                const languageToSubmit = problemState?.language || "cpp"

                if (!codeToSubmit || !languageToSubmit) {
                    return Promise.resolve(null)
                }

                return axios.post("/api/student/submissions", {
                    assignmentId: currentAssignment._id,
                    problemId: problem._id,
                    userId: currentUserId,
                    code: codeToSubmit,
                    language: languageToSubmit,
                    runTests: false,
                }).catch(() => null)
            })

            const results = await Promise.all(submissionPromises)
            const successfulSubmissions = results.filter((result) => result !== null)

            toast.success("Assignment submitted successfully", {
                description: `Successfully submitted ${successfulSubmissions.length}/${currentAssignment.problems.length} problems.`,
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

        if (newStatus !== accessStatus) {
            setAccessStatus(newStatus)

            if (newStatus === "expired" && accessStatus === "active") {
                void handleAutoSubmitMemo(assignment, dbUserId, submissionStateRef.current)
            }
        }
    }, [assignment, accessStatus, dbUserId, handleAutoSubmitMemo])

    const fetchAssignmentAndUser = useCallback(async () => {
        if (!id) return

        try {
            const [assignmentRes, userRes] = await Promise.all([
                axios.get(`/api/student/assignments/${id}`),
                axios.get("/api/users/me"),
            ])

            if (!assignmentRes.data?.assignment || !userRes.data?.user?._id) {
                return
            }

            const fetchedAssignment = assignmentRes.data.assignment
            const fetchedUserId = userRes.data.user._id

            setAssignment(fetchedAssignment)
            setDbUserId(fetchedUserId)

            const now = new Date()
            const publishDate = new Date(fetchedAssignment.publishAt)
            const dueDate = new Date(fetchedAssignment.dueAt)

            if (now < publishDate) {
                setAccessStatus("not-published")
            } else if (now > dueDate) {
                setAccessStatus("expired")
                await handleAutoSubmitMemo(fetchedAssignment, fetchedUserId, submissionStateRef.current)
                return
            } else {
                setAccessStatus("active")
            }

            const submissionsRes = await axios.get(
                `/api/student/submissions/by-assignment/${id}?userId=${fetchedUserId}`
            )

            const submissions: Submission[] = submissionsRes.data.submissions || []

            if (Object.keys(submissionStateRef.current).length === 0) {
                const initialState: SubmissionState = {}

                fetchedAssignment.problems.forEach((problem: Problem) => {
                    const existingSubmission = submissions.find(
                        (submission) => submission.problemId === problem._id
                    )

                    const savedLanguage = existingSubmission?.language || "cpp"
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
            }
        } catch (error) {
            console.error("Error fetching assignment or user:", error)
        } finally {
            setLoading(false)
        }
    }, [id, handleAutoSubmitMemo])

    useEffect(() => {
        if (assignment && dbUserId && accessStatus === "active") {
            const syncAttendance = async () => {
                try {
                    await axios.post("/api/attendance/sync-assignment", {
                        assignmentId: assignment._id,
                    })
                } catch (error) {
                    console.error("Attendance sync failed:", error)
                }
            }
            void syncAttendance()
        }
    }, [assignment, dbUserId, accessStatus])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchAssignmentAndUser()
        }, 0)

        return () => window.clearTimeout(timer)
    }, [fetchAssignmentAndUser])

    useRefetchOnFocus(fetchAssignmentAndUser)

    useEffect(() => {
        if (!assignment) return

        const timer = window.setTimeout(() => {
            checkAccessStatus()
        }, 0)
        const interval = window.setInterval(checkAccessStatus, 1000)
        return () => {
            window.clearTimeout(timer)
            window.clearInterval(interval)
        }
    }, [assignment, checkAccessStatus])

    const getDifficultyVariant = (difficulty: string) => {
        switch (difficulty) {
            case "Easy":
                return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
            case "Medium":
                return "border-amber-500/20 bg-amber-500/10 text-amber-500"
            case "Hard":
                return "border-rose-500/20 bg-rose-500/10 text-rose-500"
            default:
                return "border-border/60 bg-background/70 text-foreground"
        }
    }

    const handleInputChange = (problemId: string, field: "code" | "language", value: string) => {
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
                messageType: undefined,
                compilationError: undefined,
                testResults: undefined,
            },
        }))
        setBottomTab("console")
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
                messageType: "info",
                compilationError: undefined,
                testResults: undefined,
            },
        }))
        setBottomTab("console")
    }

    const handleRunCode = async (problemId: string) => {
        const current = submissionState[problemId]

        if (!current?.code || !current.code.trim()) {
            setSubmissionState((prev) => ({
                ...prev,
                [problemId]: {
                    ...prev[problemId],
                    message: "Code is required",
                    messageType: "error",
                },
            }))
            return
        }

        if (!current.language) {
            setSubmissionState((prev) => ({
                ...prev,
                [problemId]: {
                    ...prev[problemId],
                    message: "Programming language is required",
                    messageType: "error",
                },
            }))
            return
        }

        try {
            setBottomTab("console")
            setSubmissionState((prev) => ({
                ...prev,
                [problemId]: {
                    ...prev[problemId],
                    loading: true,
                    loadingAction: "running",
                    message: "",
                    messageType: undefined,
                    compilationError: undefined,
                    testResults: undefined,
                },
            }))

            const response = await axios.post("/api/compile", {
                code: current.code,
                language: current.language,
            })

            setSubmissionState((prev) => ({
                ...prev,
                [problemId]: {
                    ...prev[problemId],
                    loading: false,
                    loadingAction: undefined,
                    message: response.data.output || "(no output)",
                    messageType: "info",
                    compilationError: undefined,
                    executionTime: response.data.executionTime,
                    memoryUsed: response.data.memoryUsed,
                    testResults: undefined,
                },
            }))

            toast.success("Code ran successfully")
        } catch (error: unknown) {
            const errData = axios.isAxiosError(error) ? error.response?.data : null

            setSubmissionState((prev) => ({
                ...prev,
                [problemId]: {
                    ...prev[problemId],
                    loading: false,
                    loadingAction: undefined,
                    message: errData?.message || "Failed to run code",
                    messageType: errData?.compilationError ? "compile-error" : "error",
                    compilationError: errData?.compilationError ? errData.error : undefined,
                    testResults: undefined,
                },
            }))

            toast.error(errData?.compilationError ? "Compilation failed" : "Failed to run code")
        }
    }

    const handleSubmitSolution = async (problemId: string) => {
        if (accessStatus !== "active") {
            setSubmissionState((prev) => ({
                ...prev,
                [problemId]: {
                    ...prev[problemId],
                    message: accessStatus === "not-published"
                        ? "Assignment is not yet available for submission"
                        : "Assignment deadline has passed",
                    messageType: "error",
                },
            }))
            return
        }

        const current = submissionState[problemId]

        if (!current?.code || !current.code.trim()) {
            setSubmissionState((prev) => ({
                ...prev,
                [problemId]: {
                    ...prev[problemId],
                    message: "Code is required",
                    messageType: "error",
                },
            }))
            return
        }

        if (!current.language) {
            setSubmissionState((prev) => ({
                ...prev,
                [problemId]: {
                    ...prev[problemId],
                    message: "Programming language is required",
                    messageType: "error",
                },
            }))
            return
        }

        try {
            setBottomTab("tests")
            setSubmissionState((prev) => ({
                ...prev,
                [problemId]: {
                    ...prev[problemId],
                    loading: true,
                    loadingAction: "submitting",
                    message: "",
                    messageType: undefined,
                    compilationError: undefined,
                    testResults: undefined,
                },
            }))

            const response = await axios.post("/api/student/submissions", {
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
                    loadingAction: undefined,
                    message: "All test cases passed. Submission saved successfully.",
                    messageType: "success",
                    compilationError: undefined,
                    testResults: response.data.testResults || [],
                    executionTime: response.data.executionTime,
                    memoryUsed: response.data.memoryUsed,
                },
            }))

            toast.success("All test cases passed", {
                description: `Your solution passed ${response.data.passedTests || 0}/${response.data.totalTests || 0} test cases and was submitted.`,
            })
        } catch (error: unknown) {
            const errData = axios.isAxiosError(error) ? error.response?.data : null

            setBottomTab("tests")
            setSubmissionState((prev) => ({
                ...prev,
                [problemId]: {
                    ...prev[problemId],
                    loading: false,
                    loadingAction: undefined,
                    message: errData?.message || "Failed to submit",
                    messageType: errData?.compilationError ? "compile-error" : "error",
                    compilationError: errData?.compilationError ? errData.error : undefined,
                    testResults: errData?.testResults || [],
                    executionTime: errData?.executionTime || 0,
                    memoryUsed: errData?.memoryUsed || 0,
                },
            }))

            if (errData?.compilationError) {
                toast.error("Compilation failed", {
                    description: "Fix the errors and try again.",
                })
            } else if (errData?.testResults && errData.passedTests !== undefined) {
                toast.error(`${errData.passedTests}/${errData.totalTests} test cases passed`, {
                    description: "Fix the failing test cases and try again.",
                })
            } else {
                toast.error(errData?.message || "Failed to submit")
            }
        }
    }

    const handleFinalSubmit = async () => {
        if (!assignment || !dbUserId) return

        setSubmittingAssignment(true)

        try {
            const response = await axios.post(`/api/student/assignments/${assignment._id}/submit`, {
                userId: dbUserId,
            })

            toast.success("Assignment submitted successfully", {
                description: `Score: ${response.data.totalScore}/${response.data.maxScore}`,
            })

            setSubmitAssignmentDialogOpen(false)
            router.push("/assignment")
        } catch (error) {
            console.error("Final submission error:", error)
            toast.error("Failed to submit assignment", {
                description: "Please try again or contact support.",
            })
        } finally {
            setSubmittingAssignment(false)
        }
    }

    useKeyboardShortcuts({
        onSave: () => {
            if (activeProblem) {
                void handleSubmitSolution(activeProblem._id)
            }
        },
        onReset: () => {
            if (activeProblem) {
                handleResetCode(activeProblem._id, activeProblem.starterCode)
            }
        },
        enabled: accessStatus === "active" && !!activeProblem,
    })

    const moveProblem = (direction: "prev" | "next") => {
        setActiveProblemIndex((prev) => {
            const nextIndex = direction === "next" ? prev + 1 : prev - 1
            return Math.max(0, Math.min(nextIndex, (assignment?.problems.length || 1) - 1))
        })
        setLeftTab("description")
    }

    if (loading) {
        return <AssignmentDetailSkeleton />
    }

    if (!assignment) {
        return (
            <CenteredState
                icon={<FileText className="h-12 w-12 text-muted-foreground" />}
                title="Assignment not found"
                description="We couldn&apos;t load this assignment."
            />
        )
    }

    if (accessStatus === "not-published") {
        return (
            <CenteredState
                icon={<CalendarDays className="h-12 w-12 text-muted-foreground" />}
                title="Assignment not yet available"
                description={`This assignment will be available on ${new Date(assignment.publishAt).toLocaleString()}.`}
            />
        )
    }

    if (accessStatus === "expired" || autoSubmitting) {
        return (
            <CenteredState
                icon={<Clock3 className="h-12 w-12 text-muted-foreground" />}
                title={autoSubmitting ? "Submitting your assignment..." : "Assignment deadline passed"}
                description={
                    autoSubmitting
                        ? "Please wait while we submit your latest work."
                        : "Your assignment has closed. Redirecting you back to the assignment list."
                }
            />
        )
    }

    if (!activeProblem) {
        return (
            <CenteredState
                icon={<BookOpen className="h-12 w-12 text-muted-foreground" />}
                title="No problems available"
                description="This assignment does not contain any problems yet."
            />
        )
    }

    const problemProgress = assignment.problems.map((problem) => ({
        problem,
        saved: submissionState[problem._id]?.messageType === "success",
    }))

    return (
        <div className="flex flex-col gap-4 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
            <section className="rounded-[24px] border border-border/60 bg-card/80 shadow-[0_20px_56px_-36px_rgba(0,0,0,0.55)]">
                <div className="flex flex-col gap-4 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-cyan-500 shadow-none">
                                    <Code2 className="mr-1.5 h-3.5 w-3.5" />
                                    Solving Workspace
                                </Badge>
                                <Badge variant="outline" className="rounded-full px-3 py-1">
                                    {assignment.totalProblems} problems
                                </Badge>
                                <Badge variant="outline" className="rounded-full px-3 py-1">
                                    {assignment.totalMarks} marks
                                </Badge>
                            </div>

                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                    {assignment.title}
                                </h1>
                                <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">
                                    {assignment.description}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="outline"
                                className="rounded-2xl"
                                onClick={() => router.push("/assignment")}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                            <Button
                                className="rounded-2xl"
                                onClick={() => setSubmitAssignmentDialogOpen(true)}
                            >
                                <Send className="mr-2 h-4 w-4" />
                                Submit Assignment
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr_0.8fr]">
                        <div className="rounded-[20px] border border-border/60 bg-background/55 px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                        Progress
                                    </p>
                                    <p className="mt-1 text-lg font-semibold text-foreground">
                                        {submittedCount}/{assignment.totalProblems} saved
                                    </p>
                                </div>
                                <Badge variant="outline" className="rounded-full px-3 py-1">
                                    Problem {safeActiveProblemIndex + 1}
                                </Badge>
                            </div>
                            <Progress value={(submittedCount / assignment.totalProblems) * 100} className="mt-3 h-2" />
                        </div>

                        <div className="rounded-[20px] border border-border/60 bg-background/55 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Time Remaining
                            </p>
                            <p className={cn(
                                "mt-1 text-lg font-semibold",
                                isExpiringSoon ? "text-amber-500" : "text-foreground"
                            )}>
                                {timeRemaining}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {isExpiringSoon ? "Deadline is close, submit carefully." : "You still have working time available."}
                            </p>
                        </div>

                        <div className="rounded-[20px] border border-border/60 bg-background/55 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Current Question
                            </p>
                            <p className="mt-1 text-lg font-semibold text-foreground">
                                {safeActiveProblemIndex + 1}. {activeProblem.title}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {activeProblem.marks} marks
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-[24px] border border-border/60 bg-card/80 p-4 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Problem Navigator
                        </p>
                        <h2 className="mt-1 text-lg font-semibold tracking-tight">
                            Move between questions without leaving the page
                        </h2>
                    </div>
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                        {safeActiveProblemIndex + 1} active
                    </Badge>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-1">
                    {problemProgress.map(({ problem, saved }, index) => (
                        <button
                            key={problem._id}
                            type="button"
                            onClick={() => {
                                setActiveProblemIndex(index)
                                setLeftTab("description")
                            }}
                            className={cn(
                                "min-w-[220px] rounded-[20px] border px-4 py-3 text-left transition-all",
                                index === safeActiveProblemIndex
                                    ? "border-primary/30 bg-primary/5 shadow-sm"
                                    : "border-border/60 bg-background/55 hover:border-primary/20 hover:shadow-sm"
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-background text-xs font-semibold text-muted-foreground">
                                            {index + 1}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className={cn("rounded-full px-2.5 py-1", getDifficultyVariant(problem.difficulty))}
                                        >
                                            {problem.difficulty}
                                        </Badge>
                                    </div>
                                    <p className="line-clamp-1 font-medium text-foreground">{problem.title}</p>
                                    <p className="text-xs text-muted-foreground">{problem.marks} marks</p>
                                </div>
                                {saved ? (
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
                                ) : (
                                    <div className="mt-0.5 h-5 w-5 rounded-full border border-border/60 bg-background" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.96fr_1.04fr] xl:items-start">
                <section className="rounded-[24px] border border-border/60 bg-card/80 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
                    <div className="border-b border-border/60 p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className={cn("rounded-full px-3 py-1", getDifficultyVariant(activeProblem.difficulty))}>
                                        {activeProblem.difficulty}
                                    </Badge>
                                    <Badge variant="outline" className="rounded-full px-3 py-1">
                                        <Award className="mr-1.5 h-3.5 w-3.5" />
                                        {activeProblem.marks} marks
                                    </Badge>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold tracking-tight">
                                        {safeActiveProblemIndex + 1}. {activeProblem.title}
                                    </h2>
                                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                                        Focus on one question at a time, then move to the next when you are ready.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="rounded-2xl"
                                    disabled={safeActiveProblemIndex === 0}
                                    onClick={() => moveProblem("prev")}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="rounded-2xl"
                                    disabled={safeActiveProblemIndex === assignment.problems.length - 1}
                                    onClick={() => moveProblem("next")}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5">
                        <Tabs value={leftTab} onValueChange={setLeftTab} className="space-y-4">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="description">Description</TabsTrigger>
                                <TabsTrigger value="examples">Examples</TabsTrigger>
                                <TabsTrigger value="notes">Constraints</TabsTrigger>
                            </TabsList>

                            <TabsContent value="description" className="mt-0 space-y-4">
                                <div>
                                    <h3 className="mb-2 flex items-center gap-2 font-medium">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        Problem statement
                                    </h3>
                                    <div className="rounded-[20px] border border-border/60 bg-background/40 p-4">
                                        <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                                            {activeProblem.description}
                                        </p>
                                    </div>
                                </div>

                                {activeProblem.tags?.length > 0 && (
                                    <div>
                                        <h3 className="mb-2 flex items-center gap-2 font-medium">
                                            <Code2 className="h-4 w-4 text-muted-foreground" />
                                            Topics
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {activeProblem.tags.map((tag, idx) => (
                                                <Badge key={idx} variant="outline" className="rounded-full px-3 py-1">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="examples" className="mt-0 space-y-4">
                                {activeProblem.examples?.length > 0 ? (
                                    activeProblem.examples.map((example, idx) => (
                                        <ExampleCard key={idx} example={example} exampleNumber={idx + 1} />
                                    ))
                                ) : (
                                    <EmptyPanel message="No examples were provided for this problem." />
                                )}
                            </TabsContent>

                            <TabsContent value="notes" className="mt-0 space-y-3">
                                {activeProblem.constraints?.length > 0 ? (
                                    activeProblem.constraints.map((constraint, idx) => (
                                        <Collapsible key={idx} defaultOpen={idx === 0}>
                                            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-background/65 p-3 text-left text-sm font-medium">
                                                <span className="flex items-center gap-2">
                                                    <Lightbulb className="h-4 w-4 text-muted-foreground" />
                                                    Constraint {idx + 1}
                                                </span>
                                                <ChevronRight className="h-4 w-4 transition-transform data-[state=open]:rotate-90" />
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="px-1 pt-2">
                                                <div className="rounded-2xl border border-border/60 bg-background/55 p-4 text-sm leading-6 text-muted-foreground">
                                                    {constraint}
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    ))
                                ) : (
                                    <EmptyPanel message="No extra constraints were provided for this problem." />
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </section>

                <section className="rounded-[24px] border border-border/60 bg-card/80 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
                    <div className="border-b border-border/60 p-4 sm:p-5">
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Select
                                    value={activeSubmission?.language || "cpp"}
                                    onValueChange={(lang) => handleLanguageChange(activeProblem._id, lang, activeProblem.starterCode)}
                                >
                                    <SelectTrigger className="h-11 w-[170px] rounded-2xl gap-2">
                                        <Code2 className="h-4 w-4" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cpp">C++</SelectItem>
                                        <SelectItem value="java">Java</SelectItem>
                                        <SelectItem value="python">Python</SelectItem>
                                        <SelectItem value="javascript">JavaScript</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Badge variant="outline" className="h-11 rounded-full px-4">
                                    <Clock className="mr-1.5 h-3.5 w-3.5" />
                                    {timeRemaining}
                                </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="rounded-2xl"
                                    onClick={() => handleResetCode(activeProblem._id, activeProblem.starterCode)}
                                    disabled={activeSubmission?.loading || accessStatus !== "active"}
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                                <Button
                                    variant="outline"
                                    className="rounded-2xl"
                                    onClick={() => handleRunCode(activeProblem._id)}
                                    disabled={activeSubmission?.loading}
                                >
                                    {activeSubmission?.loading && activeSubmission?.loadingAction === "running" ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Play className="mr-2 h-4 w-4" />
                                    )}
                                    Run
                                </Button>
                                <Button
                                    className="rounded-2xl"
                                    onClick={() => handleSubmitSolution(activeProblem._id)}
                                    disabled={activeSubmission?.loading || accessStatus !== "active"}
                                >
                                    {activeSubmission?.loading && activeSubmission?.loadingAction === "submitting" ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Submit
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5">
                        <div>
                            <CodeEditor
                                language={activeSubmission?.language || "cpp"}
                                value={activeSubmission?.code || ""}
                                onChange={(value) => handleInputChange(activeProblem._id, "code", value)}
                            />
                        </div>

                        <div className="mt-5 border-t border-border/60 pt-5">
                            <Tabs value={bottomTab} onValueChange={setBottomTab} className="space-y-4">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="console">
                                        <Terminal className="mr-2 h-4 w-4" />
                                        Console
                                    </TabsTrigger>
                                    <TabsTrigger value="tests">
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Test Results
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="console" className="mt-0">
                                    <ConsolePanel state={activeSubmission} />
                                </TabsContent>

                                <TabsContent value="tests" className="mt-0">
                                    {activeSubmission?.testResults?.length ? (
                                        <div>
                                            <TestResultsDisplay
                                                results={activeSubmission.testResults}
                                                totalExecutionTime={activeSubmission.executionTime}
                                                totalMemoryUsed={activeSubmission.memoryUsed}
                                            />
                                        </div>
                                    ) : (
                                        <EmptyPanel message="Submit your solution to see full test case results here." />
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </section>
            </section>

            <Dialog open={submitAssignmentDialogOpen} onOpenChange={setSubmitAssignmentDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Submit Assignment</DialogTitle>
                        <DialogDescription>
                            You are about to finalize this assignment. Saved problem submissions will be counted.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Saved problems</span>
                                    <span className="font-medium text-foreground">
                                        {submittedCount}/{assignment.totalProblems}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Deadline</span>
                                    <span className="font-medium text-foreground">
                                        {formatDate(assignment.dueAt)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {submittedCount !== assignment.totalProblems && (
                            <Alert className="mt-4">
                                Some problems are still unsaved. Your current saved solutions will be submitted as they are.
                            </Alert>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setSubmitAssignmentDialogOpen(false)}
                            disabled={submittingAssignment}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleFinalSubmit} disabled={submittingAssignment}>
                            {submittingAssignment ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Final Submit
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function ConsolePanel({
    state,
}: {
    state?: SubmissionState[string]
}) {
    if (!state?.message && !state?.compilationError) {
        return <EmptyPanel message="Run your code to see console output here." />
    }

    if (state.compilationError) {
        return (
            <div className="rounded-[22px] border border-rose-500/20 bg-rose-500/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-500">
                    <AlertCircle className="h-4 w-4" />
                    Compilation error
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl bg-background/80 p-4 font-mono text-xs text-rose-400">
                    {state.compilationError}
                </pre>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {(state.executionTime !== undefined || state.memoryUsed !== undefined) && (
                <div className="flex flex-wrap gap-2">
                    {state.executionTime !== undefined && (
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            {state.executionTime} ms
                        </Badge>
                    )}
                    {state.memoryUsed !== undefined && state.memoryUsed > 0 && (
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            {state.memoryUsed} KB
                        </Badge>
                    )}
                </div>
            )}
            <div className="rounded-[22px] border border-border/60 bg-background/60 p-4">
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm text-foreground">
                    {state.message}
                </pre>
            </div>
        </div>
    )
}

function EmptyPanel({ message }: { message: string }) {
    return (
        <div className="flex h-full min-h-[140px] items-center justify-center rounded-[22px] border border-dashed border-border/60 bg-background/45 p-6 text-center text-sm text-muted-foreground">
            {message}
        </div>
    )
}

function CenteredState({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode
    title: string
    description: string
}) {
    return (
        <div className="flex h-[calc(100vh-4.5rem)] items-center justify-center px-4 pb-6 pt-2 sm:px-6 xl:px-8">
            <div className="w-full max-w-xl rounded-[28px] border border-border/60 bg-card/80 p-10 text-center shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
                <div className="flex justify-center">{icon}</div>
                <h2 className="mt-4 text-xl font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
        </div>
    )
}
