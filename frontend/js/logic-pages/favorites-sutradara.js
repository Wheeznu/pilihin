import authService from "../../../backend/services/AuthService.js";

const KEY_DIRECTORS = "pilih-in-favorites-directors";

class FavoritesSutradaraPage {
    constructor() {
        this._user     = null;
        this._allDirs  = [];
        this._allFilms = [];
        this._genres   = [];
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
            const [fR, dR, gR] = await Promise.all([
                fetch("/data/data-film.json"),
                fetch("/data/data-director.json"),
                fetch("/data/genres.json"),
            ]);
            const [fd, dd, gd] = await Promise.all([fR.json(), dR.json(), gR.json()]);
            this._allFilms = fd.films || fd  || [];
            this._allDirs  = dd.directors || dd  || [];
            this._genres   = gd.genres || gd  || [];
        } catch {
            this._allFilms = []; this._allDirs = []; this._genres = [];
        }
    }

    _getFavDirs() {
        try {
            const names = JSON.parse(localStorage.getItem(KEY_DIRECTORS)) || [];
            return names.map(n => this._allDirs.find(d => d.name === n)).filter(Boolean);
        } catch { return []; }
    }

    _removeDirector(name) {
        try {
            const names = JSON.parse(localStorage.getItem(KEY_DIRECTORS)) || [];
            localStorage.setItem(KEY_DIRECTORS, JSON.stringify(names.filter(n => n !== name)));
        } catch { /* ignore */ }
    }

    _addDirector(name) {
        try {
            const names = JSON.parse(localStorage.getItem(KEY_DIRECTORS)) || [];
            if (!names.includes(name)) {
                names.push(name);
                localStorage.setItem(KEY_DIRECTORS, JSON.stringify(names));
            }
            this._toast(`${name} ditambahkan ke favorit.`, "success");
        } catch { /* ignore */ }
    }

    _renderPage() {
        const main = document.getElementById("favoritesSutradaraMain");
        if (!main) return;

        const dirs = this._getFavDirs();

        const countHTML = dirs.length
            ? `<div class="page-header__count"><i data-feather="camera"></i> ${dirs.length} Sutradara</div>`
            : "";

        main.innerHTML = `
            <div class="user-page">

                <div class="page-header">
                    <div class="page-header__text">
                        <h1 class="page-header__title">Sutradara Favorit</h1>
                        <p class="page-header__subtitle">Sutradara yang kamu sukai</p>
                        ${countHTML}
                    </div>
                </div>

                <div class="fav-search-bar">
                    <div class="fav-search-input-wrap">
                        <i data-feather="search" class="fav-search-icon"></i>
                        <input type="text" id="inputSearchSutradara" class="fav-search-input"
                            placeholder="Cari nama sutradara..." autocomplete="off">
                    </div>
                    <div class="fav-search-dropdown" id="dropdownSutradara"></div>
                </div>

                <div id="sectionSutradara">
                    ${this._personGridHTML(dirs)}
                </div>

                <!-- MODAL -->
                <div class="fav-modal-overlay" id="personFilmsOverlay">
                    <div class="fav-modal" id="personFilmsModal">
                        <div class="fav-modal__header">
                            <div class="fav-modal__title-wrap">
                                <img class="fav-modal__avatar" id="modalPersonPhoto" src="" alt="">
                                <div>
                                    <h3 class="fav-modal__name" id="modalPersonName"></h3>
                                    <p class="fav-modal__meta" id="modalPersonMeta"></p>
                                </div>
                            </div>
                            <div class="fav-modal__header-actions">
                                <a class="btn btn-primary btn-sm fav-modal__detail-btn" id="btnDetailPerson" href="#">
                                    <i data-feather="user"></i>
                                    <span id="btnDetailPersonLabel">Detail Sutradara</span>
                                </a>
                                <button class="fav-modal__close" id="btnCloseModal">
                                    <i data-feather="x"></i>
                                </button>
                            </div>
                        </div>
                        <div class="fav-modal__body">
                            <p class="fav-modal__section-label">Film yang disutradarai</p>
                            <div class="fav-modal__film-grid" id="modalFilmGrid"></div>
                        </div>
                    </div>
                </div>

            </div>`;
    }

    _personGridHTML(persons) {
        if (!persons.length) {
            return `
                <div class="fav-empty">
                    <i data-feather="heart"></i>
                    <p class="fav-empty__title">Belum ada sutradara favorit</p>
                    <p class="fav-empty__desc">Cari nama sutradara di kolom pencarian di atas untuk menambahkan.</p>
                </div>`;
        }

        return `<div class="fav-person-grid">${persons.map(p => `
            <div class="fav-person-card" data-person-name="${p.name}" data-person-type="sutradara">
                <button class="btn-remove-person" data-type="sutradara" data-id="${p.name}"
                        title="Hapus dari favorit">
                    <i data-feather="x"></i>
                </button>
                <div class="fav-person-card__avatar-wrap">
                    <img class="fav-person-card__avatar" src="${p.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=1db954&color=fff&size=200`}" alt="${p.name}"
                         onerror="this.src=\`https://ui-avatars.com/api/?name=\${encodeURIComponent(this.alt)}&background=1db954&color=fff&size=200\`">
                </div>
                <div class="fav-person-card__body">
                    <p class="fav-person-card__name">${p.name}</p>
                    <p class="fav-person-card__meta">Sutradara · ${p.filmCount || "-"} film</p>
                </div>
            </div>`).join("")}</div>`;
    }

    _bindEvents() {
        const main = document.getElementById("favoritesSutradaraMain");

        main?.addEventListener("click", e => {
            const removeBtn = e.target.closest(".btn-remove-person");
            if (removeBtn) {
                e.preventDefault();
                e.stopPropagation();
                const name = removeBtn.dataset.id;
                this._removeDirector(name);
                this._renderPage();
                feather.replace();
                this._toast("Dihapus dari favorit.", "success");
                return;
            }

            const card = e.target.closest(".fav-person-card");
            if (!card) return;
            const name = card.dataset.personName;
            this._openPersonModal(name);
        });

        this._bindSearchBar();
        document.getElementById("btnCloseModal")?.addEventListener("click", () => this._closeModal());
        document.getElementById("personFilmsOverlay")?.addEventListener("click", e => {
            if (e.target.id === "personFilmsOverlay") this._closeModal();
        });
        document.addEventListener("keydown", e => {
            if (e.key === "Escape") this._closeModal();
        });
    }

    _bindSearchBar() {
        const input    = document.getElementById("inputSearchSutradara");
        const dropdown = document.getElementById("dropdownSutradara");
        if (!input || !dropdown) return;

        input.addEventListener("input", () => {
            const q = input.value.trim().toLowerCase();
            dropdown.innerHTML = "";
            if (!q) { dropdown.classList.remove("fav-search-dropdown--open"); return; }

            const favNames = this._getFavDirs().map(p => p.name);
            const results  = this._allDirs.filter(p => p.name.toLowerCase().includes(q)).slice(0, 8);

            if (!results.length) {
                dropdown.innerHTML = `<div class="fav-search-empty">Tidak ada hasil untuk "<strong>${input.value}</strong>"</div>`;
                dropdown.classList.add("fav-search-dropdown--open");
                return;
            }

            dropdown.innerHTML = results.map(p => {
                const already = favNames.includes(p.name);
                return `<div class="fav-search-item ${already ? "fav-search-item--added" : ""}"
                             data-name="${p.name}" data-type="sutradara">
                    <img class="fav-search-item__img" src="${p.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=1db954&color=fff&size=80`}" alt="${p.name}"
                         onerror="this.src=\`https://ui-avatars.com/api/?name=\${encodeURIComponent(this.alt)}&background=1db954&color=fff&size=80\`">
                    <div class="fav-search-item__info">
                        <span class="fav-search-item__name">${p.name}</span>
                        <span class="fav-search-item__meta">Sutradara · ${p.filmCount || "-"} film</span>
                    </div>
                    <button class="fav-search-item__btn ${already ? "fav-search-item__btn--added" : ""}"
                            data-name="${p.name}" data-type="sutradara">
                        <i data-feather="${already ? "check" : "plus"}"></i>
                        ${already ? "Ditambahkan" : "Tambah"}
                    </button>
                </div>`;
            }).join("");

            dropdown.classList.add("fav-search-dropdown--open");
            feather.replace();

            dropdown.querySelectorAll(".fav-search-item__btn").forEach(btn => {
                btn.addEventListener("click", e => {
                    e.stopPropagation();
                    const name  = btn.dataset.name;
                    const added = btn.classList.contains("fav-search-item__btn--added");
                    if (added) {
                        this._removeDirector(name);
                        btn.classList.remove("fav-search-item__btn--added");
                        btn.innerHTML = `<i data-feather="plus"></i> Tambah`;
                        btn.closest(".fav-search-item").classList.remove("fav-search-item--added");
                    } else {
                        this._addDirector(name);
                        btn.classList.add("fav-search-item__btn--added");
                        btn.innerHTML = `<i data-feather="check"></i> Ditambahkan`;
                        btn.closest(".fav-search-item").classList.add("fav-search-item--added");
                    }
                    document.getElementById("sectionSutradara").innerHTML = this._personGridHTML(this._getFavDirs());
                    document.getElementById("countSutradara").textContent = this._getFavDirs().length;
                    feather.replace();
                });
            });
        });

        document.addEventListener("click", e => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove("fav-search-dropdown--open");
            }
        });
    }

    _openPersonModal(name) {
        const person = this._allDirs.find(d => d.name === name);
        if (!person) return;

        const films = this._allFilms.filter(f =>
            (f.director || "").toLowerCase() === name.toLowerCase()
        );

        document.getElementById("modalPersonPhoto").src = person.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=1db954&color=fff&size=200`;
        document.getElementById("modalPersonPhoto").onerror = () => {
            document.getElementById("modalPersonPhoto").src =
                `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1db954&color=fff&size=200`;
        };
        document.getElementById("modalPersonName").textContent = name;
        document.getElementById("modalPersonMeta").textContent = `Sutradara · ${films.length} film ditemukan`;
        document.getElementById("btnDetailPerson").href = `/frontend/pages/film/sutradara.html?name=${encodeURIComponent(name)}`;
        document.getElementById("btnDetailPersonLabel").textContent = "Detail Sutradara";

        const grid = document.getElementById("modalFilmGrid");
        if (!films.length) {
            grid.innerHTML = `<p class="fav-modal__no-films">Belum ada film yang terdaftar untuk ${name}.</p>`;
        } else {
            grid.innerHTML = films.map(film => {
                const rating = film.averageRating || film.rating || "-";
                const quality = film.videoQuality?.[0] || "HD";
                return `
                    <a class="fav-modal__film-card" href="/frontend/pages/film/detail.html#${film.id}">
                        <div class="fav-modal__film-poster">
                            <img src="${film.poster || ""}" alt="${film.title}"
                                 onerror="this.src='https://picsum.photos/seed/${film.id}/300/450'">
                            <div class="fav-modal__film-quality">${quality}</div>
                            <div class="fav-modal__film-rating"><i data-feather="star"></i>${rating}</div>
                            <div class="fav-modal__film-overlay"><i data-feather="play"></i></div>
                        </div>
                        <p class="fav-modal__film-title">${film.title}</p>
                        <p class="fav-modal__film-year">${film.releaseDate ? film.releaseDate.slice(0,4) : "-"}</p>
                    </a>`;
            }).join("");
        }

        document.getElementById("personFilmsOverlay")?.classList.add("fav-modal-overlay--open");
        document.body.style.overflow = "hidden";
        feather.replace();
    }

    _closeModal() {
        document.getElementById("personFilmsOverlay")?.classList.remove("fav-modal-overlay--open");
        document.body.style.overflow = "";
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

    _fallback(name) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1db954&color=fff`;
    }
}

export default FavoritesSutradaraPage;