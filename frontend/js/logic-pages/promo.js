class PromoPage {
    constructor() {
        this._autoPlayTimer = null;
        this._currentSlide = 0;
        this._featured = [];
        this._all = [];
        this._init();
    }

    async     _init() {
        try {
            const res = await fetch("/data/promotions.json");
            const data = await res.json();
            this._all = data.promotions;
            this._featured = this._all.filter((p) => p.featured);
            this._render();
            this._bindActions();
        } catch (err) {
            console.warn("PromoPage: gagal load data", err);
        }
    }

    _isLoggedIn() {
        return !!localStorage.getItem("pilih-in-session");
    }

    _requireLogin() {
        if (!this._isLoggedIn()) {
            if (confirm("Anda harus login terlebih dahulu. Ingin login sekarang?")) {
                window.location.href = "/frontend/pages/main/login.html";
            }
            return false;
        }
        return true;
    }

    _bindActions() {
        document.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-trx]");
            if (!btn) return;
            e.preventDefault();
            if (this._requireLogin()) {
                window.location.href = btn.getAttribute("href");
            }
        });
    }

    _render() {
        this._renderCarousel();
        this._renderGrid();
        feather.replace();
    }

    /* ── Carousel ───────────────────────────── */

    _renderCarousel() {
        const container = document.getElementById("promoCarousel");
        if (!container || !this._featured.length) return;

        container.innerHTML = `
            <div class="promo-carousel__slides" id="promoSlides">
                ${this._featured.map((p, i) => this._slideHTML(p, i === 0)).join("")}
            </div>
            <div class="promo-carousel__dots" id="promoDots">
                ${this._featured.map((_, i) => `<button class="promo-carousel__dot${i === 0 ? ' --active' : ''}" data-index="${i}"></button>`).join("")}
            </div>
        `;

        this._bindCarousel();
        this._startAutoPlay();
    }

    _slideHTML(promo, isActive) {
        const isFree = promo.promoPrice === 0;

        return `
            <div class="promo-carousel__slide${isActive ? ' --active' : ''}" style="--slide-accent: ${promo.color};">
                <div class="promo-carousel__bg"></div>
                <div class="promo-carousel__content">
                    <div class="promo-carousel__badge">
                        <i data-feather="${promo.icon}" width="14" height="14"></i>
                        ${promo.badge}
                    </div>
                    <h2 class="promo-carousel__title">${promo.title}</h2>
                    <p class="promo-carousel__desc">${promo.description}</p>
                    <div class="promo-carousel__price-row">
                        ${isFree
                            ? '<span class="promo-carousel__price--free">Gratis</span>'
                            : `<span class="promo-carousel__price">Rp ${this._formatPrice(promo.promoPrice)}</span>`
                        }
                        ${promo.originalPrice ? `<span class="promo-carousel__price-original">Rp ${this._formatPrice(promo.originalPrice)}</span>` : ""}
                        <span class="promo-carousel__discount">-${promo.discount}%</span>
                    </div>
                    <div class="promo-carousel__actions">
                        <a href="/frontend/pages/user/payment.html?promo=${promo.id}" class="btn btn-primary" data-trx>
                            <i data-feather="shopping-cart"></i> Ambil Promo
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    _bindCarousel() {
        this._carouselEl = document.getElementById("promoCarousel");
        this._updateCarouselAccent(0);

        const dots = document.querySelectorAll("#promoDots .promo-carousel__dot");
        dots.forEach((dot) => {
            dot.addEventListener("click", () => {
                const idx = parseInt(dot.dataset.index);
                this._goToSlide(idx);
                this._resetAutoPlay();
            });
        });

        const carousel = document.getElementById("promoCarousel");
        carousel.addEventListener("mouseenter", () => this._stopAutoPlay());
        carousel.addEventListener("mouseleave", () => this._startAutoPlay());
    }

    _goToSlide(index) {
        const slides = document.querySelectorAll("#promoSlides .promo-carousel__slide");
        const dots = document.querySelectorAll("#promoDots .promo-carousel__dot");
        if (!slides.length) return;

        slides.forEach((s) => s.classList.remove("--active"));
        dots.forEach((d) => d.classList.remove("--active"));

        this._currentSlide = index;
        slides[index].classList.add("--active");
        dots[index].classList.add("--active");
        this._updateCarouselAccent(index);
    }

    _updateCarouselAccent(index) {
        const promo = this._featured[index];
        if (this._carouselEl && promo) {
            this._carouselEl.style.setProperty("--slide-accent", promo.color);
        }
    }

    _startAutoPlay() {
        this._stopAutoPlay();
        if (this._featured.length < 2) return;
        this._autoPlayTimer = setInterval(() => {
            const next = (this._currentSlide + 1) % this._featured.length;
            this._goToSlide(next);
        }, 5000);
    }

    _stopAutoPlay() {
        if (this._autoPlayTimer) {
            clearInterval(this._autoPlayTimer);
            this._autoPlayTimer = null;
        }
    }

    _resetAutoPlay() {
        this._stopAutoPlay();
        this._startAutoPlay();
    }

    /* ── Grid ────────────────────────────────── */

    _renderGrid() {
        const grid = document.getElementById("promoGrid");
        if (!grid) return;

        grid.innerHTML = this._all.map((p) => this._cardHTML(p)).join("");
    }

    _cardHTML(promo) {
        const isFree = promo.promoPrice === 0;

        return `
            <div class="promo-card" style="--card-accent: ${promo.color};">
                <div class="promo-card__badge">${promo.badge}</div>
                <div class="promo-card__icon-wrap">
                    <div class="promo-card__icon">
                        <i data-feather="${promo.icon}"></i>
                    </div>
                </div>
                <h3 class="promo-card__title">${promo.title}</h3>
                <p class="promo-card__subtitle">${promo.subtitle}</p>
                <p class="promo-card__description">${promo.description}</p>
                <div class="promo-card__price-row">
                    ${isFree
                        ? '<span class="promo-card__price--free">Gratis</span>'
                        : `<span class="promo-card__price">Rp ${this._formatPrice(promo.promoPrice)}</span>`
                    }
                    ${promo.originalPrice ? `<span class="promo-card__price-original">Rp ${this._formatPrice(promo.originalPrice)}</span>` : ""}
                    <span class="promo-card__discount">-${promo.discount}%</span>
                </div>
                <div class="promo-card__actions">
                    <a href="/frontend/pages/user/payment.html?promo=${promo.id}" class="btn btn-primary" data-trx>
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
