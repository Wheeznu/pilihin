import authService from "../../../backend/services/AuthService.js";
import { loadNotifBadge } from "../utils/notif-badge.js";
import Navbar from "../components/navbar.js";

const API = "http://localhost:3000";

/* ─── Metode Pembayaran ─── */
const EWALLET_INSTRUCTIONS = {
  gopay: {
    steps: [
      { icon: "smartphone",  text: "Buka aplikasi <strong>Gojek</strong> di ponselmu" },
      { icon: "home",        text: "Pilih menu <strong>GoPay</strong> di halaman utama" },
      { icon: "check-square",text: "Konfirmasi pembayaran dan <strong>masukkan PIN GoPay</strong> kamu (6 digit)" },
      { icon: "check-circle",text: "Pembayaran selesai - klik <strong>Bayar Sekarang</strong> di bawah" },
    ],
    color: "#00ADE0",
    note: "Pastikan saldo GoPay kamu mencukupi sebelum melanjutkan.",
  },
  ovo: {
    steps: [
      { icon: "smartphone",  text: "Buka aplikasi <strong>OVO</strong> di ponselmu" },
      { icon: "bell",        text: "Kamu akan menerima notifikasi permintaan pembayaran dari OVO" },
      { icon: "check-square",text: "Ketuk notifikasi dan <strong>masukkan PIN OVO</strong> kamu (6 digit)" },
      { icon: "check-circle",text: "Pembayaran selesai - klik <strong>Bayar Sekarang</strong> di bawah" },
    ],
    color: "#4C2A86",
    note: "Pastikan kamu terhubung internet dan notifikasi OVO aktif.",
  },
  dana: {
    steps: [
      { icon: "smartphone",  text: "Buka aplikasi <strong>DANA</strong> di ponselmu" },
      { icon: "link",        text: "Pilih menu <strong>Bayar</strong> lalu scan QR atau gunakan link pembayaran" },
      { icon: "check-square",text: "Konfirmasi transaksi dan <strong>masukkan PIN DANA</strong> kamu (6 digit)" },
      { icon: "check-circle",text: "Pembayaran selesai - klik <strong>Bayar Sekarang</strong> di bawah" },
    ],
    color: "#108EE9",
    note: "Pastikan saldo DANA kamu mencukupi sebelum melanjutkan.",
  },
  linkaja: {
    steps: [
      { icon: "smartphone",  text: "Buka aplikasi <strong>LinkAja</strong> di ponselmu" },
      { icon: "bell",        text: "Cek notifikasi atau menu <strong>Riwayat</strong> untuk permintaan pembayaran" },
      { icon: "check-square",text: "Konfirmasi dan <strong>masukkan PIN LinkAja</strong> kamu (6 digit)" },
      { icon: "check-circle",text: "Pembayaran selesai - klik <strong>Bayar Sekarang</strong> di bawah" },
    ],
    color: "#E82529",
    note: "Pastikan aplikasi LinkAja sudah diperbarui ke versi terbaru.",
  },
};

const METHODS = {
  ewallet: [
    { id: "gopay",   name: "GoPay",   icon: "smartphone" },
    { id: "ovo",     name: "OVO",     icon: "smartphone" },
    { id: "dana",    name: "DANA",    icon: "smartphone" },
    { id: "linkaja", name: "LinkAja", icon: "smartphone" },
  ],
  transfer: [
    { id: "bca-transfer",     name: "BCA",     icon: "briefcase", norek: "1234567890", an: "PT Pilih.in Indonesia" },
    { id: "mandiri-transfer", name: "Mandiri", icon: "briefcase", norek: "0987654321", an: "PT Pilih.in Indonesia" },
    { id: "bni-transfer",     name: "BNI",     icon: "briefcase", norek: "1122334455", an: "PT Pilih.in Indonesia" },
    { id: "bri-transfer",     name: "BRI",     icon: "briefcase", norek: "5544332211", an: "PT Pilih.in Indonesia" },
  ],
  kartu: [
    { id: "credit-card", name: "Kartu Kredit / Debit", icon: "credit-card" },
  ],
};

/* ─── Reward poin (hanya diskon langganan) ─── */
const REWARDS = [
  { id: "rwd-d5",  name: "Diskon Rp 5.000",  desc: "Diterapkan langsung saat pembayaran", cost: 500,  discountAmount: 5000  },
  { id: "rwd-d10", name: "Diskon Rp 10.000", desc: "Diterapkan langsung saat pembayaran", cost: 1000, discountAmount: 10000 },
  { id: "rwd-d25", name: "Diskon Rp 25.000", desc: "Diterapkan langsung saat pembayaran", cost: 2500, discountAmount: 25000 },
  { id: "rwd-d50", name: "Diskon Rp 50.000", desc: "Diterapkan langsung saat pembayaran", cost: 5000, discountAmount: 50000 },
];

const EARN_WAYS = [
  { icon: "edit-3",    color: "green",  pts: "+10 poin",  title: "Tulis Ulasan",       desc: "Setiap ulasan atau rating yang kamu tulis pada film" },
  { icon: "user-plus", color: "blue",   pts: "+20 poin",  title: "Ajak Teman",         desc: "Per teman yang berhasil mendaftar lewat link referral kamu" },
  { icon: "zap",       color: "info",   pts: "+50 poin",  title: "Langganan Standard", desc: "Bonus poin setiap berlangganan atau perpanjang paket Standard" },
  { icon: "award",     color: "yellow", pts: "+100 poin", title: "Langganan Premium",  desc: "Bonus poin lebih besar setiap berlangganan atau perpanjang paket Premium" },
];

const LEVEL_CONFIG = {
  bronze:   { label: "Bronze",   min: 0,    max: 500,  next: "Silver"   },
  silver:   { label: "Silver",   min: 500,  max: 2000, next: "Gold"     },
  gold:     { label: "Gold",     min: 2000, max: 5000, next: "Platinum" },
  platinum: { label: "Platinum", min: 5000, max: 5000, next: null       },
};

