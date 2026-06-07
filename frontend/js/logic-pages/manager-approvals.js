import { repositories, getDbReady } from "../../../backend/init.js";
import { DOM } from "../utils/dom.js";
import authService from "../../../backend/services/AuthService.js";

const DB_KEY = "pilih-in-db";
const FILM_CACHE = {};

function _getCollection(name) {
    try {
        const db = JSON.parse(localStorage.getItem(DB_KEY));
        return db?.[name] || [];
    } catch {
        return [];
    }
}

function _saveCollection(name, data) {
    try {
        const db = JSON.parse(localStorage.getItem(DB_KEY)) || {};
        db[name] = data;
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (err) {
        console.warn("Gagal menyimpan koleksi:", err);
    }
}

function _getFilmTitle(filmId) {
    if (FILM_CACHE[filmId]) return FILM_CACHE[filmId];
    const film = repositories.films.findById(filmId);
    FILM_CACHE[filmId] = film?.title || "Film tidak dikenal";
    return FILM_CACHE[filmId];
}

function _getUserDisplay(userId) {
    const users = _getCollection("users");
    const user = users.find((u) => u.id === userId);
    return user ? { username: user.username, photo: user.profilePhoto } : { username: "Pengguna tidak dikenal", photo: null };
}

function _getInitials(name) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function _seedSampleReviews() {
    const existing = _getCollection("reviews");
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

    const users = _getCollection("users");
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

    _saveCollection("reviews", reviews);
}

class ManagerApprovalsPage {
    constructor() {
        this.currentTab = "pending";
        this._init();
    }

    async _init() {
        if (!authService.requireRole("manager", "/frontend/pages/main/login.html")) return;

        await getDbReady();
        _seedSampleReviews();

        this._render();
        this._bindEvents();
    }

    _getReviews() {
        return _getCollection("reviews");
    }

    _saveReviews(reviews) {
        _saveCollection("reviews", reviews);
    }

    _getFilteredReviews() {
        const all = this._getReviews();
        if (this.currentTab === "all") return all;
        return all.filter((r) => r.status === this.currentTab);
    }

    _render() {
        const container = DOM.$("#managerApprovalsPage");
        if (!container) return;

        const all = this._getReviews();
        const pending = all.filter((r) => r.status === "pending").length;
        const approved = all.filter((r) => r.status === "approved").length;
        const rejected = all.filter((r) => r.status === "rejected").length;

        container.innerHTML = `
            <div class="approvals-header">
                <div>
                    <h1 class="approvals-header__title">
                        <i data-feather="check-circle"></i> Persetujuan Konten
                    </h1>
                    <p class="approvals-header__subtitle">Moderasi ulasan dan rating film dari pengguna</p>
                </div>
            </div>

            <div class="approvals-stats">
                <div class="approvals-stat approvals-stat--pending">
                    <div class="approvals-stat__value">${pending}</div>
                    <div class="approvals-stat__label">Menunggu</div>
                </div>
                <div class="approvals-stat approvals-stat--approved">
                    <div class="approvals-stat__value">${approved}</div>
                    <div class="approvals-stat__label">Disetujui</div>
                </div>
                <div class="approvals-stat approvals-stat--rejected">
                    <div class="approvals-stat__value">${rejected}</div>
                    <div class="approvals-stat__label">Ditolak</div>
                </div>
            </div>

            <div class="approvals-tabs">
                <button class="approvals-tab ${this.currentTab === "pending" ? "approvals-tab--active" : ""}" data-tab="pending">Menunggu</button>
                <button class="approvals-tab ${this.currentTab === "approved" ? "approvals-tab--active" : ""}" data-tab="approved">Disetujui</button>
                <button class="approvals-tab ${this.currentTab === "rejected" ? "approvals-tab--active" : ""}" data-tab="rejected">Ditolak</button>
                <button class="approvals-tab ${this.currentTab === "all" ? "approvals-tab--active" : ""}" data-tab="all">Semua</button>
            </div>

            ${this._renderTable()}
        `;

        feather.replace();
    }

    _renderTable() {
        const reviews = this._getFilteredReviews();

        if (reviews.length === 0) {
            const messages = {
                pending: "Tidak ada ulasan yang menunggu persetujuan",
                approved: "Belum ada ulasan yang disetujui",
                rejected: "Belum ada ulasan yang ditolak",
                all: "Belum ada ulasan",
            };
            return `
                <div class="approvals-empty">
                    <i data-feather="inbox"></i>
                    <div class="approvals-empty__title">${messages[this.currentTab] || messages.all}</div>
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
                        <th>Status</th>
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
                        <img
                            class="approvals-film__poster"
                            src="https://picsum.photos/seed/${review.id}/80/112"
                            alt="${filmTitle}"
                            onerror="this.style.display='none'"
                        />
                        <div>
                            <div class="approvals-film__title">${filmTitle}</div>
                            <div class="approvals-film__meta">ID: ${review.filmId}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="approvals-user">
                        <img
                            class="approvals-user__avatar"
                            src="${user.photo || ""}"
                            alt="${user.username}"
                            onerror="this.style.display='none'"
                        />
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
                    <span class="approvals-status approvals-status--${review.status}">
                        <i data-feather="${review.status === "approved" ? "check-circle" : review.status === "rejected" ? "x-circle" : "clock"}"></i>
                        ${review.status === "pending" ? "Menunggu" : review.status === "approved" ? "Disetujui" : "Ditolak"}
                    </span>
                </td>
                <td>
                    ${review.status === "pending" ? `
                        <div class="approvals-actions">
                            <button class="btn btn-primary btn-sm" data-action="approve" data-id="${review.id}">
                                <i data-feather="check"></i> Setujui
                            </button>
                            <button class="btn btn-danger btn-sm" data-action="reject" data-id="${review.id}">
                                <i data-feather="x"></i> Tolak
                            </button>
                        </div>
                    ` : `
                        <span class="approvals-status" style="font-size:var(--font-xs);color:var(--text-muted)">
                            ${new Date(review.updatedAt).toLocaleDateString("id-ID")}
                        </span>
                    `}
                </td>
            </tr>
        `;
    }

    _bindEvents() {
        DOM.$("#managerApprovalsPage")?.addEventListener("click", (e) => {
            const tabBtn = e.target.closest(".approvals-tab");
            if (tabBtn) {
                this.currentTab = tabBtn.dataset.tab;
                this._render();
                this._bindEvents();
                return;
            }

            const actionBtn = e.target.closest("[data-action]");
            if (!actionBtn) return;

            const action = actionBtn.dataset.action;
            const reviewId = actionBtn.dataset.id;
            if (!reviewId) return;

            if (action === "approve") this._approveReview(reviewId);
            else if (action === "reject") this._rejectReview(reviewId);
        });
    }

    _approveReview(reviewId) {
        const reviews = this._getReviews();
        const review = reviews.find((r) => r.id === reviewId);
        if (!review) return;

        review.status = "approved";
        review.updatedAt = new Date().toISOString();
        this._saveReviews(reviews);
        DOM.showToast("Ulasan berhasil disetujui", "success");
        this._render();
        this._bindEvents();
    }

    _rejectReview(reviewId) {
        const reviews = this._getReviews();
        const review = reviews.find((r) => r.id === reviewId);
        if (!review) return;

        review.status = "rejected";
        review.updatedAt = new Date().toISOString();
        this._saveReviews(reviews);
        DOM.showToast("Ulasan ditolak", "error");
        this._render();
        this._bindEvents();
    }
}

export default ManagerApprovalsPage;
