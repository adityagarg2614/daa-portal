'use client'

import axios from "axios"
import React, { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
    Code2,
    FileText,
    Plus,
    X,
    CheckCircle2,
    Loader2,
    Save,
    RotateCcw,
    Trash2,
    BookOpen,
    Sparkles,
    ArrowLeft,
    AlertCircle,
} from "lucide-react"
import { FormField } from "@/components/ui/form-field"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SectionHeader } from "@/components/ui/section-header"
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
    difficulty: string
    marks: number
    tags: string[]
    constraints: string[]
    examples: Example[]
    testCases: TestCase[]
    starterCode: StarterCode
}

export default function ViewEditProblemPage() {
    const params = useParams()
    const router = useRouter()
    const problemId = params.id as string

    const [originalProblem, setOriginalProblem] = useState<ProblemFormData | null>(null)
    const [formData, setFormData] = useState<ProblemFormData | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState<"success" | "destructive" | "info">("info")
    const [tagInput, setTagInput] = useState("")
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [pendingAction, setPendingAction] = useState<"save" | "discard" | null>(null)
    const [notFound, setNotFound] = useState(false)

    // Fetch problem data on mount
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
                    constraints: problem.constraints || [""],
                    examples: problem.examples?.length > 0 ? problem.examples : [{ input: "", output: "", explanation: "" }],
                    testCases: problem.testCases?.length > 0 ? problem.testCases : [{ input: "", output: "", isHidden: false }],
                    starterCode: problem.starterCode || {
                        cpp: "",
                        java: "",
                        python: "",
                        javascript: "",
                    },
                }

                setOriginalProblem(problemData)
                setFormData(problemData)
            } catch (error: any) {
                if (error.response?.status === 404) {
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
            fetchProblem()
        }
    }, [problemId])

    // Check if form has changes compared to original
    const hasChanges = useMemo(() => {
        if (!originalProblem || !formData) return false
        return JSON.stringify(formData) !== JSON.stringify(originalProblem)
    }, [formData, originalProblem])

    // Handle form field changes
    const updateField = <K extends keyof ProblemFormData>(
        field: K,
        value: ProblemFormData[K]
    ) => {
        if (!formData) return
        setFormData({ ...formData, [field]: value })
    }

    // Constraint handlers
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

    // Example handlers
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

    // Test case handlers
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

    // Starter code handlers
    const handleStarterCodeChange = (language: keyof StarterCode, value: string) => {
        if (!formData) return
        updateField("starterCode", { ...formData.starterCode, [language]: value })
    }

    // Tag handlers
    const addTag = (tag: string) => {
        if (!formData) return
        const trimmedTag = tag.trim()
        if (!trimmedTag || trimmedTag.length > 20) return
        const validPattern = /^[a-zA-Z+\-*/=<>!&|^%~]+$/.test(trimmedTag)
        if (!validPattern) return
        if (formData.tags.includes(trimmedTag)) return
        updateField("tags", [...formData.tags, trimmedTag])
    }

    const removeTag = (index: number) => {
        if (!formData) return
        updateField("tags", formData.tags.filter((_, i) => i !== index))
    }

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault()
            addTag(tagInput)
            setTagInput("")
        } else if (e.key === "Backspace" && tagInput === "" && formData?.tags.length) {
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

    // Save changes handler
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

            setMessage(res.data.message || "Problem updated successfully")
            setMessageType("success")

            // Update original to new data
            const updatedProblem = res.data.data
            const problemData: ProblemFormData = {
                title: updatedProblem.title || "",
                slug: updatedProblem.slug || "",
                description: updatedProblem.description || "",
                difficulty: updatedProblem.difficulty || "Easy",
                marks: updatedProblem.marks || 10,
                tags: updatedProblem.tags || [],
                constraints: updatedProblem.constraints || [""],
                examples: updatedProblem.examples?.length > 0 ? updatedProblem.examples : [{ input: "", output: "", explanation: "" }],
                testCases: updatedProblem.testCases?.length > 0 ? updatedProblem.testCases : [{ input: "", output: "", isHidden: false }],
                starterCode: updatedProblem.starterCode || {
                    cpp: "",
                    java: "",
                    python: "",
                    javascript: "",
                },
            }

            setOriginalProblem(problemData)
            setFormData(problemData)
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message || "Failed to update problem"
            setMessage(errorMessage)
            setMessageType("destructive")
        } finally {
            setSaving(false)
            setShowConfirmDialog(false)
            setPendingAction(null)
        }
    }

    // Discard changes handler
    const handleDiscardChanges = () => {
        if (originalProblem) {
            setFormData({ ...originalProblem })
            setMessage("Changes discarded")
            setMessageType("info")
        }
    }

    // Confirm dialog handler
    const handleConfirmSave = () => {
        setPendingAction("save")
        setShowConfirmDialog(true)
    }

    const handleConfirmDialogChange = (open: boolean) => {
        setShowConfirmDialog(open)
        if (!open) {
            setPendingAction(null)
        }
    }

    const handleConfirmAction = () => {
        if (pendingAction === "save") {
            handleSaveChanges()
        }
    }

    // Not found state
    if (notFound) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
                <AlertCircle className="h-16 w-16 text-muted-foreground opacity-50" />
                <h2 className="text-2xl font-bold">Problem Not Found</h2>
                <p className="text-sm text-muted-foreground">
                    The problem you&apos;re looking for doesn&apos;t exist or has been deleted.
                </p>
                <Link href="/admin/problems">
                    <Button className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Problems
                    </Button>
                </Link>
            </div>
        )
    }

    // Loading state
    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
                <div className="h-32 rounded-2xl border bg-muted animate-pulse" />
                <div className="h-64 rounded-2xl border bg-muted animate-pulse" />
                <div className="h-64 rounded-2xl border bg-muted animate-pulse" />
            </div>
        )
    }

    if (!formData) {
        return null
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2 pb-24">
            {/* Back Button */}
            <Link
                href="/admin/problems"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Problems
            </Link>

            {/* Enhanced Header */}
            <SectionHeader
                title="View / Edit Problem"
                description="View and modify problem details"
                icon={Code2}
            />

            <form
                onSubmit={(e) => e.preventDefault()}
                className="space-y-6"
                aria-labelledby="page-heading"
            >
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
                                value={formData.title}
                                onChange={(e) => updateField("title", e.target.value)}
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
                                value={formData.slug}
                                onChange={(e) => updateField("slug", e.target.value)}
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
                            <Select
                                value={formData.difficulty.toLowerCase()}
                                onValueChange={(val) => {
                                    const difficultyMap: Record<string, string> = {
                                        easy: "Easy",
                                        medium: "Medium",
                                        hard: "Hard",
                                    }
                                    updateField("difficulty", difficultyMap[val] || val)
                                }}
                            >
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
                                value={formData.marks}
                                onChange={(e) => updateField("marks", Number(e.target.value))}
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
                            {formData.tags.map((tag, index) => (
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
                            value={formData.description}
                            onChange={(e) => updateField("description", e.target.value)}
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
                        {formData.constraints.map((constraint, index) => (
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
                        {formData.examples.map((example, index) => (
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
                        {formData.testCases.map((testCase, index) => (
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
                                value={formData.starterCode.cpp}
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
                                value={formData.starterCode.java}
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
                                value={formData.starterCode.python}
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
                                value={formData.starterCode.javascript}
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
                        onDismiss={() => setMessage("")}
                        role="status"
                        aria-live="polite"
                    >
                        {message}
                    </Alert>
                )}
            </form>

            {/* Sticky Action Bar - Only visible when there are changes */}
            {hasChanges && (
                <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <div className="mx-auto max-w-7xl px-4 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                                You have unsaved changes
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleDiscardChanges}
                                    disabled={saving}
                                    className="gap-2"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Discard Changes
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleConfirmSave}
                                    disabled={saving}
                                    className="gap-2 min-w-[160px]"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 icon-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                open={showConfirmDialog}
                onOpenChange={handleConfirmDialogChange}
                onConfirm={handleConfirmAction}
                title="Confirm Problem Update"
                description={
                    formData
                        ? `You are about to update "${formData.title}" (${formData.slug}). This will overwrite the existing problem.`
                        : "Are you sure you want to update this problem?"
                }
                confirmText="Save Changes"
                cancelText="Cancel"
                variant="default"
            />
        </div>
    )
}
