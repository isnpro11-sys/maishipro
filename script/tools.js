// --- TOOLS SYSTEM & LOGIC ---

// 1. HELPER: Download Blob (Digunakan oleh semua tools)
function downloadBlob(url, filename, downloadBtn) {
    const originalContent = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Proses...';
    downloadBtn.disabled = true;

    fetch(url, { cache: 'no-cache' }) 
        .then(response => {
            if (!response.ok) throw new Error("Gagal mengambil file");
            return response.blob();
        })
        .then(blob => {
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
            
            downloadBtn.innerHTML = '<i class="fas fa-check"></i> Selesai!';
            setTimeout(() => {
                downloadBtn.innerHTML = originalContent;
                downloadBtn.disabled = false;
            }, 1500);
        })
        .catch(err => {
            console.error("Blob Download Gagal (CORS/Network), mencoba buka tab baru:", err);
            downloadBtn.innerHTML = 'Membuka Tab...';
            setTimeout(() => {
                window.open(url, '_blank');
                downloadBtn.innerHTML = originalContent;
                downloadBtn.disabled = false;
            }, 800);
        });
}

// 2. MODAL CONTROLS
function toggleToolsMenu() {
    const modal = document.getElementById('tools-modal');
    // Jika sidebar aktif, tutup sidebar dulu
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        document.getElementById('overlay').style.display = 'none';
    }
    modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
}

function backToToolsMenu() {
    document.getElementById('active-tool-modal').style.display = 'none';
    document.getElementById('tools-modal').style.display = 'flex';
}

function openSpecificTool(toolName) {
    document.getElementById('tools-modal').style.display = 'none';
    const toolModal = document.getElementById('active-tool-modal');
    const title = document.getElementById('tool-title-display');
    const contentArea = document.getElementById('tool-content-area');
    
    title.textContent = toolName;
    contentArea.innerHTML = ''; 
    contentArea.style.display = 'block';
    contentArea.style.border = 'none';
    contentArea.style.background = 'transparent';

    // === TIKTOK LOGIC ===
    if (toolName === 'Tiktok No Watermark') {
        contentArea.innerHTML = `
            <input type="text" id="tool-url-input" class="tool-input" placeholder="Tempel Link Tiktok di sini...">
            <button class="btn-confirm-tool" onclick="downloadTikTok()">
                <i class="fas fa-download"></i> Konfirmasi
            </button>
            <div id="tool-loading" style="display:none; text-align:center; font-weight:bold; margin:10px;">
                <i class="fas fa-spinner fa-spin"></i> Sedang memproses...
            </div>
            <div id="tool-result"></div>
        `;
    } 
    // === YOUTUBE MP4 LOGIC ===
    else if (toolName === 'YTmp4') {
        contentArea.innerHTML = `
            <input type="text" id="tool-url-input" class="tool-input" placeholder="Tempel Link YouTube di sini...">
            <select id="tool-quality-input" class="tool-input" style="margin-bottom: 15px;">
                <option value="1080">1080p (FHD)</option>
                <option value="720" selected>720p (HD)</option>
                <option value="480">480p</option>
                <option value="360">360p</option>
            </select>
            <button class="btn-confirm-tool" onclick="processYoutube('mp4')">
                <i class="fas fa-video"></i> Konfirmasi MP4
            </button>
            <div id="tool-loading" style="display:none; text-align:center; font-weight:bold; margin:10px;">
                <i class="fas fa-spinner fa-spin"></i> Sedang memproses (Mohon tunggu)...
            </div>
            <div id="tool-result"></div>
        `;
    }
    // === YOUTUBE MP3 LOGIC ===
    else if (toolName === 'YTmp3') {
        contentArea.innerHTML = `
            <input type="text" id="tool-url-input" class="tool-input" placeholder="Tempel Link YouTube di sini...">
            <select id="tool-quality-input" class="tool-input" style="margin-bottom: 15px;">
                <option value="320">320kbps (High)</option>
                <option value="128" selected>128kbps (Normal)</option>
            </select>
            <button class="btn-confirm-tool" onclick="processYoutube('mp3')">
                <i class="fas fa-music"></i> Konfirmasi MP3
            </button>
            <div id="tool-loading" style="display:none; text-align:center; font-weight:bold; margin:10px;">
                <i class="fas fa-spinner fa-spin"></i> Sedang memproses (Mohon tunggu)...
            </div>
            <div id="tool-result"></div>
        `;
    }
    // === IQC (IPHONE QUOTE) LOGIC ===
    else if (toolName === 'IQC') {
        contentArea.innerHTML = `
            <input type="text" id="iqc-text-input" class="tool-input" placeholder="Masukkan kata-kata...">
            <button class="btn-confirm-tool" onclick="processIQC()">
                <i class="fas fa-image"></i> Buat Quote
            </button>
            <div id="tool-loading" style="display:none; text-align:center; font-weight:bold; margin:10px;">
                <i class="fas fa-spinner fa-spin"></i> Membuat (Tunggu sebentar)...
            </div>
            <div id="tool-result"></div>
        `;
    }
    // === REMOVE BACKGROUND LOGIC (NEW) ===
    else if (toolName === 'Remove Background') {
        contentArea.innerHTML = `
            <div style="border: 2px dashed var(--line-color); padding: 20px; text-align: center; margin-bottom: 15px; background: var(--item-bg);">
                <i class="fas fa-image" style="font-size: 30px; margin-bottom: 10px;"></i>
                <p style="font-weight: bold; font-size: 12px; margin-bottom: 10px;">Pilih Foto untuk Hapus Background</p>
                <input type="file" id="rembg-file-input" class="tool-input" accept="image/*" style="padding: 5px;">
            </div>
            <button class="btn-confirm-tool" onclick="processRemoveBackground()">
                <i class="fas fa-eraser"></i> Hapus Latar
            </button>
            <div id="tool-loading" style="display:none; text-align:center; font-weight:bold; margin:10px;">
                <i class="fas fa-spinner fa-spin"></i> Sedang memproses AI...
            </div>
            <div id="tool-result"></div>
        `;
    }
    // === TOURL (FILE UPLOADER) LOGIC ===
    else if (toolName === 'Tourl') {
        contentArea.innerHTML = `
            <div style="border: 2px dashed var(--line-color); padding: 20px; text-align: center; margin-bottom: 15px; background: var(--item-bg);">
                <i class="fas fa-cloud-upload-alt" style="font-size: 30px; margin-bottom: 10px;"></i>
                <p style="font-weight: bold; font-size: 12px; margin-bottom: 10px;">Pilih Foto/Video/File</p>
                <input type="file" id="tourl-file-input" class="tool-input" style="padding: 5px;">
            </div>
            <button class="btn-confirm-tool" onclick="processTourl()">
                <i class="fas fa-upload"></i> Upload File
            </button>
            <div id="tool-loading" style="display:none; text-align:center; font-weight:bold; margin:10px;">
                <i class="fas fa-spinner fa-spin"></i> Mengupload ke Server...
            </div>
            <div id="tool-result"></div>
        `;
    }
    
    toolModal.style.display = 'flex';
}

