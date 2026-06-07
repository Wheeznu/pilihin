class FaqPage {
    constructor() {
        this.faqs = [];
        this.activeCategory = "all";
        this.searchQuery = "";
        this._init();
    }

    async _init() {
        try {
            await this._loadFaqs();
            this._cacheElements();
            if (!this.container) return;
            this._bindEvents();
            this._render();
        } catch (err) {
            console.warn("FaqPage: data belum siap, retrying...", err);
            setTimeout(() => this._init(), 500);
        }
    }

    async _loadFaqs() {
        const db = JSON.parse(localStorage.getItem("pilih-in-db"));
        if (db?.faqs?.length) {
            this.faqs = db.faqs;
            return;
        }
        const res = await fetch("/data/faq.json");
        const data = await res.json();
        this.faqs = data.faqs || [];
    }

    _cacheElements() {
        this.container = document.getElementById("faqList");
        this.searchInput = document.getElementById("faqSearch");
        this.categoriesEl = document.getElementById("faqCategories");
    }

    _bindEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener("input", (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this._render();
            });
        }
    }

    _getCategories() {
        const cats = [...new Set(this.faqs.map((f) => f.category))];
        return ["all", ...cats];
    }

    _getCategoryLabel(cat) {
        const labels = {
            all: "Semua",
            umum: "Umum",
            akun: "Akun",
            langganan: "Langganan",
            teknis: "Teknis",
        };
        return labels[cat] || cat;
    }

    _getFiltered() {
        return this.faqs.filter((f) => {
            const matchCategory =
                this.activeCategory === "all" || f.category === this.activeCategory;
            const matchSearch =
                !this.searchQuery ||
                f.question.toLowerCase().includes(this.searchQuery) ||
                f.answer.toLowerCase().includes(this.searchQuery);
            return matchCategory && matchSearch;
        });
    }

    _render() {
        this._renderCategories();
        this._renderList();
    }

    _renderCategories() {
        if (!this.categoriesEl) return;
        const categories = this._getCategories();

        this.categoriesEl.innerHTML = categories
            .map(
                (cat) => `
                <button class="faq-category-btn${cat === this.activeCategory ? " faq-category-btn--active" : ""}" data-category="${cat}">
                    ${this._getCategoryLabel(cat)}
                </button>
            `
            )
            .join("");

        this.categoriesEl.querySelectorAll(".faq-category-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                this.activeCategory = btn.dataset.category;
                this._render();
            });
        });
    }

    _renderList() {
        if (!this.container) return;
        const filtered = this._getFiltered();

        if (filtered.length === 0) {
            this.container.innerHTML = `
                <div class="faq-empty">
                    <i data-feather="search"></i>
                    <p>Tidak ditemukan hasil untuk pencarian Anda</p>
                </div>
            `;
            feather.replace();
            return;
        }

        this.container.innerHTML = filtered
            .map(
                (faq) => `
                <div class="faq-item" data-faq-id="${faq.id}">
                    <button class="faq-item__question">
                        <span>${faq.question}</span>
                        <i data-feather="chevron-down"></i>
                    </button>
                    <div class="faq-item__answer">
                        <div class="faq-item__answer-inner">${faq.answer}</div>
                    </div>
                </div>
            `
            )
            .join("");

        feather.replace();
        this._bindAccordion();
    }

    _bindAccordion() {
        this.container.querySelectorAll(".faq-item__question").forEach((btn) => {
            btn.addEventListener("click", () => {
                const item = btn.closest(".faq-item");
                const isOpen = item.classList.contains("faq-item--open");

                this.container.querySelectorAll(".faq-item--open").forEach((el) => {
                    if (el !== item) el.classList.remove("faq-item--open");
                });

                item.classList.toggle("faq-item--open");
            });
        });
    }
}

export default FaqPage;
