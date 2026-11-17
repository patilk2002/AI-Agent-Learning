
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = "";

const client = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
});

// Actual tool implementation
function getWeatherDetails(city) {
    if (city.toLowerCase() === "pune") return "10C";
    if (city.toLowerCase() === "mumbai") return "20C";
    if (city.toLowerCase() === "bengaluru") return "15C";

    return "Weather information unavailable";
}

// Tell Gemini which tool is available
const tools = [{
    functionDeclarations: [{
        name: "getWeatherDetails",
        description: "Get the weather details for a given city",
        parameters: {
            type: "OBJECT",
            properties: {
                city: {
                    type: "STRING",
                    description: "Name of the city"
                }
            },
            required: ["city"]
        }
    }]
}];

async function main() {

    const user = "Hey, what is the weather of Pune?";

    // Step 1: Send user request and tool definition
    const response = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: user,
        config: {
            tools: tools
        }
    });

    // Step 2: Check whether Gemini wants to call a function
    const functionCall = response.functionCalls?.[0];

    if (!functionCall) {
        console.log(response.text);
        return;
    }

    console.log("Tool requested:", functionCall.name);
    console.log("Arguments:", functionCall.args);

    // Step 3: Execute the actual JavaScript function
    let toolResult;

    if (functionCall.name === "getWeatherDetails") {
        toolResult = getWeatherDetails(functionCall.args.city);
    }

    console.log("Tool result:", toolResult);

    // Step 4: Send tool result back to Gemini
    const finalResponse = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
            {
                role: "user",
                parts: [{ text: user }]
            },
            response.candidates[0].content,
            {
                role: "user",
                parts: [{
                    functionResponse: {
                        name: functionCall.name,
                        response: {
                            result: toolResult
                        }
                    }
                }]
            }
        ],
        config: {
            tools: tools
        }
    });

    // Step 5: Print Gemini's final response
    console.log("Final response:", finalResponse.text);
}

main().catch(console.error);
