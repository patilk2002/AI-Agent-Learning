
const document = `
International wire transfers require verification.
Transfers above €50,000 require additional approval
from the compliance department.

All transactions must be recorded for auditing.
Transactions involving sanctioned entities must be
held for further investigation.
`;

// Step 1: Split document into chunks
function chunkText(text, chunkSize = 30, overlap = 5) {
    const words = text.trim().split(/\s+/);

    if (overlap < 0 || overlap >= chunkSize) {
        throw new Error("Invalid overlap");
    }

    const chunks = [];
    const step = chunkSize - overlap;

    for (let i = 0; i < words.length; i += step) {
        const currentWords = words.slice(i, i + chunkSize);

        if (currentWords.length === 0) break;

        chunks.push(currentWords.join(" "));
    }

    return chunks;
}

// Step 2: Generate embeddings
async function generateEmbeddings(chunks) {
    const response = await fetch(
        "http://localhost:11434/api/embed",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "nomic-embed-text",
                input: chunks
            })
        }
    );

    if (!response.ok) {
        throw new Error(`Embedding failed: ${response.status}`);
    }

    const data = await response.json();
    return data.embeddings;
}

// Step 3: Build document records
async function main() {
    const chunks = chunkText(document, 30, 5);

    const embeddings = await generateEmbeddings(chunks);

    const records = chunks.map((chunk, index) => ({
        id: index + 1,
        text: chunk,
        embedding: embeddings[index],
        metadata: {
            documentName: "banking_policy.txt",
            chunkIndex: index
        }
    }));

    console.log("Total chunks:", records.length);
    console.log("Embedding dimensions:", records[0].embedding.length);

    console.log("\nFirst record:");
    console.log({
        ...records[0],
        embedding: `[${records[0].embedding.length} numerical values]`
    });
}

main().catch(console.error);
