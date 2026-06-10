class PromoPage {
    constructor() {
        this._init();
    }

    async _init() {
        try {
            const res = await fetch("/data/promotions.json");
            const data = await res.json();
            this._renderPromos(data.promotions);
        } catch (err) {
            console.warn("PromoPage: gagal load data", err);
        }
    }

    _renderPromos(promos) {
        const grid = document.getElementById("promoGrid");
        if (!grid) return;

        grid.innerHTML = promos.map((p) => this._cardHTML(p)).join("");
        feather.replace();
    }

    _cardHTML(promo) {
        const isFree = promo.promoPrice === 0;
        const bgColor = promo.color || "var(--accent-primary)";

        return `
            <div class="promo-card">
                <div class="promo-card__badge" style="background: ${bgColor}; color: var(--bg-primary);">
                    ${promo.badge}
                </div>
                <div class="promo-card__icon" style="background: ${bgColor}1a; color: ${bgColor};">
                    <i data-feather="${promo.icon}"></i>
                </div>
                <h2 class="promo-card__title">${promo.title}</h2>
                <p class="promo-card__subtitle">${promo.subtitle}</p>
                <p class="promo-card__description">${promo.description}</p>
                <div class="promo-card__price-row">
                    ${isFree
                        ? '<span class="promo-card__price--free">Gratis</span>'
                        : `<span class="promo-card__price">Rp ${this._formatPrice(promo.promoPrice)}</span>`
                    }
                    ${promo.originalPrice ? `<span class="promo-card__price-original">Rp ${this._formatPrice(promo.originalPrice)}</span>` : ""}
                    <span class="promo-card__discount" style="background: ${bgColor}; color: var(--bg-primary);">
                        ${promo.discount}%
                    </span>
                </div>
                <div class="promo-card__action">
                    <a href="/frontend/pages/main/register.html" class="btn btn-primary">
                        <i data-feather="shopping-cart"></i> Ambil Promo
                    </a>
                    <a href="/frontend/pages/main/pricing.html" class="btn btn-ghost">
                        Lihat Paket
                    </a>
                </div>
            </div>
        `;
    }

    _formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
}

export default PromoPage;
