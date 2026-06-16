# Pilih.in

Platform streaming film berbasis web dengan sistem manajemen konten, langganan berbayar, dan tiga tingkat akses pengguna.

---

## Daftar Isi

- [Cara Menggunakan](#cara-menggunakan)
- [Cara Kerja Frontend ke Backend](#cara-kerja-frontend-ke-backend)
- [Logika Fitur](#logika-fitur)
- [Struktur Data](#struktur-data)
- [Teknologi](#teknologi)

---

## Cara Menggunakan

### Untuk Pengunjung (Belum Login)

- Buka halaman utama di `frontend/index.html` untuk melihat film trending, terbaru, artikel, dan berita.
- Cari film melalui halaman katalog atau search.
- Lihat detail film, sinopsis, pemeran, sutradara, dan ulasan.
- Baca artikel dan berita hiburan.
- Lihat halaman FAQ, About Us, Kebijakan Privasi.
- Daftar akun baru melalui halaman Register.
- Login melalui halaman Login.

### Untuk Pengguna (User) yang Sudah Login

Setelah login, pengguna memiliki akses ke halaman pengguna melalui sidebar:
- **Profil** -- melihat dan mengedit data diri.
- **Pengaturan** -- mengubah preferensi akun.
- **Keamanan** -- mengganti kata sandi.
- **Riwayat** -- melihat riwayat tontonan film.
- **Watchlist** -- daftar film yang ingin ditonton.
- **Film Favorit** / **Aktor Favorit** / **Sutradara Favorit** -- menyimpan favorit.
- **Langganan** -- melihat paket langganan aktif (Basic gratis, Standard Rp49.000/bulan, Premium Rp79.000/bulan).
- **Pembayaran** -- metode pembayaran dan riwayat transaksi.
- **Poin** -- menukarkan poin loyalitas.
- **Notifikasi** -- melihat pemberitahuan.

Pengguna juga bisa:
- Memberi rating dan ulasan pada film.
- Menonton video streaming (memerlukan login).
- Menggunakan kode promo dari halaman Promo.
- Berlangganan melalui halaman Harga Langganan.

### Untuk Admin

Admin mengelola konten website melalui 9 halaman admin:
- Kelola film (tambah, edit, hapus).
- Kelola aktor dan sutradara.
- Kelola artikel.
- Kelola FAQ.
- Edit profil admin.

Akses admin didapatkan jika role akun adalah "admin".

### Untuk Manager

Manager memiliki akses lebih luas dari admin, meliputi:
- **Persetujuan Konten** -- menyetujui atau menolak konten yang dibuat pengguna, termasuk film, aktor, sutradara, artikel, dan berita. Konten yang disetujui otomatis dipindahkan dari file content.json ke file seed data masing-masing.
- **Balas Ulasan** -- membalas ulasan pengguna pada film.
- **Kirim Notifikasi** -- mengirim notifikasi ke pengguna (disimpan di localStorage).
- **Kelola Akun** -- mengubah peran pengguna, menonaktifkan, atau membanned akun.
- **Laporan** -- melihat laporan pendapatan dan traffic.
- **Ekspor Data** -- mengekspor data ke CSV.

Akses manager didapatkan jika role akun adalah "manager". Manager adalah super admin yang memiliki semua kemampuan admin ditambah fitur di atas.

---

## Cara Kerja Frontend ke Backend

### Arsitektur Umum

Aplikasi ini menggunakan arsitektur sederhana tanpa framework:

```
Browser (Frontend)
  |  localStorage "pilih-in-db"  (cache data)
  |  localStorage "pilih-in-session"  (session login)
  |
  |   fetch() / apiRequest()
  |
  v
Node.js HTTP Server (Port 3000)
  |   membaca/menulis file JSON
  v
File System (data/*.json)
```

### Inisialisasi Awal (init.js)

Saat halaman pertama kali dibuka, `init.js` melakukan:

1. Membaca localStorage. Jika belum ada data atau versi berbeda, jalankan `_loadSeedData()`.
2. `_loadSeedData()` mengambil semua file dari folder `data/` (data-film.json, data-actor.json, dll.) melalui fetch HTTP.
3. Data tersebut disimpan ke localStorage dengan key `pilih-in-db`.
4. Kemudian `_syncFromApi()` dipanggil untuk mengambil data tambahan dari server (konten buatan pengguna yang sudah disetujui).
5. Data dari server digabungkan dengan data localStorage. Data server menimpa data lokal jika ada conflict.
6. Repository siap digunakan oleh halaman-halaman frontend.

### Alur Baca Data

Untuk operasi baca (seperti menampilkan daftar film di halaman utama):

1. Halaman memanggil `repositories.films.findPublished()` atau method lain.
2. Repository membaca dari `DatabaseManager` yang membaca dari localStorage `pilih-in-db`.
3. Data langsung ditampilkan. Tidak ada panggilan API untuk baca data publik.

Untuk data pengguna (favorit, watchlist, riwayat), dua pendekatan digunakan:
- **Film favorit dan watchlist** dibaca dari server melalui UserData API.
- **Aktor/sutradara favorit** dibaca dari localStorage langsung.

### Alur Tulis Data

Untuk operasi tulis (seperti registrasi, buat konten, ubah role):

1. Halaman mengirim request ke server API melalui `apiRequest()` atau fetch langsung.
2. Server (server.js) memproses request, membaca/menulis file JSON di folder `data/`.
3. Server mengembalikan response sukses/gagal.
4. Setelah sukses, halaman frontend juga menyimpan perubahan ke localStorage agar data tetap sinkron.

Contoh alur registrasi:
1. User isi form register.
2. Frontend kirim `POST /api/auth/register` dengan data user.
3. Server baca `account.json`, cek email duplikat, tambah user baru, simpan file.
4. Server kembali ke frontend dengan data user baru.
5. Frontend simpan user baru ke localStorage `pilih-in-db` untuk referensi local.
6. User diarahkan ke halaman login.

---

## Logika Fitur

### Manajemen Akun

**Registrasi:**
- User mengisi username, email, dan password.
- Frontend mengirim data ke `POST /api/auth/register`.
- Server memvalidasi email belum terdaftar di `account.json`.
- Data user baru ditambahkan dengan role default "user" dan status "active".
- Password disimpan sebagai teks biasa (tanpa hashing).
- File `account.json` ditulis ulang.

**Login:**
- User memasukkan email dan password.
- AuthService mengambil data dari `account.json`.
- Password dibandingkan langsung (plaintext).
- Jika cocok dan status aktif, session disimpan di localStorage dengan key `pilih-in-session`.
- Session berisi userId, username, email, role, dan waktu login.
- Role menentukan halaman yang bisa diakses setelah login.

**Role Akun:**
- Tiga level: `user` (default), `admin`, `manager`.
- Manager bisa mengubah role akun melalui halaman Kelola Akun.
- Manager juga bisa menonaktifkan (suspend) atau banned akun.

**Lupa Sandi:**
- User memasukkan email.
- Frontend mengirim `POST /api/auth/forgot-password`.
- Server mencari user berdasarkan email, membuat reset token, dan menyimpannya.
- Token dikembalikan ke frontend (tidak ada pengiriman email sungguhan).

### Manajemen Film

**Menambah Film (oleh Admin):**
- Admin mengisi form di halaman admin/film-create.html.
- Data film dikirim ke server API.
- Server menambahkan film ke `data-film.json` (seed file).
- Film muncul di localStorage setelah `_syncFromApi()` berikutnya.

**Menambah Film (oleh User Biasa):**
- User membuat konten film melalui halaman konten.
- Data masuk ke `content.json` dengan status "pending".
- Manager menyetujui atau menolak melalui halaman Approvals.
- Jika disetujui, server memindahkan data dari `content.json` ke `data-film.json`.
- Jika ditolak, data dihapus dari `content.json`.

**Approval Konten:**
- Manager melihat daftar konten pending dari `content.json`.
- Tombol Approve akan memindahkan konten ke file seed (data-film.json, data-actor.json, dll).
- Tombol Reject akan menghapus konten dari `content.json`.
- Semua perubahan dilakukan oleh server API.

### Langganan dan Pembayaran

- Tiga tier: Basic (gratis), Standard (Rp49.000/bulan), Premium (Rp79.000/bulan).
- User memilih paket dari halaman pricing atau promo.
- Pembayaran diproses oleh `POST /api/payment/process`.
- Server mencatat transaksi di `transactions.json`, memperbarui subscription user di `account.json`.
- Server juga mengelola poin loyalitas: user mendapat bonus poin saat berlangganan.
- Poin bisa ditukarkan di halaman Redeem Points.

### Favorit dan Watchlist

- Tombol Favorit dan Watchlist ada di halaman detail film.
- Untuk film: data disimpan di server melalui UserData API dan di localStorage.
- Untuk aktor dan sutradara: data disimpan di localStorage saja (konsisten dengan halaman profil aktor/sutradara yang juga localStorage).
- Halaman Favorit Film dan Watchlist membaca dari server API.
- Halaman Favorit Aktor dan Favorit Sutradara membaca dari localStorage.

### Hero Banner (Halaman Utama)

- Menampilkan 5 film terbaik berdasarkan rating dan jumlah tontonan.
- Gambar menggunakan poster dari folder `frontend/assets/posters/`.
- Tombol Tonton mengarah ke halaman detail film (bagian video).
- Tombol Selengkapnya mengarah ke halaman detail film (bagian info judul).
- State sidebar (buka/tutup) disimpan di localStorage.

---

## Struktur Data

### File-file Data

Semua data disimpan sebagai file JSON di folder `data/`:

| File | Fungsi |
|------|--------|
| `account.json` | Data akun pengguna (username, email, password, role, status, subscription). |
| `data-film.json` | Data film (judul, sinopsis, genre, pemeran, rating, poster, URL streaming). |
| `data-actor.json` | Data aktor. |
| `data-director.json` | Data sutradara. |
| `genres.json` | Daftar genre film. |
| `data-artikel.json` | Artikel. |
| `data-berita.json` | Berita. |
| `faq.json` | Pertanyaan umum. |
| `pricing-tiers.json` | Paket harga langganan. |
| `promotions.json` | Kode promo. |
| `user-data.json` | Data per pengguna (favorit, watchlist, riwayat, notifikasi). |
| `userpoints.json` | Poin loyalitas per pengguna. |
| `transactions.json` | Riwayat transaksi pembayaran. |
| `content.json` | Konten buatan pengguna yang menunggu persetujuan. |
| `contact-messages.json` | Pesan dari halaman kontak. |

### Local Storage (Browser)

| Key | Fungsi |
|-----|--------|
| `pilih-in-db` | Cache data utama (film, aktor, sutradara, genre, artikel, dll). |
| `pilih-in-session` | Session login pengguna. |
| `pilih-in-theme` | Preferensi tema (dark/light). |
| `pilih-in-initialized` | Penanda bahwa seed data sudah dimuat. |
| `pilih-in-sidebar-closed` | State sidebar (tertutup/terbuka). |

---

## Teknologi

- **Frontend:** HTML, CSS, JavaScript (ES Modules) -- tanpa framework.
- **Backend:** Node.js (HTTP module built-in) -- tanpa framework, port 3000.
- **Penyimpanan:** File JSON di filesystem + localStorage browser.
- **Ikon:** Feather Icons.
- **Font:** Poppins, Google Sans Flex.
- **Poster Film:** File JPG lokal di `frontend/assets/posters/`.