/* ══════════════════════════════════════════════════
   CLASS
══════════════════════════════════════════════════ */
class PaymentPage {
  constructor() {
    this._user           = null;
    this._tiers          = [];
    this._promos         = [];

    // Sumber pembayaran: "tier" | "promo"
    this._sourceType     = "tier";
    this._tier           = null;   // diisi jika sourceType = "tier"
    this._promo          = null;   // diisi jika sourceType = "promo"

    this._pts            = null;
    this._allFilms       = [];
    this._selectedMethod = null;

    // Diskon kode promo (% dari harga)
    this._promoCodeDiscount = 0;
    this._promoCode         = null;

    // Voucher dari tukar poin - poin belum dikurangi, baru dikurangi saat bayar
    this._voucherDiscount   = 0;   // Rp
    this._voucherPointsCost = 0;   // jumlah poin yang akan dipotong saat bayar
    this._voucherName       = "";
    this._paymentSuccess   = false; // flag agar re-render tidak menimpa success page

    this._pendingReward  = null;
    this._activeTab      = "payment";
    this._billingPeriod  = "bulanan"; // "bulanan" | "tahunan"
    this._init();
  }

  async _init() {
    if (!authService.requireAuth()) return;
    this._user = await authService.getCurrentUser();
    if (!this._user) { window.location.href = "/frontend/pages/main/login.html"; return; }

    // Load tiers, promotions & film catalog
    try {
      const [tr, pr, fm] = await Promise.all([
        fetch("/data/pricing-tiers.json").then(r => r.json()),
        fetch("/data/promotions.json").then(r => r.json()),
        fetch("/data/data-film.json").then(r => r.json()),
      ]);
      this._tiers    = tr.tiers  || [];
      this._promos   = pr.promotions || [];
      this._allFilms = (fm.films || []).filter(f => f.status === "published");
    } catch { /**/ }

    // Query params: ?tier=standard  ATAU  ?promo=promo-001
    const p      = new URLSearchParams(window.location.search);
    const promoId = p.get("promo");
    const tierId  = p.get("tier");
    this._activeTab = p.get("tab") === "poin" ? "poin" : "payment";
    this._billingPeriod = p.get("period") === "tahunan" ? "tahunan" : "bulanan";

    if (promoId) {
      this._sourceType = "promo";
      this._promo      = this._promos.find(pr => pr.id === promoId) || null;
      if (!this._promo) {
        // Promo tidak ditemukan, fallback ke pilih paket
        this._sourceType = "none";
      }
    } else {
      this._sourceType = "tier";
      this._tier = this._tiers.find(t => t.id === (tierId || "standard"))
                   || this._tiers.find(t => t.id === "standard")
                   || this._tiers[1]
                   || this._tiers[0];
    }

    await this._loadPoints();
    loadNotifBadge(this._user);
    this._renderPage();
    feather.replace();
  }

  async _loadPoints() {
    try {
      const r = await fetch(`${API}/api/points?userId=${this._user.id}`);
      const d = await r.json();
      if (d.success) this._pts = d.points;
    } catch { /**/ }
    if (!this._pts) this._pts = { totalPoints: 0, lifetimePoints: 0, level: "bronze", history: [] };
  }

  /* ── Harga yang akan dibayar ── */
  _isYearly() {
    return this._sourceType === "tier" && this._billingPeriod === "tahunan"
      && this._tier?.priceYearly != null && this._tier?.price > 0;
  }

  _tierPrice(tier, period = this._billingPeriod) {
    if (!tier) return 0;
    if (period === "tahunan" && tier.priceYearly != null) return tier.priceYearly;
    return tier.price ?? 0;
  }

  _basePrice() {
    if (this._sourceType === "promo" && this._promo) return this._promo.promoPrice ?? 0;
    if (this._sourceType === "tier"  && this._tier)  return this._tierPrice(this._tier);
    return 0;
  }

  _originalPrice() {
    if (this._sourceType === "promo" && this._promo) return this._promo.originalPrice ?? this._promo.promoPrice ?? 0;
    if (this._sourceType === "tier"  && this._tier)  return this._tierPrice(this._tier);
    return 0;
  }

  _grandTotal() {
    return Math.max(0, this._basePrice() - this._promoCodeDiscount - this._voucherDiscount);
  }

  /* ── Nama paket untuk ditampilkan ── */
  _itemName() {
    if (this._sourceType === "promo") return this._promo?.title || "Paket Promo";
    return `Paket ${this._tier?.name || ""}`;
  }

  /* ── Tier id untuk dikirim ke server ── */
  _tierId() {
    if (this._sourceType === "promo") {
      // Promo selalu berbasis premium (atau bisa dipetakan dari subtitle)
      const sub = this._promo?.subtitle?.toLowerCase() || "";
      if (sub.includes("standard")) return "standard";
      return "premium"; // default promo = premium
    }
    return this._tier?.id || "standard";
  }

  /* ─────────────────────────────────────────────────
     SIDEBAR
  ───────────────────────────────────────────────── */
  _NAV() {
    return [
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
      { href: "/frontend/pages/user/payment.html",             icon: "gift",        label: "Pembayaran & Poin" },
      { href: "/frontend/pages/user/transactions.html",        icon: "credit-card", label: "Transaksi" },
      { href: "/frontend/pages/user/notifications.html",       icon: "bell",        label: "Notifikasi" },
    ];
  }

  /* ─────────────────────────────────────────────────
     RENDER PAGE
  ───────────────────────────────────────────────── */
  _renderPage() {
    const main = document.getElementById("paymentMain");
    if (!main) return;
    const pts = this._pts?.totalPoints ?? 0;

    main.innerHTML = `
      <div class="user-page">
          <div class="page-header">
          <div class="page-header__text">
            <h1 class="page-header__title">Pembayaran &amp; Poin</h1>
            <p class="page-header__subtitle">Kelola pembayaran langganan dan tukarkan poin kamu</p>
          </div>
        </div>

        <div class="pay-tabs">
          <button class="pay-tab ${this._activeTab === "payment" ? "pay-tab--active" : ""}" data-tab="payment">
            <i data-feather="shopping-cart"></i> Pembayaran
          </button>
          <button class="pay-tab ${this._activeTab === "poin" ? "pay-tab--active" : ""}" data-tab="poin">
            <i data-feather="zap"></i> Poin Saya
            <span class="pay-tab__badge" id="tabPtsBadge">${pts}</span>
          </button>
        </div>

        <div id="tabPayment" class="${this._activeTab === "payment" ? "" : "is-hidden"}">${this._paymentHTML()}</div>
        <div id="tabPoin"    class="${this._activeTab === "poin"    ? "" : "is-hidden"}">${this._poinHTML()}</div>
      </div>

      <!-- Modal konfirmasi tukar poin -->
      <div class="modal" id="redeemModal">
        <div class="modal-overlay" id="modalOverlay"></div>
        <div class="modal-content">
          <button class="modal-close" id="modalClose"><i data-feather="x"></i></button>
          <h2 class="modal-title" id="modalTitle">Tukar Poin</h2>
          <div class="modal-body" id="modalBody"></div>
          <div class="modal-footer">
            <button class="btn btn-ghost"   id="modalCancel">Batal</button>
            <button class="btn btn-primary" id="modalConfirm"><i data-feather="check"></i> Terapkan Voucher</button>
          </div>
        </div>
      </div>`;

    this._bindEvents();
    this._bindBurger();
  }

