import authService from "../../../backend/services/AuthService.js";
import { loadNotifBadge } from "../utils/notif-badge.js";

class UserSecurityPage {
    constructor() {
        this._user = null;
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
        this._initPasswordInfoMode();
        this._bindEvents();
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
            { href: "/frontend/pages/user/profile.html",             icon: "user",        label: "Profil" },
            { href: "/frontend/pages/user/security.html",            icon: "shield",      label: "Keamanan" },
            { href: "/frontend/pages/user/settings.html",            icon: "settings",    label: "Pengaturan" },
            { section: "Konten" },
            { href: "/frontend/pages/user/history.html",             icon: "clock",       label: "Riwayat Tonton" },
            { href: "/frontend/pages/user/favorites.html",      icon: "heart",       label: "Favorit" },
            { href: "/frontend/pages/user/watchlist.html",           icon: "bookmark",    label: "Daftar Tonton" },
            { section: "Langganan" },
            { href: "/frontend/pages/user/subscription.html",        icon: "star",        label: "Status Langganan" },
            { href: "/frontend/pages/user/payment.html",             icon: "gift",         label: "Pembayaran & Poin" },
            { href: "/frontend/pages/user/transactions.html",        icon: "credit-card", label: "Transaksi" },
            { href: "/frontend/pages/user/notifications.html",       icon: "bell",        label: "Notifikasi" },
        ];

