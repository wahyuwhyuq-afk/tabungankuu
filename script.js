/* =========================================================
   TABUNGANKU v3.3 - Sultan Edition
   JavaScript Logic by WahyuDev
   ========================================================= */

const STORAGE_KEY = 'tabunganku_transaksi';
const KATEGORI_KEY = 'tabunganku_kategori';
const TARGET_KEY = 'tabunganku_target';
const THEME_KEY = 'tabunganku_theme';
const SAWERIA_URL = 'https://saweria.co/WahyuDev';

const KATEGORI_DEFAULT = {
  Pemasukan: ['Gaji', 'Bonus', 'Investasi', 'Hadiah', 'Bisnis', 'Lainnya'],
  Pengeluaran: ['Makanan', 'Transportasi', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Lainnya']
};

let daftarKategori = {};
let semuaTransaksi = [];
let editingId = null;
let searchQuery = '';

/* ============ INIT ============ */
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c👑 TABUNGANKU v3.3', 'color: #d4af37; font-size: 20px; font-weight: bold;');
  console.log('%cDeveloped by WahyuDev', 'color: #d4af37; font-size: 13px; letter-spacing: 2px;');

  initTheme();
  loadKategori();
  loadData();
  setTanggalHariIni();
  bindEvents();
  renderAll();
});

function bindEvents() {
  // Form input
  document.getElementById('jenis').addEventListener('change', updateKategoriDropdown);
  document.getElementById('formTransaksi').addEventListener('submit', submitForm);

  // Filter & search
  document.getElementById('filterBulan').addEventListener('change', renderList);
  document.getElementById('filterTahun').addEventListener('input', renderList);
  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderList();
  });

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // ✅ TOMBOL EDIT TARGET — FIX: pakai addEventListener
  const btnEditTarget = document.getElementById('btnEditTarget');
  if (btnEditTarget) {
    btnEditTarget.addEventListener('click', (e) => {
      e.preventDefault();
      openTargetModal();
    });
    console.log('✅ Tombol Edit Target terpasang');
  } else {
    console.error('❌ Tombol Edit Target tidak ditemukan!');
  }

  // ✅ TOMBOL CANCEL EDIT (banner)
  const btnCancelEdit = document.getElementById('btnCancelEdit');
  if (btnCancelEdit) {
    btnCancelEdit.addEventListener('click', (e) => {
      e.preventDefault();
      cancelEdit();
    });
  }

  // ✅ TOMBOL MODAL TARGET
  const btnCloseTarget = document.getElementById('btnCloseTarget');
  if (btnCloseTarget) {
    btnCloseTarget.addEventListener('click', (e) => {
      e.preventDefault();
      closeTargetModal();
    });
  }

  const btnSaveTarget = document.getElementById('btnSaveTarget');
  if (btnSaveTarget) {
    btnSaveTarget.addEventListener('click', (e) => {
      e.preventDefault();
      saveTarget();
    });
  }

  // ✅ TOMBOL EXPORT & RESET
  const btnExport = document.getElementById('btnExport');
  if (btnExport) btnExport.addEventListener('click', exportCSV);

  const btnReset = document.getElementById('btnReset');
  if (btnReset) btnReset.addEventListener('click', resetData);

  // ✅ TOMBOL DONASI
  const btnDonasi = document.getElementById('btnDonasi');
  if (btnDonasi) {
    btnDonasi.addEventListener('click', (e) => {
      e.preventDefault();
      bukaSaweria();
    });
  }

  // ✅ Klik overlay modal target → tutup
  document.getElementById('targetModal').addEventListener('click', (e) => {
    if (e.target.id === 'targetModal') closeTargetModal();
  });

  // ✅ Enter di input target → simpan
  const inputTarget = document.getElementById('inputTarget');
  if (inputTarget) {
    inputTarget.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveTarget();
      }
    });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeTargetModal();

    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if ((e.key === 'd' || e.key === 'D') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      bukaSaweria();
    }
  });
}

