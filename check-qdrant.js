
import "dotenv/config";

async function main() {
    const response = await fetch(process.env.QDRANT_URL, {
        headers: {
            "api-key": process.env.QDRANT_API_KEY
        }
    });

    if (!response.ok) {
        throw new Error(`Qdrant error: ${response.status}`);
    }

    const data = await response.json();

    console.log("Qdrant server version:", data.version);
    console.log("Qdrant status:", data.title);
}

main().catch(console.error);
