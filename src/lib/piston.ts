// Multi-provider code execution library
// Tries multiple Piston instances, falls back to alternative APIs

// Multiple Piston API instances (in order of preference)
// Local self-hosted Piston is first (unlimited, free, reliable)
const PISTON_INSTANCES = [
    "http://localhost:2000/api/v2",  // Self-hosted (Docker)
    "https://emkc.org/api/v2/piston",
    "https://piston.myvm.io/api/v2",
    "https://piston-batch.vercel.app/api/v2",
];

// Fallback: Judge0 CE (no API key needed for basic usage)
const JUDGE0_API = "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || "";

// Language mapping to Piston language names and versions
const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
    cpp: { language: "cpp", version: "10.2.0" },
    java: { language: "java", version: "15.0.2" },
    python: { language: "python", version: "3.10.0" },
    javascript: { language: "javascript", version: "18.15.0" },
};

export interface TestCase {
    input: string;
    output: string;
}

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

export interface ExecutionResult {
    success: boolean;
    stdout: string;
    stderr: string;
    compileOutput: string;
    exitCode: number | null;
    executionTime: number;
    memoryUsed: number;
}

export interface CompileAndTestResult {
    success: boolean;
    allPassed: boolean;
    totalTests: number;
    passedTests: number;
    results: TestResult[];
    executionTime: number;
    memoryUsed: number;
    compilationError?: string;
    message?: string;
}

/**
 * Get language configuration for Piston
 */
export function getLanguageConfig(language: string) {
    return LANGUAGE_MAP[language.toLowerCase()];
}

/**
 * Try to execute code with multiple Piston instances
 */
async function executeWithPiston(
    code: string,
    langConfig: { language: string; version: string },
    stdin: string = ""
): Promise<{ success: boolean; result?: ExecutionResult; error?: string }> {

    for (const PISTON_API of PISTON_INSTANCES) {
        try {
            const requestBody = {
                language: langConfig.language,
                version: langConfig.version,
                files: [{ content: code }],
                stdin,
                run_timeout: 3000, // Max allowed by self-hosted Piston (3 seconds)
                run_memory_limit: 128000000, // 128 MB (safe limit)
            };

            const response = await fetch(`${PISTON_API}/execute`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const text = await response.text();

                // Check if this is a whitelist error
                if (text.includes("whitelist") || response.status === 401) {
                    continue; // Try next instance
                }

                // For localhost, if it's a real API error (not compilation error),
                // we should still try other instances OR return the error properly
                if (PISTON_API.includes("localhost")) {
                    try {
                        const errorData = JSON.parse(text);
                        console.error('Local Piston API error:', errorData);
                        // If Piston itself has an error (not a code compilation error),
                        // we should try to continue or throw appropriately
                        if (errorData.message) {
                            // This is a Piston API error, not a code error
                            // Don't throw - just continue to next instance or fail gracefully
                            continue;
                        }
                    } catch (e) {
                        // Not JSON, try next instance
                        continue;
                    }
                }

                // For public instances, just continue to next
                continue;
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                if (text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
                    console.warn(`Piston returned HTML, trying next instance...`);
                    continue;
                }
                throw new Error("Piston returned non-JSON response");
            }

            const result = await response.json();

            const compileStderr = (result.compile?.stderr || "").trim();
            const compileStdout = (result.compile?.stdout || "").trim();
            const runStdout = (result.run?.stdout || "").trim();
            const runStderr = (result.run?.stderr || "").trim();
            const runExitCode = result.run?.code ?? null;

            if (compileStderr && !runStdout && runExitCode !== 0) {
                return {
                    success: false,
                    result: {
                        success: false,
                        stdout: "",
                        stderr: compileStderr,
                        compileOutput: compileStdout,
                        exitCode: result.compile?.code ?? 1,
                        executionTime: 0,
                        memoryUsed: 0,
                    },
                };
            }

            return {
                success: true,
                result: {
                    success: !runStderr && runExitCode === 0,
                    stdout: runStdout,
                    stderr: runStderr,
                    compileOutput: compileStdout,
                    exitCode: runExitCode,
                    executionTime: result.run?.time ? parseFloat(result.run.time) * 1000 : 0,
                    memoryUsed: result.run?.memory ? parseInt(result.run.memory) / 1024 : 0,
                },
            };
        } catch (error) {
            console.warn(`Piston instance ${PISTON_API} failed:`, error instanceof Error ? error.message : error);
            // Continue to next instance
        }
    }

    return { success: false, error: "All Piston instances are unavailable" };
}

/**
 * Fallback: Execute with Judge0 (if API key is provided)
 */