function setTanggalHariIni() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('tanggal').value = today;
  document.getElementById('filterTahun').value = new Date().getFullYear();
}

/* ============ THEME ============ */
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a0a0f' : '#faf8f3');
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const current = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* ============ STORAGE ============ */
function loadKategori() {
  const saved = localStorage.getItem(KATEGORI_KEY);
  daftarKategori = saved ? JSON.parse(saved) : { ...KATEGORI_DEFAULT };
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  semuaTransaksi = saved ? JSON.parse(saved) : [];
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(semuaTransaksi));
}

function getTarget() {
  return Number(localStorage.getItem(TARGET_KEY) || 0);
}

/* ============ RENDER ============ */
function renderAll() {
  updateKategoriDropdown();
  renderDashboard();
  renderTarget();
  renderList();
}

function updateKategoriDropdown() {
  const jenis = document.getElementById('jenis').value;
  const sel = document.getElementById('kategori');
  const prevValue = sel.value;
  sel.innerHTML = '';
  (daftarKategori[jenis] || []).forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k;
    sel.appendChild(opt);
  });
  if (prevValue && daftarKategori[jenis].includes(prevValue)) sel.value = prevValue;
}

function renderDashboard() {
  let pemasukan = 0, pengeluaran = 0;
  semuaTransaksi.forEach(t => {
    if (t.jenis === 'Pemasukan') pemasukan += t.jumlah;
    else pengeluaran += t.jumlah;
  });
  document.getElementById('cardPemasukan').textContent = formatRupiah(pemasukan);
  document.getElementById('cardPengeluaran').textContent = formatRupiah(pengeluaran);
  document.getElementById('cardSaldo').textContent = formatRupiah(pemasukan - pengeluaran);
}

function renderTarget() {
  const target = getTarget();
  const now = new Date();
  const bulan = now.getMonth() + 1;
  const tahun = now.getFullYear();

  let masukBulanIni = 0, keluarBulanIni = 0;
  semuaTransaksi.forEach(t => {
    const d = new Date(t.tanggal);
    if (d.getMonth() + 1 === bulan && d.getFullYear() === tahun) {
      if (t.jenis === 'Pemasukan') masukBulanIni += t.jumlah;
      else keluarBulanIni += t.jumlah;
    }
  });

  const terkumpul = Math.max(0, masukBulanIni - keluarBulanIni);
  const persen = target > 0 ? Math.min(100, (terkumpul / target) * 100) : 0;
  const sisa = Math.max(0, target - terkumpul);

  document.getElementById('targetTerkumpul').textContent = formatRupiah(terkumpul);
  document.getElementById('targetJumlah').textContent = formatRupiah(target);
  document.getElementById('targetPersen').textContent = persen.toFixed(1) + '% tercapai';
  document.getElementById('targetSisa').textContent = target > 0
    ? (sisa > 0 ? 'Kurang ' + formatRupiah(sisa) : '✅ Target tercapai!')
    : 'Belum diset';

  const fill = document.getElementById('targetProgress');
  fill.style.width = persen + '%';
  fill.classList.remove('warning', 'danger', 'gold');

  if (target > 0 && persen >= 100) {
    fill.classList.add('gold');
  } else if (persen < 30) {
    fill.classList.add('danger');
  } else if (persen < 70) {
    fill.classList.add('warning');
  }
}

