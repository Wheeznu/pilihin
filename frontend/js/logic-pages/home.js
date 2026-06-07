import { repositories } from "../../../backend/init.js";
import { DOM } from "../utils/dom.js";

class HomePage {
    constructor() {
        this._init();
    }

    async _init() {
        try {
            const films = repositories.films.findPublished();
            this._renderHero(films);
            this._renderTrending(films);
            this._renderLatest(films);
        } catch (err) {
            console.warn("HomePage: data belum siap, retrying...", err);
            setTimeout(() => this._init(), 500);
        }
    }

    _getGenres() {
        const db = JSON.parse(localStorage.getItem("pilih-in-db"));
        return db?.genres || [];
    }

    _genreNames(genreIds) {
        const genres = this._getGenres();
        return genreIds
            .map((id) => genres.find((g) => g.id === id)?.name)
            .filter(Boolean)
            .join(", ");
    }

    _renderHero(films) {
        const heroEl = DOM.$("#hero");
        if (!heroEl) return;

        const featured = films.sort(
            (a, b) => b.averageRating * 10 + b.watchCount - (a.averageRating * 10 + a.watchCount),
        )[0];

        if (!featured) return;

        const heroImg = DOM.$("#heroBg");
        heroImg.src = featured.banner || featured.poster;
        heroImg.onerror = () => { heroImg.src = featured.poster; };
        DOM.$("#heroTitle").textContent = featured.title;
        DOM.$("#heroMeta").textContent = `${new Date(featured.releaseDate).getFullYear()} • ${featured.duration} mnt • ${featured.videoQuality?.join(", ") || "HD"}`;
        DOM.$("#heroDescription").textContent = featured.description;
    }

    _renderTrending(films) {
        const grid = DOM.$("#trendingGrid");
        if (!grid) return;

        const trending = films
            .sort((a, b) => b.watchCount - a.watchCount)
            .slice(0, 8);

        grid.innerHTML = trending.map((f) => this._filmCardHTML(f)).join("");
        feather.replace();
    }

    _renderLatest(films) {
        const grid = DOM.$("#latestGrid");
        if (!grid) return;

        const latest = films
            .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
            .slice(0, 8);

        grid.innerHTML = latest.map((f) => this._filmCardHTML(f)).join("");
        feather.replace();
    }

    _filmCardHTML(film) {
        const genreNames = this._genreNames(film.genres);

        return `
            <div class="film-card" data-film-id="${film.id}">
                <div class="film-card__poster">
                    <img src="${film.poster}" alt="${film.title}" loading="lazy" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(film.title)}&background=1db954&color=fff&size=400'" />
                    <div class="film-card__overlay">
                        <span class="btn btn-primary btn-sm">
                            <i data-feather="play-circle"></i> Tonton
                        </span>
                    </div>
                    <span class="film-card__rating">
                        <i data-feather="star"></i> ${film.averageRating}
                    </span>
                </div>
                <div class="film-card__info">
                    <h3 class="film-card__title">${film.title}</h3>
                    <p class="film-card__meta">${new Date(film.releaseDate).getFullYear()} • ${film.duration} mnt</p>
                    <p class="film-card__genre">${genreNames}</p>
                </div>
            </div>
        `;
    }
}

export default HomePage;
