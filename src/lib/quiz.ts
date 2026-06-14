import { IQuizQuestion, QuizQuestionType } from "@/models/Quiz";

type QuizAnswerInput = {
    questionId: string;
    answer: string;
};

export type QuizStatus = "Upcoming" | "Active" | "Completed" | "Expired";

export function computeQuizStatus({
    publishAt,
    dueAt,
    submittedAt,
}: {
    publishAt: Date | string;
    dueAt: Date | string;
    submittedAt?: Date | string | null;
}): QuizStatus {
    if (submittedAt) {
        return "Completed";
    }

    const now = new Date();
    const publishDate = new Date(publishAt);
    const dueDate = new Date(dueAt);

    if (now < publishDate) {
        return "Upcoming";
    }

    if (now > dueDate) {
        return "Expired";
    }

    return "Active";
}

export function normalizeOneWordAnswer(value: string) {
    return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function gradeQuizAttempt(
    questions: IQuizQuestion[],
    answers: QuizAnswerInput[]
) {
    const answerMap = new Map(
        answers.map((answer) => [answer.questionId, (answer.answer ?? "").trim()])
    );

    const gradedAnswers = questions.map((question) => {
        const questionId = question._id?.toString() || "";
        const submittedAnswer = answerMap.get(questionId) || "";
        const isCorrect = isQuizAnswerCorrect(question, submittedAnswer);
        const awardedMarks = isCorrect ? question.marks : 0;

        return {
            questionId,
            answer: submittedAnswer,
            isCorrect,
            awardedMarks,
        };
    });

    const score = gradedAnswers.reduce((sum, answer) => sum + answer.awardedMarks, 0);
    const answeredCount = gradedAnswers.filter((answer) => answer.answer !== "").length;

    return {
        gradedAnswers,
        score,
        answeredCount,
        totalQuestions: questions.length,
    };
}

export function sanitizeQuizQuestionsForStudent(questions: IQuizQuestion[]) {
    return questions.map((question) => ({
        _id: question._id,
        type: question.type,
        prompt: question.prompt,
        marks: question.marks,
        explanation: question.explanation || "",
        options:
            question.type === "mcq"
                ? (question.options || []).map((option) => ({
                      id: option.id,
                      text: option.text,
                  }))
                : [],
    }));
}

export function validateQuizQuestions(rawQuestions: unknown) {
    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
        return {
            valid: false,
            message: "Add at least one quiz question",
        };
    }

    const normalizedQuestions = rawQuestions.map((question, index) => {
        const row = question as {
            type?: QuizQuestionType;
            prompt?: string;
            marks?: number;
            options?: Array<{ id?: string; text?: string }>;
            correctAnswer?: string;
            explanation?: string;
        };

        const type = row.type;
        const prompt = (row.prompt || "").trim();
        const marks = Number(row.marks);
        const explanation = (row.explanation || "").trim();

        if (type !== "mcq" && type !== "one_word") {
            throw new Error(`Question ${index + 1} must be MCQ or one word`);
        }

        if (!prompt) {
            throw new Error(`Question ${index + 1} needs a prompt`);
        }

        if (!Number.isFinite(marks) || marks <= 0) {
            throw new Error(`Question ${index + 1} must have valid marks`);
        }

        if (type === "mcq") {
            const options = Array.isArray(row.options)
                ? row.options
                      .map((option) => ({
                          id: (option.id || "").trim(),
                          text: (option.text || "").trim(),
                      }))
                      .filter((option) => option.id && option.text)
                : [];

            if (options.length < 2) {
                throw new Error(`Question ${index + 1} must have at least two options`);
            }

            const correctAnswer = (row.correctAnswer || "").trim();
            const optionIds = new Set(options.map((option) => option.id));

            if (!correctAnswer || !optionIds.has(correctAnswer)) {
                throw new Error(`Question ${index + 1} must have a valid correct option`);
            }

            return {
                type,
                prompt,
                marks,
                options,
                correctAnswer,
                explanation,
            };
        }

        const correctAnswer = (row.correctAnswer || "").trim();

        if (!correctAnswer) {
            throw new Error(`Question ${index + 1} must have a correct answer`);
        }

        return {
            type,
            prompt,
            marks,
            options: [],
            correctAnswer,
            explanation,
        };
    });

    return {
        valid: true,
        questions: normalizedQuestions,
        totalQuestions: normalizedQuestions.length,
        totalMarks: normalizedQuestions.reduce((sum, question) => sum + question.marks, 0),
    };
}

function isQuizAnswerCorrect(question: IQuizQuestion, submittedAnswer: string) {
    if (!submittedAnswer) {
        return false;
    }

    if (question.type === "mcq") {
        return submittedAnswer.trim() === question.correctAnswer.trim();
    }

    return normalizeOneWordAnswer(submittedAnswer) === normalizeOneWordAnswer(question.correctAnswer);
}