function renderList() {
  const bulan = parseInt(document.getElementById('filterBulan').value);
  const tahun = parseInt(document.getElementById('filterTahun').value);
  const container = document.getElementById('listTransaksi');

  let filtered = [...semuaTransaksi].sort((a, b) =>
    new Date(b.tanggal) - new Date(a.tanggal)
  );

  if (bulan > 0) {
    filtered = filtered.filter(t => {
      const d = new Date(t.tanggal);
      const ok = (d.getMonth() + 1) === bulan;
      return tahun ? ok && d.getFullYear() === tahun : ok;
    });
  } else if (tahun) {
    filtered = filtered.filter(t => new Date(t.tanggal).getFullYear() === tahun);
  }

  if (searchQuery) {
    filtered = filtered.filter(t =>
      t.kategori.toLowerCase().includes(searchQuery) ||
      (t.keterangan || '').toLowerCase().includes(searchQuery)
    );
  }

  if (filtered.length === 0) {
    const msg = searchQuery
      ? `Tidak ditemukan hasil untuk "${escapeHtml(searchQuery)}"`
      : 'Belum ada transaksi';
    container.innerHTML = `<div class="empty">${msg}</div>`;
    return;
  }

  container.innerHTML = filtered.map(t => {
    const tgl = new Date(t.tanggal).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
    const isPemasukan = t.jenis === 'Pemasukan';
    const sign = isPemasukan ? '+' : '-';
    const cls = isPemasukan ? 'pemasukan' : 'pengeluaran';
    const icon = isPemasukan ? '💎' : '🔥';
    return `
      <div class="transaksi-item">
        <div class="trx-info">
          <div class="trx-kategori">${icon} ${escapeHtml(t.kategori)}</div>
          <div class="trx-meta">${tgl} • ${escapeHtml(t.keterangan || '-')}</div>
        </div>
        <div class="trx-jumlah ${cls}">${sign} ${formatRupiah(t.jumlah)}</div>
        <div class="trx-actions">
          <button type="button" class="btn-icon btn-edit" data-action="edit" data-id="${t.id}" title="Edit">✏️</button>
          <button type="button" class="btn-icon btn-hapus" data-action="hapus" data-id="${t.id}" title="Hapus">🗑️</button>
        </div>
      </div>
    `;
  }).join('');

  // ✅ Bind event listener ke tombol edit/hapus (delegation)
  container.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => editTransaksi(btn.dataset.id));
  });
  container.querySelectorAll('[data-action="hapus"]').forEach(btn => {
    btn.addEventListener('click', () => hapusTransaksi(btn.dataset.id));
  });
}

/* ============ ACTIONS ============ */
function submitForm(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmit');
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = '⏳ Menyimpan...';

  const data = {
    tanggal: document.getElementById('tanggal').value,
    jenis: document.getElementById('jenis').value,
    kategori: document.getElementById('kategori').value,
    keterangan: document.getElementById('keterangan').value.trim(),
    jumlah: Number(document.getElementById('jumlah').value)
  };

  if (data.jumlah <= 0) {
    showToast('Jumlah harus lebih dari 0', 'error');
    btn.disabled = false;
    btn.textContent = originalText;
    return;
  }

  if (editingId) {
    const idx = semuaTransaksi.findIndex(t => t.id === editingId);
    if (idx !== -1) {
      semuaTransaksi[idx] = { ...semuaTransaksi[idx], ...data };
    }
    showToast('✅ Transaksi berhasil diupdate', 'success');
    cancelEdit();
  } else {
    semuaTransaksi.push({
      id: 'TRX' + Date.now(),
      ...data
    });
    showToast('👑 Transaksi berhasil disimpan', 'success');
    e.target.reset();
    setTanggalHariIni();
  }

  saveData();
  renderAll();

  btn.disabled = false;
  btn.textContent = originalText;
}

