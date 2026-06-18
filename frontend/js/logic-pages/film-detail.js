import { DOM } from "../utils/dom.js";
import { UserData } from "../utils/user-data.js";
import { getDbReady, dbManager } from "../../../backend/init.js";

const GENRE_MAP = {
    "genre-001": "Comedy",
    "genre-002": "Drama",
    "genre-003": "Romance",
    "genre-004": "Horror",
    "genre-005": "Action",
};

class DetailPage {
    constructor() {
        this._film = null;
        this._db = null;
        this._reviews = [];
        this._watchLists = [];
        this._favorites = [];
        this._trailerVideo = null;
        this._init();
    }

    async _init() {
        try {
            await getDbReady();
            this._db = this._getDb();
            this._film = this._getFilmFromHash();
            if (!this._film) {
                this._renderError();
                return;
            }
            await this._loadUserData();
            this._populateVideo();
            this._populateHeader();
            this._populateBadges();
            this._populateSynopsis();
            this._populateDetail();
            this._populateReviews();
            this._updateActionButtons();
            this._bindTabs();
            this._bindActions();
            this._bindTrailerModal();
            feather.replace();
            this._scrollToHashMode();
        } catch (err) {
            console.warn("DetailPage: retrying...", err);
            setTimeout(() => this._init(), 500);
        }
    }

    async _loadUserData() {
        this._reviews = dbManager.getCollection("reviews");
        this._watchLists = await UserData.get("watchLists");
        this._favorites = await UserData.get("favorites");
    }

    _getDb() {
        const raw = localStorage.getItem("pilih-in-db");
        return raw ? JSON.parse(raw) : null;
    }

    _getFilmFromHash() {
        const raw = window.location.hash.replace("#", "");
        const id = raw.split("?")[0];
        if (!id) return null;
        if (!this._db || !this._db.films) return null;
        return this._db.films.find((f) => f.id === id && f.status === "published") || null;
    }

    _scrollToHashMode() {
        const raw = window.location.hash.replace("#", "");
        const mode = raw.includes("?info") ? "info" : "default";
        if (mode === "info") {
            const el = document.querySelector(".film-header-info");
            if (el) {
                setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
            }
        }
    }

    _getGenres() {
        return this._db?.genres || [];
    }

    _genreNames(genreIds) {
        if (!genreIds || !genreIds.length) return [];
        const genres = this._getGenres();
        return genreIds.map((id) => {
            const g = genres.find((g) => g.id === id);
            return g ? { id: g.id, name: g.name } : { id, name: GENRE_MAP[id] || id };
        }).filter((g) => g.name);
    }

    _isLoggedIn() {
        return !!localStorage.getItem("pilih-in-session");
    }

