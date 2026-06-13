import authService from "../../../backend/services/AuthService.js";
import { loadNotifBadge } from "../utils/notif-badge.js";

class SubscriptionPage {
    constructor() {
        this._user  = null;
        this._tiers = [];
        this._init();
    }

    async _init() {
        if (!authService.requireAuth()) return;
        this._user = await authService.getCurrentUser();
        if (!this._user) {
            window.location.href = "/frontend/pages/main/login.html";
            return;
        }

        try {
            const res  = await fetch("/data/pricing-tiers.json");
            const data = await res.json();
            this._tiers = data.tiers || [];
        } catch (err) {
            console.warn("SubscriptionPage: gagal load pricing-tiers.json", err);
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
        const u   = this._user;
        const cur = window.location.pathname;

        const navItems = [
            { section: "Akun Saya" },
            { href: "/frontend/pages/user/profile.html",                  icon: "user",        label: "Profil" },
            { href: "/frontend/pages/user/security.html",                 icon: "shield",      label: "Keamanan" },
            { href: "/frontend/pages/user/settings.html",                 icon: "settings",    label: "Pengaturan" },
            { section: "Konten" },
            { href: "/frontend/pages/user/history.html",                  icon: "clock",       label: "Riwayat Tonton" },
            { href: "/frontend/pages/user/favorites.html",           icon: "heart",       label: "Favorit" },
            { href: "/frontend/pages/user/watchlist.html",                icon: "bookmark",    label: "Daftar Tonton" },
            { section: "Langganan" },
            { href: "/frontend/pages/user/subscription.html",             icon: "star",        label: "Status Langganan" },
            { href: "/frontend/pages/user/payment.html",             icon: "gift",         label: "Pembayaran & Poin" },
            { href: "/frontend/pages/user/transactions.html",             icon: "credit-card", label: "Transaksi" },
            { href: "/frontend/pages/user/notifications.html",            icon: "bell",        label: "Notifikasi" },
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
        const main = document.getElementById("subscriptionMain");
        if (!main) return;

        const u = this._user;

        // Resolusi tier aktif
        const tierIdMap = {
            "tier-001": "basic",
            "tier-002": "basic",
            "tier-003": "standard",
            "tier-004": "premium",
        };
        const activeTierId = tierIdMap[u.subscriptionTier] || u.subscriptionTier || "basic";
        const activeTier   = this._tiers.find((t) => t.id === activeTierId) || this._tiers[0];
        const isFree       = !activeTier || activeTier.price === 0;

        main.innerHTML = `
            <div class="user-page">

                <!-- Page Header -->
                <div class="page-header">
                    <button class="page-header__burger" id="btnBurger" aria-label="Buka menu"><i data-feather="menu"></i></button>
                    <div class="page-header__text">
                    <h1 class="page-header__title">Status Langganan</h1>
                    <p class="page-header__subtitle">Detail paket aktif dan benefit yang kamu nikmati</p>
                    </div>
                </div>

                <!-- Kartu Paket Aktif -->
                ${this._activeCardHTML(u, activeTier, isFree)}

                <!-- Benefit Rinci -->
                ${activeTier ? this._benefitsHTML(activeTier) : ""}

                <!-- CTA Upgrade / Promo -->
                ${this._ctaHTML(isFree, activeTierId)}

            </div>
        `;

        this._bindEvents();
    }

    /* ─────────── HTML BUILDERS ─────────── */

    _activeCardHTML(u, tier, isFree) {
        if (!tier) return "";

        const tierKey  = tier.id; // basic | standard | premium
        const iconMap  = { basic: "circle", standard: "zap", premium: "award" };
        const colorMap = { basic: "muted", standard: "info", premium: "warning" };
        const icon     = iconMap[tierKey]  || "circle";
        const color    = colorMap[tierKey] || "muted";

        // Harga
        const priceLabel = isFree
            ? "Gratis"
            : `Rp ${this._formatPrice(tier.price)} / ${tier.period}`;

        // Masa berlaku
        let expiryHTML = "";
        if (u.subscriptionExpiry) {
            const expiryDate = new Date(u.subscriptionExpiry);
            const daysLeft   = Math.ceil((expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
            const dateStr    = expiryDate.toLocaleDateString("id-ID", {
                day: "numeric", month: "long", year: "numeric",
            });

            if (daysLeft <= 0) {
                expiryHTML = `
                    <div class="sub-expiry-row sub-expiry-row--expired">
                        <i data-feather="alert-octagon"></i>
                        <span>Langganan kamu telah berakhir pada ${dateStr}</span>
                    </div>`;
            } else if (daysLeft <= 7) {
                expiryHTML = `
                    <div class="sub-expiry-row sub-expiry-row--warning">
                        <i data-feather="alert-triangle"></i>
                        <span>Berakhir ${dateStr} — <strong>${daysLeft} hari lagi</strong></span>
                        <a href="/frontend/pages/main/pricing.html" class="btn btn-primary btn-sm">
                            <i data-feather="refresh-cw"></i> Perpanjang
                        </a>
                    </div>`;
            } else {
                expiryHTML = `
                    <div class="sub-expiry-row">
                        <i data-feather="calendar"></i>
                        <span>Aktif hingga <strong>${dateStr}</strong></span>
                    </div>`;
            }
        }

        return `
            <div class="sub-active-card sub-active-card--${tierKey}">
                <div class="sub-active-card__top">
                    <div class="sub-active-icon sub-active-icon--${color}">
                        <i data-feather="${icon}"></i>
                    </div>
                    <div class="sub-active-info">
                        <div class="sub-active-info__label">Paket Aktif</div>
                        <h2 class="sub-active-info__name">${tier.name}</h2>
                        <p class="sub-active-info__desc">${tier.description}</p>
                    </div>
                    <div class="sub-active-price">
                        <span class="sub-active-price__value ${isFree ? "sub-active-price__value--free" : ""}">${priceLabel}</span>
                        <span class="sub-status-pill">
                            <i data-feather="check-circle"></i> Aktif
                        </span>
                    </div>
                </div>
                ${expiryHTML}
            </div>
        `;
    }

    _benefitsHTML(tier) {
        const tierKey  = tier.id;
        const iconMap  = { basic: "circle", standard: "zap", premium: "award" };
        const titleMap = {
            basic:    "Yang kamu dapatkan dengan paket Basic",
            standard: "Yang kamu dapatkan dengan paket Standard",
            premium:  "Yang kamu dapatkan dengan paket Premium",
        };

        // Detail benefit per tier (lebih deskriptif dari sekadar list)
        const detailMap = {
            basic: [
                { icon: "monitor",      title: "Kualitas SD 480p",        desc: "Streaming dengan kualitas standar, cukup untuk layar HP dan laptop." },
                { icon: "smartphone",   title: "1 Perangkat",              desc: "Kamu bisa streaming di satu perangkat dalam satu waktu." },
                { icon: "film",         title: "Konten Standar",           desc: "Akses ribuan judul film dan serial pilih.in." },
                { icon: "radio",        title: "Dengan Iklan",             desc: "Terdapat tayangan iklan di sela konten. Upgrade untuk bebas iklan." },
            ],
            standard: [
                { icon: "tv",           title: "HD 720p & Full HD 1080p",  desc: "Nikmati gambar jernih di layar besar maupun kecil." },
                { icon: "copy",         title: "2 Perangkat Bersamaan",    desc: "Tonton di dua perangkat sekaligus — bagikan dengan keluarga." },
                { icon: "grid",         title: "Semua Konten",             desc: "Akses seluruh katalog film dan serial tanpa terkecuali." },
                { icon: "calender",     title: "Update Tiap Minggu",       desc: "Menonton Konten Terupdate Tiap Minggunya" },
                { icon: "slash",        title: "Bebas Iklan",              desc: "Pengalaman menonton tanpa gangguan iklan." },
            ],
            premium: [
                { icon: "tv",           title: "HD, 4K & HDR",             desc: "Kualitas visual terbaik yang tersedia di pilih.in." },
                { icon: "copy",         title: "4 Perangkat Bersamaan",    desc: "Cocok untuk seluruh anggota keluarga sekaligus." },
                { icon: "star",         title: "Konten Premium & Eksklusif", desc: "Akses penuh ke konten eksklusif yang hanya ada di paket Premium." },
                { icon: "volume-2",     title: "Suara Surround 5.1",       desc: "Audio imersif untuk pengalaman bioskop di rumah." },
                { icon: "slash",        title: "Bebas Iklan",              desc: "Tidak ada iklan sama sekali." },
                { icon: "headphones",   title: "Dukungan Pelanggan 24/7",  desc: "Tim kami siap membantu kapan pun kamu butuhkan." },
            ],
        };

        const details = detailMap[tierKey] || tier.features.map((f) => ({
            icon: "check", title: f, desc: "",
        }));

        return `
            <div class="form-section">
                <h3 class="form-section__title">
                    <i data-feather="${iconMap[tierKey] || "list"}"></i>
                    ${titleMap[tierKey] || "Benefit Paket"}
                </h3>
                <div class="sub-benefits-grid">
                    ${details.map((b) => `
                        <div class="sub-benefit-item">
                            <div class="sub-benefit-item__icon">
                                <i data-feather="${b.icon}"></i>
                            </div>
                            <div class="sub-benefit-item__body">
                                <div class="sub-benefit-item__title">${b.title}</div>
                                ${b.desc ? `<div class="sub-benefit-item__desc">${b.desc}</div>` : ""}
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;
    }

    _ctaHTML(isFree, activeTierId) {
        if (activeTierId === "premium") {
            // Sudah premium — tampil appreciation card
            return `
                <div class="sub-cta-card sub-cta-card--premium">
                    <div class="sub-cta-card__icon">
                        <i data-feather="award"></i>
                    </div>
                    <div class="sub-cta-card__body">
                        <h3 class="sub-cta-card__title">Kamu sudah di level tertinggi!</h3>
                        <p class="sub-cta-card__desc">
                            Nikmati semua fitur Premium pilih.in — 4K, konten eksklusif, download unlimited,
                            dan dukungan 24/7.
                        </p>
                    </div>
                    <a href="/frontend/pages/main/promo.html" class="btn btn-ghost">
                        <i data-feather="tag"></i> Lihat Promo
                    </a>
                </div>
            `;
        }

        const upgradeLabel = isFree
            ? "Upgrade Sekarang & Nikmati Lebih Banyak"
            : "Upgrade ke Paket Lebih Tinggi";

        const upgradeDesc = isFree
            ? "Mulai dari Rp 49.000/bulan — bebas iklan, HD, dan download offline."
            : "Dapatkan akses ke 4K, konten eksklusif, dan 4 perangkat bersamaan dengan paket Premium.";

        return `
            <div class="sub-cta-card">
                <div class="sub-cta-card__icon">
                    <i data-feather="trending-up"></i>
                </div>
                <div class="sub-cta-card__body">
                    <h3 class="sub-cta-card__title">${upgradeLabel}</h3>
                    <p class="sub-cta-card__desc">${upgradeDesc}</p>
                </div>
                <div class="sub-cta-card__actions">
                    <a href="/frontend/pages/main/pricing.html" class="btn btn-primary">
                        <i data-feather="arrow-right"></i> Lihat Semua Paket
                    </a>
                    <a href="/frontend/pages/main/promo.html" class="btn btn-ghost">
                        <i data-feather="tag"></i> Promo
                    </a>
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

        // kosong — tidak ada interaksi inline di halaman ini,
        // semua aksi diarahkan ke halaman pricing / promo
    }

    /* ─────────── HELPERS ─────────── */
    _formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    _fallback(name) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1db954&color=fff`;
    }
}

export default SubscriptionPage;