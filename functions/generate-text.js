exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Only POST allowed' }),
        };
    }

    const apiKey = process.env.Altformat;
    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'API key is not set.' }),
        };
    }

    try {
        const { imageData, mimeType } = JSON.parse(event.body);
        if (!imageData) {
            return { statusCode: 400, body: JSON.stringify({ message: 'imageData is required.' }) };
        }

        const prompt = "Generate a concise and descriptive alt text for this image. The alt text should be suitable for screen readers, focusing on the main subject, setting, and context. Do not include introductory phrases like 'Image of' or 'A picture of'. Be direct and informative.";

        const payload = {
            contents: [{
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageData } }
                ]
            }],
            generationConfig: {
                temperature: 0.4,
                candidateCount: 1,
                maxOutputTokens: 80,
            }
        };

        const model = 'gemini-1.5-flash-latest';
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Gemini API Error:', result);
            const errorMessage = result?.error?.message || 'Failed to generate text.';
            return { statusCode: response.status, body: JSON.stringify({ message: errorMessage }) };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error('Function Error:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'An internal error occurred.' }) };
    }
};
