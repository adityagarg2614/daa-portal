'use client'

import axios, { AxiosError } from 'axios'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import {
    AlertCircle,
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Edit,
    FileQuestion,
    Loader2,
    Shield,
    Target,
    Trash2,
    Trophy,
    User2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'

type Question = {
    _id: string
    type: 'mcq' | 'one_word'
    prompt: string
    marks: number
    explanation?: string
    options?: Array<{ id: string; text: string }>
}

type Quiz = {
    _id: string
    title: string
    description: string
    batch?: "A" | "B" | null
    totalQuestions: number
    totalMarks: number
    publishAt: string
    dueAt: string
    isSebRequired?: boolean
    questions: Question[]
    submissionStats: {
        total: number
        submitted: number
        pending: number
        averageScore: number
        topPerformers: Array<{
            student?: {
                name?: string
                email?: string
                rollNo?: string
            }
            score: number
            submittedAt: string
        }>
    }
}

type QuizStatus = 'Upcoming' | 'Active' | 'Expired'

export default function AdminViewQuizPage() {
    const params = useParams()
    const router = useRouter()
    const quizId = params.id as string

    const [quiz, setQuiz] = useState<Quiz | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                setLoading(true)
                setError(null)
                const res = await axios.get(`/api/admin/quizzes/${quizId}`)

                if (res.data.success) {
                    setQuiz(res.data.data)
                } else {
                    setError(res.data.message || 'Failed to load quiz')
                }
            } catch (error: unknown) {
                const err = error as AxiosError<{ message?: string }>
                setError(err.response?.data?.message || 'Failed to load quiz')
            } finally {
                setLoading(false)
            }
        }

        if (quizId) {
            void fetchQuiz()
        }
    }, [quizId])

    const status = useMemo<QuizStatus>(() => {
        if (!quiz) return 'Upcoming'
        const now = new Date()
        const publishAt = new Date(quiz.publishAt)
        const dueAt = new Date(quiz.dueAt)

        if (now < publishAt) return 'Upcoming'
        if (now > dueAt) return 'Expired'
        return 'Active'
    }, [quiz])

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this quiz? All related attempts will be removed.')) {
            return
        }

        try {
            setDeleting(true)
            const res = await axios.delete(`/api/admin/quizzes/${quizId}`)

            if (res.data.success) {
                router.push('/admin/quizzes')
            } else {
                alert(res.data.message || 'Failed to delete quiz')
            }
        } catch (error: unknown) {
            const err = error as AxiosError<{ message?: string }>
            alert(err.response?.data?.message || 'Failed to delete quiz')
        } finally {
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
                <div className="animate-pulse space-y-6">
                    <div className="h-12 w-48 rounded-lg bg-muted" />
                    <div className="h-64 rounded-2xl bg-muted" />
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-32 rounded-2xl bg-muted" />
                        ))}
                    </div>
                    <div className="h-96 rounded-2xl bg-muted" />
                </div>
            </div>
        )
    }

    if (error || !quiz) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4 pt-2">
                <div className="rounded-2xl border border-dashed bg-background p-10 text-center shadow-sm">
                    <AlertCircle className="mx-auto mb-3 h-12 w-12 text-destructive" />
                    <h3 className="text-lg font-semibold">Error Loading Quiz</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {error || 'Quiz not found'}
                    </p>
                    <Link href="/admin/quizzes">
                        <Button className="mt-4 gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Quizzes
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
            <SectionHeader
                title={quiz.title}
                description="Quiz Details"
                icon={FileQuestion}
                action={
                    <div className="flex items-center gap-2">
                        <Link href={`/admin/quizzes/create?id=${quiz._id}`}>
                            <Button variant="outline" className="gap-2">
                                <Edit className="h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Button
                            variant="destructive"
                            className="gap-2"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                            Delete
                        </Button>
                    </div>
                }
            />

            <div className="rounded-2xl border bg-background p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <StatusBadge status={status} />
                    <Badge variant="outline" className="gap-1">
                        <Target className="h-3 w-3" />
                        {quiz.totalMarks} Marks
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                        <FileQuestion className="h-3 w-3" />
                        {quiz.totalQuestions} Questions
                    </Badge>
                    {quiz.batch && <Badge variant="outline">Batch {quiz.batch}</Badge>}
                    {quiz.isSebRequired && (
                        <Badge className="gap-1 border border-rose-500/20 bg-rose-500/10 text-rose-500 shadow-none">
                            <Shield className="h-3 w-3" />
                            SEB Only
                        </Badge>
                    )}
                </div>

                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    {quiz.description}
                </p>
            </div>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={CalendarDays} label="Publish At" value={new Date(quiz.publishAt).toLocaleString()} />
                <StatCard icon={Clock3} label="Due At" value={new Date(quiz.dueAt).toLocaleString()} />
                <StatCard icon={CheckCircle2} label="Submitted Attempts" value={String(quiz.submissionStats.submitted)} />
                <StatCard icon={Trophy} label="Average Score" value={quiz.submissionStats.averageScore.toFixed(2)} />
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <section className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="mb-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Question Set
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                            Review the exact quiz structure
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {quiz.questions.map((question, index) => (
                            <div key={question._id} className="rounded-[24px] border border-border/60 bg-card/70 p-5">
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">Question {index + 1}</Badge>
                                    <Badge variant="outline">
                                        {question.type === "mcq" ? "MCQ" : "One Word / One Line"}
                                    </Badge>
                                    <Badge variant="outline">{question.marks} marks</Badge>
                                </div>
                                <h3 className="text-base font-semibold leading-7">{question.prompt}</h3>
                                {question.type === "mcq" && question.options?.length ? (
                                    <div className="mt-4 grid gap-3">
                                        {question.options.map((option) => (
                                            <div
                                                key={option.id}
                                                className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground"
                                            >
                                                {option.text}
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                                {question.explanation ? (
                                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                                        Note: {question.explanation}
                                    </p>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="rounded-2xl border bg-background p-6 shadow-sm">
                        <div className="mb-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                Attempt Summary
                            </p>
                            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                                Student activity snapshot
                            </h2>
                        </div>

                        <div className="grid gap-3">
                            <SummaryRow icon={User2} label="Total attempts" value={String(quiz.submissionStats.total)} />
                            <SummaryRow icon={CheckCircle2} label="Submitted" value={String(quiz.submissionStats.submitted)} />
                            <SummaryRow icon={Clock3} label="Pending / started" value={String(quiz.submissionStats.pending)} />
                            <SummaryRow icon={Trophy} label="Average score" value={quiz.submissionStats.averageScore.toFixed(2)} />
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-background p-6 shadow-sm">
                        <div className="mb-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                Top Performers
                            </p>
                            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                                Highest scores so far
                            </h2>
                        </div>

                        {quiz.submissionStats.topPerformers.length > 0 ? (
                            <div className="space-y-3">
                                {quiz.submissionStats.topPerformers.map((entry, index) => (
                                    <div
                                        key={`${entry.student?.email || "student"}-${index}`}
                                        className="rounded-[22px] border border-border/60 bg-card/70 p-4"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="font-medium">
                                                    {entry.student?.name || "Student"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {entry.student?.rollNo || entry.student?.email || "No identifier"}
                                                </p>
                                            </div>
                                            <Badge variant="outline">{entry.score} marks</Badge>
                                        </div>
                                        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                            Submitted {new Date(entry.submittedAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm leading-6 text-muted-foreground">
                                No submitted attempts yet. Once students complete the quiz, top performers will appear here.
                            </p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: QuizStatus }) {
    if (status === 'Active') {
        return (
            <Badge className="gap-1 border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-none">
                <Clock3 className="h-3 w-3" />
                Active
            </Badge>
        )
    }

    if (status === 'Upcoming') {
        return (
            <Badge className="gap-1 border border-sky-500/20 bg-sky-500/10 text-sky-500 shadow-none">
                <CalendarDays className="h-3 w-3" />
                Upcoming
            </Badge>
        )
    }

    return (
        <Badge className="gap-1 border border-amber-500/20 bg-amber-500/10 text-amber-500 shadow-none">
            <AlertCircle className="h-3 w-3" />
            Expired
        </Badge>
    )
}

function StatCard({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
}) {
    return (
        <div className="rounded-2xl border bg-background p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-muted p-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
                </div>
            </div>
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
        <div className="flex items-center justify-between rounded-[22px] border border-border/60 bg-card/70 px-4 py-3">
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
