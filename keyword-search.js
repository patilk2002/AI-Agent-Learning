
import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";
import { getActivePolicyVersion } from "./policy-registry.js";

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});

const COLLECTION = "banking_policies";

async function keywordSearch(question) {

    const documentId = "banking_policy";

    const activePolicy =
        await getActivePolicyVersion(documentId);

    const result = await client.query(COLLECTION, {
        query: {
            text: question
        },
        using: "text",
        limit: 5,
        with_payload: true,
        filter: {
            must: [
                {
                    key: "documentId",
                    match: { value: documentId }
                },
                {
                    key: "version",
                    match: { value: activePolicy.version }
                }
            ]
        }
    });

    console.log("Active version:", activePolicy.version);
    console.log("Keyword results:", result.points.length);

    result.points.forEach((point, index) => {
        console.log(`\nResult ${index + 1}`);
        console.log("BM25 score:", point.score);
        console.log("Text:", point.payload.text);
    });
}

const question =
    "additional approval compliance department";

keywordSearch(question).catch(console.error);