    _toEmbedUrl(url) {
        if (!url) return "";
        const match = url.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
        );
        if (match) {
            return `https://www.youtube.com/embed/${match[1]}?enablejsapi=1`;
        }
        return url;
    }

    _extractVideoId(url) {
        if (!url) return null;
        const match = url.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
        );
        return match ? match[1] : null;
    }

    /* ── YouTube IFrame API ── */
    _loadYTAPI() {
        if (this._ytApiPromise) return this._ytApiPromise;
        this._ytApiPromise = new Promise((resolve) => {
            if (window.YT && window.YT.Player) {
                resolve();
                return;
            }
            window.onYouTubeIframeAPIReady = resolve;
            const tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(tag);
        });
        return this._ytApiPromise;
    }

    /* ── Watch History ── */
    _onVideoPlay() {
        if (this._watchHistoryAdded) return;
        clearTimeout(this._whTimer);
        this._whTimer = setTimeout(() => this._addToWatchHistory(), 5000);
    }

    _addToWatchHistory() {
        if (this._watchHistoryAdded) return;
        this._watchHistoryAdded = true;
        const user = this._getSessionUser();
        if (!user || !this._film) return;
        const entry = {
            id: `wh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            userId: user.userId,
            filmId: this._film.id,
            watchedAt: new Date().toISOString(),
            currentTime: 5,
            duration: (this._film.duration || 0) * 60,
            progress: 5,
            completed: false,
        };
        const db = this._getDb();
        if (db) {
            if (!db.watchHistory) db.watchHistory = [];
            db.watchHistory = db.watchHistory.filter(
                (r) => !(r.userId === user.userId && r.filmId === this._film.id)
            );
            db.watchHistory.push(entry);
            localStorage.setItem("pilih-in-db", JSON.stringify(db));
        }
    }

    /* ── Video ── */
    _populateVideo() {
        const f = this._film;
        const section = DOM.$("#videoSection");
        const container = DOM.$("#filmVideo");
        const overlay = DOM.$("#videoLoginOverlay");
        if (!container) return;

        if (!this._isLoggedIn()) {
            container.innerHTML = "";
            if (overlay) overlay.style.display = "flex";
            if (section) section.classList.add("video-section--locked");
            return;
        }

        if (f.streamingUrl) {
            const videoId = this._extractVideoId(f.streamingUrl);
            if (videoId) {
                this._watchHistoryAdded = false;
                this._loadYTAPI().then(() => {
                    try {
                        this._ytPlayer = new YT.Player("filmVideo", {
                            videoId,
                            playerVars: {
                                autoplay: 1,
                                controls: 1,
                                rel: 0,
                                modestbranding: 1,
                            },
                            events: {
                                onStateChange: (e) => {
                                    if (e.data === YT.PlayerState.PLAYING) {
                                        this._onVideoPlay();
                                    }
                                },
                            },
                        });
                    } catch (err) {
                        console.warn("DetailPage: YT Player gagal", err);
                    }
                });
            }
        } else {
            if (section) section.style.display = "none";
        }
    }

    /* ── Header ── */
    _populateHeader() {
        const f = this._film;
        DOM.$("#filmTitle").textContent = f.title;
        DOM.$("#filmPoster").src = f.poster;
        DOM.$("#filmPoster").onerror = function () {
            this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(f.title)}&background=1db954&color=fff&size=400`;
        };

        const year = f.releaseDate ? new Date(f.releaseDate).getFullYear() : "-";
        DOM.$("#filmYear").textContent = year;
        DOM.$("#filmDuration").textContent = `${f.duration} mnt`;
        DOM.$("#filmRating").textContent = f.rating || "-";
    }

    _populateBadges() {
        const f = this._film;
        const container = DOM.$("#filmBadges");
        if (!container) return;

        const qualityBadge = f.videoQuality?.[f.videoQuality.length - 1] || "HD";
        const genreNames = this._genreNames(f.genres);
        const qualityLabel = f.videoQuality?.join(", ") || "HD";

        container.innerHTML = `
            <span class="badge badge--rating">
                <i data-feather="star" style="width:14px;height:14px;fill:currentColor"></i>
                ${f.averageRating || "-"}
            </span>
            <span class="badge" title="${qualityLabel}">${qualityBadge}</span>
            ${genreNames.map((g) => `<a href="/frontend/pages/film/katalog.html?genre=${g.id}" class="badge badge--genre">${g.name}</a>`).join("")}
        `;
    }

    /* ── Tabs ── */
    _bindTabs() {
        const header = DOM.$(".tabs-header");
        if (!header) return;
        header.addEventListener("click", (e) => {
            const btn = e.target.closest(".tab-btn");
            if (!btn) return;

            const targetId = btn.dataset.target;
            if (!targetId) return;

            header.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
            const target = DOM.$(`#${targetId}`);
            if (target) target.classList.add("active");
        });
    }

    /* ── Sinopsis ── */
    _populateSynopsis() {
        const el = DOM.$("#filmSynopsis");
        if (!el) return;
        el.textContent = this._film.description || "Tidak ada sinopsis.";
    }

    /* ── Detail ── */
    _populateDetail() {
        const f = this._film;
        const grid = DOM.$("#filmDetailGrid");
        if (!grid) return;

        const year = f.releaseDate ? new Date(f.releaseDate).getFullYear() : "-";
        const subtitles = f.subtitles?.map((s) => (s === "id" ? "Indonesia" : s === "en" ? "Inggris" : s)).join(", ") || "-";
        const directorName = f.director || "-";
        const actorNames = f.actors || [];
        const qualityLabel = f.videoQuality?.join(", ") || "-";

        grid.innerHTML = `
            <div class="detail-item">
                <span class="detail-item__label">Tahun Rilis</span>
                <span class="detail-item__value">${year}</span>
            </div>
            <div class="detail-item">
                <span class="detail-item__label">Durasi</span>
                <span class="detail-item__value">${f.duration} menit</span>
            </div>
            <div class="detail-item">
                <span class="detail-item__label">Rating Usia</span>
                <span class="detail-item__value">${f.rating || "-"}</span>
            </div>
            <div class="detail-item">
                <span class="detail-item__label">Kualitas Video</span>
                <span class="detail-item__value">${qualityLabel}</span>
            </div>
            <div class="detail-item">
                <span class="detail-item__label">Subtitle</span>
                <span class="detail-item__value">${subtitles}</span>
            </div>
            <div class="detail-item">
                <span class="detail-item__label">Rating</span>
                <span class="detail-item__value">
                    <i data-feather="star" style="width:14px;height:14px;fill:currentColor;color:var(--accent-primary);vertical-align:middle"></i>
                    ${f.averageRating || "-"} / 10
                </span>
            </div>
            <div class="detail-item">
                <span class="detail-item__label">Sutradara</span>
                <span class="detail-item__value"><a href="/frontend/pages/film/sutradara.html?name=${encodeURIComponent(directorName)}">${directorName}</a></span>
            </div>
            <div class="detail-item">
                <span class="detail-item__label">Aktor</span>
                <span class="detail-item__value detail-cast-list">
                    ${actorNames.map((a) => `<a href="/frontend/pages/film/aktor.html?name=${encodeURIComponent(a)}">${a}</a>`).join('<span></span>')}
                </span>
            </div>
        `;
    }

    /* ── Reviews ── */
    _getSessionUser() {
        try {
            const raw = localStorage.getItem("pilih-in-session");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    _getUserDisplayName(userId) {
        const users = dbManager.getCollection("users");
        const user = users.find((u) => u.id === userId);
        return user?.username || `User ${(userId || "xxxx").slice(-4)}`;
    }

    _saveGlobalReviews(reviews) {
        dbManager.saveCollection("reviews", reviews);
    }

    _populateReviews() {
        const tab = DOM.$("#tab-ulasan");
        if (!tab) return;

        const session = this._getSessionUser();
        const userId = session?.userId;
        const isLoggedIn = !!userId;

        const allReviews = dbManager.getCollection("reviews");
        const filmReviews = allReviews.filter((r) => r.filmId === this._film.id);
        const approvedReviews = filmReviews.filter((r) => r.status === "approved");
        const userPending = filmReviews.find((r) => r.userId === userId && r.status === "pending");

        let html = "";

        // Auth section / review form
        if (isLoggedIn) {
            if (userPending) {
                html += `
                    <div class="review-form-container">
                        <h3>Tulis Ulasan</h3>
                        <p style="color:var(--text-muted);font-size:var(--font-sm);margin-bottom:var(--space-md)">
                            Anda sudah mengirimkan ulasan untuk film ini. Menunggu persetujuan moderator.
                        </p>
                    </div>
                `;
            } else {
                html += `
                    <div class="review-form-container">
                        <h3>Tulis Ulasan</h3>
                        <div class="review-rating-selector" id="reviewRatingSelector">
                            ${Array.from({ length: 10 }, (_, i) => `
                                <span class="review-star" data-value="${i + 1}" title="${i + 1}">
                                    <i data-feather="star"></i>
                                </span>
                            `).join("")}
                        </div>
                        <textarea id="reviewInput" class="review-form-input" rows="3" placeholder="Bagikan pendapatmu tentang film ini..."></textarea>
                        <button id="submitReviewBtn" class="btn btn-primary" style="margin-top:var(--space-sm)" disabled>Kirim Ulasan</button>
                    </div>
                `;
            }
        } else {
            html += `
                <div class="review-login-prompt" style="cursor:pointer" onclick="if(confirm('Anda harus login terlebih dahulu. Ingin login sekarang?')){window.location.href='/frontend/pages/main/login.html'}">
                    <i data-feather="info"></i>
                    <span>Silakan <a href="/frontend/pages/main/login.html">login</a> untuk memberikan ulasan.</span>
                </div>
            `;
        }

        // Reviews list
        if (approvedReviews.length === 0 && !userPending) {
            html += `
                <div class="reviews-empty">
                    <i data-feather="message-square"></i>
                    <h3>Belum ada ulasan</h3>
                    <p>${isLoggedIn ? "Jadilah yang pertama memberikan ulasan untuk film ini." : "Belum ada ulasan untuk film ini."}</p>
                </div>
            `;
        } else {
            html += `<div class="reviews-container">`;

            // Show user's pending review first
            if (userPending) {
                html += this._renderReviewCard(userPending, true);
            }

            // Show approved reviews
            approvedReviews.forEach((r) => {
                html += this._renderReviewCard(r, false);
            });

            html += `</div>`;
        }

        tab.innerHTML = html;
        feather.replace();

        // Bind rating selector & submit
        if (isLoggedIn && !userPending) {
            this._bindReviewForm();
        }
    }

    _renderReviewCard(r, isPending) {
        const date = r.createdAt
            ? new Date(r.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })
            : "";
        const stars = r.rating
            ? Array.from({ length: 10 }, (_, i) =>
                  i < r.rating
                      ? '<i data-feather="star" style="width:12px;height:12px;fill:currentColor;color:#f1c40f"></i>'
                      : '<i data-feather="star" style="width:12px;height:12px;color:var(--text-muted)"></i>'
              ).join("")
            : "";
        const displayName = this._getUserDisplayName(r.userId);
        const initial = displayName[0].toUpperCase();

        return `
            <div class="review-card ${isPending ? "review-card--pending" : ""}">
                <div class="review-card__header">
                    <div class="review-card__avatar">${initial}</div>
                    <span class="review-card__user">${displayName}</span>
                    ${r.rating ? `<span class="review-card__rating">${stars}</span>` : ""}
                    ${date ? `<span class="review-card__date">${date}</span>` : ""}
                    ${isPending ? `<span class="review-card__pending-badge">Menunggu</span>` : ""}
                </div>
                <div class="review-card__body">${r.content || ""}</div>
            </div>
        `;
    }

    _bindReviewForm() {
        let selectedRating = 0;
        const stars = DOM.$$("#reviewRatingSelector .review-star");
        const submitBtn = DOM.$("#submitReviewBtn");
        const input = DOM.$("#reviewInput");
        const session = this._getSessionUser();
        if (!session) return;

        stars.forEach((star) => {
            star.addEventListener("click", () => {
                selectedRating = parseInt(star.dataset.value);
                stars.forEach((s) => {
                    const val = parseInt(s.dataset.value);
                    s.classList.toggle("selected", val <= selectedRating);
                });
                if (selectedRating > 0) {
                    submitBtn.disabled = false;
                }
            });
        });

        if (submitBtn && input) {
            submitBtn.addEventListener("click", () => {
                const comment = input.value.trim();
                if (!comment || selectedRating === 0) return;

                const allReviews = dbManager.getCollection("reviews");
                const review = {
                    id: "review-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
                    filmId: this._film.id,
                    userId: session.userId,
                    rating: selectedRating,
                    content: comment,
                    status: "pending",
                    helpful: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                allReviews.push(review);
                this._saveGlobalReviews(allReviews);
                input.value = "";
                this._populateReviews();
            });
        }
    }

    /* ── Action Buttons ── */
    _isInWatchlist() {
        const user = this._getSessionUser();
        if (!user) return false;
        return this._watchLists.some((r) => r.userId === user.userId && r.filmId === this._film.id);
    }

    _isFavorite() {
        const user = this._getSessionUser();
        if (!user) return false;
        return this._favorites.some((r) => r.userId === user.userId && r.filmId === this._film.id);
    }

    _updateActionButtons() {
        const wlBtn = DOM.$("#btnWatchlist");
        const favBtn = DOM.$("#btnFavorit");
        if (wlBtn && this._isInWatchlist()) {
            wlBtn.classList.add("active-watchlist");
        }
        if (favBtn && this._isFavorite()) {
            favBtn.classList.add("active-favorit");
        }
    }

    _bindActions() {
        const wlBtn = DOM.$("#btnWatchlist");
        const favBtn = DOM.$("#btnFavorit");
        const shareBtn = DOM.$("#btnShare");
        const trailerBtn = DOM.$("#btnTrailer");

        if (wlBtn) {
            wlBtn.addEventListener("click", async () => {
                const user = this._getSessionUser();
                if (!user) {
                    if (confirm("Anda harus login terlebih dahulu. Ingin login sekarang?")) {
                        window.location.href = "/frontend/pages/main/login.html";
                    }
                    return;
                }
                const idx = this._watchLists.findIndex(
                    (r) => r.userId === user.userId && r.filmId === this._film.id
                );
                if (idx > -1) {
                    this._watchLists.splice(idx, 1);
                    wlBtn.classList.remove("active-watchlist");
                } else {
                    this._watchLists.push({ userId: user.userId, filmId: this._film.id });
                    wlBtn.classList.add("active-watchlist");
                }
                await UserData.set("watchLists", this._watchLists);
            });
        }

        if (favBtn) {
            favBtn.addEventListener("click", async () => {
                const user = this._getSessionUser();
                if (!user) {
                    if (confirm("Anda harus login terlebih dahulu. Ingin login sekarang?")) {
                        window.location.href = "/frontend/pages/main/login.html";
                    }
                    return;
                }
                const idx = this._favorites.findIndex(
                    (r) => r.userId === user.userId && r.filmId === this._film.id
                );
                if (idx > -1) {
                    this._favorites.splice(idx, 1);
                    favBtn.classList.remove("active-favorit");
                } else {
                    this._favorites.push({ userId: user.userId, filmId: this._film.id });
                    favBtn.classList.add("active-favorit");
                }
                await UserData.set("favorites", this._favorites);
            });
        }

        if (shareBtn) {
            shareBtn.addEventListener("click", () => {
                const url = window.location.href;
                if (navigator.share) {
                    navigator.share({
                        title: this._film.title,
                        url: url,
                    }).catch(() => {});
                } else {
                    navigator.clipboard.writeText(url).then(() => {
                        const orig = shareBtn.innerHTML;
                        shareBtn.innerHTML = '<i data-feather="check"></i> Tersalin';
                        feather.replace();
                        setTimeout(() => {
                            shareBtn.innerHTML = orig;
                            feather.replace();
                        }, 2000);
                    }).catch(() => {});
                }
            });
        }

        if (trailerBtn) {
            trailerBtn.addEventListener("click", () => this._openTrailer());
        }
    }

    /* ── Trailer Modal ── */
    _bindTrailerModal() {
        const closeBtn = DOM.$("#trailerModalClose");
        const modal = DOM.$("#trailerModal");
        if (!modal) return;

        if (closeBtn) {
            closeBtn.addEventListener("click", () => this._closeTrailer());
        }

        modal.addEventListener("click", (e) => {
            if (e.target === modal) this._closeTrailer();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && modal.style.display !== "none") {
                this._closeTrailer();
            }
        });
    }

    _openTrailer() {
        const modal = DOM.$("#trailerModal");
        const iframe = DOM.$("#trailerVideo");
        if (!modal || !iframe) return;

        const url = this._film.trailerUrl || this._film.streamingUrl;
        if (!url) return;

        iframe.src = this._toEmbedUrl(url);
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
        feather.replace();
    }

    _closeTrailer() {
        const modal = DOM.$("#trailerModal");
        const iframe = DOM.$("#trailerVideo");
        if (!modal) return;

        modal.style.display = "none";
        document.body.style.overflow = "";

        if (iframe) {
            iframe.src = "";
        }
    }

    /* ── Error ── */
    _renderError() {
        window.location.href = "/frontend/pages/main/404.html";
    }
}

export default DetailPage;
