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
