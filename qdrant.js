
import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";

const COLLECTION = "banking_policies";
const EMBEDDING_SIZE = 768;

// Connect to Qdrant Cloud
const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});

// Sample banking document
const document = `
International wire transfers require verification.
Transfers above €50,000 require additional approval
from the compliance department.

All transactions must be recorded for auditing.
Transactions involving sanctioned entities must be
held for further investigation.
`;

// 1. Chunking
function chunkText(text, chunkSize = 30, overlap = 5) {
    const words = text.trim().split(/\s+/);
    const chunks = [];
    const step = chunkSize - overlap;

    for (let i = 0; i < words.length; i += step) {
        const chunk = words.slice(i, i + chunkSize);

        if (chunk.length === 0) break;

        chunks.push(chunk.join(" "));
    }

    return chunks;
}

// 2. Generate document embeddings
async function generateEmbeddings(texts) {
    const response = await fetch(
        "http://localhost:11434/api/embed",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "nomic-embed-text",
                input: texts.map(
                    text => `search_document: ${text}`
                )
            })
        }
    );

    if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    return data.embeddings;
}

// 3. Create collection if it doesn't exist
async function createCollection() {
    const result = await client.getCollections();

    const exists = result.collections.some(
        collection => collection.name === COLLECTION
    );

    if (!exists) {
        await client.createCollection(COLLECTION, {
            vectors: {
                size: EMBEDDING_SIZE,
                distance: "Cosine"
            }
        });

        console.log("Collection created!");
    } else {
        console.log("Collection already exists.");
    }
}

// 4. Insert document chunks into Qdrant
async function storeDocuments(chunks, embeddings) {
    const points = chunks.map((chunk, index) => ({
        id: index + 1,

        vector: embeddings[index],

        payload: {
            text: chunk,
            documentName: "banking_policy.txt",
            chunkIndex: index
        }
    }));

    await client.upsert(COLLECTION, {
        wait: true,
        points
    });

    console.log("Documents stored successfully!");
}

// 5. Verify stored records
async function verifyStorage() {
    const result = await client.scroll(COLLECTION, {
        limit: 10,
        with_payload: true,
        with_vector: false
    });

    console.log("Stored points:", result.points.length);

    result.points.forEach(point => {
        console.log({
            id: point.id,
            text: point.payload.text,
            document: point.payload.documentName
        });
    });
}

// Main execution
async function main() {
    if (!process.env.QDRANT_URL ||
        !process.env.QDRANT_API_KEY) {
        throw new Error("Missing Qdrant environment variables");
    }

    const chunks = chunkText(document, 30, 5);

    console.log("Chunks generated:", chunks.length);

    const embeddings = await generateEmbeddings(chunks);

    if (embeddings.some(
        vector => vector.length !== EMBEDDING_SIZE
    )) {
        throw new Error("Unexpected embedding dimensions");
    }

    await createCollection();

    await storeDocuments(chunks, embeddings);

    await verifyStorage();
}

main().catch(error => {
    console.error("RAG ingestion failed:", error.message);
});
