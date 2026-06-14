'use client'

import axios, { AxiosError } from "axios"
import { useParams, useRouter } from "next/navigation"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Clock3,
    Loader2,
    Shield,
    Sparkles,
    Target,
} from "lucide-react"
import { Alert } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useTimeRemaining } from "@/hooks/use-time-remaining"
import { AssignmentDetailSkeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type Question = {
    _id: string
    type: "mcq" | "one_word"
    prompt: string
    marks: number
    explanation?: string
    options?: Array<{ id: string; text: string }>
}

type Quiz = {
    _id: string
    title: string
    description: string
    totalQuestions: number
    totalMarks: number
    publishAt: string
    dueAt: string
    isSebRequired?: boolean
    status: "Upcoming" | "Active" | "Completed" | "Expired"
    questions: Question[]
}

type Attempt = {
    status: "pending" | "started" | "submitted" | "expired"
    score: number
    submittedAt?: string
    autoSubmitted?: boolean
    answeredCount?: number
}

type SebAccessErrorResponse = {
    sebError?: string
    message?: string
    quizTitle?: string
    submittedAt?: string
}

type AnswerState = Record<string, string>

export default function SingleQuizPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [quiz, setQuiz] = useState<Quiz | null>(null)
    const [attempt, setAttempt] = useState<Attempt | null>(null)
    const [loading, setLoading] = useState(true)
    const [dbUserId, setDbUserId] = useState("")
    const [answers, setAnswers] = useState<AnswerState>({})
    const [submitting, setSubmitting] = useState(false)
    const [autoSubmitting, setAutoSubmitting] = useState(false)
    const [sebError, setSebError] = useState<{
        message: string
        errorCode: string
        title?: string
        submittedAt?: string
    } | null>(null)

    const answersRef = useRef(answers)
    useEffect(() => {
        answersRef.current = answers
    }, [answers])

    const { timeRemaining, isExpiringSoon } = useTimeRemaining(quiz?.dueAt || "")
    const isExpired = timeRemaining === "Expired"

    const answeredCount = useMemo(
        () => Object.values(answers).filter((answer) => answer.trim() !== "").length,
        [answers]
    )

    const fetchQuizAndUser = useCallback(async () => {
        if (!id) return

        try {
            setLoading(true)

            let quizRes
            try {
                quizRes = await axios.get(`/api/student/quizzes/${id}`)
            } catch (error: unknown) {
                const axiosError = error as AxiosError<SebAccessErrorResponse>

                if (axiosError.response?.status === 403) {
                    const data = axiosError.response.data
                    if (data.sebError) {
                        setSebError({
                            message: data.message || "Secure quiz access is required.",
                            errorCode: data.sebError,
                            title: data.quizTitle,
                            submittedAt: data.submittedAt,
                        })
                        return
                    }
                }

                throw error
            }

            const userRes = await axios.get("/api/users/me")

            if (!quizRes.data?.quiz || !userRes.data?.user?._id) {
                return
            }

            setQuiz(quizRes.data.quiz as Quiz)
            setAttempt(quizRes.data.attempt as Attempt | null)
            setDbUserId(userRes.data.user._id as string)
            setSebError(null)
        } catch (error) {
            console.error("Failed to fetch quiz:", error)
            toast.error("Failed to load quiz")
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchQuizAndUser()
        }, 0)

        return () => window.clearTimeout(timer)
    }, [fetchQuizAndUser])

    const submitQuiz = useCallback(
        async (autoSubmit = false) => {
            if (!quiz || !dbUserId || submitting || autoSubmitting) return

            if (autoSubmit) {
                setAutoSubmitting(true)
            } else {
                setSubmitting(true)
            }

            try {
                const payload = {
                    userId: dbUserId,
                    autoSubmitted: autoSubmit,
                    answers: quiz.questions.map((question) => ({
                        questionId: question._id,
                        answer: answersRef.current[question._id] || "",
                    })),
                }

                const res = await axios.post(`/api/student/quizzes/${quiz._id}/submit`, payload)
                toast.success(
                    autoSubmit ? "Quiz auto-submitted" : "Quiz submitted successfully",
                    {
                        description: `Score: ${res.data.score}/${res.data.maxScore}`,
                    }
                )
                router.push("/quiz")
            } catch (error: unknown) {
                const axiosError = error as AxiosError<{ message?: string }>
                toast.error(axiosError.response?.data?.message || "Failed to submit quiz")
            } finally {
                setSubmitting(false)
                setAutoSubmitting(false)
            }
        },
        [autoSubmitting, dbUserId, quiz, router, submitting]
    )

    useEffect(() => {
        if (quiz?.status === "Active" && isExpired && !autoSubmitting && !submitting) {
            const timer = window.setTimeout(() => {
                void submitQuiz(true)
            }, 0)

            return () => window.clearTimeout(timer)
        }
    }, [autoSubmitting, isExpired, quiz?.status, submitQuiz, submitting])

    if (loading) {
        return <AssignmentDetailSkeleton />
    }

    if (sebError) {
        return (
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-8 pt-6 sm:px-6 xl:px-8">
                <Card className="rounded-[32px] border border-rose-500/20 bg-rose-500/5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
                    <CardContent className="space-y-5 p-6 sm:p-8">
                        <Badge className="w-fit rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-rose-500 shadow-none">
                            <Shield className="mr-1.5 h-3.5 w-3.5" />
                            Secure Access Required
                        </Badge>
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight">
                                {sebError.title || "Quiz access is locked"}
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                {sebError.message}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button onClick={() => router.push(`/quiz/start/${id}`)}>
                                Open Secure Launch Page
                            </Button>
                            <Button variant="outline" onClick={() => router.push("/quiz")}>
                                Back to Quizzes
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!quiz) {
        return (
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-8 pt-6 sm:px-6 xl:px-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>Quiz not found</span>
                </Alert>
            </div>
        )
    }

    const isLocked = quiz.status !== "Active"

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
            <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-linear-to-br from-card via-card to-emerald-500/10 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_30%)]" />
                <div className="relative grid gap-6 px-5 py-6 sm:px-7 sm:py-7 xl:grid-cols-[1.2fr_0.8fr] xl:px-8">
                    <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-500 shadow-none">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Quiz Workspace
                            </Badge>
                            {quiz.isSebRequired && (
                                <Badge className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-rose-500 shadow-none">
                                    <Shield className="mr-1.5 h-3.5 w-3.5" />
                                    SEB Protected
                                </Badge>
                            )}
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                <Target className="mr-1.5 h-3.5 w-3.5" />
                                {quiz.totalQuestions} questions
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <Button
                                variant="ghost"
                                className="h-auto w-fit rounded-full px-0 text-muted-foreground"
                                onClick={() => router.push("/quiz")}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to quizzes
                            </Button>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                {quiz.title}
                            </h1>
                            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                                {quiz.description}
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <MetricCard
                            icon={Clock3}
                            label="Time Remaining"
                            value={quiz.status === "Active" ? timeRemaining || "Ending now" : quiz.status}
                            helper={isExpiringSoon ? "Less than 10 minutes left" : "Quiz closes automatically at due time"}
                            tone={isExpiringSoon ? "amber" : "emerald"}
                        />
                        <MetricCard
                            icon={CheckCircle2}
                            label="Progress"
                            value={`${answeredCount}/${quiz.totalQuestions}`}
                            helper="Questions answered in your current attempt"
                            tone="sky"
                        />
                        <MetricCard
                            icon={Target}
                            label="Marks"
                            value={`${quiz.totalMarks}`}
                            helper="Maximum possible score"
                            tone="violet"
                        />
                    </div>
                </div>
            </section>

            {quiz.status === "Upcoming" && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <span>This quiz has not opened yet. It becomes available at {new Date(quiz.publishAt).toLocaleString()}.</span>
                </Alert>
            )}

            {quiz.status === "Expired" && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>This quiz is past its due time and can no longer be attempted.</span>
                </Alert>
            )}

            {quiz.status === "Completed" && (
                <Alert className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                        Quiz submitted{attempt?.submittedAt ? ` on ${new Date(attempt.submittedAt).toLocaleString()}` : ""}.
                        {typeof attempt?.score === "number" ? ` Score: ${attempt.score}/${quiz.totalMarks}.` : ""}
                    </span>
                </Alert>
            )}

            <section className="space-y-4">
                {quiz.questions.length > 0 ? (
                    quiz.questions.map((question, index) => (
                        <Card
                            key={question._id}
                            className="rounded-[28px] border-border/60 bg-card/80 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]"
                        >
                            <CardContent className="space-y-5 p-5 sm:p-6">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">Question {index + 1}</Badge>
                                    <Badge variant="outline">
                                        {question.type === "mcq" ? "MCQ" : "One Word / One Line"}
                                    </Badge>
                                    <Badge variant="outline">{question.marks} marks</Badge>
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold tracking-tight">
                                        {question.prompt}
                                    </h2>
                                </div>

                                {question.type === "mcq" ? (
                                    <div className="grid gap-3">
                                        {(question.options || []).map((option) => {
                                            const isSelected = answers[question._id] === option.id
                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    disabled={isLocked}
                                                    onClick={() =>
                                                        setAnswers((current) => ({
                                                            ...current,
                                                            [question._id]: option.id,
                                                        }))
                                                    }
                                                    className={cn(
                                                        "rounded-[24px] border border-border/60 px-4 py-4 text-left transition",
                                                        isLocked && "cursor-not-allowed opacity-70",
                                                        isSelected
                                                            ? "border-emerald-500/30 bg-emerald-500/10"
                                                            : "bg-background/70 hover:border-primary/30"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={cn(
                                                                "flex h-5 w-5 items-center justify-center rounded-full border",
                                                                isSelected
                                                                    ? "border-emerald-500 bg-emerald-500"
                                                                    : "border-muted-foreground/40"
                                                            )}
                                                        >
                                                            {isSelected ? <div className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                                                        </div>
                                                        <span className="text-sm font-medium leading-6">{option.text}</span>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Your answer</label>
                                        <Input
                                            value={answers[question._id] || ""}
                                            disabled={isLocked}
                                            onChange={(event) =>
                                                setAnswers((current) => ({
                                                    ...current,
                                                    [question._id]: event.target.value,
                                                }))
                                            }
                                            placeholder="Type your answer"
                                            className="h-12 rounded-2xl"
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="rounded-[28px] border-border/60 bg-card/80">
                        <CardContent className="p-6 text-sm leading-6 text-muted-foreground">
                            No active quiz questions are available in this state.
                        </CardContent>
                    </Card>
                )}
            </section>

            <section className="sticky bottom-4 z-10">
                <div className="flex flex-col gap-4 rounded-[28px] border border-border/60 bg-background/90 p-4 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold">Ready to submit?</p>
                        <p className="text-sm text-muted-foreground">
                            You can submit only once. After that, the quiz will be locked.
                        </p>
                    </div>
                    <Button
                        onClick={() => void submitQuiz(false)}
                        disabled={isLocked || submitting || autoSubmitting}
                        className="h-12 rounded-2xl px-6"
                    >
                        {submitting || autoSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {autoSubmitting ? "Auto-submitting..." : "Submitting..."}
                            </>
                        ) : (
                            "Submit Quiz"
                        )}
                    </Button>
                </div>
            </section>
        </div>
    )
}

function MetricCard({
    icon: Icon,
    label,
    value,
    helper,
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
    helper: string
    tone: "emerald" | "amber" | "sky" | "violet"
}) {
    return (
        <div className="rounded-[24px] border border-border/60 bg-background/70 p-4">
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "rounded-2xl p-3",
                        tone === "emerald" && "bg-emerald-500/10 text-emerald-500",
                        tone === "amber" && "bg-amber-500/10 text-amber-500",
                        tone === "sky" && "bg-sky-500/10 text-sky-500",
                        tone === "violet" && "bg-violet-500/10 text-violet-500"
                    )}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {label}
                    </p>
                    <p className="text-lg font-semibold tracking-tight">{value}</p>
                </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{helper}</p>
        </div>
    )
}
