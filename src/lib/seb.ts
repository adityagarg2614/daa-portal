import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import Assignment from "@/models/Assignment";
import ExamAttempt from "@/models/ExamAttempt";
import mongoose from "mongoose";
import { logger } from "@/lib/logger";

function getAllowedSebKeys(envValue?: string) {
    return (envValue || "")
        .split(",")
        .map((key) => key.trim().toLowerCase())
        .filter(Boolean);
}

/**
 * Verifies if the current request is coming from Safe Exam Browser.
 *
 * Verification strategy:
 *  1. User-Agent check — SEB always sets a UA containing "SEB/". This is
 *     URL-independent and stable across all assignment URLs.
 *  2. ExamAttempt check — The student must have clicked "Start Exam" in the
 *     normal browser first, creating a pending ExamAttempt record.
 */
export async function verifySebSession(assignmentId: string, studentId: string) {
    const headerList = await headers();
    const userAgent = headerList.get("user-agent") || "";
    const browserExamKey = headerList.get("x-safeexambrowser-browserexamkeyhash") || "";
    const configKey = headerList.get("x-safeexambrowser-configkeyhash") || "";
    const allowedBrowserExamKeys = getAllowedSebKeys(process.env.SEB_BROWSER_EXAM_KEYS);
    const allowedConfigKeys = getAllowedSebKeys(process.env.SEB_CONFIG_KEYS);

    logger.debug("SEB verification started", {
        assignmentId,
        studentId,
        userAgent: userAgent.slice(0, 80),
    });

    await connectDB();
    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
        return { success: false, message: "Assignment not found" };
    }

    // SEB not required — anyone can access
    if (!assignment.isSebRequired) {
        return { success: true, bypassed: true };
    }

    // Check 1: Must be Safe Exam Browser
    if (!userAgent.includes("SEB/")) {
        logger.warn("SEB verification blocked: browser mismatch", { assignmentId, studentId });
        return {
            success: false,
            message: "Safe Exam Browser is required to access this assignment.",
            errorCode: "SEB_REQUIRED",
        };
    }
    logger.debug("SEB browser confirmed", { assignmentId, studentId });

    if (allowedBrowserExamKeys.length > 0) {
        const normalizedBrowserExamKey = browserExamKey.trim().toLowerCase();

        if (!normalizedBrowserExamKey || !allowedBrowserExamKeys.includes(normalizedBrowserExamKey)) {
            logger.warn("SEB verification blocked: browser exam key mismatch", { assignmentId, studentId });
            return {
                success: false,
                message: "The Safe Exam Browser configuration used on this device is not approved for this exam.",
                errorCode: "SEB_BROWSER_EXAM_KEY_REQUIRED",
            };
        }
    }

    if (allowedConfigKeys.length > 0) {
        const normalizedConfigKey = configKey.trim().toLowerCase();

        if (!normalizedConfigKey || !allowedConfigKeys.includes(normalizedConfigKey)) {
            logger.warn("SEB verification blocked: config key mismatch", { assignmentId, studentId });
            return {
                success: false,
                message: "The Safe Exam Browser configuration key did not match the institution-approved settings.",
                errorCode: "SEB_CONFIG_KEY_REQUIRED",
            };
        }
    }

    // Check 2: Must have a pending/started ExamAttempt
    const attempt = await ExamAttempt.findOne({
        studentId: new mongoose.Types.ObjectId(studentId),
        assignmentId: new mongoose.Types.ObjectId(assignmentId),
    });

    logger.debug("SEB exam attempt lookup completed", {
        assignmentId,
        studentId,
        status: attempt ? attempt.status : "NONE",
    });

    if (!attempt) {
        return {
            success: false,
            message: "No active exam attempt found. Please start via the portal.",
            errorCode: "ATTEMPT_REQUIRED",
        };
    }

    if (attempt.status === "submitted") {
        return { success: false, message: "Assignment already submitted.", errorCode: "ALREADY_SUBMITTED" };
    }

    logger.debug("SEB verification passed", { assignmentId, studentId });
    return { success: true, attempt };
}

/**
 * Marks an attempt as started (transitions from "pending" → "started").
 * Called after SEB verification passes on the first visit.
 */
export async function markAttemptAsStarted(attemptId: string, userAgent: string, ip: string) {
    await connectDB();
    const attempt = await ExamAttempt.findById(attemptId);

    if (!attempt) return null;

    if (attempt.status === "pending") {
        attempt.status = "started";
        attempt.startedAt = new Date();
        attempt.sebVerified = true;
        attempt.userAgent = userAgent;
        attempt.ipAddress = ip.split(",")[0]?.trim() || ip;
        if (userAgent.toLowerCase().includes("win")) attempt.sebPlatform = "windows";
        else if (userAgent.toLowerCase().includes("mac")) attempt.sebPlatform = "macos";
        else attempt.sebPlatform = "other";
        await attempt.save();
    }

    return attempt;
}
