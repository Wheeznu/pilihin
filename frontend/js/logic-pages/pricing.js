class PricingPage {
    constructor() {
        this._init();
    }

    async _init() {
        try {
            const res = await fetch("/data/pricing-tiers.json");
            const data = await res.json();
            this._renderTiers(data.tiers);
        } catch (err) {
            console.warn("PricingPage: gagal load data", err);
        }
    }

    _renderTiers(tiers) {
        const container = document.getElementById("pricingList");
        if (!container) return;

        container.innerHTML = tiers.map((tier) => this._tierHTML(tier)).join("");
        feather.replace();

        const hash = window.location.hash;
        if (hash) {
            const target = document.getElementById(hash.slice(1));
            if (target) {
                setTimeout(() => target.scrollIntoView({ behavior: "smooth" }), 100);
            }
        }
    }

    _tierHTML(tier) {
        const isFeatured = tier.highlighted;
        const isFree = tier.price === 0;

        return `
            <section class="pricing-tier ${isFeatured ? "pricing-tier--featured" : ""}" id="${tier.id}">
                ${isFeatured ? '<div class="pricing-tier__badge">Paling Laris</div>' : ""}
                <div class="pricing-tier__header">
                    <h2 class="pricing-tier__name">${tier.name}</h2>
                    <div class="pricing-tier__price-row">
                        ${isFree ? '<span class="pricing-tier__price">Gratis</span>' : `<span class="pricing-tier__price">Rp ${this._formatPrice(tier.price)}</span>`}
                        ${tier.originalPrice ? `<span class="pricing-tier__price-original">Rp ${this._formatPrice(tier.originalPrice)}</span>` : ""}
                        ${tier.period ? `<span class="pricing-tier__period">/ ${tier.period}</span>` : ""}
                    </div>
                    <p class="pricing-tier__description">${tier.description}</p>
                </div>
                <div class="pricing-tier__features">
                    ${tier.features.map(f => `
                        <div class="pricing-tier__feature">
                            <i data-feather="check-circle"></i>
                            <span>${f}</span>
                        </div>
                    `).join("")}
                </div>
                <div class="pricing-tier__action">
                    ${isFree
                        ? `<div class="pricing-tier__current-badge"><i data-feather="check"></i> Paket Anda Saat Ini</div>`
                        : `<a href="/frontend/pages/main/register.html" class="btn btn-primary btn-lg">
                            <i data-feather="shopping-cart"></i> Langganan ${tier.name}
                        </a>`
                    }
                </div>
            </section>
        `;
    }

    _formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
}

export default PricingPage;
