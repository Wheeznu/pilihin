import { repositories, getDbReady, dbManager, apiRequest } from "../../../backend/init.js";
import { DOM } from "../utils/dom.js";
import authService from "../../../backend/services/AuthService.js";

const FILM_CACHE = {};

function showToast(msg, type) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const t = document.createElement("div");
  t.className = "toast" + (type === "error" ? " error" : "");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function _getFilmTitle(filmId) {
    if (FILM_CACHE[filmId]) return FILM_CACHE[filmId];
    const film = repositories.films.findById(filmId);
    FILM_CACHE[filmId] = film?.title || "Film tidak dikenal";
    return FILM_CACHE[filmId];
}

function _getUserDisplay(userId) {
    const users = dbManager.getCollection("users");
    const user = users.find((u) => u.id === userId);
    return user ? { username: user.username, photo: user.profilePhoto } : { username: "Pengguna tidak dikenal", photo: null };
}

function _getInitials(name) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function _seedSampleReviews() {
    const existing = dbManager.getCollection("reviews");
    if (existing.length > 0) return;

    const films = repositories.films.findPublished();
    if (films.length === 0) return;

    const sampleReviews = [
        { filmIdx: 0, rating: 9, title: "Film aksi terbaik tahun ini!", content: "Sinematografi luar biasa dan alur cerita yang menegangkan dari awal sampai akhir. Sangat direkomendasikan!" },
        { filmIdx: 1, rating: 10, title: "Kisah cinta yang mengharukan", content: "Akting para pemain sangat natural, soundtracknya indah. Bikin nangis sepanjang film." },
        { filmIdx: 2, rating: 7, title: "Cukup seru", content: "Efek spesialnya bagus, tapi ceritanya agak klise. Masih lumayan untuk ditonton." },
        { filmIdx: 3, rating: 5, title: "Biasa saja", content: "Ekspektasi saya tinggi tapi ternyata filmnya biasa saja. Alurnya lambat di beberapa bagian." },
        { filmIdx: 0, rating: 8, title: "Mantap!", content: "Salah satu film terbaik yang pernah saya tonton tahun ini. Action scene-nya keren banget!" },
        { filmIdx: 4, rating: 9, title: "Inspiratif banget", content: "Film yang memotivasi dan menyentuh hati. Cocok ditonton bareng keluarga." },
        { filmIdx: 1, rating: 4, title: "Kurang greget", content: "Menurut saya film ini terlalu panjang dan membosankan di pertengahan. Sayang sekali." },
        { filmIdx: 5, rating: 6, title: "Agak membingungkan", content: "Plot twist-nya terlalu dipaksakan. Tapi akting pemain utamanya bagus." },
        { filmIdx: 2, rating: 8, title: "Seru abis!", content: "Action scene-nya epic! Cocok buat penggemar film laga Indonesia." },
        { filmIdx: 6, rating: 10, title: "Animasi keren", content: "Anak-anak saya suka banget. Animasi halus dan ceritanya mendidik." },
        { filmIdx: 7, rating: 7, title: "Lucu", content: "Film komedi ringan yang pas buat hilangin stress. Chemistry para pemain bagus." },
        { filmIdx: 3, rating: 9, title: "Jurnalisme investigasi yang menegangkan", content: "Film ini berhasil menggambarkan realita jurnalisme di Indonesia dengan sangat baik." },
    ];

    const users = dbManager.getCollection("users");
    const reviewers = users.filter((u) => u.role === "user");
    if (reviewers.length === 0) return;

    const statuses = ["pending", "pending", "pending", "pending", "approved", "approved", "rejected", "pending", "approved", "pending", "approved", "rejected"];

    const reviews = sampleReviews.map((r, i) => {
        const reviewer = reviewers[i % reviewers.length];
        const film = films[r.filmIdx];
        return {
            id: `review-${String(i + 1).padStart(3, "0")}`,
            filmId: film.id,
            userId: reviewer.id,
            rating: r.rating,
            title: r.title,
            content: r.content,
            helpful: Math.floor(Math.random() * 50),
            status: statuses[i % statuses.length],
            createdAt: new Date(Date.now() - (sampleReviews.length - i) * 86400000).toISOString(),
            updatedAt: new Date().toISOString(),
        };
    });

    dbManager.saveCollection("reviews", reviews);
}

