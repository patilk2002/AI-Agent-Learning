
import { randomUUID } from "node:crypto";

export function createRequestId() {
    return randomUUID();
}

export function log(level, event, details = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        event,
        ...details
    };

    const output = JSON.stringify(logEntry);

    if (level === "ERROR") {
        console.error(output);
    } else {
        console.log(output);
    }
}

export function logRequestStart(requestId, details = {}) {
    log("INFO", "rag.request.started", {
        requestId,
        ...details
    });
}

export function logRequestCompleted(requestId, details = {}) {
    log("INFO", "rag.request.completed", {
        requestId,
        ...details
    });
}

export function logRequestFailed(requestId, error, details = {}) {
    log("ERROR", "rag.request.failed", {
        requestId,
        error: error.message,
        ...details
    });
}
