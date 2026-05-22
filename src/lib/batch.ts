export const STUDENT_BATCHES = ["A", "B"] as const;

export type StudentBatch = (typeof STUDENT_BATCHES)[number];

export function normalizeBatch(value: unknown): StudentBatch | null {
    const normalized = String(value ?? "")
        .trim()
        .toUpperCase();

    return STUDENT_BATCHES.includes(normalized as StudentBatch)
        ? (normalized as StudentBatch)
        : null;
}

export function getAssignmentBatchFilter(batch: unknown) {
    const normalizedBatch = normalizeBatch(batch);

    if (!normalizedBatch) {
        return {
            $or: [
                { batch: { $exists: false } },
                { batch: null },
            ],
        };
    }

    return {
        $or: [
            { batch: normalizedBatch },
            { batch: { $exists: false } },
            { batch: null },
        ],
    };
}

export function isAssignmentAccessibleToStudent(
    assignmentBatch: unknown,
    studentBatch: unknown
) {
    const normalizedAssignmentBatch = normalizeBatch(assignmentBatch);

    if (!normalizedAssignmentBatch) {
        return true;
    }

    return normalizedAssignmentBatch === normalizeBatch(studentBatch);
}
