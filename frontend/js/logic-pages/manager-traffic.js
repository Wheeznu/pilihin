import { repositories, getDbReady } from "../../../backend/init.js";
import { DOM } from "../utils/dom.js";
import authService from "../../../backend/services/AuthService.js";

class ManagerTrafficPage {
    constructor() {
        this.period = "monthly";
        this._init();
    }

    async _init() {
        if (!authService.requireRole("manager", "/frontend/pages/main/login.html")) return;

        await getDbReady();

        this._render();
        this._bindEvents();
    }

    _generateTrafficData(period) {
        const now = new Date();
        const months = period === "daily" ? 1 : period === "weekly" ? 3 : 12;
        const points = period === "daily" ? 30 : months;
        const multiplier = period === "daily" ? 1 : months;

        const data = [];
        for (let i = points - 1; i >= 0; i--) {
            const d = new Date(now);
            if (period === "daily") d.setDate(d.getDate() - i);
            else d.setMonth(d.getMonth() - i);

            const base = 500 + Math.floor(Math.random() * 300);
            const visits = base * multiplier;
            const unique = Math.floor(visits * (0.4 + Math.random() * 0.2));
            const views = visits * (2 + Math.random() * 2);

            data.push({
                label: period === "daily" ? d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : d.toLocaleDateString("id-ID", { month: "short" }),
                visits,
                unique,
                views: Math.floor(views),
            });
        }

        return data;
    }

    _getHourlyDistribution() {
        return [
            { hour: "00-04", pct: 8, label: "Malam" },
            { hour: "04-08", pct: 5, label: "Subuh" },
            { hour: "08-12", pct: 22, label: "Pagi" },
            { hour: "12-16", pct: 28, label: "Siang" },
            { hour: "16-20", pct: 25, label: "Sore" },
            { hour: "20-24", pct: 12, label: "Malam" },
        ];
    }

    _getDeviceDistribution() {
        return [
            { name: "Mobile", icon: "smartphone", pct: 58 },
            { name: "Desktop", icon: "monitor", pct: 28 },
            { name: "Tablet", icon: "tablet", pct: 10 },
            { name: "Smart TV", icon: "tv", pct: 4 },
        ];
    }

