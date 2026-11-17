
import "dotenv/config";
import fs from "node:fs/promises";
import { QdrantClient } from "@qdrant/js-client-rest";

const COLLECTION = "banking_policies";
const REGISTRY_FILE = "./policy-registry.json";

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});

async function validatePolicyVersion(
    documentId,
    version,
    expectedChunks
) {
    const result = await client.scroll(COLLECTION, {
        limit: 100,
        with_payload: true,
        with_vector: false,
        filter: {
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
        }
    });

    const chunks = result.points;

    console.log("Expected chunks:", expectedChunks);
    console.log("Indexed chunks:", chunks.length);

    if (chunks.length !== expectedChunks) {
        throw new Error(
            `Chunk count mismatch. Expected ${expectedChunks}, found ${chunks.length}`
        );
    }

    const invalidChunks = chunks.filter(
        point =>
            typeof point.payload?.text !== "string" ||
            point.payload.text.trim() === ""
    );

    if (invalidChunks.length > 0) {
        throw new Error("Some chunks have missing text.");
    }

    console.log("All chunks validated successfully.");

    return chunks.length;
}

async function activatePolicy(documentId, newVersion) {
    // 1. Read registry.
    const content = await fs.readFile(REGISTRY_FILE, "utf-8");
    const registry = JSON.parse(content);

    const policy = registry[documentId];

    if (!policy) {
        throw new Error(`Policy not found: ${documentId}`);
    }

    // 2. Verify version exists in registry.
    const targetVersion = policy.versions.find(
        item => item.version === newVersion
    );

    if (!targetVersion) {
        throw new Error(`Version ${newVersion} is not registered.`);
    }

    // 3. Verify that Qdrant contains this version.
    await validatePolicyVersion(
        documentId,
        newVersion,
        targetVersion.expectedChunks
    );

    // 4. Update statuses.
    policy.versions.forEach(item => {
        item.status = item.version === newVersion
            ? "active"
            : "indexed";
    });

    // 5. Update active version pointer.
    policy.activeVersion = newVersion;

    // 6. Write to a temporary file, then replace the registry.
    const tempFile = `${REGISTRY_FILE}.tmp`;

    await fs.writeFile(
        tempFile,
        JSON.stringify(registry, null, 2),
        "utf-8"
    );

    await fs.rename(tempFile, REGISTRY_FILE);

    console.log("--------------------------------");
    console.log("Policy activated successfully!");
    console.log("Document:", documentId);
    console.log("Active version:", newVersion);
    console.log("--------------------------------");
}

const documentId = process.argv[2];
const version = Number(process.argv[3]);

if (!documentId || !Number.isInteger(version) || version < 1) {
    console.error(
        "Usage: node activate-policy.js <documentId> <version>"
    );
    process.exitCode = 1;
} else {
    activatePolicy(documentId, version).catch(error => {
        console.error("Activation failed:", error.message);
        process.exitCode = 1;
    });
}
