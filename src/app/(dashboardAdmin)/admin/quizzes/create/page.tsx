'use client'

import axios from "axios"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    CircleDot,
    ClipboardList,
    FileQuestion,
    Grip,
    ListChecks,
    Loader2,
    Plus,
    SearchCheck,
    Shield,
    Sparkles,
    Trash2,
    Type,
} from "lucide-react"
import { Alert } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type QuestionType = "mcq" | "one_word"

type OptionDraft = {
    id: string
    text: string
}

type QuestionDraft = {
    id: string
    type: QuestionType
    prompt: string
    marks: number
    options: OptionDraft[]
    correctAnswer: string
    explanation: string
}

type QuizDetailsResponse = {
    data: {
        title: string
        description: string
        batch?: "A" | "B" | null
        publishAt: string
        dueAt: string
        isSebRequired?: boolean
        questions: Array<{
            _id: string
            type: QuestionType
            prompt: string
            marks: number
            correctAnswer: string
            explanation?: string
            options?: OptionDraft[]
        }>
    }
}

const createOption = (label = ""): OptionDraft => ({
    id: `option_${Math.random().toString(36).slice(2, 10)}`,
    text: label,
})

const createQuestion = (type: QuestionType): QuestionDraft => ({
    id: `question_${Math.random().toString(36).slice(2, 10)}`,
    type,
    prompt: "",
    marks: 1,
    options: type === "mcq" ? [createOption(), createOption()] : [],
    correctAnswer: "",
    explanation: "",
})

function getQueueGridClass(questionCount: number) {
    if (questionCount <= 1) return "grid-cols-1"
    if (questionCount === 2) return "grid-cols-1 md:grid-cols-2"
    if (questionCount <= 4) return "grid-cols-1 md:grid-cols-2 xl:grid-cols-2"
    return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
}

