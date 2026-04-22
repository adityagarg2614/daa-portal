"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
    CheckCircle2, 
    LogOut, 
    Home,
    Award,
    Trophy,
    FileCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ExamFinishedPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const score = searchParams.get("score");
    const maxScore = searchParams.get("maxScore");
    const title = searchParams.get("title") || "Assignment";

    return (
        <div className="flex flex-1 flex-col items-center justify-center p-8 bg-muted/30">
            <div className="w-full max-w-2xl">
                <Card className="border-none shadow-2xl overflow-hidden text-center">
                    <div className="h-2 bg-green-500" />
                    <CardHeader className="pt-10">
                        <div className="mx-auto w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                        <CardTitle className="text-3xl font-bold text-green-600">Exam Submitted!</CardTitle>
                        <CardDescription className="text-lg">
                            Your submission for <span className="font-semibold text-foreground">{title}</span> has been successfully recorded.
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-8 py-6">
                        {score && maxScore && (
                            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 max-w-sm mx-auto">
                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Provisional Score</p>
                                <div className="flex items-center justify-center gap-3">
                                    <Trophy className="h-8 w-8 text-yellow-500" />
                                    <span className="text-5xl font-black text-primary">{score}</span>
                                    <Separator orientation="vertical" className="h-10 mx-2" />
                                    <span className="text-2xl font-bold text-muted-foreground">/ {maxScore}</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                            <div className="p-4 rounded-xl bg-muted/50 border flex flex-col items-center gap-2">
                                <FileCheck className="h-5 w-5 text-green-600" />
                                <span className="text-xs font-bold text-muted-foreground uppercase">Status</span>
                                <span className="text-sm font-semibold">Completed</span>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/50 border flex flex-col items-center gap-2">
                                <Award className="h-5 w-5 text-blue-600" />
                                <span className="text-xs font-bold text-muted-foreground uppercase">Review</span>
                                <span className="text-sm font-semibold">Available Later</span>
                            </div>
                        </div>

                         <div className="text-sm text-muted-foreground italic">
                            "Great work! Your effort is being evaluated by the system. You can view detailed feedback on your dashboard once the results are finalized."
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 p-8 pt-4">
                        <Button 
                            variant="destructive"
                            className="w-full h-12 text-lg font-bold shadow-lg gap-2" 
                            onClick={() => {
                                // Standard SEB quit link
                                // This works if SEB is configured to allow quit via URL
                                window.location.href = "seb://quit";
                            }}
                        >
                            <LogOut className="h-5 w-5" />
                            Exit Secure Exam Browser
                        </Button>
                        <Button 
                            variant="ghost"
                            className="w-full text-muted-foreground" 
                            onClick={() => router.push("/home")}
                        >
                            <Home className="mr-2 h-4 w-4" />
                            Return to Portal Dashboard
                        </Button>
                        <p className="text-[10px] text-muted-foreground">
                            If the 'Exit' button doesn't work, please use the SEB taskbar or Ctrl+Q / Cmd+Q.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