// 3. LOGIKA FITUR

// --- REMOVE BACKGROUND (Pixelcut API) ---
async function processRemoveBackground() {
    const fileInput = document.getElementById('rembg-file-input');
    const resultDiv = document.getElementById('tool-result');
    const loadingDiv = document.getElementById('tool-loading');

    if (fileInput.files.length === 0) { 
        showCustomToast("Pilih foto dulu!"); 
        return; 
    }

    const file = fileInput.files[0];
    loadingDiv.style.display = 'block';
    resultDiv.innerHTML = '';

    const formData = new FormData();
    formData.append('image', file);
    formData.append('format', 'png');

    try {
        const response = await fetch('https://api2.pixelcut.app/image/matte/v1', {
            method: 'POST',
            body: formData,
            headers: {
                'x-client-version': 'web' // Sesuai request snippet
            }
        });

        if (!response.ok) throw new Error("Gagal menghapus latar belakang. Coba gambar lain.");

        // API mengembalikan Blob (image binary)
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        const filename = `Maisshipro-NoBG-${Date.now()}.png`;

        loadingDiv.style.display = 'none';
        resultDiv.innerHTML = `
            <div class="tool-result-container">
                <p style="font-size:12px; font-weight:bold; margin-bottom:5px; color: green;">Berhasil Dihapus!</p>
                <div style="background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px; padding: 10px; border: 2px solid var(--line-color);">
                    <img src="${imageUrl}" style="width:100%; display:block;">
                </div>
                <button class="btn-download" style="margin-top:10px;" onclick="downloadBlob('${imageUrl}', '${filename}', this)">
                    <i class="fas fa-download"></i> Download PNG
                </button>
            </div>
        `;

    } catch (err) {
        loadingDiv.style.display = 'none';
        console.error(err);
        resultDiv.innerHTML = `<div style="color:red; font-weight:bold; text-align:center; margin-top:10px;">Error: ${err.message}</div>`;
    }
}

