
import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});

const COLLECTION = "banking_policies";

async function main() {

    // Retrieve points without metadata filtering
    const result = await client.scroll(COLLECTION, {
        limit: 100,
        with_payload: true,
        with_vector: false
    });

    // Identify legacy version 1 points in JavaScript
    const legacyPoints = result.points.filter(point =>
        point.payload.documentName === "banking_policy.txt" &&
        point.payload.version === undefined
    );

    console.log("Legacy points found:", legacyPoints.length);

    if (legacyPoints.length === 0) {
        console.log("No legacy points to migrate.");
        return;
    }

    // Update only metadata
    for (const point of legacyPoints) {
        await client.setPayload(COLLECTION, {
            points: [point.id],
            payload: {
                documentId: "banking_policy",
                version: 1,
                effectiveFrom: "2026-01-01",
                uploadedAt: "2026-11-16"
            },
            wait: true
        });
    }

    console.log("Version 1 metadata migration completed!");

    // Verify migration using indexed fields
    const verification = await client.scroll(COLLECTION, {
        limit: 100,
        with_payload: true,
        with_vector: false,
        filter: {
            must: [
                {
                    key: "documentId",
                    match: {
                        value: "banking_policy"
                    }
                },
                {
                    key: "version",
                    match: {
                        value: 1
                    }
                }
            ]
        }
    });

    console.log(
        "Verified version 1 chunks:",
        verification.points.length
    );

    verification.points.forEach(point => {
        console.log({
            id: point.id,
            version: point.payload.version,
            chunkIndex: point.payload.chunkIndex,
            text: point.payload.text
        });
    });
}

main().catch(error => {
    console.error("Migration failed:", error);
});
