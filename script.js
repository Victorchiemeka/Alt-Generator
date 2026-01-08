// DOM refs
const fileInput = document.getElementById('file-input');
const uploader = document.getElementById('image-uploader');
const generateBtn = document.getElementById('generate-btn');
const altTextResult = document.getElementById('alt-text-result');
const resultArea = document.getElementById('result-area');
const initialStateText = document.getElementById('initial-state-text');
const btnLoader = document.getElementById('btn-loader');
const btnText = document.getElementById('btn-text');
const btnIcon = document.getElementById('btn-icon');
const copyBtn = document.getElementById('copy-btn');
const copyIcon = document.getElementById('copy-icon');
const checkIcon = document.getElementById('check-icon');
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');
const uploadPrompt = document.getElementById('upload-prompt');
const changeImagePrompt = document.getElementById('change-image-prompt');

let currentImageData = null;

function showMessage(msg, type = 'error', duration = 3000) {
    messageText.textContent = msg;
    messageBox.classList.remove('hidden', 'bg-red-600', 'bg-green-600');

    if (type === 'success') {
        messageBox.classList.add('bg-green-600');
    } else {
        messageBox.classList.add('bg-red-600');
    }

    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, duration);
}

function setLoading(loading) {
    generateBtn.disabled = loading;
    
    // Disable the uploader to prevent race conditions
    if (loading) {
        uploader.style.pointerEvents = 'none';
        uploader.style.opacity = '0.6';
        btnLoader.classList.remove('hidden');
        btnIcon.classList.add('hidden');
        btnText.textContent = 'Generating...';
    } else {
        uploader.style.pointerEvents = 'auto';
        uploader.style.opacity = '1';
        btnLoader.classList.add('hidden');
        btnIcon.classList.remove('hidden');
        btnText.textContent = 'Generate Text';
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result;
            const base64 = dataUrl.split(',')[1];
            resolve({ base64: base64, mimeType: file.type, preview: dataUrl });
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

async function callGenerateAltText(imageData, mimeType) {
    const response = await fetch('/.netlify/functions/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData, mimeType })
    });

    const result = await response.json();

    if (!response.ok) {
        const errorMessage = result?.error?.message || 'The request to the server failed.';
        throw new Error(errorMessage);
    }

    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        return result.candidates[0].content.parts[0].text.trim();
    }
    
    console.error('Unexpected API shape', result);
    throw new Error('Could not extract alt text from the API response.');
}

async function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showMessage('Please upload an image file.', 'error');
        return;
    }
    try {
        const { base64, mimeType, preview } = await fileToBase64(file);
        currentImageData = { data: base64, type: mimeType };

        uploader.style.backgroundImage = `url(${preview})`;
        uploadPrompt.classList.add('hidden');
        changeImagePrompt.classList.remove('hidden');
        uploader.classList.remove('border-dashed');
        generateBtn.disabled = false;

        resultArea.classList.add('hidden');
        initialStateText.classList.remove('hidden');
    } catch (err) {
        console.error(err);
        showMessage('Failed to read image.', 'error');
    }
}

// Event hookups
uploader.addEventListener('click', () => fileInput.click());

['dragenter', 'dragover'].forEach(evt => {
    uploader.addEventListener(evt, e => {
        e.preventDefault();
        e.stopPropagation();
        uploader.classList.add('dragover');
    });
});
['dragleave', 'drop'].forEach(evt => {
    uploader.addEventListener(evt, e => {
        e.preventDefault();
        e.stopPropagation();
        uploader.classList.remove('dragover');
    });
});
uploader.addEventListener('drop', async e => {
    if (e.dataTransfer.files[0]) {
        await handleFile(e.dataTransfer.files[0]);
    }
});
fileInput.addEventListener('change', async e => {
    if (e.target.files[0]) {
        await handleFile(e.target.files[0]);
    }
});

generateBtn.addEventListener('click', async () => {
    if (!currentImageData) return;
    setLoading(true);
    try {
        const altText = await callGenerateAltText(currentImageData.data, currentImageData.type);
        altTextResult.textContent = altText;
        initialStateText.classList.add('hidden');
        resultArea.classList.remove('hidden');
        resultArea.classList.add('fade-in');
        showMessage('Alt text generated!', 'success');
    } catch (err) {
        console.error(err);
        showMessage(err.message, 'error');
    } finally {
        setLoading(false);
    }
});

copyBtn.addEventListener('click', async () => {
    const text = altTextResult.textContent;
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        checkIcon.classList.remove('hidden');
        copyIcon.classList.add('hidden');
        setTimeout(() => {
            checkIcon.classList.add('hidden');
            copyIcon.classList.remove('hidden');
        }, 2000);
    } catch {
        showMessage('Copy failed.', 'error');
    }
});