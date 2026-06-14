import { repositories } from "../../../backend/init.js";
import { DOM } from "../utils/dom.js";

class HomePage {
    constructor() {
        this._init();
    }

    async _init() {
        try {
            const films = repositories.films.findPublished();
            const articles = repositories.articles.findLatest(6);
            const news = repositories.news.findLatest(6);
            this._renderHero(films);
            this._renderPromoBanner();
            this._renderTrending(films);
            this._renderLatest(films);
            this._renderArticles(articles);
            this._renderNews(news);
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
        const carousel = document.getElementById('heroCarousel');
        if (!carousel) return;

        // Ambil top 5 film terbaik
        const featured = [...films]
            .sort((a, b) => b.averageRating * 10 + b.watchCount - (a.averageRating * 10 + a.watchCount))
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
        const year = new Date(film.releaseDate).getFullYear();
        const quality = film.videoQuality?.[0] || 'HD';

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
                        <span>${film.duration} mnt</span>
                        <span>&bull;</span>
                        <span>${quality}</span>
                        ${genreNames ? `<span>&bull;</span><span>${genreNames}</span>` : ''}
                    </div>
                    <p class="hero__description">${film.description || ''}</p>
                    <div class="hero__actions">
                        <a href="#" class="btn btn-primary btn-lg">
                            <i data-feather="play-circle"></i> Tonton Sekarang
                        </a>
                        <a href="#" class="btn btn-ghost btn-lg">
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
        let tick = 0;

        const carousel = document.getElementById('heroCarousel');
        const progressBar = document.getElementById('heroProgress');
        const dots = () => document.querySelectorAll('.hero-dot');
        const slides = () => document.querySelectorAll('.hero-slide');

        const goTo = (index) => {
            slides()[current].classList.remove('--active');
            dots()[current].classList.remove('--active');
            current = (index + total) % total;
            slides()[current].classList.add('--active');
            dots()[current].classList.add('--active');
            feather.replace();
            animateProgress();
        };

        const animateProgress = () => {
            if (!progressBar) return;
            tick++;
            const id = tick;
            progressBar.style.transition = 'none';
            progressBar.style.width = '0%';
            void progressBar.offsetWidth;
            progressBar.style.transition = `width ${DURATION}ms linear`;
            progressBar.style.width = '100%';

            setTimeout(() => {
                if (id !== tick) return;
                if (paused || total <= 1) return;
                goTo(current + 1);
            }, DURATION);
        };

        carousel.addEventListener('click', (e) => {
            const dot = e.target.closest('.hero-dot');
            if (!dot) return;
            goTo(parseInt(dot.dataset.index, 10));
        });

        carousel.addEventListener('mouseenter', () => { paused = true; });
        carousel.addEventListener('mouseleave', () => {
            paused = false;
            if (tick > 0) animateProgress();
        });

        animateProgress();
    }

    _renderTrending(films) {
        const grid = DOM.$("#trendingGrid");
        if (!grid) return;

        const trending = [...films]
            .sort((a, b) => b.watchCount - a.watchCount)
            .slice(0, 8);

        grid.innerHTML = trending.map((f) => this._filmCardHTML(f)).join("");
        feather.replace();
    }

    _renderLatest(films) {
        const grid = DOM.$("#latestGrid");
        if (!grid) return;

        const latest = [...films]
            .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
            .slice(0, 8);

        grid.innerHTML = latest.map((f) => this._filmCardHTML(f)).join("");
        feather.replace();
    }

    _filmCardHTML(film) {
        const genreNames = this._genreNames(film.genres);
        const quality = film.videoQuality?.[0] || "HD";

        return `
            <div class="film-card" data-film-id="${film.id}">
                <div class="film-card__poster">
                    <img src="${film.poster}" alt="${film.title}" loading="lazy" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(film.title)}&background=1db954&color=fff&size=400'" />
                    
                    <span class="film-card__rating">
                        <i data-feather="star" style="width:12px;height:12px;fill:currentColor"></i> ${film.averageRating}
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
                        <span>${new Date(film.releaseDate).getFullYear()}</span>
                        <span>${film.duration} mnt</span>
                    </div>
                    <p class="film-card__genre">${genreNames}</p>
                </div>
            </div>
        `;
    }
    _renderPromoBanner() {
        const container = document.getElementById('promo-banner-container');
        if (!container) return;
        container.innerHTML = `
            <div class="promo-banner">
                <div>
                    <div class="promo-banner__badge">
                        <i data-feather="tag"></i>
                        Penawaran Spesial
                    </div>
                    <h2 class="promo-banner__title">Akses 500+ Film Premium<br>Mulai Rp 15.000/bulan</h2>
                    <p class="promo-banner__subtitle">Daftar sekarang dan nikmati 7 hari gratis tanpa syarat</p>
                </div>
                <div class="promo-banner__action">
                    <a href="/frontend/pages/main/pricing.html" class="btn btn-primary btn-lg">
                        <i data-feather="arrow-right"></i> Mulai Sekarang
                    </a>
                </div>
            </div>
        `;
        feather.replace();
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
        const href = type === 'article'
            ? `/frontend/pages/main/artikel.html#${item.slug || item.id}`
            : `/frontend/pages/main/berita.html#${item.slug || item.id}`;
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
