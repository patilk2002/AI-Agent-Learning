
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({
    apiKey: ""
});

// Function declaration
const tools = [
    {
        functionDeclarations: [
            {
                name: "getWeatherDetails",
                description: "Get weather details for a city",
                parametersJsonSchema: {
                    type: "object",
                    properties: {
                        city: {
                            type: "string",
                            description: "The city name"
                        }
                    },
                    required: ["city"]
                }
            }
        ]
    }
];

async function main() {

    try {

        const response = await client.models.generateContent({
            model: "gemini-3.8-flash",
            contents: "What is the weather in Pune? Use getWeatherDetails.",
            config: {
                tools: tools,
                toolConfig: {
                    functionCallingConfig: {
                        mode: "ANY",
                        allowedFunctionNames: ["getWeatherDetails"]
                    }
                }
            }
        });

        console.log("\n--- COMPLETE RESPONSE ---");
        console.dir(response, { depth: null });

        console.log("\n--- FUNCTION CALLS ---");
        console.dir(response.functionCalls, { depth: null });

        console.log("\n--- TEXT ---");
        console.log(response.text);

    } catch (error) {
        console.error("ERROR:", error);
    }
}

main();
