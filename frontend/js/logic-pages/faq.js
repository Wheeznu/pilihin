import { DOM } from "../utils/dom.js";

class FaqPage {
    constructor() {
        this._faqs = [];
        this._activeCategory = "all";
        this._searchQuery = "";
        this._init();
    }

    async _init() {
        try {
            await this._loadFaqs();
            if (!this._cacheElements()) return;
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
            this._faqs = db.faqs;
            return;
        }
        const res = await fetch("/data/faq.json");
        const data = await res.json();
        this._faqs = data.faqs || [];
    }

    _cacheElements() {
        this._container = DOM.$("#faqList");
        this._searchInput = DOM.$("#faqSearch");
        this._categoriesEl = DOM.$("#faqCategories");
        return this._container && this._categoriesEl;
    }

    _bindEvents() {
        if (this._searchInput) {
            this._searchInput.addEventListener("input", (e) => {
                this._searchQuery = e.target.value.toLowerCase();
                this._render();
            });
        }

        this._categoriesEl.addEventListener("click", (e) => {
            const btn = e.target.closest(".faq-category-btn");
            if (!btn) return;
            const cat = btn.dataset.category;
            if (cat === this._activeCategory) return;
            this._activeCategory = cat;
            this._render();
        });

        this._container.addEventListener("click", (e) => {
            const btn = e.target.closest(".faq-item__question");
            if (!btn) return;
            const item = btn.closest(".faq-item");
            if (!item) return;
            const isOpen = item.classList.contains("faq-item--open");

            DOM.$$(".faq-item--open", this._container).forEach((el) => {
                if (el !== item) el.classList.remove("faq-item--open");
            });

            item.classList.toggle("faq-item--open");
        });
    }

    _getCategories() {
        const cats = [...new Set(this._faqs.map((f) => f.category))];
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
        return this._faqs.filter((f) => {
            const matchCategory =
                this._activeCategory === "all" || f.category === this._activeCategory;
            const matchSearch =
                !this._searchQuery ||
                f.question.toLowerCase().includes(this._searchQuery) ||
                f.answer.toLowerCase().includes(this._searchQuery);
            return matchCategory && matchSearch;
        });
    }

    _render() {
        this._renderCategories();
        this._renderList();
    }

    _renderCategories() {
        const categories = this._getCategories();

        this._categoriesEl.innerHTML = categories
            .map(
                (cat) => `
                <button class="faq-category-btn${cat === this._activeCategory ? " faq-category-btn--active" : ""}" data-category="${cat}">
                    ${this._getCategoryLabel(cat)}
                </button>
            `
            )
            .join("");
    }

    _renderList() {
        const filtered = this._getFiltered();

        if (!filtered.length) {
            this._container.innerHTML = `
                <div class="faq-empty">
                    <i data-feather="search"></i>
                    <p>Tidak ditemukan hasil untuk pencarian Anda</p>
                </div>
            `;
            feather.replace();
            return;
        }

        this._container.innerHTML = filtered
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
    }
}

export default FaqPage;
