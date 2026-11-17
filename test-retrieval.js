
import { retrieveActivePolicy } from "./rag-service.js";

async function main() {
    const question =
        "Who must authorize high-value international payments?";

    const result = await retrieveActivePolicy(
        question,
        "banking_policy"
    );

    console.log("\nDense search results:");

    result.context?.forEach((point, index) => {
        console.log(`\nChunk ${index + 1}`);
        console.log("Score:", point.score);
        console.log("Text:", point.text);
    });
}

main().catch(console.error);
