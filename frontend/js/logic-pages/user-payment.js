import authService from "../../../backend/services/AuthService.js";

/* ══════════════════ KONSTANTA ══════════════════ */
const API = "http://localhost:3000";

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

// Diskon poin: 100 poin = Rp 1.000
const POINTS_RATE = 10; // 1 poin = Rp 10

// Reward yang bisa ditukar (hanya diskon harga langganan)
const REWARDS = [
  { id: "rwd-d5",   name: "Diskon Rp 5.000",   desc: "Dipakai saat pembayaran paket apapun",   cost: 500,  discountAmount: 5000  },
  { id: "rwd-d10",  name: "Diskon Rp 10.000",  desc: "Dipakai saat pembayaran paket apapun",   cost: 1000, discountAmount: 10000 },
  { id: "rwd-d25",  name: "Diskon Rp 25.000",  desc: "Dipakai saat pembayaran paket apapun",   cost: 2500, discountAmount: 25000 },
  { id: "rwd-d50",  name: "Diskon Rp 50.000",  desc: "Dipakai saat pembayaran paket apapun",   cost: 5000, discountAmount: 50000 },
];

const EARN_WAYS = [
  { icon: "edit-3",     color: "green",  pts: "+10 poin", title: "Tulis Ulasan",         desc: "Setiap ulasan atau rating yang kamu tulis pada film" },
  { icon: "user-plus",  color: "blue",   pts: "+20 poin", title: "Ajak Teman",           desc: "Per teman yang berhasil mendaftar lewat link referral kamu" },
  { icon: "zap",        color: "info",   pts: "+50 poin", title: "Langganan Standard",   desc: "Bonus poin setiap kali berlangganan atau perpanjang paket Standard" },
  { icon: "award",      color: "yellow", pts: "+100 poin",title: "Langganan Premium",    desc: "Bonus poin lebih besar setiap kali berlangganan atau perpanjang paket Premium" },
];

const LEVEL_CONFIG = {
  bronze:   { label: "Bronze",   min: 0,    max: 500,  next: "Silver"   },
  silver:   { label: "Silver",   min: 500,  max: 2000, next: "Gold"     },
  gold:     { label: "Gold",     min: 2000, max: 5000, next: "Platinum" },
  platinum: { label: "Platinum", min: 5000, max: 5000, next: null       },
};

/* ══════════════════ CLASS ══════════════════ */
class PaymentPage {
  constructor() {
    this._user           = null;
    this._tiers          = [];
    this._tier           = null;   // tier yang akan dibeli
    this._pts            = null;   // { totalPoints, level, history[] }
    this._selectedMethod = null;
    this._promoDiscount  = 0;      // diskon dari kode promo
    this._promoCode      = null;
    this._pointsDiscount = 0;      // diskon dari poin (dipilih saat redeem)
    this._pointsUsed     = 0;      // jumlah poin yang dipakai
    this._pendingReward  = null;
    this._activeTab      = "payment";
    this._overlay        = null;
    this._init();
  }

  async _init() {
    if (!authService.requireAuth()) return;
    this._user = await authService.getCurrentUser();
    if (!this._user) { window.location.href = "/frontend/pages/main/login.html"; return; }

    // Load tiers
    try {
      const r = await fetch("/data/pricing-tiers.json");
      this._tiers = (await r.json()).tiers || [];
    } catch { /**/ }

    // Query params
    const p    = new URLSearchParams(window.location.search);
    const tid  = p.get("tier") || "standard";
    this._activeTab = p.get("tab") === "poin" ? "poin" : "payment";
    this._tier = this._tiers.find(t => t.id === tid) || this._tiers[1] || this._tiers[0];

    // Load poin dari server
    await this._loadPoints();

    this._renderSidebar();
    this._renderPage();
    feather.replace();
  }

  /* ── Load poin dari API ── */
  async _loadPoints() {
    try {
      const r = await fetch(`${API}/api/points?userId=${this._user.id}`);
      const d = await r.json();
      if (d.success) this._pts = d.points;
    } catch { /**/ }
    if (!this._pts) this._pts = { totalPoints: 0, lifetimePoints: 0, level: "bronze", history: [] };
  }

