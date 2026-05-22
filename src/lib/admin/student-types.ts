export type StudentSubmission = {
    _id: string;
    assignmentTitle: string;
    problemTitle: string;
    problemMarks: number;
    score?: number;
    status: string;
    language: string;
    submittedAt?: string | null;
};

export type StudentDetail = {
    student: {
        _id: string;
        name: string | null;
        email: string | null;
        rollNo: string | null;
        batch?: "A" | "B" | null;
        clerkId: string;
        createdAt: string;
    };
    submissions: StudentSubmission[];
    stats: {
        totalSubmissions: number;
        totalScore: number;
        averageScore: number;
        completedAssignments: number;
        totalAssignments: number;
        rank: number;
        lastActive: string | null;
        status: string;
    };
};
