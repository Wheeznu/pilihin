// Fungsi prosedural untuk memfilter artikel berdasarkan kategori
function filterKategori(kategori) {
    // 1. Ambil semua elemen kartu artikel dan tombol filter
    const artikelCards = document.querySelectorAll('.blog-card');
    const tombolFilters = document.querySelectorAll('.filter-btn');

    // 2. Atur ulang tampilan tombol filter (hapus class aktif dari semua tombol)
    tombolFilters.forEach(btn => {
        btn.classList.remove('active-filter');
        if (btn.dataset.category === kategori) {
            btn.classList.add('active-filter');
        }
    });

    // 3. Tampilkan atau sembunyikan artikel sesuai kategori
    artikelCards.forEach(card => {
        const kategoriKartu = card.getAttribute('data-category');
        
        if (kategori === 'semua' || kategori === kategoriKartu) {
            card.style.display = 'flex'; // Tampilkan yang cocok
        } else {
            card.style.display = 'none'; // Sembunyikan yang tidak cocok
        }
    });
}

// Inisialisasi Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            filterKategori(category);
        });
    });
});