        const linksHTML = navItems.map((item) => {
            if (item.section) return `<span class="user-sidebar__section-label">${item.section}</span>`;
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
                     alt="${u.username}" class="user-sidebar__avatar">
                <div class="user-sidebar__user-info">
                    <div class="user-sidebar__username">${u.username}</div>
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
        const main = document.getElementById("securityMain");
        if (!main) return;
        const u = this._user;

        const session  = authService.getSession();
        const loginAt  = session?.loginAt
            ? new Date(session.loginAt).toLocaleString("id-ID", {
                day: "numeric", month: "long", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })
            : "Tidak diketahui";

        const joinDate = new Date(u.createdAt).toLocaleDateString("id-ID", {
            day: "numeric", month: "long", year: "numeric",
        });

        const ua      = navigator.userAgent;
        const browser = ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox"
                      : ua.includes("Safari") ? "Safari" : ua.includes("Edge") ? "Edge" : "Browser";
        const os      = ua.includes("Windows") ? "Windows" : ua.includes("Mac") ? "macOS"
                      : ua.includes("Linux") ? "Linux" : ua.includes("Android") ? "Android"
                      : ua.includes("iPhone") ? "iPhone" : "Perangkat";

        main.innerHTML = `
            <div class="user-page">

                <!-- Page Header -->
                <div class="page-header">
                    <button class="page-header__burger" id="btnBurger" aria-label="Buka menu"><i data-feather="menu"></i></button>
                    <div class="page-header__text">
                    <h1 class="page-header__title">Keamanan Akun</h1>
                    <p class="page-header__subtitle">Kelola password dan keamanan akun kamu</p>
                    </div>
                </div>

                <!-- Status Cards -->
                <div class="security-status">
                    <div class="security-status__item">
                        <div class="security-status__icon security-status__icon--ok">
                            <i data-feather="shield"></i>
                        </div>
                        <div class="security-status__text">
                            <p class="security-status__label">Status Akun</p>
                            <p class="security-status__value">Aktif &amp; Aman</p>
                        </div>
                    </div>
                    <div class="security-status__item">
                        <div class="security-status__icon security-status__icon--info">
                            <i data-feather="log-in"></i>
                        </div>
                        <div class="security-status__text">
                            <p class="security-status__label">Login Terakhir</p>
                            <p class="security-status__value">${loginAt}</p>
                        </div>
                    </div>
                    <div class="security-status__item">
                        <div class="security-status__icon security-status__icon--ok">
                            <i data-feather="calendar"></i>
                        </div>
                        <div class="security-status__text">
                            <p class="security-status__label">Akun Dibuat</p>
                            <p class="security-status__value">${joinDate}</p>
                        </div>
                    </div>
                </div>

                <!-- Ganti Password -->
                <div class="form-section">
                    <h3 class="form-section__title">
                        <i data-feather="lock"></i>
                        Password
                    </h3>

                    <!-- INFO MODE -->
                    <div id="passwordInfoMode">
                        <div class="password-info-row">
                            <div class="password-info-left">
                                <div class="password-info-label">Password saat ini</div>
                                <div class="password-info-masked" id="passwordMasked"></div>
                                <div class="password-info-hint">Terakhir diperbarui: <span id="passwordUpdatedAt"></span></div>
                            </div>
                            <button class="btn btn-ghost" id="btnShowChangeForm">
                                <i data-feather="edit-2"></i> Ganti Password
                            </button>
                        </div>
                    </div>

                    <!-- FORM MODE (tersembunyi) -->
                    <div id="passwordFormMode" class="password-form-collapsible">
                        <p class="form-section__desc form-section__desc--top">
                            Pastikan password baru minimal 8 karakter, mengandung huruf besar, kecil, dan angka.
                        </p>
                        <div class="form-grid form-grid--single">
                            <div class="form-field">
                                <label for="fieldCurrentPassword">Password Saat Ini</label>
                                <div class="input-wrap">
                                    <input type="password" id="fieldCurrentPassword"
                                           placeholder="Masukkan password saat ini" autocomplete="current-password">
                                    <button type="button" class="input-wrap__toggle" data-toggle="fieldCurrentPassword">
                                        <i data-feather="eye"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="form-field">
                                <label for="fieldNewPassword">Password Baru</label>
                                <div class="input-wrap">
                                    <input type="password" id="fieldNewPassword"
                                           placeholder="Buat password baru" autocomplete="new-password">
                                    <button type="button" class="input-wrap__toggle" data-toggle="fieldNewPassword">
                                        <i data-feather="eye"></i>
                                    </button>
                                </div>
                                <div class="password-strength" id="strengthWrap" class="is-hidden">
                                    <div class="password-strength__bar">
                                        <div class="password-strength__fill" id="strengthFill"></div>
                                    </div>
                                    <p class="password-strength__label" id="strengthLabel"></p>
                                </div>
                            </div>
                            <div class="form-field">
                                <label for="fieldConfirmPassword">Konfirmasi Password Baru</label>
                                <div class="input-wrap">
                                    <input type="password" id="fieldConfirmPassword"
                                           placeholder="Ulangi password baru" autocomplete="new-password">
                                    <button type="button" class="input-wrap__toggle" data-toggle="fieldConfirmPassword">
                                        <i data-feather="eye"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button class="btn btn-ghost" id="btnCancelChangePassword">
                                <i data-feather="x"></i> Batal
                            </button>
                            <button class="btn btn-ghost" id="btnResetPassword">
                                <i data-feather="rotate-ccw"></i> Reset
                            </button>
                            <button class="btn btn-primary" id="btnSavePassword">
                                <i data-feather="lock"></i> Simpan Password
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Ganti Email -->
                <div class="form-section">
                    <h3 class="form-section__title">
                        <i data-feather="mail"></i>
                        Email
                    </h3>

                    <!-- INFO MODE -->
                    <div id="emailInfoMode">
                        <div class="password-info-row">
                            <div class="password-info-left">
                                <div class="password-info-label">Email saat ini</div>
                                <div class="password-info-value" id="currentEmailDisplay">${u.email}</div>
                            </div>
                            <button class="btn btn-ghost" id="btnShowChangeEmail">
                                <i data-feather="edit-2"></i> Ganti Email
                            </button>
                        </div>
                    </div>

                    <!-- FORM MODE (tersembunyi) -->
                    <div id="changeEmailForm" class="password-form-collapsible">
                        <div class="form-grid form-grid--single form-grid--top">
                            <div class="form-field">
                                <label for="fieldNewEmail">Email Baru</label>
                                <input type="email" id="fieldNewEmail"
                                       placeholder="Masukkan email baru" autocomplete="off">
                            </div>
                            <div class="form-field">
                                <label for="fieldEmailPassword">Konfirmasi dengan Password</label>
                                <div class="input-wrap">
                                    <input type="password" id="fieldEmailPassword"
                                           placeholder="Masukkan password kamu" autocomplete="current-password">
                                    <button type="button" class="input-wrap__toggle" data-toggle="fieldEmailPassword">
                                        <i data-feather="eye"></i>
                                    </button>
                                </div>
                                <span class="field-hint">Diperlukan untuk memverifikasi identitas kamu</span>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button class="btn btn-ghost" id="btnCancelChangeEmail">
                                <i data-feather="x"></i> Batal
                            </button>
                            <button class="btn btn-primary" id="btnSaveEmail">
                                <i data-feather="check"></i> Simpan Email Baru
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Sesi Aktif -->
                <div class="form-section">
                    <h3 class="form-section__title">
                        <i data-feather="monitor"></i>
                        Sesi Aktif
                    </h3>
                    <p class="form-section__desc">Berikut perangkat yang sedang login ke akun kamu.</p>
                    <div class="session-list">
                        <div class="session-item session-item--current">
                            <div class="session-item__left">
                                <div class="session-item__icon">
                                    <i data-feather="monitor"></i>
                                </div>
                                <div class="session-item__info">
                                    <p class="session-item__device">
                                        ${browser} di ${os}
                                        <span class="badge-current">
                                            <i data-feather="check"></i> Sesi ini
                                        </span>
                                    </p>
                                    <p class="session-item__meta">Login sejak ${loginAt}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-danger" id="btnLogoutAll">
                            <i data-feather="log-out"></i> Keluar dari Semua Perangkat
                        </button>
                    </div>
                </div>

                <!-- Danger Zone -->
                <div class="danger-zone">
                    <h3 class="danger-zone__title">
                        <i data-feather="alert-triangle"></i>
                        Zona Berbahaya
                    </h3>
                    <div class="danger-action">
                        <div class="danger-action__info">
                            <p class="danger-action__name">Nonaktifkan Akun Sementara</p>
                            <p class="danger-action__desc">Akun kamu akan disembunyikan sementara. Bisa diaktifkan kembali kapan saja dengan login.</p>
                        </div>
                        <button class="btn btn-danger" id="btnDeactivate">
                            <i data-feather="pause-circle"></i> Nonaktifkan
                        </button>
                    </div>
                    <div class="danger-action">
                        <div class="danger-action__info">
                            <p class="danger-action__name">Hapus Akun Permanen</p>
                            <p class="danger-action__desc">Semua data akan dihapus selamanya. Tindakan ini <strong>tidak dapat dibatalkan</strong>.</p>
                        </div>
                        <button class="btn btn-danger" id="btnDeleteAccount">
                            <i data-feather="trash-2"></i> Hapus Akun
                        </button>
                    </div>
                </div>

            </div>

            <!-- Modal Nonaktifkan -->
            <div class="modal-backdrop" id="modalDeactivate">
                <div class="modal">
                    <div class="modal__header">
                        <h3 class="modal__title"><i data-feather="pause-circle"></i> Nonaktifkan Akun</h3>
                        <button class="modal__close" data-close="modalDeactivate"><i data-feather="x"></i></button>
                    </div>
                    <div class="modal__body">
                        Akun <strong>${u.username}</strong> akan dinonaktifkan sementara.
                        Kamu masih bisa login kembali kapan saja untuk mengaktifkannya lagi.
                    </div>
                    <div class="modal__input-wrap">
                        <label for="deactivatePassword">Konfirmasi dengan password kamu</label>
                        <input type="password" id="deactivatePassword" placeholder="Password saat ini">
                    </div>
                    <div class="modal__footer">
                        <button class="btn btn-ghost" data-close="modalDeactivate">Batal</button>
                        <button class="btn btn-danger" id="btnConfirmDeactivate">
                            <i data-feather="pause-circle"></i> Ya, Nonaktifkan
                        </button>
                    </div>
                </div>
            </div>

            <!-- Modal Hapus Akun -->
            <div class="modal-backdrop" id="modalDelete">
                <div class="modal">
                    <div class="modal__header">
                        <h3 class="modal__title"><i data-feather="trash-2"></i> Hapus Akun Permanen</h3>
                        <button class="modal__close" data-close="modalDelete"><i data-feather="x"></i></button>
                    </div>
                    <div class="modal__body">
                        Tindakan ini akan menghapus akun <strong>${u.username}</strong> beserta seluruh data
                        secara permanen dan <strong>tidak dapat dibatalkan</strong>.
                        Ketik <strong>"HAPUS"</strong> untuk melanjutkan.
                    </div>
                    <div class="modal__input-wrap">
                        <label for="deleteConfirmText">Ketik HAPUS untuk konfirmasi</label>
                        <input type="text" id="deleteConfirmText" placeholder="HAPUS">
                    </div>
                    <div class="modal__input-wrap">
                        <label for="deletePassword">Password kamu</label>
                        <input type="password" id="deletePassword" placeholder="Password saat ini">
                    </div>
                    <div class="modal__footer">
                        <button class="btn btn-ghost" data-close="modalDelete">Batal</button>
                        <button class="btn btn-danger" id="btnConfirmDelete">
                            <i data-feather="trash-2"></i> Hapus Selamanya
                        </button>
                    </div>
                </div>
            </div>
        `;
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

        // Toggle show/hide password
        document.querySelectorAll(".input-wrap__toggle").forEach((btn) => {
            btn.addEventListener("click", () => {
                const input = document.getElementById(btn.dataset.toggle);
                if (!input) return;
                const isText = input.type === "text";
                input.type = isText ? "password" : "text";
                btn.innerHTML = isText ? '<i data-feather="eye"></i>' : '<i data-feather="eye-off"></i>';
                feather.replace();
            });
        });

        // Password info ↔ form toggle
        document.getElementById("btnShowChangeForm")?.addEventListener("click", () => {
            document.getElementById("passwordInfoMode").classList.add("is-hidden");
            document.getElementById("passwordFormMode").classList.add("password-form-collapsible--open");
        });
        document.getElementById("btnCancelChangePassword")?.addEventListener("click", () => {
            document.getElementById("passwordInfoMode").classList.remove("is-hidden");
            document.getElementById("passwordFormMode").classList.remove("password-form-collapsible--open");
            this._clearPasswordForm();
        });

        // Password strength
        document.getElementById("fieldNewPassword")?.addEventListener("input", (e) => {
            this._updateStrength(e.target.value);
        });

        document.getElementById("btnResetPassword")?.addEventListener("click", () => this._clearPasswordForm());
        document.getElementById("btnSavePassword")?.addEventListener("click", () => this._savePassword());

        // Email info ↔ form toggle
        document.getElementById("btnShowChangeEmail")?.addEventListener("click", () => {
            document.getElementById("emailInfoMode").classList.add("is-hidden");
            document.getElementById("changeEmailForm").classList.add("password-form-collapsible--open");
        });
        document.getElementById("btnCancelChangeEmail")?.addEventListener("click", () => this._cancelChangeEmail());
        document.getElementById("btnSaveEmail")?.addEventListener("click", () => this._saveEmail());

        // Logout semua
        document.getElementById("btnLogoutAll")?.addEventListener("click", () => {
            authService.logout();
            this._toast("Berhasil keluar dari semua perangkat.", "success");
            setTimeout(() => { window.location.href = "/frontend/pages/main/login.html"; }, 1200);
        });

        // Modal triggers
        document.getElementById("btnDeactivate")?.addEventListener("click", () => this._openModal("modalDeactivate"));
        document.getElementById("btnDeleteAccount")?.addEventListener("click", () => this._openModal("modalDelete"));
        document.querySelectorAll("[data-close]").forEach((btn) => {
            btn.addEventListener("click", () => this._closeModal(btn.dataset.close));
        });
        document.querySelectorAll(".modal-backdrop").forEach((bd) => {
            bd.addEventListener("click", (e) => { if (e.target === bd) this._closeModal(bd.id); });
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                document.querySelectorAll(".modal-backdrop--visible").forEach((m) => this._closeModal(m.id));
            }
        });
        document.getElementById("btnConfirmDeactivate")?.addEventListener("click", () => this._deactivateAccount());
        document.getElementById("btnConfirmDelete")?.addEventListener("click", () => this._deleteAccount());
    }

