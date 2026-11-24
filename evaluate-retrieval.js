
import {
    retrieveHybridCandidates,
    rerankCandidates
} from "./retrieval.js";

import { evaluationDataset } from "./evaluation-dataset.js";

const TOP_K = 3;

// Check whether a retrieved chunk contains relevant evidence
function isRelevant(point, testCase) {
    const text = point.payload.text.toLowerCase();

    return testCase.relevantPhrases.some(
        phrase => text.includes(phrase.toLowerCase())
    );
}

// Calculate Recall@K
function calculateRecall(results, testCase) {
    const relevantRetrieved = results.filter(
        point => isRelevant(point, testCase)
    ).length;

    return Math.min(
        1,
        relevantRetrieved / testCase.expectedRelevantCount
    );
}

// Calculate Reciprocal Rank
function calculateRR(results, testCase) {
    const relevantIndex = results.findIndex(
        point => isRelevant(point, testCase)
    );

    return relevantIndex === -1
        ? 0
        : 1 / (relevantIndex + 1);
}

// Calculate nDCG@K using binary relevance
function calculateNDCG(results, testCase) {
    let dcg = 0;

    results.forEach((point, index) => {
        const relevance = isRelevant(point, testCase) ? 1 : 0;

        dcg += relevance / Math.log2(index + 2);
    });

    let idealDCG = 0;

    const idealRelevantCount = Math.min(
        testCase.expectedRelevantCount,
        TOP_K
    );

    for (let i = 0; i < idealRelevantCount; i++) {
        idealDCG += 1 / Math.log2(i + 2);
    }

    return idealDCG === 0 ? 0 : dcg / idealDCG;
}

// Evaluate one retrieval approach
function evaluateResults(results, testCase) {
    const topResults = results.slice(0, TOP_K);

    return {
        recall: calculateRecall(topResults, testCase),
        rr: calculateRR(topResults, testCase),
        ndcg: calculateNDCG(topResults, testCase)
    };
}

function average(values) {
    if (values.length === 0) return 0;

    return values.reduce((sum, value) => sum + value, 0)
        / values.length;
}

async function runEvaluation() {
    const hybridMetrics = [];
    const rerankedMetrics = [];

    console.log("\n========== RAG EVALUATION ==========\n");

    for (const testCase of evaluationDataset) {
        console.log("------------------------------------");
        console.log("Test:", testCase.id);
        console.log("Question:", testCase.question);
        console.log("Policy version:", testCase.version);

        // Retrieve once; both approaches use the same candidates
        const candidates = await retrieveHybridCandidates(
            testCase.question,
            testCase.documentId,
            testCase.version
        );

        // Approach 1: Original hybrid order
        const hybridResults = candidates.slice(0, TOP_K);

        // Approach 2: Cross-encoder reranked order
        const rerankedResults = await rerankCandidates(
            testCase.question,
            candidates,
            TOP_K
        );

        const hybridScore = evaluateResults(
            hybridResults,
            testCase
        );

        const rerankedScore = evaluateResults(
            rerankedResults,
            testCase
        );

        hybridMetrics.push(hybridScore);
        rerankedMetrics.push(rerankedScore);

        console.log("\nHybrid only:");
        console.log(hybridScore);

        console.log("\nHybrid + reranking:");
        console.log(rerankedScore);

        console.log("\nHybrid ranking:");
        hybridResults.forEach((point, index) => {
            console.log(
                `${index + 1}. Relevant: ${isRelevant(point, testCase)} | ${point.payload.text}`
            );
        });

        console.log("\nReranked ranking:");
        rerankedResults.forEach((point, index) => {
            console.log(
                `${index + 1}. Relevant: ${isRelevant(point, testCase)} | ${point.payload.text}`
            );
        });
    }

    console.log("\n========== FINAL RESULTS ==========\n");

    const summary = [
        {
            approach: "Hybrid only",
            recall: average(hybridMetrics.map(m => m.recall)),
            mrr: average(hybridMetrics.map(m => m.rr)),
            ndcg: average(hybridMetrics.map(m => m.ndcg))
        },
        {
            approach: "Hybrid + reranking",
            recall: average(rerankedMetrics.map(m => m.recall)),
            mrr: average(rerankedMetrics.map(m => m.rr)),
            ndcg: average(rerankedMetrics.map(m => m.ndcg))
        }
    ];

    console.table(
        summary.map(item => ({
            Approach: item.approach,
            "Recall@3": item.recall.toFixed(3),
            MRR: item.mrr.toFixed(3),
            "nDCG@3": item.ndcg.toFixed(3)
        }))
    );
}

runEvaluation().catch(error => {
    console.error("Evaluation failed:", error);
    process.exitCode = 1;
});
