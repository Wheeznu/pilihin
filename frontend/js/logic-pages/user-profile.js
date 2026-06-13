import authService from "../../../backend/services/AuthService.js";
import { loadNotifBadge } from "../utils/notif-badge.js";

class UserProfilePage {
    constructor() {
        this._user = null;
        this._photoDataUrl = null;
        this._init();
    }

    async _init() {
        if (!authService.requireAuth()) return;
        this._user = await authService.getCurrentUser();
        if (!this._user) {
            window.location.href = "/frontend/pages/main/login.html";
            return;
        }
        this._renderSidebar();
        loadNotifBadge(this._user);
        this._renderPage();
        feather.replace();
    }

    /* ─────────── SIDEBAR ─────────── */
    _renderSidebar() {
        const sidebar = document.getElementById("userSidebar");
        if (!sidebar) return;
        const u = this._user;
        const cur = window.location.pathname;

        const navItems = [
            { section: "Akun Saya" },
            { href: "/frontend/pages/user/profile.html",       icon: "user",          label: "Profil" },
            { href: "/frontend/pages/user/security.html",      icon: "shield",        label: "Keamanan" },
            { href: "/frontend/pages/user/settings.html",      icon: "settings",      label: "Pengaturan" },
            { section: "Konten" },
            { href: "/frontend/pages/user/history.html",         icon: "clock",         label: "Riwayat Tonton" },
            { href: "/frontend/pages/user/favorites.html",  icon: "heart",         label: "Favorit" },
            { href: "/frontend/pages/user/watchlist.html",       icon: "bookmark",      label: "Daftar Tonton" },
            { section: "Langganan" },
            { href: "/frontend/pages/user/subscription.html",   icon: "star",          label: "Status Langganan" },
            { href: "/frontend/pages/user/payment.html",             icon: "gift",         label: "Pembayaran & Poin" },
            { href: "/frontend/pages/user/transactions.html",   icon: "credit-card",   label: "Transaksi" },
            { href: "/frontend/pages/user/notifications.html",  icon: "bell",          label: "Notifikasi" },
        ];

        const linksHTML = navItems.map((item) => {
            if (item.section) {
                return `<span class="user-sidebar__section-label">${item.section}</span>`;
            }
            const active = cur === item.href ? " user-sidebar__link--active" : "";
            return `<a href="${item.href}" class="user-sidebar__link${active}">
                        <i data-feather="${item.icon}"></i><span>${item.label}</span>
                    </a>`;
        }).join("");

        sidebar.innerHTML = `
            <div class="user-sidebar__logo">
                <a href="/frontend/index.html">Pilih<span>.in</span></a>
            </div>
            <div class="user-sidebar__avatar-section">
                <img src="${u.profilePhoto || this._fallback(u.username)}"
                     alt="${u.username}" class="user-sidebar__avatar" id="sidebarAvatar">
                <div class="user-sidebar__user-info">
                    <div class="user-sidebar__username" id="sidebarUsername">${u.username}</div>
                    <div class="user-sidebar__role">Pengguna</div>
                </div>
            </div>
            <nav class="user-sidebar__nav">
                <a href="/frontend/index.html" class="user-sidebar__link">
                    <i data-feather="home"></i><span>Beranda</span>
                </a>
                <a href="/frontend/pages/film/katalog.html" class="user-sidebar__link">
                    <i data-feather="film"></i><span>Film</span>
                </a>
                ${linksHTML}
            </nav>
            <div class="user-sidebar__footer">
                <button class="user-sidebar__logout" id="btnLogout">
                    <i data-feather="log-out"></i><span>Keluar</span>
                </button>
            </div>
        `;

        document.getElementById("btnLogout")?.addEventListener("click", () => {
            authService.logout();
            window.location.href = "/frontend/pages/main/login.html";
        });
    }

