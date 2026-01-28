let currentTheme = localStorage.getItem('maisshipro_theme') || 'light';

// --- VARIABEL UNTUK PAGINATION (HALAMAN) ---
let productPage = 1;
const productsPerPage = 4; // Menampilkan 4 produk per halaman
let cartItems = []; // Array untuk menyimpan data pesanan
let orderPage = 1;
const ordersPerPage = 4; // Menampilkan 4 pesanan per halaman

window.onload = function() {
    // Cek URL Param terlebih dahulu
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = urlParams.get('page');

    if (currentPage === 'belanja') {
        showMainContent('belanja');
    } else if (currentPage === 'payment') {
        showMainContent('payment');
    } else if (currentPage === 'ripper') {
        showMainContent('ripper'); 
    } else if (localStorage.getItem('maisshipro_status') === 'masuk') {
        // Default behavior jika ada history login tapi tanpa parameter spesifik
        showMainContent('belanja'); 
    }

    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    }
    renderProducts(); 
    checkValidation(); 
    renderOrderItems(); // Render awal (menampilkan teks kosong)

    // CEK PENGUMUMAN POPUP (BARU)
    // Dipanggil dari ripper.js
    if (typeof checkAndShowAnnouncement === 'function') {
        setTimeout(checkAndShowAnnouncement, 1500); 
    }
}

// --- FUNGSI NOTIFIKASI BARU (TOP CENTER) ---
function showAlert(title, message, type = 'info') {
    const container = document.getElementById('notification-area');
    
    const alertBox = document.createElement('div');
    alertBox.className = `custom-alert ${type}`;
    
    // Icon berdasarkan tipe
    let icon = '<i class="fas fa-info-circle" style="color:#3b82f6; font-size:24px;"></i>';
    if(type === 'success') icon = '<i class="fas fa-check-circle" style="color:#22c55e; font-size:24px;"></i>';
    if(type === 'error') icon = '<i class="fas fa-exclamation-circle" style="color:#ef4444; font-size:24px;"></i>';

    alertBox.innerHTML = `
        ${icon}
        <div class="alert-content">
            <span class="alert-title">${title}</span>
            <span class="alert-msg">${message}</span>
        </div>
    `;

    container.appendChild(alertBox);

    // Hapus otomatis setelah 3 detik
    setTimeout(() => {
        alertBox.style.animation = 'fadeOutUp 0.5s ease forwards';
        setTimeout(() => {
            alertBox.remove();
        }, 500);
    }, 3000);
}

// Update showCustomToast agar pakai style baru
function showCustomToast(message) {
    showAlert("Info", message, "info");
}

// --- FUNGSI RESET & UI DASAR ---
function resetOrderForm() {
    document.getElementById('username').value = '';
    document.getElementById('whatsapp').value = '';
    
    // Reset Sistem Transaksi
    selectSystem('direct');

    // Reset Cart & Halaman
    cartItems = [];
    orderPage = 1;
    renderOrderItems();
    
    checkValidation();
    closeCheckoutModal();
}

function handleWhatsAppClick() { setTimeout(resetOrderForm, 1000); }

function goToShop(toggle = true) {
    if(toggle) toggleSidebar();
    startProcess('belanja');
}

function goToRipper(toggle = true) {
    if(toggle) toggleSidebar();
    startProcess('ripper');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
    const overlay = document.getElementById('overlay');
    overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
    if (sidebar.classList.contains('active')) {
        const btns = document.querySelectorAll('.side-btn');
        btns.forEach((btn, index) => {
            btn.style.animation = 'none'; btn.offsetHeight; 
            btn.style.animation = `slideInLeft 0.4s ease forwards ${index * 0.1}s`;
        });
    }
}

function toggleOwnerMenu() {
    const menu = document.getElementById('owner-menu');
    const icon = document.getElementById('owner-icon');
    const isHidden = menu.style.display === 'none' || menu.style.display === '';
    menu.style.display = isHidden ? 'block' : 'none';
    if(isHidden) icon.classList.add('up'); else icon.classList.remove('up');
}

// --- SISTEM TRANSAKSI LOGIC ---
function toggleSystemList() {
    const options = document.getElementById('system-options');
    const icon = document.getElementById('system-icon');
    const isClosed = options.style.display === 'none' || options.style.display === '';
    
    options.style.display = isClosed ? 'block' : 'none';
    if (isClosed) {
        icon.classList.add('rotate-180');
    } else {
        icon.classList.remove('rotate-180');
    }
}

