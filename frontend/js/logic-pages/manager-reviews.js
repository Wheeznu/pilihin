import { repositories, getDbReady } from "../../../backend/init.js";
import { DOM } from "../utils/dom.js";
import authService from "../../../backend/services/AuthService.js";

const DB_KEY = "pilih-in-db";

function _getCollection(name) {
    try {
        const db = JSON.parse(localStorage.getItem(DB_KEY));
        return db?.[name] || [];
    } catch {
        return [];
    }
}

function _formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function _getInitials(name) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

class ManagerReviewsPage {
    constructor() {
        this._init();
    }

    async _init() {
        if (!authService.requireRole("manager", "/frontend/pages/main/login.html")) return;

        await getDbReady();

        this._render();
    }

    _getReviews() {
        return _getCollection("reviews");
    }

    _getFilmTitle(filmId) {
        const film = repositories.films.findById(filmId);
        return film?.title || "Film tidak dikenal";
    }

    _getUserName(userId) {
        const users = _getCollection("users");
        const user = users.find((u) => u.id === userId);
        return user || null;
    }

    _getRatingDistribution(reviews) {
        const dist = {};
        for (let i = 1; i <= 10; i++) dist[i] = 0;
        reviews.forEach((r) => {
            if (dist[r.rating] !== undefined) dist[r.rating]++;
        });
        return dist;
    }

    _getTopFilms(reviews, field, limit = 5) {
        const filmMap = {};
        reviews.filter((r) => r.status === "approved").forEach((r) => {
            if (!filmMap[r.filmId]) filmMap[r.filmId] = { count: 0, total: 0 };
            filmMap[r.filmId].count++;
            filmMap[r.filmId].total += r.rating;
        });

        return Object.entries(filmMap)
            .map(([filmId, data]) => ({
                filmId,
                avg: data.total / data.count,
                count: data.count,
                title: this._getFilmTitle(filmId),
            }))
            .sort((a, b) => field === "rating" ? b.avg - a.avg : b.count - a.count)
            .slice(0, limit);
    }

