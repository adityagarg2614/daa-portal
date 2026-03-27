'use client'

import React from "react"
import Link from "next/link"
import {
    FileText,
    Library,
    ArrowRight,
    BookOpen,
    Code2,
    Sparkles,
} from "lucide-react"

export default function AdminDashboardHomePage() {
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
                            <Sparkles className="h-6 w-6 icon-bounce" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight" id="page-heading">
                                Admin Dashboard
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Manage assignments and problems for your courses
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

            {/* Quick Actions */}
            <div
                className="rounded-2xl border bg-background p-6 shadow-sm"
                role="region"
                aria-labelledby="quick-actions-heading"
            >
                <h2 id="quick-actions-heading" className="mb-4 text-lg font-semibold">
                    Quick Actions
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Link
                        href="/admin/assignments/create"
                        className="group relative overflow-hidden rounded-xl border bg-background p-5 transition-all duration-300 hover:shadow-md hover:border-primary/50"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                                <FileText className="h-5 w-5 icon-hover-scale" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold">Create Assignment</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Build a new assignment with problems
                                </p>
                            </div>
                            <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                    </Link>

                    <Link
                        href="/admin/problems/create"
                        className="group relative overflow-hidden rounded-xl border bg-background p-5 transition-all duration-300 hover:shadow-md hover:border-primary/50"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                                <Code2 className="h-5 w-5 icon-hover-scale" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold">Create Problem</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Add a new problem to the bank
                                </p>
                            </div>
                            <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                    </Link>

                    <Link
                        href="/admin/assignments"
                        className="group relative overflow-hidden rounded-xl border bg-background p-5 transition-all duration-300 hover:shadow-md hover:border-primary/50"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                                <Library className="h-5 w-5 icon-hover-scale" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold">View Assignments</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Manage all assignments
                                </p>
                            </div>
                            <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                    </Link>

                    <Link
                        href="/admin/problems"
                        className="group relative overflow-hidden rounded-xl border bg-background p-5 transition-all duration-300 hover:shadow-md hover:border-primary/50"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                                <BookOpen className="h-5 w-5 icon-hover-scale" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold">Problem Bank</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Browse all problems
                                </p>
                            </div>
                            <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                    </Link>
                </div>
            </div>

            {/* Stats Overview */}
            <div
                className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
                role="region"
                aria-label="Dashboard statistics"
            >
                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Assignments</p>
                            <h2 className="mt-2 text-2xl font-bold">0</h2>
                        </div>
                        <div className="rounded-xl bg-muted p-2">
                            <FileText className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Problems</p>
                            <h2 className="mt-2 text-2xl font-bold">0</h2>
                        </div>
                        <div className="rounded-xl bg-muted p-2">
                            <Library className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Active Courses</p>
                            <h2 className="mt-2 text-2xl font-bold">0</h2>
                        </div>
                        <div className="rounded-xl bg-muted p-2">
                            <BookOpen className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Students</p>
                            <h2 className="mt-2 text-2xl font-bold">0</h2>
                        </div>
                        <div className="rounded-xl bg-muted p-2">
                            <Code2 className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Getting Started Guide */}
            <div
                className="rounded-2xl border bg-background p-6 shadow-sm"
                role="region"
                aria-labelledby="getting-started-heading"
            >
                <h2 id="getting-started-heading" className="mb-4 text-lg font-semibold">
                    Getting Started
                </h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                            1
                        </div>
                        <p>
                            <strong className="text-foreground">Create Problems:</strong> Start by
                            adding problems to your problem bank with detailed descriptions, test
                            cases, and starter code.
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                            2
                        </div>
                        <p>
                            <strong className="text-foreground">Create Assignments:</strong>{""}
                            Build assignments by selecting problems from your problem bank and
                            setting deadlines.
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                            3
                        </div>
                        <p>
                            <strong className="text-foreground">Manage Submissions:</strong> Monitor
                            student submissions and track progress through the dashboard.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
