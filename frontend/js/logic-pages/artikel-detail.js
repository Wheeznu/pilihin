import { DOM } from "../utils/dom.js";

class ArtikelDetail {
    constructor() {
        this._item = null;
        this._init();
    }

    async _init() {
        try {
            this._item = this._findItem();
            if (!this._item) {
                this._renderError();
                return;
            }
            this._render();
            feather.replace();
        } catch (err) {
            console.warn("ArtikelDetail: retrying...", err);
            setTimeout(() => this._init(), 500);
        }
    }

    _getQueryId() {
        const params = new URLSearchParams(window.location.search);
        return (params.get("id") || "").trim();
    }

    _getDb() {
        const raw = localStorage.getItem("pilih-in-db");
        return raw ? JSON.parse(raw) : null;
    }

    _findItem() {
        const id = this._getQueryId();
        if (!id) return null;

        const db = this._getDb();
        if (!db) return null;

        const article = (db.articles || []).find(
            (a) => a.slug === id || a.id === id
        );
        if (article) {
            return { ...article, _type: "artikel" };
        }

        const newsItem = (db.news || []).find(
            (n) => n.slug === id || n.id === id
        );
        if (newsItem) {
            return { ...newsItem, _type: "berita" };
        }

        return null;
    }

    _render() {
        const item = this._item;
        const container = DOM.$("#artikelDetailPage");
        if (!container) return;

        const date = new Date(item.publishedDate || item.createdAt || item.publishedAt);
        const dateStr = date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
        const views = (item.views || 0).toLocaleString("id-ID");
        const isArtikel = item._type === "artikel";
        const fallbackImg = `https://picsum.photos/seed/${item.id}/800/400`;

        container.innerHTML = `
            <a href="/frontend/pages/main/artikel.html" class="artikel-detail__back">
                <i data-feather="arrow-left"></i> Kembali
            </a>

            <article>
                <div class="artikel-detail__header">
                    <span class="artikel-detail__badge artikel-detail__badge--${item._type}">${isArtikel ? "Artikel" : "Berita"}</span>
                    <div class="artikel-detail__category">${item.category || (isArtikel ? "Artikel" : "Berita")}</div>
                    <h1 class="artikel-detail__title">${item.title}</h1>
                    <div class="artikel-detail__meta">
                        <span class="artikel-detail__meta-item">
                            <i data-feather="calendar"></i>
                            <span>${dateStr}</span>
                        </span>
                        <span class="artikel-detail__meta-dot"></span>
                        <span class="artikel-detail__meta-item">
                            <i data-feather="eye"></i>
                            <span>${views} dilihat</span>
                        </span>
                    </div>
                </div>

                <img src="${item.coverImage || item.thumbnail || fallbackImg}" alt="${item.title}" class="artikel-detail__cover" onerror="this.src='${fallbackImg}'" />

                <div class="artikel-detail__content">
                    ${item.content ? `<p>${item.content}</p>` : "<p>Tidak ada konten.</p>"}
                </div>

                ${item.tags?.length ? `
                    <div class="artikel-detail__tags">
                        ${item.tags.map((tag) => `<span class="artikel-detail__tag">${tag}</span>`).join("")}
                    </div>
                ` : ""}
            </article>
        `;
    }

    _renderError() {
        const container = DOM.$("#artikelDetailPage");
        if (!container) return;
        container.innerHTML = `
            <div class="artikel-detail__error">
                <i data-feather="file-text"></i>
                <h2>Artikel tidak ditemukan</h2>
                <p>Artikel yang Anda cari tidak tersedia atau telah dihapus.</p>
                <a href="/frontend/pages/main/artikel.html" class="btn btn-primary" style="margin-top:var(--space-lg)">
                    <i data-feather="arrow-left"></i> Kembali ke Artikel
                </a>
            </div>
        `;
        feather.replace();
    }
}

export default ArtikelDetail;
