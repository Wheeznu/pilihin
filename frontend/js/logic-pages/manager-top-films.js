import { repositories, getDbReady } from "../../../backend/init.js";
import { DOM } from "../utils/dom.js";
import authService from "../../../backend/services/AuthService.js";

class ManagerTopFilmsPage {
    constructor() {
        this.sortBy = "watches";
        this._init();
    }

    async _init() {
        if (!authService.requireRole("manager", "/frontend/pages/main/login.html")) return;

        await getDbReady();

        this._render();
        this._bindEvents();
    }

    _getGenreName(genreId) {
        const db = JSON.parse(localStorage.getItem("pilih-in-db"));
        const genre = db?.genres?.find((g) => g.id === genreId);
        return genre?.name || "";
    }

    _getFilms() {
        return repositories.films.findPublished();
    }

    _sortFilms(films) {
        const sorted = [...films];

        switch (this.sortBy) {
            case "watches":
                sorted.sort((a, b) => b.watchCount - a.watchCount);
                break;
            case "rating":
                sorted.sort((a, b) => {
                    if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
                    return b.reviewCount - a.reviewCount;
                });
                break;
            case "reviews":
                sorted.sort((a, b) => b.reviewCount - a.reviewCount);
                break;
            default:
                sorted.sort((a, b) => b.watchCount - a.watchCount);
        }

        return sorted.slice(0, 20);
    }

    _render() {
        const container = DOM.$("#managerTopFilmsPage");
        if (!container) return;

        const films = this._getFilms();
        const sorted = this._sortFilms(films);

        container.innerHTML = `
            <div class="topfilms-header">
                <div>
                    <h1 class="topfilms-header__title">
                        <i data-feather="award"></i> Film Terpopuler
                    </h1>
                    <p class="topfilms-header__subtitle">Peringkat film berdasarkan ${this.sortBy === "watches" ? "jumlah penonton" : this.sortBy === "rating" ? "rating" : "jumlah ulasan"}</p>
                </div>
                <div class="topfilms-tabs">
                    <button class="topfilms-tab ${this.sortBy === "watches" ? "topfilms-tab--active" : ""}" data-sort="watches">
                        <i data-feather="eye"></i> Terpopuler
                    </button>
                    <button class="topfilms-tab ${this.sortBy === "rating" ? "topfilms-tab--active" : ""}" data-sort="rating">
                        <i data-feather="star"></i> Rating Tertinggi
                    </button>
                    <button class="topfilms-tab ${this.sortBy === "reviews" ? "topfilms-tab--active" : ""}" data-sort="reviews">
                        <i data-feather="message-square"></i> Terbanyak Ulasan
                    </button>
                </div>
            </div>

            ${sorted.length > 0 ? `
                <div class="topfilms-list">
                    ${sorted.map((f, i) => {
                        const rankClass = i === 0 ? "topfilms-item__rank--1" : i === 1 ? "topfilms-item__rank--2" : i === 2 ? "topfilms-item__rank--3" : "topfilms-item__rank--default";
                        const genreNames = (f.genres || []).map((g) => this._getGenreName(g)).filter(Boolean).join(", ");

                        return `
                            <div class="topfilms-item">
                                <div class="topfilms-item__rank ${rankClass}">${i + 1}</div>
                                <img class="topfilms-item__poster" src="${f.poster}" alt="${f.title}" onerror="this.style.display='none'" />
                                <div class="topfilms-item__info">
                                    <div class="topfilms-item__title">${f.title}</div>
                                    <div class="topfilms-item__meta">
                                        <span>${new Date(f.releaseDate).getFullYear()}</span>
                                        <span><i data-feather="clock"></i> ${f.duration} mnt</span>
                                        ${genreNames ? `<span>${genreNames}</span>` : ""}
                                        <span>${f.videoQuality?.slice(-1)[0] || "HD"}</span>
                                    </div>
                                </div>
                                <div class="topfilms-item__stats">
                                    <div class="topfilms-item__stat">
                                        <div class="topfilms-item__stat-value topfilms-item__stat-value--rating">
                                            <i data-feather="star"></i> ${f.averageRating}
                                        </div>
                                        <div class="topfilms-item__stat-label">Rating</div>
                                    </div>
                                    <div class="topfilms-item__stat">
                                        <div class="topfilms-item__stat-value topfilms-item__stat-value--watches">
                                            ${f.watchCount.toLocaleString("id-ID")}
                                        </div>
                                        <div class="topfilms-item__stat-label">Tontonan</div>
                                    </div>
                                    <div class="topfilms-item__stat">
                                        <div class="topfilms-item__stat-value topfilms-item__stat-value--reviews">
                                            ${f.reviewCount}
                                        </div>
                                        <div class="topfilms-item__stat-label">Ulasan</div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
            ` : `
                <div class="topfilms-empty">
                    <i data-feather="inbox"></i>
                    <div class="topfilms-empty__title">Belum ada data film</div>
                    <div class="topfilms-empty__desc">Film akan muncul setelah ditambahkan ke platform.</div>
                </div>
            `}
        `;

        feather.replace();
    }

    _bindEvents() {
        DOM.$("#managerTopFilmsPage")?.addEventListener("click", (e) => {
            const tab = e.target.closest(".topfilms-tab");
            if (!tab) return;

            this.sortBy = tab.dataset.sort;
            this._render();
            this._bindEvents();
        });
    }
}

export default ManagerTopFilmsPage;
