
export const RAG_CONFIG = {
    collection: "banking_policies",

    embeddingModel: "nomic-embed-text",

    embeddingDimensions: 768,

    retrievalLimit: 5,

    // Initial experimental threshold, not a confidence probability.
    similarityThreshold: 0.50,

    maxContextChunks: 3
};