  /* ─────────────────────────────────────────────────
     TAB PEMBAYARAN
  ───────────────────────────────────────────────── */
  _paymentHTML() {
    // Tidak ada sumber yang valid
    if (this._sourceType === "none" || (!this._tier && !this._promo)) {
      return `
        <div class="sub-cta-card" style="margin-top:var(--space-lg)">
          <div class="sub-cta-card__icon"><i data-feather="info"></i></div>
          <div class="sub-cta-card__body">
            <h3 class="sub-cta-card__title">Pilih paket atau promo untuk melanjutkan pembayaran</h3>
            <p class="sub-cta-card__desc">Kamu bisa memilih dari halaman Paket atau Promo.</p>
          </div>
          <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap">
            <a href="/frontend/pages/main/pricing.html" class="btn btn-primary"><i data-feather="layers"></i> Lihat Paket</a>
            <a href="/frontend/pages/main/promo.html"   class="btn btn-ghost"><i data-feather="tag"></i> Lihat Promo</a>
          </div>
        </div>`;
    }

    // Paket Basic / promo gratis → tidak perlu bayar
    const base = this._basePrice();
    if (base === 0 && this._sourceType === "tier" && this._tier?.price === 0) {
      return `
        <div class="sub-cta-card" style="margin-top:var(--space-lg)">
          <div class="sub-cta-card__icon"><i data-feather="info"></i></div>
          <div class="sub-cta-card__body">
            <h3 class="sub-cta-card__title">Paket Basic gratis - tidak perlu pembayaran</h3>
            <p class="sub-cta-card__desc">Upgrade ke Standard atau Premium untuk menikmati lebih banyak fitur.</p>
          </div>
          <a href="/frontend/pages/main/pricing.html" class="btn btn-primary"><i data-feather="layers"></i> Lihat Paket</a>
        </div>`;
    }

    const isPromo      = this._sourceType === "promo";
    const origPrice    = this._originalPrice();
    const promoSaving  = isPromo ? origPrice - base : 0;
    const total        = this._grandTotal();
    const pts          = this._pts?.totalPoints ?? 0;

    // Header card bergantung sumber
    const summaryHeader = isPromo
      ? `<div class="pay-promo-badge">
           <i data-feather="${this._promo.icon || "tag"}"></i>
           <span class="pay-promo-badge__label">${this._promo.badge || "Promo"}</span>
         </div>
         <div>
           <p class="pay-summary-card__tier">${this._promo.title}</p>
           <p class="pay-summary-card__desc">${this._promo.subtitle}</p>
         </div>
         <a href="/frontend/pages/main/promo.html" class="btn btn-ghost btn-sm" style="margin-left:auto">
           <i data-feather="refresh-cw"></i> Ganti
         </a>`
      : `<div class="pay-summary-card__icon"><i data-feather="package"></i></div>
         <div>
           <p class="pay-summary-card__tier">Paket ${this._tier.name}</p>
           <p class="pay-summary-card__desc">${this._tier.description}</p>
         </div>
         <a href="/frontend/pages/main/pricing.html" class="btn btn-ghost btn-sm" style="margin-left:auto">
           <i data-feather="refresh-cw"></i> Ganti
         </a>`;

    return `
      <!-- Ringkasan -->
      <div class="pay-summary-card">
        <div class="pay-summary-card__header">${summaryHeader}</div>
        <div class="pay-summary-card__body">

          ${!isPromo && this._tier?.priceYearly != null && this._tier?.price > 0 ? `
          <div class="pay-period-toggle" id="periodToggle">
            <button class="pay-period-btn ${this._billingPeriod === "bulanan" ? "pay-period-btn--active" : ""}" data-period="bulanan">
              Bulanan
            </button>
            <button class="pay-period-btn ${this._billingPeriod === "tahunan" ? "pay-period-btn--active" : ""}" data-period="tahunan">
              Tahunan
              ${this._tier.price > 0 ? `<span class="pay-period-btn__save">Hemat ${this._yearlySavingPercent(this._tier)}%</span>` : ""}
            </button>
          </div>` : ""}

          ${isPromo && promoSaving > 0 ? `
          <div class="pay-line pay-line--striked">
            <span class="pay-line__label">Harga normal</span>
            <span class="pay-line__value pay-line__value--strike">Rp ${this._fmt(origPrice)}</span>
          </div>
          <div class="pay-line pay-line--discount">
            <span class="pay-line__label">Harga promo</span>
            <span class="pay-line__value">Rp ${this._fmt(base)}</span>
          </div>
          <div class="pay-line pay-line--saving">
            <span class="pay-line__label">Kamu hemat</span>
            <span class="pay-line__value pay-line__value--saving">- Rp ${this._fmt(promoSaving)}</span>
          </div>` : `
          <div class="pay-line">
            <span class="pay-line__label">Harga paket${!isPromo ? ` (${this._billingPeriod === "tahunan" ? "tahunan" : "bulanan"})` : ""}</span>
            <span class="pay-line__value">Rp ${this._fmt(base)}</span>
          </div>`}

          <div class="pay-line pay-line--discount" id="promoCodeLine" style="display:none">
            <span class="pay-line__label" id="promoCodeLabel">Diskon kode promo</span>
            <span class="pay-line__value" id="promoCodeValue"></span>
          </div>

          <div class="pay-line pay-line--discount" id="voucherLine" style="${this._voucherDiscount > 0 ? "display:flex" : "display:none"}">
            <span class="pay-line__label">Voucher poin</span>
            <span class="pay-line__value" id="voucherValue">${this._voucherDiscount > 0 ? `- Rp ${this._fmt(this._voucherDiscount)} (${this._voucherPointsCost} poin)` : ""}</span>
          </div>

          <div class="pay-line pay-line--total">
            <span class="pay-line__label">Total Bayar</span>
            <span class="pay-line__value" id="grandTotal">Rp ${this._fmt(total)}</span>
          </div>

          <!-- Kode promo (hanya untuk sumber tier, bukan promo yang sudah punya harga sendiri) -->
          ${!isPromo ? `
          <div class="pay-promo-row">
            <input type="text" class="pay-promo-input" id="promoInput" placeholder="Kode diskon (opsional)" maxlength="20">
            <button class="btn btn-ghost btn-sm" id="btnPromo"><i data-feather="tag"></i> Terapkan</button>
          </div>
          <p class="pay-promo-msg" id="promoMsg"></p>` : ""}

          <!-- Voucher poin aktif -->
          ${this._voucherDiscount > 0 ? `
          <div class="pay-bonus-notice">
            <i data-feather="check-circle"></i>
            <span>Voucher <strong>${this._voucherName}</strong> aktif - diskon Rp ${this._fmt(this._voucherDiscount)} akan dipotong saat bayar</span>
            <button class="btn-inline" id="btnRemoveVoucher" style="margin-left:auto;color:var(--danger)">Hapus</button>
          </div>` : pts > 0 ? `
          <div class="pay-bonus-notice" style="cursor:pointer" id="btnGoToPoin">
            <i data-feather="zap"></i>
            <span>Punya <strong>${pts} poin</strong> - tukar jadi diskon di tab <strong>Poin Saya</strong></span>
            <i data-feather="arrow-right" style="margin-left:auto"></i>
          </div>` : ""}
        </div>
      </div>

      <!-- Keranjang Film -->
      ${this._cartHTML()}

      <!-- Metode pembayaran -->
      <div class="settings-section">
        <h3 class="pay-section-title"><i data-feather="credit-card"></i> Metode Pembayaran</h3>
        <div class="pay-method-group">
          <p class="pay-method-group__label">Dompet Digital</p>
          <div class="pay-method-grid">${METHODS.ewallet.map(m => this._methodTile(m)).join("")}</div>
        </div>
        <div class="pay-method-group">
          <p class="pay-method-group__label">Transfer Bank</p>
          <div class="pay-method-grid">${METHODS.transfer.map(m => this._methodTile(m)).join("")}</div>
          <div class="pay-bank-detail" id="bankDetail"></div>
        </div>
        <div class="pay-method-group">
          <p class="pay-method-group__label">Kartu</p>
          <div class="pay-method-grid">${METHODS.kartu.map(m => this._methodTile(m)).join("")}</div>
        </div>
      </div>

      <!-- Konfirmasi -->
      <div class="pay-confirm-card">
        <div class="pay-confirm-card__info">
          <p class="pay-confirm-card__total-label">Total Pembayaran</p>
          <p class="pay-confirm-card__total" id="confirmTotal">Rp ${this._fmt(total)}</p>
          <p class="pay-confirm-card__note">Dengan melanjutkan, kamu menyetujui syarat &amp; ketentuan Pilih.in.</p>
        </div>
        <div class="pay-confirm-card__actions">
          <button class="btn btn-primary" id="btnPay" disabled>
            <i data-feather="lock"></i> Bayar Sekarang
          </button>
        </div>
      </div>`;
  }

