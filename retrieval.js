
import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";
import { RAG_CONFIG } from "./rag-config.js";
import { rerankDocuments } from "./reranker-client.js";

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

// STEP 1: Retrieve candidates using hybrid search
export async function retrieveHybridCandidates(
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

    const retrievalResult = await client.query(
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
            query: { rrf: {} },
            limit: RAG_CONFIG.retrievalLimit,
            with_payload: true
        }
    );

    return retrievalResult.points ?? [];
}

// STEP 2: Rerank existing hybrid candidates
export async function rerankCandidates(
    question,
    candidates,
    topN = RAG_CONFIG.maxContextChunks
) {
    if (candidates.length === 0) {
        return [];
    }

    const documents = candidates.map(
        point => point.payload.text
    );

    const rerankedResults = await rerankDocuments(
        question,
        documents,
        Math.min(topN, documents.length)
    );

    return rerankedResults.map(result => ({
        ...candidates[result.index],
        rerankScore: result.score
    }));
}

// STEP 3: Existing RAG interface
// Keeps ask-policy.js compatible
export async function retrieveDocuments(
    question,
    documentId,
    version
) {
    const candidates = await retrieveHybridCandidates(
        question,
        documentId,
        version
    );

    console.log(
        "\nHybrid candidates:",
        candidates.length
    );

    if (candidates.length === 0) {
        return [];
    }

    const finalDocuments = await rerankCandidates(
        question,
        candidates
    );

    console.log(
        "Reranked documents:",
        finalDocuments.length
    );

    console.log("\nFinal reranked results:");

    finalDocuments.forEach((point, index) => {
        console.log(`\nRank: ${index + 1}`);
        console.log(
            "Reranker score:",
            point.rerankScore
        );
        console.log(
            "Policy version:",
            point.payload.version
        );
        console.log(
            "Text:",
            point.payload.text
        );
    });

    return finalDocuments;
}
