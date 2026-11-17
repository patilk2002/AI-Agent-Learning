
import Groq from "groq-sdk";
import "dotenv/config";

const client = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// 1. Tool definitions sent to the LLM
const tools = [
    {
        type: "function",
        function: {
            name: "get_account_balance",
            description: "Get the current balance of the user's demo bank account.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_recent_transactions",
            description: "Get the most recent transactions from the user's demo bank account.",
            parameters: {
                type: "object",
                properties: {
                    limit: {
                        type: "integer",
                        description: "Number of recent transactions to retrieve",
                        minimum: 1,
                        maximum: 10
                    }
                },
                required: ["limit"]
            }
        }
    }
];

// 2. Actual JavaScript implementations
function getAccountBalance() {
    return {
        accountNumber: "XXXX1234",
        currency: "INR",
        balance: 85000
    };
}

function getRecentTransactions(limit) {
    const transactions = [
        { date: "2026-11-14", description: "Salary credit", amount: 75000 },
        { date: "2026-11-13", description: "Electricity bill", amount: -2200 },
        { date: "2026-11-12", description: "Grocery shopping", amount: -1800 },
        { date: "2026-11-11", description: "Restaurant payment", amount: -950 },
        { date: "2026-11-10", description: "Online purchase", amount: -3200 }
    ];

    return transactions.slice(0, limit);
}

// 3. Map tool names to local functions
const availableFunctions = {
    get_account_balance: () => getAccountBalance(),

    get_recent_transactions: (args) =>
        getRecentTransactions(args.limit)
};


async function main() {
    const messages = [
        {
            role: "system",
            content: "You are a helpful banking assistant. Use the available tools to answer questions about the demo account. Never invent account data."
        },
        {
            role: "user",
            content: "Show my current account balance and my 3 most recent transactions."
        }
    ];

    const MAX_ITERATIONS = 5;

    // Keep communicating with the LLM until it gives a final answer
    for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {

        console.log(`\n--- LLM iteration ${iteration} ---`);

        const response = await client.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages,
            tools,
            tool_choice: "auto",
            temperature: 0
        });

        const assistantMessage = response.choices[0].message;

        // Preserve the assistant response in conversation history
        messages.push(assistantMessage);

        console.log("LLM tool calls:",
            JSON.stringify(assistantMessage.tool_calls, null, 2)
        );

        // No more tool calls: we have the final answer
        if (!assistantMessage.tool_calls?.length) {
            console.log("\nFinal answer:");
            console.log(assistantMessage.content);
            return;
        }

        // Execute every tool requested in this response
        for (const toolCall of assistantMessage.tool_calls) {
            const functionName = toolCall.function.name;

            let args;
            try {
                args = JSON.parse(toolCall.function.arguments);
            } catch {
                throw new Error(`Invalid arguments for ${functionName}`);
            }

            console.log(`Executing tool: ${functionName}`);
            console.log("Arguments:", args);

            const selectedFunction = availableFunctions[functionName];

            if (!selectedFunction) {
                throw new Error(`Unknown tool: ${functionName}`);
            }

            const result = selectedFunction(args);

            console.log("Tool result:", result);

            // Associate result with its exact tool call
            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(result)
            });
        }
    }

    throw new Error(
        `Agent stopped: maximum of ${MAX_ITERATIONS} iterations reached`
    );
}

main().catch(console.error);

