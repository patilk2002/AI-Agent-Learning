
function chunkText(text, chunkSize = 100, overlap = 20) {
    const words = text.split(/\s+/);

    if (overlap >= chunkSize || overlap < 0) {
        throw new Error("Overlap must be smaller than chunk size");
    }

    const chunks = [];
    const step = chunkSize - overlap;

    for (let i = 0; i < words.length; i += step) {
        const chunk = words.slice(i, i + chunkSize);

        if (chunk.length === 0) break;

        chunks.push(chunk.join(" "));
    }

    return chunks;
}

const document = `
International wire transfers require verification.
Transfers above €50,000 require additional approval
from the compliance department.
All transactions must be recorded for auditing.
`;

const chunks = chunkText(document, 10, 2);

chunks.forEach((chunk, index) => {
    console.log(`Chunk ${index + 1}:`, chunk);
});