    /* ─────────── PAGE ─────────── */
    _renderPage() {
        const main = document.getElementById("profileMain");
        if (!main) return;
        const u = this._user;
        const photo = u.profilePhoto || this._fallback(u.username);
        const joinDate = new Date(u.createdAt).toLocaleDateString("id-ID", {
            day: "numeric", month: "long", year: "numeric",
        });

        // Tier label
        const tierMap = { "tier-001": "Free", "tier-002": "Basic", "tier-003": "Standard", "tier-004": "Premium" };
        const tierLabel = tierMap[u.subscriptionTier] || "Free";

        // Extra profile fields (bisa null kalau belum diisi)
        const fullName  = u.fullName  || "";
        const gender    = u.gender    || "";
        const birthDate = u.birthDate || "";
        const bio       = u.bio       || "";
        const phone     = u.phone     || "";

        const genderOptions = ["", "Laki-laki", "Perempuan", "Lainnya"].map((opt) =>
            `<option value="${opt}" ${gender === opt ? "selected" : ""}>${opt || "Pilih jenis kelamin"}</option>`
        ).join("");

        main.innerHTML = `
            <div class="user-page">

                <!-- Page Header -->
                <div class="page-header">
                    <button class="page-header__burger" id="btnBurger" aria-label="Buka menu"><i data-feather="menu"></i></button>
                    <div class="page-header__text">
                    <h1 class="page-header__title">Profil Saya</h1>
                    <p class="page-header__subtitle">Kelola informasi akun dan foto profil kamu</p>
                    </div>
                </div>

                <!-- Profile Card -->
                <div class="profile-card">
                    <div class="profile-card__banner"></div>

                    <!-- Avatar dengan camera overlay langsung -->
                    <div class="profile-card__avatar-wrap">
                        <img src="${photo}" alt="${u.username}"
                             class="profile-card__avatar" id="profileAvatarImg">
                        <div class="profile-card__avatar-overlay">
                            <label class="avatar-action-btn" for="photoInput" title="Ganti foto">
                                <i data-feather="camera"></i>
                            </label>
                            ${u.profilePhoto ? `<button class="avatar-action-btn avatar-action-btn--danger" id="btnDeletePhoto" type="button" title="Hapus foto"><i data-feather="trash-2"></i></button>` : ""}
                        </div>
                        <input type="file" id="photoInput" accept="image/jpeg,image/png,image/webp" class="is-hidden">
                    </div>

                    <div class="profile-card__body">
                        <div class="profile-card__info">
                            <h2 class="profile-card__name" id="cardName">${u.username}</h2>
                            <p class="profile-card__email">${u.email}</p>
                            <div class="profile-card__badges">
                                <span class="badge badge--role">
                                    <i data-feather="user"></i> Pengguna
                                </span>
                                <span class="badge badge--subscription">
                                    <i data-feather="star"></i> ${tierLabel}
                                </span>
                            </div>
                        </div>
                        <div class="profile-card__join">
                            <p class="profile-card__join-label">Bergabung sejak</p>
                            <p class="profile-card__join-date">${joinDate}</p>
                        </div>
                    </div>
                </div>

                <!-- Toast area photo -->
                <div class="photo-saving-bar is-hidden" id="photoSavingBar">
                    <div class="photo-saving-bar__preview">
                        <img id="photoPreviewThumb" src="" alt="preview">
                        <div>
                            <div class="photo-saving-bar__filename" id="photoFilename"></div>
                            <div class="photo-saving-bar__filesize" id="photoFilesize"></div>
                        </div>
                    </div>
                    <div class="photo-saving-bar__actions">
                        <button class="btn btn-ghost btn-sm" id="btnCancelPhoto">
                            <i data-feather="x"></i> Batal
                        </button>
                        <button class="btn btn-primary btn-sm" id="btnSavePhoto">
                            <i data-feather="upload"></i> Simpan Foto
                        </button>
                    </div>
                </div>

                <!-- Form: Informasi Akun -->
                <div class="form-section">
                    <h3 class="form-section__title">
                        <i data-feather="edit-2"></i>
                        Informasi Akun
                    </h3>

                    <div class="form-grid">
                        <!-- Baris 1 -->
                        <div class="form-field">
                            <label for="fieldUsername">Username <span class="required">*</span></label>
                            <input type="text" id="fieldUsername" value="${u.username}"
                                   placeholder="Nama pengguna" autocomplete="off">
                            <span class="field-hint">min. 3 karakter</span>
                        </div>
                        <div class="form-field">
                            <label>Email</label>
                            <input type="email" value="${u.email}" disabled>
                            <span class="field-hint">Email tidak dapat diubah di sini</span>
                        </div>

                        <!-- Baris 2 -->
                        <div class="form-field form-grid--full">
                            <label for="fieldFullName">Nama Lengkap</label>
                            <input type="text" id="fieldFullName" value="${fullName}"
                                   placeholder="Nama lengkap anda">
                        </div>

                        <!-- Baris 3: Gender + Phone -->
                        <div class="form-field">
                            <label for="fieldGender">Jenis Kelamin</label>
                            <select id="fieldGender">${genderOptions}</select>
                        </div>
                        <div class="form-field">
                            <label for="fieldBirthDate">Tanggal Lahir</label>
                            <input type="date" id="fieldBirthDate" value="${birthDate}"
                                   max="${new Date().toISOString().split("T")[0]}">
                        </div>

                        <!-- Baris 4: Phone -->
                        <div class="form-field form-grid--full">
                            <label for="fieldPhone">Nomor HP</label>
                            <input type="tel" id="fieldPhone" value="${phone}"
                                   placeholder="+62 ..." maxlength="15"
                                   inputmode="numeric">
                            <span class="field-hint">Digunakan untuk keamanan akun</span>
                        </div>

                        <!-- Baris 5 -->
                        <div class="form-field form-grid--full">
                            <label for="fieldBio">Bio Singkat</label>
                            <textarea id="fieldBio" rows="3"
                                      placeholder="Ceritakan sedikit tentang dirimu..."
                                      maxlength="200">${bio}</textarea>
                            <span class="field-hint"><span id="bioCount">${bio.length}</span>/200 karakter</span>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button class="btn btn-ghost" id="btnResetInfo">
                            <i data-feather="rotate-ccw"></i> Reset
                        </button>
                        <button class="btn btn-primary" id="btnSaveInfo">
                            <i data-feather="check"></i> Simpan Perubahan
                        </button>
                    </div>
                </div>

            </div>
        `;

        this._bindEvents();
    }

