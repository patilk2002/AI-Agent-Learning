
import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});

const COLLECTION = "banking_policies";

async function main() {
    await client.createPayloadIndex(COLLECTION, {
        field_name: "text",
        field_schema: {
            type: "text",
            tokenizer: "word",
            lowercase: true,
            scoring: {
                type: "bm25"
            }
        },
        wait: true
    });

    console.log("BM25 text index created successfully!");
}

main().catch(error => {
    console.error("Index creation failed:", error);
});