function editTransaksi(id) {
  const t = semuaTransaksi.find(x => x.id === id);
  if (!t) return;

  editingId = id;
  document.getElementById('tanggal').value = t.tanggal;
  document.getElementById('jenis').value = t.jenis;
  updateKategoriDropdown();
  document.getElementById('kategori').value = t.kategori;
  document.getElementById('jumlah').value = t.jumlah;
  document.getElementById('keterangan').value = t.keterangan || '';

  document.getElementById('formTitle').textContent = '✏️ Edit Transaksi';
  document.getElementById('editBanner').classList.add('show');
  document.getElementById('btnSubmit').textContent = '💾 Update Transaksi';

  document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelEdit() {
  editingId = null;
  document.getElementById('formTransaksi').reset();
  setTanggalHariIni();
  updateKategoriDropdown();
  document.getElementById('formTitle').textContent = '➕ Tambah Transaksi';
  document.getElementById('editBanner').classList.remove('show');
  document.getElementById('btnSubmit').textContent = '💾 Simpan Transaksi';
}

function hapusTransaksi(id) {
  const trx = semuaTransaksi.find(t => t.id === id);
  if (!trx) return;
  if (!confirm(`Hapus transaksi "${trx.kategori}" sebesar ${formatRupiah(trx.jumlah)}?`)) return;

  semuaTransaksi = semuaTransaksi.filter(t => t.id !== id);
  saveData();
  if (editingId === id) cancelEdit();
  renderAll();
  showToast('🗑️ Transaksi dihapus', 'success');
}

function resetData() {
  if (semuaTransaksi.length === 0) {
    showToast('⚠️ Tidak ada data untuk dihapus', 'error');
    return;
  }
  if (!confirm('Yakin ingin menghapus SEMUA transaksi? Tindakan ini tidak bisa dibatalkan!')) return;
  if (!confirm('Konfirmasi sekali lagi: hapus semua data?')) return;

  semuaTransaksi = [];
  saveData();
  cancelEdit();
  renderAll();
  showToast('🗑️ Semua data dihapus', 'success');
}

/* ============ TARGET MODAL ============ */
function openTargetModal() {
  console.log('🎯 Membuka modal target');
  const inputTarget = document.getElementById('inputTarget');
  const modal = document.getElementById('targetModal');
  if (!inputTarget || !modal) {
    console.error('❌ Modal target tidak ditemukan!');
    return;
  }
  inputTarget.value = getTarget() || '';
  modal.classList.add('show');
  setTimeout(() => inputTarget.focus(), 100);
}

function closeTargetModal() {
  const modal = document.getElementById('targetModal');
  if (modal) modal.classList.remove('show');
}

function saveTarget() {
  const val = Number(document.getElementById('inputTarget').value) || 0;
  localStorage.setItem(TARGET_KEY, val);
  closeTargetModal();
  renderTarget();
  showToast('🎯 Target tabungan disimpan', 'success');
}

/* ============ EXPORT ============ */
function exportCSV() {
  if (semuaTransaksi.length === 0) {
    showToast('⚠️ Tidak ada data untuk diexport', 'error');
    return;
  }

  const headers = ['Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Jumlah'];
  const rows = [...semuaTransaksi]
    .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))
    .map(t => [t.tanggal, t.jenis, t.kategori, t.keterangan || '', t.jumlah]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `TABUNGANKU_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('📤 Data berhasil diexport', 'success');
}

/* ============ DONASI ============ */
function bukaSaweria() {
  const btn = document.getElementById('btnDonasi');

  if (btn) {
    btn.classList.add('opening');
    btn.disabled = true;
    const label = btn.querySelector('.donasi-label');
    const originalLabel = label ? label.textContent : '';
    if (label) label.textContent = 'Membuka Saweria';

    setTimeout(() => {
      btn.classList.remove('opening');
      btn.disabled = false;
      if (label) label.textContent = originalLabel;
    }, 2000);
  }

  console.log('%c☕ Mengarahkan ke Saweria...',
    'color: #d4af37; font-size: 13px; font-weight: bold;');

  const newTab = window.open(SAWERIA_URL, '_blank', 'noopener,noreferrer');

  if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
    console.log('%c⚠️ Popup diblokir, redirect di tab yang sama...',
      'color: #f59e0b; font-size: 12px;');
    window.location.href = SAWERIA_URL;
  }
}

/* ============ UTILS ============ */
function formatRupiah(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

let toastTimer;
function showToast(msg, type) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = 'toast ' + (type || '') + ' show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
   }
