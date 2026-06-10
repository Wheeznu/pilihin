// Fungsi prosedural untuk memfilter artikel berdasarkan kategori
function filterKategori(kategori) {
    // Ambil semua elemen kartu artikel dan tombol filter
    const artikelCards = document.querySelectorAll('.blog-card');
    const tombolFilters = document.querySelectorAll('.filter-btn');

    // Proses 1: Atur ulang tampilan tombol filter yang aktif
    for (let i = 0; i < tombolFilters.length; i++) {
        tombolFilters[i].classList.remove('active-filter');
        
        // Cek jika tombol ini yang sedang diklik, beri class aktif
        if (tombolFilters[i].getAttribute('onclick').includes(kategori)) {
            tombolFilters[i].classList.add('active-filter');
        }
    }

    // Proses 2: Tampilkan atau sembunyikan artikel sesuai kategori
    for (let i = 0; i < artikelCards.length; i++) {
        const kategoriKartu = artikelCards[i].getAttribute('data-category');
        
        if (kategori === 'semua') {
            artikelCards[i].style.display = 'block';
        } else if (kategori === kategoriKartu) {
            artikelCards[i].style.display = 'block';
        } else {
            artikelCards[i].style.display = 'none';
        }
    }
}

// --- Fungsi Prosedural untuk Reading Progress Bar ---
function updateProgressBar() {
    // Cari elemen progress bar
    const progressBar = document.getElementById('readingProgress');
    
    // Jika tidak ada progress bar di halaman ini, abaikan fungsinya
    if (!progressBar) return;

    // Hitung posisi scroll saat ini
    const posisiScroll = document.documentElement.scrollTop || document.body.scrollTop;
    
    // Hitung total tinggi halaman yang bisa di-scroll
    const tinggiHalaman = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    
    // Hitung persentase scroll
    const persentase = (posisiScroll / tinggiHalaman) * 100;
    
    // Ubah lebar progress bar sesuai persentase
    progressBar.style.width = persentase + "%";
}

// Pasang fungsi ke event saat layar di-scroll
window.onscroll = function() {
    updateProgressBar();
};