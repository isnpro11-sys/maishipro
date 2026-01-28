// --- KONFIGURASI SUPABASE ---
const supabaseUrl = 'https://vptgyitfzronlutqophs.supabase.co'; 
const supabaseKey = 'sb_publishable_2mkWV6mTvs_gpWdx915WYQ_p27Yl_4y'; 

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// --- VARIABEL GLOBAL ---
let ripperImages = []; 
let currentRipperPage = 1;
const rippersPerPage = 4;

// --- UPLOAD FUNCTION (API DELINE) ---
const uploadDeline = async (file) => {
    const fd = new FormData();
    fd.append("file", file);

    try {
        const res = await axios.post("https://api.deline.web.id/uploader", fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
            maxBodyLength: 50 * 1024 * 1024,
            maxContentLength: 50 * 1024 * 1024,
        });

        const data = res.data || {};
        if (data.status === false) {
            throw new Error(data.message || "Upload failed");
        }

        const link = data?.result?.url || data?.url || data?.result?.link;
        if (!link) throw new Error("Link tidak ditemukan di response API");
        return link;
    } catch (error) {
        console.error("Upload Error:", error);
        throw error;
    }
};

// --- RENDER HALAMAN PUBLIC (APPROVED ONLY) ---
async function renderRipperContent() {
    const container = document.getElementById('ripper-content');
    
    container.innerHTML = `
        <div class="content-box">
            <div class="ripper-header">
                <span class="ripper-title">DATA RIPPER</span>
                <button class="btn-add-ripper" onclick="openAddRipperModal()">
                    <i class="fas fa-plus-circle"></i> TAMBAH
                </button>
            </div>
            <div class="ripper-list-container" id="ripper-list">
                <div class="empty-ripper">Memuat data...</div>
            </div>
            <div id="ripper-pagination" class="pagination-container"></div>
        </div>
    `;

    await fetchAndRenderRippers();
}

