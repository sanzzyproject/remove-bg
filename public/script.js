const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('drop-zone');
const resultSection = document.getElementById('result-section');
const resultBox = document.getElementById('result-box');
const loader = document.getElementById('loader');
const originalImg = document.getElementById('original-img');
const resultImg = document.getElementById('result-img');
const downloadBtn = document.getElementById('download-btn');

// Drag & Drop Effects
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length) handleFile(files[0]);
});

// File Input Change
fileInput.addEventListener('change', () => {
    if (fileInput.files.length) handleFile(fileInput.files[0]);
});

function handleFile(file) {
    if (!file.type.match('image.*')) {
        alert("Mohon upload file gambar (JPG/PNG)");
        return;
    }

    // Tampilkan Preview Original
    const reader = new FileReader();
    reader.onload = (e) => {
        originalImg.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // Persiapkan UI
    resultSection.classList.remove('hidden');
    loader.classList.remove('hidden');
    resultBox.classList.add('hidden');
    
    // Scroll ke bawah sedikit
    resultSection.scrollIntoView({ behavior: 'smooth' });

    uploadToServer(file);
}

async function uploadToServer(file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/api/remove', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.url || data.low_resolution) {
            // Sukses
            const finalUrl = data.url || data.low_resolution; // Prioritaskan URL utama
            resultImg.src = finalUrl;
            downloadBtn.href = finalUrl;
            
            loader.classList.add('hidden');
            resultBox.classList.remove('hidden');
        } else {
            throw new Error("Gagal mendapatkan URL gambar");
        }

    } catch (error) {
        console.error(error);
        alert("Maaf, terjadi kesalahan saat memproses gambar.");
        loader.classList.add('hidden');
        resultSection.classList.add('hidden');
    }
}
