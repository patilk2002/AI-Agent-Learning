
const API_KEY = "";

async function askGemini(prompt) {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data, null, 2));
  }

  return data.candidates?.[0]?.content?.parts
    ?.map(p => p.text || "")
    .join("") || "";
}

(async () => {
  try {
    const result = await askGemini("Explain Kafka in simple terms");
    console.log(result);
  } catch (error) {
    console.error("Gemini API Error:", error.message);
  }
})();
