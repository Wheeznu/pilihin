import { repositories, getDbReady } from "../../../backend/init.js";
import { DOM } from "../utils/dom.js";

class HomePage {
    constructor() {
        this._init();
    }

    async _init(retries = 0) {
        try {
            await getDbReady();
            const films = repositories.films.findPublished();
            const articles = repositories.articles.findLatest(6);
            const news = repositories.news.findLatest(6);
            this._renderHero(films);
            this._renderTrending(films);
            this._renderLatest(films);
            this._renderArticles(articles);
            this._renderNews(news);
            this._bindCardClicks();
        } catch (err) {
            if (retries < 5) {
                console.warn("HomePage: data belum siap, retrying...", err);
                setTimeout(() => this._init(retries + 1), 500);
            } else {
                console.error("HomePage: gagal setelah 5 percobaan", err);
            }
        }
    }

    _bindCardClicks() {
        document.addEventListener("click", (e) => {
            const card = e.target.closest(".film-card[data-film-id]");
            if (!card) return;
            const filmId = card.dataset.filmId;
            window.location.href = `/frontend/pages/film/detail.html#${filmId}`;
        });
    }

    _getGenres() {
        const db = JSON.parse(localStorage.getItem("pilih-in-db"));
        return db?.genres || [];
    }

    _genreNames(genreIds) {
        if (!genreIds) return "";
        const genres = this._getGenres();
        return genreIds
            .map((id) => genres.find((g) => g.id === id)?.name)
            .filter(Boolean)
            .join(", ");
    }

    _renderHero(films) {
        const carousel = document.getElementById('heroCarousel');
        if (!carousel) return;

        // Ambil top 5 film terbaik
        const featured = [...films]
            .sort((a, b) => (b.averageRating || 0) * 10 + (b.watchCount || 0) - ((a.averageRating || 0) * 10 + (a.watchCount || 0)))
            .slice(0, 5);

        if (!featured.length) return;

        const track = document.getElementById('heroTrack');
        const dotsEl = document.getElementById('heroDots');

        track.innerHTML = featured.map((film, i) => this._heroSlideHTML(film, i)).join('');
        dotsEl.innerHTML = featured
            .map((_, i) => `<button class="hero-dot ${i === 0 ? '--active' : ''}" data-index="${i}" aria-label="Slide ${i + 1}"></button>`)
            .join('');

        feather.replace();
        this._initCarousel(featured.length);
    }

    _heroSlideHTML(film, index) {
        const genreNames = this._genreNames(film.genres);
        const year = film.releaseDate ? new Date(film.releaseDate).getFullYear() : "-";
        const qArr = film.videoQuality || []; const quality = qArr.length > 2 ? qArr[2 + Math.floor(Math.random() * (qArr.length - 2))] : qArr[qArr.length - 1] || 'HD';

        return `
            <div class="hero-slide ${index === 0 ? '--active' : ''}" data-slide="${index}">
                <div class="hero-slide__bg">
                    <img
                        src="${film.banner || film.poster}"
                        alt="${film.title}"
                        loading="${index === 0 ? 'eager' : 'lazy'}"
                        onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(film.title)}&background=121212&color=1db954&size=1280'"
                    />
                </div>
                <div class="hero-slide__gradient"></div>
                <div class="hero-slide__content">
                    <div class="hero__badge">
                        <i data-feather="trending-up"></i>
                        Trending #${index + 1}
                    </div>
                    <h1 class="hero__title">${film.title}</h1>
                    <div class="hero__meta">
                        <span>${year}</span>
                        <span>&bull;</span>
                        <span>${film.duration || "-"} mnt</span>
                        <span>&bull;</span>
                        <span>${quality}</span>
                        ${genreNames ? `<span>&bull;</span><span>${genreNames}</span>` : ''}
                    </div>
                    <p class="hero__description">${film.description || ''}</p>
                    <div class="hero__actions">
                        <a href="/frontend/pages/film/detail.html#${film.id}" class="btn btn-primary btn-lg">
                            <i data-feather="play-circle"></i> Tonton Sekarang
                        </a>
                        <a href="/frontend/pages/film/detail.html#${film.id}?info" class="btn btn-ghost btn-lg">
                            <i data-feather="info"></i> Selengkapnya
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    _initCarousel(total) {
        const DURATION = 15000;
        let current = 0;
        let paused = false;
        let timer = null;

        const carousel = document.getElementById('heroCarousel');
        const dots = () => document.querySelectorAll('.hero-dot');
        const slides = () => document.querySelectorAll('.hero-slide');

        const startTimer = () => {
            if (timer) clearTimeout(timer);
            if (total <= 1) return;
            timer = setTimeout(() => {
                if (paused) return;
                goTo(current + 1);
            }, DURATION);
        };

        const stopTimer = () => {
            if (timer) clearTimeout(timer);
            timer = null;
        };

        const goTo = (index) => {
            slides()[current].classList.remove('--active');
            dots()[current].classList.remove('--active');
            current = (index + total) % total;
            slides()[current].classList.add('--active');
            dots()[current].classList.add('--active');
            feather.replace();
            startTimer();
        };

        // Dot click
        carousel.addEventListener('click', (e) => {
            const dot = e.target.closest('.hero-dot');
            if (!dot) return;
            goTo(parseInt(dot.dataset.index, 10));
        });

        // Pause on hover
        carousel.addEventListener('mouseenter', () => { paused = true; stopTimer(); });
        carousel.addEventListener('mouseleave', () => {
            paused = false;
            startTimer();
        });

        startTimer();
    }

    _renderTrending(films) {
        const grid = DOM.$("#trendingGrid");
        if (!grid) return;

        const trending = films
            .sort((a, b) => b.watchCount - a.watchCount);

        grid.innerHTML = trending.map((f) => this._filmCardHTML(f)).join("");
        feather.replace();
    }

    _renderLatest(films) {
        const grid = DOM.$("#latestGrid");
        if (!grid) return;

        const latest = films
            .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));

        grid.innerHTML = latest.map((f) => this._filmCardHTML(f)).join("");
        feather.replace();
    }

    _filmCardHTML(film) {
        const genreNames = this._genreNames(film.genres);
        const qArr = film.videoQuality || []; const quality = qArr.length > 2 ? qArr[2 + Math.floor(Math.random() * (qArr.length - 2))] : qArr[qArr.length - 1] || "HD";
        const year = film.releaseDate ? new Date(film.releaseDate).getFullYear() : "-";
        const rating = film.averageRating || film.rating || "-";

        return `
            <div class="film-card" data-film-id="${film.id}">
                <div class="film-card__poster">
                    <img src="${film.poster}" alt="${film.title}" loading="lazy" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(film.title)}&background=1db954&color=fff&size=400'" />
                    
