class PricingPage {
    constructor() {
        this._tiers = [];
        this._isYearly = false;
        this._init();
    }

    async _init() {
        try {
            const res = await fetch("/data/pricing-tiers.json");
            const data = await res.json();
            this._tiers = data.tiers;
            this._render();
        } catch (err) {
            console.warn("PricingPage: gagal load data", err);
        }
    }

    _render() {
        this._renderToggle();
        this._renderGrid();
        feather.replace();
    }

    /* ── Toggle ──────────────────────────────── */

    _renderToggle() {
        const container = document.getElementById("pricingToggle");
        if (!container) return;
        container.innerHTML = `
            <button class="pricing-toggle__btn --active" data-period="monthly">Bulanan</button>
            <button class="pricing-toggle__btn" data-period="yearly">Tahunan <span class="pricing-toggle__badge">Hemat 20%</span></button>
        `;
        container.addEventListener("click", (e) => {
            const btn = e.target.closest(".pricing-toggle__btn");
            if (!btn) return;
            container.querySelectorAll(".pricing-toggle__btn").forEach((b) => b.classList.remove("--active"));
            btn.classList.add("--active");
            this._isYearly = btn.dataset.period === "yearly";
            this._reloadPrices();
        });
    }

    /* ── Grid ────────────────────────────────── */

    _renderGrid() {
        const container = document.getElementById("pricingGrid");
        if (!container) return;
        container.innerHTML = this._tiers.map((t) => this._cardHTML(t)).join("");
    }

    _cardHTML(tier) {
        const isFree = tier.price === 0;
        const isFeatured = tier.highlighted;
        const price = this._isYearly ? tier.priceYearly : tier.price;
        const period = this._isYearly ? "tahun" : tier.period;
        const showOriginal = this._isYearly && tier.priceYearly < tier.price * 12;

        return `
            <div class="pricing-card${isFeatured ? ' pricing-card--featured' : ''}">
                ${isFeatured ? '<div class="pricing-card__badge">Paling Laris</div>' : ''}
                <div class="pricing-card__header">
                    <h2 class="pricing-card__name">${tier.name}</h2>
                    <div class="pricing-card__price-row">
                        <span class="pricing-card__price${isFree ? '--free' : ''}">${isFree ? 'Gratis' : `Rp ${this._formatPrice(price)}`}</span>
                        ${tier.period ? `<span class="pricing-card__period">/ ${period}</span>` : ''}
                        ${showOriginal ? `<span class="pricing-card__price-original">Rp ${this._formatPrice(tier.price * 12)}</span>` : ''}
                    </div>
                    <p class="pricing-card__desc">${tier.description}</p>
                </div>
                <div class="pricing-card__features">
                    ${tier.features.map((f) => `
                        <div class="pricing-card__feature${f.toLowerCase().includes('iklan') && !f.toLowerCase().includes('bebas') ? ' pricing-card__feature--muted' : ''}">
                            <i data-feather="${f.toLowerCase().includes('iklan') && !f.toLowerCase().includes('bebas') ? 'x-circle' : 'check-circle'}"></i>
                            <span>${f}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="pricing-card__action">
                    ${isFree
                        ? `<a href="/frontend/pages/main/register.html" class="btn btn-ghost">Daftar Gratis</a>`
                        : `<a href="/frontend/pages/user/payment.html?tier=${tier.id}" class="btn btn-primary">
                            <i data-feather="shopping-cart"></i> Berlangganan
                        </a>`
                    }
                </div>
            </div>
        `;
    }

    /* ── Helpers ──────────────────────────────── */

    _reloadPrices() {
        const container = document.getElementById("pricingGrid");
        if (!container) return;
        container.innerHTML = this._tiers.map((t) => this._cardHTML(t)).join("");
        feather.replace();
    }

    _formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
}

export default PricingPage;