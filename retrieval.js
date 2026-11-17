
import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";
import { RAG_CONFIG } from "./rag-config.js";

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});

async function generateQueryEmbedding(question) {
    const response = await fetch(
        "http://localhost:11434/api/embed",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: RAG_CONFIG.embeddingModel,
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

export async function retrieveDocuments(
    question,
    documentId,
    version
) {
    const queryVector =
        await generateQueryEmbedding(question);

    const policyFilter = {
        must: [
            {
                key: "documentId",
                match: { value: documentId }
            },
            {
                key: "version",
                match: { value: version }
            }
        ]
    };

    const result = await client.query(
        RAG_CONFIG.collection,
        {
            prefetch: [
                {
                    query: queryVector,
                    limit: RAG_CONFIG.retrievalLimit,
                    filter: policyFilter
                },
                {
                    query: { text: question },
                    using: "text",
                    limit: RAG_CONFIG.retrievalLimit,
                    filter: policyFilter
                }
            ],
            query: {
                rrf: {}
            },
            limit: RAG_CONFIG.maxContextChunks,
            with_payload: true
        }
    );

    console.log("Hybrid retrieval results:", result.points.length);

    return result.points;
}
