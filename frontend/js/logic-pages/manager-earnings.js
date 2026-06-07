import { getDbReady } from "../../../backend/init.js";
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

function _saveCollection(name, data) {
    try {
        const db = JSON.parse(localStorage.getItem(DB_KEY)) || {};
        db[name] = data;
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (err) {
        console.warn("Gagal menyimpan koleksi:", err);
    }
}

function _formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function _formatDate(iso) {
    return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function _formatShortDate(iso) {
    return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
    });
}

function _seedData() {
    const tiers = _getCollection("pricingTiers");
    if (tiers.length === 0) {
        _saveCollection("pricingTiers", [
            { id: "tier-001", name: "Free", price: 0, billingPeriod: "permanen", maxQuality: "720p", hasAds: true, sortOrder: 1, status: "active" },
            { id: "tier-002", name: "Basic", price: 35000, billingPeriod: "bulanan", maxQuality: "720p", hasAds: true, sortOrder: 2, status: "active" },
            { id: "tier-003", name: "Standard", price: 65000, billingPeriod: "bulanan", maxQuality: "1080p", hasAds: false, sortOrder: 3, status: "active" },
            { id: "tier-004", name: "Premium", price: 125000, billingPeriod: "bulanan", maxQuality: "4K", hasAds: false, sortOrder: 4, status: "active" },
        ]);
    }

    const existing = _getCollection("transactions");
    if (existing.length > 0) return;

    const users = _getCollection("users").filter((u) => u.role === "user");
    if (users.length === 0) return;

    const pricingTiers = _getCollection("pricingTiers");
    const userTiers = pricingTiers.filter((t) => t.price > 0);

    const months = 6;
    const transactions = [];

    for (let m = months - 1; m >= 0; m--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - m);
        monthStart.setDate(1);

        const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();

        const txnCount = 15 + Math.floor(Math.random() * 20);

        for (let i = 0; i < txnCount; i++) {
            const day = 1 + Math.floor(Math.random() * daysInMonth);
            const txnDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), day, 8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
            const userIdx = Math.floor(Math.random() * users.length);
            const tier = userTiers[Math.floor(Math.random() * userTiers.length)];
            const statusRoll = Math.random();

            transactions.push({
                id: `trans-${txnDate.getTime()}-${i}`,
                userId: users[userIdx].id,
                tierId: tier.id,
                amount: tier.price,
                currency: "IDR",
                paymentMethod: ["gopay", "ovo", "dana", "linkaja", "bca-transfer", "credit-card"][Math.floor(Math.random() * 6)],
                status: statusRoll < 0.75 ? "completed" : statusRoll < 0.9 ? "pending" : "failed",
                discountAmount: Math.random() < 0.2 ? Math.floor(tier.price * 0.2) : 0,
                totalAmount: tier.price,
                billingPeriod: "bulanan",
                createdAt: txnDate.toISOString(),
                updatedAt: txnDate.toISOString(),
                paidAt: statusRoll < 0.75 ? txnDate.toISOString() : null,
            });
        }
    }

    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    _saveCollection("transactions", transactions);
}

class ManagerEarningsPage {
    constructor() {
        this.period = "monthly";
        this._init();
    }

    async _init() {
        if (!authService.requireRole("manager", "/frontend/pages/main/login.html")) return;

        await getDbReady();
        _seedData();

        this._render();
        this._bindEvents();
    }

    _getTransactions() {
        return _getCollection("transactions");
    }

    _getPricingTiers() {
        return _getCollection("pricingTiers");
    }

    _filterByPeriod(transactions, period) {
        const now = new Date();
        const start = new Date(now);

        if (period === "daily") start.setDate(now.getDate() - 30);
        else if (period === "weekly") start.setMonth(now.getMonth() - 3);
        else start.setMonth(now.getMonth() - 12);

        return transactions.filter((t) => new Date(t.createdAt) >= start);
    }

    _calculateStats(transactions) {
        const completed = transactions.filter((t) => t.status === "completed");
        const totalRevenue = completed.reduce((sum, t) => sum + t.totalAmount, 0);
        const pending = transactions.filter((t) => t.status === "pending").length;
        const failed = transactions.filter((t) => t.status === "failed").length;

        const uniqueUsers = new Set(completed.map((t) => t.userId)).size;

        return { totalRevenue, completed: completed.length, pending, failed, uniqueUsers };
    }

