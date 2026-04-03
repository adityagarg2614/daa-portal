# 🎯 Complete Code Execution Workflow

## Overview

This document explains the **end-to-end workflow** of how a student submits code, it gets compiled, test cases run, and results are displayed with excellent UI/UX.

---

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         STUDENT BROWSER                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Assignment Page (/assignment/[id])                      │   │
│  │  - Code Editor (Monaco/CodeMirror)                       │   │
│  │  - Language Selector                                      │   │
│  │  - Save Button                                            │   │
│  │  - Test Results Display                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP POST
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS BACKEND                             │
│  ┌────────────────┐    ┌──────────────────┐    ┌────────────┐  │
│  │ /api/student/  │ →  │  /api/compile/   │ →  │  Piston    │  │
│  │ submissions    │    │   route.ts       │    │  (Docker)  │  │
│  └────────────────┘    └──────────────────┘    └────────────┘  │
│         ↓                       ↓                                   
│  ┌────────────────┐    ┌──────────────────┐                      │
│  │   MongoDB      │ ←  │  Test Results    │                      │
│  │  (Submission)  │    │  Processing      │                      │
│  └────────────────┘    └──────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓ JSON Response
┌─────────────────────────────────────────────────────────────────┐
│                         UI RESPONSE                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Test Results Display                                     │   │
│  │  - ✅/❌ per test case                                    │   │
│  │  - Input/Expected/Actual output                          │   │
│  │  - Execution time & memory                               │   │
│  │  - Collapsible details                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Detailed Workflow Steps

### **Step 1: Student Writes Code (Frontend)**

**File:** `src/app/(dashboard)/assignment/[id]/page.tsx`

```typescript
// Student types code in the editor
const [submissionState, setSubmissionState] = useState({
    [problemId]: {
        code: "#include <iostream>...",
        language: "cpp",
        loading: false,
        message: "",
        testResults: [],
        executionTime: 0,
        memoryUsed: 0
    }
})

// Student clicks "Save" button
<Button onClick={() => handleSubmitSolution(problemId)}>
    Save
</Button>
```

**UI Components:**
- **Code Editor** - Monaco/CodeMirror with syntax highlighting
- **Language Selector** - Dropdown (C++, Java, Python, JavaScript)
- **Save Button** - Triggers submission
- **Reset Button** - Resets to starter code

---

### **Step 2: Frontend Sends to Backend**

**File:** `src/app/(dashboard)/assignment/[id]/page.tsx`

```typescript
const handleSubmitSolution = async (problemId: string) => {
    const current = submissionState[problemId]
    
    // 1. Show loading state
    setSubmissionState(prev => ({
        ...prev,
        [problemId]: { ...prev[problemId], loading: true, message: "" }
    }))
    
    try {
        // 2. Send to backend
        const response = await axios.post("/api/student/submissions", {
            assignmentId: assignment._id,
            problemId: problemId,
            userId: dbUserId,
            code: current.code,
            language: current.language,
        })
        
        // 3. Handle success
        setSubmissionState(prev => ({
            ...prev,
            [problemId]: {
                ...prev[problemId],
                loading: false,
                message: "Submission saved successfully",
                testResults: response.data.testResults,
                executionTime: response.data.executionTime,
                memoryUsed: response.data.memoryUsed,
            }
        }))
        
        toast.success("All test cases passed!")
        
    } catch (error) {
        // 4. Handle failure (compilation error, test failures)
        setSubmissionState(prev => ({
            ...prev,
            [problemId]: {
                ...prev[problemId],
                loading: false,
                message: error.response.data.message,
                testResults: error.response.data.testResults,
            }
        }))
        
        toast.error(`Only ${passedTests}/${totalTests} tests passed`)
    }
}
```

**UX Features:**
- ✅ Loading state with spinner
- ✅ Success/error toast notifications
- ✅ Real-time state updates
- ✅ Detailed error messages

---

### **Step 3: Backend Receives Submission**

**File:** `src/app/api/student/submissions/route.ts`