async function fetchAndRenderRippers() {
    const listContainer = document.getElementById('ripper-list');
    const paginationContainer = document.getElementById('ripper-pagination');

    const { data: ripperDataList, error } = await supabaseClient
        .from('rippers')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

    listContainer.innerHTML = ''; 

    if (error || !ripperDataList || ripperDataList.length === 0) {
        listContainer.innerHTML = `<div class="empty-ripper">Belum ada data ripper.</div>`;
        paginationContainer.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(ripperDataList.length / rippersPerPage);
    if (currentRipperPage > totalPages) currentRipperPage = totalPages;
    const start = (currentRipperPage - 1) * rippersPerPage;
    const itemsToShow = ripperDataList.slice(start, start + rippersPerPage);

    itemsToShow.forEach(data => {
        let shortDesc = data.case_desc.length > 20 ? data.case_desc.substring(0, 20) + '...' : data.case_desc;
        const displayImg = Array.isArray(data.images) ? data.images[0] : JSON.parse(data.images)[0];

        const itemHtml = `
            <div class="ripper-card">
                <div class="ripper-header" style="margin-bottom:5px; border:none; padding:0;">
                    <span class="ripper-name">${data.name}</span>
                </div>
                <img src="${displayImg}" alt="Bukti" onclick='openRipperDetail(${JSON.stringify(data)})'>
                <div style="font-size:10px; color:#666; margin-top:5px;">${data.contact}</div>
                <div class="ripper-loss">Loss: ${data.loss}</div>
                <p class="ripper-desc">${shortDesc}</p>
                <button class="btn-detail-ripper" onclick='openRipperDetail(${JSON.stringify(data)})'>DETAIL</button>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', itemHtml);
    });

    renderPagination(paginationContainer, totalPages, fetchAndRenderRippers);
}

function renderPagination(container, totalPages, renderFunc) {
    container.innerHTML = '';
    if (totalPages <= 1) return;

    const createBtn = (text, onClick, disabled, isActive) => {
        const btn = document.createElement('button');
        btn.className = `page-btn ${isActive ? 'active' : ''}`;
        btn.textContent = text;
        btn.disabled = disabled;
        btn.onclick = onClick;
        return btn;
    };

    container.appendChild(createBtn('<', () => { currentRipperPage--; renderFunc(); }, currentRipperPage === 1));
    for (let i = 1; i <= totalPages; i++) {
        container.appendChild(createBtn(i, () => { currentRipperPage = i; renderFunc(); }, false, i === currentRipperPage));
    }
    container.appendChild(createBtn('>', () => { currentRipperPage++; renderFunc(); }, currentRipperPage === totalPages));
}

function openRipperDetail(data) { 
    const images = typeof data.images === 'string' ? JSON.parse(data.images) : data.images;

    document.getElementById('detail-name').textContent = data.name;
    document.getElementById('detail-contact').innerHTML = `<i class="fab fa-whatsapp"></i> ${data.contact}`;
    document.getElementById('detail-loss').innerHTML = `<i class="fas fa-money-bill-wave"></i> ${data.loss}`;
    document.getElementById('detail-cron').textContent = data.case_desc;
    
    const mainImg = document.getElementById('detail-img-display');
    mainImg.src = images[0];

    const galleryContainer = document.getElementById('detail-gallery');
    galleryContainer.innerHTML = '';
    
    if (images.length > 0) {
        images.forEach((imgSrc, index) => {
            const img = document.createElement('img');
            img.src = imgSrc;
            if (index === 0) img.classList.add('active-thumb');
            img.onclick = function() {
                mainImg.src = imgSrc;
                document.querySelectorAll('.detail-gallery img').forEach(el => el.classList.remove('active-thumb'));
                img.classList.add('active-thumb');
            };
            galleryContainer.appendChild(img);
        });
    }
    document.getElementById('ripper-detail-modal').style.display = 'flex';
}
function closeRipperDetail() { document.getElementById('ripper-detail-modal').style.display = 'none'; }

// --- LOGIKA TAMBAH RIPPER & UPLOAD (UPDATED LOADING LOKAL) ---
function openAddRipperModal() {
    ripperImages = [];
    document.getElementById('ripper-files').value = "";
    document.getElementById('ripper-preview-container').innerHTML = "";
    document.getElementById('input-ripper-name').value = "";
    document.getElementById('input-ripper-contact').value = "";
    document.getElementById('input-ripper-loss').value = "";
    document.getElementById('input-ripper-case').value = "";
    
    // Reset Tampilan: Tampilkan Form, Sembunyikan Loading
    document.getElementById('ripper-form-content').style.display = 'block';
    document.getElementById('ripper-local-loading').style.display = 'none';
    
    document.getElementById('add-ripper-modal').style.display = 'flex';
}
function closeAddRipperModal() { document.getElementById('add-ripper-modal').style.display = 'none'; }

function handleRipperImages(input) {
    const files = Array.from(input.files);
    const container = document.getElementById('ripper-preview-container');
    if (ripperImages.length + files.length > 5) { 
        showAlert("Gagal", "Maksimal 5 foto!", "error"); 
        return; 
    }
    files.forEach(file => {
        ripperImages.push(file); 
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `<img src="${e.target.result}">`;
            container.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
}

async function submitRipperData() {
    const name = document.getElementById('input-ripper-name').value.trim();
    const contact = document.getElementById('input-ripper-contact').value.trim();
    const loss = document.getElementById('input-ripper-loss').value.trim();
    const caseDesc = document.getElementById('input-ripper-case').value.trim();

    if (ripperImages.length < 1) return showAlert("Peringatan", "Wajib upload minimal 1 bukti foto!", "error");
    if (!name || !contact || !caseDesc || !loss) return showAlert("Peringatan", "Semua kolom wajib diisi!", "error");

    // UI CHANGE: Sembunyikan Form, Tampilkan Loading di dalam kotak
    document.getElementById('ripper-form-content').style.display = 'none';
    document.getElementById('ripper-local-loading').style.display = 'flex';

    try {
        const uploadPromises = ripperImages.map(file => uploadDeline(file));
        const uploadedUrls = await Promise.all(uploadPromises);

        const { error } = await supabaseClient.from('rippers').insert([{
            name: name,
            contact: contact,
            loss: loss,
            case_desc: caseDesc,
            images: JSON.stringify(uploadedUrls), 
            status: 'pending'
        }]);

        if (error) throw error;

        // BERHASIL
        showAlert("Berhasil", "Data dikirim ke admin untuk dicek!", "success");
        
        // Tutup modal otomatis setelah sukses
        setTimeout(() => {
            closeAddRipperModal();
        }, 1500);

    } catch (error) {
        console.error(error);
        showAlert("Error", "Gagal mengirim data: " + error.message, "error");
        
        // Kembalikan tampilan form jika gagal
        document.getElementById('ripper-local-loading').style.display = 'none';
        document.getElementById('ripper-form-content').style.display = 'block';
    }
}

// --- OWNER SYSTEM (NEW LOGIC) ---

// 1. LOGIN & NAVIGASI
function openOwnerLogin() { document.getElementById('owner-login-modal').style.display = 'flex'; }
function closeOwnerLogin() { document.getElementById('owner-login-modal').style.display = 'none'; }

function checkOwnerLogin() {
    const email = document.getElementById('owner-email').value;
    const pass = document.getElementById('owner-pass').value;

    if (email === 'isnpro@maisshipro.id' && pass === 'Isnpro999') {
        closeOwnerLogin();
        showOwnerDashboard();
    } else {
        showAlert("Gagal", "Email atau password salah!", "error");
    }
}

function showOwnerDashboard() {
    // Sembunyikan halaman user biasa
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('payment-content').style.display = 'none';
    document.getElementById('ripper-content').style.display = 'none';
    
    // Tampilkan Dashboard Admin
    document.getElementById('owner-dashboard-content').style.display = 'flex';
    
    // Default view: Acc Ripper
    switchAdminView('ripper');
}

function logoutOwner() {
    document.getElementById('owner-dashboard-content').style.display = 'none';
    startProcess('belanja'); 
}

// 2. SWITCH VIEW (ADD INFO vs ACC RIPPER)
function switchAdminView(view) {
    const infoDiv = document.getElementById('admin-view-info');
    const ripperDiv = document.getElementById('admin-view-ripper');
    const btns = document.querySelectorAll('.btn-admin-nav');

    // Reset tombol active
    btns.forEach(b => b.classList.remove('active'));

    if (view === 'info') {
        infoDiv.style.display = 'block';
        ripperDiv.style.display = 'none';
        btns[0].classList.add('active');
        fetchActiveAnnouncement(); // Ambil info aktif untuk admin
    } else {
        infoDiv.style.display = 'none';
        ripperDiv.style.display = 'block';
        btns[1].classList.add('active');
        fetchPendingRippers();  // Ambil data pending
        fetchApprovedRippersAdmin(); // Ambil data approved (untuk dihapus)
    }
}

// 3. LOGIKA ACC RIPPER (Pending)
async function fetchPendingRippers() {
    const container = document.getElementById('pending-ripper-list');
    container.innerHTML = '<div class="empty-ripper">Memuat data pending...</div>';

    const { data: pendingList, error } = await supabaseClient
        .from('rippers')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error || !pendingList || pendingList.length === 0) {
        container.innerHTML = '<div class="empty-ripper">Tidak ada permintaan pending.</div>';
        return;
    }

    container.innerHTML = '';
    pendingList.forEach(data => {
        const images = typeof data.images === 'string' ? JSON.parse(data.images) : data.images;
        
        const html = `
            <div class="ripper-card">
                <span class="pending-badge">PENDING</span>
                <div class="ripper-header" style="border:none; padding:0;">
                    <span class="ripper-name">${data.name}</span>
                </div>
                <img src="${images[0]}" style="height: 150px; object-fit:cover;">
                <p style="font-size:10px;">${data.contact} | ${data.loss}</p>
                <div class="approval-actions">
                    <button class="btn-approve" onclick="approveRipper(${data.id})">
                        <i class="fas fa-check"></i> TERIMA
                    </button>
                    <button class="btn-reject" onclick="rejectRipper(${data.id})">
                        <i class="fas fa-times"></i> TOLAK
                    </button>
                </div>
                <button class="btn-detail-ripper" onclick='openRipperDetail(${JSON.stringify(data)})'>LIHAT DETAIL</button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

// 4. LOGIKA APPROVED RIPPER (Untuk Admin Menghapus)
async function fetchApprovedRippersAdmin() {
    const container = document.getElementById('approved-ripper-admin-list');
    container.innerHTML = '<div class="empty-ripper">Memuat data approved...</div>';

    const { data: list, error } = await supabaseClient
        .from('rippers')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

    if (error || !list || list.length === 0) {
        container.innerHTML = '<div class="empty-ripper">Belum ada ripper yang di-acc.</div>';
        return;
    }

    container.innerHTML = '';
    list.forEach(data => {
        const html = `
            <div class="admin-approved-item">
                <div style="text-align:left;">
                    <div style="font-weight:900; font-size:12px;">${data.name}</div>
                    <div style="font-size:10px; color:#666;">${data.contact}</div>
                </div>
                <button class="btn-delete-permanent" onclick="deleteRipperPermanent(${data.id})">
                    <i class="fas fa-trash"></i> HAPUS
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

// 5. ACTION BUTTONS (Approve/Reject/Delete)
async function approveRipper(id) {
    if(!confirm("Publish data ini?")) return;
    document.getElementById('loading-overlay').style.display = 'flex';
    const { error } = await supabaseClient.from('rippers').update({ status: 'approved' }).eq('id', id);
    document.getElementById('loading-overlay').style.display = 'none';
    if(error) showAlert("Error", error.message, "error");
    else { showAlert("Sukses", "Data dipublish!", "success"); switchAdminView('ripper'); }
}

async function rejectRipper(id) { deleteRipperPermanent(id); }

async function deleteRipperPermanent(id) {
    if(!confirm("Yakin HAPUS data ini selamanya?")) return;
    document.getElementById('loading-overlay').style.display = 'flex';
    const { error } = await supabaseClient.from('rippers').delete().eq('id', id);
    document.getElementById('loading-overlay').style.display = 'none';
    if(error) showAlert("Error", error.message, "error");
    else { showAlert("Dihapus", "Data berhasil dihapus.", "success"); switchAdminView('ripper'); }
}

// --- LOGIKA SISTEM INFORMASI / PENGUMUMAN ---

// 1. Kirim Pengumuman Baru
async function submitAnnouncement() {
    const message = document.getElementById('info-message').value.trim();
    const durationDays = parseInt(document.getElementById('info-duration').value);

    if (!message) return showAlert("Peringatan", "Isi pesan tidak boleh kosong!", "error");

    // Hitung tanggal kadaluarsa
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    document.getElementById('loading-overlay').style.display = 'flex';

    // Insert ke tabel announcements
    const { error } = await supabaseClient
        .from('announcements')
        .insert([{ message: message, expires_at: expiresAt.toISOString() }]);

    document.getElementById('loading-overlay').style.display = 'none';

    if (error) {
        showAlert("Error", "Gagal mengirim info: " + error.message, "error");
    } else {
        showAlert("Sukses", "Informasi berhasil dipublish!", "success");
        document.getElementById('info-message').value = ""; // Reset form
        fetchActiveAnnouncement(); // Refresh list bawah
    }
}

// 2. Lihat Pengumuman Aktif (Di Admin Panel)
async function fetchActiveAnnouncement() {
    const container = document.getElementById('active-announcement-list');
    const now = new Date().toISOString();

    const { data, error } = await supabaseClient
        .from('announcements')
        .select('*')
        .gt('expires_at', now) // Ambil yang belum expired
        .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
        container.innerHTML = '<p style="font-size:11px; color:gray; font-style:italic;">Tidak ada informasi aktif.</p>';
        return;
    }

    container.innerHTML = '';
    data.forEach(item => {
        const expDate = new Date(item.expires_at).toLocaleDateString('id-ID');
        container.innerHTML += `
            <div class="admin-approved-item">
                <div style="font-size:11px; width:70%;">"${item.message}" <br><span style="color:red;">Exp: ${expDate}</span></div>
                <button class="btn-delete-permanent" onclick="deleteAnnouncement(${item.id})">HAPUS</button>
            </div>
        `;
    });
}

// 3. Hapus Pengumuman
async function deleteAnnouncement(id) {
    if(!confirm("Hapus informasi ini?")) return;
    const { error } = await supabaseClient.from('announcements').delete().eq('id', id);
    if(!error) fetchActiveAnnouncement();
}

async function checkAndShowAnnouncement() {
    // Cek SessionStorage (Apakah user sudah melihat info di sesi browser ini?)
    if (sessionStorage.getItem('hasSeenInfo') === 'true') {
        return; 
    }

    const now = new Date().toISOString();
    
    // UBAHAN: Hapus .limit(1) agar mengambil SEMUA info yang aktif
    const { data, error } = await supabaseClient
        .from('announcements')
        .select('message')
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
        const contentContainer = document.getElementById('info-popup-content');
        contentContainer.innerHTML = ''; // Reset isi container

        // Loop semua data dan masukkan ke dalam HTML
        data.forEach((item, index) => {
            // Membuat elemen pembungkus per pesan
            const msgDiv = document.createElement('div');
            msgDiv.className = 'info-item-popup'; // Class baru untuk styling
            
            msgDiv.innerHTML = `
                <div class="info-number"># INFORMASI ${index + 1}</div>
                <div class="info-text">${item.message}</div>
            `;
            
            contentContainer.appendChild(msgDiv);
        });

        document.getElementById('info-popup-modal').style.display = 'flex';
    }
}


function closeInfoPopup() {
    document.getElementById('info-popup-modal').style.display = 'none';
    // Set flag agar tidak muncul lagi selama tab belum ditutup
    sessionStorage.setItem('hasSeenInfo', 'true');
}