  /* ─────────────────────────────────────────────────
     KERANJANG FILM
  ───────────────────────────────────────────────── */
  _cartHTML() {
    const tierName = this._sourceType === "promo"
      ? (this._promo?.subtitle?.toLowerCase().includes("standard") ? "standard" : "premium")
      : (this._tier?.id || "basic");

    const allowed = {
      basic:    ["free"],
      standard: ["free", "paid"],
      premium:  ["free", "paid", "exclusive"],
    }[tierName] || ["free"];

    const films = this._allFilms.filter(f => allowed.includes(f.accessType || "paid"));

    if (films.length === 0) {
      return `
        <div class="settings-section">
          <h3 class="pay-section-title"><i data-feather="shopping-cart"></i> Konten yang Tersedia di Paket Ini</h3>
          <p style="color:var(--text-muted);font-size:var(--font-sm)">Gagal memuat katalog film.</p>
        </div>`;
    }

    const pick = (type, max) => films.filter(f => f.accessType === type).slice(0, max);
    const shown = [
      ...pick("free", 4),
      ...pick("paid", 4),
      ...pick("exclusive", 6),
    ].slice(0, 12);

    const freeCount = films.filter(f => f.accessType === "free").length;
    const paidCount = films.filter(f => f.accessType === "paid").length;
    const exclCount = films.filter(f => f.accessType === "exclusive").length;

    const badgeMap = {
      free:      { label: "Gratis",    cls: "cart-badge--free",      icon: "check-circle" },
      paid:      { label: "Berbayar",  cls: "cart-badge--paid",      icon: "lock" },
      exclusive: { label: "Eksklusif", cls: "cart-badge--exclusive", icon: "star" },
    };

    const filmCards = shown.map(f => {
      const b    = badgeMap[f.accessType] || badgeMap.paid;
      const year = f.releaseDate ? new Date(f.releaseDate).getFullYear() : "";
      return `
        <div class="cart-film-card">
          <div class="cart-film-card__poster-wrap">
            <img class="cart-film-card__poster" src="${f.poster}" alt="${f.title}"
              onerror="this.style.background='var(--surface-secondary)'">
            <span class="cart-badge ${b.cls} cart-film-card__badge">
              <i data-feather="${b.icon}"></i> ${b.label}
            </span>
          </div>
          <div class="cart-film-card__info">
            <div class="cart-film-card__title">${f.title}</div>
            <div class="cart-film-card__year">${year}</div>
          </div>
        </div>`;
    }).join("");

    const statsHTML = `
      <div class="cart-stats">
        ${freeCount > 0 ? `<span class="cart-stat cart-stat--free"><i data-feather="check-circle"></i> ${freeCount} Film Gratis</span>` : ""}
        ${paidCount > 0 ? `<span class="cart-stat cart-stat--paid"><i data-feather="lock"></i> ${paidCount} Film Berbayar</span>` : ""}
        ${exclCount > 0 ? `<span class="cart-stat cart-stat--excl"><i data-feather="star"></i> ${exclCount} Konten Eksklusif</span>` : ""}
      </div>`;

    return `
      <div class="settings-section">
        <h3 class="pay-section-title"><i data-feather="shopping-cart"></i> Konten yang Tersedia di Paket Ini</h3>
        <p class="cart-desc">
          Film berikut tersedia setelah berlangganan <strong>${this._itemName()}</strong>.
          Film <strong>Gratis</strong> bisa ditonton semua orang, sedangkan <strong>Berbayar</strong>
          hanya bisa diakses pelanggan aktif.${exclCount > 0 ? " Film <strong>Eksklusif</strong> khusus paket Premium." : ""}
        </p>
        ${statsHTML}
        <div class="cart-film-grid">${filmCards}</div>
        <p class="cart-note"><i data-feather="info"></i> Menampilkan ${shown.length} dari ${films.length} film yang tersedia di paket ini.</p>
      </div>`;
  }

