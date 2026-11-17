
const API_KEY = process.env.GEMINI_API_KEY;

async function testGemini() {
    try {
        console.log('1. Starting direct Gemini API test...');

        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': API_KEY
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: 'Reply with exactly: Hello Kiran!'
                        }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 100
                    }
                }),
                signal: AbortSignal.timeout(20000)
            }
        );

        console.log('2. HTTP Status:', response.status);

        const data = await response.json();

        console.log('3. API Response:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('TEST FAILED:', error.name, error.message);
    }
}

testGemini();
