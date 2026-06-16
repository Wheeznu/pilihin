import { DOM } from "../utils/dom.js";

const SECTIONS = [
    {
        id: "memulai",
        number: "01",
        title: "Memulai",
        desc: "Langkah awal menggunakan Pilih.in",
        cards: [
            {
                icon: "user-plus",
                title: "Membuat Akun",
                body: `<p>Klik tombol <strong>Daftar</strong> di pojok kanan atas halaman beranda. Isi form pendaftaran dengan:</p>
<ul>
    <li><strong>Username</strong> - pilih nama pengguna yang unik</li>
    <li><strong>Email</strong> - gunakan email aktif untuk verifikasi</li>
    <li><strong>Password</strong> - minimal 8 karakter dengan kombinasi huruf dan angka</li>
</ul>
<p>Setelah mendaftar, kamu bisa langsung login dan menikmati konten Pilih.in.</p>`,
            },
            {
                icon: "log-in",
                title: "Masuk ke Akun",
                body: `<p>Klik tombol <strong>Masuk</strong> dan masukkan email serta password yang sudah didaftarkan. Jika lupa password, gunakan fitur <strong>Lupa Sandi</strong> di halaman login untuk mereset password melalui email.</p>`,
            },
            {
                icon: "user",
                title: "Melengkapi Profil",
                body: `<p>Setelah login, buka halaman <strong>Profil</strong> dari menu dropdown di navbar. Di sini kamu bisa:</p>
<ul>
    <li>Mengubah foto profil</li>
    <li>Mengupdate informasi akun</li>
    <li>Mengatur preferensi notifikasi</li>
</ul>`,
            },
        ],
    },
    {
        id: "menjelajah",
        number: "02",
        title: "Menjelajah Film",
        desc: "Temukan film favoritmu dengan mudah",
        cards: [
            {
                icon: "grid",
                title: "Katalog Film",
                body: `<p>Halaman <strong>Katalog</strong> menampilkan semua film yang tersedia di Pilih.in. Kamu bisa mengurutkan film berdasarkan:</p>
<ul>
    <li><strong>Terbaru</strong> - film yang baru ditambahkan</li>
    <li><strong>Trending</strong> - film paling banyak ditonton</li>
    <li><strong>Rating</strong> - film dengan rating tertinggi</li>
</ul>`,
            },
            {
                icon: "search",
                title: "Mencari Film",
                body: `<p>Gunakan kolom pencarian di navbar untuk mencari film berdasarkan judul, deskripsi, atau genre. Cukup ketik kata kunci dan tekan <strong>Enter</strong> untuk melihat hasil pencarian.</p>`,
            },
            {
                icon: "layers",
                title: "Menjelajah Genre",
                body: `<p>Kunjungi halaman <strong>Genre</strong> untuk melihat film berdasarkan kategori. Genre yang tersedia antara lain: Comedy, Drama, Romance, Horror, dan Action. Setiap genre memiliki ikon dan jumlah film yang tersedia.</p>`,
            },
        ],
    },
    {
        id: "menonton",
        number: "03",
        title: "Menonton Film",
        desc: "Nikmati pengalaman menonton terbaik",
        cards: [
            {
                icon: "play-circle",
                title: "Memutar Film",
                body: `<p>Klik film yang ingin ditonton untuk membuka halaman detail. Di halaman ini kamu bisa melihat sinopsis, informasi lengkap film, dan daftar aktor. Klik tombol <strong>Tonton Sekarang</strong> untuk memulai pemutaran.</p>`,
            },
            {
                icon: "settings",
                title: "Kualitas Video",
                body: `<p>Sesuaikan kualitas video sesuai koneksi internetmu:</p>
<ul>
    <li><strong>720p</strong> - untuk koneksi standar (paket Free & Basic)</li>
    <li><strong>1080p</strong> - Full HD (paket Standard & Premium)</li>
    <li><strong>4K</strong> - Ultra HD (paket Premium, konten tertentu)</li>
</ul>`,
            },
            {
                icon: "closed-caption",
                title: "Subtitle",
                body: `<p>Sebagian besar film dilengkapi subtitle Bahasa Indonesia dan Inggris. Kamu bisa mengaktifkan, menonaktifkan, atau mengganti bahasa subtitle melalui menu di pemutar video.</p>`,
            },
        ],
    },
    {
        id: "daftar",
        number: "04",
        title: "Daftar & Favorit",
        desc: "Atur koleksi filmmu",
        cards: [
            {
                icon: "bookmark",
                title: "Daftar Tonton",
                body: `<p>Simpan film yang ingin kamu tonton nanti ke <strong>Daftar Tonton</strong>. Dari halaman detail film, klik tombol bookmark untuk menambah atau menghapus film dari daftar. Akses daftar tontonmu kapan saja dari menu pengguna.</p>`,
            },
            {
                icon: "heart",
                title: "Film Favorit",
                body: `<p>Tandai film sebagai <strong>Favorit</strong> dengan mengklik ikon hati di halaman detail film. Film favoritmu akan terkumpul di halaman Film Favorit sehingga mudah ditemukan kembali.</p>`,
            },
        ],
    },
    {
        id: "langganan",
        number: "05",
        title: "Langganan",
        desc: "Pilih paket yang sesuai dengan kebutuhan",
        cards: [
            {
                icon: "credit-card",
                title: "Memilih Paket",
                body: `<p>Pilih.in menawarkan beberapa paket berlangganan:</p>
<ul>
    <li><strong>Free</strong> - akses terbatas, kualitas 720p, 1 perangkat</li>
    <li><strong>Basic</strong> - akses lebih banyak, 720p, 1 perangkat</li>
    <li><strong>Standard</strong> - akses penuh, 1080p, 2 perangkat</li>
    <li><strong>Premium</strong> - akses penuh + 4K, 4 perangkat</li>
</ul>`,
            },
            {
                icon: "shopping-cart",
                title: "Melakukan Pembayaran",
                body: `<p>Pembayaran dapat dilakukan melalui berbagai metode:</p>
<ul>
    <li>Transfer Bank (BCA, Mandiri, BRI, BN)</li>
    <li>E-Wallet (GoPay, OVO, DANA)</li>
    <li>QRIS</li>
    <li>Kartu Kredit</li>
</ul>
<p>Pilih metode pembayaran saat checkout dan ikuti instruksi yang diberikan.</p>`,
            },
            {
                icon: "x-circle",
                title: "Membatalkan Langganan",
                body: `<p>Untuk membatalkan langganan, buka <strong>Pengaturan > Langganan</strong> dan klik <strong>Batalkan Langganan</strong>. Langganan tetap aktif hingga periode berakhir dan tidak akan diperpanjang. Kamu bisa berlangganan kembali kapan saja.</p>`,
            },
        ],
    },
];

