import { DOM } from "../utils/dom.js";

const GENRE_ICONS = {
    "genre-001": "smile",
    "genre-002": "camera",
    "genre-003": "heart",
    "genre-004": "alert-triangle",
    "genre-005": "zap",
};

const FALLBACK_ICON = "film";

class GenrePage {
    constructor() {
        this._init();
    }

    async _init() {
        try {
            this._render();
            feather.replace();
        } catch (err) {
            console.warn("GenrePage: retrying...", err);
            setTimeout(() => this._init(), 500);
        }
    }

    _getDb() {
        const raw = localStorage.getItem("pilih-in-db");
        return raw ? JSON.parse(raw) : null;
    }

    _render() {
        const db = this._getDb();
        const grid = DOM.$("#genreList");
        if (!grid) return;

        const genres = db?.genres?.length
            ? db.genres
            : [
                  { id: "genre-001", name: "Comedy", slug: "comedy", description: "Film komedi yang menghibur" },
                  { id: "genre-002", name: "Drama", slug: "drama", description: "Film drama penuh emosi" },
                  { id: "genre-003", name: "Romance", slug: "romance", description: "Film roman tentang cinta" },
                  { id: "genre-004", name: "Horror", slug: "horror", description: "Film horor yang menegangkan" },
                  { id: "genre-005", name: "Action", slug: "action", description: "Film aksi penuh adrenalin" },
              ];

        const films = db?.films?.filter((f) => f.status === "published") || [];

        grid.innerHTML = genres
            .map((g) => {
                const count = films.filter((f) => f.genres?.includes(g.id)).length;
                const icon = GENRE_ICONS[g.id] || FALLBACK_ICON;
                const desc = g.description || `Jelajahi film ${g.name} terbaik`;
                return `
                    <a class="genre-card" href="/frontend/pages/film/katalog.html?genre=${g.id}" title="Lihat film ${g.name}">
                        <div class="genre-icon-wrapper">
                            <i data-feather="${icon}"></i>
                        </div>
                        <span class="genre-name">${g.name}</span>
                        <span class="genre-desc">${desc}</span>
                        <span class="genre-count">${count} film</span>
                    </a>
                `;
            })
            .join("");
    }
}

export default GenrePage;
