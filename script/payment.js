const paymentData = {
    qris: {
        title: "QRIS ALLPAYMENT",
        imageUrl: "https://api.deline.web.id/2TsCnpkhPa.jpg", 
        filename: "Maisshipro-QRIS.png"
    },
    wallets: [
        {
            name: "DANA",
            number: "08988685425",
            logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Logo_dana_blue.svg/512px-Logo_dana_blue.svg.png"
        },
        {
            name: "GOPAY",
            number: "08988685425",
            logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg"
        },
        {
            name: "SHOPEEPAY",
            number: "08988685425",
            logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Shopee.svg/2560px-Shopee.svg.png"
        }
    ]
};

function goToPayment() {
    toggleSidebar();
    startProcess('payment'); 
}

function renderPaymentContent() {
    const container = document.getElementById('payment-content');
    
    let html = `
        <div class="content-box">
            <h1 class="welcome-text">${paymentData.qris.title}</h1>
            <div class="qris-container">
                <img src="${paymentData.qris.imageUrl}" alt="QRIS" class="qris-img">
            </div>
            
            <button id="btn-download-qris" class="btn-checkout active" style="margin-bottom: 20px;" 
                onclick="downloadQrisBlob('${paymentData.qris.imageUrl}', '${paymentData.qris.filename}')">
                <i class="fas fa-download"></i> DOWNLOAD QRIS
            </button>
            
            <div style="width: 100%; border-top: 4px solid var(--line-color); margin-bottom: 20px;"></div>
    `;

    paymentData.wallets.forEach(wallet => {
        html += `
            <div class="wallet-row">
                <div class="wallet-left">
                    <img src="${wallet.logo}" alt="${wallet.name}" class="wallet-logo">
                    <div class="wallet-info">
                        <span class="wallet-name">${wallet.name}</span>
                        <span class="wallet-number">${wallet.number}</span>
                    </div>
                </div>
                <button class="btn-copy-sm" onclick="copyNumber('${wallet.number}')">
                    <i class="fas fa-copy"></i> SALIN
                </button>
            </div>
        `;
    });

    html += `</div>`; // Tutup content-box
    container.innerHTML = html;
}

function downloadQrisBlob(url, filename) {
    const btn = document.getElementById('btn-download-qris');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MEMPROSES...';
    btn.style.pointerEvents = 'none';

    fetch(url, { cache: 'no-cache' })
        .then(response => {
            if (!response.ok) throw new Error("Gagal mengambil gambar");
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

            btn.innerHTML = '<i class="fas fa-check"></i> BERHASIL!';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.pointerEvents = 'auto';
            }, 1500);
        })
        .catch(err => {
            console.error(err);
            btn.innerHTML = 'GAGAL (Coba Manual)';
            setTimeout(() => {
                window.open(url, '_blank');
                btn.innerHTML = originalText;
                btn.style.pointerEvents = 'auto';
            }, 1000);
        });
}

function copyNumber(text) {
    navigator.clipboard.writeText(text).then(() => {
        showCustomToast("Nomor berhasil disalin!");
    }).catch(err => {
        showCustomToast("Gagal menyalin nomor.");
    });
}
