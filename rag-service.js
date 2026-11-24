
import { getActivePolicyVersion } from "./policy-registry.js";
import { retrieveDocuments } from "./retrieval.js";
import {
    validateQuestion,
    validatePolicyVersion,
    validateDocumentId
} from "./security.js";


export async function retrieveActivePolicy(question, documentId) {
    question = validateQuestion(question);
    documentId = validateDocumentId(documentId);
    // Step 1: Get active policy version
    const activePolicy = await getActivePolicyVersion(documentId);
    version = validatePolicyVersion(activePolicy);
    console.log("Active policy version:", activePolicy.version);

    // Step 2: Retrieve only chunks from active version
    const documents = await retrieveDocuments(
        question,
        documentId,
        activePolicy.version
    );

    // Step 3: Handle insufficient retrieval
    if (documents.length === 0) {
        return {
            success: false,
            version: activePolicy.version,
            context: [],
            message: "No sufficiently relevant policy information was found."
        };
    }

    // Step 4: Return retrieved context
    return {
        success: true,
        version: activePolicy.version,
        context: documents.map(point => ({
            text: point.payload.text,
            score: point.score
        }))
    };
}
