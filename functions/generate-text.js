// --- Secure Back-End Function (e.g., /netlify/functions/generate-text.js) ---

exports.handler = async function(event) {
    const apiKey = process.env.GEMINI_API_KEY;

    // --- IMPROVEMENT 1: Check if the API key exists ---
    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "API key is not set." })
        };
    }

    try {
        const { imageData } = JSON.parse(event.body);

        const prompt = "Generate a concise and descriptive alt text for this image. The alt text should be suitable for screen readers, focusing on the main subject, setting, and context. Do not include introductory phrases like 'Image of' or 'A picture of'. Be direct and informative.";
        
        const payload = {
            contents: [{
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: "image/jpeg", data: imageData } }
                ]
            }],
        };

        // --- IMPROVEMENT 2: Use the latest, most efficient model ---
        const model = 'gemini-1.5-flash-latest';
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("API Error:", errorBody);
            return { statusCode: response.status, body: JSON.stringify(errorBody) };
        }

        const result = await response.json();
        
        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error("Function Error:", error);
        return { statusCode: 500, body: JSON.stringify({ message: "An error occurred while processing your request." }) };
    }
};