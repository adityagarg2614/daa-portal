import React from "react";
import { CheckCircle2, XCircle, ChevronRight, Clock, MemoryStick } from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface TestResult {
    testCaseIndex: number;
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    error?: string;
    executionTime?: number;
    memoryUsed?: number;
}

interface TestResultsDisplayProps {
    results: TestResult[];
    totalExecutionTime?: number;
    totalMemoryUsed?: number;
}

export function TestResultsDisplay({
    results,
    totalExecutionTime,
    totalMemoryUsed,
}: TestResultsDisplayProps) {
    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.length - passedCount;
    const allPassed = failedCount === 0;

    return (
        <div className="mt-4 rounded-xl border bg-muted/30 p-4">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Test Results</h3>
                <div className="flex items-center gap-2">
                    <Badge
                        variant={allPassed ? "success" : "destructive"}
                        className="gap-1"
                    >
                        {allPassed ? (
                            <CheckCircle2 className="h-3 w-3" />
                        ) : (
                            <XCircle className="h-3 w-3" />
                        )}
                        {passedCount}/{results.length} Passed
                    </Badge>
                </div>
            </div>

            {/* Execution Stats */}
            {(totalExecutionTime !== undefined || totalMemoryUsed !== undefined) && (
                <div className="mb-4 flex gap-4">
                    {totalExecutionTime !== undefined && (
                        <div className="flex items-center gap-2 rounded-lg bg-background p-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Time:</span>
                            <span className="font-medium">{totalExecutionTime} ms</span>
                        </div>
                    )}
                    {totalMemoryUsed !== undefined && totalMemoryUsed > 0 && (
                        <div className="flex items-center gap-2 rounded-lg bg-background p-2 text-sm">
                            <MemoryStick className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Memory:</span>
                            <span className="font-medium">{totalMemoryUsed} KB</span>
                        </div>
                    )}
                </div>
            )}

            {/* Test Cases List */}
            <div className="space-y-2">
                {results.map((result, index) => (
                    <Collapsible key={index} defaultOpen={!result.passed}>
                        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-background p-3 text-sm hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                {result.passed ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                )}
                                <span className="font-medium">
                                    Test Case {index + 1}
                                </span>
                                {result.executionTime !== undefined && (
                                    <span className="text-xs text-muted-foreground">
                                        ({result.executionTime} ms)
                                    </span>
                                )}
                            </div>
                            <ChevronRight className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-90" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="mt-2 space-y-3 rounded-lg border bg-muted/30 p-3 text-sm">
                                {/* Input */}
                                <div>
                                    <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                        <span>Input:</span>
                                    </div>
                                    <pre className="overflow-x-auto rounded bg-background p-2 font-mono text-xs">
                                        {result.input || "(empty input)"}
                                    </pre>
                                </div>

                                {/* Expected Output */}
                                <div>
                                    <div className="mb-1 flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400">
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span>Expected Output:</span>
                                    </div>
                                    <pre className="overflow-x-auto rounded bg-background p-2 font-mono text-xs text-green-700 dark:text-green-300">
                                        {result.expectedOutput || "(empty output)"}
                                    </pre>
                                </div>

                                {/* Actual Output */}
                                <div>
                                    <div className="mb-1 flex items-center gap-2 text-xs font-medium">
                                        {result.passed ? (
                                            <span className="text-green-600 dark:text-green-400">
                                                Your Output:
                                            </span>
                                        ) : (
                                            <span className="text-red-600 dark:text-red-400">
                                                Your Output:
                                            </span>
                                        )}
                                    </div>
                                    <pre
                                        className={cn(
                                            "overflow-x-auto rounded bg-background p-2 font-mono text-xs",
                                            result.passed
                                                ? "text-green-700 dark:text-green-300"
                                                : "text-red-700 dark:text-red-300"
                                        )}
                                    >
                                        {result.actualOutput}
                                    </pre>
                                </div>

                                {/* Error Message */}
                                {result.error && (
                                    <div>
                                        <div className="mb-1 flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400">
                                            <XCircle className="h-3 w-3" />
                                            <span>Error:</span>
                                        </div>
                                        <pre className="overflow-x-auto rounded bg-red-50 dark:bg-red-950/20 p-2 font-mono text-xs text-red-700 dark:text-red-300">
                                            {result.error}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                ))}
            </div>
        </div>
    );
}