  /* ─────────────────────────────────────────────────
     TAB POIN
  ───────────────────────────────────────────────── */
  _poinHTML() {
    const pts  = this._pts?.totalPoints ?? 0;
    const lv   = LEVEL_CONFIG[this._pts?.level || "bronze"];
    const pct  = lv.next ? Math.min(100, Math.round(((pts - lv.min) / (lv.max - lv.min)) * 100)) : 100;
    const hist = this._pts?.history || [];

    return `
      <div class="pts-hero">
        <div class="pts-hero__balance">
          <span class="pts-hero__balance-label">Saldo Poin Kamu</span>
          <span class="pts-hero__balance-value" id="ptsBalance">${pts.toLocaleString("id-ID")}</span>
          <span class="pts-hero__balance-sub">poin tersedia</span>
        </div>
        <div class="pts-hero__level">
          <span class="pts-level-badge pts-level-badge--${this._pts?.level || "bronze"}">
            <i data-feather="award"></i> ${lv.label}
          </span>
          <div class="pts-progress-bar">
            <div class="pts-progress-bar__fill" style="width:${pct}%"></div>
          </div>
          <span class="pts-progress-label">${lv.next ? `${lv.max - pts} poin lagi ke ${lv.next}` : "Level tertinggi!"}</span>
        </div>
      </div>

      <!-- Cara mendapat poin -->
      <div class="form-section">
        <h3 class="form-section__title"><i data-feather="trending-up"></i> Cara Mendapatkan Poin</h3>
        <div class="pts-earn-grid">
          ${EARN_WAYS.map(w => `
            <div class="pts-earn-item">
              <div class="pts-earn-item__icon pts-earn-item__icon--${w.color}">
                <i data-feather="${w.icon}"></i>
              </div>
              <div class="pts-earn-item__body">
                <div class="pts-earn-item__pts">${w.pts}</div>
                <div class="pts-earn-item__title">${w.title}</div>
                <div class="pts-earn-item__desc">${w.desc}</div>
              </div>
            </div>`).join("")}
        </div>
      </div>

      <!-- Undang teman -->
      ${this._referralHTML()}

      <!-- Tukar poin -->
      <div class="form-section">
        <h3 class="form-section__title"><i data-feather="gift"></i> Tukar Poin - Voucher Diskon</h3>
        <p class="pts-section-note">
          <i data-feather="info"></i>
          Pilih voucher diskon di bawah. Poin hanya dipotong saat pembayaran berhasil - bukan saat memilih voucher.
        </p>
        <div class="pts-reward-grid" id="rewardGrid">${this._rewardCardsHTML()}</div>
      </div>

      <!-- Riwayat -->
      <div class="form-section">
        <h3 class="form-section__title"><i data-feather="clock"></i> Riwayat Poin</h3>
        <div class="pts-history-list">
          ${hist.length === 0
            ? `<p style="color:var(--text-muted);font-size:var(--font-sm);padding:var(--space-md) 0">Belum ada riwayat poin.</p>`
            : hist.slice(0, 20).map(h => {
                const isEarn  = h.type === "earn";
                const dateStr = new Date(h.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
                return `<div class="pts-history-item">
                  <div class="pts-history-item__icon pts-history-item__icon--${h.type}">
                    <i data-feather="${isEarn ? "plus-circle" : "minus-circle"}"></i>
                  </div>
                  <div class="pts-history-item__info">
                    <div class="pts-history-item__desc">${h.desc}</div>
                    <div class="pts-history-item__date">${dateStr}</div>
                  </div>
                  <span class="pts-history-item__pts pts-history-item__pts--${h.type}">
                    ${h.pts > 0 ? "+" : ""}${h.pts} poin
                  </span>
                </div>`;
              }).join("")
          }
        </div>
      </div>`;
  }

  _referralHTML() {
    const code = this._user.referralCode || "-";
    const link = `${window.location.origin}/frontend/pages/main/register.html?ref=${code}`;
    return `
      <div class="form-section">
        <h3 class="form-section__title"><i data-feather="user-plus"></i> Undang Teman</h3>
        <div class="pay-referral-card">
          <div class="pay-referral-card__body">
            <p class="pay-referral-card__title">Bagikan kode referral kamu</p>
            <p class="pay-referral-card__desc">
              Setiap teman yang mendaftar pakai kode atau link kamu memberikan <strong>+20 poin</strong> ke akunmu.
            </p>
          </div>
          <div class="pay-referral-card__code-row">
            <div class="pay-referral-code" id="refCode">${code}</div>
            <button class="btn btn-ghost btn-sm" id="btnCopyCode"><i data-feather="copy"></i> Salin Kode</button>
          </div>
          <div class="pay-referral-card__link-row">
            <input type="text" class="pay-promo-input" id="refLink" value="${link}" readonly>
            <button class="btn btn-primary btn-sm" id="btnCopyLink"><i data-feather="link"></i> Salin Link</button>
          </div>
          <div class="pay-referral-card__stats" id="referralStats">
            <i data-feather="loader"></i> Memuat data referral...
          </div>
        </div>
      </div>`;
  }

  _rewardCardsHTML() {
    const pts = this._pts?.totalPoints ?? 0;
    return REWARDS.map(r => {
      const can     = pts >= r.cost;
      const isActive = this._voucherDiscount === r.discountAmount && this._voucherPointsCost === r.cost;
      return `<div class="pts-reward-card ${!can ? "pts-reward-card--insufficient" : ""} ${isActive ? "pts-reward-card--active" : ""}">
        <div class="pts-reward-card__top">
          <div class="pts-reward-card__icon" style="background:rgba(29,185,84,0.12)">
            <i data-feather="tag" style="width:24px;height:24px;color:var(--accent-primary)"></i>
          </div>
          <div>
            <div class="pts-reward-card__name">${r.name}</div>
            <div class="pts-reward-card__sub">${isActive ? "✓ Voucher aktif" : "Voucher diskon"}</div>
          </div>
        </div>
        <div class="pts-reward-card__body"><p class="pts-reward-card__desc">${r.desc}</p></div>
        <div class="pts-reward-card__footer">
          <div class="pts-reward-card__cost"><i data-feather="zap"></i>${r.cost.toLocaleString("id-ID")} poin</div>
          <button class="btn ${isActive ? "btn-ghost" : "btn-primary"} btn-sm" data-reward="${r.id}" ${!can ? "disabled" : ""}>
            ${isActive ? "Batalkan" : can ? "Pilih" : "Kurang"}
          </button>
        </div>
      </div>`;
    }).join("");
  }