    /* ─────────── PASSWORD INFO MODE ─────────── */
    _initPasswordInfoMode() {
        const u = this._user;
        const maskedEl = document.getElementById("passwordMasked");
        if (maskedEl) maskedEl.textContent = "•".repeat(u.password.length);

        const updEl = document.getElementById("passwordUpdatedAt");
        if (updEl) {
            updEl.textContent = u.updatedAt
                ? new Date(u.updatedAt).toLocaleDateString("id-ID", {
                    day: "numeric", month: "long", year: "numeric",
                  })
                : "Tidak diketahui";
        }
    }

    _clearPasswordForm() {
        ["fieldCurrentPassword", "fieldNewPassword", "fieldConfirmPassword"].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
        const wrap = document.getElementById("strengthWrap");
        if (wrap) wrap.classList.add("is-hidden");
        document.querySelectorAll("#passwordFormMode .field-error").forEach((el) => el.remove());
        document.querySelectorAll("#passwordFormMode .input--error").forEach((el) => el.classList.remove("input--error"));
    }

    /* ─────────── PASSWORD STRENGTH ─────────── */
    _updateStrength(value) {
        const wrap  = document.getElementById("strengthWrap");
        const fill  = document.getElementById("strengthFill");
        const label = document.getElementById("strengthLabel");
        if (!wrap) return;

        if (!value) { wrap.classList.add("is-hidden"); return; }
        wrap.classList.remove("is-hidden");

        let score = 0;
        if (value.length >= 8)               score++;
        if (/[A-Z]/.test(value))             score++;
        if (/[0-9]/.test(value))             score++;
        if (/[^A-Za-z0-9]/.test(value))      score++;

        const levels = [
            { cls: "weak",   text: "Lemah" },
            { cls: "weak",   text: "Lemah" },
            { cls: "medium", text: "Sedang" },
            { cls: "strong", text: "Kuat" },
            { cls: "strong", text: "Sangat Kuat" },
        ];
        const lvl = levels[score];
        fill.className  = `password-strength__fill password-strength__fill--${lvl.cls}`;
        label.className = `password-strength__label password-strength__label--${lvl.cls}`;
        label.textContent = lvl.text;
    }

