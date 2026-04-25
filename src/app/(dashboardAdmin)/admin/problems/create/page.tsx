'use client'

import axios from "axios"
import React, { useMemo, useState } from "react"
import {
    BookOpen,
    CheckCircle2,
    Code2,
    FileCode2,
    FileText,
    Loader2,
    Plus,
    Send,
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

type Difficulty = "Easy" | "Medium" | "Hard"
type StarterLanguage = keyof StarterCode

export default function CreateProblemPage() {
    const [title, setTitle] = useState("")
    const [slug, setSlug] = useState("")
    const [description, setDescription] = useState("")
    const [difficulty, setDifficulty] = useState<Difficulty>("Easy")
    const [marks, setMarks] = useState(10)
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState("")
    const [constraints, setConstraints] = useState<string[]>([""])
    const [examples, setExamples] = useState<Example[]>([
        { input: "", output: "", explanation: "" },
    ])
    const [testCases, setTestCases] = useState<TestCase[]>([
        { input: "", output: "", isHidden: false },
    ])
    const [starterCode, setStarterCode] = useState<StarterCode>({
        cpp: "",
        java: "",
        python: "",
        javascript: "",
    })
    const [activeStarterLanguage, setActiveStarterLanguage] = useState<StarterLanguage>("cpp")

    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState<"success" | "destructive" | "info">(
        "info"
    )
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [pendingSubmission, setPendingSubmission] = useState<null | {
        title: string
        slug: string
        description: string
        difficulty: Difficulty
        marks: number
        tags: string[]
        constraints: string[]
        examples: Example[]
        testCases: TestCase[]
        starterCode: StarterCode
    }>(null)

    const insights = useMemo(() => {
        const validConstraints = constraints.filter((constraint) => constraint.trim()).length
        const validExamples = examples.filter(
            (example) => example.input.trim() && example.output.trim()
        ).length
        const validTestCases = testCases.filter(
            (testCase) => testCase.input.trim() && testCase.output.trim()
        ).length
        const starterCoverage = Object.values(starterCode).filter((code) => code.trim()).length
        const readiness =
            title.trim() && slug.trim() && description.trim()
                ? "Ready for review"
                : "Still needs core details"

        return {
            validConstraints,
            validExamples,
            validTestCases,
            starterCoverage,
            readiness,
        }
    }, [constraints, description, examples, slug, starterCode, testCases, title])

    const handleConstraintChange = (index: number, value: string) => {
        const updated = [...constraints]
        updated[index] = value
        setConstraints(updated)
    }

    const addConstraint = () => {
        setConstraints([...constraints, ""])
    }

    const removeConstraint = (index: number) => {
        setConstraints(constraints.filter((_, i) => i !== index))
    }

    const handleExampleChange = (index: number, field: keyof Example, value: string) => {
        const updated = [...examples]
        updated[index][field] = value
        setExamples(updated)
    }

    const addExample = () => {
        setExamples([...examples, { input: "", output: "", explanation: "" }])
    }

    const removeExample = (index: number) => {
        setExamples(examples.filter((_, i) => i !== index))
    }

    const handleTestCaseChange = (
        index: number,
        field: keyof TestCase,
        value: string | boolean
    ) => {
        const updated = [...testCases]
        updated[index][field] = value as never
        setTestCases(updated)
    }

    const addTestCase = () => {
        setTestCases([...testCases, { input: "", output: "", isHidden: true }])
    }

    const removeTestCase = (index: number) => {
        setTestCases(testCases.filter((_, i) => i !== index))
    }

    const handleStarterCodeChange = (language: StarterLanguage, value: string) => {
        setStarterCode((prev) => ({
            ...prev,
            [language]: value,
        }))
    }

    const addTag = (tag: string) => {
        const trimmedTag = tag.trim()
        if (!trimmedTag || trimmedTag.length > 20) return
        const validPattern = /^[a-zA-Z+\-*/=<>!&|^%~]+$/.test(trimmedTag)
        if (!validPattern || tags.includes(trimmedTag)) return
        setTags([...tags, trimmedTag])
    }

    const removeTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index))
    }

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault()
            addTag(tagInput)
            setTagInput("")
        } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
            removeTag(tags.length - 1)
        }
    }

    const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const validPattern = /^[a-zA-Z+\-*/=<>!&|^%~\s]*$/.test(value)
        if (validPattern || value === "") {
            setTagInput(value.slice(0, 20))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage("")

        if (!title || !slug || !description || !marks) {
            setMessage("Please fill all required fields")
            setMessageType("destructive")
            return
        }

        setPendingSubmission({
            title,
            slug,
            description,
            difficulty,
            marks,
            tags,
            constraints: constraints.filter(Boolean),
            examples: examples.filter(
                (example) => example.input.trim() && example.output.trim()
            ),
            testCases: testCases.filter(
                (testCase) => testCase.input.trim() && testCase.output.trim()
            ),
            starterCode,
        })
        setShowConfirmDialog(true)
    }

    const confirmSubmission = async () => {
        if (!pendingSubmission) return

        try {
            setLoading(true)
            setShowConfirmDialog(false)
            setPendingSubmission(null)
            setMessage("")

            const res = await axios.post("/api/admin/problems", pendingSubmission)

            setMessage(res.data.message || "Problem created successfully")
            setMessageType("success")

            setTitle("")
            setSlug("")
            setDescription("")
            setDifficulty("Easy")
            setMarks(10)
            setTags([])
            setTagInput("")
            setConstraints([""])
            setExamples([{ input: "", output: "", explanation: "" }])
            setTestCases([{ input: "", output: "", isHidden: false }])
            setStarterCode({
                cpp: "",
                java: "",
                python: "",
                javascript: "",
            })
            setActiveStarterLanguage("cpp")
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error && "response" in error
                    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    : "Failed to create problem"
            setMessage(errorMessage || "Failed to create problem")
            setMessageType("destructive")
        } finally {
            setLoading(false)
        }
    }

    const dismissMessage = () => {
        setMessage("")
    }

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-2 sm:px-6 xl:px-8">
            <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-linear-to-br from-card via-card to-cyan-500/8 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.65)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.12),transparent_30%)]" />
                <div className="relative grid gap-6 px-5 py-6 sm:px-7 sm:py-7 xl:grid-cols-[1.25fr_0.9fr] xl:px-8">
                    <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-cyan-500 shadow-none">
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                Problem Builder
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                                <Code2 className="mr-1.5 h-3.5 w-3.5" />
                                Admin authoring workspace
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Create DSA problems
                            </h1>
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                Draft the statement, set the difficulty, define examples and hidden
                                cases, and prepare starter code from one cleaner workspace.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <CompactMetric label="Examples" value={String(insights.validExamples)} helper="ready to show students" />
                            <CompactMetric label="Tests" value={String(insights.validTestCases)} helper="valid checks prepared" />
                            <CompactMetric label="Status" value={insights.readiness} helper="based on core fields" highlight={Boolean(title && slug && description)} />
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-border/60 bg-background/70 p-5 backdrop-blur-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                    Builder Pulse
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
                            <StatusRow icon={Tags} label="Tag stack" value={tags.length > 0 ? `${tags.length} linked` : "No tags yet"} />
                            <StatusRow icon={BookOpen} label="Constraints" value={insights.validConstraints > 0 ? `${insights.validConstraints} written` : "Needs problem rules"} />
                            <StatusRow icon={TestTube2} label="Starter coverage" value={`${insights.starterCoverage}/4 language templates added`} />
                        </div>
                    </div>
                </div>
            </section>

            {message && (
                <Alert
                    variant={messageType}
                    onDismiss={dismissMessage}
                    role="status"
                    aria-live="polite"
                    className="rounded-[24px]"
                >
                    {message}
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                                    Start with the identity of the problem, the student-facing brief,
                                    and the main scoring settings.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    label="Title"
                                    required
                                    hint="Use a clean name students can recognize quickly"
                                >
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Two Sum"
                                        className="h-11 w-full rounded-2xl border px-3 py-2 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                        required
                                    />
                                </FormField>

                                <FormField
                                    label="Slug"
                                    required
                                    hint="URL-friendly identifier such as two-sum"
                                >
                                    <input
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
                                        placeholder="e.g. two-sum"
                                        className="h-11 w-full rounded-2xl border px-3 py-2 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                        required
                                    />
                                </FormField>

                                <FormField
                                    label="Difficulty"
                                    required
                                    hint="Choose the expected challenge level"
                                >
                                    <Select value={difficulty} onValueChange={(value) => setDifficulty(value as Difficulty)}>
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

                                <FormField
                                    label="Marks"
                                    required
                                    hint="Points awarded for a correct solution"
                                >
                                    <input
                                        type="number"
                                        value={marks}
                                        onChange={(e) => setMarks(Number(e.target.value))}
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
                                    {tags.map((tag, index) => (
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
                                hint="Write the full problem statement, objective, and any guidance"
                            >
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter the full problem description..."
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
                                        Author Snapshot
                                    </p>
                                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                                        Problem composition
                                    </h2>
                                </div>
                                <Badge variant="outline" className={cn("rounded-full px-3 py-1", getDifficultyStyles(difficulty).badge)}>
                                    {difficulty}
                                </Badge>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <StatPill label="Tags" value={tags.length} tone="sky" />
                                <StatPill label="Marks" value={marks} tone="amber" />
                                <StatPill label="Examples" value={insights.validExamples} tone="emerald" />
                                <StatPill label="Hidden Tests" value={testCases.filter((testCase) => testCase.isHidden).length} tone="rose" />
                            </div>

                            <div className="mt-5 space-y-3">
                                <SummaryBlock
                                    icon={FileText}
                                    label="Slug preview"
                                    value={slug || "Add a slug to define the problem URL"}
                                    mono
                                />
                                <SummaryBlock
                                    icon={BookOpen}
                                    label="Constraint coverage"
                                    value={
                                        insights.validConstraints > 0
                                            ? `${insights.validConstraints} usable constraints added`
                                            : "No real constraints added yet"
                                    }
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
                                description="Capture the rules and limits students should keep in mind."
                                actionLabel="Add Constraint"
                                onAction={addConstraint}
                            />

                            <div className="space-y-3">
                                {constraints.map((constraint, index) => (
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
                                            aria-label="Remove constraint"
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
                                description="Give students high-quality samples they can reason from."
                                actionLabel="Add Example"
                                onAction={addExample}
                            />

                            <div className="space-y-4">
                                {examples.map((example, index) => (
                                    <div key={index} className="rounded-[24px] border border-border/60 bg-background/55 p-4 space-y-3">
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
                                                placeholder="Input"
                                            />
                                        </FormField>

                                        <FormField label="Output">
                                            <textarea
                                                value={example.output}
                                                onChange={(e) => handleExampleChange(index, "output", e.target.value)}
                                                rows={3}
                                                className="w-full resize-none rounded-2xl border px-3 py-2 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                                placeholder="Output"
                                            />
                                        </FormField>

                                        <FormField label="Explanation">
                                            <textarea
                                                value={example.explanation}
                                                onChange={(e) => handleExampleChange(index, "explanation", e.target.value)}
                                                rows={3}
                                                className="w-full resize-none rounded-2xl border px-3 py-2 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                                placeholder="Explanation"
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
                            description="Define the public and hidden checks the solution must satisfy."
                            actionLabel="Add Test Case"
                            onAction={addTestCase}
                        />

                        <div className="space-y-4">
                            {testCases.map((testCase, index) => (
                                <div key={index} className="rounded-[24px] border border-border/60 bg-background/55 p-4 space-y-3">
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
                                                placeholder="Test input"
                                            />
                                        </FormField>

                                        <FormField label="Expected Output">
                                            <textarea
                                                value={testCase.output}
                                                onChange={(e) => handleTestCaseChange(index, "output", e.target.value)}
                                                rows={4}
                                                className="w-full resize-none rounded-2xl border px-3 py-2 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                                                placeholder="Expected output"
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
                                        Keep this section lighter by editing one language at a time.
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
                                    hint="Provide the base solution skeleton for C++."
                                    value={starterCode.cpp}
                                    placeholder="// C++ starter code"
                                    onChange={(value) => handleStarterCodeChange("cpp", value)}
                                />
                            </TabsContent>

                            <TabsContent value="java" className="mt-0">
                                <StarterCodeEditor
                                    label="Java starter code"
                                    hint="Provide the base solution skeleton for Java."
                                    value={starterCode.java}
                                    placeholder="// Java starter code"
                                    onChange={(value) => handleStarterCodeChange("java", value)}
                                />
                            </TabsContent>

                            <TabsContent value="python" className="mt-0">
                                <StarterCodeEditor
                                    label="Python starter code"
                                    hint="Provide the base solution skeleton for Python."
                                    value={starterCode.python}
                                    placeholder="# Python starter code"
                                    onChange={(value) => handleStarterCodeChange("python", value)}
                                />
                            </TabsContent>

                            <TabsContent value="javascript" className="mt-0">
                                <StarterCodeEditor
                                    label="JavaScript starter code"
                                    hint="Provide the base solution skeleton for JavaScript."
                                    value={starterCode.javascript}
                                    placeholder="// JavaScript starter code"
                                    onChange={(value) => handleStarterCodeChange("javascript", value)}
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-4 rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_48px_-32px_rgba(0,0,0,0.45)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Final Check
                        </p>
                        <h2 className="mt-1 text-xl font-semibold tracking-tight">
                            Save this problem to the shared bank
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Review the draft once, then create the reusable problem for assignments.
                        </p>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="h-11 min-w-[220px] rounded-2xl gap-2"
                        aria-label="Create problem"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Creating Problem...</span>
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                <span>Create Problem</span>
                            </>
                        )}
                    </Button>
                </div>
            </form>

            <ConfirmationDialog
                open={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
                onConfirm={confirmSubmission}
                title="Confirm Problem Creation"
                description={
                    pendingSubmission
                        ? `You are about to create "${pendingSubmission.title}" (${pendingSubmission.slug}) with ${pendingSubmission.examples.length} example(s) and ${pendingSubmission.testCases.length} test case(s).`
                        : "Are you sure you want to create this problem?"
                }
                confirmText="Create Problem"
                cancelText="Cancel"
                variant="default"
            />
        </div>
    )
}

function getDifficultyStyles(difficulty: Difficulty) {
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