async function executeWithJudge0(
    code: string,
    langConfig: { language: string; version: string },
    stdin: string = ""
): Promise<{ success: boolean; result?: ExecutionResult; error?: string }> {

    if (!JUDGE0_API_KEY) {
        return { success: false, error: "Judge0 API key not configured" };
    }

    // Judge0 language ID mapping
    const JUDGE0_LANG_MAP: Record<string, string> = {
        cpp: "54",
        java: "62",
        python: "71",
        javascript: "63",
    };

    const languageId = JUDGE0_LANG_MAP[langConfig.language];
    if (!languageId) {
        return { success: false, error: `Unsupported language for Judge0: ${langConfig.language}` };
    }

    try {
        // Submit code
        const submitResponse = await fetch(`${JUDGE0_API}/submissions?base64_encoded=false&wait=true`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-RapidAPI-Key": JUDGE0_API_KEY,
                "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
            body: JSON.stringify({
                source_code: code,
                language_id: languageId,
                stdin: stdin,
            }),
        });

        if (!submitResponse.ok) {
            const error = await submitResponse.text();
            throw new Error(`Judge0 error: ${submitResponse.status} - ${error}`);
        }

        const submission = await submitResponse.json();

        // Status: 1=In Queue, 2=Processing, 3=Accepted, 4=WA, 5=TLE, 6=RE, 7=CE
        const statusId = submission.status?.id;

        if (statusId === 7) { // Compile Error
            return {
                success: false,
                result: {
                    success: false,
                    stdout: "",
                    stderr: submission.compile_output || submission.message || "Compilation failed",
                    compileOutput: "",
                    exitCode: -1,
                    executionTime: 0,
                    memoryUsed: 0,
                },
            };
        }

        if (statusId === 6) { // Runtime Error
            return {
                success: false,
                result: {
                    success: false,
                    stdout: submission.stdout || "",
                    stderr: submission.stderr || submission.message || "Runtime error",
                    compileOutput: "",
                    exitCode: -1,
                    executionTime: parseFloat(submission.time || "0") * 1000,
                    memoryUsed: submission.memory || 0,
                },
            };
        }

        return {
            success: true,
            result: {
                success: statusId === 3,
                stdout: submission.stdout || "",
                stderr: submission.stderr || "",
                compileOutput: submission.compile_output || "",
                exitCode: statusId === 3 ? 0 : -1,
                executionTime: parseFloat(submission.time || "0") * 1000,
                memoryUsed: submission.memory || 0,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Judge0 execution failed",
        };
    }
}

/**
 * Execute code with fallback chain: Piston → Judge0
 */
export async function executeCode(
    code: string,
    language: string,
    stdin: string = ""
): Promise<ExecutionResult> {
    const langConfig = getLanguageConfig(language);
    if (!langConfig) {
        throw new Error(
            `Unsupported language: ${language}. Supported: cpp, java, python, javascript`
        );
    }

    // Try Piston instances first
    const pistonResult = await executeWithPiston(code, langConfig, stdin);

    // If Piston returned a result (even if code failed), use it
    // This includes compilation errors, runtime errors, etc.
    if (pistonResult.result) {
        return pistonResult.result;
    }

    // Piston itself failed (API error, all instances down, etc.)
    // Only then fall back to Judge0 (if API key configured)
    if (JUDGE0_API_KEY) {
        const judge0Result = await executeWithJudge0(code, langConfig, stdin);
        if (judge0Result.result) {
            return judge0Result.result;
        }
    }

    // All providers failed
    throw new Error(
        pistonResult.error || "All code execution services are unavailable"
    );
}

/**
 * Compile and run code against test cases
 * Returns detailed results for each test case
 */
export async function runTestCases(
    code: string,
    language: string,
    testCases: TestCase[]
): Promise<CompileAndTestResult> {
    const langConfig = getLanguageConfig(language);
    if (!langConfig) {
        return {
            success: false,
            allPassed: false,
            totalTests: testCases.length,
            passedTests: 0,
            results: [],
            executionTime: 0,
            memoryUsed: 0,
            message: `Unsupported language: ${language}`,
        };
    }

    // First, do a quick compile check with the first test case input
    // This catches compile errors early without running all test cases
    try {
        const firstResult = await executeCode(code, language, testCases[0]?.input || "");
        if (firstResult.stderr && !firstResult.stdout && firstResult.exitCode !== 0) {
            // Compilation error — return early
            return {
                success: false,
                allPassed: false,
                totalTests: testCases.length,
                passedTests: 0,
                results: [],
                executionTime: 0,
                memoryUsed: 0,
                compilationError: firstResult.stderr,
                message: "Compilation failed. Fix the errors and try again.",
            };
        }
    } catch (error) {
        return {
            success: false,
            allPassed: false,
            totalTests: testCases.length,
            passedTests: 0,
            results: [],
            executionTime: 0,
            memoryUsed: 0,
            message: error instanceof Error ? error.message : "Failed to compile code.",
        };
    }

    const testResults: TestResult[] = [];
    let totalExecutionTime = 0;
    let totalMemoryUsed = 0;
    let allPassed = true;

    // Run each test case
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];

        try {
            const execution = await executeCode(code, language, testCase.input);

            const actualOutput = execution.stdout;
            const errorMsg = execution.stderr;

            // Normalize whitespace for comparison
            const normalizedActual = actualOutput
                .replace(/\r\n/g, "\n")
                .replace(/\s+/g, " ")
                .trim();
            const normalizedExpected = testCase.output
                .replace(/\r\n/g, "\n")
                .replace(/\s+/g, " ")
                .trim();
            const passed = normalizedActual === normalizedExpected && !errorMsg;

            testResults.push({
                testCaseIndex: i,
                passed,
                input: testCase.input,
                expectedOutput: testCase.output,
                actualOutput: actualOutput || (errorMsg ? `Error: ${errorMsg}` : "(no output)"),
                error: errorMsg || undefined,
                executionTime: Math.round(execution.executionTime),
                memoryUsed: Math.round(execution.memoryUsed),
            });

            totalExecutionTime += execution.executionTime;
            totalMemoryUsed += execution.memoryUsed;

            if (!passed) {
                allPassed = false;
            }
        } catch (error) {
            console.error(`Test case ${i} execution error:`, error);
            testResults.push({
                testCaseIndex: i,
                passed: false,
                input: testCase.input,
                expectedOutput: testCase.output,
                actualOutput: "Execution failed",
                error: error instanceof Error ? error.message : "Unknown error",
            });
            allPassed = false;
        }
    }

    return {
        success: true,
        allPassed,
        totalTests: testCases.length,
        passedTests: testResults.filter((r) => r.passed).length,
        results: testResults,
        executionTime: Math.round(totalExecutionTime),
        memoryUsed: Math.round(totalMemoryUsed),
    };
}