    /* ─────────── SAVE PASSWORD ─────────── */
    async _savePassword() {
        document.querySelectorAll("#passwordFormMode .field-error").forEach((el) => el.remove());
        document.querySelectorAll("#passwordFormMode .input--error").forEach((el) => el.classList.remove("input--error"));

        const currentPwd = document.getElementById("fieldCurrentPassword").value;
        const newPwd     = document.getElementById("fieldNewPassword").value;
        const confirmPwd = document.getElementById("fieldConfirmPassword").value;

        let hasError = false;
        const showErr = (id, msg) => {
            const input = document.getElementById(id);
            input.classList.add("input--error");
            const sp = document.createElement("span");
            sp.className = "field-error";
            sp.textContent = msg;
            input.closest(".form-field").appendChild(sp);
            hasError = true;
        };

        if (!currentPwd)                        showErr("fieldCurrentPassword", "Password saat ini wajib diisi");
        else if (currentPwd !== this._user.password) showErr("fieldCurrentPassword", "Password saat ini salah");

        if (!newPwd)              showErr("fieldNewPassword", "Password baru wajib diisi");
        else if (newPwd.length < 8)    showErr("fieldNewPassword", "Minimal 8 karakter");
        else if (newPwd === currentPwd) showErr("fieldNewPassword", "Password baru harus berbeda dari yang lama");

        if (!confirmPwd)               showErr("fieldConfirmPassword", "Konfirmasi password wajib diisi");
        else if (confirmPwd !== newPwd) showErr("fieldConfirmPassword", "Konfirmasi password tidak cocok");

        if (hasError) return;

        const btn = document.getElementById("btnSavePassword");
        btn.disabled = true;
        btn.innerHTML = '<i data-feather="loader"></i> Menyimpan...';
        feather.replace();

        try {
            const res = await fetch("http://localhost:3000/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: this._user.id,
                    currentPassword: currentPwd,
                    newPassword: newPwd,
                }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            this._user = data.user;
            // Kembali ke info mode
            document.getElementById("passwordInfoMode").classList.remove("is-hidden");
            document.getElementById("passwordFormMode").classList.remove("password-form-collapsible--open");
            this._clearPasswordForm();
            this._initPasswordInfoMode();
            this._toast("Password berhasil diperbarui!", "success");
        } catch (err) {
            const msg = err.message === "Failed to fetch"
                ? "Server tidak terhubung. Jalankan: node backend/server.js"
                : (err.message || "Gagal menyimpan password.");
            this._toast(msg, "error");
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i data-feather="lock"></i> Simpan Password';
            feather.replace();
        }
    }