const CONTENT_TYPES = [
    { id: "film", label: "Film", icon: "film", dbKey: "films" },
    { id: "aktor", label: "Aktor", icon: "users", dbKey: "actors" },
    { id: "sutradara", label: "Sutradara", icon: "user", dbKey: "directors" },
    { id: "artikel", label: "Artikel", icon: "file-text", dbKey: "articles" },
];

class ManagerApprovalsPage {
    constructor() {
        this.currentType = "film";
        this._init();
    }

    async _init() {
        if (!authService.requireRole("manager", "/frontend/pages/main/login.html")) return;

        await getDbReady();
        _seedSampleReviews();

        this._render();
        this._bindEvents();
    }

    _getPendingContent(type) {
        const cfg = CONTENT_TYPES.find((c) => c.id === type);
        if (!cfg) return [];

        const dbItems = dbManager.getCollection(cfg.dbKey).filter((i) => i.status === "pending");

        if (type === "artikel") {
            const news = dbManager.getCollection("news").filter((i) => i.status === "pending").map((n) => ({ ...n, _subtype: "berita" }));
            const articles = dbItems.map((a) => ({ ...a, _subtype: "artikel" }));
            return [...articles, ...news].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }

        return dbItems;
    }

    _getContentStats() {
        const stats = {};
        for (const cfg of CONTENT_TYPES) {
            stats[cfg.id] = this._getPendingContent(cfg.id).length;
        }
        return stats;
    }

    _getReviews() {
        return dbManager.getCollection("reviews");
    }

    _saveReviews(reviews) {
        dbManager.saveCollection("reviews", reviews);
    }

    _getFilteredReviews() {
        return this._getReviews().filter((r) => r.status === "pending");
    }

    // --- Render ---

    _render() {
        const container = DOM.$("#managerApprovalsPage");
        if (!container) return;

        const contentStats = this._getContentStats();
        let totalPending = 0;
        for (const cfg of CONTENT_TYPES) totalPending += contentStats[cfg.id];

        container.innerHTML = `
            <div class="approvals-header">
                <div>
                    <h1 class="approvals-header__title">
                        <i data-feather="check-circle"></i> Persetujuan Konten
                    </h1>
                    <p class="approvals-header__subtitle">Setujui atau tolak konten yang diajukan oleh admin</p>
                </div>
            </div>

            <div class="approvals-stats">
                <div class="approvals-stat approvals-stat--pending">
                    <div class="approvals-stat__value">${totalPending}</div>
                    <div class="approvals-stat__label">Konten Menunggu</div>
                </div>
            </div>

            <div class="approvals-content-tabs">
                ${this._renderTypeTabs()}
            </div>

            ${this.currentType === "ulasan" ? this._renderReviewsSection() : this._renderContentSection()}
        `;

        feather.replace();
    }

    _renderTypeTabs() {
        const tabHtml = CONTENT_TYPES.map((cfg) => `
            <button class="approvals-tab ${this.currentType === cfg.id ? "approvals-tab--active" : ""}" data-type="${cfg.id}">
                <i data-feather="${cfg.icon}"></i> ${cfg.label}
            </button>
        `).join("");

        return tabHtml + `
            <button class="approvals-tab ${this.currentType === "ulasan" ? "approvals-tab--active" : ""}" data-type="ulasan">
                <i data-feather="message-square"></i> Ulasan
            </button>
        `;
    }

