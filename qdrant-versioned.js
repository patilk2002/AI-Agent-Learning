import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";
import { createHash } from "node:crypto";

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});

const COLLECTION = "banking_policies";
const EMBEDDING_SIZE = 768;

// Policy identity and version
const policy = {
    documentId: "banking_policy",
    documentName: "banking_policy.txt",
    version: 2,
    effectiveFrom: "2026-11-01"
};

// Example updated policy
const document = `
International wire transfers require verification.

Transfers above €50,000 require additional approval
from the compliance department.

Transfers above €100,000 additionally require approval
from the regional compliance head.

All transactions must be recorded for auditing.

Transactions involving sanctioned entities must be
held for further investigation.
`;

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

// Generate a deterministic UUID for each document version/chunk.
function createPointId(documentId, version, chunkIndex) {
    const hash = createHash("sha256")
        .update(`${documentId}:${version}:${chunkIndex}`)
        .digest("hex")
        .slice(0, 32)
        .split("");

    // Format as a UUID and set UUID version/variant bits.
    hash[12] = "5";
    hash[16] = ["8", "9", "a", "b"][
        parseInt(hash[16], 16) % 4
    ];

    const hex = hash.join("");

    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20)
    ].join("-");
}

async function createPayloadIndexes() {
    await client.createPayloadIndex(COLLECTION, {
        field_name: "documentId",
        field_schema: "keyword",
        wait: true
    });

    await client.createPayloadIndex(COLLECTION, {
        field_name: "version",
        field_schema: "integer",
        wait: true
    });

    console.log("Payload indexes created successfully!");
}

async function generateEmbeddings(chunks) {
    const response = await fetch(
        "http://localhost:11434/api/embed",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "nomic-embed-text",
                input: chunks.map(
                    chunk => `search_document: ${chunk}`
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

async function main() {
    // 1. Generate chunks
    const chunks = chunkText(document, 30, 5);

    console.log("Generated chunks:", chunks.length);

    // 2. Generate embeddings
    const embeddings = await generateEmbeddings(chunks);

    if (
        embeddings.length !== chunks.length ||
        embeddings.some(v => v.length !== EMBEDDING_SIZE)
    ) {
        throw new Error("Embedding validation failed");
    }

    // 3. Prepare versioned Qdrant points
    const uploadedAt = new Date().toISOString();

    const points = chunks.map((chunk, index) => ({
        id: createPointId(
            policy.documentId,
            policy.version,
            index
        ),
        vector: embeddings[index],
        payload: {
            text: chunk,
            documentId: policy.documentId,
            documentName: policy.documentName,
            version: policy.version,
            effectiveFrom: policy.effectiveFrom,
            uploadedAt,
            chunkIndex: index
        }
    }));

// 4. Store points in Qdrant
await client.upsert(COLLECTION, {
    wait: true,
    points
});

console.log("Versioned policy uploaded successfully!");

// 5. Create payload indexes
await createPayloadIndexes();

// 6. Verify stored points
const result = await client.scroll(COLLECTION, {
    limit: 100,
    with_payload: true,
    with_vector: false,
    filter: {
        must: [
            {
                key: "documentId",
                match: {
                    value: policy.documentId
                }
            },
            {
                key: "version",
                match: {
                    value: policy.version
                }
            }
        ]
    }
});
    console.log(
        "Verified version 2 chunks:",
        result.points.length
    );

    result.points.forEach(point => {
        console.log({
            id: point.id,
            version: point.payload.version,
            chunkIndex: point.payload.chunkIndex,
            text: point.payload.text
        });
    });

    if (result.points.length !== chunks.length) {
        throw new Error("Stored chunk count does not match expected count");
    }
}

main().catch(error => {
    console.error("Versioned ingestion failed:", error);
});