    /* ─────────── GANTI EMAIL ─────────── */
    _cancelChangeEmail() {
        document.getElementById("emailInfoMode").classList.remove("is-hidden");
        document.getElementById("changeEmailForm").classList.remove("password-form-collapsible--open");
        document.getElementById("fieldNewEmail").value = "";
        document.getElementById("fieldEmailPassword").value = "";
        document.querySelectorAll("#changeEmailForm .field-error").forEach((el) => el.remove());
        document.querySelectorAll("#changeEmailForm .input--error").forEach((el) => el.classList.remove("input--error"));
    }

    async _saveEmail() {
        document.querySelectorAll("#changeEmailForm .field-error").forEach((el) => el.remove());
        document.querySelectorAll("#changeEmailForm .input--error").forEach((el) => el.classList.remove("input--error"));

        const newEmailEl = document.getElementById("fieldNewEmail");
        const pwdEl      = document.getElementById("fieldEmailPassword");
        const newEmail   = newEmailEl.value.trim();
        const pwd        = pwdEl.value;

        let hasError = false;
        const showErr = (el, msg) => {
            el.classList.add("input--error");
            const sp = document.createElement("span");
            sp.className = "field-error";
            sp.textContent = msg;
            el.closest(".form-field").appendChild(sp);
            hasError = true;
        };

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!newEmail)                              showErr(newEmailEl, "Email baru wajib diisi");
        else if (!emailRegex.test(newEmail))        showErr(newEmailEl, "Format email tidak valid");
        else if (newEmail === this._user.email)     showErr(newEmailEl, "Email baru harus berbeda dari yang sekarang");

