'use client'

import axios from "axios"
import React, { useState } from "react"
import {
    Code2,
    FileText,
    Plus,
    X,
    CheckCircle2,
    Loader2,
    Send,
    Trash2,
    BookOpen,
    Sparkles,
} from "lucide-react"
import { FormField } from "@/components/ui/form-field"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

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

export default function CreateProblemPage() {
    const [title, setTitle] = useState("")
    const [slug, setSlug] = useState("")
    const [description, setDescription] = useState("")
    const [difficulty, setDifficulty] = useState("Easy")
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
    const [starterCode, setStarterCode] = useState({
        cpp: "",
        java: "",
        python: "",
        javascript: "",
    })

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
        difficulty: string
        marks: number
        tags: string[]
        constraints: string[]
        examples: Example[]
        testCases: TestCase[]
        starterCode: typeof starterCode
    }>(null)

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

    const handleExampleChange = (
        index: number,
        field: keyof Example,
        value: string
    ) => {
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

    const handleStarterCodeChange = (
        language: keyof typeof starterCode,
        value: string
    ) => {
        setStarterCode((prev) => ({
            ...prev,
            [language]: value,
        }))
    }

    const addTag = (tag: string) => {
        const trimmedTag = tag.trim()
        // Validate: max length 20, only alphabets and mathematical operators allowed
        if (!trimmedTag || trimmedTag.length > 20) return
        const validPattern = /^[a-zA-Z+\-*/=<>!&|^%~]+$/.test(trimmedTag)
        if (!validPattern) return
        // Prevent duplicates
        if (tags.includes(trimmedTag)) return
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
        // Only allow alphabets and mathematical operators
        const value = e.target.value
        const validPattern = /^[a-zA-Z+\-*/=<>!&|^%~\s]*$/.test(value)
        if (validPattern || value === "") {
            setTagInput(value.slice(0, 20))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage("")

        // Validate required fields
        if (!title || !slug || !description || !marks) {
            setMessage("Please fill all required fields")
            setMessageType("destructive")
            return
        }

        // Show confirmation dialog before submitting
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

            // Reset form
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
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error && 'response' in error
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
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
            {/* Enhanced Header */}
            <div
                className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-background to-muted p-8 shadow-sm"
                role="banner"
            >
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg"
                            aria-hidden="true"
                        >
                            <Code2 className="h-6 w-6 icon-bounce" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight" id="page-heading">
                                Create Problem
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Add a new reusable problem to the problem bank
                            </p>
                        </div>
                    </div>
                </div>
                {/* Decorative background elements */}
                <div
                    className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl"
                    aria-hidden="true"
                />
                <div
                    className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl"
                    aria-hidden="true"
                />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" aria-labelledby="page-heading">
                {/* Basic Details Section */}
                <div
                    className="rounded-2xl border bg-background p-6 shadow-sm"
                    role="region"
                    aria-labelledby="basic-details-heading"
                >
                    <div className="mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h2 id="basic-details-heading" className="text-lg font-semibold">
                            Basic Details
                        </h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            label="Title"
                            required
                            hint="Enter a descriptive title for the problem"
                        >
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Two Sum"
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all"
                                required
                            />
                        </FormField>

                        <FormField
                            label="Slug"
                            required
                            hint="URL-friendly identifier (e.g., two-sum)"
                        >
                            <input
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="e.g. two-sum"
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all"
                                required
                            />
                        </FormField>

                        <FormField
                            label="Difficulty"
                            required
                            hint="Select the problem difficulty level"
                        >
                            <Select value={difficulty} onValueChange={setDifficulty}>
                                <SelectTrigger className="gap-2">
                                    <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-green-500" />
                                            Easy
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="medium">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-yellow-500" />
                                            Medium
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="hard">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-red-500" />
                                            Hard
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </FormField>

                        <FormField
                            label="Marks"
                            required
                            hint="Points awarded for solving this problem"
                        >
                            <input
                                type="number"
                                value={marks}
                                onChange={(e) => setMarks(Number(e.target.value))}
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all"
                                required
                                min="1"
                            />
                        </FormField>
                    </div>

                    <FormField
                        label="Tags"
                        hint="Type a tag and press Enter or comma to add (max 20 chars, letters and operators only)"
                        className="mt-4"
                    >
                        <input
                            value={tagInput}
                            onChange={handleTagInputChange}
                            onKeyDown={handleTagInputKeyDown}
                            placeholder="Add tags..."
                            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all"
                            maxLength={20}
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                            {tags.map((tag, index) => (
                                <Badge
                                    key={index}
                                    variant="secondary"
                                    className="gap-1 px-2 py-0.5"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(index)}
                                        className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-transparent hover:bg-destructive hover:text-destructive-foreground transition-colors"
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
                        hint="Provide detailed problem statement and instructions"
                    >
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter full problem description"
                            rows={6}
                            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all resize-none"
                            required
                        />
                    </FormField>
                </div>

                {/* Constraints Section */}
                <div
                    className="rounded-2xl border bg-background p-6 shadow-sm"
                    role="region"
                    aria-labelledby="constraints-heading"
                >
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            <h2 id="constraints-heading" className="text-lg font-semibold">
                                Constraints
                            </h2>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addConstraint}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4 icon-hover-scale" />
                            Add Constraint
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {constraints.map((constraint, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    value={constraint}
                                    onChange={(e) => handleConstraintChange(index, e.target.value)}
                                    placeholder={`Constraint ${index + 1}`}
                                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeConstraint(index)}
                                    className="shrink-0"
                                    aria-label="Remove constraint"
                                >
                                    <X className="h-4 w-4 icon-hover-scale" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Examples Section */}
                <div
                    className="rounded-2xl border bg-background p-6 shadow-sm"
                    role="region"
                    aria-labelledby="examples-heading"
                >
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <h2 id="examples-heading" className="text-lg font-semibold">
                                Examples
                            </h2>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addExample}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4 icon-hover-scale" />
                            Add Example
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {examples.map((example, index) => (
                            <div
                                key={index}
                                className="rounded-xl border bg-muted/30 p-4 space-y-3"
                            >
                                <FormField label={`Example ${index + 1} Input`}>
                                    <input
                                        value={example.input}
                                        onChange={(e) =>
                                            handleExampleChange(index, "input", e.target.value)
                                        }
                                        placeholder="Input"
                                        className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all"
                                    />
                                </FormField>

                                <FormField label={`Example ${index + 1} Output`}>
                                    <input
                                        value={example.output}
                                        onChange={(e) =>
                                            handleExampleChange(index, "output", e.target.value)
                                        }
                                        placeholder="Output"
                                        className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all"
                                    />
                                </FormField>

                                <FormField label={`Example ${index + 1} Explanation`}>
                                    <textarea
                                        value={example.explanation}
                                        onChange={(e) =>
                                            handleExampleChange(index, "explanation", e.target.value)
                                        }
                                        placeholder="Explanation"
                                        rows={3}
                                        className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all resize-none"
                                    />
                                </FormField>

                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeExample(index)}
                                        className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Remove Example
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Test Cases Section */}
                <div
                    className="rounded-2xl border bg-background p-6 shadow-sm"
                    role="region"
                    aria-labelledby="test-cases-heading"
                >
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <h2 id="test-cases-heading" className="text-lg font-semibold">
                                Test Cases
                            </h2>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addTestCase}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4 icon-hover-scale" />
                            Add Test Case
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {testCases.map((testCase, index) => (
                            <div
                                key={index}
                                className="rounded-xl border bg-muted/30 p-4 space-y-3"
                            >
                                <FormField label={`Test Case ${index + 1} Input`}>
                                    <textarea
                                        value={testCase.input}
                                        onChange={(e) =>
                                            handleTestCaseChange(index, "input", e.target.value)
                                        }
                                        placeholder="Test input"
                                        rows={3}
                                        className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all resize-none"
                                    />
                                </FormField>

                                <FormField label={`Test Case ${index + 1} Expected Output`}>
                                    <textarea
                                        value={testCase.output}
                                        onChange={(e) =>
                                            handleTestCaseChange(index, "output", e.target.value)
                                        }
                                        placeholder="Expected output"
                                        rows={3}
                                        className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all resize-none"
                                    />
                                </FormField>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id={`hidden-${index}`}
                                        checked={testCase.isHidden}
                                        onChange={(e) =>
                                            handleTestCaseChange(index, "isHidden", e.target.checked)
                                        }
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <label
                                        htmlFor={`hidden-${index}`}
                                        className="text-sm font-medium"
                                    >
                                        Hidden Test Case (not shown to students)
                                    </label>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeTestCase(index)}
                                        className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Remove Test Case
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Starter Code Section */}
                <div
                    className="rounded-2xl border bg-background p-6 shadow-sm"
                    role="region"
                    aria-labelledby="starter-code-heading"
                >
                    <div className="mb-4 flex items-center gap-2">
                        <Code2 className="h-5 w-5 text-primary" />
                        <h2 id="starter-code-heading" className="text-lg font-semibold">
                            Starter Code
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <FormField
                            label="C++"
                            hint="Provide starter code template for C++"
                        >
                            <textarea
                                value={starterCode.cpp}
                                onChange={(e) => handleStarterCodeChange("cpp", e.target.value)}
                                rows={8}
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all resize-none font-mono"
                                placeholder="// C++ starter code"
                            />
                        </FormField>

                        <FormField
                            label="Java"
                            hint="Provide starter code template for Java"
                        >
                            <textarea
                                value={starterCode.java}
                                onChange={(e) => handleStarterCodeChange("java", e.target.value)}
                                rows={8}
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all resize-none font-mono"
                                placeholder="// Java starter code"
                            />
                        </FormField>

                        <FormField
                            label="Python"
                            hint="Provide starter code template for Python"
                        >
                            <textarea
                                value={starterCode.python}
                                onChange={(e) => handleStarterCodeChange("python", e.target.value)}
                                rows={8}
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all resize-none font-mono"
                                placeholder="# Python starter code"
                            />
                        </FormField>

                        <FormField
                            label="JavaScript"
                            hint="Provide starter code template for JavaScript"
                        >
                            <textarea
                                value={starterCode.javascript}
                                onChange={(e) =>
                                    handleStarterCodeChange("javascript", e.target.value)
                                }
                                rows={8}
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 transition-all resize-none font-mono"
                                placeholder="// JavaScript starter code"
                            />
                        </FormField>
                    </div>
                </div>

                {/* Message Alert */}
                {message && (
                    <Alert
                        variant={messageType}
                        onDismiss={dismissMessage}
                        role="status"
                        aria-live="polite"
                    >
                        {message}
                    </Alert>
                )}

                {/* Submit Button */}
                <div className="flex items-center gap-4">
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full md:w-auto min-w-[200px] gap-2"
                        size="lg"
                        aria-label="Create problem"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 icon-spin" />
                                <span>Creating Problem...</span>
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4 icon-hover-scale" />
                                <span>Create Problem</span>
                            </>
                        )}
                    </Button>
                </div>
            </form>

            {/* Confirmation Dialog */}
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
