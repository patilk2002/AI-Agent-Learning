
import fs from "node:fs/promises";

const REGISTRY_FILE = "./policy-registry.json";

export async function getActivePolicyVersion(documentId) {
    const content = await fs.readFile(
        REGISTRY_FILE,
        "utf-8"
    );

    const registry = JSON.parse(content);

    const policy = registry[documentId];

    if (!policy) {
        throw new Error(`Policy not found: ${documentId}`);
    }

    const activeVersion = policy.versions.find(
        version =>
            version.version === policy.activeVersion &&
            version.status === "active"
    );

    if (!activeVersion) {
        throw new Error(
            `No valid active version found for ${documentId}`
        );
    }

    return activeVersion;
}
