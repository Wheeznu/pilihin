import authService from "../../../backend/services/AuthService.js";
import { UserData } from "../utils/user-data.js";

class FavoritesFilmPage {
    constructor() {
        this._user     = null;
        this._allFilms = [];
        this._genres   = [];
        this._favorites = [];
        this._init();
    }

    async _init() {
        if (!authService.requireAuth()) return;
        this._user = await authService.getCurrentUser();
        if (!this._user) {
            window.location.href = "/frontend/pages/main/login.html";
            return;
        }
        await this._loadData();
        this._renderPage();
        this._bindEvents();
        feather.replace();
    }

    async _loadData() {
        try {
            const [fR, gR, favData] = await Promise.all([
                fetch("/data/data-film.json"),
                fetch("/data/genres.json"),
                UserData.get("favorites"),
            ]);
            const [fd, gd] = await Promise.all([fR.json(), gR.json()]);
            this._allFilms  = fd.films || fd || [];
            this._genres    = gd.genres || gd || [];
            this._favorites = favData || [];
        } catch {
            this._allFilms = []; this._genres = []; this._favorites = [];
        }
    }

    _getSession() {
        try { return JSON.parse(localStorage.getItem("pilih-in-session")); } catch { return null; }
    }

    _getFavFilms() {
        const session = this._getSession();
        if (!session) return [];
        const userId = session.userId || session.id;
        return (this._favorites || [])
            .filter(r => r.userId === userId)
            .map(r => this._allFilms.find(f => f.id === r.filmId))
            .filter(Boolean);
    }

    async _removeFilm(filmId) {
        const session = this._getSession();
        if (!session) return;
        const userId = session.userId || session.id;
        this._favorites = (this._favorites || []).filter(
            r => !(r.userId === userId && r.filmId === filmId)
        );
        await UserData.set("favorites", this._favorites);
    }

    _renderPage() {
        const main = document.getElementById("favoritesFilmMain");
        if (!main) return;

        const films = this._getFavFilms();

        main.innerHTML = `
            <div class="user-page">

                <div class="page-header">
                    <div class="page-header__text">
                        <h1 class="page-header__title">Film Favorit</h1>
                        <p class="page-header__subtitle">Film yang kamu sukai</p>
                        ${films.length > 0 ? `<div class="page-header__count">
                            <i data-feather="heart"></i> ${films.length} film
                        </div>` : ""}
                    </div>
                    ${films.length > 0 ? `<a href="/frontend/pages/film/katalog.html" class="btn btn-ghost">
                        <i data-feather="film"></i> Jelajahi Film
                    </a>` : ""}
                </div>

                ${this._filmGridHTML(films)}

            </div>`;
    }

    _filmGridHTML(films) {
        if (!films.length) return this._emptyHTML(
            "film favorit",
            "Buka halaman film dan klik &#9829; Favorit untuk menambahkan."
        );

        return `<div class="fav-film-grid">${films.map(film => {
            const genreNames = (film.genres || [])
                .map(id => this._genres.find(g => g.id === id)?.name || id)
                .slice(0, 2).join(", ");
            const quality = film.videoQuality?.[0] || "HD";
            const rating  = film.averageRating || film.rating || "-";

            return `
            <div class="film-card" data-film-id="${film.id}">
                <button class="btn-remove-fav" data-type="film" data-id="${film.id}" title="Hapus dari favorit">
                    <i data-feather="x"></i>
                </button>
                <a href="/frontend/pages/film/detail.html#${film.id}" style="text-decoration:none;display:contents">
                    <div class="film-card__poster">
                        <img src="${film.poster || ""}" alt="${film.title}"
                             onerror="this.src='https://picsum.photos/seed/${film.id}/300/450'">
                        <div class="film-card__rating"><i data-feather="star"></i> ${rating}</div>
                        <div class="film-card__quality">${quality}</div>
                        <div class="film-card__overlay">
                            <div class="film-card__play-btn">
                                <i data-feather="play"></i>
                            </div>
                        </div>
                    </div>
                    <div class="film-card__info">
                        <h3 class="film-card__title">${film.title}</h3>
                        <p class="film-card__genre">${genreNames}</p>
                    </div>
                </a>
            </div>`;
        }).join("")}</div>`;
    }

    _emptyHTML(label, desc) {
        return `
            <div class="fav-empty">
                <i data-feather="heart"></i>
                <p class="fav-empty__title">Belum ada ${label}</p>
                <p class="fav-empty__desc">${desc}</p>
            </div>`;
    }

    _bindEvents() {
        const main = document.getElementById("favoritesFilmMain");

        main?.addEventListener("click", async e => {
            const btn = e.target.closest(".btn-remove-fav");
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            const filmId = btn.dataset.id;
            await this._removeFilm(filmId);
            this._renderPage();
            feather.replace();
            this._toast("Dihapus dari favorit.", "success");
        });
    }

    _toast(message, type = "success") {
        document.querySelector(".toast")?.remove();
        const icons = { success: "check-circle", error: "alert-circle" };
        const t = document.createElement("div");
        t.className = `toast toast--${type}`;
        t.innerHTML = `<i data-feather="${icons[type]}"></i><span>${message}</span>`;
        document.body.appendChild(t);
        feather.replace();
        requestAnimationFrame(() => t.classList.add("toast--visible"));
        setTimeout(() => { t.classList.remove("toast--visible"); setTimeout(() => t.remove(), 350); }, 3000);
    }
}

export default FavoritesFilmPage;
