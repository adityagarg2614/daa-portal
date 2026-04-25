'use client'

import { CodeEditor } from "@/components/editor/code-editor"
import axios, { AxiosError } from "axios"
import { useParams, useRouter } from "next/navigation"
import React, { useEffect, useState, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus"
import { toast } from "sonner"
import {
    AlertCircle,
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
    ShieldAlert,
    Terminal,
    Trophy,
    ArrowRight
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
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card"
import {
    AlertTitle,
    AlertDescription,
} from "@/components/ui/alert"
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

type SebAccessErrorResponse = {
    sebError?: string
    message?: string
    assignmentTitle?: string
    submittedAt?: string
}

type SebAccessState = {
    message: string
    errorCode: string
    title?: string
    submittedAt?: string
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
    const [sebError, setSebError] = useState<SebAccessState | null>(null)
    const [isError, setIsError] = useState(false)
    const [isStarting, setIsStarting] = useState(false)
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

    const handleStartExam = useCallback(async () => {
        setIsStarting(true)
        router.push(`/exam/start/${id}`)
    }, [id, router])

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
            setLoading(true);
            setIsError(false);

            // 1. Fetch Assignment First (Critical for SEB/Access checks)
            let assignmentRes;
            try {
                assignmentRes = await axios.get(`/api/student/assignments/${id}`);
            } catch (error: unknown) {
                const axiosError = error as AxiosError<SebAccessErrorResponse>

                if (axiosError.response?.status === 403) {
                    const data = axiosError.response.data
                    if (data.sebError) {
                        setSebError({
                            message: data.message || "Secure exam access is required for this assignment.",
                            errorCode: data.sebError,
                            title: data.assignmentTitle,
                            submittedAt: data.submittedAt
                        });
                        setIsError(false);
                        return;
                    }
                }
                throw error; // Re-throw if not a handled SEB 403
            }

            // 2. Fetch User details for personalized submission state
            const userRes = await axios.get("/api/users/me")

            if (!assignmentRes.data?.assignment || !userRes.data?.user?._id) {
                return
            }

            const fetchedAssignment: Assignment = assignmentRes.data.assignment
            const fetchedUserId = userRes.data.user._id as string

            if (!fetchedUserId) {
                throw new Error("User not authenticated");
            }

            setAssignment(fetchedAssignment);
            setDbUserId(fetchedUserId);
            setSebError(null);
            setIsError(false);

            const now = new Date()
            const publishDate = new Date(fetchedAssignment.publishAt)
            const dueDate = new Date(fetchedAssignment.dueAt)

            if (now < publishDate) {
                setAccessStatus("not-published");
            } else if (now > dueDate) {
                setAccessStatus("expired")
                await handleAutoSubmitMemo(fetchedAssignment, fetchedUserId, submissionStateRef.current)
                return
            } else {
                setAccessStatus("active");
            }

            const submissionsRes = await axios.get(
                `/api/student/submissions/by-assignment/${id}?userId=${fetchedUserId}`
            )

            const submissions: Submission[] = submissionsRes.data.submissions || []

            if (Object.keys(submissionStateRef.current).length === 0) {
                const initialState: SubmissionState = {};
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
                        message: existingSubmission ? "Loaded your latest saved submission" : "",
                    };
                });
                setSubmissionState(initialState);
            }
            } catch (error: unknown) {
                const axiosError = error as AxiosError<SebAccessErrorResponse>

                // Silence all 4xx errors as they are likely security blocks (403) or not found (404)
                // which we handle via specialized UI states rather than toasts.
                if (
                    axiosError.response?.status &&
                    axiosError.response.status >= 400 &&
                    axiosError.response.status < 500
                ) {
                    const data = axiosError.response.data
                    if (data?.sebError) {
                        setSebError({
                            message: data.message || "Secure exam access is required for this assignment.",
                            errorCode: data.sebError,
                            title: data.assignmentTitle,
                        submittedAt: data.submittedAt
                    });
                }
                setIsError(false);
                setLoading(false);
                return;
            }

            console.error("Error fetching assignment data:", error);
            setIsError(true);
            toast.error("An unexpected error occurred while loading the assignment.");
        } finally {
            setLoading(false);
        }
    }, [id, handleAutoSubmitMemo]);

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
                problemId,
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
            router.push(`/exam/finished?score=${response.data.totalScore}&maxScore=${response.data.maxScore}&title=${encodeURIComponent(assignment.title)}`)
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

    if (sebError && sebError.errorCode === "ALREADY_SUBMITTED") {
        return (
            <div className="flex flex-1 items-center justify-center p-6 bg-linear-to-b from-transparent to-zinc-50/50 dark:to-zinc-950/20 min-h-[85vh]">
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-2xl"
                >
                    <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] bg-white dark:bg-zinc-900/90 backdrop-blur-xl overflow-hidden rounded-3xl">
                        <div className="h-2 bg-linear-to-r from-green-400 to-emerald-600" />
                        <CardHeader className="text-center pt-12 pb-8 px-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                                className="mx-auto w-24 h-24 bg-linear-to-br from-green-500/20 to-emerald-600/10 rounded-3xl rotate-12 flex items-center justify-center mb-8 shadow-inner"
                            >
                                <CheckCircle2 className="h-12 w-12 text-green-500 -rotate-12" />
                            </motion.div>
                            <CardTitle className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-4">
                                Well Done!
                            </CardTitle>
                            <CardDescription className="text-xl font-semibold text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                                Your solutions for <span className="text-zinc-900 dark:text-white">{sebError.title || "the assignment"}</span> have been submitted!
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="px-10 pb-12 overflow-visible">
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl p-8 border border-zinc-100 dark:border-zinc-800/50 mb-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 relative"
                            >
                                <div className="space-y-4 text-center sm:text-left">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Completion Status</p>
                                        <div className="flex items-center justify-center sm:justify-start gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                            <p className="text-xl font-black text-green-600 dark:text-green-400">Success</p>
                                        </div>
                                    </div>

                                    {sebError.submittedAt && (
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Timestamp</p>
                                            <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
                                                {new Date(sebError.submittedAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(sebError.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex -space-x-3 opacity-50 select-none sm:flex">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="w-12 h-12 rounded-full border-4 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                                            <Trophy className="w-5 h-5 text-zinc-400" />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                        className="w-full h-14 rounded-2xl text-lg font-black shadow-2xl shadow-green-500/30 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-none transition-all group"
                                        onClick={() => router.push("/results")}
                                    >
                                        Review Progress
                                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </motion.div>
                                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                        variant="outline"
                                        className="w-full h-14 rounded-2xl text-lg font-black border-2 border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                        onClick={() => router.push("/home")}
                                    >
                                        Dashboard
                                    </Button>
                                </motion.div>
                            </div>
                        </CardContent>
                    </Card>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="flex flex-col items-center gap-4 mt-12"
                    >
                        <div className="p-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-full">
                            <Clock className="w-5 h-5 text-zinc-400" />
                        </div>
                        <p className="text-center font-bold text-zinc-400 dark:text-zinc-500 text-sm tracking-wide">
                            YOUR EXAM SESSION IS CLOSED. YOU MAY SAFELY EXIT NOW.
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        )
    }

    if (sebError) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-8 bg-muted/30">
                <Card className="w-full max-w-lg border-none shadow-2xl">
                    <CardHeader className="text-center pb-2">
                        <div className={`mx-auto w-20 h-20 ${sebError.errorCode === "ALREADY_SUBMITTED" ? "bg-green-500/10" : "bg-destructive/10"} rounded-full flex items-center justify-center mb-4`}>
                            {sebError.errorCode === "ALREADY_SUBMITTED" ? (
                                <CheckCircle2 className="h-10 w-10 text-green-500" />
                            ) : (
                                <ShieldAlert className="h-10 w-10 text-destructive" />
                            )}
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            {sebError.errorCode === "ALREADY_SUBMITTED" ? "Submission Complete" : "Secure Exam Access Required"}
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                            {sebError.title || "This assignment"} is protected by Safe Exam Browser.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center py-6">
                        <Alert variant={sebError.errorCode === "ALREADY_SUBMITTED" ? "default" : "destructive"} className={sebError.errorCode === "ALREADY_SUBMITTED" ? "bg-green-500/10 text-green-700 border-green-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                            {sebError.errorCode === "ALREADY_SUBMITTED" ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                                <AlertCircle className="h-4 w-4" />
                            )}
                            <AlertTitle className="font-bold">
                                {sebError.errorCode === "ALREADY_SUBMITTED" ? "Success" : "Access Denied"}
                            </AlertTitle>
                            <AlertDescription className="text-sm font-medium">
                                {sebError.message}
                                {sebError.submittedAt && (
                                    <div className="mt-2 text-xs opacity-80 italic">
                                        Submitted on: {new Date(sebError.submittedAt).toLocaleString()}
                                    </div>
                                )}
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-4 text-sm text-muted-foreground bg-muted/50 p-4 rounded-xl border border-dashed">
                            <p className="font-semibold text-foreground">Next Steps to Access:</p>
                            <ul className="list-decimal list-inside text-left space-y-2 max-w-xs mx-auto">
                                <li>Launch the **Safe Exam Browser** app</li>
                                <li>Log in to your portal inside SEB</li>
                                <li>Navigate to this assignment and click **Enter Exam**</li>
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 p-6">
                        {sebError.errorCode === "ALREADY_SUBMITTED" ? (
                            <Button
                                className="w-full h-11 font-bold shadow-lg bg-green-600 hover:bg-green-700"
                                onClick={() => router.push("/results")}
                            >
                                View Detailed Results
                            </Button>
                        ) : (sebError.errorCode === "SEB_REQUIRED" || sebError.errorCode === "ATTEMPT_REQUIRED") ? (
                            <Button
                                className="w-full h-11 font-bold shadow-lg bg-green-600 hover:bg-green-700"
                                onClick={handleStartExam}
                                disabled={isStarting}
                            >
                                {isStarting ? "Initializing..." : "Start Exam Attempt Now"}
                            </Button>
                        ) : (
                            <Button
                                className="w-full h-11 font-bold shadow-lg"
                                onClick={() => router.push(`/exam/start/${id}`)}
                            >
                                Return to Exam Instructions
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            className="w-full text-muted-foreground"
                            onClick={() => router.push("/home")}
                        >
                            Back to Dashboard
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex flex-1 items-center justify-center p-8 bg-background/95 backdrop-blur-sm min-h-[60vh]">
                <Card className="w-full max-w-md border-none shadow-2xl bg-card">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="h-10 w-10 text-destructive" />
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Failed to load assignment</CardTitle>
                        <CardDescription className="text-base mt-2">
                            An unexpected error occurred while connecting to the server.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-col gap-3 p-6 text-center">
                        <Button
                            className="w-full"
                            onClick={fetchAssignmentAndUser}
                        >
                            Retry Loading
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => router.push("/home")}
                        >
                            Return to Dashboard
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
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
