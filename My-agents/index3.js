
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = "";

const client = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
});

// Tools

function getWeatherDetails(city) {

    if (city.toLowerCase() === "pune") return "10C";
    if (city.toLowerCase() === "mumbai") return "20C";
    if (city.toLowerCase() === "benglore") return "15C";

}

const user = "Hey, What is the weather of Pune ?";

client.models.generateContent({
    model: "gemini-3.8-flash",
    contents: [
        {
            role: "user",
            parts: [{ text: user }]
        }
    ]
}).then(response => {
    console.log(response.text);
}).catch(console.error);
