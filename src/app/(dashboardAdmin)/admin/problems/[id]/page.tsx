'use client'

import axios from "axios"
import React, { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
    AlertCircle,
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    FileCode2,
    FileText,
    Loader2,
    Plus,
    RotateCcw,
    Save,
    Sparkles,
    Tags,
    TestTube2,
    Trash2,
    X,
} from "lucide-react"
import { FormField } from "@/components/ui/form-field"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Card, CardContent } from "@/components/ui/card"
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
import { cn } from "@/lib/utils"

type Example = {
    input: string
    output: string
    explanation: string
}

type TestCase = {
    input: string
    output: string
    isHidden: boolean
}

type StarterCode = {
    cpp: string
    java: string
    python: string
    javascript: string
}

type ProblemFormData = {
    title: string
    slug: string
    description: string
    difficulty: "Easy" | "Medium" | "Hard"
    marks: number
    tags: string[]
    constraints: string[]
    examples: Example[]
    testCases: TestCase[]
    starterCode: StarterCode
}

type StarterLanguage = keyof StarterCode

export default function ViewEditProblemPage() {
    const params = useParams()
    const problemId = params.id as string

    const [originalProblem, setOriginalProblem] = useState<ProblemFormData | null>(null)
    const [formData, setFormData] = useState<ProblemFormData | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState<"success" | "destructive" | "info">("info")
    const [tagInput, setTagInput] = useState("")
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [notFound, setNotFound] = useState(false)
    const [activeStarterLanguage, setActiveStarterLanguage] = useState<StarterLanguage>("cpp")

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                setLoading(true)
                const res = await axios.get(`/api/admin/problems/${problemId}`)
                const problem = res.data.data

                const problemData: ProblemFormData = {
                    title: problem.title || "",
                    slug: problem.slug || "",
                    description: problem.description || "",
                    difficulty: problem.difficulty || "Easy",
                    marks: problem.marks || 10,
                    tags: problem.tags || [],
                    constraints: problem.constraints?.length ? problem.constraints : [""],
                    examples: problem.examples?.length
                        ? problem.examples
                        : [{ input: "", output: "", explanation: "" }],
                    testCases: problem.testCases?.length
                        ? problem.testCases
                        : [{ input: "", output: "", isHidden: false }],
                    starterCode: problem.starterCode || {
                        cpp: "",
                        java: "",
                        python: "",
                        javascript: "",
                    },
                }

                setOriginalProblem(problemData)
                setFormData(problemData)
            } catch (error: unknown) {
                const axiosError = error as { response?: { status?: number } }
                if (axiosError.response?.status === 404) {
                    setNotFound(true)
                } else {
                    setMessage("Failed to fetch problem")
                    setMessageType("destructive")
                }
            } finally {
                setLoading(false)
            }
        }

        if (problemId) {
            void fetchProblem()
        }
    }, [problemId])

    const hasChanges = useMemo(() => {
        if (!originalProblem || !formData) return false
        return JSON.stringify(formData) !== JSON.stringify(originalProblem)
    }, [formData, originalProblem])

    const insights = useMemo(() => {
        if (!formData) {
            return {
                validConstraints: 0,
                validExamples: 0,
                validTestCases: 0,
                starterCoverage: 0,
                hiddenTests: 0,
            }
        }

        return {
            validConstraints: formData.constraints.filter((constraint) => constraint.trim()).length,
            validExamples: formData.examples.filter(
                (example) => example.input.trim() && example.output.trim()
            ).length,
            validTestCases: formData.testCases.filter(
                (testCase) => testCase.input.trim() && testCase.output.trim()
            ).length,
            starterCoverage: Object.values(formData.starterCode).filter((code) => code.trim()).length,
            hiddenTests: formData.testCases.filter((testCase) => testCase.isHidden).length,
        }
    }, [formData])

    const updateField = <K extends keyof ProblemFormData>(field: K, value: ProblemFormData[K]) => {
        if (!formData) return
        setFormData({ ...formData, [field]: value })
    }

    const handleConstraintChange = (index: number, value: string) => {
        if (!formData) return
        const updated = [...formData.constraints]
        updated[index] = value
        updateField("constraints", updated)
    }

    const addConstraint = () => {
        if (!formData) return
        updateField("constraints", [...formData.constraints, ""])
    }

    const removeConstraint = (index: number) => {
        if (!formData) return
        updateField("constraints", formData.constraints.filter((_, i) => i !== index))
    }

    const handleExampleChange = (index: number, field: keyof Example, value: string) => {
        if (!formData) return
        const updated = [...formData.examples]
        updated[index] = { ...updated[index], [field]: value }
        updateField("examples", updated)
    }

    const addExample = () => {
        if (!formData) return
        updateField("examples", [...formData.examples, { input: "", output: "", explanation: "" }])
    }

    const removeExample = (index: number) => {
        if (!formData) return
        updateField("examples", formData.examples.filter((_, i) => i !== index))
    }

    const handleTestCaseChange = (index: number, field: keyof TestCase, value: string | boolean) => {
        if (!formData) return
        const updated = [...formData.testCases]
        updated[index] = { ...updated[index], [field]: value }
        updateField("testCases", updated)
    }

    const addTestCase = () => {
        if (!formData) return
        updateField("testCases", [...formData.testCases, { input: "", output: "", isHidden: true }])
    }

    const removeTestCase = (index: number) => {
        if (!formData) return
        updateField("testCases", formData.testCases.filter((_, i) => i !== index))
    }

    const handleStarterCodeChange = (language: StarterLanguage, value: string) => {
        if (!formData) return
        updateField("starterCode", { ...formData.starterCode, [language]: value })
    }

    const addTag = (tag: string) => {
        if (!formData) return
        const trimmedTag = tag.trim()
        if (!trimmedTag || trimmedTag.length > 20) return
        const validPattern = /^[a-zA-Z+\-*/=<>!&|^%~]+$/.test(trimmedTag)
        if (!validPattern || formData.tags.includes(trimmedTag)) return
        updateField("tags", [...formData.tags, trimmedTag])
    }

    const removeTag = (index: number) => {
        if (!formData) return
        updateField("tags", formData.tags.filter((_, i) => i !== index))
    }

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!formData) return
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault()
            addTag(tagInput)
            setTagInput("")
        } else if (e.key === "Backspace" && tagInput === "" && formData.tags.length > 0) {
            removeTag(formData.tags.length - 1)
        }
    }

    const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const validPattern = /^[a-zA-Z+\-*/=<>!&|^%~\s]*$/.test(value)
        if (validPattern || value === "") {
            setTagInput(value.slice(0, 20))
        }
    }

    const handleSaveChanges = async () => {
        if (!formData) return

        try {
            setSaving(true)
            setMessage("")

            const res = await axios.put(`/api/admin/problems/${problemId}`, {
                ...formData,
                constraints: formData.constraints.filter(Boolean),
                examples: formData.examples.filter(
                    (example) => example.input.trim() && example.output.trim()
                ),
                testCases: formData.testCases.filter(
                    (testCase) => testCase.input.trim() && testCase.output.trim()
                ),
            })

            const updatedProblem = res.data.data
            const problemData: ProblemFormData = {
                title: updatedProblem.title || "",
                slug: updatedProblem.slug || "",
                description: updatedProblem.description || "",
                difficulty: updatedProblem.difficulty || "Easy",
                marks: updatedProblem.marks || 10,
                tags: updatedProblem.tags || [],
                constraints: updatedProblem.constraints?.length ? updatedProblem.constraints : [""],
                examples: updatedProblem.examples?.length
                    ? updatedProblem.examples
                    : [{ input: "", output: "", explanation: "" }],
                testCases: updatedProblem.testCases?.length
                    ? updatedProblem.testCases
                    : [{ input: "", output: "", isHidden: false }],
                starterCode: updatedProblem.starterCode || {
                    cpp: "",
                    java: "",
                    python: "",
                    javascript: "",
                },
            }

            setOriginalProblem(problemData)
            setFormData(problemData)
            setMessage(res.data.message || "Problem updated successfully")
            setMessageType("success")
        } catch (error: unknown) {
            const axiosError = error as { response?: { data?: { message?: string } } }
            setMessage(axiosError.response?.data?.message || "Failed to update problem")
            setMessageType("destructive")
        } finally {
            setSaving(false)
            setShowConfirmDialog(false)
        }
    }

    const handleDiscardChanges = () => {
        if (!originalProblem) return
        setFormData({ ...originalProblem })
        setMessage("Changes discarded")
        setMessageType("info")
    }

    if (notFound) {
        return (
            <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 pb-8 pt-2 text-center sm:px-6 xl:px-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border/60 bg-card/80">
                    <AlertCircle className="h-10 w-10 text-muted-foreground opacity-60" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Problem Not Found</h2>
                    <p className="text-sm text-muted-foreground">
                        The problem you&apos;re looking for doesn&apos;t exist or may have been removed.
                    </p>
                </div>
                <Link href="/admin/problems">
                    <Button className="rounded-2xl gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Problems
                    </Button>
                </Link>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
                <div className="h-64 animate-pulse rounded-[32px] border border-border/60 bg-muted" />
                <div className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
                    <div className="h-96 animate-pulse rounded-[28px] border border-border/60 bg-muted" />
                    <div className="h-96 animate-pulse rounded-[28px] border border-border/60 bg-muted" />
                </div>
                <div className="h-80 animate-pulse rounded-[28px] border border-border/60 bg-muted" />
                <div className="h-80 animate-pulse rounded-[28px] border border-border/60 bg-muted" />
            </div>
        )
    }

    if (!formData) return null

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-24 pt-2 sm:px-6 xl:px-8">
            <Link
                href="/admin/problems"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Problems
            </Link>

            <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-linear-to-br from-card via-card to-cyan-500/8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.12),transparent_30%)]" />
                <div className="relative grid gap-6 px-5 py-6 sm:px-7 sm:py-7 xl:grid-cols-[1.25fr_0.9fr] xl:px-8">
                    <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-cyan-500 shadow-none">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Problem Editor
                            </Badge>
                            <Badge variant="outline" className={cn("rounded-full px-3 py-1", getDifficultyStyles(formData.difficulty).badge)}>
                                {formData.difficulty}
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                {hasChanges ? "Unsaved changes" : "Synced"}
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Refine this reusable coding problem with more control
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                Edit the statement, update tests, rebalance the difficulty, and refine starter code
                                from the same cleaner builder experience as the create flow.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <CompactMetric label="Examples" value={String(insights.validExamples)} helper="student-ready samples" />
                            <CompactMetric label="Tests" value={String(insights.validTestCases)} helper="usable validation cases" />
                            <CompactMetric label="Status" value={hasChanges ? "Needs saving" : "Up to date"} helper="current edit state" highlight={hasChanges} />
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-border/60 bg-background/70 p-5 backdrop-blur-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                    Editor Pulse
                                </p>
                                <h2 className="mt-2 text-xl font-semibold tracking-tight">
                                    Current problem snapshot
                                </h2>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-500">
                                <FileCode2 className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <StatusRow icon={Tags} label="Tag stack" value={formData.tags.length > 0 ? `${formData.tags.length} linked` : "No tags yet"} />
                            <StatusRow icon={BookOpen} label="Constraints" value={insights.validConstraints > 0 ? `${insights.validConstraints} written` : "Needs problem rules"} />
                            <StatusRow icon={TestTube2} label="Starter coverage" value={`${insights.starterCoverage}/4 language templates added`} />
                        </div>
                    </div>
                </div>
            </section>

            {message && (
                <Alert
                    variant={messageType}
                    onDismiss={() => setMessage("")}
                    role="status"
                    aria-live="polite"
                    className="rounded-[24px]"
                >
                    {message}
                </Alert>
            )}

            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                <section className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
                    <Card className="rounded-[28px] border border-border/60 bg-card/80 py-0 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
                        <CardContent className="p-5 sm:p-6">
                            <div className="mb-5">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                    Problem Blueprint
                                </p>
                                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                                    Core details
                                </h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Edit the identity of the problem, the student-facing brief, and the scoring setup.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField label="Title" required hint="Keep the problem name clear and scannable">
                                    <input
                                        value={formData.title}
                                        onChange={(e) => updateField("title", e.target.value)}
                                        className="h-11 w-full rounded-2xl border px-3 py-2 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                        required
                                    />
                                </FormField>

                                <FormField label="Slug" required hint="URL-friendly identifier for this problem">
                                    <input
                                        value={formData.slug}
                                        onChange={(e) => updateField("slug", e.target.value)}
                                        className="h-11 w-full rounded-2xl border px-3 py-2 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                        required
                                    />
                                </FormField>

                                <FormField label="Difficulty" required hint="Adjust the challenge level when needed">
                                    <Select
                                        value={formData.difficulty}
                                        onValueChange={(val) => updateField("difficulty", val as ProblemFormData["difficulty"])}
                                    >
                                        <SelectTrigger className="h-11 rounded-2xl gap-2">
                                            <SelectValue placeholder="Select difficulty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Easy">Easy</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="Hard">Hard</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormField>

                                <FormField label="Marks" required hint="Change the score weight if needed">
                                    <input
                                        type="number"
                                        value={formData.marks}
                                        onChange={(e) => updateField("marks", Number(e.target.value))}
                                        className="h-11 w-full rounded-2xl border px-3 py-2 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                        required
                                        min="1"
                                    />
                                </FormField>
                            </div>

                            <FormField
                                label="Tags"
                                hint="Press Enter or comma to add a concept tag"
                                className="mt-4"
                            >
                                <input
                                    value={tagInput}
                                    onChange={handleTagInputChange}
                                    onKeyDown={handleTagInputKeyDown}
                                    placeholder="Add tags..."
                                    className="h-11 w-full rounded-2xl border px-3 py-2 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                    maxLength={20}
                                />
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {formData.tags.map((tag, index) => (
                                        <Badge key={index} variant="outline" className="gap-1 rounded-full px-3 py-1">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(index)}
                                                className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-destructive hover:text-destructive-foreground"
                                                aria-label={`Remove tag ${tag}`}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </FormField>

                            <FormField
                                label="Description"
                                required
                                className="mt-4"
                                hint="Update the full problem statement and any clarification text"
                            >
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => updateField("description", e.target.value)}
                                    rows={8}
                                    className="w-full resize-none rounded-[24px] border px-4 py-3 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                    required
                                />
                            </FormField>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[28px] border border-border/60 bg-card/80 py-0 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] xl:sticky xl:top-6">
                        <CardContent className="p-5 sm:p-6">
                            <div className="mb-5 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                        Editor Snapshot
                                    </p>
                                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                                        Problem composition
                                    </h2>
                                </div>
                                <Badge variant="outline" className={cn("rounded-full px-3 py-1", getDifficultyStyles(formData.difficulty).badge)}>
                                    {formData.difficulty}
                                </Badge>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <StatPill label="Tags" value={formData.tags.length} tone="sky" />
                                <StatPill label="Marks" value={formData.marks} tone="amber" />
                                <StatPill label="Examples" value={insights.validExamples} tone="emerald" />
                                <StatPill label="Hidden Tests" value={insights.hiddenTests} tone="rose" />
                            </div>

                            <div className="mt-5 space-y-3">
                                <SummaryBlock
                                    icon={FileText}
                                    label="Slug preview"
                                    value={formData.slug || "Add a slug to define the problem URL"}
                                    mono
                                />
                                <SummaryBlock
                                    icon={BookOpen}
                                    label="Constraint coverage"
                                    value={insights.validConstraints > 0 ? `${insights.validConstraints} usable constraints added` : "No real constraints added yet"}
                                />
                                <SummaryBlock
                                    icon={TestTube2}
                                    label="Starter code coverage"
                                    value={`${insights.starterCoverage} of 4 languages currently prepared`}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-5 xl:grid-cols-2">
                    <Card className="rounded-[28px] border border-border/60 bg-card/80 py-0 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
                        <CardContent className="p-5 sm:p-6">
                            <SectionBlockHeader
                                icon={BookOpen}
                                title="Constraints"
                                description="Adjust the rules and limits students should work within."
                                actionLabel="Add Constraint"
                                onAction={addConstraint}
                            />

                            <div className="space-y-3">
                                {formData.constraints.map((constraint, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            value={constraint}
                                            onChange={(e) => handleConstraintChange(index, e.target.value)}
                                            placeholder={`Constraint ${index + 1}`}
                                            className="h-11 w-full rounded-2xl border px-3 py-2 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeConstraint(index)}
                                            className="h-11 shrink-0 rounded-2xl"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[28px] border border-border/60 bg-card/80 py-0 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
                        <CardContent className="p-5 sm:p-6">
                            <SectionBlockHeader
                                icon={Sparkles}
                                title="Examples"
                                description="Refine the student-facing samples and explanations."
                                actionLabel="Add Example"
                                onAction={addExample}
                            />

                            <div className="space-y-4">
                                {formData.examples.map((example, index) => (
                                    <div key={index} className="space-y-3 rounded-[24px] border border-border/60 bg-background/55 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm font-semibold text-foreground">Example {index + 1}</p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeExample(index)}
                                                className="rounded-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <FormField label="Input">
                                            <textarea
                                                value={example.input}
                                                onChange={(e) => handleExampleChange(index, "input", e.target.value)}
                                                rows={3}
                                                className="w-full resize-none rounded-2xl border px-3 py-2 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                            />
                                        </FormField>

                                        <FormField label="Output">
                                            <textarea
                                                value={example.output}
                                                onChange={(e) => handleExampleChange(index, "output", e.target.value)}
                                                rows={3}
                                                className="w-full resize-none rounded-2xl border px-3 py-2 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                            />
                                        </FormField>

                                        <FormField label="Explanation">
                                            <textarea
                                                value={example.explanation}
                                                onChange={(e) => handleExampleChange(index, "explanation", e.target.value)}
                                                rows={3}
                                                className="w-full resize-none rounded-2xl border px-3 py-2 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                            />
                                        </FormField>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <Card className="rounded-[28px] border border-border/60 bg-card/80 py-0 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
                    <CardContent className="p-5 sm:p-6">
                        <SectionBlockHeader
                            icon={CheckCircle2}
                            title="Test Cases"
                            description="Adjust the public and hidden checks used to validate submissions."
                            actionLabel="Add Test Case"
                            onAction={addTestCase}
                        />

                        <div className="space-y-4">
                            {formData.testCases.map((testCase, index) => (
                                <div key={index} className="space-y-3 rounded-[24px] border border-border/60 bg-background/55 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-foreground">Test Case {index + 1}</p>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "rounded-full px-3 py-1",
                                                    testCase.isHidden
                                                        ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                                                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                                                )}
                                            >
                                                {testCase.isHidden ? "Hidden" : "Visible"}
                                            </Badge>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeTestCase(index)}
                                            className="rounded-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="grid gap-4 xl:grid-cols-2">
                                        <FormField label="Input">
                                            <textarea
                                                value={testCase.input}
                                                onChange={(e) => handleTestCaseChange(index, "input", e.target.value)}
                                                rows={4}
                                                className="w-full resize-none rounded-2xl border px-3 py-2 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                            />
                                        </FormField>

                                        <FormField label="Expected Output">
                                            <textarea
                                                value={testCase.output}
                                                onChange={(e) => handleTestCaseChange(index, "output", e.target.value)}
                                                rows={4}
                                                className="w-full resize-none rounded-2xl border px-3 py-2 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                            />
                                        </FormField>
                                    </div>

                                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                        <input
                                            type="checkbox"
                                            checked={testCase.isHidden}
                                            onChange={(e) => handleTestCaseChange(index, "isHidden", e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                        Hidden test case (not shown to students)
                                    </label>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[28px] border border-border/60 bg-card/80 py-0 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)]">
                    <CardContent className="p-5 sm:p-6">
                        <div className="mb-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                Starter Templates
                            </p>
                            <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <h2 className="text-2xl font-semibold tracking-tight">
                                        Language starter code
                                    </h2>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Edit one language at a time so the code templates stay easier to manage.
                                    </p>
                                </div>
                                <Badge variant="outline" className="rounded-full px-3 py-1">
                                    {insights.starterCoverage}/4 prepared
                                </Badge>
                            </div>
                        </div>

                        <Tabs value={activeStarterLanguage} onValueChange={(value) => setActiveStarterLanguage(value as StarterLanguage)} className="space-y-4">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="cpp">C++</TabsTrigger>
                                <TabsTrigger value="java">Java</TabsTrigger>
                                <TabsTrigger value="python">Python</TabsTrigger>
                                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                            </TabsList>

                            <TabsContent value="cpp" className="mt-0">
                                <StarterCodeEditor
                                    label="C++ starter code"
                                    hint="Adjust the base solution skeleton for C++."
                                    value={formData.starterCode.cpp}
                                    placeholder="// C++ starter code"
                                    onChange={(value) => handleStarterCodeChange("cpp", value)}
                                />
                            </TabsContent>

                            <TabsContent value="java" className="mt-0">
                                <StarterCodeEditor
                                    label="Java starter code"
                                    hint="Adjust the base solution skeleton for Java."
                                    value={formData.starterCode.java}
                                    placeholder="// Java starter code"
                                    onChange={(value) => handleStarterCodeChange("java", value)}
                                />
                            </TabsContent>

                            <TabsContent value="python" className="mt-0">
                                <StarterCodeEditor
                                    label="Python starter code"
                                    hint="Adjust the base solution skeleton for Python."
                                    value={formData.starterCode.python}
                                    placeholder="# Python starter code"
                                    onChange={(value) => handleStarterCodeChange("python", value)}
                                />
                            </TabsContent>

                            <TabsContent value="javascript" className="mt-0">
                                <StarterCodeEditor
                                    label="JavaScript starter code"
                                    hint="Adjust the base solution skeleton for JavaScript."
                                    value={formData.starterCode.javascript}
                                    placeholder="// JavaScript starter code"
                                    onChange={(value) => handleStarterCodeChange("javascript", value)}
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </form>

            {hasChanges && (
                <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 xl:px-8">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                            You have unsaved changes in this problem draft
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDiscardChanges}
                                disabled={saving}
                                className="rounded-2xl gap-2"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Discard Changes
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setShowConfirmDialog(true)}
                                disabled={saving}
                                className="min-w-[170px] rounded-2xl gap-2"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationDialog
                open={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
                onConfirm={handleSaveChanges}
                title="Confirm Problem Update"
                description={
                    formData
                        ? `You are about to update "${formData.title}" (${formData.slug}). This will overwrite the current version of the problem.`
                        : "Are you sure you want to update this problem?"
                }
                confirmText="Save Changes"
                cancelText="Cancel"
                variant="default"
            />
        </div>
    )
}

function getDifficultyStyles(difficulty: ProblemFormData["difficulty"]) {
    switch (difficulty) {
        case "Easy":
            return {
                badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
            }
        case "Medium":
            return {
                badge: "border-amber-500/20 bg-amber-500/10 text-amber-500",
            }
        case "Hard":
            return {
                badge: "border-rose-500/20 bg-rose-500/10 text-rose-500",
            }
    }
}

function CompactMetric({
    label,
    value,
    helper,
    highlight = false,
}: {
    label: string
    value: string
    helper: string
    highlight?: boolean
}) {
    return (
        <div className={cn(
            "rounded-[24px] border border-border/60 bg-background/70 p-4 backdrop-blur-sm",
            highlight && "border-cyan-500/20 bg-cyan-500/10"
        )}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {label}
            </p>
            <p className="mt-3 text-xl font-bold tracking-tight text-foreground">{value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
        </div>
    )
}

function StatusRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
}) {
    return (
        <div className="rounded-[22px] border border-border/60 bg-background/65 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
            </div>
            <p className="mt-3 text-sm font-medium leading-6 text-foreground">{value}</p>
        </div>
    )
}

function StatPill({
    label,
    value,
    tone,
}: {
    label: string
    value: number
    tone: "sky" | "amber" | "emerald" | "rose"
}) {
    const toneClass = {
        sky: "border-sky-500/20 bg-sky-500/10 text-sky-500",
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-500",
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        rose: "border-rose-500/20 bg-rose-500/10 text-rose-500",
    }[tone]

    return (
        <div className={cn("rounded-[22px] border p-4", toneClass)}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
            <p className="mt-3 text-3xl font-black tracking-tighter">{value}</p>
        </div>
    )
}

function SummaryBlock({
    icon: Icon,
    label,
    value,
    mono = false,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
    mono?: boolean
}) {
    return (
        <div className="rounded-[22px] border border-border/60 bg-background/65 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
            </div>
            <p className={cn("mt-3 text-sm font-medium leading-6 text-foreground", mono && "font-mono")}>
                {value}
            </p>
        </div>
    )
}

function SectionBlockHeader({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
}: {
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
    actionLabel: string
    onAction: () => void
}) {
    return (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAction}
                className="rounded-2xl gap-2"
            >
                <Plus className="h-4 w-4" />
                {actionLabel}
            </Button>
        </div>
    )
}

function StarterCodeEditor({
    label,
    hint,
    value,
    placeholder,
    onChange,
}: {
    label: string
    hint: string
    value: string
    placeholder: string
    onChange: (value: string) => void
}) {
    return (
        <FormField label={label} hint={hint}>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={14}
                className="w-full resize-none rounded-[24px] border px-4 py-3 font-mono text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                placeholder={placeholder}
            />
        </FormField>
    )
}
