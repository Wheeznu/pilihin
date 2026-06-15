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
        { filmIdx: 3, rating: 8, title: "Mantap!", content: "Salah satu film terbaik yang pernah saya tonton tahun ini. Action scene-nya keren banget!" },
        { filmIdx: 4, rating: 6, title: "Agak membingungkan", content: "Plot twist-nya terlalu dipaksakan. Tapi akting pemain utamanya bagus." },
        { filmIdx: 5, rating: 10, title: "Animasi keren", content: "Anak-anak saya suka banget. Animasi halus dan ceritanya mendidih." },
        { filmIdx: 0, rating: 7, title: "Seru abis!", content: "Action scene-nya epic! Cocok buat penggemar film laga Indonesia." },
        { filmIdx: 1, rating: 8, title: "Inspiratif banget", content: "Film yang memotivasi dan menyentuh hati. Cocok ditonton bareng keluarga." },
    ];

    const users = _getCollection("users");
    const reviewers = users.filter((u) => u.role === "user");
    if (reviewers.length === 0) return;

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
            status: "approved",
            managerReply: i % 3 === 0 ? {
                message: "Terima kasih atas ulasannya! Kami sangat menghargai masukan Anda dan akan terus meningkatkan kualitas konten kami.",
                repliedBy: "manager-001",
                repliedAt: new Date(Date.now() - i * 86400000).toISOString(),
            } : null,
            createdAt: new Date(Date.now() - (sampleReviews.length - i) * 86400000).toISOString(),
            updatedAt: new Date().toISOString(),
        };
    });

    _saveCollection("reviews", reviews);
}

class ManagerBalasUlasanUserPage {
    constructor() {
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

    _getUsers() {
        return _getCollection("users");
    }

    _render() {
        const container = DOM.$("#managerReplyPage");
        if (!container) return;

        const reviews = this._getReviews();
        const replied = reviews.filter((r) => r.managerReply).length;
        const pending = reviews.filter((r) => !r.managerReply).length;

        container.innerHTML = `
            <div class="reply-header">
                <div>
                    <h1 class="reply-header__title">
                        <i data-feather="message-square"></i> Balas Ulasan User
                    </h1>
                    <p class="reply-header__subtitle">Kelola dan balas ulasan film dari pengguna</p>
                </div>
            </div>

            <div class="reply-stats">
                <div class="reply-stat reply-stat--total">
                    <div class="reply-stat__value">${reviews.length}</div>
                    <div class="reply-stat__label">Total Ulasan</div>
                </div>
                <div class="reply-stat reply-stat--replied">
                    <div class="reply-stat__value">${replied}</div>
                    <div class="reply-stat__label">Sudah Dibalas</div>
                </div>
                <div class="reply-stat reply-stat--pending">
                    <div class="reply-stat__value">${pending}</div>
                    <div class="reply-stat__label">Belum Dibalas</div>
                </div>
            </div>

            ${this._renderList(reviews)}
        `;

        feather.replace();
    }

    _renderList(reviews) {
        if (reviews.length === 0) {
            return `
                <div class="reply-empty">
                    <i data-feather="message-square"></i>
                    <div class="reply-empty__title">Belum ada ulasan</div>
                    <div class="reply-empty__desc">Ulasan pengguna akan muncul di sini setelah mereka memberikan rating.</div>
                </div>
            `;
        }

        const sorted = [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return `
            <div class="reply-list">
                ${sorted.map((r) => this._replyCard(r)).join("")}
            </div>
        `;
    }

    _replyCard(review) {
        const filmTitle = _getFilmTitle(review.filmId);
        const users = this._getUsers();
        const user = users.find((u) => u.id === review.userId);
        const username = user?.username || "Pengguna tidak dikenal";
        const avatar = user?.profilePhoto || null;

        return `
            <div class="reply-card ${review.managerReply ? "reply-card--replied" : "reply-card--pending"}" data-review-id="${review.id}">
                <div class="reply-card__header">
                    <div class="reply-card__user">
                        ${avatar
                            ? `<img class="reply-card__avatar" src="${avatar}" alt="${username}" onerror="this.style.display='none'" />`
                            : `<div class="reply-card__avatar-fallback">${_getInitials(username)}</div>`
                        }
                        <div>
                            <div class="reply-card__name">${username}</div>
                            <div class="reply-card__film">${filmTitle}</div>
                            <div class="reply-card__meta">${new Date(review.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
                        </div>
                    </div>
                    <div class="reply-card__rating">
                        <i data-feather="star"></i> ${review.rating}/10
                    </div>
                </div>

                <div class="reply-card__review">
                    <div class="reply-card__review-title">${review.title || "(tanpa judul)"}</div>
                    <div class="reply-card__review-content">${review.content || ""}</div>
                </div>

                ${review.managerReply ? `
                    <div class="reply-card__reply">
                        <div class="reply-card__reply-label">
                            <i data-feather="corner-down-right"></i> Balasan Manager
                        </div>
                        <div class="reply-card__reply-text">${review.managerReply.message}</div>
                        <div class="reply-card__reply-date">${new Date(review.managerReply.repliedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                ` : `
                    <div class="reply-card__form">
                        <textarea class="reply-card__textarea" placeholder="Tulis balasan untuk ulasan ini..." data-field="replyMessage"></textarea>
                        <div class="reply-card__actions">
                            <button class="btn btn-primary btn-sm" data-action="sendReply" data-id="${review.id}">
                                <i data-feather="send"></i> Kirim Balasan
                            </button>
                        </div>
                    </div>
                `}
            </div>
        `;
    }

    _bindEvents() {
        DOM.$("#managerReplyPage")?.addEventListener("click", (e) => {
            const actionBtn = e.target.closest("[data-action]");
            if (!actionBtn) return;

            const action = actionBtn.dataset.action;
            const reviewId = actionBtn.dataset.id;
            if (!reviewId || action !== "sendReply") return;

            const card = actionBtn.closest(".reply-card");
            const textarea = card?.querySelector('[data-field="replyMessage"]');
            const message = textarea?.value.trim();
            if (!message) {
                DOM.showToast("Tulis pesan balasan terlebih dahulu", "error");
                return;
            }

            this._sendReply(reviewId, message);
        });
    }

    _sendReply(reviewId, message) {
        const reviews = this._getReviews();
        const review = reviews.find((r) => r.id === reviewId);
        if (!review) return;

        review.managerReply = {
            message,
            repliedBy: authService.getSession()?.userId || "unknown",
            repliedAt: new Date().toISOString(),
        };
        review.updatedAt = new Date().toISOString();

        this._saveReviews(reviews);
        this._render();
        this._bindEvents();
        DOM.showToast("Balasan berhasil dikirim!", "success");
    }
}

export default ManagerBalasUlasanUserPage;
