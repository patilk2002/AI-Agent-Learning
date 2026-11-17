
import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";
import { getActivePolicyVersion } from "./policy-registry.js";

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});

const COLLECTION = "banking_policies";
const DOCUMENT_ID = "banking_policy";

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
        throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    return data.embeddings[0];
}

async function searchDocuments(question) {

    // 1. Get currently active policy version
    const activePolicy = await getActivePolicyVersion(
        DOCUMENT_ID
    );

    console.log("Active policy version:", activePolicy.version);

    // 2. Generate query embedding
    const queryVector = await generateQueryEmbedding(question);

    // 3. Search ONLY within the active version
    const result = await client.query(COLLECTION, {
        query: queryVector,
        limit: 3,
        with_payload: true,
        filter: {
            must: [
                {
                    key: "documentId",
                    match: {
                        value: DOCUMENT_ID
                    }
                },
                {
                    key: "version",
                    match: {
                        value: activePolicy.version
                    }
                }
            ]
        }
    });

    console.log("\nRetrieved documents:");

    for (const point of result.points) {
        console.log({
            version: point.payload.version,
            score: point.score,
            text: point.payload.text
        });
    }
}

async function main() {
    const question =
        "What approval is needed for international wire transfers above €100,000?";

    await searchDocuments(question);
}

main().catch(console.error);
