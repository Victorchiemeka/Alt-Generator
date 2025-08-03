async function generateAltText(imageData) {
    // The API call now goes to YOUR function, not Google's.
    const response = await fetch('/.netlify/functions/generate-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageData })
});

    if (!response.ok) {
        // Handle errors returned from your own function.
        throw new Error(`Request to our server failed with status ${response.status}`);
    }

    const result = await response.json();

    // The logic to extract the text remains the same.
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        return result.candidates[0].content.parts[0].text.trim();
    } else {
        console.error("Unexpected API response structure:", result);
        throw new Error("Could not extract text from the API response.");
    }
}