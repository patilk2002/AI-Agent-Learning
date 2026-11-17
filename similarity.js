
const sentences = [
    "How does Apache Kafka work?",
    "Explain the architecture of Kafka.",
    "What is the capital of France?"
];

// Generate embeddings using Ollama
async function generateEmbeddings(texts) {
    const response = await fetch(
        "http://localhost:11434/api/embed",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "nomic-embed-text",
                input: texts
            })
        }
    );

    if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    return data.embeddings;
}

// Calculate cosine similarity
function cosineSimilarity(vectorA, vectorB) {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];

        magnitudeA += vectorA[i] ** 2;
        magnitudeB += vectorB[i] ** 2;
    }

    return dotProduct /
        (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

async function main() {
    const embeddings = await generateEmbeddings(sentences);

    console.log("Vector dimensions:", embeddings[0].length);

    console.log(
        "A vs B:",
        cosineSimilarity(embeddings[0], embeddings[1]).toFixed(4)
    );

    console.log(
        "A vs C:",
        cosineSimilarity(embeddings[0], embeddings[2]).toFixed(4)
    );
}

main().catch(console.error);
