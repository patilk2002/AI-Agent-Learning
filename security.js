
export function validateQuestion(question) {
    if (typeof question !== "string") {
        throw new Error("Question must be a string");
    }

    const normalized = question.trim();

    if (!normalized) {
        throw new Error("Question cannot be empty");
    }

    if (normalized.length > 2000) {
        throw new Error("Question exceeds maximum length");
    }

    return normalized;
}

export function validatePolicyVersion(version) {
    if (!Number.isInteger(version) || version < 1) {
        throw new Error("Invalid policy version");
    }

    return version;
}

export function validateDocumentId(documentId) {
    if (
        typeof documentId !== "string" ||
        !/^[a-zA-Z0-9_-]{1,100}$/.test(documentId)
    ) {
        throw new Error("Invalid document ID");
    }

    return documentId;
}
