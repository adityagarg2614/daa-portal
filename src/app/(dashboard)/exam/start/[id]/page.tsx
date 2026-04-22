"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ShieldAlert, 
    Play, 
    Clock, 
    BookOpen, 
    ShieldCheck, 
    CheckCircle2,
    AlertCircle,
    MonitorSmartphone,
    Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function ExamStartPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [examData, setExamData] = useState<any>(null);

    useEffect(() => {
        const fetchExamInfo = async () => {
            try {
                const res = await fetch(`/api/student/exam/start/${params.id}`);
                const data = await res.json();
                if (data.success) {
                    setExamData(data.data);
                } else {
                    toast.error(data.message);
                }
            } catch (error) {
                toast.error("Failed to load exam details");
            } finally {
                setLoading(false);
            }
        };
        fetchExamInfo();
    }, [params.id]);

    const handleStartExam = async () => {
        setStarting(true);
        try {
            const res = await fetch(`/api/student/exam/start/${params.id}`, {
                method: "POST",
            });
            const data = await res.json();
            if (data.success) {
                // If SEB is required, we stay here and show the launch link
                // If not, we can redirect to the assignment directly
                if (examData.assignment.isSebRequired) {
                    toast.success("Exam attempt prepared!");
                    // Refresh data to show launch options
                    const refreshRes = await fetch(`/api/student/exam/start/${params.id}`);
                    const refreshData = await refreshRes.json();
                    if (refreshData.success) {
                        setExamData(refreshData.data);
                    }
                } else {
                    router.push(`/assignment/${params.id}`);
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to start exam");
        } finally {
            setStarting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center p-8">
                <Skeleton className="h-[500px] w-full max-w-2xl rounded-2xl" />
            </div>
        );
    }

    if (!examData) {
        return (
            <div className="flex flex-1 items-center justify-center p-8">
                <Card className="w-full max-w-lg border-none shadow-xl text-center">
                    <CardHeader>
                        <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-3" />
                        <CardTitle>Could not load exam details</CardTitle>
                        <CardDescription>
                            This assignment may not exist or is not available yet. Please go back and try again.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button variant="outline" onClick={() => router.push("/home")}>
                            Back to Dashboard
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const { assignment, attempt } = examData;

    return (
        <div className="flex flex-1 flex-col items-center justify-center p-8 bg-muted/30">
            <div className="w-full max-w-3xl space-y-6">
                <Card className="border-none shadow-xl overflow-hidden">
                    <div className="h-2 bg-primary" />
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className="mb-2">Assignment Details</Badge>
                            {assignment.isSebRequired && (
                                <Badge variant="destructive" className="gap-1.5 py-0.5">
                                    <ShieldAlert className="h-3.5 w-3.5" />
                                    SEB Required
                                </Badge>
                            )}
                        </div>
                        <CardTitle className="text-3xl font-bold">{assignment.title}</CardTitle>
                        <CardDescription className="text-base">
                            Please read the following instructions carefully before starting your attempt.
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                             <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                                <Clock className="h-5 w-5 text-primary mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold">Deadline</p>
                                    <p className="text-sm text-muted-foreground">{format(new Date(assignment.dueAt), "PPP p")}</p>
                                </div>
                             </div>
                             <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                                <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold">Instructions</p>
                                    <p className="text-sm text-muted-foreground">Standard proctored rules apply.</p>
                                </div>
                             </div>
                        </div>

                        <div className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-xl border bg-card">
                            <h4 className="flex items-center gap-2 mb-2 font-bold text-primary">
                                <AlertCircle className="h-4 w-4" />
                                Rules & Requirements
                            </h4>
                            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                <li>You can only submit this assignment once.</li>
                                <li>The timer starts as soon as you enter the exam environment.</li>
                                {assignment.isSebRequired && (
                                    <>
                                        <li className="text-destructive font-semibold">This exam MUST be taken using Safe Exam Browser.</li>
                                        <li>External applications and websites will be blocked.</li>
                                        <li>Do not attempt to exit SEB without submitting.</li>
                                    </>
                                )}
                            </ul>
                        </div>

                        {attempt?.status === "pending" && assignment.isSebRequired && (
                            <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400">
                                <ShieldCheck className="h-4 w-4" />
                                <AlertTitle className="font-bold">Attempt Initialized</AlertTitle>
                                <AlertDescription>
                                    Your secure session is ready. Please launch the exam in Safe Exam Browser using the button below. 
                                    If SEB is not installed, download it first.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 p-6 pt-2">
                        {!attempt ? (
                            <Button 
                                className="w-full h-12 text-lg font-bold shadow-lg" 
                                onClick={handleStartExam}
                                disabled={starting}
                            >
                                {starting ? "Initializing..." : "Start Exam Attempt"}
                                <Play className="ml-2 h-5 w-5 fill-current" />
                            </Button>
                        ) : attempt.status === "pending" && assignment.isSebRequired ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                 <Button 
                                    variant="outline" 
                                    className="h-12 font-bold gap-2"
                                    asChild
                                >
                                    <a href="https://safeexambrowser.org/download_en.html" target="_blank" rel="noreferrer">
                                        <Download className="h-5 w-5" />
                                        Download SEB
                                    </a>
                                </Button>
                                <Button 
                                    className="h-12 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-lg gap-2"
                                    onClick={() => {
                                        const isAlreadyInSeb = navigator.userAgent.includes("SEB");
                                        
                                        if (isAlreadyInSeb) {
                                            router.push(`/assignment/${params.id}`);
                                        } else {
                                            // Construct SEB launch link
                                            const launchUrl = `seb://${window.location.host}/api/student/exam/config/${params.id}`;
                                            window.location.href = launchUrl;
                                            toast.info("Opening Safe Exam Browser...");
                                        }
                                    }}
                                >
                                    <MonitorSmartphone className="h-5 w-5" />
                                    {navigator.userAgent.includes("SEB") ? "Enter Secure Exam" : "Launch in SEB"}
                                </Button>
                            </div>
                        ) : attempt.status === "started" ? (
                            <Button 
                                className="w-full h-12 text-lg font-bold shadow-lg" 
                                onClick={() => router.push(`/assignment/${params.id}`)}
                            >
                                Resume Exam Attempt
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        ) : (
                            <div className="p-4 w-full text-center rounded-xl bg-green-500/10 text-green-600 font-bold border border-green-500/20">
                                <CheckCircle2 className="h-10 w-10 mx-auto mb-2" />
                                <p>You have already submitted this assignment.</p>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground text-center">
                            By starting the exam, you agree to the platform's academic integrity policies.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

function ArrowRight(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}