```typescript
export async function POST(req: Request) {
    await connectDB()
    const body = await req.json()
    
    const { assignmentId, problemId, userId, code, language } = body
    
    // 1. Fetch problem to get test cases
    const problem = await Problem.findById(problemId)
    
    // 2. Get test cases from problem
    const testCases = problem.testCases.map(tc => ({
        input: tc.input,
        output: tc.output
    }))
    
    // 3. Call compilation API
    const compileResponse = await fetch(`${APP_URL}/api/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, testCases })
    })
    
    const compileResult = await compileResponse.json()
    
    // 4. Check if all tests passed
    if (!compileResult.allPassed) {
        return NextResponse.json({
            success: false,
            message: `Not all test cases passed. ${compileResult.passedTests}/${compileResult.totalTests} tests succeeded.`,
            testResults: compileResult.results,
            passedTests: compileResult.passedTests,
            totalTests: compileResult.totalTests,
        }, { status: 400 })
    }
    
    // 5. All tests passed - save to database
    await Submission.deleteOne({ userId, problemId }) // Allow re-submission
    
    const submission = await Submission.create({
        assignmentId,
        problemId,
        userId,
        code,
        language,
        status: "Evaluated",
        score: problem.marks, // Full marks if all tests pass
        testResults: compileResult.results,
        executionTime: compileResult.executionTime,
        memoryUsed: compileResult.memoryUsed,
    })
    
    return NextResponse.json({
        success: true,
        message: "Submission saved successfully",
        submission,
        testResults: compileResult.results,
        allTestsPassed: true,
    })
}
```

**Backend Logic:**
- ✅ Fetches problem's test cases
- ✅ Calls compilation API
- ✅ Validates all tests pass before saving
- ✅ Allows re-submission (deletes old submission)
- ✅ Awards marks only if all tests pass

---

### **Step 4: Compilation API Executes Code**

**File:** `src/app/api/compile/route.ts`

```typescript
export async function POST(req: Request) {
    const { code, language, testCases } = await req.json()
    
    // 1. Import Piston library
    const { runTestCases } = await import("@/lib/piston")
    
    // 2. Run all test cases through Piston
    const result = await runTestCases(code, language, testCases)
    
    // 3. Return detailed results
    return NextResponse.json({
        success: true,
        allPassed: result.allPassed,
        totalTests: result.totalTests,
        passedTests: result.passedTests,
        results: result.results,
        executionTime: result.executionTime,
        memoryUsed: result.memoryUsed,
    })
}
```

**Responsibilities:**
- ✅ Receives code + test cases
- ✅ Delegates to Piston library
- ✅ Returns structured results

---

### **Step 5: Piston Library Runs Code**

**File:** `src/lib/piston.ts`

```typescript
export async function runTestCases(
    code: string,
    language: string,
    testCases: TestCase[]
): Promise<CompileAndTestResult> {
    
    // 1. Check compilation with first test case
    const firstResult = await executeCode(code, language, testCases[0].input)
    if (firstResult.stderr && !firstResult.stdout) {
        return {
            success: false,
            compilationError: firstResult.stderr,
            // ... return early
        }
    }
    
    // 2. Run each test case
    const testResults: TestResult[] = []
    for (let i = 0; i < testCases.length; i++) {
        const execution = await executeCode(code, language, testCases[i].input)
        
        // 3. Compare output
        const passed = normalize(execution.stdout) === normalize(testCases[i].output)
        
        testResults.push({
            testCaseIndex: i,
            passed,
            input: testCases[i].input,
            expectedOutput: testCases[i].output,
            actualOutput: execution.stdout,
            error: execution.stderr,
            executionTime: execution.executionTime,
            memoryUsed: execution.memoryUsed,
        })
    }
    
    // 4. Return aggregated results
    return {
        success: true,
        allPassed: testResults.every(r => r.passed),
        totalTests: testCases.length,
        passedTests: testResults.filter(r => r.passed).length,
        results: testResults,
        executionTime: sum(testResults.executionTime),
        memoryUsed: sum(testResults.memoryUsed),
    }
}

async function executeCode(code, language, stdin) {
    // Call self-hosted Piston
    const response = await fetch("http://localhost:2000/api/v2/execute", {
        method: "POST",
        body: JSON.stringify({
            language: "cpp",
            version: "10.2.0",
            files: [{ content: code }],
            stdin: stdin,
            run_timeout: 3000,
            run_memory_limit: 128000000,
        })
    })
    
    const result = await response.json()
    
    return {
        stdout: result.run.stdout,
        stderr: result.run.stderr,
        executionTime: result.run.time * 1000,
        memoryUsed: result.run.memory / 1024,
    }
}
```

**Piston Execution:**
- ✅ Calls Docker container
- ✅ Passes code + stdin
- ✅ Gets stdout/stderr + metrics
- ✅ Normalizes output for comparison

---

### **Step 6: Self-Hosted Piston Executes**

**Docker Container:** `http://localhost:2000/api/v2/execute`

