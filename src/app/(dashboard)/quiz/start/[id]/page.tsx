"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Download,
    Play,
    ShieldAlert,
    ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

type QuizAttempt = {
    _id: string;
    status: "pending" | "started" | "submitted" | "expired";
};

type QuizData = {
    title: string;
    description: string;
    isSebRequired: boolean;
    dueAt: string;
};

type StartData = {
    quiz: QuizData;
    attempt: QuizAttempt | null;
};

const DEFAULT_SEB_PROFILE_PATH = process.env.NEXT_PUBLIC_SEB_PROFILE_PATH?.trim() || "/seb/algo-grade.seb";

function fillSebTemplate(template: string, quizId: string, origin: string) {
    return template
        .replaceAll("{{quizId}}", quizId)
        .replaceAll("{{origin}}", origin);
}

function isLoopbackHost(hostname: string) {
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function buildSebProtocolUrl(url: URL) {
    const sebProtocol = url.protocol === "https:" ? "sebs:" : "seb:";
    return `${sebProtocol}//${url.host}${url.pathname}${url.search}${url.hash}`;
}

function buildDefaultSebLaunchUrl(origin: string) {
    if (!origin) {
        return "";
    }

    return buildSebProtocolUrl(new URL(DEFAULT_SEB_PROFILE_PATH, origin));
}

function resolveSebLaunchUrl(template: string, quizId: string, origin: string) {
    const fallbackUrl = buildDefaultSebLaunchUrl(origin);

    if (!template) {
        return fallbackUrl;
    }

    const resolvedTemplate = fillSebTemplate(template, quizId, origin);

    if (!origin) {
        return resolvedTemplate;
    }

    if (resolvedTemplate.startsWith("/")) {
        return buildSebProtocolUrl(new URL(resolvedTemplate, origin));
    }

    try {
        const resolvedUrl = new URL(resolvedTemplate);
        const currentUrl = new URL(origin);

        if (
            isLoopbackHost(resolvedUrl.hostname) &&
            !isLoopbackHost(currentUrl.hostname)
        ) {
            return fallbackUrl;
        }

        if (resolvedUrl.protocol === "http:" || resolvedUrl.protocol === "https:") {
            return buildSebProtocolUrl(resolvedUrl);
        }

        if (
            resolvedUrl.protocol === "sebs:" &&
            currentUrl.protocol === "http:" &&
            resolvedUrl.host === currentUrl.host
        ) {
            resolvedUrl.protocol = "seb:";
            return resolvedUrl.toString();
        }

        return resolvedUrl.toString();
    } catch {
        return fallbackUrl || resolvedTemplate;
    }
}

export default function QuizStartPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [startData, setStartData] = useState<StartData | null>(null);
    const quizId = typeof params.id === "string" ? params.id : "";
    const isAlreadyInSeb =
        typeof navigator !== "undefined" && navigator.userAgent.includes("SEB");
    const configuredSebLaunchUrl = process.env.NEXT_PUBLIC_SEB_LAUNCH_URL?.trim() || "";
    const configuredSebDownloadUrl =
        process.env.NEXT_PUBLIC_SEB_DOWNLOAD_URL?.trim() ||
        "https://safeexambrowser.org/download_en.html";
    const browserOrigin = typeof window !== "undefined" ? window.location.origin : "";
    const resolvedSebLaunchUrl = resolveSebLaunchUrl(
        configuredSebLaunchUrl,
        quizId,
        browserOrigin
    );

    useEffect(() => {
        const fetchQuizInfo = async () => {
            try {
                const res = await fetch(`/api/student/quizzes/start/${quizId}`);
                const data = await res.json();
                if (data.success) {
                    setStartData(data.data);
                } else {
                    toast.error(data.message);
                }
            } catch {
                toast.error("Failed to load quiz details");
            } finally {
                setLoading(false);
            }
        };

        if (!quizId) {
            return;
        }

        void fetchQuizInfo();
    }, [quizId]);

    const handleStartQuiz = async () => {
        setStarting(true);
        try {
            const res = await fetch(`/api/student/quizzes/start/${quizId}`, {
                method: "POST",
            });
            const data = await res.json();
            if (data.success) {
                if (startData?.quiz.isSebRequired) {
                    toast.success("Secure quiz session prepared");
                    const refreshRes = await fetch(`/api/student/quizzes/start/${quizId}`);
                    const refreshData = await refreshRes.json();
                    if (refreshData.success) {
                        setStartData(refreshData.data);
                    }
                } else {
                    router.push(`/quiz/${quizId}`);
                }
            } else {
                toast.error(data.message);
            }
        } catch {
            toast.error("Failed to start quiz");
        } finally {
            setStarting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center p-8">
                <Skeleton className="h-125 w-full max-w-2xl rounded-2xl" />
            </div>
        );
    }

    if (!startData) {
        return (
            <div className="flex flex-1 items-center justify-center p-8">
                <Card className="w-full max-w-lg border-none text-center shadow-xl">
                    <CardHeader>
                        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
                        <CardTitle>Could not load quiz details</CardTitle>
                        <CardDescription>
                            This quiz may not exist or is not available yet.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button variant="outline" onClick={() => router.push("/quiz")}>
                            Back to Quizzes
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const { quiz, attempt } = startData;

    return (
        <div className="flex flex-1 flex-col items-center justify-center bg-muted/30 p-8">
            <div className="w-full max-w-3xl space-y-6">
                <Card className="overflow-hidden border-none shadow-xl">
                    <div className="h-2 bg-primary" />
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className="mb-2">Quiz Details</Badge>
                            {quiz.isSebRequired && (
                                <Badge variant="destructive" className="gap-1.5 py-0.5">
                                    <ShieldAlert className="h-3.5 w-3.5" />
                                    SEB Required
                                </Badge>
                            )}
                        </div>
                        <CardTitle className="text-3xl font-bold">{quiz.title}</CardTitle>
                        <CardDescription className="text-base">
                            Read these instructions carefully before starting your quiz attempt.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl bg-muted/50 p-4">
                                <div className="flex items-start gap-3">
                                    <Clock className="mt-0.5 h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm font-semibold">Deadline</p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(quiz.dueAt), "PPP p")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl bg-muted/50 p-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm font-semibold">Attempt policy</p>
                                        <p className="text-sm text-muted-foreground">
                                            One final submission only.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border bg-card p-4">
                            <h4 className="mb-2 flex items-center gap-2 font-bold text-primary">
                                <AlertCircle className="h-4 w-4" />
                                Rules & Requirements
                            </h4>
                            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                                <li>You can submit this quiz only once.</li>
                                <li>Students cannot reopen the quiz after the final submission.</li>
                                {quiz.isSebRequired && (
                                    <>
                                        <li className="font-semibold text-destructive">
                                            This quiz must be opened using Safe Exam Browser.
                                        </li>
                                        <li>Normal browsers cannot access the attempt page.</li>
                                    </>
                                )}
                            </ul>
                        </div>

                        {attempt?.status === "pending" && quiz.isSebRequired && (
                            <Alert className="border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <ShieldCheck className="h-4 w-4" />
                                <AlertTitle className="font-bold">Secure session initialized</AlertTitle>
                                <AlertDescription>
                                    Your protected quiz session is ready. Open the approved Safe Exam Browser profile below.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 p-6 pt-2">
                        {!attempt ? (
                            <Button
                                className="h-12 w-full text-lg font-bold shadow-lg"
                                onClick={handleStartQuiz}
                                disabled={starting}
                            >
                                {starting ? "Initializing..." : "Start Quiz Attempt"}
                                <Play className="ml-2 h-5 w-5 fill-current" />
                            </Button>
                        ) : attempt.status === "pending" && quiz.isSebRequired ? (
                            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                                <Button
                                    variant="outline"
                                    className="h-12 gap-2 font-bold"
                                    asChild
                                >
                                    <a href={configuredSebDownloadUrl} target="_blank" rel="noreferrer">
                                        <Download className="h-5 w-5" />
                                        Download SEB
                                    </a>
                                </Button>

                                {isAlreadyInSeb ? (
                                    <Button
                                        className="h-12 font-bold"
                                        onClick={() => router.push(`/quiz/${quizId}`)}
                                    >
                                        Open Quiz in SEB
                                    </Button>
                                ) : resolvedSebLaunchUrl ? (
                                    <Button className="h-12 font-bold" asChild>
                                        <a href={resolvedSebLaunchUrl}>Launch Safe Exam Browser</a>
                                    </Button>
                                ) : (
                                    <Button className="h-12 font-bold" disabled>
                                        SEB launch link unavailable
                                    </Button>
                                )}
                            </div>
                        ) : attempt.status === "submitted" ? (
                            <Alert className="w-full border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertTitle className="font-bold">Quiz already submitted</AlertTitle>
                                <AlertDescription>
                                    Your final submission has been recorded and the quiz is now locked.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Button
                                className="h-12 w-full text-lg font-bold shadow-lg"
                                onClick={() => router.push(`/quiz/${quizId}`)}
                            >
                                Continue to Quiz
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
