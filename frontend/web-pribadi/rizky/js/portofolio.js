document.addEventListener('DOMContentLoaded', function() {
    // --- Inisialisasi Event Listeners ---

    // Toggle Catatan
    const toggleButtons = document.querySelectorAll('[data-action="toggle-catatan"]');
    toggleButtons.forEach(button => {
        button.addEventListener('click', toggleCatatan);
    });

    // Form Kontak
    const formKontak = document.querySelector('.neo-form');
    if (formKontak) {
        formKontak.addEventListener('submit', tanganiSubmitForm);
    }

    // Filter Kategori (Jika ada tombol filter di halaman ini)
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const kategori = this.getAttribute('data-category') || 'semua';
            filterKategori(kategori);
        });
    });
});

// Fungsi prosedural untuk memfilter artikel berdasarkan kategori
function filterKategori(kategori) {
    const artikelCards = document.querySelectorAll('.blog-card');
    const tombolFilters = document.querySelectorAll('.filter-btn');

    tombolFilters.forEach(tombol => {
        tombol.classList.remove('active-filter');
        // Memeriksa data-category atau teks jika perlu, 
        // tapi di sini kita asumsikan event listener sudah menangani pemanggilan dengan kategori yang tepat
    });

    // Menambahkan kelas active ke tombol yang diklik (bisa dilakukan di event listener juga)
    const activeBtn = document.querySelector(`.filter-btn[data-category="${kategori}"]`);
    if (activeBtn) activeBtn.classList.add('active-filter');

    artikelCards.forEach(card => {
        const kategoriKartu = card.getAttribute('data-category');
        if (kategori === 'semua' || kategori === kategoriKartu) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// --- Fungsi Prosedural untuk Area Catatan Struktur Data ---
function toggleCatatan() {
    const areaCatatan = document.getElementById('area-catatan');
    if (!areaCatatan) return;

    if (areaCatatan.style.display === 'none' || areaCatatan.style.display === '') {
        areaCatatan.style.display = 'block';
    } else {
        areaCatatan.style.display = 'none';
    }
}

// --- Fungsi Prosedural untuk Form Kontak (Halaman Portofolio) ---
function tanganiSubmitForm(event) {
    event.preventDefault();

    const nama = document.getElementById('nama').value;
    const email = document.getElementById('email').value;
    const pesan = document.getElementById('pesan').value;

    if (nama === '' || email === '' || pesan === '') {
        alert('Ups! Tolong isi semua kotak formulir ya.');
        return; 
    }

    alert(`Pesan Diterima!\n\nTerima kasih, ${nama}. Pesanmu sudah terekam di sistem. (Simulasi JS)`);

    document.getElementById('nama').value = '';
    document.getElementById('email').value = '';
    document.getElementById('pesan').value = '';
}
