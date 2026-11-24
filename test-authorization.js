
import {
    authorizePolicyAccess
} from "./authorization.js";

const tests = [
    {
        name: "Compliance analyst accesses banking policy",
        userId: "alice",
        documentId: "banking_policy",
        shouldPass: true
    },
    {
        name: "Operations analyst accesses domestic policy",
        userId: "bob",
        documentId: "domestic_policy",
        shouldPass: true
    },
    {
        name: "Operations analyst accesses banking policy",
        userId: "bob",
        documentId: "banking_policy",
        shouldPass: false
    },
    {
        name: "Administrator accesses banking policy",
        userId: "charlie",
        documentId: "banking_policy",
        shouldPass: true
    },
    {
        name: "Unknown user attempts access",
        userId: "unknown",
        documentId: "banking_policy",
        shouldPass: false
    },
    {
        name: "Unknown policy access",
        userId: "alice",
        documentId: "secret_policy",
        shouldPass: false
    }
];

for (const test of tests) {
    try {
        authorizePolicyAccess(
            test.userId,
            test.documentId
        );

        console.log(
            test.shouldPass ? "PASS:" : "FAIL:",
            test.name
        );
    } catch (error) {
        console.log(
            !test.shouldPass ? "PASS:" : "FAIL:",
            test.name,
            "|",
            error.message
        );
    }
}
