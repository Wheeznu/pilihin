import authService from "../../../backend/services/AuthService.js";

// Genre sinkron dengan film-genre.js & data film
const GENRES = [
    { id: "genre-001", name: "Action",    icon: "zap"           },
    { id: "genre-002", name: "Drama",     icon: "film"          },
    { id: "genre-003", name: "Thriller",  icon: "eye"           },
    { id: "genre-004", name: "Romance",   icon: "heart"         },
    { id: "genre-005", name: "Comedy",    icon: "smile"         },
    { id: "genre-006", name: "Animation", icon: "play-circle"   },
    { id: "genre-007", name: "Horror",    icon: "alert-triangle"},
    { id: "genre-008", name: "Sci-Fi",    icon: "cpu"           },
];

// Kualitas per paket langganan
//   basic    → hanya 480p yang boleh (auto & 720p & 1080p & 4K dikunci)
//   standard → auto, 480p, 720p, 1080p (4K dikunci)
//   premium  → semua bebas
const QUALITIES = [
    { value: "auto",  label: "Otomatis",      desc: "Sesuai kecepatan koneksi",    minTier: "basic"    },
    { value: "480p",  label: "480p",           desc: "SD — hemat data",             minTier: "basic"    },
    { value: "720p",  label: "720p",           desc: "HD",                          minTier: "standard" },
    { value: "1080p", label: "1080p",          desc: "Full HD",                     minTier: "standard" },
    { value: "4k",    label: "4K / HDR",       desc: "Kualitas tertinggi",          minTier: "premium"  },
];

// Urutan tier untuk perbandingan akses
const TIER_ORDER = { basic: 0, standard: 1, premium: 2 };

class UserSettingsPage {
    constructor() {
        this._user    = null;
        this._prefs   = {};
        this._tierKey = "basic"; // resolved tier: basic | standard | premium
        this._init();
    }

    async _init() {
        if (!authService.requireAuth()) return;
        this._user = await authService.getCurrentUser();
        if (!this._user) {
            window.location.href = "/frontend/pages/main/login.html";
            return;
        }

        // Resolusi tier aktif
        const tierIdMap = { "tier-001": "basic", "tier-002": "basic", "tier-003": "standard", "tier-004": "premium" };
        this._tierKey = tierIdMap[this._user.subscriptionTier] || "basic";

        const savedTheme = localStorage.getItem("pilih-in-theme") || "dark";
        document.documentElement.setAttribute("data-theme", savedTheme);

        this._prefs = {
            genres:        [],
            theme:         savedTheme,
            notifFilm:     true,
            notifPromo:    true,
            notifSistem:   true,
            streamQuality: "auto",
            ...(this._user.preferences || {}),
            theme: savedTheme, // localStorage selalu menang
        };

        // Paksa kualitas ke yang diizinkan kalau user punya simpanan yang tidak valid
        if (!this._isQualityAllowed(this._prefs.streamQuality)) {
            this._prefs.streamQuality = this._tierKey === "basic" ? "480p" : "auto";
        }

        this._renderSidebar();
        this._renderPage();
        this._bindEvents();
        feather.replace();
    }

    /* ─────────── HELPER TIER ─────────── */
    _isQualityAllowed(value) {
        const q = QUALITIES.find((q) => q.value === value);
        if (!q) return false;
        return TIER_ORDER[this._tierKey] >= TIER_ORDER[q.minTier];
    }

