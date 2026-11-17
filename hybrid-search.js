
import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";
import { getActivePolicyVersion } from "./policy-registry.js";

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});

const COLLECTION = "banking_policies";

async function generateQueryEmbedding(question) {
    const response = await fetch(
        "http://localhost:11434/api/embed",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "nomic-embed-text",
                input: [`search_query: ${question}`]
            })
        }
    );

    if (!response.ok) {
        throw new Error(`Embedding error: ${response.status}`);
    }

    const data = await response.json();
    return data.embeddings[0];
}

async function hybridSearch(question) {

    const documentId = "banking_policy";

    // 1. Get active policy version
    const activePolicy =
        await getActivePolicyVersion(documentId);

    console.log("Active policy version:", activePolicy.version);

    // 2. Generate dense query embedding
    const queryVector =
        await generateQueryEmbedding(question);

    // 3. Create version filter
    const policyFilter = {
        must: [
            {
                key: "documentId",
                match: { value: documentId }
            },
            {
                key: "version",
                match: { value: activePolicy.version }
            }
        ]
    };

    // 4. Run dense + BM25 search and fuse with RRF
    const result = await client.query(COLLECTION, {

        prefetch: [
            {
                // Dense semantic search
                query: queryVector,
                limit: 10,
                filter: policyFilter
            },
            {
                // BM25 keyword search
                query: {
                    text: question
                },
                using: "text",
                limit: 10,
                filter: policyFilter
            }
        ],

        // Reciprocal Rank Fusion
        query: {
            rrf: {}
        },

        limit: 5,
        with_payload: true
    });

    console.log("Hybrid results:", result.points.length);

    result.points.forEach((point, index) => {
        console.log(`\nResult ${index + 1}`);
        console.log("RRF score:", point.score);
        console.log("Policy version:", point.payload.version);
        console.log("Text:", point.payload.text);
    });

    return result.points;
}

const question =
    "Who must authorize high-value international payments?";

hybridSearch(question).catch(error => {
    console.error("Hybrid search failed:", error);
});