  _methodTile(m) {
    return `<button class="pay-method-tile" data-method="${m.id}" type="button">
      <div class="pay-method-tile__icon"><i data-feather="${m.icon}"></i></div>
      <span class="pay-method-tile__name">${m.name}</span>
    </button>`;
  }

  /* ─────────────────────────────────────────────────
     EVENTS
  ───────────────────────────────────────────────── */
  _bindEvents() {
    document.querySelectorAll(".pay-tab").forEach(btn => {
      btn.addEventListener("click", () => this._switchTab(btn.dataset.tab));
    });
    document.querySelectorAll(".pay-method-tile").forEach(tile => {
      tile.addEventListener("click", () => this._selectMethod(tile));
    });
    document.getElementById("btnPromo")?.addEventListener("click", () => this._applyPromoCode());
    document.getElementById("promoInput")?.addEventListener("keydown", e => { if (e.key === "Enter") this._applyPromoCode(); });
    document.getElementById("btnPay")?.addEventListener("click", () => this._processPayment());
    document.getElementById("btnRemoveVoucher")?.addEventListener("click", () => this._removeVoucher());
    document.getElementById("btnGoToPoin")?.addEventListener("click", () => this._switchTab("poin"));
    document.querySelectorAll(".pay-period-btn").forEach(btn => {
      btn.addEventListener("click", () => this._setBillingPeriod(btn.dataset.period));
    });

    // Reward grid
    document.getElementById("rewardGrid")?.addEventListener("click", e => {
      const btn = e.target.closest("[data-reward]");
      if (!btn || btn.disabled) return;
      const reward = REWARDS.find(r => r.id === btn.dataset.reward);
      if (reward) this._openRedeemModal(reward);
    });

    // Modal
    ["modalClose", "modalOverlay", "modalCancel"].forEach(id => {
      document.getElementById(id)?.addEventListener("click", () => this._closeModal());
    });
    document.getElementById("modalConfirm")?.addEventListener("click", () => this._applyVoucher());
    document.addEventListener("keydown", e => { if (e.key === "Escape") this._closeModal(); });

    // Referral
    this._loadReferralStats();
    document.getElementById("btnCopyCode")?.addEventListener("click", () => {
      navigator.clipboard?.writeText(document.getElementById("refCode")?.textContent)
        .then(() => this._toast("Kode referral disalin!", "success"));
    });
    document.getElementById("btnCopyLink")?.addEventListener("click", () => {
      navigator.clipboard?.writeText(document.getElementById("refLink")?.value)
        .then(() => this._toast("Link referral disalin!", "success"));
    });
  }

  _setBillingPeriod(period) {
    if (period !== "bulanan" && period !== "tahunan") return;
    if (this._billingPeriod === period) return;
    this._billingPeriod = period;
    // reset diskon kode promo karena basis harga berubah
    this._promoCodeDiscount = 0;
    this._promoCode = null;
    if (!this._paymentSuccess) {
      const url = new URL(window.location.href);
      url.searchParams.set("period", period);
      history.replaceState(null, "", url.toString());
    }
    this._reRenderPaymentTab();
  }

  _switchTab(tab) {
    this._activeTab = tab;
    document.querySelectorAll(".pay-tab").forEach(b => b.classList.toggle("pay-tab--active", b.dataset.tab === tab));
    document.getElementById("tabPayment")?.classList.toggle("is-hidden", tab !== "payment");
    document.getElementById("tabPoin")?.classList.toggle("is-hidden",    tab !== "poin");
    // Jangan ubah URL jika success page sedang tampil
    if (!this._paymentSuccess) {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      history.replaceState(null, "", url.toString());
    }
  }

  /* ─────────────────────────────────────────────────
     PEMBAYARAN
  ───────────────────────────────────────────────── */
  _selectMethod(tile) {
    document.querySelectorAll(".pay-method-tile").forEach(t => t.classList.remove("pay-method-tile--active"));
    tile.classList.add("pay-method-tile--active");
    this._selectedMethod = tile.dataset.method;

    const bd         = document.getElementById("bankDetail");
    const bankInfo   = METHODS.transfer.find(m => m.id === this._selectedMethod);
    const ewalletMeta = METHODS.ewallet.find(m => m.id === this._selectedMethod);

    if (bankInfo && bd) {
      // ── Transfer Bank: tampilkan detail rekening ──
      bd.classList.add("active");
      bd.innerHTML = `
        <p class="pay-bank-detail__title">Detail Rekening ${bankInfo.name}</p>
        <div class="pay-bank-row">
          <div><p class="pay-bank-row__label">Nomor Rekening</p><p class="pay-bank-row__value">${bankInfo.norek}</p></div>
          <button class="btn-copy" id="btnCopyNorek"><i data-feather="copy"></i> Salin</button>
        </div>
        <div class="pay-bank-row">
          <div><p class="pay-bank-row__label">Atas Nama</p><p class="pay-bank-row__value">${bankInfo.an}</p></div>
        </div>`;
      feather.replace();
      document.getElementById("btnCopyNorek")?.addEventListener("click", () => {
        navigator.clipboard?.writeText(bankInfo.norek).then(() => this._toast("Nomor rekening disalin!", "success"));
      });
    } else if (ewalletMeta && bd) {
      // ── Dompet Digital: tampilkan instruksi PIN/langkah pembayaran ──
      const instr = EWALLET_INSTRUCTIONS[ewalletMeta.id];
      bd.classList.add("active");
      bd.innerHTML = `
        <div class="pay-ewallet-instructions">
          <p class="pay-bank-detail__title" style="border-left:3px solid ${instr.color};padding-left:10px">
            Cara Bayar dengan ${ewalletMeta.name}
          </p>
          <ol class="pay-ewallet-steps">
            ${instr.steps.map((s, i) => `
              <li class="pay-ewallet-step">
                <div class="pay-ewallet-step__num" style="background:${instr.color}">${i + 1}</div>
                <div class="pay-ewallet-step__body">
                  <i data-feather="${s.icon}" class="pay-ewallet-step__icon"></i>
                  <span>${s.text}</span>
                </div>
              </li>`).join("")}
          </ol>
          <div class="pay-ewallet-note">
            <i data-feather="info"></i>
            <span>${instr.note}</span>
          </div>
        </div>`;
      feather.replace();
    } else if (bd) {
      bd.classList.remove("active");
      bd.innerHTML = "";
    }

    document.getElementById("btnPay").disabled = false;
    feather.replace();
  }

