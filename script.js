// --- DOM Element Selection ---
const imageUploader = document.getElementById('image-uploader');
const fileInput = document.getElementById('file-input');
const uploadPrompt = document.getElementById('upload-prompt');
const changeImagePrompt = document.getElementById('change-image-prompt');
const generateBtn = document.getElementById('generate-btn');
const btnText = document.getElementById('btn-text');
const btnLoader = document.getElementById('btn-loader');
const btnIcon = document.getElementById('btn-icon');
const initialStateText = document.getElementById('initial-state-text');
const resultArea = document.getElementById('result-area');
const altTextResult = document.getElementById('alt-text-result');
const copyBtn = document.getElementById('copy-btn');
const copyIcon = document.getElementById('copy-icon');
const checkIcon = document.getElementById('check-icon');
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');

let base64ImageData = null;

// --- Event Listeners ---

// Handle clicking on the uploader area to open file dialog
imageUploader.addEventListener('click', () => fileInput.click());

// Handle drag and drop events for the uploader
imageUploader.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    imageUploader.classList.add('dragover');
});

imageUploader.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    imageUploader.classList.remove('dragover');
});

imageUploader.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    imageUploader.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// Handle file selection from the file input dialog
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// Handle the "Generate" button click
generateBtn.addEventListener('click', async () => {
    if (!base64ImageData) {
        showMessage('Please select an image first.', 'error');
        return;
    }
    
    setLoadingState(true);

    try {
        const altText = await generateAltText(base64ImageData);
        altTextResult.textContent = altText;
        initialStateText.classList.add('hidden');
        resultArea.classList.remove('hidden');
        resultArea.classList.add('fade-in');
    } catch (error) {
        console.error('Error generating alt text:', error);
        showMessage('Failed to generate text. The model may be overloaded. Please try again.', 'error');
    } finally {
        setLoadingState(false);
    }
});

// Handle the "Copy" button click
copyBtn.addEventListener('click', () => {
    const textToCopy = altTextResult.textContent;
    // Using the Clipboard API for modern browsers
    navigator.clipboard.writeText(textToCopy).then(() => {
        copyIcon.classList.add('hidden');
        checkIcon.classList.remove('hidden');
        setTimeout(() => {
            copyIcon.classList.remove('hidden');
            checkIcon.classList.add('hidden');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showMessage('Failed to copy text.', 'error');
    });
});


// --- Core Functions ---

/**
 * Processes the selected image file.
 * @param {File} file The image file.
 */
function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showMessage('Please select a valid image file.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        // Set the uploader background to the image preview
        imageUploader.style.backgroundImage = `url('${e.target.result}')`;
        imageUploader.classList.remove('border-dashed');
        
        // Update UI prompts
        uploadPrompt.classList.add('hidden');
        changeImagePrompt.classList.remove('hidden');

        // Store image data and enable button
        base64ImageData = e.target.result.split(',')[1];
        generateBtn.disabled = false;
        
        // Hide previous results
        resultArea.classList.add('hidden');
        initialStateText.classList.remove('hidden');
    };
    reader.onerror = () => {
        console.error('Error reading file.');
        showMessage('Could not read the selected file.', 'error');
    };
    reader.readAsDataURL(file);
}

/**
 * Calls the Gemini API to generate alt text.
 * @param {string} imageData Base64 encoded image data.
 * @returns {Promise<string>} The generated alt text.
 */
async function generateAltText(imageData) {
    const prompt = "Generate a concise and descriptive alt text for this image. The alt text should be suitable for screen readers Like Jaws and others, focusing on the main subject, setting, and context. Do not include introductory phrases like 'Image of' or 'A picture of'. Be direct and informative.";

    const payload = {
        contents: [{
            parts: [
                { text: prompt },
                { inlineData: { mimeType: "image/jpeg", data: imageData } }
            ]
        }],
    };

    const apiKey = "AIzaSyBupM9Ei4g5Q7xlh2-oW3i3NwCY5blqGOU"; // API key is handled by the environment
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("API Error Response:", errorBody);
        throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();
    
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        return result.candidates[0].content.parts[0].text.trim();
    } else {
        console.error("Unexpected API response structure:", result);
        throw new Error("Could not extract text from the API response.");
    }
}

/**
 * Manages the UI loading state of the generate button.
 * @param {boolean} isLoading True if loading, false otherwise.
 */
function setLoadingState(isLoading) {
    generateBtn.disabled = isLoading;
    if (isLoading) {
        btnText.classList.add('hidden');
        btnIcon.classList.add('hidden');
        btnLoader.classList.remove('hidden');
    } else {
        btnText.classList.remove('hidden');
        btnIcon.classList.remove('hidden');
        btnLoader.classList.add('hidden');
    }
}

/**
 * Displays a temporary message to the user.
 * @param {string} message The message to display.
 * @param {'success'|'error'} type The type of message.
 */
function showMessage(message, type = 'error') {
    messageText.textContent = message;
    
    messageBox.classList.remove('bg-red-600', 'bg-green-600');
    if (type === 'success') {
        messageBox.classList.add('bg-green-600');
    } else {
        messageBox.classList.add('bg-red-600');
    }

    messageBox.classList.remove('hidden');
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 3000);
}
