'use client'

import axios from "axios"
import React, { useState } from "react"

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
    const [tags, setTags] = useState("")
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage("")

        try {
            setLoading(true)

            const payload = {
                title,
                slug,
                description,
                difficulty,
                marks,
                tags: tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                constraints: constraints.filter(Boolean),
                examples: examples.filter(
                    (example) => example.input.trim() && example.output.trim()
                ),
                testCases: testCases.filter(
                    (testCase) => testCase.input.trim() && testCase.output.trim()
                ),
                starterCode,
            }

            const res = await axios.post("/api/admin/problems", payload)

            setMessage(res.data.message || "Problem created successfully")

            setTitle("")
            setSlug("")
            setDescription("")
            setDifficulty("Easy")
            setMarks(10)
            setTags("")
            setConstraints([""])
            setExamples([{ input: "", output: "", explanation: "" }])
            setTestCases([{ input: "", output: "", isHidden: false }])
            setStarterCode({
                cpp: "",
                java: "",
                python: "",
                javascript: "",
            })
        } catch (error: any) {
            setMessage(error?.response?.data?.message || "Failed to create problem")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-2">
            <div className="rounded-2xl border bg-background p-6 shadow-sm">
                <h1 className="text-2xl font-bold tracking-tight">Create Problem</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Add a new reusable problem to the problem bank.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Basic Details</h2>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium">Title</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter problem title"
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">Slug</label>
                            <input
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="e.g. two-sum"
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">Difficulty</label>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                            >
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">Marks</label>
                            <input
                                type="number"
                                value={marks}
                                onChange={(e) => setMarks(Number(e.target.value))}
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="mb-2 block text-sm font-medium">Tags</label>
                        <input
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="Array, Hash Map, DP"
                            className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                        />
                    </div>

                    <div className="mt-4">
                        <label className="mb-2 block text-sm font-medium">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter full problem description"
                            rows={6}
                            className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                            required
                        />
                    </div>
                </div>

                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Constraints</h2>
                        <button
                            type="button"
                            onClick={addConstraint}
                            className="rounded-lg border px-3 py-2 text-sm"
                        >
                            Add Constraint
                        </button>
                    </div>

                    <div className="space-y-3">
                        {constraints.map((constraint, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    value={constraint}
                                    onChange={(e) => handleConstraintChange(index, e.target.value)}
                                    placeholder={`Constraint ${index + 1}`}
                                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeConstraint(index)}
                                    className="rounded-lg border px-3 py-2 text-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Examples</h2>
                        <button
                            type="button"
                            onClick={addExample}
                            className="rounded-lg border px-3 py-2 text-sm"
                        >
                            Add Example
                        </button>
                    </div>

                    <div className="space-y-4">
                        {examples.map((example, index) => (
                            <div key={index} className="rounded-xl border p-4 space-y-3">
                                <input
                                    value={example.input}
                                    onChange={(e) =>
                                        handleExampleChange(index, "input", e.target.value)
                                    }
                                    placeholder="Input"
                                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                                />
                                <input
                                    value={example.output}
                                    onChange={(e) =>
                                        handleExampleChange(index, "output", e.target.value)
                                    }
                                    placeholder="Output"
                                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                                />
                                <textarea
                                    value={example.explanation}
                                    onChange={(e) =>
                                        handleExampleChange(index, "explanation", e.target.value)
                                    }
                                    placeholder="Explanation"
                                    rows={3}
                                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeExample(index)}
                                    className="rounded-lg border px-3 py-2 text-sm"
                                >
                                    Remove Example
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Test Cases</h2>
                        <button
                            type="button"
                            onClick={addTestCase}
                            className="rounded-lg border px-3 py-2 text-sm"
                        >
                            Add Test Case
                        </button>
                    </div>

                    <div className="space-y-4">
                        {testCases.map((testCase, index) => (
                            <div key={index} className="rounded-xl border p-4 space-y-3">
                                <textarea
                                    value={testCase.input}
                                    onChange={(e) =>
                                        handleTestCaseChange(index, "input", e.target.value)
                                    }
                                    placeholder="Test input"
                                    rows={3}
                                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                                />
                                <textarea
                                    value={testCase.output}
                                    onChange={(e) =>
                                        handleTestCaseChange(index, "output", e.target.value)
                                    }
                                    placeholder="Expected output"
                                    rows={3}
                                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                                />

                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={testCase.isHidden}
                                        onChange={(e) =>
                                            handleTestCaseChange(index, "isHidden", e.target.checked)
                                        }
                                    />
                                    Hidden Test Case
                                </label>

                                <button
                                    type="button"
                                    onClick={() => removeTestCase(index)}
                                    className="rounded-lg border px-3 py-2 text-sm"
                                >
                                    Remove Test Case
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Starter Code</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium">C++</label>
                            <textarea
                                value={starterCode.cpp}
                                onChange={(e) => handleStarterCodeChange("cpp", e.target.value)}
                                rows={8}
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">Java</label>
                            <textarea
                                value={starterCode.java}
                                onChange={(e) => handleStarterCodeChange("java", e.target.value)}
                                rows={8}
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">Python</label>
                            <textarea
                                value={starterCode.python}
                                onChange={(e) => handleStarterCodeChange("python", e.target.value)}
                                rows={8}
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">JavaScript</label>
                            <textarea
                                value={starterCode.javascript}
                                onChange={(e) =>
                                    handleStarterCodeChange("javascript", e.target.value)
                                }
                                rows={8}
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                            />
                        </div>
                    </div>
                </div>

                {message && (
                    <div className="rounded-xl border bg-background px-4 py-3 text-sm">
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                    {loading ? "Creating Problem..." : "Create Problem"}
                </button>
            </form>
        </div>
    )
}