  _applyPromoCode() {
    const code = document.getElementById("promoInput")?.value.trim().toUpperCase();
    const msg  = document.getElementById("promoMsg");
    if (!code) return;
    // Kode diskon sederhana (bisa diperluas ke API)
    const MAP = { "HEMAT10": { pct: 10 }, "NEWUSER20": { pct: 20 } };
    const rule = MAP[code];
    if (!rule) {
      msg.textContent = "Kode tidak valid atau sudah kedaluwarsa.";
      msg.className   = "pay-promo-msg pay-promo-msg--error";
      this._promoCodeDiscount = 0; this._promoCode = null;
    } else {
      this._promoCodeDiscount = Math.round(this._basePrice() * rule.pct / 100);
      this._promoCode         = code;
      msg.textContent = `Diskon ${rule.pct}% berhasil diterapkan!`;
      msg.className   = "pay-promo-msg pay-promo-msg--ok";
    }
    this._refreshTotal();
  }

  _removeVoucher() {
    this._voucherDiscount   = 0;
    this._voucherPointsCost = 0;
    this._voucherName       = "";
    this._paymentSuccess   = false; // flag agar re-render tidak menimpa success page
    // Re-render tab pembayaran
    this._reRenderPaymentTab();
  }

  _refreshTotal() {
    const total = this._grandTotal();
    const str   = `Rp ${this._fmt(total)}`;
    const el1   = document.getElementById("grandTotal");
    const el2   = document.getElementById("confirmTotal");
    if (el1) el1.textContent = str;
    if (el2) el2.textContent = str;

    const pl = document.getElementById("promoCodeLine");
    if (pl) {
      if (this._promoCodeDiscount > 0) {
        pl.style.display = "flex";
        document.getElementById("promoCodeLabel").textContent = `Diskon kode (${this._promoCode})`;
        document.getElementById("promoCodeValue").textContent = `- Rp ${this._fmt(this._promoCodeDiscount)}`;
      } else pl.style.display = "none";
    }
    const vl = document.getElementById("voucherLine");
    if (vl) {
      if (this._voucherDiscount > 0) {
        vl.style.display = "flex";
        document.getElementById("voucherValue").textContent = `- Rp ${this._fmt(this._voucherDiscount)} (${this._voucherPointsCost} poin)`;
      } else vl.style.display = "none";
    }
  }

  _reRenderPaymentTab() {
    const tab = document.getElementById("tabPayment");
    if (!tab) return;
    tab.innerHTML = this._paymentHTML();
    // Re-bind events untuk tab payment
    document.querySelectorAll(".pay-method-tile").forEach(tile => {
      tile.addEventListener("click", () => this._selectMethod(tile));
    });
    document.getElementById("btnPromo")?.addEventListener("click", () => this._applyPromoCode());
    document.getElementById("promoInput")?.addEventListener("keydown", e => { if (e.key === "Enter") this._applyPromoCode(); });
    document.getElementById("btnPay")?.addEventListener("click", () => this._processPayment());
    document.getElementById("btnRemoveVoucher")?.addEventListener("click", () => this._removeVoucher());
    document.getElementById("btnGoToPoin")?.addEventListener("click", () => this._switchTab("poin"));
    document.querySelectorAll(".pay-period-btn").forEach(btn => {
      btn.addEventListener("click", () => this._setBillingPeriod(btn.dataset.period));
    });
    feather.replace();
  }

