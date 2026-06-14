export const PROGRAMMING_LANGUAGES = [
    "cpp",
    "java",
    "python",
    "javascript",
] as const;

export type ProgrammingLanguage = (typeof PROGRAMMING_LANGUAGES)[number];

export const PROGRAMMING_LANGUAGE_LABELS: Record<ProgrammingLanguage, string> = {
    cpp: "C++",
    java: "Java",
    python: "Python",
    javascript: "JavaScript",
};

export function isProgrammingLanguage(value: unknown): value is ProgrammingLanguage {
    return (
        typeof value === "string" &&
        PROGRAMMING_LANGUAGES.includes(value as ProgrammingLanguage)
    );
}

export function normalizeProgrammingLanguage(
    value: unknown
): ProgrammingLanguage | null {
    if (typeof value !== "string") {
        return null;
    }

    const normalizedValue = value.trim().toLowerCase();
    return isProgrammingLanguage(normalizedValue) ? normalizedValue : null;
}

export function getProgrammingLanguageLabel(
    language: ProgrammingLanguage | null | undefined
) {
    return language ? PROGRAMMING_LANGUAGE_LABELS[language] : "Any language";
}