// --- TIKTOK LOGIC ---
async function downloadTikTok() {
    const urlInput = document.getElementById('tool-url-input').value.trim();
    const resultDiv = document.getElementById('tool-result');
    const loadingDiv = document.getElementById('tool-loading');

    if (!urlInput) { showCustomToast("Masukkan link TikTok dulu!"); return; }

    loadingDiv.style.display = 'block';
    resultDiv.innerHTML = '';

    try {
        const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(urlInput)}`;
        const response = await fetch(apiUrl);
        const res = await response.json();

        if (!res.data) throw new Error("Konten tidak ditemukan atau Link Salah!");
        const data = res.data;
        let htmlContent = `
            <div class="author-info">
                👤 ${data.author.nickname} | ❤️ ${data.digg_count}
            </div>
            <p style="font-size:12px; margin-bottom:10px;">${data.title || 'Tidak ada caption'}</p>
        `;

        if (data.images && data.images.length > 0) {
            htmlContent += `<div style="display:grid; gap:10px;">`;
            data.images.forEach((img, idx) => {
                htmlContent += `<div>
                    <img src="${img}" style="width:100%; border:2px solid #000; margin-bottom:5px;">
                    <button class="btn-download" onclick="downloadBlob('${img}', 'Maisshipro-Image-${idx+1}.jpg', this)">Download Gambar ${idx+1}</button>
                </div>`;
            });
            htmlContent += `</div>`;
        } else if (data.play) {
            htmlContent += `
                <div class="video-wrapper"><video controls src="${data.play}"></video></div>
                <button class="btn-download" onclick="downloadBlob('${data.play}', 'Maisshipro-Tiktok.mp4', this)">DOWNLOAD VIDEO</button>
            `;
        }
        resultDiv.innerHTML = `<div class="tool-result-container">${htmlContent}</div>`;
    } catch (err) {
        resultDiv.innerHTML = `<div style="color:red; font-weight:bold; text-align:center; margin-top:10px;">Error: ${err.message}</div>`;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// --- YOUTUBE LOGIC (YTmp4 & YTmp3) ---
async function processYoutube(type) {
    const urlInput = document.getElementById('tool-url-input').value.trim();
    const qualityInput = document.getElementById('tool-quality-input').value;
    const resultDiv = document.getElementById('tool-result');
    const loadingDiv = document.getElementById('tool-loading');

    if (!urlInput) { showCustomToast("Masukkan link YouTube dulu!"); return; }

    loadingDiv.style.display = 'block';
    resultDiv.innerHTML = '';

    try {
        const result = await ddownrClient(urlInput, type, qualityInput);

        if (result.status !== 200) throw new Error(result.message || "Gagal memproses video.");

        const meta = result.metadata;
        const downloadUrl = result.download;
        const ext = type === 'mp3' ? 'mp3' : 'mp4';

        let htmlContent = `
            <div class="author-info" style="text-align:center;">
                ${meta.title}
            </div>
            <div style="display:flex; justify-content:center; margin-bottom:15px;">
                <img src="${meta.image}" style="width:100%; max-width:200px; border:3px solid #000; border-radius:10px;">
            </div>
            <button class="btn-download" onclick="downloadBlob('${downloadUrl}', 'Maisshipro-${meta.title}.${ext}', this)">
                <i class="fas fa-download"></i> DOWNLOAD ${type.toUpperCase()}
            </button>
        `;
        
        resultDiv.innerHTML = `<div class="tool-result-container">${htmlContent}</div>`;

    } catch (err) {
        console.error(err);
        resultDiv.innerHTML = `<div style="color:red; font-weight:bold; text-align:center; margin-top:10px;">
            Error: ${err.message}<br>
            <span style="font-size:10px; color:#666;">(Pastikan Link benar atau coba resolusi lain)</span>
        </div>`;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

async function ddownrClient(url, type, format) {
    const videoQuality = ["1080", "720", "480", "360", "144"];
    const audioQuality = ["128", "320"];

    if (type === "mp4" && !videoQuality.includes(format)) 
        return { status: 400, message: `Format Video Tersedia: ${videoQuality.join(", ")}` };
    if (type === "mp3" && !audioQuality.includes(format)) 
        return { status: 400, message: `Format Audio Tersedia: ${audioQuality.join(", ")}` };

    const queryParams = new URLSearchParams({
        copyright: "0",
        url: url,
        api: "dfcb6d76f2f6a9894gjkege8a4ab232222"
    });

    if (type === 'mp3') {
        queryParams.append('format', 'mp3');
        queryParams.append('audio_quality', format);
    } else {
        queryParams.append('format', format);
    }

    try {
        const response = await fetch(`https://p.lbserver.xyz/ajax/download.php?${queryParams.toString()}`);
        const metadata = await response.json();

        if (!metadata.success && !metadata.progress_url) {
            return { status: 500, message: "Gagal memulai download. Server busy." };
        }

        let progress = 0;
        let jsonResult = null;
        let attempts = 0;

        while (progress < 1000 && attempts < 100) { 
            attempts++;
            await new Promise(r => setTimeout(r, 500)); 

            const pollRes = await fetch(metadata.progress_url);
            const pollData = await pollRes.json();
            
            jsonResult = pollData;
            progress = parseInt(pollData.progress) || progress;

            if (pollData.success === 1 && progress >= 1000) {
                return {
                    status: 200,
                    metadata: {
                        title: metadata.title,
                        image: metadata.info.image,
                    },
                    download: jsonResult.download_url,
                    alternatif: jsonResult.alternative_download_urls || [],
                };
            }
        }
        return { status: 500, message: "Timeout: Proses terlalu lama." };

    } catch (e) {
        console.error(e);
        return { status: 500, message: "Terjadi kesalahan jaringan (CORS/API Error)." };
    }
}