    /* ─────────── EVENTS ─────────── */
    _bindEvents() {
        // Burger sidebar (mobile)
        this._overlay = document.createElement("div");
        this._overlay.className = "user-sidebar-overlay";
        document.body.appendChild(this._overlay);
        document.getElementById("btnBurger")?.addEventListener("click", () => {
            document.getElementById("userSidebar")?.classList.add("user-sidebar--open");
            this._overlay.classList.add("user-sidebar-overlay--visible");
            document.body.style.overflow = "hidden";
        });
        this._overlay.addEventListener("click", () => {
            document.getElementById("userSidebar")?.classList.remove("user-sidebar--open");
            this._overlay.classList.remove("user-sidebar-overlay--visible");
            document.body.style.overflow = "";
        });

        // Bio character counter
        document.getElementById("fieldBio")?.addEventListener("input", (e) => {
            document.getElementById("bioCount").textContent = e.target.value.length;
        });

        // Photo input
        document.getElementById("photoInput")?.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) this._handlePhotoFile(file);
        });

        document.getElementById("btnCancelPhoto")?.addEventListener("click", () => this._resetPhotoBar());
        document.getElementById("btnSavePhoto")?.addEventListener("click", () => this._savePhoto());
        document.getElementById("btnDeletePhoto")?.addEventListener("click", () => this._deletePhoto());

        // Info form
        document.getElementById("btnResetInfo")?.addEventListener("click", () => this._resetInfoForm());
        document.getElementById("btnSaveInfo")?.addEventListener("click", () => this._saveInfo());
    }

    /* ─────────── PHOTO HANDLING ─────────── */
    _handlePhotoFile(file) {
        if (!file.type.startsWith("image/")) {
            this._toast("Format tidak didukung. Gunakan JPG, PNG, atau WEBP.", "error");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            this._toast("Ukuran file terlalu besar. Maks. 2MB.", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this._photoDataUrl = e.target.result;
            // Preview di avatar langsung
            document.getElementById("profileAvatarImg").src = this._photoDataUrl;
            // Tampil saving bar
            const bar = document.getElementById("photoSavingBar");
            bar.classList.remove("is-hidden");
            document.getElementById("photoPreviewThumb").src = this._photoDataUrl;
            document.getElementById("photoFilename").textContent = file.name;
            document.getElementById("photoFilesize").textContent = `${(file.size / 1024).toFixed(1)} KB`;
            feather.replace();
        };
        reader.readAsDataURL(file);
    }

    _resetPhotoBar() {
        this._photoDataUrl = null;
        document.getElementById("photoInput").value = "";
        document.getElementById("photoSavingBar").classList.add("is-hidden");
        // Kembalikan avatar ke foto asli
        document.getElementById("profileAvatarImg").src =
            this._user.profilePhoto || this._fallback(this._user.username);
    }

    async _savePhoto() {
        if (!this._photoDataUrl) return;
        const btn = document.getElementById("btnSavePhoto");
        btn.disabled = true;
        btn.innerHTML = '<i data-feather="loader"></i> Menyimpan...';
        feather.replace();

        try {
            const res = await fetch("http://localhost:3000/api/auth/update-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: this._user.id, profilePhoto: this._photoDataUrl }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            this._user = data.user;
            document.getElementById("sidebarAvatar").src = this._photoDataUrl;
            document.getElementById("photoSavingBar").classList.add("is-hidden");
            document.getElementById("photoInput").value = "";
            this._photoDataUrl = null;
            this._toast("Foto profil berhasil diperbarui!", "success");
        } catch (err) {
            const msg = err.message === "Failed to fetch"
                ? "Server tidak terhubung. Jalankan: node backend/server.js"
                : (err.message || "Gagal menyimpan perubahan.");
            this._toast(msg, "error");
            btn.disabled = false;
            btn.innerHTML = '<i data-feather="upload"></i> Simpan Foto';
            feather.replace();
        }
    }

    /* ─────────── INFO FORM ─────────── */
    _resetInfoForm() {
        const u = this._user;
        document.getElementById("fieldUsername").value  = u.username  || "";
        document.getElementById("fieldFullName").value  = u.fullName  || "";
        document.getElementById("fieldGender").value    = u.gender    || "";
        document.getElementById("fieldBirthDate").value = u.birthDate || "";
        document.getElementById("fieldBio").value       = u.bio       || "";
        document.getElementById("bioCount").textContent = (u.bio || "").length;
        document.getElementById("fieldPhone").value     = u.phone     || "";
        // Clear errors
        document.querySelectorAll(".input--error").forEach((el) => el.classList.remove("input--error"));
        document.querySelectorAll(".field-error").forEach((el) => el.remove());
    }

    async _saveInfo() {
        // Validasi
        const usernameEl = document.getElementById("fieldUsername");
        const username   = usernameEl.value.trim();
        usernameEl.classList.remove("input--error");
        usernameEl.parentNode.querySelector(".field-error")?.remove();

        if (username.length < 3) {
            usernameEl.classList.add("input--error");
            const err = document.createElement("span");
            err.className = "field-error";
            err.textContent = "Username minimal 3 karakter";
            usernameEl.parentNode.appendChild(err);
            return;
        }

        const payload = {
            userId:    this._user.id,
            username,
            fullName:  document.getElementById("fieldFullName").value.trim(),
            gender:    document.getElementById("fieldGender").value,
            birthDate: document.getElementById("fieldBirthDate").value,
            bio:       document.getElementById("fieldBio").value.trim(),
            phone:     document.getElementById("fieldPhone").value.trim(),
        };

        const btn = document.getElementById("btnSaveInfo");
        btn.disabled = true;
        btn.innerHTML = '<i data-feather="loader"></i> Menyimpan...';
        feather.replace();

        try {
            const res = await fetch("http://localhost:3000/api/auth/update-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            this._user = data.user;
            // Update card & sidebar
            document.getElementById("cardName").textContent = username;
            document.getElementById("sidebarUsername").textContent = username;
            this._toast("Informasi akun berhasil disimpan!", "success");
        } catch (err) {
            this._toast(err.message || "Gagal menyimpan. Pastikan server berjalan.", "error");
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i data-feather="check"></i> Simpan Perubahan';
            feather.replace();
        }
    }

    /* ─────────── HELPERS ─────────── */
    async _deletePhoto() {
        if (!confirm("Hapus foto profil? Foto akan diganti dengan avatar default.")) return;

        const btn = document.getElementById("btnDeletePhoto");
        if (btn) { btn.disabled = true; btn.innerHTML = '<i data-feather="loader"></i>'; feather.replace(); }

        try {
            const res = await fetch("http://localhost:3000/api/auth/update-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: this._user.id, profilePhoto: null }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            this._user = data.user;
            const fallback = this._fallback(this._user.username);

            // Update avatar di card dan sidebar
            document.getElementById("profileAvatarImg").src = fallback;
            document.getElementById("sidebarAvatar").src = fallback;

            // Sembunyikan tombol hapus (tidak ada foto lagi)
            btn?.remove();

            this._toast("Foto profil dihapus.", "success");
        } catch (err) {
            const msg = err.message === "Failed to fetch"
                ? "Server tidak terhubung. Jalankan: node backend/server.js"
                : err.message;
            this._toast(msg, "error");
            if (btn) { btn.disabled = false; btn.innerHTML = '<i data-feather="trash-2"></i>'; feather.replace(); }
        }
    }

    _toast(message, type = "success") {
        document.querySelector(".toast")?.remove();
        const icon  = type === "success" ? "check-circle" : "alert-circle";
        const toast = document.createElement("div");
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `<i data-feather="${icon}"></i><span>${message}</span>`;
        document.body.appendChild(toast);
        feather.replace();
        requestAnimationFrame(() => toast.classList.add("toast--visible"));
        setTimeout(() => {
            toast.classList.remove("toast--visible");
            setTimeout(() => toast.remove(), 350);
        }, 3500);
    }

    _fallback(name) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1db954&color=fff`;
    }
}

export default UserProfilePage;