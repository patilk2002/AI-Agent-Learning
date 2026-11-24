
export const RAG_CONFIG = {
    collection: "banking_policies",
    embeddingModel: "nomic-embed-text",
    embeddingDimensions: 768,

    // Retrieve more candidates initially
    retrievalLimit: 10,

    // Send only the best chunks to Groq
    maxContextChunks: 3
};