// --- IQC (IPHONE QUOTE) LOGIC ---
function processIQC() {
    const textInput = document.getElementById('iqc-text-input').value.trim();
    const resultDiv = document.getElementById('tool-result');
    const loadingDiv = document.getElementById('tool-loading');

    if (!textInput) { showCustomToast("Masukkan teks dulu!"); return; }

    loadingDiv.style.display = 'block';
    resultDiv.innerHTML = '';

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit', hour12: false
    }).replace(':', '.');
    const battery = Math.floor(Math.random() * 100) + 1;
    
    const originalUrl = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(timeStr)}&messageText=${encodeURIComponent(textInput)}&carrierName=WhatsApp&batteryPercentage=${battery}&signalStrength=4&emojiStyle=apple`;
    const downloadUrl = `https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}&output=png`;

    const img = new Image();
    
    img.onload = function() {
        loadingDiv.style.display = 'none';
        resultDiv.innerHTML = `
            <div class="tool-result-container">
                <img src="${originalUrl}" style="width:100%; border:2px solid #000; border-radius:10px; margin-bottom:10px;">
                <button class="btn-download" onclick="downloadBlob('${downloadUrl}', 'Maisshipro-IQC-${Date.now()}.png', this)">
                    <i class="fas fa-download"></i> Download Gambar
                </button>
            </div>
        `;
    };

    img.onerror = function() {
        loadingDiv.style.display = 'none';
        resultDiv.innerHTML = `<div style="color:red; font-weight:bold; text-align:center;">Gagal memuat gambar (API Error).</div>`;
    };

    img.src = originalUrl;
}

// --- TOURL (FILE UPLOADER) LOGIC ---
async function processTourl() {
    const fileInput = document.getElementById('tourl-file-input');
    const resultDiv = document.getElementById('tool-result');
    const loadingDiv = document.getElementById('tool-loading');

    if (fileInput.files.length === 0) { showCustomToast("Pilih file dulu!"); return; }

    const file = fileInput.files[0];
    loadingDiv.style.display = 'block';
    resultDiv.innerHTML = '';

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch("https://api.deline.web.id/uploader", {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.status === false) throw new Error(data.message || "Upload gagal.");

        const link = data?.result?.link || data?.url || data?.path;
        if (!link) throw new Error("Link tidak ditemukan.");

        loadingDiv.style.display = 'none';
        resultDiv.innerHTML = `
            <div class="tool-result-container">
                <p style="font-size:12px; font-weight:bold; margin-bottom:5px; color: green;">Upload Sukses!</p>
                <input type="text" class="tool-input" value="${link}" readonly style="margin-bottom:10px; font-size:12px;">
                <button class="btn-confirm-tool" onclick="copyToClipboard('${link}')">
                    <i class="fas fa-copy"></i> Salin Link
                </button>
                <button class="btn-download" onclick="window.open('${link}', '_blank')">
                    <i class="fas fa-external-link-alt"></i> Buka Link
                </button>
            </div>
        `;

    } catch (err) {
        loadingDiv.style.display = 'none';
        resultDiv.innerHTML = `<div style="color:red; font-weight:bold; text-align:center; margin-top:10px;">Error: ${err.message}</div>`;
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showCustomToast("Link berhasil disalin!");
    }).catch(err => {
        showCustomToast("Gagal menyalin link.");
    });
}