export default function CreateQuizPage() {
    const searchParams = useSearchParams()
    const editId = searchParams.get("id")

    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [batch, setBatch] = useState<"A" | "B">("A")
    const [publishAt, setPublishAt] = useState("")
    const [dueAt, setDueAt] = useState("")
    const [isSebRequired, setIsSebRequired] = useState(false)
    const [questions, setQuestions] = useState<QuestionDraft[]>([createQuestion("mcq")])
    const [activeQuestionId, setActiveQuestionId] = useState<string>(() => questions[0]?.id || "")
    const [submitting, setSubmitting] = useState(false)
    const [loading, setLoading] = useState(Boolean(editId))
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState<"success" | "destructive" | "info">("info")
    const queueScrollRef = useRef<HTMLDivElement | null>(null)
    const queueAutoScrollFrameRef = useRef<number | null>(null)
    const queueAutoScrollVelocityRef = useRef(0)

    useEffect(() => {
        const fetchQuiz = async () => {
            if (!editId) return

            try {
                const res = await axios.get<QuizDetailsResponse>(`/api/admin/quizzes/${editId}`)
                const quiz = res.data.data

                setTitle(quiz.title)
                setDescription(quiz.description)
                setBatch(quiz.batch || "A")
                setPublishAt(new Date(quiz.publishAt).toISOString().slice(0, 16))
                setDueAt(new Date(quiz.dueAt).toISOString().slice(0, 16))
                setIsSebRequired(quiz.isSebRequired || false)
                setQuestions(
                    quiz.questions.map((question) => ({
                        id: question._id,
                        type: question.type,
                        prompt: question.prompt,
                        marks: question.marks,
                        correctAnswer: question.correctAnswer,
                        explanation: question.explanation || "",
                        options:
                            question.type === "mcq"
                                ? (question.options || []).map((option) => ({
                                      id: option.id,
                                      text: option.text,
                                  }))
                                : [],
                    }))
                )
                setActiveQuestionId(quiz.questions[0]?._id || "")
            } catch {
                setMessage("Failed to load quiz details")
                setMessageType("destructive")
            } finally {
                setLoading(false)
            }
        }

        void fetchQuiz()
    }, [editId])

    const totalMarks = useMemo(
        () => questions.reduce((sum, question) => sum + Number(question.marks || 0), 0),
        [questions]
    )

    const mcqCount = useMemo(
        () => questions.filter((question) => question.type === "mcq").length,
        [questions]
    )

    const oneWordCount = questions.length - mcqCount

    const updateQuestion = (questionId: string, updates: Partial<QuestionDraft>) => {
        setQuestions((current) =>
            current.map((question) =>
                question.id === questionId
                    ? {
                          ...question,
                          ...updates,
                      }
                    : question
            )
        )
    }

    const updateQuestionType = (questionId: string, type: QuestionType) => {
        setQuestions((current) =>
            current.map((question) => {
                if (question.id !== questionId) return question

                return {
                    ...question,
                    type,
                    options: type === "mcq" ? question.options.length > 0 ? question.options : [createOption(), createOption()] : [],
                    correctAnswer:
                        type === "mcq" && question.options.length > 0
                            ? question.correctAnswer
                            : "",
                }
            })
        )
    }

    const updateOption = (questionId: string, optionId: string, text: string) => {
        setQuestions((current) =>
            current.map((question) => {
                if (question.id !== questionId) return question

                return {
                    ...question,
                    options: question.options.map((option) =>
                        option.id === optionId ? { ...option, text } : option
                    ),
                }
            })
        )
    }

    const addOption = (questionId: string) => {
        setQuestions((current) =>
            current.map((question) =>
                question.id === questionId
                    ? {
                          ...question,
                          options: [...question.options, createOption()],
                      }
                    : question
            )
        )
    }

    const removeOption = (questionId: string, optionId: string) => {
        setQuestions((current) =>
            current.map((question) => {
                if (question.id !== questionId) return question

                const nextOptions = question.options.filter((option) => option.id !== optionId)
                return {
                    ...question,
                    options: nextOptions,
                    correctAnswer:
                        question.correctAnswer === optionId ? "" : question.correctAnswer,
                }
            })
        )
    }

    const addQuestion = (type: QuestionType) => {
        const nextQuestion = createQuestion(type)
        setQuestions((current) => [...current, nextQuestion])
        setActiveQuestionId(nextQuestion.id)
    }

    const reorderQuestions = (fromQuestionId: string, toQuestionId: string) => {
        if (fromQuestionId === toQuestionId) return

        setQuestions((current) => {
            const fromIndex = current.findIndex((question) => question.id === fromQuestionId)
            const toIndex = current.findIndex((question) => question.id === toQuestionId)

            if (fromIndex < 0 || toIndex < 0) return current

            const nextQuestions = [...current]
            const [movedQuestion] = nextQuestions.splice(fromIndex, 1)
            nextQuestions.splice(toIndex, 0, movedQuestion)
            return nextQuestions
        })
    }

    const removeQuestion = (questionId: string) => {
        const currentIndex = questions.findIndex((question) => question.id === questionId)
        const fallbackQuestion =
            questions[currentIndex + 1] ||
            questions[currentIndex - 1] ||
            null

        setQuestions((current) => current.filter((question) => question.id !== questionId))
        setActiveQuestionId(fallbackQuestion?.id || "")
    }

    const buildPayload = () => ({
        title,
        description,
        batch,
        publishAt: new Date(publishAt).toISOString(),
        dueAt: new Date(dueAt).toISOString(),
        isSebRequired,
        questions: questions.map((question) => ({
            type: question.type,
            prompt: question.prompt,
            marks: Number(question.marks),
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            options:
                question.type === "mcq"
                    ? question.options.map((option) => ({
                          id: option.id,
                          text: option.text,
                      }))
                    : [],
        })),
    })

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setMessage("")

        if (!title.trim() || !description.trim() || !publishAt || !dueAt) {
            setMessage("Fill the title, description, publish time, and due time")
            setMessageType("destructive")
            return
        }

        if (new Date(publishAt) >= new Date(dueAt)) {
            setMessage("Publish time must be earlier than due time")
            setMessageType("destructive")
            return
        }

        if (questions.length === 0) {
            setMessage("Add at least one question")
            setMessageType("destructive")
            return
        }

        try {
            setSubmitting(true)
            const payload = buildPayload()

            const res = editId
                ? await axios.patch(`/api/admin/quizzes/${editId}`, payload)
                : await axios.post("/api/admin/quizzes", payload)

            setMessage(res.data.message || (editId ? "Quiz updated successfully" : "Quiz created successfully"))
            setMessageType("success")

            if (!editId) {
                setTitle("")
                setDescription("")
                setBatch("A")
                setPublishAt("")
                setDueAt("")
                setIsSebRequired(false)
                const resetQuestion = createQuestion("mcq")
                setQuestions([resetQuestion])
                setActiveQuestionId(resetQuestion.id)
            }
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error && "response" in error
                    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    : editId
                      ? "Failed to update quiz"
                      : "Failed to create quiz"

            setMessage(errorMessage || "Failed to save quiz")
            setMessageType("destructive")
        } finally {
            setSubmitting(false)
        }
    }

    const resolvedActiveQuestionId = questions.some((question) => question.id === activeQuestionId)
        ? activeQuestionId
        : (questions[0]?.id || "")
    const activeQuestionIndex = questions.findIndex((question) => question.id === resolvedActiveQuestionId)
    const activeQuestion = activeQuestionIndex >= 0 ? questions[activeQuestionIndex] : questions[0]

    const moveQuestionFocus = (direction: "prev" | "next") => {
        if (!questions.length) return

        const currentIndex = activeQuestionIndex >= 0 ? activeQuestionIndex : 0
        const nextIndex =
            direction === "prev"
                ? Math.max(0, currentIndex - 1)
                : Math.min(questions.length - 1, currentIndex + 1)

        setActiveQuestionId(questions[nextIndex].id)
    }

    const stopQueueAutoScroll = () => {
        queueAutoScrollVelocityRef.current = 0

        if (queueAutoScrollFrameRef.current !== null) {
            window.cancelAnimationFrame(queueAutoScrollFrameRef.current)
            queueAutoScrollFrameRef.current = null
        }
    }

    const startQueueAutoScroll = () => {
        if (queueAutoScrollFrameRef.current !== null) {
            return
        }

        const tick = () => {
            const queueElement = queueScrollRef.current
            const velocity = queueAutoScrollVelocityRef.current

            if (!queueElement || velocity === 0) {
                queueAutoScrollFrameRef.current = null
                return
            }

            queueElement.scrollTop += velocity
            queueAutoScrollFrameRef.current = window.requestAnimationFrame(tick)
        }

        queueAutoScrollFrameRef.current = window.requestAnimationFrame(tick)
    }

    const handleQueueDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        const queueElement = queueScrollRef.current
        if (!queueElement) return

        event.preventDefault()
        event.dataTransfer.dropEffect = "move"

        const queueRect = queueElement.getBoundingClientRect()
        const scrollEdgeSize = 84
        const maxScrollStep = 8
        const distanceFromTop = event.clientY - queueRect.top
        const distanceFromBottom = queueRect.bottom - event.clientY

        let scrollDelta = 0

        if (distanceFromTop < scrollEdgeSize) {
            const intensity = (scrollEdgeSize - distanceFromTop) / scrollEdgeSize
            scrollDelta = -(2 + maxScrollStep * intensity * intensity)
        } else if (distanceFromBottom < scrollEdgeSize) {
            const intensity = (scrollEdgeSize - distanceFromBottom) / scrollEdgeSize
            scrollDelta = 2 + maxScrollStep * intensity * intensity
        }

        queueAutoScrollVelocityRef.current = scrollDelta

        if (scrollDelta === 0) {
            stopQueueAutoScroll()
        } else {
            startQueueAutoScroll()
        }
    }

    useEffect(() => {
        return () => {
            stopQueueAutoScroll()
        }
    }, [])

    if (loading) {
        return (
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
                <div className="h-56 animate-pulse rounded-[32px] bg-muted" />
                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="h-140 animate-pulse rounded-[28px] bg-muted" />
                    <div className="h-96 animate-pulse rounded-[28px] bg-muted" />
                </div>
            </div>
        )
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8"
        >
            <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-linear-to-br from-card via-card to-emerald-500/10 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_30%)]" />
                <div className="relative grid gap-6 px-5 py-6 sm:px-7 sm:py-7 xl:grid-cols-[1.15fr_0.85fr] xl:px-8">
                    <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-500 shadow-none">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Quiz Studio
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                <ListChecks className="mr-1.5 h-3.5 w-3.5" />
                                MCQ and one-word authoring
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                {editId ? "Refine Quiz Flow" : "Create a New Quiz"}
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                Build a clean timed quiz with just two focused question types, a tight
                                publish window, and optional Safe Exam Browser protection.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <MetricChip label="Questions" value={String(questions.length)} helper="current draft" />
                            <MetricChip label="Marks" value={String(totalMarks)} helper="total score" />
                            <MetricChip
                                label="Secure Mode"
                                value={isSebRequired ? "On" : "Off"}
                                helper={isSebRequired ? "SEB only access" : "Works in browser"}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <SignalCard
                            icon={FileQuestion}
                            label="Question Mix"
                            value={`${mcqCount} MCQ / ${oneWordCount} One-word`}
                            helper="Keep the quiz short, clear, and balanced."
                            tone="emerald"
                        />
                        <SignalCard
                            icon={Shield}
                            label="Access Control"
                            value={isSebRequired ? "Protected" : "Standard"}
                            helper="Protected quizzes must be opened through Safe Exam Browser."
                            tone="rose"
                        />
                    </div>
                </div>
            </section>

            {message && (
                <Alert
                    variant={messageType === "destructive" ? "destructive" : "default"}
                    className={cn(messageType === "success" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-600")}
                >
                    {messageType === "success" ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : (
                        <AlertCircle className="h-4 w-4" />
                    )}
                    <span>{message}</span>
                </Alert>
            )}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="min-w-0 space-y-6">
                    <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
                        <div className="grid gap-5">
                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Quiz title</label>
                                    <Input
                                        value={title}
                                        onChange={(event) => setTitle(event.target.value)}
                                        placeholder="Mid-term quick check"
                                        className="h-11 rounded-2xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Batch</label>
                                    <Select value={batch} onValueChange={(value) => setBatch(value as "A" | "B")}>
                                        <SelectTrigger className="h-11 rounded-2xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="A">Batch A</SelectItem>
                                            <SelectItem value="B">Batch B</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Instructions</label>
                                <Textarea
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    placeholder="Tell students what this quiz covers and how they should respond."
                                    className="min-h-28 rounded-3xl"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                    Quiz Questions
                                </p>
                                <h2 className="text-2xl font-semibold tracking-tight">
                                    Build the student attempt flow
                                </h2>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-2xl"
                                    onClick={() => addQuestion("mcq")}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add MCQ
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-2xl"
                                    onClick={() => addQuestion("one_word")}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add One Word
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Card className="rounded-[28px] border border-border/60 bg-card/80 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
                                <CardContent className="space-y-4 p-4 sm:p-5">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                                Question Queue
                                            </p>
                                            <h3 className="mt-1 text-xl font-semibold tracking-tight">
                                                Arrange the quiz order above the editor
                                            </h3>
                                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                                Click a card to edit it. Drag cards left or right to change the order students will see in the quiz.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                                {questions.length} question{questions.length > 1 ? "s" : ""}
                                            </Badge>
                                            <div className="rounded-2xl border border-border/60 bg-background/70 p-2.5">
                                                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        ref={queueScrollRef}
                                        className="h-[360px] overflow-y-auto pr-2"
                                        onDragOver={handleQueueDragOver}
                                        onDragLeave={stopQueueAutoScroll}
                                        onDrop={stopQueueAutoScroll}
                                    >
                                        <div className={cn("grid gap-3 pb-3", getQueueGridClass(questions.length))}>
                                            {questions.map((question, index) => {
                                                const isActive = question.id === activeQuestion?.id
                                                const isConfigured = question.prompt.trim().length > 0
                                                const optionCount =
                                                    question.type === "mcq" ? question.options.length : 0

                                                return (
                                                    <HoverCard key={question.id} openDelay={120} closeDelay={120}>
                                                        <HoverCardTrigger asChild>
                                                            <button
                                                                type="button"
                                                                draggable
                                                                onDragStart={(event) => {
                                                                    stopQueueAutoScroll()
                                                                    event.dataTransfer.setData("text/plain", question.id)
                                                                    event.dataTransfer.effectAllowed = "move"
                                                                }}
                                                                onDragEnd={stopQueueAutoScroll}
                                                                onDragOver={(event) => {
                                                                    event.preventDefault()
                                                                    event.dataTransfer.dropEffect = "move"
                                                                }}
                                                                onDrop={(event) => {
                                                                    event.preventDefault()
                                                                    const draggedQuestionId = event.dataTransfer.getData("text/plain")
                                                                    reorderQuestions(draggedQuestionId, question.id)
                                                                }}
                                                                onClick={() => setActiveQuestionId(question.id)}
                                                                className={cn(
                                                                    "group min-w-0 rounded-[24px] border px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5",
                                                                    isActive
                                                                        ? "border-emerald-500/30 bg-emerald-500/10 shadow-sm"
                                                                        : "border-border/60 bg-background/65 hover:border-border hover:bg-background/80"
                                                                )}
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="min-w-0 space-y-3">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <span className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                                                Q{index + 1}
                                                                            </span>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className={cn(
                                                                                    "rounded-full px-2.5 py-0.5 text-[11px]",
                                                                                    question.type === "mcq"
                                                                                        ? "border-sky-500/20 bg-sky-500/10 text-sky-500"
                                                                                        : "border-amber-500/20 bg-amber-500/10 text-amber-500"
                                                                                )}
                                                                            >
                                                                                {question.type === "mcq" ? "MCQ" : "One word"}
                                                                            </Badge>
                                                                        </div>

                                                                        <div className="space-y-2">
                                                                            <p className="line-clamp-2 text-base font-semibold leading-6 text-foreground">
                                                                                {question.prompt.trim() || "Untitled question draft"}
                                                                            </p>
                                                                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                                                                <span>{question.marks} mark{question.marks > 1 ? "s" : ""}</span>
                                                                                {question.type === "mcq" && (
                                                                                    <span>{optionCount} option{optionCount > 1 ? "s" : ""}</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex shrink-0 flex-col items-end gap-3">
                                                                        <div className="rounded-2xl border border-border/60 bg-background/80 p-2 transition-transform group-hover:scale-105">
                                                                            <Grip className="h-4 w-4 text-muted-foreground" />
                                                                        </div>
                                                                        <div
                                                                            className={cn(
                                                                                "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
                                                                                isConfigured
                                                                                    ? "bg-emerald-500/10 text-emerald-600"
                                                                                    : "bg-muted text-muted-foreground"
                                                                            )}
                                                                        >
                                                                            {isConfigured ? "Ready" : "Draft"}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        </HoverCardTrigger>
                                                        <HoverCardContent
                                                            align="start"
                                                            side="top"
                                                            sideOffset={12}
                                                            className="w-[360px] rounded-[24px] border border-border/60 bg-card/98 p-4 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.75)]"
                                                        >
                                                            <div className="space-y-4">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="space-y-2">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <span className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                                                Question {index + 1}
                                                                            </span>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className={cn(
                                                                                    "rounded-full px-2.5 py-0.5 text-[11px]",
                                                                                    question.type === "mcq"
                                                                                        ? "border-sky-500/20 bg-sky-500/10 text-sky-500"
                                                                                        : "border-amber-500/20 bg-amber-500/10 text-amber-500"
                                                                                )}
                                                                            >
                                                                                {question.type === "mcq" ? "Multiple choice" : "One word / one line"}
                                                                            </Badge>
                                                                        </div>
                                                                        <h4 className="text-lg font-semibold tracking-tight text-foreground">
                                                                            {question.prompt.trim() || "Untitled question draft"}
                                                                        </h4>
                                                                    </div>
                                                                    <div className="rounded-2xl border border-border/60 bg-background/80 p-2">
                                                                        <Grip className="h-4 w-4 text-muted-foreground" />
                                                                    </div>
                                                                </div>

                                                                <div className="grid gap-3 sm:grid-cols-3">
                                                                    <PreviewStat label="Marks" value={String(question.marks)} />
                                                                    <PreviewStat label="Status" value={isConfigured ? "Ready" : "Draft"} />
                                                                    <PreviewStat
                                                                        label={question.type === "mcq" ? "Options" : "Answer"}
                                                                        value={
                                                                            question.type === "mcq"
                                                                                ? String(optionCount)
                                                                                : (question.correctAnswer.trim() ? "Set" : "Missing")
                                                                        }
                                                                    />
                                                                </div>

                                                                {question.type === "mcq" && question.options.length > 0 ? (
                                                                    <div className="space-y-2">
                                                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                                                            Answer choices
                                                                        </p>
                                                                        <div className="grid gap-2">
                                                                            {question.options.slice(0, 4).map((option, optionIndex) => {
                                                                                const isCorrect = question.correctAnswer === option.id
                                                                                return (
                                                                                    <div
                                                                                        key={option.id}
                                                                                        className={cn(
                                                                                            "rounded-2xl border px-3 py-2 text-sm",
                                                                                            isCorrect
                                                                                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                                                                                                : "border-border/60 bg-background/70 text-muted-foreground"
                                                                                        )}
                                                                                    >
                                                                                        <span className="font-medium">
                                                                                            Option {optionIndex + 1}:
                                                                                        </span>{" "}
                                                                                        {option.text.trim() || "No text yet"}
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="rounded-2xl border border-border/60 bg-background/70 p-3 text-sm text-muted-foreground">
                                                                        <span className="font-medium text-foreground">Expected answer:</span>{" "}
                                                                        {question.correctAnswer.trim() || "Not set yet"}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </HoverCardContent>
                                                    </HoverCard>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {activeQuestion && (
                                <Card className="overflow-hidden rounded-[28px] border-border/60 bg-card/80 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
                                    <CardContent className="space-y-6 p-5 sm:p-6">
                                        <div className="flex flex-col gap-4 border-b border-border/60 pb-5">
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="rounded-[22px] border border-border/60 bg-background/70 p-3.5">
                                                        <Grip className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                                                Question {activeQuestionIndex + 1}
                                                            </p>
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    "rounded-full px-2.5 py-0.5 text-[11px]",
                                                                    activeQuestion.type === "mcq"
                                                                        ? "border-sky-500/20 bg-sky-500/10 text-sky-500"
                                                                        : "border-amber-500/20 bg-amber-500/10 text-amber-500"
                                                                )}
                                                            >
                                                                {activeQuestion.type === "mcq" ? "Multiple choice" : "One word / one line"}
                                                            </Badge>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-2xl font-semibold tracking-tight">
                                                                {activeQuestion.prompt.trim() || "Build the active question"}
                                                            </h3>
                                                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                                                Keep the wording short and obvious so students can answer quickly without confusion.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Select
                                                        value={activeQuestion.type}
                                                        onValueChange={(value) => updateQuestionType(activeQuestion.id, value as QuestionType)}
                                                    >
                                                        <SelectTrigger className="h-11 w-[200px] rounded-2xl text-sm">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="mcq">MCQ</SelectItem>
                                                            <SelectItem value="one_word">One Word / One Line</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        className="rounded-2xl text-rose-500 hover:text-rose-500"
                                                        onClick={() => removeQuestion(activeQuestion.id)}
                                                        disabled={questions.length === 1}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <QuickInfoPill
                                                        icon={CircleDot}
                                                        label={`${activeQuestion.marks} mark${activeQuestion.marks > 1 ? "s" : ""}`}
                                                    />
                                                    <QuickInfoPill
                                                        icon={SearchCheck}
                                                        label={
                                                            activeQuestion.type === "mcq"
                                                                ? `${activeQuestion.options.length} options`
                                                                : "Direct answer"
                                                        }
                                                    />
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="rounded-2xl"
                                                        onClick={() => moveQuestionFocus("prev")}
                                                        disabled={activeQuestionIndex <= 0}
                                                    >
                                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                                        Previous
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="rounded-2xl"
                                                        onClick={() => moveQuestionFocus("next")}
                                                        disabled={activeQuestionIndex >= questions.length - 1}
                                                    >
                                                        Next
                                                        <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_180px] xl:items-start">
                                            <div className="space-y-2">
                                                <label className="text-base font-semibold tracking-tight">Prompt</label>
                                                <p className="text-sm leading-6 text-muted-foreground">
                                                    This is the exact text students will read during the quiz.
                                                </p>
                                                <Textarea
                                                    value={activeQuestion.prompt}
                                                    onChange={(event) =>
                                                        updateQuestion(activeQuestion.id, { prompt: event.target.value })
                                                    }
                                                    placeholder="Write the exact question students should answer."
                                                    className="min-h-[150px] rounded-[26px] px-5 py-4 text-base leading-7"
                                                />
                                            </div>

                                            <div className="rounded-[24px] border border-border/60 bg-background/70 p-4">
                                                <label className="text-base font-semibold tracking-tight">Marks</label>
                                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                                    Keep scoring weight easy to scan.
                                                </p>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={activeQuestion.marks}
                                                    onChange={(event) =>
                                                        updateQuestion(activeQuestion.id, {
                                                            marks: Number(event.target.value || 1),
                                                        })
                                                    }
                                                    className="mt-4 h-12 rounded-2xl px-4 text-lg font-semibold"
                                                />
                                            </div>
                                        </div>

                                        {activeQuestion.type === "mcq" ? (
                                            <div className="space-y-5">
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="text-base font-semibold tracking-tight">
                                                            Options and correct answer
                                                        </p>
                                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                                            Tap the left chip on an option row to mark the correct answer.
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="rounded-2xl"
                                                        onClick={() => addOption(activeQuestion.id)}
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Add Option
                                                    </Button>
                                                </div>

                                                <div className="grid gap-3">
                                                    {activeQuestion.options.map((option, optionIndex) => {
                                                        const isCorrect = activeQuestion.correctAnswer === option.id

                                                        return (
                                                            <div
                                                                key={option.id}
                                                                className={cn(
                                                                    "rounded-[24px] border p-4 transition",
                                                                    isCorrect
                                                                        ? "border-emerald-500/30 bg-emerald-500/5"
                                                                        : "border-border/60 bg-background/70"
                                                                )}
                                                            >
                                                                <div className="grid gap-3 xl:grid-cols-[140px_minmax(0,1fr)_auto] xl:items-center">
                                                                    <button
                                                                        type="button"
                                                                        className={cn(
                                                                            "inline-flex h-12 items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition",
                                                                            isCorrect
                                                                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                                                                                : "border-border/60 bg-card text-muted-foreground"
                                                                        )}
                                                                        onClick={() =>
                                                                            updateQuestion(activeQuestion.id, { correctAnswer: option.id })
                                                                        }
                                                                    >
                                                                        {isCorrect ? "Correct" : `Option ${optionIndex + 1}`}
                                                                    </button>
                                                                    <Input
                                                                        value={option.text}
                                                                        onChange={(event) =>
                                                                            updateOption(activeQuestion.id, option.id, event.target.value)
                                                                        }
                                                                        placeholder={`Option ${optionIndex + 1} text`}
                                                                        className="h-12 rounded-2xl px-4 text-base"
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        className="h-12 rounded-2xl px-4 text-rose-500 hover:text-rose-500"
                                                                        onClick={() => removeOption(activeQuestion.id, option.id)}
                                                                        disabled={activeQuestion.options.length <= 2}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <label className="text-base font-semibold tracking-tight">Correct answer</label>
                                                <p className="text-sm leading-6 text-muted-foreground">
                                                    Keep the expected answer short and unambiguous.
                                                </p>
                                                <Input
                                                    value={activeQuestion.correctAnswer}
                                                    onChange={(event) =>
                                                        updateQuestion(activeQuestion.id, { correctAnswer: event.target.value })
                                                    }
                                                    placeholder="Expected student answer"
                                                    className="h-12 rounded-2xl px-4 text-base"
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-base font-semibold tracking-tight">Optional explanation</label>
                                            <p className="text-sm leading-6 text-muted-foreground">
                                                Add an internal note or a short explanation that helps during review.
                                            </p>
                                            <Textarea
                                                value={activeQuestion.explanation}
                                                onChange={(event) =>
                                                    updateQuestion(activeQuestion.id, { explanation: event.target.value })
                                                }
                                                placeholder="Add internal notes or a short explanation for the correct answer."
                                                className="min-h-[120px] rounded-[26px] px-5 py-4 text-base leading-7"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-3 rounded-[24px] border border-dashed border-border/60 bg-background/55 p-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">
                                                    Continue building
                                                </p>
                                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                                    Finish this question, then jump right into the next blank draft without stacking long cards on the page.
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="rounded-2xl"
                                                    onClick={() => addQuestion("mcq")}
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    New MCQ
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="rounded-2xl"
                                                    onClick={() => addQuestion("one_word")}
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    New One Word
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
                    <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
                        <div className="space-y-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                    Schedule and Access
                                </p>
                                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                                    Control the release window
                                </h2>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Publish at</label>
                                <DateTimePicker
                                    value={publishAt}
                                    onChange={(value) => setPublishAt(value)}
                                    placeholder="Select publish date"
                                    clearable
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Due at</label>
                                <DateTimePicker
                                    value={dueAt}
                                    onChange={(value) => setDueAt(value)}
                                    placeholder="Select due date"
                                    clearable
                                    minDate={publishAt ? new Date(publishAt) : undefined}
                                />
                            </div>

                            <div className="rounded-[24px] border border-border/60 bg-background/70 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-rose-500" />
                                            <p className="text-sm font-semibold">Safe Exam Browser only</p>
                                        </div>
                                        <p className="text-sm leading-6 text-muted-foreground">
                                            Turn this on when the quiz must open only inside the approved SEB setup.
                                            Students will be locked out in a normal browser and can submit only once.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={isSebRequired}
                                        onCheckedChange={setIsSebRequired}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-6">
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                    Draft Summary
                                </p>
                                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                                    Final review
                                </h2>
                            </div>

                            <div className="grid gap-3">
                                <SummaryRow icon={ListChecks} label="Questions" value={String(questions.length)} />
                                <SummaryRow icon={Type} label="One-word prompts" value={String(oneWordCount)} />
                                <SummaryRow icon={FileQuestion} label="MCQ prompts" value={String(mcqCount)} />
                                <SummaryRow icon={CheckCircle2} label="Total marks" value={String(totalMarks)} />
                            </div>

                            <Button
                                type="submit"
                                className="h-12 w-full rounded-2xl text-base font-semibold"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {editId ? "Updating Quiz..." : "Creating Quiz..."}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        {editId ? "Update Quiz" : "Publish Quiz"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </section>
                </div>
            </div>
        </form>
    )
}

function MetricChip({
    label,
    value,
    helper,
}: {
    label: string
    value: string
    helper: string
}) {
    return (
        <div className="rounded-[22px] border border-border/60 bg-background/70 p-4 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {label}
            </p>
            <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
            <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
        </div>
    )
}

function SignalCard({
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
    tone: "emerald" | "rose"
}) {
    return (
        <div className="rounded-[24px] border border-border/60 bg-background/70 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "rounded-2xl p-3",
                        tone === "emerald" && "bg-emerald-500/10 text-emerald-500",
                        tone === "rose" && "bg-rose-500/10 text-rose-500"
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

function SummaryRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
}) {
    return (
        <div className="flex items-center justify-between rounded-[22px] border border-border/60 bg-background/70 px-4 py-3">
            <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-muted p-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium">{label}</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{value}</span>
        </div>
    )
}

function QuickInfoPill({
    icon: Icon,
    label,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
}) {
    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-2 text-sm font-medium text-foreground">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span>{label}</span>
        </div>
    )
}

function PreviewStat({
    label,
    value,
}: {
    label: string
    value: string
}) {
    return (
        <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {label}
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
        </div>
    )
}