    _getMonthlyTrend(reviews) {
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                year: d.getFullYear(),
                month: d.getMonth(),
                label: d.toLocaleDateString("id-ID", { month: "short" }),
            });
        }

        return months.map((m) => {
            const monthReviews = reviews.filter((r) => {
                const d = new Date(r.createdAt);
                return d.getFullYear() === m.year && d.getMonth() === m.month;
            });
            return {
                label: m.label,
                total: monthReviews.length,
                approved: monthReviews.filter((r) => r.status === "approved").length,
                pending: monthReviews.filter((r) => r.status === "pending").length,
                rejected: monthReviews.filter((r) => r.status === "rejected").length,
            };
        });
    }

    _render() {
        const container = DOM.$("#managerReviewsPage");
        if (!container) return;

        const reviews = this._getReviews();
        const total = reviews.length;
        const approved = reviews.filter((r) => r.status === "approved").length;
        const pending = reviews.filter((r) => r.status === "pending").length;
        const rejected = reviews.filter((r) => r.status === "rejected").length;
        const avgRating = approved > 0
            ? (reviews.filter((r) => r.status === "approved").reduce((s, r) => s + r.rating, 0) / approved).toFixed(1)
            : "0.0";

        const ratingDist = this._getRatingDistribution(reviews);
        const maxDist = Math.max(...Object.values(ratingDist), 1);
        const topRated = this._getTopFilms(reviews, "rating");
        const mostReviewed = this._getTopFilms(reviews, "count");
        const trend = this._getMonthlyTrend(reviews);
        const maxTrend = Math.max(...trend.map((t) => t.total), 1);

        const recentReviews = reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 15);

        container.innerHTML = `
            <div class="reviews-header">
                <div>
                    <h1 class="reviews-header__title">
                        <i data-feather="message-square"></i> Laporan Ulasan
                    </h1>
                    <p class="reviews-header__subtitle">Analisis rating, sentimen, dan aktivitas ulasan pengguna</p>
                </div>
            </div>

            <div class="reviews-overview">
                <div class="reviews-card">
                    <div class="reviews-card__header">
                        <div class="reviews-card__icon reviews-card__icon--total">
                            <i data-feather="message-square"></i>
                        </div>
                    </div>
                    <div class="reviews-card__value">${total}</div>
                    <div class="reviews-card__label">Total Ulasan</div>
                </div>
                <div class="reviews-card">
                    <div class="reviews-card__header">
                        <div class="reviews-card__icon reviews-card__icon--rating">
                            <i data-feather="star"></i>
                        </div>
                    </div>
                    <div class="reviews-card__value">${avgRating}</div>
                    <div class="reviews-card__label">Rata-Rata Rating</div>
                </div>
                <div class="reviews-card">
                    <div class="reviews-card__header">
                        <div class="reviews-card__icon reviews-card__icon--approved">
                            <i data-feather="check-circle"></i>
                        </div>
                    </div>
                    <div class="reviews-card__value">${approved}</div>
                    <div class="reviews-card__label">Disetujui</div>
                </div>
                <div class="reviews-card">
                    <div class="reviews-card__header">
                        <div class="reviews-card__icon reviews-card__icon--pending">
                            <i data-feather="clock"></i>
                        </div>
                    </div>
                    <div class="reviews-card__value">${pending}</div>
                    <div class="reviews-card__label">Menunggu</div>
                </div>
            </div>

            <div class="reviews-grid">
                <div class="reviews-section">
                    <div class="reviews-section__header">
                        <h3 class="reviews-section__title"><i data-feather="bar-chart-2"></i> Distribusi Rating</h3>
                    </div>
                    <div class="reviews-section__body">
                        ${total > 0 ? `
                            <div class="reviews-rating-dist">
                                ${Object.entries(ratingDist).reverse().map(([rating, count]) => `
                                    <div class="reviews-rating-row">
                                        <div class="reviews-rating-row__label">${rating}</div>
                                        <div class="reviews-rating-row__bar">
                                            <div class="reviews-rating-row__fill" style="width: ${(count / maxDist) * 100}%"></div>
                                        </div>
                                        <div class="reviews-rating-row__count">${count}</div>
                                    </div>
                                `).join("")}
                            </div>
                        ` : `
                            <div class="reviews-empty">
                                <i data-feather="bar-chart-2"></i>
                                <div class="reviews-empty__title">Belum ada data rating</div>
                            </div>
                        `}
                    </div>
                </div>

                <div class="reviews-section">
                    <div class="reviews-section__header">
                        <h3 class="reviews-section__title"><i data-feather="activity"></i> Tren Bulanan</h3>
                    </div>
                    <div class="reviews-section__body">
                        ${trend.some((t) => t.total > 0) ? `
                            <div class="reviews-trend">
                                ${trend.map((t) => `
                                    <div class="reviews-trend__bar reviews-trend__bar--approved" style="height: ${(t.total / maxTrend) * 100}%" data-tooltip="${t.total} ulasan (${t.approved} disetujui)"></div>
                                `).join("")}
                            </div>
                            <div class="reviews-trend__labels">
                                ${trend.map((t) => `
                                    <div class="reviews-trend__label">${t.label}</div>
                                `).join("")}
                            </div>
                        ` : `
                            <div class="reviews-empty">
                                <i data-feather="activity"></i>
                                <div class="reviews-empty__title">Belum ada tren</div>
                            </div>
                        `}
                    </div>
                </div>

                <div class="reviews-section">
                    <div class="reviews-section__header">
                        <h3 class="reviews-section__title"><i data-feather="award"></i> Film Rating Tertinggi</h3>
                    </div>
                    <div class="reviews-section__body">
                        ${topRated.length > 0 ? `
                            <div class="reviews-film-list">
                                ${topRated.map((f, i) => `
                                    <div class="reviews-film-item">
                                        <span style="font-size:var(--font-sm);font-weight:var(--fw-bold);color:var(--text-muted);width:20px">${i + 1}</span>
                                        <img class="reviews-film-item__poster" src="https://picsum.photos/seed/${f.filmId}/72/104" alt="" onerror="this.style.display='none'" />
                                        <div class="reviews-film-item__info">
                                            <div class="reviews-film-item__title">${f.title}</div>
                                            <div class="reviews-film-item__meta">${f.count} ulasan</div>
                                        </div>
                                        <div class="reviews-film-item__rating">
                                            <i data-feather="star"></i> ${f.avg.toFixed(1)}
                                        </div>
                                    </div>
                                `).join("")}
                            </div>
                        ` : `
                            <div class="reviews-empty">
                                <i data-feather="award"></i>
                                <div class="reviews-empty__title">Belum ada data</div>
                            </div>
                        `}
                    </div>
                </div>

                <div class="reviews-section">
                    <div class="reviews-section__header">
                        <h3 class="reviews-section__title"><i data-feather="message-circle"></i> Film Paling Banyak DIulas</h3>
                    </div>
                    <div class="reviews-section__body">
                        ${mostReviewed.length > 0 ? `
                            <div class="reviews-film-list">
                                ${mostReviewed.map((f, i) => `
                                    <div class="reviews-film-item">
                                        <span style="font-size:var(--font-sm);font-weight:var(--fw-bold);color:var(--text-muted);width:20px">${i + 1}</span>
                                        <img class="reviews-film-item__poster" src="https://picsum.photos/seed/${f.filmId}/72/104" alt="" onerror="this.style.display='none'" />
                                        <div class="reviews-film-item__info">
                                            <div class="reviews-film-item__title">${f.title}</div>
                                            <div class="reviews-film-item__meta">Rating ${f.avg.toFixed(1)}</div>
                                        </div>
                                        <div class="reviews-film-item__count">${f.count} ulasan</div>
                                    </div>
                                `).join("")}
                            </div>
                        ` : `
                            <div class="reviews-empty">
                                <i data-feather="message-circle"></i>
                                <div class="reviews-empty__title">Belum ada data</div>
                            </div>
                        `}
                    </div>
                </div>
            </div>

            <div class="reviews-section">
                <div class="reviews-section__header">
                    <h3 class="reviews-section__title"><i data-feather="list"></i> Ulasan Terbaru</h3>
                </div>
                <div class="reviews-section__body" style="padding:0">
                    ${recentReviews.length > 0 ? `
                        <div class="reviews-table-wrap">
                            <table class="reviews-table">
                                <thead>
                                    <tr>
                                        <th>Pengguna</th>
                                        <th>Film</th>
                                        <th>Rating</th>
                                        <th>Ulasan</th>
                                        <th>Status</th>
                                        <th>Tanggal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${recentReviews.map((r) => {
                                        const user = this._getUserName(r.userId);
                                        return `
                                            <tr>
                                                <td>
                                                    <div class="reviews-table__user">
                                                        <img class="reviews-table__avatar" src="${user?.profilePhoto || ""}" alt="" onerror="this.style.display='none'" />
                                                        <span class="reviews-table__user-name">${user?.username || "—"}</span>
                                                    </div>
                                                </td>
                                                <td><span class="reviews-table__film">${this._getFilmTitle(r.filmId)}</span></td>
                                                <td>
                                                    <span class="reviews-table__rating">
                                                        <i data-feather="star"></i> ${r.rating}/10
                                                    </span>
                                                </td>
                                                <td><span class="reviews-table__content">${r.title || r.content?.slice(0, 50) || "—"}</span></td>
                                                <td>
                                                    <span class="reviews-table__status reviews-table__status--${r.status}">
                                                        ${r.status === "approved" ? "Disetujui" : r.status === "pending" ? "Menunggu" : "Ditolak"}
                                                    </span>
                                                </td>
                                                <td><span class="reviews-table__date">${_formatDate(r.createdAt)}</span></td>
                                            </tr>
                                        `;
                                    }).join("")}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div class="reviews-empty">
                            <i data-feather="inbox"></i>
                            <div class="reviews-empty__title">Belum ada ulasan</div>
                            <div class="reviews-empty__desc">Ulasan akan muncul setelah pengguna memberikan rating.</div>
                        </div>
                    `}
                </div>
            </div>
        `;

        feather.replace();
    }
}

export default ManagerReviewsPage;
