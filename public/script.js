const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('drop-zone');
const loader = document.getElementById('loader');
const uploadContent = document.querySelector('.upload-content');
const resultSection = document.getElementById('result-section');

// Slider Elements
const sliderRange = document.getElementById('slider-range');
const imgForeground = document.getElementById('img-foreground');
const sliderButton = document.getElementById('slider-button');
const imgBefore = document.getElementById('img-before');
const imgAfter = document.getElementById('img-after');
const downloadBtn = document.getElementById('download-btn');

// --- SLIDER LOGIC ---
sliderRange.addEventListener('input', (e) => {
    const value = e.target.value;
    imgForeground.style.width = `${value}%`;
    sliderButton.style.left = `${value}%`;
});

// --- UPLOAD LOGIC ---
fileInput.addEventListener('change', () => {
    if (fileInput.files.length) processFile(fileInput.files[0]);
});

async function processFile(file) {
    if (!file.type.match('image.*')) {
        alert("Wajib upload file gambar!");
        return;
    }

    // UI Loading State
    uploadContent.classList.add('hidden');
    loader.classList.remove('hidden');

    // 1. Set Preview Gambar Asli (Before)
    const reader = new FileReader();
    reader.onload = (e) => {
        imgBefore.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // 2. Upload ke Backend
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/api/remove', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && (data.url || data.low_resolution)) {
            const resultUrl = data.url || data.low_resolution;
            
            // Set Hasil (After)
            imgAfter.src = resultUrl;
            downloadBtn.href = resultUrl;

            // Tampilkan Result
            dropZone.classList.add('hidden');
            resultSection.classList.remove('hidden');
        } else {
            throw new Error(data.error || "Gagal memproses gambar");
        }
    } catch (error) {
        console.error(error);
        alert("Gagal: " + error.message);
        resetApp();
    }
}

function resetApp() {
    fileInput.value = '';
    loader.classList.add('hidden');
    uploadContent.classList.remove('hidden');
    dropZone.classList.remove('hidden');
    resultSection.classList.add('hidden');
    
    // Reset Slider
    sliderRange.value = 50;
    imgForeground.style.width = '50%';
    sliderButton.style.left = '50%';
}
