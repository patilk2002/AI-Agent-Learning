
import {
    createRequestId,
    logRequestStart,
    logRequestCompleted,
    logRequestFailed
} from "./logger.js";

const requestId = createRequestId();

logRequestStart(requestId, {
    documentId: "banking_policy",
    policyVersion: 2
});

logRequestCompleted(requestId, {
    totalLatencyMs: 1267,
    retrievedChunks: 2,
    rerankedChunks: 2
});

logRequestFailed(requestId, new Error("Groq service unavailable"), {
    stage: "generation"
});
