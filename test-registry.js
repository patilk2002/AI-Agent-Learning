
import { getActivePolicyVersion } from "./policy-registry.js";

async function main() {
    const activeVersion = await getActivePolicyVersion(
        "banking_policy"
    );

    console.log("Active policy version:");
    console.log(activeVersion);
}

main().catch(console.error);
