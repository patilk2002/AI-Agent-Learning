
import {
    validateQuestion,
    validatePolicyVersion,
    validateDocumentId
} from "./security.js";

const tests = [
    {
        name: "Valid question",
        run: () => validateQuestion("Who approves transfers?")
    },
    {
        name: "Empty question",
        run: () => validateQuestion("   "),
        shouldFail: true
    },
    {
        name: "Oversized question",
        run: () => validateQuestion("A".repeat(2001)),
        shouldFail: true
    },
    {
        name: "Invalid version",
        run: () => validatePolicyVersion(-1),
        shouldFail: true
    },
    {
        name: "Invalid document ID",
        run: () => validateDocumentId("../secret"),
        shouldFail: true
    }
];

for (const test of tests) {
    try {
        test.run();

        if (test.shouldFail) {
            console.log("FAIL:", test.name);
        } else {
            console.log("PASS:", test.name);
        }
    } catch (error) {
        console.log(
            test.shouldFail ? "PASS:" : "FAIL:",
            test.name,
            "|",
            error.message
        );
    }
}