        if (!pwd)                                   showErr(pwdEl, "Password wajib diisi");
        else if (pwd !== this._user.password)       showErr(pwdEl, "Password salah");

        if (hasError) return;

        const btn = document.getElementById("btnSaveEmail");
        btn.disabled = true;
        btn.innerHTML = '<i data-feather="loader"></i> Menyimpan...';
        feather.replace();

        try {
            const res = await fetch("http://localhost:3000/api/auth/change-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: this._user.id, newEmail }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            this._user = data.user;
            document.getElementById("currentEmailDisplay").textContent = newEmail;
            this._cancelChangeEmail();
            this._toast("Email berhasil diperbarui!", "success");
        } catch (err) {
            const msg = err.message === "Failed to fetch"
                ? "Server tidak terhubung. Jalankan: node backend/server.js"
                : (err.message || "Gagal menyimpan email.");
            this._toast(msg, "error");
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i data-feather="check"></i> Simpan Email Baru';
            feather.replace();
        }
    }

    /* ─────────── MODAL HELPERS ─────────── */
    _openModal(id) { document.getElementById(id)?.classList.add("modal-backdrop--visible"); }
    _closeModal(id) { document.getElementById(id)?.classList.remove("modal-backdrop--visible"); }

    /* ─────────── DEACTIVATE ─────────── */
    async _deactivateAccount() {
        const pwd = document.getElementById("deactivatePassword");
        pwd.classList.remove("input--error");

        if (!pwd.value) { pwd.classList.add("input--error"); return; }
        if (pwd.value !== this._user.password) {
            pwd.classList.add("input--error");
            this._toast("Password salah.", "error");
            return;
        }

        try {
            const res = await fetch("http://localhost:3000/api/auth/update-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: this._user.id, status: "suspended" }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            authService.logout();
            this._closeModal("modalDeactivate");
            this._toast("Akun dinonaktifkan. Kamu akan diarahkan ke halaman login.", "warning");
            setTimeout(() => { window.location.href = "/frontend/pages/main/login.html"; }, 2000);
        } catch (err) {
            const msg = err.message === "Failed to fetch"
                ? "Server tidak terhubung. Jalankan: node backend/server.js"
                : (err.message || "Gagal menonaktifkan akun.");
            this._toast(msg, "error");
        }
    }

    /* ─────────── DELETE ACCOUNT ─────────── */
    async _deleteAccount() {
        const confirmText = document.getElementById("deleteConfirmText");
        const pwd         = document.getElementById("deletePassword");
        confirmText.classList.remove("input--error");
        pwd.classList.remove("input--error");

        let ok = true;
        if (confirmText.value.trim() !== "HAPUS") { confirmText.classList.add("input--error"); ok = false; }
        if (!pwd.value || pwd.value !== this._user.password) { pwd.classList.add("input--error"); ok = false; }
        if (!ok) { this._toast("Konfirmasi tidak valid. Cek kembali.", "error"); return; }

        try {
            const res = await fetch("http://localhost:3000/api/auth/delete-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: this._user.id }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            authService.logout();
            this._closeModal("modalDelete");
            this._toast("Akun berhasil dihapus.", "success");
            setTimeout(() => { window.location.href = "/frontend/pages/main/login.html"; }, 1500);
        } catch (err) {
            const msg = err.message === "Failed to fetch"
                ? "Server tidak terhubung. Jalankan: node backend/server.js"
                : (err.message || "Gagal menghapus akun.");
            this._toast(msg, "error");
        }
    }

    /* ─────────── HELPERS ─────────── */
    _toast(message, type = "success") {
        document.querySelector(".toast")?.remove();
        const icons = { success: "check-circle", error: "alert-circle", warning: "alert-triangle" };
        const toast = document.createElement("div");
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `<i data-feather="${icons[type] || "info"}"></i><span>${message}</span>`;
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

export default UserSecurityPage;