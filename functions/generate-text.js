// functions/generate-text.js

exports.handler = async function (event) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { Allow: 'POST', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Method not allowed, use POST.' }),
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'API key is not set.' }),
    };
  }

  let imageData;
  try {
    const body = JSON.parse(event.body || '{}');
    imageData = body.imageData;
    if (!imageData || typeof imageData !== 'string') {
      throw new Error('imageData missing or invalid');
    }
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Bad request', error: err.message }),
    };
  }

  // Prompt: concise descriptive alt text
  const prompt = `Generate a single concise descriptive alt text for the image. Start with "Image of" or "A photo of", mention the main subject and any obvious context, and keep it under 125 characters. Example: "Image of a student working on a laptop in a dorm room."`;

  // Gemini model and endpoint
  const model = 'gemini-1.5-flash-latest';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Build payload per Gemini v1beta generateContent shape
  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          // Assuming JPEG; if you want to support other types, have the frontend send file.type too
          { inlineData: { mimeType: 'image/jpeg', data: imageData } },
        ],
      },
    ],
    candidateCount: 1,
    temperature: 0.2,
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Gemini API error', detail: errText }),
      };
    }

    const result = await response.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Function Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Internal error while contacting Gemini.',
        error: error.message,
      }),
    };
  }
};
