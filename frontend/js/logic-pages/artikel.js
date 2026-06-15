import { DOM } from "../utils/dom.js";
import { getDbReady } from "../../../backend/init.js";

class ArtikelPage {
    constructor() {
        this._items = [];
        this._filter = "all";
        this._init();
    }

    async _init() {
        try {
            await getDbReady();
            this._loadItems();
            this._bindFilters();
            this._render();
            this._bindCardClicks();
        } catch (err) {
            console.warn("ArtikelPage: retrying...", err);
            setTimeout(() => this._init(), 500);
        }
    }

    _getDb() {
        const raw = localStorage.getItem("pilih-in-db");
        return raw ? JSON.parse(raw) : null;
    }

    _loadItems() {
        const db = this._getDb();
        if (!db) throw new Error("Database not ready");

        const articles = (db.articles || [])
            .filter((a) => a.status === "published")
            .map((a) => ({
                ...a,
                _type: "artikel",
                publishedDate: a.createdAt,
                thumbnail: a.coverImage,
            }));

        const news = (db.news || [])
            .filter((n) => n.status === "published")
            .map((n) => ({
                ...n,
                _type: "berita",
                publishedDate: n.publishedAt || n.createdAt,
                thumbnail: n.coverImage,
            }));

        this._items = [...articles, ...news].sort(
            (a, b) => new Date(b.publishedDate) - new Date(a.publishedDate)
        );
    }

    _filteredItems() {
        if (this._filter === "all") return this._items;
        return this._items.filter((item) => item._type === this._filter);
    }

    _cardHTML(item) {
        const date = new Date(item.publishedDate);
        const dateStr = date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
        const views = (item.views || 0).toLocaleString("id-ID");
        const href = `/frontend/pages/main/artikel-detail.html?id=${item.slug || item.id}`;
        const isArtikel = item._type === "artikel";

        return `
            <div class="artikel-card" data-href="${href}">
                <div class="artikel-card__image">
                    <img src="${item.thumbnail || "https://picsum.photos/seed/${item.id}/800/400"}" alt="${item.title}" loading="lazy" onerror="this.src='https://picsum.photos/seed/${item.id}/800/400'" />
                    <span class="artikel-card__badge artikel-card__badge--${item._type}">${isArtikel ? "Artikel" : "Berita"}</span>
                </div>
                <div class="artikel-card__body">
                    <div class="artikel-card__category">${item.category || (isArtikel ? "Artikel" : "Berita")}</div>
                    <h3 class="artikel-card__title">${item.title}</h3>
                    <p class="artikel-card__excerpt">${item.excerpt || item.content || ""}</p>
                    <div class="artikel-card__meta">
                        <i data-feather="calendar" style="width:12px;height:12px"></i>
                        <span>${dateStr}</span>
                        <span>&middot;</span>
                        <i data-feather="eye" style="width:12px;height:12px"></i>
                        <span>${views}</span>
                    </div>
                </div>
            </div>
        `;
    }

    _render() {
        const grid = DOM.$("#artikelGrid");
        if (!grid) return;

        const filtered = this._filteredItems();

        if (!filtered.length) {
            const label = this._filter === "artikel" ? "artikel" : "berita";
            grid.innerHTML = `
                <div class="artikel-empty">
                    <i data-feather="file-text"></i>
                    <h3>Tidak ada ${label}</h3>
                    <p>Belum ada ${label} yang tersedia saat ini.</p>
                </div>
            `;
            feather.replace();
            return;
        }

        grid.innerHTML = filtered.map((item) => this._cardHTML(item)).join("");
        feather.replace();
    }

    _bindFilters() {
        const container = DOM.$("#filterBtns");
        if (!container) return;

        container.addEventListener("click", (e) => {
            const btn = e.target.closest(".artikel-filter-btn");
            if (!btn) return;
            const filter = btn.dataset.filter;
            if (filter === this._filter) return;

            container.querySelectorAll(".artikel-filter-btn").forEach((b) => b.classList.remove("artikel-filter-btn--active"));
            btn.classList.add("artikel-filter-btn--active");
            this._filter = filter;
            this._render();
        });
    }

    _bindCardClicks() {
        document.addEventListener("click", (e) => {
            const card = e.target.closest(".artikel-card[data-href]");
            if (!card) return;
            window.location.href = card.dataset.href;
        });
    }
}

export default ArtikelPage;
