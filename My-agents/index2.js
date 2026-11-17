
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    timeout: 30000,
    maxRetries: 0
});

async function main() {
    try {
        console.log('Sending request to Gemini...');
        console.time('Gemini API');

        const response = await client.chat.completions.create({
            model: 'gemini-3.8-flash',
            messages: [
                {
                    role: 'user',
                    content: 'Reply with exactly: Hello Kiran!'
                }
            ],
            max_tokens: 100,
            extra_body: {
                google: {
                    thinking_config: {
                        thinking_level: 'low'
                    }
                }
            }
        });

        console.timeEnd('Gemini API');

        console.log('Response:', response.choices[0].message.content);

    } catch (error) {
        console.log('Error name:', error.name);
        console.log('Error status:', error.status);
        console.log('Error message:', error.message);
    }
}

main();