                    <span class="film-card__rating">
                        <i data-feather="star" style="width:12px;height:12px;fill:currentColor"></i> ${rating}
                    </span>
                    
                    <span class="film-card__quality">${quality}</span>

                    <div class="film-card__overlay">
                        <div class="film-card__play-btn">
                            <i data-feather="play" style="margin-left: 2px"></i>
                        </div>
                    </div>
                </div>
                <div class="film-card__info">
                    <h3 class="film-card__title">${film.title}</h3>
                    <div class="film-card__meta">
                        <span>${year}</span>
                        <span>${film.duration || "-"} mnt</span>
                    </div>
                    <p class="film-card__genre">${genreNames}</p>
                </div>
            </div>
        `;
    }
    _renderArticles(articles) {
        const grid = document.getElementById('articleGrid');
        if (!grid) return;
        if (!articles.length) {
            grid.innerHTML = '<p style="color:var(--text-muted);padding:var(--space-md)">Belum ada artikel.</p>';
            return;
        }
        grid.innerHTML = articles.map((a) => this._contentCardHTML(a, 'article')).join('');
        feather.replace();
    }

    _renderNews(news) {
        const grid = document.getElementById('newsGrid');
        if (!grid) return;
        if (!news.length) {
            grid.innerHTML = '<p style="color:var(--text-muted);padding:var(--space-md)">Belum ada berita.</p>';
            return;
        }
        grid.innerHTML = news.map((n) => this._contentCardHTML(n, 'news')).join('');
        feather.replace();
    }

    _contentCardHTML(item, type) {
        const date = new Date(item.publishedAt || item.createdAt);
        const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        const views = (item.views || 0).toLocaleString('id-ID');
        const href = `/frontend/pages/main/artikel-detail.html?id=${item.slug || item.id}`;
        const fallbackImg = `https://picsum.photos/seed/${item.id}/800/400`;

        return `
            <a class="content-card" href="${href}">
                <div class="content-card__image">
                    <img
                        src="${item.coverImage || fallbackImg}"
                        alt="${item.title}"
                        loading="lazy"
                        onerror="this.src='${fallbackImg}'"
                    />
                    <span class="content-card__category">${item.category || 'Artikel'}</span>
                </div>
                <div class="content-card__body">
                    <h3 class="content-card__title">${item.title}</h3>
                    <p class="content-card__excerpt">${item.excerpt || item.content || ''}</p>
                    <div class="content-card__meta">
                        <i data-feather="calendar" style="width:12px;height:12px"></i>
                        <span>${dateStr}</span>
                        <span class="content-card__meta-dot"></span>
                        <i data-feather="eye" style="width:12px;height:12px"></i>
                        <span>${views}</span>
                    </div>
                </div>
            </a>
        `;
    }
}

export default HomePage;