  /* ── SIDEBAR ── */
  _NAV() {
    return [
      { section: "Akun Saya" },
      { href: "/frontend/pages/user/profile.html",             icon: "user",        label: "Profil" },
      { href: "/frontend/pages/user/security.html",            icon: "shield",      label: "Keamanan" },
      { href: "/frontend/pages/user/settings.html",            icon: "settings",    label: "Pengaturan" },
      { section: "Konten" },
      { href: "/frontend/pages/user/history.html",             icon: "clock",       label: "Riwayat Tonton" },
      { href: "/frontend/pages/user/favorites-film.html",      icon: "heart",       label: "Favorit" },
      { href: "/frontend/pages/user/watchlist.html",           icon: "bookmark",    label: "Daftar Tonton" },
      { section: "Langganan" },
      { href: "/frontend/pages/user/subscription.html",        icon: "star",        label: "Status Langganan" },
      { href: "/frontend/pages/user/payment.html",             icon: "gift",        label: "Pembayaran & Poin" },
      { href: "/frontend/pages/user/transactions.html",        icon: "credit-card", label: "Transaksi" },
      { href: "/frontend/pages/user/notifications.html",       icon: "bell",        label: "Notifikasi" },
    ];
  }

  _renderSidebar() {
    const el = document.getElementById("userSidebar");
    if (!el) return;
    const u = this._user, cur = window.location.pathname;
    el.innerHTML = `
      <div class="user-sidebar__logo"><a href="/frontend/index.html">Pilih<span>.in</span></a></div>
      <div class="user-sidebar__avatar-section">
        <img src="${u.profilePhoto || this._avatar(u.username)}" alt="${u.username}" class="user-sidebar__avatar">
        <div class="user-sidebar__user-info">
          <div class="user-sidebar__username">${u.username}</div>
          <div class="user-sidebar__role">Pengguna</div>
        </div>
      </div>
      <nav class="user-sidebar__nav">
        <a href="/frontend/index.html" class="user-sidebar__link"><i data-feather="home"></i><span>Beranda</span></a>
        <a href="/frontend/pages/film/katalog.html" class="user-sidebar__link"><i data-feather="film"></i><span>Film</span></a>
        ${this._NAV().map(it => {
          if (it.section) return `<span class="user-sidebar__section-label">${it.section}</span>`;
          const a = cur === it.href ? " user-sidebar__link--active" : "";
          return `<a href="${it.href}" class="user-sidebar__link${a}"><i data-feather="${it.icon}"></i><span>${it.label}</span></a>`;
        }).join("")}
      </nav>
      <div class="user-sidebar__footer">
        <button class="user-sidebar__logout" id="btnLogout"><i data-feather="log-out"></i><span>Keluar</span></button>
      </div>`;
    document.getElementById("btnLogout")?.addEventListener("click", () => {
      authService.logout(); window.location.href = "/frontend/pages/main/login.html";
    });
  }

  /* ════════ RENDER PAGE ════════ */
  _renderPage() {
    const main = document.getElementById("paymentMain");
    if (!main) return;
    const pts = this._pts?.totalPoints ?? 0;

    main.innerHTML = `
      <div class="user-page">
        <div class="page-header">
          <button class="page-header__burger" id="btnBurger"><i data-feather="menu"></i></button>
          <div class="page-header__text">
            <h1 class="page-header__title">Pembayaran &amp; Poin</h1>
            <p class="page-header__subtitle">Kelola pembayaran langganan dan tukarkan poin kamu</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="pay-tabs">
          <button class="pay-tab ${this._activeTab === "payment" ? "pay-tab--active" : ""}" data-tab="payment">
            <i data-feather="shopping-cart"></i> Pembayaran
          </button>
          <button class="pay-tab ${this._activeTab === "poin" ? "pay-tab--active" : ""}" data-tab="poin">
            <i data-feather="zap"></i> Poin Saya
            <span class="pay-tab__badge" id="tabPtsBadge">${pts}</span>
          </button>
        </div>

        <div id="tabPayment"  class="${this._activeTab === "payment" ? "" : "is-hidden"}">${this._paymentHTML()}</div>
        <div id="tabPoin"     class="${this._activeTab === "poin"    ? "" : "is-hidden"}">${this._poinHTML()}</div>
      </div>

      <!-- Modal konfirmasi tukar poin -->
      <div class="modal" id="redeemModal">
        <div class="modal-overlay" id="modalOverlay"></div>
        <div class="modal-content">
          <button class="modal-close" id="modalClose"><i data-feather="x"></i></button>
          <h2 class="modal-title" id="modalTitle">Tukar Poin</h2>
          <div class="modal-body" id="modalBody"></div>
          <div class="modal-footer">
            <button class="btn btn-ghost" id="modalCancel">Batal</button>
            <button class="btn btn-primary" id="modalConfirm"><i data-feather="check"></i> Konfirmasi</button>
          </div>
        </div>
      </div>`;

    this._bindEvents();
    this._bindBurger();
  }