    _renderContentSection() {
        const items = this._getPendingContent(this.currentType);
        const cfg = CONTENT_TYPES.find((c) => c.id === this.currentType);

        if (items.length === 0) {
            return `
                <div class="approvals-empty">
                    <i data-feather="inbox"></i>
                    <div class="approvals-empty__title">Tidak ada ${cfg.label.toLowerCase()} menunggu persetujuan</div>
                    <div class="approvals-empty__desc">Konten baru akan muncul di sini setelah admin mengajukan perubahan.</div>
                </div>
            `;
        }

        return `
            <table class="approvals-table">
                <thead>
                    <tr>${this._contentTableHeaders()}</tr>
                </thead>
                <tbody>
                    ${items.map((item) => this._contentRow(item)).join("")}
                </tbody>
            </table>
        `;
    }

    _contentTableHeaders() {
        switch (this.currentType) {
            case "film":
                return "<th>Poster</th><th>Judul Film</th><th>Rating</th><th>Rilis</th><th>Diajukan</th><th>Aksi</th>";
            case "aktor":
                return "<th>Foto</th><th>Nama Aktor</th><th>Tgl Lahir</th><th>Film</th><th>Diajukan</th><th>Aksi</th>";
            case "sutradara":
                return "<th>Foto</th><th>Nama Sutradara</th><th>Tgl Lahir</th><th>Film</th><th>Diajukan</th><th>Aksi</th>";
            case "artikel":
                return "<th>Thumbnail</th><th>Judul</th><th>Tipe</th><th>Kategori</th><th>Diajukan</th><th>Aksi</th>";
            default:
                return "<th>Judul</th><th>Diajukan</th><th>Aksi</th>";
        }
    }