    /* ─────────── SIDEBAR ─────────── */
    _renderSidebar() {
        const sidebar = document.getElementById("userSidebar");
        if (!sidebar) return;
        const u   = this._user;
        const cur = window.location.pathname;

        const navItems = [
            { section: "Akun Saya" },
            { href: "/frontend/pages/user/profile.html",             icon: "user",        label: "Profil" },
            { href: "/frontend/pages/user/security.html",            icon: "shield",      label: "Keamanan" },
            { href: "/frontend/pages/user/settings.html",            icon: "settings",    label: "Pengaturan" },
            { section: "Konten" },
            { href: "/frontend/pages/user/history.html",             icon: "clock",       label: "Riwayat Tonton" },
            { href: "/frontend/pages/user/favorites-film.html",      icon: "heart",       label: "Favorit Film" },
            { href: "/frontend/pages/user/favorites-aktor.html",     icon: "users",       label: "Favorit Aktor" },
            { href: "/frontend/pages/user/favorites-sutradara.html", icon: "camera",      label: "Favorit Sutradara" },
            { href: "/frontend/pages/user/watchlist.html",           icon: "bookmark",    label: "Daftar Tonton" },
            { section: "Langganan" },
            { href: "/frontend/pages/user/subscription.html",        icon: "star",        label: "Langganan" },
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
        const main = document.getElementById("settingsMain");
        if (!main) return;
        const p = this._prefs;

        // --- Genre chips ---
        const genreChipsHTML = GENRES.map((g) => {
            const sel = p.genres.includes(g.id) ? " genre-chip--selected" : "";
            return `<button class="genre-chip${sel}" data-genre="${g.id}" type="button">
                        <i data-feather="${g.icon}"></i>
                        <i data-feather="check" class="genre-chip__check"></i>
                        ${g.name}
                    </button>`;
        }).join("");

        // --- Kualitas video (tile, bukan select) ---
        const tierLabelMap = { basic: "Basic", standard: "Standard", premium: "Premium" };
        const tierLabel    = tierLabelMap[this._tierKey];

        const qualityTilesHTML = QUALITIES.map((q) => {
            const allowed  = this._isQualityAllowed(q.value);
            const active   = p.streamQuality === q.value && allowed;
            const reqTier  = tierLabelMap[q.minTier];

            return `<button
                        class="quality-tile ${active ? "quality-tile--active" : ""} ${!allowed ? "quality-tile--locked" : ""}"
                        data-quality="${q.value}"
                        type="button"
                        ${!allowed ? "disabled" : ""}
                        title="${!allowed ? `Perlu paket ${reqTier} atau lebih tinggi` : q.desc}"
                    >
                        <span class="quality-tile__label">${q.label}</span>
                        <span class="quality-tile__desc">${q.desc}</span>
                        ${!allowed ? `<span class="quality-tile__lock"><i data-feather="lock"></i></span>` : ""}
                    </button>`;
        }).join("");

        // Apakah tier basic? Tampilkan notice upgrade
        const qualityNoticeHTML = this._tierKey !== "premium" ? `
            <div class="settings-note settings-note--upgrade">
                <i data-feather="info"></i>
                <span>Paket <strong>${tierLabel}</strong> kamu mendukung kualitas hingga
                    ${this._tierKey === "basic" ? "480p" : "Full HD 1080p"}.
                    <a href="/frontend/pages/main/pricing.html">Upgrade paket</a> untuk membuka kualitas lebih tinggi.
                </span>
            </div>` : "";

        main.innerHTML = `
            <div class="user-page">

                <div class="page-header">
                    <button class="page-header__burger" id="btnBurger" aria-label="Buka menu"><i data-feather="menu"></i></button>
                    <div class="page-header__text">
                    <h1 class="page-header__title">Pengaturan</h1>
                    <p class="page-header__subtitle">Sesuaikan pengalaman menonton kamu di Pilih.in</p>
                    </div>
                </div>

                <!-- 1. PREFERENSI GENRE -->
                <div class="settings-section">
                    <h3 class="settings-section__title">
                        <i data-feather="film"></i> Preferensi Genre
                    </h3>
                    <p class="settings-section__desc">
                        Pilih genre favorit kamu. Rekomendasi film akan disesuaikan dengan pilihan ini.
                    </p>
                    <div class="genre-grid" id="genreGrid">${genreChipsHTML}</div>
                    <div class="form-actions">
                        <button class="btn btn-ghost" id="btnResetGenre">
                            <i data-feather="rotate-ccw"></i> Reset
                        </button>
                        <button class="btn btn-primary" id="btnSaveGenre">
                            <i data-feather="check"></i> Simpan Preferensi
                        </button>
                    </div>
                </div>

                <!-- 2. STREAMING -->
                <div class="settings-section">
                    <h3 class="settings-section__title">
                        <i data-feather="play-circle"></i> Streaming
                    </h3>
                    <div class="settings-row">
                        <div class="settings-row__info">
                            <p class="settings-row__label">Kualitas Video Default</p>
                            <p class="settings-row__desc">Kualitas saat memutar film. Pilihan tersedia sesuai paket langganan kamu.</p>
                        </div>
                    </div>
                    <div class="quality-tiles" id="qualityTiles">${qualityTilesHTML}</div>
                    ${qualityNoticeHTML}
                </div>

                <!-- 3. NOTIFIKASI -->
                <div class="settings-section">
                    <h3 class="settings-section__title">
                        <i data-feather="bell"></i> Notifikasi
                    </h3>
                    <div class="settings-row">
                        <div class="settings-row__info">
                            <p class="settings-row__label">Film &amp; Konten Baru</p>
                            <p class="settings-row__desc">Notifikasi saat ada film baru sesuai preferensi genre kamu</p>
                        </div>
                        <div class="settings-row__control">
                            <label class="toggle-switch">
                                <input type="checkbox" id="toggleNotifFilm" ${p.notifFilm ? "checked" : ""}>
                                <span class="toggle-switch__track"></span>
                            </label>
                        </div>
                    </div>
                    <div class="settings-row">
                        <div class="settings-row__info">
                            <p class="settings-row__label">Promo &amp; Penawaran</p>
                            <p class="settings-row__desc">Informasi diskon dan penawaran spesial langganan</p>
                        </div>
                        <div class="settings-row__control">
                            <label class="toggle-switch">
                                <input type="checkbox" id="toggleNotifPromo" ${p.notifPromo ? "checked" : ""}>
                                <span class="toggle-switch__track"></span>
                            </label>
                        </div>
                    </div>
                    <div class="settings-row">
                        <div class="settings-row__info">
                            <p class="settings-row__label">Notifikasi Sistem</p>
                            <p class="settings-row__desc">Pembaruan akun, keamanan, dan pemberitahuan penting</p>
                        </div>
                        <div class="settings-row__control">
                            <label class="toggle-switch">
                                <input type="checkbox" id="toggleNotifSistem" ${p.notifSistem ? "checked" : ""}>
                                <span class="toggle-switch__track"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- 4. TEMA (paling bawah) -->
                <div class="settings-section">
                    <h3 class="settings-section__title">
                        <i data-feather="monitor"></i> Tampilan
                    </h3>
                    <div class="settings-row">
                        <div class="settings-row__info">
                            <p class="settings-row__label">Tema Aplikasi</p>
                            <p class="settings-row__desc">Pilih tampilan yang nyaman untuk kamu</p>
                        </div>
                    </div>
                    <div class="theme-options">
                        <div class="theme-option theme-option--dark ${p.theme === "dark" ? "theme-option--active" : ""}" data-theme="dark">
                            <div class="theme-option__preview">
                                <div class="theme-option__preview-bar"></div>
                            </div>
                            <div class="theme-option__info">
                                <p class="theme-option__name">Gelap</p>
                                <p class="theme-option__desc">Nyaman di malam hari</p>
                            </div>
                            <div class="theme-option__check"><i data-feather="check"></i></div>
                        </div>
                        <div class="theme-option theme-option--light ${p.theme === "light" ? "theme-option--active" : ""}" data-theme="light">
                            <div class="theme-option__preview">
                                <div class="theme-option__preview-bar"></div>
                            </div>
                            <div class="theme-option__info">
                                <p class="theme-option__name">Terang</p>
                                <p class="theme-option__desc">Cocok untuk siang hari</p>
                            </div>
                            <div class="theme-option__check"><i data-feather="check"></i></div>
                        </div>
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

        // Genre chips toggle
        document.getElementById("genreGrid")?.addEventListener("click", (e) => {
            const chip = e.target.closest(".genre-chip");
            if (!chip) return;
            chip.classList.toggle("genre-chip--selected");
            feather.replace();
        });
        document.getElementById("btnResetGenre")?.addEventListener("click", () => {
            document.querySelectorAll(".genre-chip").forEach(c => c.classList.remove("genre-chip--selected"));
            feather.replace();
        });
        document.getElementById("btnSaveGenre")?.addEventListener("click", () => this._saveGenres());

        // Quality tiles
        document.getElementById("qualityTiles")?.addEventListener("click", (e) => {
            const tile = e.target.closest(".quality-tile:not([disabled])");
            if (!tile) return;
            // Update UI
            document.querySelectorAll(".quality-tile").forEach(t => t.classList.remove("quality-tile--active"));
            tile.classList.add("quality-tile--active");
            this._prefs.streamQuality = tile.dataset.quality;
            this._savePreferences();
        });

        // Tema
        document.querySelectorAll(".theme-option").forEach((opt) => {
            opt.addEventListener("click", () => this._applyTheme(opt.dataset.theme));
        });

        // Notifikasi — auto-save on change
        ["toggleNotifFilm", "toggleNotifPromo", "toggleNotifSistem"].forEach((id) => {
            document.getElementById(id)?.addEventListener("change", () => this._savePreferences());
        });
    }

    /* ─────────── THEME ─────────── */
    _applyTheme(theme) {
        if (this._prefs.theme === theme) return;
        this._prefs.theme = theme;
        localStorage.setItem("pilih-in-theme", theme);
        document.documentElement.setAttribute("data-theme", theme);

        document.querySelectorAll(".theme-option").forEach((opt) => {
            opt.classList.toggle("theme-option--active", opt.dataset.theme === theme);
        });
        feather.replace();

        this._savePreferences(false);
        this._toast(`Tema ${theme === "dark" ? "Gelap" : "Terang"} diaktifkan`, "success");
    }

    /* ─────────── SAVE GENRES ─────────── */
    async _saveGenres() {
        this._prefs.genres = [...document.querySelectorAll(".genre-chip--selected")]
            .map(c => c.dataset.genre);
        await this._savePreferences();
    }

    /* ─────────── SAVE PREFERENCES ─────────── */
    async _savePreferences(showToast = true) {
        const prefs = {
            genres:        this._prefs.genres,
            theme:         this._prefs.theme,
            notifFilm:     document.getElementById("toggleNotifFilm")?.checked    ?? this._prefs.notifFilm,
            notifPromo:    document.getElementById("toggleNotifPromo")?.checked   ?? this._prefs.notifPromo,
            notifSistem:   document.getElementById("toggleNotifSistem")?.checked  ?? this._prefs.notifSistem,
            streamQuality: this._prefs.streamQuality,
        };
        this._prefs = { ...this._prefs, ...prefs };

        try {
            const res = await fetch("http://localhost:3000/api/auth/update-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: this._user.id, preferences: prefs }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            this._user = data.user;
            if (showToast) this._toast("Pengaturan tersimpan!", "success");
        } catch (err) {
            const msg = err.message === "Failed to fetch"
                ? "Server tidak terhubung. Jalankan: node backend/server.js"
                : err.message;
            if (showToast) this._toast(msg, "error");
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
        }, 3000);
    }

    _fallback(name) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1db954&color=fff`;
    }
}

export default UserSettingsPage;