  async _processPayment() {
    const btn = document.getElementById("btnPay");
    btn.disabled  = true;
    btn.innerHTML = `<i data-feather="loader"></i> Memproses...`;
    feather.replace();
    await new Promise(r => setTimeout(r, 1500));
    try {
      const totalDiscount = this._promoCodeDiscount + this._voucherDiscount;
      const res = await fetch(`${API}/api/payment/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:         this._user.id,
          tierId:         this._tierId(),
          paymentMethod:  this._selectedMethod,
          sourceType:     this._sourceType,
          promoId:        this._sourceType === "promo" ? this._promo?.id : null,
          promoCode:      this._promoCode,
          discountAmount: totalDiscount,
          pointsUsed:     this._voucherPointsCost,   // poin baru dikurangi di sini
          voucherName:    this._voucherName || null,
          billingPeriod:  this._sourceType === "tier" ? this._billingPeriod : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      this._pts  = data.points;
      this._user = data.user;

      // Simpan notifikasi transaksi ke localStorage
      this._saveTransactionNotif(data.transaction);

      // Reset voucher setelah bayar berhasil
      this._voucherDiscount   = 0;
      this._voucherPointsCost = 0;
      this._voucherName       = "";
    this._paymentSuccess   = false; // flag agar re-render tidak menimpa success page

      this._paymentSuccess = true; // tandai agar tidak ada yang timpa success page
      const bonus = data.bonusPoints || 0;
      const now    = new Date().toLocaleString("id-ID", { day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" });
      const main   = document.getElementById("paymentMain");

      main.innerHTML = `
        <div class="user-page">
          <div class="pay-success">
            <div class="pay-success__icon"><i data-feather="check-circle"></i></div>
            <h1 class="pay-success__title">Pembayaran Berhasil!</h1>
            <p class="pay-success__desc">
              <strong>${this._itemName()}</strong> sekarang aktif.<br>
              Konfirmasi dikirim ke <strong>${this._user.email}</strong>.
              ${bonus > 0 ? `<br><br>Kamu mendapat <strong>+${bonus} poin</strong> bonus berlangganan!` : ""}
            </p>
            <div class="pay-success__actions">
              <a href="/frontend/pages/user/subscription.html" class="btn btn-primary">
                <i data-feather="star"></i> Lihat Status Langganan
              </a>
              <a href="/frontend/pages/user/transactions.html" class="btn btn-ghost">
                <i data-feather="credit-card"></i> Riwayat Transaksi
              </a>
              <button class="btn btn-ghost" id="btnSuccessClose">
                <i data-feather="x"></i> Tutup
              </button>
            </div>
          </div>
        </div>`;

      requestAnimationFrame(() => {
        feather.replace();
        document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
        document.getElementById("btnSuccessClose")?.addEventListener("click", () => {
          this._paymentSuccess = false;
          window.location.href = window.location.pathname; // reload tanpa query params
        });
      });
    } catch (err) {
      const msg = err.message === "Failed to fetch"
        ? "Server tidak terhubung. Jalankan: node backend/server.js"
        : err.message;
      this._toast(msg, "error");
      btn.disabled  = false;
      btn.innerHTML = `<i data-feather="lock"></i> Bayar Sekarang`;
      feather.replace();
    }
  }

  /* ─────────────────────────────────────────────────
     TUKAR POIN → VOUCHER
     Poin BELUM dikurangi di sini - hanya disimpan sebagai
     pending voucher. Poin baru dikurangi saat _processPayment.
  ───────────────────────────────────────────────── */
  _openRedeemModal(reward) {
    this._pendingReward = reward;
    const isActive = this._voucherDiscount === reward.discountAmount && this._voucherPointsCost === reward.cost;

    document.getElementById("modalTitle").textContent = isActive ? "Batalkan Voucher" : `Pilih Voucher: ${reward.name}`;
    document.getElementById("modalBody").innerHTML = isActive
      ? `Voucher <strong>${reward.name}</strong> akan dibatalkan. Poin kamu <strong>tidak berkurang</strong> karena poin belum dipotong.<br><br>
         Kamu bisa memilih voucher lain atau bayar tanpa diskon.`
      : `Kamu akan menggunakan <strong>${reward.cost.toLocaleString("id-ID")} poin</strong> untuk mendapat diskon <strong>Rp ${this._fmt(reward.discountAmount)}</strong> saat pembayaran.<br><br>
         <i style="color:var(--text-muted);font-size:var(--font-xs)">Catatan: poin baru akan dipotong setelah pembayaran berhasil dilakukan.</i><br><br>
         Saldo poin kamu sekarang: <strong>${this._pts.totalPoints.toLocaleString("id-ID")} poin</strong>`;

    document.getElementById("modalConfirm").textContent = isActive ? "Batalkan Voucher" : "Terapkan Voucher";
    document.getElementById("redeemModal").classList.add("active");
    document.body.style.overflow = "hidden";
    feather.replace();
  }

  _closeModal() {
    document.getElementById("redeemModal")?.classList.remove("active");
    document.body.style.overflow = "";
    this._pendingReward = null;
  }

  _applyVoucher() {
    if (!this._pendingReward) return;
    const reward   = this._pendingReward;
    const isActive = this._voucherDiscount === reward.discountAmount && this._voucherPointsCost === reward.cost;
    this._closeModal();

    if (isActive) {
      // Batalkan voucher
      this._voucherDiscount   = 0;
      this._voucherPointsCost = 0;
      this._voucherName       = "";
    this._paymentSuccess   = false; // flag agar re-render tidak menimpa success page
      this._toast("Voucher dibatalkan.", "warning");
    } else {
      // Terapkan voucher baru
      this._voucherDiscount   = reward.discountAmount;
      this._voucherPointsCost = reward.cost;
      this._voucherName       = reward.name;
      this._toast(`Voucher ${reward.name} diterapkan! Poin dipotong saat pembayaran berhasil.`, "success");
    }

    // Update reward grid
    document.getElementById("rewardGrid").innerHTML = this._rewardCardsHTML();
    feather.replace();

    // Switch ke tab pembayaran supaya user lihat diskon
    setTimeout(() => {
      this._switchTab("payment");
      this._reRenderPaymentTab();
    }, 800);
  }

  /* ─────────────────────────────────────────────────
     REFERRAL
  ───────────────────────────────────────────────── */
  async _loadReferralStats() {
    const el = document.getElementById("referralStats");
    if (!el) return;
    try {
      const res = await fetch(`${API}/api/referral?userId=${this._user.id}`);
      const d   = await res.json();
      if (!d.success) throw new Error();
      if (d.referralCode && !this._user.referralCode) {
        this._user.referralCode = d.referralCode;
        const link = `${window.location.origin}/frontend/pages/main/register.html?ref=${d.referralCode}`;
        const inp  = document.getElementById("refLink");
        const cd   = document.getElementById("refCode");
        if (inp) inp.value = link;
        if (cd)  cd.textContent = d.referralCode;
      }
      el.innerHTML = `<i data-feather="users"></i>
        <strong>${d.friendCount}</strong> teman bergabung via referralmu
        ${d.friendCount > 0 ? `<span style="color:var(--accent-primary);font-weight:600;margin-left:4px">+${d.friendCount * 20} poin diterima</span>` : ""}`;
      feather.replace();
    } catch {
      el.innerHTML = `<i data-feather="wifi-off"></i> Tidak terhubung ke server`;
      feather.replace();
    }
  }

  /* ─────────────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────────────── */
  _fmt(n)       { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  _avatar(name) { return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1db954&color=fff`; }
  _yearlySavingPercent(tier) {
    if (!tier?.price || tier.priceYearly == null) return 0;
    const fullYear = tier.price * 12;
    if (fullYear <= 0) return 0;
    return Math.round(((fullYear - tier.priceYearly) / fullYear) * 100);
  }

  _saveTransactionNotif(transaction) {
    try {
      const raw = localStorage.getItem("pilih-in-db");
      if (!raw) return;
      const db = JSON.parse(raw);
      if (!Array.isArray(db.notifications)) db.notifications = [];
      const notif = {
        id: "notif-txn-" + transaction.id,
        type: "transaksi",
        title: "Pembayaran Berhasil",
        message: `Pembayaran untuk ${transaction.itemLabel} sebesar Rp ${transaction.totalAmount.toLocaleString("id-ID")} telah berhasil diproses.`,
        createdAt: transaction.createdAt || new Date().toISOString(),
        read: false,
        actionUrl: "/frontend/pages/user/transactions.html",
        actionLabel: "Lihat Transaksi",
      };
      db.notifications.unshift(notif);
      localStorage.setItem("pilih-in-db", JSON.stringify(db));
    } catch (e) {
      console.warn("Gagal menyimpan notifikasi transaksi:", e);
    }
  }

  _toast(msg, type = "success") {
    document.querySelector(".toast")?.remove();
    const icons = { success: "check-circle", error: "alert-circle", warning: "alert-triangle" };
    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.innerHTML = `<i data-feather="${icons[type]}"></i><span>${msg}</span>`;
    document.body.appendChild(el);
    feather.replace();
    requestAnimationFrame(() => el.classList.add("toast--visible"));
    setTimeout(() => { el.classList.remove("toast--visible"); setTimeout(() => el.remove(), 350); }, 4000);
  }
}

export default PaymentPage;