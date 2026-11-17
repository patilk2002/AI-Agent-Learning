
import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});

const COLLECTION = "banking_policies";

// Generate embedding for the user's question
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

// Search Qdrant
async function searchDocuments(question) {
    // Step 1: Generate query vector
    const queryVector = await generateQueryEmbedding(question);

    // Step 2: Search for similar vectors
    const result = await client.query(COLLECTION, {
        query: queryVector,
        limit: 3,
        with_payload: true
    });

    // Step 3: Display matching documents
    console.log("\nQuestion:", question);
    console.log("\nRetrieved documents:\n");

    for (const point of result.points) {
        console.log("--------------------------------");
        console.log("ID:", point.id);
        console.log("Similarity score:", point.score);
        console.log("Document:", point.payload.documentName);
        console.log("Chunk:", point.payload.text);
    }
}

async function main() {
    const question =
        "What approval is needed for international wire transfers above €50,000?";

    await searchDocuments(question);
}

main().catch(console.error);
