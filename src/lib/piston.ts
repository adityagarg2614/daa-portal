// Piston code execution library
// Using self-hosted Piston instance (Docker)

const PISTON_API = process.env.PISTON_API_URL;

// Language mapping to Piston language names and versions
const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
    cpp: { language: "c++", version: "10.2.0" },
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
 * Execute code with self-hosted Piston API
 */
async function executeWithPiston(
    code: string,
    langConfig: { language: string; version: string },
    stdin: string = ""
): Promise<{ success: boolean; result?: ExecutionResult; error?: string }> {

    try {
        const requestBody = {
            language: langConfig.language,
            version: langConfig.version,
            files: [{ content: code }],
            stdin,
            run_timeout: 3000, // Max allowed by self-hosted Piston (3 seconds)
            run_memory_limit: 128000000, // 128 MB
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
            console.error(`Piston API error (${response.status}):`, text);
            throw new Error(`Piston API error: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Piston returned non-JSON response");
        }

        const result = await response.json();

        const compileStderr = (result.compile?.stderr || "").trim();
        const compileStdout = (result.compile?.stdout || "").trim();
        const runStdout = (result.run?.stdout || "").trim();
        const runStderr = (result.run?.stderr || "").trim();
        const runExitCode = result.run?.code ?? null;

        // Check for compilation errors
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
        return {
            success: false,
            error: error instanceof Error ? error.message : "Piston execution failed",
        };
    }
}

/**
 * Execute code with self-hosted Piston
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

    const pistonResult = await executeWithPiston(code, langConfig, stdin);

    // If Piston returned a result (even if code failed), use it
    if (pistonResult.result) {
        return pistonResult.result;
    }

    // Piston itself failed
    throw new Error(pistonResult.error || "Piston execution failed");
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
