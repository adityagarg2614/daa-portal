type LogContext = Record<string, unknown>;

const isDevelopment = process.env.NODE_ENV !== "production";

function serializeError(error: unknown) {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
        };
    }

    return error;
}

function writeLog(level: "debug" | "info" | "warn" | "error", message: string, context?: LogContext) {
    const payload = {
        level,
        message,
        ...(context ? { context } : {}),
    };

    const line = JSON.stringify(payload);

    if (level === "error") {
        console.error(line);
        return;
    }

    if (level === "warn") {
        console.warn(line);
        return;
    }

    console.log(line);
}

export const logger = {
    debug(message: string, context?: LogContext) {
        if (isDevelopment) {
            writeLog("debug", message, context);
        }
    },
    info(message: string, context?: LogContext) {
        writeLog("info", message, context);
    },
    warn(message: string, context?: LogContext) {
        writeLog("warn", message, context);
    },
    error(message: string, error?: unknown, context?: LogContext) {
        writeLog("error", message, {
            ...(context || {}),
            ...(error !== undefined ? { error: serializeError(error) } : {}),
        });
    },
};
