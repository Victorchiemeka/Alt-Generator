// DOM refs
const fileInput = document.getElementById('file-input');
const uploader = document.getElementById('image-uploader');
const generateBtn = document.getElementById('generate-btn');
const altTextResult = document.getElementById('alt-text-result');
const resultArea = document.getElementById('result-area');
const initialStateText = document.getElementById('initial-state-text');
const btnLoader = document.getElementById('btn-loader');
const btnText = document.getElementById('btn-text');
const copyBtn = document.getElementById('copy-btn');
const copyIcon = document.getElementById('copy-icon');
const checkIcon = document.getElementById('check-icon');
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');
const uploadPrompt = document.getElementById('upload-prompt');
const changeImagePrompt = document.getElementById('change-image-prompt');

let currentImageData = null;

function showMessage(msg, type = 'info', duration = 3000) {
    messageText.textContent = msg;
    messageBox.classList.remove('hidden');
    messageBox.style.backgroundColor = type === 'error' ? '#b91c1c' : '#166534';
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, duration);
}

function setLoading(loading) {
    if (loading) {
        generateBtn.disabled = true;
        btnLoader.classList.remove('hidden');
        btnText.textContent = 'Generating...';
    } else {
        generateBtn.disabled = false;
        btnLoader.classList.add('hidden');
        btnText.textContent = 'Generate Text';
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result;
            const base64 = dataUrl.split(',')[1]; // strip prefix
            resolve(base64);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

async function callGenerateAltText(imageData) {
    const response = await fetch('/.netlify/functions/generate-text', { // <--- corrected path
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData })
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error ${response.status}: ${text}`);
    }
    const result = await response.json();
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        return result.candidates[0].content.parts[0].text.trim();
    }
    console.error('Unexpected API shape', result);
    throw new Error('No alt text returned');
}

async function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showMessage('Please upload an image file.', 'error');
        return;
    }
    try {
        const base64 = await fileToBase64(file);
        currentImageData = base64;

        // show preview
        uploader.style.backgroundImage = `url(${URL.createObjectURL(file)})`;
        uploadPrompt.classList.add('hidden');
        changeImagePrompt.classList.remove('hidden');
        generateBtn.disabled = false;
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
        uploader.classList.add('dragover');
    });
});
['dragleave', 'drop'].forEach(evt => {
    uploader.addEventListener(evt, e => {
        e.preventDefault();
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
        const altText = await callGenerateAltText(currentImageData);
        altTextResult.textContent = altText;
        initialStateText.classList.add('hidden');
        resultArea.classList.remove('hidden');
        showMessage('Alt text generated');
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
        }, 1200);
    } catch {
        showMessage('Copy failed', 'error');
    }
});
