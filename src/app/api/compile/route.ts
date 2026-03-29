import { NextResponse } from "next/server";
import { executeCode, runTestCases, getLanguageConfig } from "@/lib/piston";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { code, language, testCases, stdin } = body;

        if (!code || !language) {
            return NextResponse.json(
                {
                    success: false,
                    message: "code and language are required",
                },
                { status: 400 }
            );
        }

        const langConfig = getLanguageConfig(language);
        if (!langConfig) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Unsupported language: ${language}. Supported: cpp, java, python, javascript`,
                },
                { status: 400 }
            );
        }

        // If test cases are provided, run them all
        if (testCases && Array.isArray(testCases) && testCases.length > 0) {
            const result = await runTestCases(code, language, testCases);

            if (result.compilationError) {
                return NextResponse.json(
                    {
                        success: false,
                        compilationError: true,
                        message: result.message,
                        error: result.compilationError,
                        results: [],
                    },
                    { status: 400 }
                );
            }

            return NextResponse.json({
                success: true,
                allPassed: result.allPassed,
                totalTests: result.totalTests,
                passedTests: result.passedTests,
                results: result.results,
                executionTime: result.executionTime,
                memoryUsed: result.memoryUsed,
            });
        }

        // Otherwise, just execute the code (Run Code mode)
        const result = await executeCode(code, language, stdin || "");

        if (!result.success && result.stderr) {
            return NextResponse.json(
                {
                    success: false,
                    compilationError: result.exitCode !== 0 && !result.stdout,
                    message: result.stderr ? "Code execution produced errors" : "Code execution failed",
                    output: result.stdout,
                    error: result.stderr,
                    executionTime: result.executionTime,
                    memoryUsed: result.memoryUsed,
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            output: result.stdout,
            error: result.stderr || null,
            executionTime: result.executionTime,
            memoryUsed: result.memoryUsed,
        });
    } catch (error) {
        console.error("Compilation Error:", error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Failed to compile and run code",
            },
            { status: 500 }
        );
    }
}