function selectSystem(type) {
    const display = document.getElementById('system-display-text');
    const inputVal = document.getElementById('system-value');
    const adminBox = document.getElementById('admin-input-box');
    const adminInput = document.getElementById('admin-number');

    inputVal.value = type;

    if (type === 'mc') {
        display.textContent = "MC / MM / Rekber";
        adminBox.style.display = 'block';
    } else {
        display.textContent = "Direct (Langsung ke owner)";
        adminBox.style.display = 'none';
        adminInput.value = ''; // Kosongkan jika kembali ke direct
    }

    // Tutup dropdown dan validasi ulang
    toggleSystemList();
    checkValidation();
}

// --- VALIDASI & PESANAN ---
function checkValidation() {
    const name = document.getElementById('username').value.trim();
    const wa = document.getElementById('whatsapp').value.trim();
    
    // Cek Sistem & Admin Number
    const systemType = document.getElementById('system-value').value;
    const adminNum = document.getElementById('admin-number').value.trim();

    // Hitung item berdasarkan array cartItems
    const itemCount = cartItems.length;
    
    const btn = document.getElementById('btn-checkout');
    
    let isSystemValid = true;
    if (systemType === 'mc' && adminNum === '') {
        isSystemValid = false;
    }

    if (name !== '' && wa !== '' && itemCount > 0 && isSystemValid) {
        btn.classList.add('active'); 
    } else {
        btn.classList.remove('active'); 
    }
}

function getFormattedMessage(platform) {
    const name = document.getElementById('username').value.trim();
    const waNum = document.getElementById('whatsapp').value.trim();
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('id-ID', options);
    
    // -- LOGIKA TEXT SISTEM --
    const systemType = document.getElementById('system-value').value;
    const adminNum = document.getElementById('admin-number').value.trim();
    
    let systemText = "";
    if (systemType === 'direct') {
        systemText = "Direct";
    } else {
        if (platform === 'telegram') {
            systemText = "MC/MM/REKBER";
        } else {
            systemText = `MC/MM/REKBER | Wa.me/${adminNum}`;
        }
    }

    // -- GENERATE LIST PRODUK DARI ARRAY --
    let productListText = "";
    let totalPrice = 0;
    
    cartItems.forEach((item, index) => {
        productListText += `${index + 1}. ${item.name} - ${item.variant} (Rp ${item.price.toLocaleString('id-ID')})\n`;
        totalPrice += item.price;
    });

    let contactInfo = platform === 'telegram' ? "Telegram" : `Wa.me/${waNum}`;
    
    return `𝗞𝗢𝗡𝗙𝗜𝗥𝗠𝗔𝗦𝗜 𝗣𝗥𝗢𝗗𝗨𝗞 𝗡𝗜𝗛 𝗜𝗦𝗡 𝗣𝗥𝗢 ☰\n─────────────────────────\n${dateString}\n\n𝙄𝙉𝙁𝙊𝙍𝙈𝘼𝙎𝙄 𝘽𝙐𝙔𝙀𝙍\n𝗡𝗮𝗺𝗮 : ${name}\n𝗡𝗼𝗺𝗼𝗿 : ${contactInfo}\n𝗦𝗶𝘀𝘁𝗲𝗺 : ${systemText}\n\n𝙋𝙀𝙎𝘼𝙉𝘼𝙉 𝘽𝙐𝙔𝙀𝙍 \n𝗣𝗿𝗼𝗱𝘂𝗸 :\n${productListText}𝗧𝗼𝘁𝗮𝗹 : Rp ${totalPrice.toLocaleString('id-ID')}\n\n─────────────────────────\n\`\`\`Setelah admin sudah acc pesanan dan anda sudah membayar produknya, di mohon untuk menunggu proses trxnya dan mohon bersabar\`\`\``;
}

function openCheckoutModal() {
    const message = getFormattedMessage('whatsapp');
    const waLink = `https://wa.me/628988685425?text=${encodeURIComponent(message)}`;
    document.getElementById('link-wa').href = waLink;
    document.getElementById('checkout-modal').style.display = 'flex';
}

function handleTelegramOrder() {
    const message = getFormattedMessage('telegram');
    navigator.clipboard.writeText(message).then(() => {
        showCustomToast("Teks tersalin! Paste di Telegram ya.");
        setTimeout(() => {
            window.open("https://t.me/Isnxmahiru", "_blank");
            setTimeout(resetOrderForm, 1000);
        }, 1500);
    }).catch(err => {
        window.open("https://t.me/Isnxmahiru", "_blank");
        setTimeout(resetOrderForm, 1000);
    });
}

function closeCheckoutModal() { document.getElementById('checkout-modal').style.display = 'none'; }

