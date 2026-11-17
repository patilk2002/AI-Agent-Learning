
import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});

async function main() {
    const result = await client.scroll("banking_policies", {
        limit: 100,
        with_payload: true,
        with_vector: false
    });

    console.log("Total points:", result.points.length);

    for (const point of result.points) {
        console.log({
            id: point.id,
            documentId: point.payload.documentId,
            version: point.payload.version,
            documentName: point.payload.documentName,
            chunkIndex: point.payload.chunkIndex,
            text: point.payload.text
        });
    }
}

main().catch(console.error);

