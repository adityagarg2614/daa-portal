'use client'

import axios from "axios"
import React, { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
    AlertCircle,
    CheckCircle2,
    FileQuestion,
    Grip,
    ListChecks,
    Loader2,
    Plus,
    Shield,
    Sparkles,
    Trash2,
    Type,
} from "lucide-react"
import { Alert } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
    const [submitting, setSubmitting] = useState(false)
    const [loading, setLoading] = useState(Boolean(editId))
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState<"success" | "destructive" | "info">("info")

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
        setQuestions((current) => [...current, createQuestion(type)])
    }

    const removeQuestion = (questionId: string) => {
        setQuestions((current) => current.filter((question) => question.id !== questionId))
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
                setQuestions([createQuestion("mcq")])
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

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
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
                            {questions.map((question, index) => (
                                <Card
                                    key={question.id}
                                    className="overflow-hidden rounded-[28px] border-border/60 bg-card/80 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]"
                                >
                                    <CardContent className="space-y-5 p-5 sm:p-6">
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                                                    <Grip className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                                        Question {index + 1}
                                                    </p>
                                                    <h3 className="text-lg font-semibold tracking-tight">
                                                        {question.type === "mcq" ? "Multiple Choice" : "One Word / One Line"}
                                                    </h3>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <Select
                                                    value={question.type}
                                                    onValueChange={(value) => updateQuestionType(question.id, value as QuestionType)}
                                                >
                                                    <SelectTrigger className="h-10 w-[180px] rounded-2xl">
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
                                                    onClick={() => removeQuestion(question.id)}
                                                    disabled={questions.length === 1}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid gap-5 md:grid-cols-[1fr_140px]">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Prompt</label>
                                                <Textarea
                                                    value={question.prompt}
                                                    onChange={(event) =>
                                                        updateQuestion(question.id, { prompt: event.target.value })
                                                    }
                                                    placeholder="Write the exact question students should answer."
                                                    className="min-h-24 rounded-3xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Marks</label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={question.marks}
                                                    onChange={(event) =>
                                                        updateQuestion(question.id, {
                                                            marks: Number(event.target.value || 1),
                                                        })
                                                    }
                                                    className="h-11 rounded-2xl"
                                                />
                                            </div>
                                        </div>

                                        {question.type === "mcq" ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium">Options and correct answer</p>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="rounded-2xl"
                                                        onClick={() => addOption(question.id)}
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Add Option
                                                    </Button>
                                                </div>

                                                <div className="grid gap-3">
                                                    {question.options.map((option, optionIndex) => {
                                                        const isCorrect = question.correctAnswer === option.id

                                                        return (
                                                            <div
                                                                key={option.id}
                                                                className={cn(
                                                                    "rounded-[24px] border border-border/60 bg-background/70 p-4 transition",
                                                                    isCorrect && "border-emerald-500/30 bg-emerald-500/5"
                                                                )}
                                                            >
                                                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                                                    <button
                                                                        type="button"
                                                                        className={cn(
                                                                            "inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition",
                                                                            isCorrect
                                                                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                                                                                : "border-border/60 bg-card text-muted-foreground"
                                                                        )}
                                                                        onClick={() =>
                                                                            updateQuestion(question.id, { correctAnswer: option.id })
                                                                        }
                                                                    >
                                                                        {isCorrect ? "Correct" : `Option ${optionIndex + 1}`}
                                                                    </button>
                                                                    <Input
                                                                        value={option.text}
                                                                        onChange={(event) =>
                                                                            updateOption(question.id, option.id, event.target.value)
                                                                        }
                                                                        placeholder={`Option ${optionIndex + 1} text`}
                                                                        className="h-11 rounded-2xl"
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        className="rounded-2xl text-rose-500 hover:text-rose-500"
                                                                        onClick={() => removeOption(question.id, option.id)}
                                                                        disabled={question.options.length <= 2}
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
                                                <label className="text-sm font-medium">Correct answer</label>
                                                <Input
                                                    value={question.correctAnswer}
                                                    onChange={(event) =>
                                                        updateQuestion(question.id, { correctAnswer: event.target.value })
                                                    }
                                                    placeholder="Expected student answer"
                                                    className="h-11 rounded-2xl"
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Optional explanation</label>
                                            <Textarea
                                                value={question.explanation}
                                                onChange={(event) =>
                                                    updateQuestion(question.id, { explanation: event.target.value })
                                                }
                                                placeholder="Add internal notes or a short explanation for the correct answer."
                                                className="min-h-20 rounded-3xl"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
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
                                <Input
                                    type="datetime-local"
                                    value={publishAt}
                                    onChange={(event) => setPublishAt(event.target.value)}
                                    className="h-11 rounded-2xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Due at</label>
                                <Input
                                    type="datetime-local"
                                    value={dueAt}
                                    onChange={(event) => setDueAt(event.target.value)}
                                    className="h-11 rounded-2xl"
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
