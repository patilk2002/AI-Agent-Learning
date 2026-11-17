
import { retrieveActivePolicy } from "./rag-service.js";

async function main() {

    const question =
        "What approval is needed for international wire transfers above €100,000?";

    const result = await retrieveActivePolicy(
        question,
        "banking_policy"
    );

    console.log("\nRAG Service Result:");
    console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