    _getChartData(transactions) {
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("id-ID", { month: "short" }) });
        }

        return months.map((m) => {
            const monthTxns = transactions.filter((t) => {
                const d = new Date(t.createdAt);
                return d.getFullYear() === m.year && d.getMonth() === m.month && t.status === "completed";
            });
            return {
                label: m.label,
                revenue: monthTxns.reduce((sum, t) => sum + t.totalAmount, 0),
                count: monthTxns.length,
            };
        });
    }

    _getDistribution(transactions) {
        const completed = transactions.filter((t) => t.status === "completed");
        const tiers = this._getPricingTiers().filter((t) => t.price > 0);

        return tiers.map((tier) => {
            const tierTxns = completed.filter((t) => t.tierId === tier.id);
            const revenue = tierTxns.reduce((sum, t) => sum + t.totalAmount, 0);
            return {
                ...tier,
                count: tierTxns.length,
                revenue,
                subscribers: new Set(tierTxns.map((t) => t.userId)).size,
            };
        }).filter((t) => t.count > 0);
    }

    _render() {
        const container = DOM.$("#managerEarningsPage");
        if (!container) return;

        const all = this._getTransactions();
        const filtered = this._filterByPeriod(all, this.period);
        const stats = this._calculateStats(filtered);
        const chartData = this._getChartData(filtered);
        const distribution = this._getDistribution(filtered);
        const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);

        const recentTxns = all.filter((t) => t.status === "completed").slice(0, 10);

        container.innerHTML = `
            <div class="earnings-header">
                <div>
                    <h1 class="earnings-header__title">
                        <i data-feather="dollar-sign"></i> Pendapatan
                    </h1>
                    <p class="earnings-header__subtitle">Laporan keuangan dan transaksi platform</p>
                </div>
                <div class="earnings-period">
                    <button class="earnings-period__btn ${this.period === "daily" ? "earnings-period__btn--active" : ""}" data-period="daily">30 Hari</button>
                    <button class="earnings-period__btn ${this.period === "weekly" ? "earnings-period__btn--active" : ""}" data-period="weekly">3 Bulan</button>
                    <button class="earnings-period__btn ${this.period === "monthly" ? "earnings-period__btn--active" : ""}" data-period="monthly">12 Bulan</button>
                </div>
            </div>

            <div class="earnings-overview">
                <div class="earnings-card">
                    <div class="earnings-card__header">
                        <div class="earnings-card__icon earnings-card__icon--revenue">
                            <i data-feather="trending-up"></i>
                        </div>
                        <span class="earnings-card__trend earnings-card__trend--up">${stats.completed > 0 ? "+" + Math.floor(Math.random() * 20 + 5) : 0}%</span>
                    </div>
                    <div class="earnings-card__value">${_formatCurrency(stats.totalRevenue)}</div>
                    <div class="earnings-card__label">Total Pendapatan</div>
                </div>
                <div class="earnings-card">
                    <div class="earnings-card__header">
                        <div class="earnings-card__icon earnings-card__icon--subscribers">
                            <i data-feather="users"></i>
                        </div>
                    </div>
                    <div class="earnings-card__value">${stats.uniqueUsers}</div>
                    <div class="earnings-card__label">Pelanggan Aktif</div>
                </div>
                <div class="earnings-card">
                    <div class="earnings-card__header">
                        <div class="earnings-card__icon earnings-card__icon--transactions">
                            <i data-feather="credit-card"></i>
                        </div>
                    </div>
                    <div class="earnings-card__value">${stats.completed}</div>
                    <div class="earnings-card__label">Transaksi Berhasil</div>
                </div>
                <div class="earnings-card">
                    <div class="earnings-card__header">
                        <div class="earnings-card__icon earnings-card__icon--growth">
                            <i data-feather="bar-chart-2"></i>
                        </div>
                    </div>
                    <div class="earnings-card__value">${stats.pending + stats.failed}</div>
                    <div class="earnings-card__label">Tertunda / Gagal</div>
                </div>
            </div>

            <div class="earnings-grid">
                <div class="earnings-section">
                    <div class="earnings-section__header">
                        <h3 class="earnings-section__title"><i data-feather="activity"></i> Grafik Pendapatan</h3>
                    </div>
                    <div class="earnings-section__body">
                        ${chartData.some((d) => d.revenue > 0) ? `
                            <div class="earnings-chart">
                                ${chartData.map((d) => `
                                    <div class="earnings-chart__bar" style="height: ${(d.revenue / maxRevenue) * 100}%" data-tooltip="${_formatCurrency(d.revenue)}"></div>
                                `).join("")}
                            </div>
                            <div class="earnings-chart__labels">
                                ${chartData.map((d) => `
                                    <div class="earnings-chart__label">${d.label}</div>
                                `).join("")}
                            </div>
                        ` : `
                            <div class="earnings-empty">
                                <i data-feather="bar-chart-2"></i>
                                <div class="earnings-empty__title">Belum ada data</div>
                                <div class="earnings-empty__desc">Data pendapatan akan muncul setelah ada transaksi.</div>
                            </div>
                        `}
                    </div>
                </div>

                <div class="earnings-section">
                    <div class="earnings-section__header">
                        <h3 class="earnings-section__title"><i data-feather="pie-chart"></i> Distribusi Paket</h3>
                    </div>
                    <div class="earnings-section__body">
                        ${distribution.length > 0 ? `
                            <div class="earnings-distribution">
                                ${distribution.map((d) => {
                                    const totalDistRevenue = distribution.reduce((s, x) => s + x.revenue, 0);
                                    const pct = totalDistRevenue > 0 ? (d.revenue / totalDistRevenue) * 100 : 0;
                                    return `
                                        <div class="earnings-distribution__item">
                                            <div class="earnings-distribution__info">
                                                <div class="earnings-distribution__name">${d.name}</div>
                                                <div class="earnings-distribution__count">${d.subscribers} pelanggan</div>
                                            </div>
                                            <div class="earnings-distribution__bar">
                                                <div class="earnings-distribution__fill earnings-distribution__fill--${d.id}" style="width: ${pct}%"></div>
                                            </div>
                                            <div class="earnings-distribution__revenue">${_formatCurrency(d.revenue)}</div>
                                        </div>
                                    `;
                                }).join("")}
                            </div>
                        ` : `
                            <div class="earnings-empty">
                                <i data-feather="pie-chart"></i>
                                <div class="earnings-empty__title">Belum ada data</div>
                                <div class="earnings-empty__desc">Distribusi paket akan muncul setelah ada transaksi.</div>
                            </div>
                        `}
                    </div>
                </div>
            </div>

            <div class="earnings-section">
                <div class="earnings-section__header">
                    <h3 class="earnings-section__title"><i data-feather="list"></i> Transaksi Terbaru</h3>
                </div>
                <div class="earnings-section__body" style="padding:0">
                    ${recentTxns.length > 0 ? `
                        <table class="earnings-transactions">
                            <thead>
                                <tr>
                                    <th>Pengguna</th>
                                    <th>Paket</th>
                                    <th>Metode</th>
                                    <th>Jumlah</th>
                                    <th>Tanggal</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recentTxns.map((t) => {
                                    const user = _getCollection("users").find((u) => u.id === t.userId);
                                    const tier = _getCollection("pricingTiers").find((p) => p.id === t.tierId);
                                    return `
                                        <tr>
                                            <td>
                                                <div class="earnings-transactions__user">
                                                    <img class="earnings-transactions__avatar" src="${user?.profilePhoto || ""}" alt="" onerror="this.style.display='none'" />
                                                    <span class="earnings-transactions__name">${user?.username || "—"}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="earnings-transactions__tier">${tier?.name || "—"}</div>
                                            </td>
                                            <td style="font-size:var(--font-xs);color:var(--text-muted)">${t.paymentMethod || "—"}</td>
                                            <td><span class="earnings-transactions__amount">${_formatCurrency(t.totalAmount)}</span></td>
                                            <td style="font-size:var(--font-xs);color:var(--text-secondary)">${_formatDate(t.createdAt)}</td>
                                            <td>
                                                <span class="earnings-transactions__status earnings-transactions__status--${t.status}">
                                                    ${t.status === "completed" ? "Berhasil" : t.status === "pending" ? "Tertunda" : "Gagal"}
                                                </span>
                                            </td>
                                        </tr>
                                    `;
                                }).join("")}
                            </tbody>
                        </table>
                    ` : `
                        <div class="earnings-empty">
                            <i data-feather="inbox"></i>
                            <div class="earnings-empty__title">Belum ada transaksi</div>
                            <div class="earnings-empty__desc">Transaksi akan muncul setelah pengguna melakukan pembayaran.</div>
                        </div>
                    `}
                </div>
            </div>
        `;

        feather.replace();
    }

    _bindEvents() {
        DOM.$("#managerEarningsPage")?.addEventListener("click", (e) => {
            const periodBtn = e.target.closest(".earnings-period__btn");
            if (!periodBtn) return;

            this.period = periodBtn.dataset.period;
            this._render();
            this._bindEvents();
        });
    }
}

export default ManagerEarningsPage;
