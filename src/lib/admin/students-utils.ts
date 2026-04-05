/**
 * Convert student data to CSV format
 */
export function exportStudentsToCSV(students: any[], filename: string = "students.csv"): void {
    const headers = [
        "Name",
        "Email",
        "Roll Number",
        "Total Submissions",
        "Total Score",
        "Average Score (%)",
        "Last Active",
        "Status",
    ];

    const rows = students.map((student) => [
        student.name || "N/A",
        student.email || "N/A",
        student.rollNo || "N/A",
        student.totalSubmissions,
        student.totalScore,
        student.averageScore,
        student.lastActive ? new Date(student.lastActive).toLocaleDateString() : "Never",
        student.status,
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
            row
                .map((cell) => {
                    // Escape quotes and wrap in quotes if contains comma
                    const cellStr = String(cell);
                    if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
                        return `"${cellStr.replace(/"/g, '""')}"`;
                    }
                    return cellStr;
                })
                .join(",")
        ),
    ].join("\n");

    // Create and download file

    //Blob is a browser api that is used to create a file like object
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    // programatically create a download link and click it 
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export single student's detailed submissions to CSV
 */
export function exportStudentSubmissionsToCSV(
    student: any,
    submissions: any[],
    filename: string = "student_submissions.csv"
): void {
    const headers = [
        "Assignment",
        "Problem",
        "Score",
        "Status",
        "Language",
        "Submitted At",
        "Execution Time (ms)",
        "Memory Used (MB)",
    ];

    const rows = submissions.map((sub) => [
        sub.assignmentTitle || "N/A",
        sub.problemTitle || "N/A",
        sub.score ?? "N/A",
        sub.status,
        sub.language,
        sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "N/A",
        sub.executionTime ?? "N/A",
        sub.memoryUsed ?? "N/A",
    ]);

    // Add student info at the top
    const studentInfo = [
        `Student: ${student.name || "N/A"}`,
        `Email: ${student.email || "N/A"}`,
        `Roll No: ${student.rollNo || "N/A"}`,
        "",
    ];

    const csvContent = [
        ...studentInfo,
        headers.join(","),
        ...rows.map((row) =>
            row
                .map((cell) => {
                    const cellStr = String(cell);
                    if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
                        return `"${cellStr.replace(/"/g, '""')}"`;
                    }
                    return cellStr;
                })
                .join(",")
        ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Get performance badge color based on score percentage
 */
export function getPerformanceBadgeColor(percentage: number): {
    bg: string;
    text: string;
    label: string;
} {
    if (percentage >= 80) {
        return {
            bg: "bg-green-100 dark:bg-green-900/30",
            text: "text-green-700 dark:text-green-400",
            label: "Excellent",
        };
    } else if (percentage >= 50) {
        return {
            bg: "bg-yellow-100 dark:bg-yellow-900/30",
            text: "text-yellow-700 dark:text-yellow-400",
            label: "Good",
        };
    } else {
        return {
            bg: "bg-red-100 dark:bg-red-900/30",
            text: "text-red-700 dark:text-red-400",
            label: "Needs Improvement",
        };
    }
}

/**
 * Get initials from name for avatar
 */
export function getInitials(name: string | null | undefined): string {
    if (!name) return "ST";

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string | null): string {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}