    _render() {
        const container = DOM.$("#managerTrafficPage");
        if (!container) return;

        const trafficData = this._generateTrafficData(this.period);
        const hourly = this._getHourlyDistribution();
        const devices = this._getDeviceDistribution();

        const totalVisits = trafficData.reduce((s, d) => s + d.visits, 0);
        const totalUnique = trafficData.reduce((s, d) => s + d.unique, 0);
        const totalViews = trafficData.reduce((s, d) => s + d.views, 0);
        const avgDuration = "4m 32s";
        const maxVisits = Math.max(...trafficData.map((d) => d.visits), 1);

        const films = repositories.films.findPublished().sort((a, b) => b.watchCount - a.watchCount).slice(0, 5);

        container.innerHTML = `
            <div class="traffic-header">
                <div>
                    <h1 class="traffic-header__title">
                        <i data-feather="trending-up"></i> Statistik Trafik
                    </h1>
                    <p class="traffic-header__subtitle">Analisis kunjungan dan aktivitas pengguna platform</p>
                </div>
                <div class="traffic-period">
                    <button class="traffic-period__btn ${this.period === "daily" ? "traffic-period__btn--active" : ""}" data-period="daily">30 Hari</button>
                    <button class="traffic-period__btn ${this.period === "weekly" ? "traffic-period__btn--active" : ""}" data-period="weekly">3 Bulan</button>
                    <button class="traffic-period__btn ${this.period === "monthly" ? "traffic-period__btn--active" : ""}" data-period="monthly">12 Bulan</button>
                </div>
            </div>

            <div class="traffic-overview">
                <div class="traffic-card">
                    <div class="traffic-card__header">
                        <div class="traffic-card__icon traffic-card__icon--visits">
                            <i data-feather="users"></i>
                        </div>
                        <span class="traffic-card__trend traffic-card__trend--up">+${Math.floor(Math.random() * 15 + 5)}%</span>
                    </div>
                    <div class="traffic-card__value">${totalVisits.toLocaleString("id-ID")}</div>
                    <div class="traffic-card__label">Total Kunjungan</div>
                </div>
                <div class="traffic-card">
                    <div class="traffic-card__header">
                        <div class="traffic-card__icon traffic-card__icon--unique">
                            <i data-feather="user-check"></i>
                        </div>
                        <span class="traffic-card__trend traffic-card__trend--up">+${Math.floor(Math.random() * 12 + 3)}%</span>
                    </div>
                    <div class="traffic-card__value">${totalUnique.toLocaleString("id-ID")}</div>
                    <div class="traffic-card__label">Pengunjung Unik</div>
                </div>
                <div class="traffic-card">
                    <div class="traffic-card__header">
                        <div class="traffic-card__icon traffic-card__icon--views">
                            <i data-feather="eye"></i>
                        </div>
                        <span class="traffic-card__trend traffic-card__trend--up">+${Math.floor(Math.random() * 20 + 8)}%</span>
                    </div>
                    <div class="traffic-card__value">${totalViews.toLocaleString("id-ID")}</div>
                    <div class="traffic-card__label">Tayangan Halaman</div>
                </div>
                <div class="traffic-card">
                    <div class="traffic-card__header">
                        <div class="traffic-card__icon traffic-card__icon--duration">
                            <i data-feather="clock"></i>
                        </div>
                    </div>
                    <div class="traffic-card__value">${avgDuration}</div>
                    <div class="traffic-card__label">Rata-Rata Durasi</div>
                </div>
            </div>

            <div class="traffic-grid">
                <div class="traffic-section">
                    <div class="traffic-section__header">
                        <h3 class="traffic-section__title"><i data-feather="activity"></i> Tren Kunjungan</h3>
                    </div>
                    <div class="traffic-section__body">
                        <div class="traffic-chart">
                            ${trafficData.map((d) => `
                                <div class="traffic-chart__bar traffic-chart__bar--visits" style="height: ${(d.visits / maxVisits) * 100}%" data-tooltip="${d.visits.toLocaleString("id-ID")} kunjungan"></div>
                            `).join("")}
                        </div>
                        <div class="traffic-chart__labels">
                            ${trafficData.filter((_, i) => i % Math.ceil(trafficData.length / 6) === 0 || i === trafficData.length - 1).map((d) => `
                                <div class="traffic-chart__label">${d.label}</div>
                            `).join("")}
                        </div>
                    </div>
                </div>

                <div class="traffic-section">
                    <div class="traffic-section__header">
                        <h3 class="traffic-section__title"><i data-feather="clock"></i> Jam Sibuk</h3>
                    </div>
                    <div class="traffic-section__body">
                        <div class="traffic-hour-grid">
                            ${hourly.map((h) => {
                                let cls = "traffic-hour-item";
                                if (h.pct >= 25) cls += " traffic-hour-item--peak";
                                else if (h.pct <= 8) cls += " traffic-hour-item--low";
                                return `
                                    <div class="${cls}">
                                        <div class="traffic-hour-item__value">${h.pct}%</div>
                                        <div class="traffic-hour-item__label">${h.hour}</div>
                                    </div>
                                `;
                            }).join("")}
                        </div>
                    </div>
                </div>

                <div class="traffic-section">
                    <div class="traffic-section__header">
                        <h3 class="traffic-section__title"><i data-feather="film"></i> Film Paling Banyak Ditonton</h3>
                    </div>
                    <div class="traffic-section__body">
                        ${films.length > 0 ? `
                            ${films.map((f, i) => `
                                <div class="traffic-top-film">
                                    <span class="traffic-top-film__rank">${i + 1}</span>
                                    <img class="traffic-top-film__poster" src="${f.poster}" alt="${f.title}" onerror="this.style.display='none'" />
                                    <div class="traffic-top-film__info">
                                        <div class="traffic-top-film__title">${f.title}</div>
                                        <div class="traffic-top-film__meta">${f.duration} mnt</div>
                                    </div>
                                    <div class="traffic-top-film__views">${f.watchCount.toLocaleString("id-ID")}</div>
                                </div>
                            `).join("")}
                        ` : `
                            <div class="traffic-empty">
                                <i data-feather="film"></i>
                                <div class="traffic-empty__title">Belum ada data</div>
                            </div>
                        `}
                    </div>
                </div>

                <div class="traffic-section">
                    <div class="traffic-section__header">
                        <h3 class="traffic-section__title"><i data-feather="smartphone"></i> Perangkat</h3>
                    </div>
                    <div class="traffic-section__body">
                        <div class="traffic-device">
                            ${devices.map((d) => `
                                <div class="traffic-device__item">
                                    <div class="traffic-device__icon">
                                        <i data-feather="${d.icon}"></i>
                                    </div>
                                    <div class="traffic-device__info">
                                        <div class="traffic-device__name">${d.name}</div>
                                        <div class="traffic-device__bar">
                                            <div class="traffic-device__fill" style="width: ${d.pct}%"></div>
                                        </div>
                                    </div>
                                    <div class="traffic-device__pct">${d.pct}%</div>
                                </div>
                            `).join("")}
                        </div>
                    </div>
                </div>
            </div>
        `;

        feather.replace();
    }

    _bindEvents() {
        DOM.$("#managerTrafficPage")?.addEventListener("click", (e) => {
            const btn = e.target.closest(".traffic-period__btn");
            if (!btn) return;

            this.period = btn.dataset.period;
            this._render();
            this._bindEvents();
        });
    }
}

export default ManagerTrafficPage;
