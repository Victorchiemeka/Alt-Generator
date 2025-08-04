// functions/generate-text.js

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { Allow: 'POST', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Only POST allowed' }),
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
  let mimeType = 'image/jpeg'; // default
  try {
    const body = JSON.parse(event.body || '{}');
    imageData = body.imageData;
    if (body.mimeType) mimeType = body.mimeType;
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

  const prompt = `Generate a single concise descriptive alt text for the image. Start with "Image of" or "A photo of", mention the main subject and any obvious context, and keep it under 125 characters.`;

  const model = 'gemini-2.0-flash'; // or another available Gemini model
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: imageData } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      candidateCount: 1,
      maxOutputTokens: 60, // adjust if you want longer/shorter alt text
    },
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    if (!response.ok) {
      console.error('Gemini API error:', response.status, text);
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Gemini API error', detail: text }),
      };
    }

    // forward the full Gemini response
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: text,
    };
  } catch (error) {
    console.error('Function error:', error);
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