// --- CALCULATOR ---
let rawCalculation = ""; 
function toggleCalculator() {
    const modal = document.getElementById('calculator-modal');
    if (document.getElementById('sidebar').classList.contains('active')) toggleSidebar();
    modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
}
function updateCalcDisplay() {
    const display = document.getElementById('calc-display');
    let formatted = rawCalculation.replace(/\*/g, ' x ').replace(/\//g, ' : ').replace(/\+/g, ' + ').replace(/\-/g, ' - ');
    formatted = formatted.replace(/\d+/g, (match) => parseInt(match).toLocaleString('id-ID'));
    display.value = formatted;
}
function appendCalc(val) {
    const operators = ['+', '-', '*', '/', '.'];
    if (operators.includes(val) && rawCalculation === '') return;
    rawCalculation += val;
    updateCalcDisplay();
}
function clearCalc() { rawCalculation = ""; document.getElementById('calc-display').value = ''; }
function deleteLast() { if (rawCalculation.length > 0) { rawCalculation = rawCalculation.slice(0, -1); updateCalcDisplay(); } }
function calculateResult() {
    try {
        if (rawCalculation === "") return;
        let result = eval(rawCalculation);
        if (!isFinite(result) || isNaN(result)) throw new Error();
        rawCalculation = result.toString();
        updateCalcDisplay();
    } catch { document.getElementById('calc-display').value = 'Error'; setTimeout(clearCalc, 1000); }
}

// --- PRODUCT LOGIC DENGAN PAGINATION (HALAMAN) ---
function toggleProductList() {
    const wrapper = document.getElementById('product-container-wrapper');
    const icon = document.getElementById('main-product-icon');
    const isClosed = wrapper.style.display === 'none' || wrapper.style.display === '';
    
    wrapper.style.display = isClosed ? 'block' : 'none';
    
    if (isClosed) {
        icon.classList.add('rotate-180');
        renderProducts(); 
    } else {
        icon.classList.remove('rotate-180');
    }
}

function renderProducts() {
    const container = document.getElementById('product-container');
    const paginationContainer = document.getElementById('product-pagination');
    
    if (typeof productData === 'undefined') return;
    
    const start = (productPage - 1) * productsPerPage;
    const end = start + productsPerPage;
    const paginatedItems = productData.slice(start, end);
    const totalPages = Math.ceil(productData.length / productsPerPage);

    container.innerHTML = ''; 
    
    paginatedItems.forEach((prod, index) => {
        const realIndex = start + index; 
        const prodDiv = document.createElement('div');
        const isOpen = prod.status === 'open';
        const statusHtml = `<span class="status-badge ${isOpen ? 'status-open' : 'status-close'}">${prod.status.toUpperCase()}</span>`;
        
        const btn = document.createElement('div');
        btn.className = 'product-btn';
        btn.innerHTML = `<span>${statusHtml} ${prod.name}</span> <i id="icon-prod-${realIndex}" class="fas fa-chevron-down"></i>`;
        
        if (isOpen) {
            btn.onclick = () => toggleVariant(realIndex);
        } else { 
            btn.style.opacity = '0.6'; btn.style.cursor = 'not-allowed'; 
        }

        const variantDiv = document.createElement('div');
        variantDiv.id = `variant-${realIndex}`; 
        variantDiv.className = 'product-dropdown';
        
        if (isOpen && prod.variants) {
            prod.variants.forEach((variant, vIndex) => {
                const vItem = document.createElement('div');
                vItem.className = 'variant-item'; 
                vItem.style.animationDelay = `${vIndex * 0.05}s`;
                vItem.innerHTML = `<span>${variant.name}</span> <span>Rp ${variant.price.toLocaleString('id-ID')}</span>`;
                vItem.onclick = () => addToOrder(prod.name, variant.name, variant.price);
                variantDiv.appendChild(vItem);
            });
        }
        prodDiv.appendChild(btn); prodDiv.appendChild(variantDiv); container.appendChild(prodDiv);
    });

    paginationContainer.innerHTML = '';
    if (totalPages > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.textContent = '<'; 
        prevBtn.onclick = () => { if(productPage > 1) { productPage--; renderProducts(); } };
        if(productPage === 1) prevBtn.disabled = true;
        paginationContainer.appendChild(prevBtn);

        for(let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${i === productPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => { productPage = i; renderProducts(); };
            paginationContainer.appendChild(pageBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.textContent = '>';
        nextBtn.onclick = () => { if(productPage < totalPages) { productPage++; renderProducts(); } };
        if(productPage === totalPages) nextBtn.disabled = true;
        paginationContainer.appendChild(nextBtn);
    }
}

function toggleVariant(index) {
    const target = document.getElementById(`variant-${index}`);
    if(!target) return;
    const isClosed = target.style.display === 'none' || target.style.display === '';
    document.querySelectorAll('.product-dropdown').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.product-btn .fa-chevron-down').forEach(icon => icon.classList.remove('rotate-180'));
    if (isClosed) { 
        target.style.display = 'block'; 
        const icon = document.getElementById(`icon-prod-${index}`);
        if(icon) icon.classList.add('rotate-180'); 
    }
}

function addToOrder(prodName, varName, price) {
    cartItems.push({ id: Date.now(), name: prodName, variant: varName, price: price });
    renderOrderItems();
    checkValidation(); 
}

function removeFromOrder(id) {
    cartItems = cartItems.filter(item => item.id !== id);
    const totalPages = Math.ceil(cartItems.length / ordersPerPage);
    if (orderPage > totalPages && orderPage > 1) {
        orderPage--;
    }
    renderOrderItems();
    checkValidation();
}

function renderOrderItems() {
    const listContainer = document.getElementById('order-list-container');
    const paginationContainer = document.getElementById('order-pagination');
    listContainer.innerHTML = '';
    
    if (cartItems.length === 0) {
        listContainer.innerHTML = '<span id="empty-msg" style="color: #999; font-size: 12px; font-style: italic; text-align: center; margin-top: 20px; display: block;">Belum ada pesanan...</span>';
        paginationContainer.innerHTML = ''; 
        return; 
    }

    const start = (orderPage - 1) * ordersPerPage;
    const end = start + ordersPerPage;
    const paginatedOrders = cartItems.slice(start, end);
    const totalPages = Math.ceil(cartItems.length / ordersPerPage);

    paginatedOrders.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'order-item';
        
        const textSpan = document.createElement('span');
        textSpan.textContent = `${item.name} - ${item.variant} (Rp ${item.price.toLocaleString('id-ID')})`;
        
        const closeBtn = document.createElement('div');
        closeBtn.className = 'btn-remove'; 
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.onclick = () => removeFromOrder(item.id);
        
        itemDiv.appendChild(textSpan); 
        itemDiv.appendChild(closeBtn); 
        listContainer.appendChild(itemDiv);
    });

    paginationContainer.innerHTML = '';
    if (totalPages > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.textContent = 'Rev';
        prevBtn.onclick = () => { if(orderPage > 1) { orderPage--; renderOrderItems(); } };
        if(orderPage === 1) prevBtn.disabled = true;
        paginationContainer.appendChild(prevBtn);

        for(let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${i === orderPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => { orderPage = i; renderOrderItems(); };
            paginationContainer.appendChild(pageBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.textContent = 'Next';
        nextBtn.onclick = () => { if(orderPage < totalPages) { orderPage++; renderOrderItems(); } };
        if(orderPage === totalPages) nextBtn.disabled = true;
        paginationContainer.appendChild(nextBtn);
    }
}

// --- UTILITIES ---
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('maisshipro_theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
}
function updateThemeIcon(isDark) { document.getElementById('theme-icon').className = isDark ? 'fas fa-moon' : 'fas fa-sun'; }

// --- LOGIKA START PROCESS UPDATE (LOADING SELEKTIF) ---
function startProcess(pageType = 'belanja') {
    // Hanya tampilkan loading screen penuh jika:
    // 1. Tombol 'MULAI' ditekan
    // 2. Tombol 'Belanja' ditekan
    const shouldShowLoading = (pageType === 'belanja');

    if (shouldShowLoading) {
        document.getElementById('loading-overlay').style.display = 'flex'; 
        setTimeout(() => {
            document.getElementById('loading-overlay').style.display = 'none';
            finishNavigation(pageType);
        }, 1500);
    } else {
        // Jika Payment / Ripper -> Langsung pindah
        finishNavigation(pageType);
    }
}

function finishNavigation(pageType) {
    showMainContent(pageType); 
    localStorage.setItem('maisshipro_status', 'masuk');
    
    // Update URL tanpa reload
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + `?page=${pageType}`;
    window.history.pushState({path:newUrl},'',newUrl);
}

function showMainContent(type = 'belanja') {
    document.getElementById('landing-page').style.display = 'none';
    
    const belanjaContent = document.getElementById('main-content');
    const paymentContent = document.getElementById('payment-content');
    const ripperContent = document.getElementById('ripper-content'); 

    belanjaContent.style.display = 'none';
    paymentContent.style.display = 'none';
    if(ripperContent) ripperContent.style.display = 'none';

    if (type === 'belanja') {
        belanjaContent.style.display = 'flex';
        paymentContent.style.display = 'none';
    } else if (type === 'payment') {
        belanjaContent.style.display = 'none';
        paymentContent.style.display = 'flex';
        if(typeof renderPaymentContent === 'function') renderPaymentContent();
    } else if (type === 'ripper') { 
        if(ripperContent) {
            ripperContent.style.display = 'flex';
            if(typeof renderRipperContent === 'function') renderRipperContent();
        }
    }
}

function resetApp() { 
    localStorage.removeItem('maisshipro_status'); 
    window.history.pushState({}, '', window.location.pathname); 
    location.reload(); 
}
