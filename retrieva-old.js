
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
    activeVersion
) {
    const queryVector = await generateQueryEmbedding(question);

    const result = await client.query(
        RAG_CONFIG.collection,
        {
            query: queryVector,
            limit: RAG_CONFIG.retrievalLimit,
            with_payload: true,
            filter: {
                must: [
                    {
                        key: "documentId",
                        match: { value: documentId }
                    },
                    {
                        key: "version",
                        match: { value: activeVersion }
                    }
                ]
            }
        }
    );

    const relevantChunks = result.points
        .filter(point =>
            point.score >= RAG_CONFIG.similarityThreshold
        )
        .slice(0, RAG_CONFIG.maxContextChunks);

    console.log("Total retrieved:", result.points.length);
    console.log("Relevant chunks:", relevantChunks.length);

    return relevantChunks;
}
