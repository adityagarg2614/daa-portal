# Piston Code Execution Library - Documentation

## Overview

This file (`piston.ts`) is a **code execution engine** that integrates with a self-hosted [Piston](https://github.com/engineer-man/piston) instance. Piston is a high-performance code execution sandbox that allows you to run arbitrary code in multiple programming languages safely. This library provides the interface to execute code, run test cases, and get detailed results.

---

## Architecture & Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    User/Client Code                         │
│  (Submits code + language + test cases)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              piston.ts (This Library)                       │
│                                                             │
│  1. getLanguageConfig() - Maps language names              │
│  2. executeCode() - Single execution wrapper                │
│  3. runTestCases() - Multi-test orchestration              │
│  4. executeWithPiston() - Actual API call to Piston        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Self-Hosted Piston API                         │
│  http://localhost:2000/api/v2                               │
│  (Docker container running code in isolated sandboxes)      │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Breakdown

### 1. Configuration Constants

```typescript
const PISTON_API = "http://localhost:2000/api/v2";
```

- **Purpose**: Base URL for the self-hosted Piston API
- **Why localhost:2000?**: Piston runs in a Docker container on your local machine, exposed on port 2000

---

```typescript
const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
    cpp: { language: "c++", version: "10.2.0" },
    java: { language: "java", version: "15.0.2" },
    python: { language: "python", version: "3.10.0" },
    javascript: { language: "javascript", version: "18.15.0" },
};
```

- **Purpose**: Maps user-friendly language names to Piston's internal language identifiers and versions
- **Why needed?**: Users say "python" but Piston expects "python" with version "3.10.0"
- **Supported languages**: C++, Java, Python, JavaScript

---

### 2. TypeScript Interfaces (Data Structures)

These interfaces define the shape of data flowing through the system:

#### `TestCase`
```typescript
export interface TestCase {
    input: string;    // Input to feed to the program (stdin)
    output: string;   // Expected output from the program
}
```
- Represents a single test case with input and expected output

---

#### `TestResult`
```typescript
export interface TestResult {
    testCaseIndex: number;      // Which test case this is (0, 1, 2, ...)
    passed: boolean;            // Did it pass?
    input: string;              // The input given
    expectedOutput: string;     // What we expected
    actualOutput: string;       // What we actually got
    error?: string;             // Runtime error message (if any)
    executionTime?: number;     // How long it took (ms)
    memoryUsed?: number;        // Memory consumed (KB)
}
```
- Detailed result for a **single test case execution**

---

#### `ExecutionResult`
```typescript
export interface ExecutionResult {
    success: boolean;           // Did the code run without runtime errors?
    stdout: string;             // Standard output
    stderr: string;             // Standard error
    compileOutput: string;      // Compilation output (for compiled languages)
    exitCode: number | null;    // Process exit code (0 = success)
    executionTime: number;      // Execution time in milliseconds
    memoryUsed: number;         // Memory used in KB
}
```
- Result from a **single code execution** (one run)

---

#### `CompileAndTestResult`
```typescript
export interface CompileAndTestResult {
    success: boolean;           // Did the overall test run succeed?
    allPassed: boolean;         // Did ALL test cases pass?
    totalTests: number;         // Total number of test cases
    passedTests: number;        // How many passed?
    results: TestResult[];      // Individual results for each test
    executionTime: number;      // Total execution time
    memoryUsed: number;         // Total memory used
    compilationError?: string;  // Compilation error (if compilation failed)
    message?: string;           // Human-readable message
}
```
- Result from **running all test cases** (the full test suite)

---

### 3. Functions

#### `getLanguageConfig(language: string)`

```typescript
export function getLanguageConfig(language: string) {
    return LANGUAGE_MAP[language.toLowerCase()];
}
```

**Purpose**: Converts a user-friendly language name (e.g., "python") to Piston's format.

**Input**: `"python"`, `"Python"`, `"PYTHON"` (case-insensitive)

**Output**: `{ language: "python", version: "3.10.0" }` or `undefined` if unsupported

**Workflow**:
```
User input: "Python"
     ↓
toLowerCase(): "python"
     ↓
LANGUAGE_MAP lookup
     ↓
Returns: { language: "python", version: "3.10.0" }
```

---

#### `executeWithPiston(code, langConfig, stdin)` *(Private Function)*

```typescript
async function executeWithPiston(
    code: string,
    langConfig: { language: string; version: string },
    stdin: string = ""
)
```

**Purpose**: The **core function** that makes the actual API call to Piston. This is the lowest-level function in this file.

**Workflow**:

```
┌──────────────────────────────────────────────────────────────┐
│  Step 1: Build Request Body                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ {                                                      │  │
│  │   language: "python",                                  │  │
│  │   version: "3.10.0",                                   │  │
│  │   files: [{ content: "print('hello')" }],              │  │
│  │   stdin: "",                                           │  │
│  │   run_timeout: 3000,        // 3 second limit          │  │
│  │   run_memory_limit: 128000000  // 128 MB               │  │
│  │ }                                                      │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│  Step 2: POST to Piston API                                  │
│  fetch("http://localhost:2000/api/v2/execute", {...})        │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│  Step 3: Validate Response                                   │
│  - Check HTTP status code                                    │
│  - Verify content-type is application/json                   │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│  Step 4: Parse Response & Extract Outputs                    │
│  - compile.stderr, compile.stdout                            │
│  - run.stdout, run.stderr, run.code (exit code)              │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│  Step 5: Detect Compilation Errors                           │
│  If compile.stderr exists AND no run output AND exit ≠ 0     │
│  → Return success: false with compilation error              │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│  Step 6: Return Execution Result                             │
│  Convert Piston's response to our ExecutionResult format     │
│  - Convert time from seconds → milliseconds                  │
│  - Convert memory from bytes → KB                            │
└──────────────────────────────────────────────────────────────┘
```

**Key Points**:
- **Timeout**: 3 seconds max execution time (Piston limit)
- **Memory Limit**: 128 MB per execution
- **Error Handling**: Catches network errors, invalid responses, and execution failures
- **Returns**: `{ success: boolean, result?: ExecutionResult, error?: string }`

---

#### `executeCode(code, language, stdin)`

```typescript
export async function executeCode(
    code: string,
    language: string,
    stdin: string = ""
): Promise<ExecutionResult>
```

**Purpose**: Public wrapper to execute a single piece of code. Handles language validation and delegates to `executeWithPiston`.

**Workflow**:

```
User calls: executeCode("print('hi')", "python", "")
                    ↓
         getLanguageConfig("python")
                    ↓
         Returns: { language: "python", version: "3.10.0" }
                    ↓
         If langConfig is undefined → throw Error("Unsupported language")
                    ↓
         executeWithPiston(code, langConfig, stdin)
                    ↓
         If pistonResult.result exists → return it
         Else → throw Error(pistonResult.error)
```

**When to use**: When you want to run code **once** and get the output (e.g., "Run Code" button in UI).

---

#### `runTestCases(code, language, testCases)`

```typescript
export async function runTestCases(
    code: string,
    language: string,
    testCases: TestCase[]
): Promise<CompileAndTestResult>
```

**Purpose**: The **main orchestration function**. Compiles code once, then runs it against multiple test cases, collecting detailed results.

**Workflow**:

```
┌──────────────────────────────────────────────────────────────┐
│  INPUT:                                                      │
│  - code: User's solution code                                │
│  - language: "python"                                        │
│  - testCases: [                                              │
│      { input: "5\n3", output: "8" },                         │
│      { input: "10\n20", output: "30" },                      │
│      { input: "0\n0", output: "0" }                          │
│    ]                                                         │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│  Step 1: Validate Language                                   │
│  getLanguageConfig(language)                                 │
│  If unsupported → return early with error message            │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│  Step 2: Quick Compile Check                                 │
│  Execute code with first test case input                     │
│  If compilation fails → return early with compilationError   │
│  (No point running all tests if code doesn't compile)        │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│  Step 3: Run Each Test Case (Loop)                           │
│                                                              │
│  for each testCase in testCases:                             │
│    ┌──────────────────────────────────────────────────────┐  │
│    │ executeCode(code, language, testCase.input)          │  │
│    │         ↓                                            │  │
│    │ Get actual output                                   │  │
│    │         ↓                                            │  │
│    │ Normalize whitespace (remove extra spaces/newlines) │  │
│    │         ↓                                            │  │
│    │ Compare: normalizedActual === normalizedExpected    │  │
│    │         ↓                                            │  │
│    │ Build TestResult { passed, input, expected, ... }   │  │
│    │         ↓                                            │  │
│    │ Accumulate: totalExecutionTime, totalMemoryUsed     │  │
│    │         ↓                                            │  │
│    │ If !passed → allPassed = false                      │  │
│    └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│  Step 4: Build Final Result                                  │
│  {                                                           │
│    success: true,                                            │
│    allPassed: true/false,                                    │
│    totalTests: 3,                                            │
│    passedTests: 2,                                           │
│    results: [TestResult, TestResult, TestResult],            │
│    executionTime: 150,  // ms                                │
│    memoryUsed: 2048     // KB                                │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
```

**Key Features**:
- **Early exit on compilation failure**: Don't waste time running tests if code doesn't compile
- **Whitespace normalization**: `"  hello   world  "` becomes `"hello world"` for fair comparison
- **Accumulated metrics**: Total execution time and memory across all test cases
- **Graceful error handling**: If one test case crashes, it logs the error and continues

---

## Data Flow Summary

```
┌─────────────┐
│  User Code  │ (code string, language, test cases)
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  runTestCases()  │  ← Main entry point for testing
└──────┬───────────┘
       │
       ├──► getLanguageConfig() → { language, version }
       │
       ├──► executeCode() (compile check)
       │         │
       │         └──► executeWithPiston() → HTTP POST → Piston API
       │
       ├──► Loop through test cases:
       │         │
       │         └──► executeCode() for each test case
       │                    │
       │                    └──► executeWithPiston() → HTTP POST → Piston API
       │
       ▼
┌────────────────────────┐
│  CompileAndTestResult  │  ← Final result with pass/fail for each test
└────────────────────────┘
```

---

## How It Relates to the Rest of the Project

This library is likely used by:

1. **Problem/Challenge Pages**: Where users submit solutions to coding problems
2. **Test Case Evaluation**: The platform probably has coding challenges with predefined test cases
3. **UI Components**: Buttons like "Run Code" or "Submit Solution" call `executeCode()` or `runTestCases()`
4. **Result Display**: The `TestResult[]` array is used to show a table of pass/fail for each test case

**Typical usage pattern**:
```typescript
// Somewhere in your React components or API routes:
import { runTestCases } from "@/lib/piston";

const userCode = `print(int(input()) + int(input()))`;
const testCases = [
  { input: "5\n3", output: "8" },
  { input: "10\n20", output: "30" },
];

const result = await runTestCases(userCode, "python", testCases);
console.log(result.allPassed); // true or false
console.log(result.passedTests); // 2
```

---

## Error Handling Strategy

The library uses a **layered error handling** approach:

| Layer | Function | Error Handling |
|-------|----------|----------------|
| 1 | `executeWithPiston` | Catches network errors, invalid responses, returns `{ success: false, error: "..." }` |
| 2 | `executeCode` | Throws if language unsupported or Piston call fails |
| 3 | `runTestCases` | Returns structured error info instead of throwing (better for UI) |

**Why different approaches?**
- `executeCode` throws because it's for single execution (caller should handle)
- `runTestCases` returns error info because it's for batch testing (UI needs details)

---

## Key Design Decisions

1. **Self-Hosted Piston**: Uses `localhost:2000` instead of a public API → better performance, no rate limits, full control
2. **Timeout & Memory Limits**: Prevents infinite loops and memory abuse
3. **Whitespace Normalization**: Makes test case comparison more forgiving (trailing spaces won't fail a test)
4. **Early Compilation Check**: Saves time by failing fast before running all test cases
5. **TypeScript Interfaces**: Strong typing ensures data consistency across the application

---

## Common Execution Paths

### Path 1: Successful Code Execution
```
runTestCases()
  → getLanguageConfig("python") ✓
  → executeCode() (compile check) ✓
  → executeWithPiston() → Piston returns success ✓
  → Loop: executeCode() for each test case ✓
  → Return CompileAndTestResult { allPassed: true, passedTests: 3 }
```

### Path 2: Compilation Failure
```
runTestCases()
  → getLanguageConfig("cpp") ✓
  → executeCode() (compile check) ✗
  → Piston returns compile errors
  → Return CompileAndTestResult { 
      success: false, 
      compilationError: "error: expected ';' before 'return'",
      message: "Compilation failed. Fix the errors and try again."
    }
```

### Path 3: Partial Test Case Pass
```
runTestCases()
  → getLanguageConfig("python") ✓
  → executeCode() (compile check) ✓
  → Test 1: passed ✓
  → Test 2: passed ✓
  → Test 3: failed ✗ (output mismatch)
  → Return CompileAndTestResult { 
      allPassed: false, 
      passedTests: 2, 
      totalTests: 3 
    }
```

### Path 4: Runtime Error in One Test Case
```
runTestCases()
  → Test 1: passed ✓
  → Test 2: throws (division by zero)
  → Catches error, logs it, continues
  → Test 3: passed ✓
  → Return results with Test 2 marked as failed
```

---

## Summary

This file is the **bridge** between your DAA (Design & Analysis of Algorithms) portal and the Piston code execution engine. It:

- ✅ Translates user-friendly language names to Piston's format
- ✅ Executes code safely in an isolated sandbox
- ✅ Runs multiple test cases and compares outputs
- ✅ Provides detailed feedback (pass/fail, execution time, memory)
- ✅ Handles errors gracefully at every layer

The main entry points for external code are:
- **`executeCode()`** - Run code once (for "Run" button)
- **`runTestCases()`** - Run against all test cases (for "Submit" button)