class PanduanPage {
    constructor() {
        this._init();
    }

    async _init() {
        try {
            this._render();
            this._bindScrollspy();
        } catch (err) {
            console.warn("PanduanPage: error", err);
        }
    }

    _renderNav() {
        return SECTIONS.map(
            (s) => `
                <li>
                    <a href="#${s.id}" class="panduan-nav__link" data-section="${s.id}">
                        ${s.number}. ${s.title}
                    </a>
                </li>
            `
        ).join("");
    }

    _renderContent() {
        return SECTIONS.map(
            (s) => `
                <section class="panduan-section" id="${s.id}">
                    <div class="panduan-section__header">
                        <div class="panduan-section__number">Bagian ${s.number}</div>
                        <h2 class="panduan-section__title">${s.title}</h2>
                        ${s.desc ? `<p class="panduan-section__desc">${s.desc}</p>` : ""}
                    </div>
                    ${s.cards
                        .map(
                            (c) => `
                            <div class="panduan-card">
                                <div class="panduan-card__header">
                                    <div class="panduan-card__icon">
                                        <i data-feather="${c.icon}"></i>
                                    </div>
                                    <h3 class="panduan-card__title">${c.title}</h3>
                                </div>
                                <div class="panduan-card__body">
                                    ${c.body}
                                </div>
                            </div>
                        `
                        )
                        .join("")}
                </section>
            `
        ).join("");
    }

    _render() {
        const nav = DOM.$("#panduanNav");
        const content = DOM.$("#panduanContent");

        if (nav) nav.innerHTML = this._renderNav();
        if (content) {
            content.innerHTML = this._renderContent();
            feather.replace();
        }
    }

    _bindScrollspy() {
        const links = DOM.$$(".panduan-nav__link");
        if (!links.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = entry.target.id;
                        links.forEach((link) => {
                            link.classList.toggle(
                                "panduan-nav__link--active",
                                link.dataset.section === id
                            );
                        });
                    }
                });
            },
            {
                rootMargin: "-100px 0px -60% 0px",
                threshold: 0,
            }
        );

        SECTIONS.forEach((s) => {
            const el = DOM.$(`#${s.id}`);
            if (el) observer.observe(el);
        });

        document.addEventListener("click", (e) => {
            const link = e.target.closest(".panduan-nav__link");
            if (!link) return;
            e.preventDefault();
            const id = link.getAttribute("href").slice(1);
            const target = DOM.$(`#${id}`);
            if (target) {
                const offset = 100;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: "smooth" });
            }
        });
    }
}

export default PanduanPage;