```bash
# Docker container running Piston
docker run -d --name piston --privileged -p 2000:2000 ghcr.io/engineer-man/piston:latest

# Receives request
{
    "language": "cpp",
    "version": "10.2.0",
    "files": [{ "content": "#include <iostream>..." }],
    "stdin": "test input",
    "run_timeout": 3000,
    "run_memory_limit": 128000000
}

# Executes in sandbox
1. Creates temporary file
2. Compiles (g++ for C++)
3. Runs with stdin
4. Captures stdout, stderr, exit code
5. Measures time & memory

# Returns response
{
    "compile": {
        "stdout": "",
        "stderr": "",
        "code": 0
    },
    "run": {
        "stdout": "Hello World\n",
        "stderr": "",
        "code": 0,
        "time": "0.003",
        "memory": 8574
    }
}
```

**Piston Features:**
- ✅ Sandboxed execution
- ✅ Timeout protection (3s max)
- ✅ Memory limits (128MB max)
- ✅ Multiple language support
- ✅ Compilation + runtime error detection

---

### **Step 7: Results Flow Back to UI**

**Response Chain:**
```
Piston (Docker)
   ↓ JSON
src/lib/piston.ts
   ↓ CompileAndTestResult
src/app/api/compile/route.ts
   ↓ JSON
src/app/api/student/submissions/route.ts
   ↓ JSON with testResults
Frontend (handleSubmitSolution)
   ↓ State update
TestResultsDisplay Component
```

---

### **Step 8: Beautiful UI/UX Display**

**File:** `src/components/ui/test-results-display.tsx`

```typescript
export function TestResultsDisplay({ results, totalExecutionTime, totalMemoryUsed }) {
    const passedCount = results.filter(r => r.passed).length
    const allPassed = passedCount === results.length
    
    return (
        <div className="rounded-xl border bg-muted/30 p-4">
            {/* Header with Pass/Fail Badge */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Test Results</h3>
                <Badge variant={allPassed ? "success" : "destructive"}>
                    {allPassed ? <CheckCircle2 /> : <XCircle />}
                    {passedCount}/{results.length} Passed
                </Badge>
            </div>
            
            {/* Execution Stats */}
            <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2 rounded-lg bg-background p-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Time:</span>
                    <span className="font-medium">{totalExecutionTime} ms</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-background p-2">
                    <MemoryStick className="h-4 w-4 text-muted-foreground" />
                    <span>Memory:</span>
                    <span className="font-medium">{totalMemoryUsed} KB</span>
                </div>
            </div>
            
            {/* Test Cases List - Collapsible */}
            {results.map((result, index) => (
                <Collapsible defaultOpen={!result.passed}>
                    <CollapsibleTrigger className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {result.passed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span>Test Case {index + 1}</span>
                            <span className="text-xs text-muted-foreground">
                                ({result.executionTime} ms)
                            </span>
                        </div>
                        <ChevronRight />
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                        {/* Input */}
                        <pre>{result.input}</pre>
                        
                        {/* Expected Output */}
                        <div className="text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Expected: {result.expectedOutput}
                        </div>
                        
                        {/* Actual Output */}
                        <div className={result.passed ? "text-green-600" : "text-red-600"}>
                            Your Output: {result.actualOutput}
                        </div>
                        
                        {/* Error if any */}
                        {result.error && (
                            <pre className="text-red-700 bg-red-50">
                                {result.error}
                            </pre>
                        )}
                    </CollapsibleContent>
                </Collapsible>
            ))}
        </div>
    )
}
```

**UI/UX Features:**
- ✅ **Visual Feedback** - Green ✓ / Red ✗ icons
- ✅ **Summary Badge** - Shows pass count at a glance
- ✅ **Execution Metrics** - Time & memory displayed
- ✅ **Collapsible Details** - Clean UI, expand only what you need
- ✅ **Color Coding** - Green for success, red for errors
- ✅ **Comparison View** - Expected vs Actual side-by-side
- ✅ **Error Highlighting** - Red background for errors
- ✅ **Icons** - Visual indicators (Clock, Memory, Check, X)

---

