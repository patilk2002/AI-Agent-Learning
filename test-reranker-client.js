
import { rerankDocuments } from "./reranker-client.js";

async function main() {
    const question =
        "Who must approve international transfers above €100,000?";

    const documents = [
        "All international wire transfers require verification.",

        "Transfers above €50,000 require additional approval from the compliance department.",

        "Transfers above €100,000 additionally require approval from the regional compliance head.",

        "All transactions must be recorded for auditing.",

        "Domestic transfers are processed according to standard procedures."
    ];

    const results = await rerankDocuments(
        question,
        documents,
        3
    );

    console.log("\nNode.js reranking results:\n");

    results.forEach((result, index) => {
        console.log(`Rank: ${index + 1}`);
        console.log(`Score: ${result.score.toFixed(4)}`);
        console.log(`Document: ${result.document}`);
        console.log("-------------------------");
    });
}

main().catch(console.error);