    _contentRow(item) {
        const id = item.id;
        const ts = item.updatedAt || item.createdAt || "";
        const dateStr = ts ? new Date(ts).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—";

        const base = `
            <td>
                <span class="approvals-status" style="font-size:var(--font-xs);color:var(--text-muted)">${dateStr}</span>
            </td>
            <td>
                <div class="approvals-actions">
                    <button class="btn btn-primary btn-sm" data-action="approve-content" data-id="${id}">
                        <i data-feather="check"></i> Setujui
                    </button>
                    <button class="btn btn-danger btn-sm" data-action="reject-content" data-id="${id}">
                        <i data-feather="x"></i> Tolak
                    </button>
                </div>
            </td>
        `;

        switch (this.currentType) {
            case "film":
                return `
                    <tr data-content-id="${id}">
                        <td>
                            <div class="approvals-film">
                                <img class="approvals-film__poster" src="${item.poster || `https://picsum.photos/seed/${id}/80/112`}" alt="${item.title}" onerror="this.style.display='none'" />
                                <div>
                                    <div class="approvals-film__title">${item.title || "—"}</div>
                                    <div class="approvals-film__meta">ID: ${id}</div>
                                </div>
                            </div>
                        </td>
                        <td class="approvals-film__title">${item.title || "—"}</td>
                        <td><div class="approvals-rating"><i data-feather="star"></i> ${(item.averageRating || item.rating || 0)}/10</div></td>
                        <td>${item.releaseDate ? new Date(item.releaseDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                        ${base}
                    </tr>
                `;
            case "aktor":
                return `
                    <tr data-content-id="${id}">
                        <td>
                            <div class="approvals-user">
                                <img class="approvals-user__avatar" src="${item.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || "A")}&background=1db954&color=000&size=64`}" alt="${item.name}" onerror="this.style.display='none'" />
                            </div>
                        </td>
                        <td><span class="approvals-film__title">${item.name || "—"}</span></td>
                        <td>${item.birthDate ? new Date(item.birthDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                        <td><span class="films-count">${item.films?.length || 0} film</span></td>
                        ${base}
                    </tr>
                `;
            case "sutradara":
                return `
                    <tr data-content-id="${id}">
                        <td>
                            <div class="approvals-user">
                                <img class="approvals-user__avatar" src="${item.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || "S")}&background=1db954&color=000&size=64`}" alt="${item.name}" onerror="this.style.display='none'" />
                            </div>
                        </td>
                        <td><span class="approvals-film__title">${item.name || "—"}</span></td>
                        <td>${item.birthDate ? new Date(item.birthDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                        <td><span class="films-count">${item.films?.length || 0} film</span></td>
                        ${base}
                    </tr>
                `;
            case "artikel":
                return `
                    <tr data-content-id="${id}">
                        <td>
                            <div class="approvals-film">
                                <img class="approvals-film__poster" src="${item.coverImage || `https://picsum.photos/seed/${id}/80/112`}" alt="${item.title}" onerror="this.style.display='none'" />
                            </div>
                        </td>
                        <td>
                            <div class="approvals-film__title">${item.title || "—"}</div>
                            <div class="approvals-film__meta">${item.slug || id}</div>
                        </td>
                        <td><span class="approvals-status approvals-status--pending" style="background:rgba(29,185,84,0.12);color:var(--accent-primary);padding:2px 8px">${item._subtype === "berita" ? "Berita" : "Artikel"}</span></td>
                        <td>${item.category || "—"}</td>
                        ${base}
                    </tr>
                `;
            default:
                return `
                    <tr data-content-id="${id}">
                        <td>${item.title || item.name || id}</td>
                        ${base}
                    </tr>
                `;
        }
    }

    _renderReviewsSection() {
        return this._renderReviewTable();
    }

    _renderReviewTable() {
        const reviews = this._getFilteredReviews();

        if (reviews.length === 0) {
            return `
                <div class="approvals-empty">
                    <i data-feather="inbox"></i>
                    <div class="approvals-empty__title">Tidak ada ulasan yang menunggu persetujuan</div>
                    <div class="approvals-empty__desc">Ulasan akan muncul di sini setelah pengguna memberikan rating.</div>
                </div>
            `;
        }

        return `
            <table class="approvals-table">
                <thead>
                    <tr>
                        <th>Film</th>
                        <th>Pengguna</th>
                        <th>Rating</th>
                        <th>Ulasan</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${reviews.map((r) => this._reviewRow(r)).join("")}
                </tbody>
            </table>
        `;
    }

    _reviewRow(review) {
        const filmTitle = _getFilmTitle(review.filmId);
        const user = _getUserDisplay(review.userId);

        return `
            <tr data-review-id="${review.id}">
                <td>
                    <div class="approvals-film">
                        <img class="approvals-film__poster" src="https://picsum.photos/seed/${review.id}/80/112" alt="${filmTitle}" onerror="this.style.display='none'" />
                        <div>
                            <div class="approvals-film__title">${filmTitle}</div>
                            <div class="approvals-film__meta">ID: ${review.filmId}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="approvals-user">
                        <img class="approvals-user__avatar" src="${user.photo || ""}" alt="${user.username}" onerror="this.style.display='none'" />
                        <span class="approvals-user__name">${user.username}</span>
                    </div>
                </td>
                <td>
                    <div class="approvals-rating">
                        <i data-feather="star"></i>
                        ${review.rating}/10
                    </div>
                </td>
                <td>
                    <div class="approvals-review">
                        <div class="approvals-review__title">${review.title || "(tanpa judul)"}</div>
                        <div class="approvals-review__content">${review.content || ""}</div>
                    </div>
                </td>
                <td>
                    <div class="approvals-actions">
                        <button class="btn btn-primary btn-sm" data-action="approve-review" data-id="${review.id}">
                            <i data-feather="check"></i> Setujui
                        </button>
                        <button class="btn btn-danger btn-sm" data-action="reject-review" data-id="${review.id}">
                            <i data-feather="x"></i> Tolak
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // --- Actions ---

    _approveContent(id) {
        const cfg = CONTENT_TYPES.find((c) => c.id === this.currentType);
        if (!cfg) return;

        let items, item, collection;

        if (cfg.id === "artikel") {
            items = dbManager.getCollection("articles");
            item = items.find((i) => i.id === id);
            if (!item) {
                items = dbManager.getCollection("news");
                item = items.find((i) => i.id === id);
            }
            if (!item) return;
            collection = items === dbManager.getCollection("news") ? "news" : "articles";
            const idx = items.findIndex((i) => i.id === id);
            items[idx] = { ...item, status: "published", updatedAt: new Date().toISOString() };
            dbManager.saveCollection(collection, items);
            apiRequest("PUT", "/api/content/" + collection + "/" + id, { status: "published" });
            showToast("Konten berhasil disetujui", "success");
            this._render();
            return;
        }

        items = dbManager.getCollection(cfg.dbKey);
        item = items.find((i) => i.id === id);
        if (!item) return;

        const idx = items.findIndex((i) => i.id === id);
        items[idx] = { ...item, status: "published", updatedAt: new Date().toISOString() };
        dbManager.saveCollection(cfg.dbKey, items);
        apiRequest("PUT", "/api/content/" + cfg.dbKey + "/" + id, { status: "published" });
        showToast("Konten berhasil disetujui", "success");
        this._render();
    }

    _rejectContent(id) {
        const cfg = CONTENT_TYPES.find((c) => c.id === this.currentType);
        if (!cfg) return;

        if (cfg.id === "artikel") {
            dbManager.saveCollection("articles", dbManager.getCollection("articles").filter((i) => i.id !== id));
            dbManager.saveCollection("news", dbManager.getCollection("news").filter((i) => i.id !== id));
            apiRequest("DELETE", "/api/content/articles/" + id);
            apiRequest("DELETE", "/api/content/news/" + id);
        } else {
            dbManager.saveCollection(cfg.dbKey, dbManager.getCollection(cfg.dbKey).filter((i) => i.id !== id));
            apiRequest("DELETE", "/api/content/" + cfg.dbKey + "/" + id);
        }

        showToast("Konten ditolak dan dihapus", "error");
        this._render();
    }

    _approveReview(reviewId) {
        const reviews = this._getReviews();
        const review = reviews.find((r) => r.id === reviewId);
        if (!review) return;

        review.status = "approved";
        review.updatedAt = new Date().toISOString();
        this._saveReviews(reviews);
        showToast("Ulasan berhasil disetujui", "success");
        this._render();
    }

    _rejectReview(reviewId) {
        const reviews = this._getReviews();
        const review = reviews.find((r) => r.id === reviewId);
        if (!review) return;

        review.status = "rejected";
        review.updatedAt = new Date().toISOString();
        this._saveReviews(reviews);
        showToast("Ulasan ditolak", "error");
        this._render();
    }

    // --- Events ---

    _bindEvents() {
        const container = DOM.$("#managerApprovalsPage");
        if (!container) return;
        container.removeEventListener("click", this._clickHandler);
        this._clickHandler = (e) => {
            const typeTab = e.target.closest("[data-type]");
            if (typeTab) {
                const type = typeTab.dataset.type;
                if (type === "ulasan") {
                    this.currentType = "ulasan";
                } else if (CONTENT_TYPES.some((c) => c.id === type)) {
                    this.currentType = type;
                }
                this._render();
                return;
            }

            const actionBtn = e.target.closest("[data-action]");
            if (!actionBtn) return;

            const action = actionBtn.dataset.action;
            const id = actionBtn.dataset.id;
            if (!id) return;

            if (action === "approve-content") this._approveContent(id);
            else if (action === "reject-content") this._rejectContent(id);
            else if (action === "approve-review") this._approveReview(id);
            else if (action === "reject-review") this._rejectReview(id);
        };
        container.addEventListener("click", this._clickHandler);
    }
}

export default ManagerApprovalsPage;