## 🎨 UI/UX Excellence Breakdown

### **1. Loading States**
```typescript
{loading ? (
    <><Loader2 className="icon-spin" /> Saving...</>
) : (
    <><Save /> Save</>
)}
```
- Spinner animation
- Disabled button while loading
- Clear status text

### **2. Toast Notifications**
```typescript
toast.success("All test cases passed!", {
    description: `Your solution passed ${passedTests}/${totalTests} test cases.`
})

toast.error(`Only ${passedTests}/${totalTests} test cases passed`, {
    description: "Fix the failing test cases and try again."
})
```
- Success (green) / Error (red) colors
- Descriptive messages
- Auto-dismiss after 5 seconds

### **3. Status Messages**
```typescript
<Alert variant={isSuccess ? "success" : "default"}>
    {message}
</Alert>
```
- Color-coded alerts
- Clear, actionable messages

### **4. Progress Indicator**
```typescript
<Progress value={(submittedCount / totalProblems) * 100} />
```
- Visual progress bar
- Shows completion percentage

### **5. Submission Badge**
```typescript
{isSubmitted && (
    <Badge variant="success">
        <CheckCircle2 /> Saved
    </Badge>
)}
```
- Floating badge on card
- Instant visual confirmation

---

## 📊 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. STUDENT ACTION                                            │
│    Click "Save" button                                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. FRONTEND STATE UPDATE                                     │
│    loading: true, message: ""                                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. API CALL                                                  │
│    POST /api/student/submissions                             │
│    Body: { assignmentId, problemId, userId, code, language } │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. BACKEND PROCESSING                                        │
│    - Fetch problem test cases                                │
│    - Call /api/compile                                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. COMPILATION API                                           │
│    - Import piston.ts                                        │
│    - Call runTestCases()                                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. PISTON EXECUTION                                          │
│    - For each test case:                                     │
│      • POST to http://localhost:2000/api/v2/execute          │
│      • Get stdout, stderr, time, memory                      │
│      • Compare output                                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. RESULTS AGGREGATION                                       │
│    - Compile testResults array                               │
│    - Calculate pass/fail counts                              │
│    - Sum execution time & memory                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. RESPONSE CHAIN                                            │
│    Piston → compile.ts → submissions.ts → Frontend           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. FRONTEND RESPONSE HANDLING                                │
│    if (allPassed) {                                          │
│      - Save to state                                         │
│      - Show success toast                                    │
│      - Display test results                                  │
│    } else {                                                  │
│      - Show error toast                                      │
│      - Display failing test details                          │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. UI DISPLAY                                               │
│     - TestResultsDisplay component                           │
│     - Collapsible test cases                                 │
│     - Color-coded results                                    │
│     - Execution metrics                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Success Factors

### **1. Separation of Concerns**
- Frontend: UI/UX, state management
- API Routes: Business logic, validation
- Piston Library: Code execution
- Docker: Sandboxed execution

### **2. Error Handling at Every Level**
- Compilation errors → Show to student
- Runtime errors → Show to student
- Test failures → Show which tests failed
- API errors → User-friendly messages

### **3. Real-time Feedback**
- Loading states
- Toast notifications
- Status messages
- Progress indicators

### **4. Rich Visual Design**
- Icons for visual cues
- Color coding (green/red)
- Collapsible sections
- Cards and badges
- Smooth animations

### **5. Performance Optimization**
- Local Piston (no network latency)
- Fast compilation (<3s timeout)
- Efficient state updates
- Optimistic UI updates

---

## 📈 Metrics & Monitoring

**What We Track:**
- ✅ Execution time per test case
- ✅ Memory usage per test case
- ✅ Total execution time
- ✅ Pass/fail counts
- ✅ Compilation errors
- ✅ Runtime errors

**Displayed to Student:**
- ✅ Individual test case results
- ✅ Expected vs actual output
- ✅ Error messages
- ✅ Execution metrics

---

## 🎉 Summary

This workflow provides:
- ✅ **Instant feedback** - Results in <3 seconds
- ✅ **Detailed diagnostics** - See exactly what failed
- ✅ **Beautiful UI** - Professional, modern design
- ✅ **Great UX** - Loading states, toasts, clear messages
- ✅ **Reliable execution** - Sandboxed, timeout-protected
- ✅ **Fair grading** - All tests must pass for marks

**The result: A world-class code submission and auto-grading system!** 🚀
