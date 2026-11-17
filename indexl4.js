
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

// controlled tool executor
async function executeTool(toolCall) {
    const functionName = toolCall.function.name;

    // 1. Check whether the requested tool is allowed
    const selectedFunction = availableFunctions[functionName];

    if (!selectedFunction) {
        return {
            success: false,
            error: `Tool '${functionName}' is not permitted.`
        };
    }

    // 2. Parse arguments safely
    let args;

    try {
        args = JSON.parse(toolCall.function.arguments || "{}");
    } catch {
        return {
            success: false,
            error: "Invalid JSON arguments."
        };
    }

    // 3. Validate arguments before execution
    if (functionName === "get_recent_transactions") {
        if (
            !Number.isInteger(args.limit) ||
            args.limit < 1 ||
            args.limit > 10
        ) {
            return {
                success: false,
                error: "Limit must be an integer between 1 and 10."
            };
        }
    }

    // 4. Execute the function and handle failures
    try {
        const result = await selectedFunction(args);

        return {
            success: true,
            data: result
        };

    } catch (error) {
        console.error("Tool execution failed:", error);

        return {
            success: false,
            error: "The requested tool failed to execute."
        };
    }
}


async function runAgent(userInput) {

    const messages = [
        {
            role: "system",
            content: `
                You are a banking assistant.

                Use available tools to retrieve account information.
                Never invent transaction or account data.
                If a tool fails, explain the problem honestly.
                Never claim that an operation succeeded unless
                the tool result confirms it.
            `
        },
        {
            role: "user",
            content: userInput
        }
    ];

    const MAX_ITERATIONS = 5;

    for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {

        console.log(`\nAgent iteration: ${iteration}`);

        const response = await client.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages,
            tools,
            tool_choice: "auto",
            temperature: 0
        });

        const assistantMessage = response.choices[0].message;

        // Preserve the assistant response
        messages.push(assistantMessage);

        // Check whether the agent wants to execute tools
        const toolCalls = assistantMessage.tool_calls || [];

        if (toolCalls.length === 0) {
            console.log("\nAgent final response:");
            console.log(assistantMessage.content);
            return assistantMessage.content;
        }

        // Prevent excessive tool execution within one response
        if (toolCalls.length > 3) {
            throw new Error("Too many tool calls in one iteration.");
        }

        // Execute requested tools
        for (const toolCall of toolCalls) {

            console.log(
                `Agent requested: ${toolCall.function.name}`
            );

            const result = await executeTool(toolCall);

            console.log("Execution result:", result);

            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(result)
            });
        }
    }

    throw new Error("Agent reached its maximum iteration limit.");
}

// Run the agent
runAgent(
    "Show my 20 latest transactions"
).catch(console.error);


