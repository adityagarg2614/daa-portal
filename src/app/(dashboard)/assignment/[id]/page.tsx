'use client'

import { CodeEditor } from "@/components/editor/code-editor"
import axios from "axios"
import { useParams, useRouter } from "next/navigation"
import React, { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus"
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
    Send,
    ClipboardCheck,
    Play,
    Terminal,
    ChevronRight,
    Trophy,
    ArrowRight
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
import { ChevronDown } from "lucide-react"
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
import { ShieldAlert } from "lucide-react"

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
        loadingAction?: 'running' | 'submitting'
        message: string
        messageType?: 'success' | 'error' | 'info' | 'compile-error'
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
    const [submitAssignmentDialogOpen, setSubmitAssignmentDialogOpen] = useState(false)
    const [submittingAssignment, setSubmittingAssignment] = useState(false)
    const [sebError, setSebError] = useState<{ message: string; errorCode: string; title?: string; submittedAt?: string } | null>(null)
    const [isStarting, setIsStarting] = useState(false)
    const [isError, setIsError] = useState(false)

    // Ref to access the latest submissionState without causing re-renders
    const submissionStateRef = useRef(submissionState)
    useEffect(() => {
        submissionStateRef.current = submissionState
    }, [submissionState])

    const { timeRemaining, isExpiringSoon } = useTimeRemaining(assignment?.dueAt || "")

    // Count submitted problems
    const submittedCount = Object.values(submissionState).filter(
        (state) => state.messageType === "success"
    ).length

    // Memoized version of handleAutoSubmit for use in useCallback

    const handleAutoSubmitMemo = useCallback(async (currentAssignment: Assignment, currentUserId: string, currentState: SubmissionState) => {
        if (autoSubmitting) return

        setAutoSubmitting(true)

        try {
            const submissionPromises = currentAssignment.problems.map((problem) => {
                const problemState = currentState[problem._id]
                const codeToSubmit = problemState?.code || problem.starterCode?.cpp || ""
                const languageToSubmit = problemState?.language || "cpp"

                // Validate before submitting
                if (!codeToSubmit || !languageToSubmit) {
                    console.error(`Invalid code or language for problem ${problem._id}`)
                    return Promise.resolve(null)
                }

                return axios.post("/api/student/submissions", {
                    assignmentId: currentAssignment._id,
                    problemId: problem._id,
                    userId: currentUserId,
                    code: codeToSubmit,
                    language: languageToSubmit,
                    runTests: false, // Skip test validation on auto-submit
                }).catch((error) => {
                    console.error(`Failed to auto-submit problem ${problem._id}:`, error.response?.data || error.message)
                    return null
                })
            })

            const results = await Promise.all(submissionPromises)
            const successfulSubmissions = results.filter(r => r !== null)

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
                handleAutoSubmitMemo(assignment, dbUserId, submissionStateRef.current)
            }
        }
    }, [assignment, accessStatus, dbUserId, handleAutoSubmitMemo])

    // Fetch assignment data when id changes
    const handleStartExam = async () => {
        setIsStarting(true)
        try {
            const res = await fetch(`/api/student/exam/start/${id}`, {
                method: "POST",
            })
            const data = await res.json()
            if (data.success) {
                toast.success("Exam attempt initialized!")
                await fetchAssignmentAndUser()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error("Start Exam Error:", error)
            toast.error("Failed to start exam. Check connection.")
        } finally {
            setIsStarting(false)
        }
    }

    const fetchAssignmentAndUser = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);
            setIsError(false);

            // 1. Fetch Assignment First (Critical for SEB/Access checks)
            let assignmentRes;
            try {
                assignmentRes = await axios.get(`/api/student/assignments/${id}`);
            } catch (error: any) {
                if (error.response?.status === 403) {
                    const data = error.response.data;
                    if (data.sebError) {
                        setSebError({
                            message: data.message,
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

            // 2. Fetch User & Submissions
            const [userRes, submissionsRes] = await Promise.all([
                axios.get("/api/users/me"),
                axios.get(`/api/student/submissions/by-assignment/${id}`)
            ]);

            if (!assignmentRes.data?.assignment) {
                throw new Error("Assignment not found");
            }

            const fetchedAssignment = assignmentRes.data.assignment;
            const fetchedUserId = userRes.data?.user?._id;
            const submissions = submissionsRes.data?.submissions || [];

            if (!fetchedUserId) {
                throw new Error("User not authenticated");
            }

            setAssignment(fetchedAssignment);
            setDbUserId(fetchedUserId);
            setSebError(null);
            setIsError(false);

            // Set initial access status
            const now = new Date();
            const publishDate = new Date(fetchedAssignment.publishAt);
            const dueDate = new Date(fetchedAssignment.dueAt);

            if (now < publishDate) {
                setAccessStatus("not-published");
            } else if (now > dueDate) {
                setAccessStatus("expired");
                await handleAutoSubmitMemo(fetchedAssignment, fetchedUserId, submissionStateRef.current);
                return;
            } else {
                setAccessStatus("active");
            }

            // Initialize submission state...
            if (Object.keys(submissionStateRef.current).length === 0) {
                const initialState: SubmissionState = {};
                fetchedAssignment.problems.forEach((problem: Problem) => {
                    const existingSubmission = submissions.find((s: any) => s.problemId === problem._id);
                    const savedLanguage = existingSubmission?.language || "cpp";
                    const starter = problem.starterCode?.[savedLanguage as keyof typeof problem.starterCode] ||
                        FALLBACK_STARTER_CODE[savedLanguage as keyof typeof FALLBACK_STARTER_CODE];

                    initialState[problem._id] = {
                        code: existingSubmission?.code || starter,
                        language: savedLanguage,
                        loading: false,
                        message: existingSubmission ? "Loaded your latest saved submission" : "",
                    };
                });
                setSubmissionState(initialState);
            }
        } catch (error: any) {
            // Silence all 4xx errors as they are likely security blocks (403) or not found (404)
            // which we handle via specialized UI states rather than toasts.
            if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
                const data = error.response.data;
                if (data?.sebError) {
                    setSebError({
                        message: data.message,
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

    // Attendance Sync
    useEffect(() => {
        if (assignment && dbUserId && accessStatus === "active") {
            const syncAttendance = async () => {
                try {
                    await axios.post("/api/attendance/sync-assignment", {
                        assignmentId: assignment._id
                    })
                } catch (error) {
                    console.error("Attendance sync failed:", error)
                }
            }
            syncAttendance()
        }
    }, [assignment?._id, dbUserId, accessStatus])

    // Initial data fetch
    useEffect(() => {
        fetchAssignmentAndUser()
    }, [fetchAssignmentAndUser])

    // Refetch when navigating back via browser back button or window focus
    useRefetchOnFocus(fetchAssignmentAndUser)

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

    // Run Code — compile & execute without saving (uses /api/compile)
    const handleRunCode = async (problemId: string) => {
        const current = submissionState[problemId]

        if (!current?.code || !current.code.trim()) {
            setSubmissionState((prev) => ({
                ...prev,
                [problemId]: {
                    ...prev[problemId],
                    message: "Code is required",
                    messageType: 'error' as const,
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
                    messageType: 'error' as const,
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
                    loadingAction: 'running' as const,
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
                    message: response.data.output || "(no out)",
                    messageType: 'info' as const,
                    compilationError: undefined,
                    executionTime: response.data.executionTime,
                    memoryUsed: response.data.memoryUsed,
                },
            }))

            toast.success("Code ran successfully!")
        } catch (error: unknown) {
            const errData = axios.isAxiosError(error) ? error.response?.data : null

            setSubmissionState((prev) => ({
                ...prev,
                [problemId]: {
                    ...prev[problemId],
                    loading: false,
                    loadingAction: undefined,
                    message: errData?.message || "Failed to run code",
                    messageType: errData?.compilationError ? 'compile-error' as const : 'error' as const,
                    compilationError: errData?.compilationError ? errData.error : undefined,
                },
            }))

            if (errData?.compilationError) {
                toast.error("Compilation failed", {
                    description: "Fix the errors and try again.",
                })
            } else {
                toast.error(errData?.message || "Failed to run code")
            }
        }
    }

    // Submit — compile, run all test cases, and save only if all pass
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
                    messageType: 'error' as const,
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
                    messageType: 'error' as const,
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
                    messageType: 'error' as const,
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
                    loadingAction: 'submitting' as const,
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
                    message: "All test cases passed! Submission saved successfully.",
                    messageType: 'success' as const,
                    compilationError: undefined,
                    testResults: response.data.testResults || [],
                    executionTime: response.data.executionTime,
                    memoryUsed: response.data.memoryUsed,
                },
            }))

            toast.success("All test cases passed! ✅", {
                description: `Your solution passed ${response.data.passedTests || 0}/${response.data.totalTests || 0} test cases and was submitted.`,
            })
        } catch (error: unknown) {
            const errData = axios.isAxiosError(error) ? error.response?.data : null

            setSubmissionState((prev) => ({
                ...prev,
                [problemId]: {
                    ...prev[problemId],
                    loading: false,
                    loadingAction: undefined,
                    message: errData?.message || "Failed to submit",
                    messageType: errData?.compilationError ? 'compile-error' as const : 'error' as const,
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

            toast.success("Assignment submitted successfully!", {
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
            <div className="flex flex-1 flex-col items-center justify-center p-8 min-h-[60vh]">
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Assignment not found</h2>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        We couldn't find the assignment you're looking for. It might have been deleted or the link is incorrect.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => router.push("/home")}
                        className="mt-4"
                    >
                        Back to Dashboard
                    </Button>
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
                        <div className="flex gap-2">
                            <Badge variant="outline" className="gap-1">
                                <BookOpen className="h-3 w-3" />
                                {assignment.totalProblems} Problems
                            </Badge>
                            <Button
                                onClick={() => setSubmitAssignmentDialogOpen(true)}
                                className="gap-2"
                                size="sm"
                            >
                                <Send className="h-4 w-4" />
                                Submit Assignment
                            </Button>
                        </div>
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
                    const isSubmitted = submissionState[problem._id]?.messageType === "success"

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
                                                variant="outline"
                                                onClick={() => handleRunCode(problem._id)}
                                                disabled={submissionState[problem._id]?.loading}
                                                className="gap-1.5"
                                                size="sm"
                                            >
                                                {submissionState[problem._id]?.loading && submissionState[problem._id]?.loadingAction === 'running' ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 icon-spin" />
                                                        Compiling...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="h-4 w-4 icon-hover-scale" />
                                                        Run Code
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                onClick={() => handleSubmitSolution(problem._id)}
                                                disabled={submissionState[problem._id]?.loading || accessStatus !== "active"}
                                                className="gap-1.5"
                                                size="sm"
                                            >
                                                {submissionState[problem._id]?.loading && submissionState[problem._id]?.loadingAction === 'submitting' ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 icon-spin" />
                                                        Testing & Submitting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="h-4 w-4 icon-hover-scale" />
                                                        Submit
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

                                    {/* Compilation Error Display */}
                                    {submissionState[problem._id]?.compilationError && (
                                        <div className="mt-4 rounded-xl border border-red-500/50 bg-red-500/5 p-4">
                                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
                                                <Terminal className="h-4 w-4" />
                                                Compilation Error
                                            </div>
                                            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-red-950/10 dark:bg-red-950/30 p-3 font-mono text-xs text-red-700 dark:text-red-300">
                                                {submissionState[problem._id]?.compilationError}
                                            </pre>
                                        </div>
                                    )}

                                    {/* Status Message */}
                                    {submissionState[problem._id]?.message && !submissionState[problem._id]?.compilationError && (
                                        <Alert
                                            variant={
                                                submissionState[problem._id]?.messageType === "success"
                                                    ? "success"
                                                    : submissionState[problem._id]?.messageType === "info"
                                                        ? "info"
                                                        : submissionState[problem._id]?.messageType === "error"
                                                            ? "destructive"
                                                            : "default"
                                            }
                                            className="mt-4"
                                        >
                                            {submissionState[problem._id]?.message}
                                        </Alert>
                                    )}

                                    {/* Run Code Output (for Run Code mode) */}
                                    {submissionState[problem._id]?.messageType === "info" && submissionState[problem._id]?.message && !submissionState[problem._id]?.testResults?.length && (
                                        <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                                            <div className="mb-1 text-xs font-medium text-muted-foreground">Output:</div>
                                            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm">
                                                {submissionState[problem._id]?.message}
                                            </pre>
                                        </div>
                                    )}

                                    {/* Test Results Display */}
                                    {submissionState[problem._id]?.testResults && submissionState[problem._id]?.testResults!.length > 0 && (
                                        <TestResultsDisplay
                                            results={submissionState[problem._id]?.testResults!}
                                            totalExecutionTime={submissionState[problem._id]?.executionTime}
                                            totalMemoryUsed={submissionState[problem._id]?.memoryUsed}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Submit Assignment Dialog */}
            <Dialog open={submitAssignmentDialogOpen} onOpenChange={setSubmitAssignmentDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ClipboardCheck className="h-5 w-5" />
                            Submit Assignment
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to submit your assignment? This will finalize your submission.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="rounded-lg border bg-muted/50 p-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Problems Completed</span>
                                    <span className="font-medium">
                                        {submittedCount}/{assignment?.totalProblems}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge
                                        variant={submittedCount === assignment?.totalProblems ? "success" : "outline"}
                                    >
                                        {submittedCount === assignment?.totalProblems
                                            ? "All problems attempted"
                                            : "Some problems pending"}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {submittedCount !== assignment?.totalProblems && (
                            <Alert variant="default" className="mt-4">
                                <AlertCircle className="h-4 w-4" />
                                <div className="ml-2">
                                    <p className="text-sm">
                                        You haven&apos;t attempted all problems yet. Your current submissions will be submitted as-is.
                                    </p>
                                </div>
                            </Alert>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setSubmitAssignmentDialogOpen(false)}
                            disabled={submittingAssignment}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleFinalSubmit}
                            disabled={submittingAssignment}
                            className="gap-2"
                        >
                            {submittingAssignment ? (
                                <>
                                    <Loader2 className="h-4 w-4 icon-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Submit & Redirect
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