  /* ════════ TAB PEMBAYARAN ════════ */
  _paymentHTML() {
    const t = this._tier;
    if (!t || t.price === 0) {
      return `<div class="sub-cta-card" style="margin-top:var(--space-lg)">
        <div class="sub-cta-card__icon"><i data-feather="info"></i></div>
        <div class="sub-cta-card__body">
          <h3 class="sub-cta-card__title">Pilih paket berbayar untuk melanjutkan</h3>
          <p class="sub-cta-card__desc">Paket Basic gratis — tidak perlu pembayaran.</p>
        </div>
        <a href="/frontend/pages/main/pricing.html" class="btn btn-primary"><i data-feather="layers"></i> Lihat Paket</a>
      </div>`;
    }

    const total = t.price;
    return `
      <!-- Ringkasan paket -->
      <div class="pay-summary-card">
        <div class="pay-summary-card__header">
          <div class="pay-summary-card__icon"><i data-feather="package"></i></div>
          <div>
            <p class="pay-summary-card__tier">Paket ${t.name}</p>
            <p class="pay-summary-card__desc">${t.description}</p>
          </div>
          <a href="/frontend/pages/main/pricing.html" class="btn btn-ghost btn-sm" style="margin-left:auto">
            <i data-feather="refresh-cw"></i> Ganti
          </a>
        </div>
        <div class="pay-summary-card__body">
          <div class="pay-line">
            <span class="pay-line__label">Harga paket</span>
            <span class="pay-line__value">Rp ${this._fmt(t.price)}</span>
          </div>
          <div class="pay-line pay-line--discount" id="promoLine" style="display:none">
            <span class="pay-line__label" id="promoLabel">Diskon promo</span>
            <span class="pay-line__value" id="promoValue"></span>
          </div>
          <div class="pay-line pay-line--discount" id="pointsLine" style="display:none">
            <span class="pay-line__label">Diskon poin</span>
            <span class="pay-line__value" id="pointsValue"></span>
          </div>
          <div class="pay-line pay-line--total">
            <span class="pay-line__label">Total Bayar</span>
            <span class="pay-line__value" id="grandTotal">Rp ${this._fmt(total)}</span>
          </div>

          <!-- Kode promo -->
          <div class="pay-promo-row">
            <input type="text" class="pay-promo-input" id="promoInput" placeholder="Kode promo (opsional)" maxlength="20">
            <button class="btn btn-ghost btn-sm" id="btnPromo"><i data-feather="tag"></i> Terapkan</button>
          </div>
          <p class="pay-promo-msg" id="promoMsg"></p>

          <!-- Gunakan poin sebagai diskon -->
          ${this._pts?.totalPoints > 0 ? `
          <div class="pay-bonus-notice" style="cursor:pointer" id="btnUsePoints">
            <i data-feather="zap"></i>
            <span>Kamu punya <strong>${this._pts.totalPoints} poin</strong>.
              <span id="usePointsLink" style="text-decoration:underline;font-weight:600">
                ${this._pointsDiscount > 0 ? `Poin dipakai (diskon Rp ${this._fmt(this._pointsDiscount)})` : "Pakai poin sebagai diskon?"}
              </span>
            </span>
          </div>` : ""}
        </div>
      </div>

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

  /* ════════ TAB POIN ════════ */
  _poinHTML() {
    const pts  = this._pts?.totalPoints ?? 0;
    const lv   = LEVEL_CONFIG[this._pts?.level || "bronze"];
    const pct  = lv.next ? Math.min(100, Math.round(((pts - lv.min) / (lv.max - lv.min)) * 100)) : 100;
    const hist = this._pts?.history || [];

    return `
      <!-- Hero saldo -->
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

      <!-- Tukar poin → diskon langganan -->
      <div class="form-section">
        <h3 class="form-section__title"><i data-feather="gift"></i> Tukar Poin — Diskon Langganan</h3>
        <p style="font-size:var(--font-sm);color:var(--text-muted);margin:0 0 var(--space-md)">
          Poin bisa ditukar menjadi diskon harga saat melakukan pembayaran langganan.
        </p>
        <div class="pts-reward-grid" id="rewardGrid">${this._rewardCardsHTML()}</div>
      </div>

      <!-- Riwayat -->
      <div class="form-section">
        <h3 class="form-section__title"><i data-feather="clock"></i> Riwayat Poin</h3>
        <div class="pts-history-list">
          ${hist.length === 0
            ? `<p style="color:var(--text-muted);font-size:var(--font-sm);padding:var(--space-md) 0">Belum ada riwayat poin.</p>`
            : hist.map(h => {
                const isEarn = h.type === "earn";
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

  /* ── Referral section ── */
  _referralHTML() {
    const code = this._user.referralCode || "—";
    const link = `${window.location.origin}/frontend/pages/main/register.html?ref=${code}`;
    return `
      <div class="form-section">
        <h3 class="form-section__title"><i data-feather="user-plus"></i> Undang Teman</h3>
        <div class="pay-referral-card">
          <div class="pay-referral-card__body">
            <p class="pay-referral-card__title">Bagikan kode referral kamu</p>
            <p class="pay-referral-card__desc">
              Setiap teman yang mendaftar menggunakan kode atau link kamu akan memberikan
              <strong>+20 poin</strong> ke akunmu. Tidak ada batasan pengundangan!
            </p>
          </div>
          <div class="pay-referral-card__code-row">
            <div class="pay-referral-code" id="refCode">${code}</div>
            <button class="btn btn-ghost btn-sm" id="btnCopyCode">
              <i data-feather="copy"></i> Salin Kode
            </button>
          </div>
          <div class="pay-referral-card__link-row">
            <input type="text" class="pay-promo-input" id="refLink" value="${link}" readonly>
            <button class="btn btn-primary btn-sm" id="btnCopyLink">
              <i data-feather="link"></i> Salin Link
            </button>
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
      const can = pts >= r.cost;
      return `<div class="pts-reward-card ${!can ? "pts-reward-card--insufficient" : ""}">
        <div class="pts-reward-card__top">
          <div class="pts-reward-card__icon" style="background:rgba(29,185,84,0.12)">
            <i data-feather="tag" style="width:24px;height:24px;color:var(--accent-primary)"></i>
          </div>
          <div>
            <div class="pts-reward-card__name">${r.name}</div>
            <div class="pts-reward-card__sub">Diskon pembayaran</div>
          </div>
        </div>
        <div class="pts-reward-card__body"><p class="pts-reward-card__desc">${r.desc}</p></div>
        <div class="pts-reward-card__footer">
          <div class="pts-reward-card__cost"><i data-feather="zap"></i>${r.cost.toLocaleString("id-ID")} poin</div>
          <button class="btn btn-primary btn-sm" data-reward="${r.id}" ${!can ? "disabled" : ""}>
            ${can ? "Pakai" : "Kurang"}
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

  /* ════════ EVENTS ════════ */
  _bindEvents() {
    // Tab switch
    document.querySelectorAll(".pay-tab").forEach(btn => {
      btn.addEventListener("click", () => this._switchTab(btn.dataset.tab));
    });

    // Metode bayar
    document.querySelectorAll(".pay-method-tile").forEach(tile => {
      tile.addEventListener("click", () => this._selectMethod(tile));
    });

    // Promo
    document.getElementById("btnPromo")?.addEventListener("click", () => this._applyPromo());
    document.getElementById("promoInput")?.addEventListener("keydown", e => { if (e.key === "Enter") this._applyPromo(); });

    // Gunakan poin
    document.getElementById("btnUsePoints")?.addEventListener("click", () => this._toggleUsePoints());

    // Bayar
    document.getElementById("btnPay")?.addEventListener("click", () => this._processPayment());

    // Reward grid (tukar poin)
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
    document.getElementById("modalConfirm")?.addEventListener("click", () => this._confirmRedeem());
    document.addEventListener("keydown", e => { if (e.key === "Escape") this._closeModal(); });

    // Referral
    this._loadReferralStats();
    document.getElementById("btnCopyCode")?.addEventListener("click", () => {
      const code = document.getElementById("refCode")?.textContent;
      navigator.clipboard?.writeText(code).then(() => this._toast("Kode referral disalin!", "success"));
    });
    document.getElementById("btnCopyLink")?.addEventListener("click", () => {
      const link = document.getElementById("refLink")?.value;
      navigator.clipboard?.writeText(link).then(() => this._toast("Link referral disalin!", "success"));
    });
  }

  _bindBurger() {
    if (this._overlay) return;
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
  }

  _switchTab(tab) {
    this._activeTab = tab;
    document.querySelectorAll(".pay-tab").forEach(b => b.classList.toggle("pay-tab--active", b.dataset.tab === tab));
    document.getElementById("tabPayment")?.classList.toggle("is-hidden", tab !== "payment");
    document.getElementById("tabPoin")?.classList.toggle("is-hidden", tab !== "poin");
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    history.replaceState(null, "", url.toString());
  }

  /* ════════ PEMBAYARAN ════════ */
  _selectMethod(tile) {
    document.querySelectorAll(".pay-method-tile").forEach(t => t.classList.remove("pay-method-tile--active"));
    tile.classList.add("pay-method-tile--active");
    this._selectedMethod = tile.dataset.method;

    // Detail bank
    const bd   = document.getElementById("bankDetail");
    const info = METHODS.transfer.find(m => m.id === this._selectedMethod);
    if (info && bd) {
      bd.classList.add("active");
      bd.innerHTML = `
        <p class="pay-bank-detail__title">Detail Rekening ${info.name}</p>
        <div class="pay-bank-row">
          <div><p class="pay-bank-row__label">Nomor Rekening</p><p class="pay-bank-row__value">${info.norek}</p></div>
          <button class="btn-copy" id="btnCopyNorek"><i data-feather="copy"></i> Salin</button>
        </div>
        <div class="pay-bank-row">
          <div><p class="pay-bank-row__label">Atas Nama</p><p class="pay-bank-row__value">${info.an}</p></div>
        </div>`;
      feather.replace();
      document.getElementById("btnCopyNorek")?.addEventListener("click", () => {
        navigator.clipboard?.writeText(info.norek).then(() => this._toast("Nomor rekening disalin!", "success"));
      });
    } else if (bd) { bd.classList.remove("active"); bd.innerHTML = ""; }

    document.getElementById("btnPay").disabled = false;
    feather.replace();
  }

  _applyPromo() {
    const code  = document.getElementById("promoInput")?.value.trim().toUpperCase();
    const msg   = document.getElementById("promoMsg");
    if (!code) return;

    // Cocokkan dengan promotions.json (in-memory simple check)
    // Untuk prod: POST ke backend. Di sini kita pakai hardcode valid codes sesuai promotions.json
    const PROMO_MAP = {
      "HEMAT10":   { type: "percent", value: 10 },
      "NEWUSER20": { type: "percent", value: 20 },
    };
    const promo = PROMO_MAP[code];
    if (!promo) {
      msg.textContent = "Kode promo tidak valid atau sudah kedaluwarsa.";
      msg.className   = "pay-promo-msg pay-promo-msg--error";
      this._promoDiscount = 0; this._promoCode = null;
    } else {
      const base = this._tier?.price || 0;
      this._promoDiscount = promo.type === "percent" ? Math.round(base * promo.value / 100) : promo.value;
      this._promoCode     = code;
      msg.textContent = `Diskon ${promo.value}% berhasil diterapkan!`;
      msg.className   = "pay-promo-msg pay-promo-msg--ok";
    }
    this._updateTotal();
  }

  _toggleUsePoints() {
    const pts     = this._pts?.totalPoints ?? 0;
    const maxDisc = this._tier?.price || 0;
    if (this._pointsDiscount > 0) {
      // batalkan
      this._pointsDiscount = 0; this._pointsUsed = 0;
      document.getElementById("usePointsLink").textContent = "Pakai poin sebagai diskon?";
    } else {
      // hitung diskon maksimal dari semua poin (1 poin = Rp 10), maks = harga tier
      const maxFromPts      = pts * POINTS_RATE;
      this._pointsDiscount  = Math.min(maxFromPts, maxDisc);
      this._pointsUsed      = Math.ceil(this._pointsDiscount / POINTS_RATE);
      document.getElementById("usePointsLink").textContent = `Poin dipakai (diskon Rp ${this._fmt(this._pointsDiscount)})`;
    }
    this._updateTotal();
  }

  _updateTotal() {
    const base  = this._tier?.price || 0;
    const total = Math.max(0, base - this._promoDiscount - this._pointsDiscount);

    // Baris promo
    const pl = document.getElementById("promoLine");
    if (this._promoDiscount > 0 && pl) {
      pl.style.display = "flex";
      document.getElementById("promoLabel").textContent = `Diskon promo (${this._promoCode})`;
      document.getElementById("promoValue").textContent = `- Rp ${this._fmt(this._promoDiscount)}`;
    } else if (pl) pl.style.display = "none";

    // Baris poin
    const ptl = document.getElementById("pointsLine");
    if (this._pointsDiscount > 0 && ptl) {
      ptl.style.display = "flex";
      document.getElementById("pointsValue").textContent = `- Rp ${this._fmt(this._pointsDiscount)} (${this._pointsUsed} poin)`;
    } else if (ptl) ptl.style.display = "none";

    const str = `Rp ${this._fmt(total)}`;
    document.getElementById("grandTotal").textContent   = str;
    document.getElementById("confirmTotal").textContent = str;
  }

  async _processPayment() {
    const btn = document.getElementById("btnPay");
    btn.disabled  = true;
    btn.innerHTML = `<i data-feather="loader"></i> Memproses...`;
    feather.replace();

    await new Promise(r => setTimeout(r, 1500)); // simulasi network

    try {
      const res = await fetch(`${API}/api/payment/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:         this._user.id,
          tierId:         this._tier.id,
          paymentMethod:  this._selectedMethod,
          promoCode:      this._promoCode,
          discountAmount: this._promoDiscount + this._pointsDiscount,
          pointsUsed:     this._pointsUsed,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Update local state
      this._pts  = data.points;
      this._user = data.user;

      const bonus    = (data.points.history[0]?.type === "earn") ? data.points.history[0].pts : 0;
      const tierName = this._tier.name;
      const main     = document.getElementById("paymentMain");
      if (!main) return;

      // Hapus semua listener agar tidak ada re-render tersembunyi
      this._paymentDone = true;

      main.innerHTML = `
        <div class="user-page">
          <div class="pay-success">
            <div class="pay-success__icon"><i data-feather="check-circle"></i></div>
            <h1 class="pay-success__title">Pembayaran Berhasil!</h1>
            <p class="pay-success__desc">
              Paket <strong>${tierName}</strong> sekarang aktif.<br>
              Konfirmasi dikirim ke <strong>${this._user.email}</strong>.
              ${bonus > 0 ? `<br><br>Kamu mendapat <strong>+${bonus} poin</strong> bonus!` : ""}
            </p>
            <div class="pay-success__actions">
              <a href="/frontend/pages/user/subscription.html" class="btn btn-primary">
                <i data-feather="star"></i> Lihat Status Langganan
              </a>
              <a href="/frontend/pages/user/transactions.html" class="btn btn-ghost">
                <i data-feather="credit-card"></i> Riwayat Transaksi
              </a>
            </div>
          </div>
        </div>`;
      feather.replace();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const msg = err.message === "Failed to fetch" ? "Server tidak terhubung. Jalankan: node backend/server.js" : err.message;
      this._toast(msg, "error");
      btn.disabled  = false;
      btn.innerHTML = `<i data-feather="lock"></i> Bayar Sekarang`;
      feather.replace();
    }
  }

  /* ════════ TUKAR POIN ════════ */
  _openRedeemModal(reward) {
    this._pendingReward = reward;
    document.getElementById("modalTitle").textContent = `Tukar: ${reward.name}`;
    document.getElementById("modalBody").innerHTML = `
      Kamu akan menukar <strong>${reward.cost.toLocaleString("id-ID")} poin</strong>
      dan mendapatkan voucher <strong>${reward.name}</strong>.<br><br>
      Voucher ini akan otomatis diterapkan saat kamu melakukan pembayaran langganan berikutnya.<br><br>
      Saldo setelah penukaran: <strong>${(this._pts.totalPoints - reward.cost).toLocaleString("id-ID")} poin</strong>.`;
    document.getElementById("redeemModal").classList.add("active");
    document.body.style.overflow = "hidden";
    feather.replace();
  }

  _closeModal() {
    document.getElementById("redeemModal")?.classList.remove("active");
    document.body.style.overflow = "";
    this._pendingReward = null;
  }

  async _confirmRedeem() {
    if (!this._pendingReward) return;
    const reward = this._pendingReward;
    this._closeModal();

    try {
      const res = await fetch(`${API}/api/points/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: this._user.id, rewardName: reward.name, cost: reward.cost }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      this._pts = data.points;

      // Aktifkan diskon di tab pembayaran
      this._pointsDiscount = reward.discountAmount;
      this._pointsUsed     = reward.cost;

      // Re-render tab poin
      document.getElementById("tabPoin").innerHTML = this._poinHTML();
      document.getElementById("tabPtsBadge").textContent = this._pts.totalPoints;

      // Bind event referral lagi
      this._bindReferralEvents();
      feather.replace();

      this._toast(`${reward.name} ditukar! Diskon akan aktif saat pembayaran.`, "success");

      // Switch ke tab payment agar user lihat diskon
      setTimeout(() => { this._switchTab("payment"); this._updateTotal(); }, 1500);
    } catch (err) {
      const msg = err.message === "Failed to fetch" ? "Server tidak terhubung. Jalankan: node backend/server.js" : err.message;
      this._toast(msg, "error");
    }
  }

  /* ════════ REFERRAL ════════ */
  async _loadReferralStats() {
    const el = document.getElementById("referralStats");
    if (!el) return;
    try {
      const res = await fetch(`${API}/api/referral?userId=${this._user.id}`);
      const d   = await res.json();
      if (!d.success) throw new Error();

      // Update referral code di user jika baru dibuat server
      if (d.referralCode && !this._user.referralCode) {
        this._user.referralCode = d.referralCode;
        // Update link input
        const link = `${window.location.origin}/frontend/pages/main/register.html?ref=${d.referralCode}`;
        const inp  = document.getElementById("refLink");
        const cd   = document.getElementById("refCode");
        if (inp) inp.value = link;
        if (cd)  cd.textContent = d.referralCode;
      }

      el.innerHTML = `<i data-feather="users"></i>
        <strong>${d.friendCount}</strong> teman sudah bergabung via referralmu
        ${d.friendCount > 0 ? `<span style="color:var(--accent-primary);font-weight:600">+${d.friendCount * 20} poin diterima</span>` : ""}`;
      feather.replace();
    } catch {
      el.innerHTML = `<i data-feather="wifi-off"></i> Tidak terhubung ke server`;
      feather.replace();
    }
  }

  _bindReferralEvents() {
    document.getElementById("btnCopyCode")?.addEventListener("click", () => {
      const code = document.getElementById("refCode")?.textContent;
      navigator.clipboard?.writeText(code).then(() => this._toast("Kode referral disalin!", "success"));
    });
    document.getElementById("btnCopyLink")?.addEventListener("click", () => {
      const link = document.getElementById("refLink")?.value;
      navigator.clipboard?.writeText(link).then(() => this._toast("Link referral disalin!", "success"));
    });
    this._loadReferralStats();
  }

  /* ════════ HELPERS ════════ */
  _fmt(n)       { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  _avatar(name) { return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1db954&color=fff`; }

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