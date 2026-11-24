
export const evaluationDataset = [
    {
        id: "v2-high-value-transfer",
        question: "Who must approve an international transfer above €100,000?",
        documentId: "banking_policy",
        version: 2,
        relevantPhrases: ["regional compliance head"],
        expectedRelevantCount: 1
    },
    {
        id: "v1-transfer-approval",
        question: "Who approves international transfers above €50,000?",
        documentId: "banking_policy",
        version: 1,
        relevantPhrases: ["compliance department"],
        expectedRelevantCount: 1
    },
    {
        id: "v2-sanctioned-entities",
        question: "What happens to transactions involving sanctioned entities?",
        documentId: "banking_policy",
        version: 2,
        relevantPhrases: ["held for further investigation"],
        expectedRelevantCount: 1
    },
    {
        id: "v2-audit-records",
        question: "What does the policy say about transaction auditing?",
        documentId: "banking_policy",
        version: 2,
        relevantPhrases: ["recorded for auditing"],
        expectedRelevantCount: 1
    }
];
