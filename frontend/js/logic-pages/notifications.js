import { DOM } from "../utils/dom.js";
import { getDbReady } from "../../../backend/init.js";

class NotifikasiPage {
    constructor() {
        this._notifications = [];
        this._init();
    }

    async _init() {
        try {
            await getDbReady();
            this._loadNotifications();
            this._render();
        } catch (err) {
            console.warn("NotifikasiPage: retrying...", err);
            setTimeout(() => this._init(), 500);
        }
    }

    _getDb() {
        const raw = localStorage.getItem("pilih-in-db");
        return raw ? JSON.parse(raw) : null;
    }

    _loadNotifications() {
        const db = this._getDb();
        if (!db) throw new Error("Database not ready");

        this._notifications = (db.notifications || []).sort(
            (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
        );
    }

    _iconForType(type) {
        switch (type) {
            case "film":
                return "film";
            case "promo":
                return "tag";
            case "update":
                return "refresh-cw";
            case "system":
                return "bell";
            default:
                return "bell";
        }
    }

    _notifHTML(notif) {
        const date = new Date(notif.createdAt || notif.date);
        const dateStr = date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
        const icon = this._iconForType(notif.type);

        return `
            <div class="notifikasi-item">
                <div class="notifikasi-item__icon">
                    <i data-feather="${icon}"></i>
                </div>
                <div class="notifikasi-item__body">
                    <div class="notifikasi-item__title">${notif.title}</div>
                    <div class="notifikasi-item__message">${notif.message || notif.body || ""}</div>
                    <div class="notifikasi-item__time">
                        <i data-feather="clock"></i>
                        <span>${dateStr}</span>
                    </div>
                </div>
            </div>
        `;
    }

    _render() {
        const container = DOM.$("#notifikasiPage");
        if (!container) return;

        if (!this._notifications.length) {
            container.innerHTML = `
                <div class="page-hero">
                    <div>
                        <h1>Notifikasi</h1>
                        <p>Pemberitahuan dan aktivitas terbaru</p>
                    </div>
                </div>
                <div class="notifikasi-empty">
                    <i data-feather="bell"></i>
                    <h3>Tidak ada notifikasi</h3>
                    <p>Kamu akan mendapat notifikasi saat ada film baru, promo, atau pembaruan lainnya.</p>
                </div>
            `;
            feather.replace();
            return;
        }

        container.innerHTML = `
            <div class="page-hero">
                <div>
                    <h1>Notifikasi</h1>
                    <p>${this._notifications.length} pemberitahuan</p>
                </div>
            </div>
            <div class="notifikasi-list">
                ${this._notifications.map((n) => this._notifHTML(n)).join("")}
            </div>
        `;
        feather.replace();
    }
}

export default NotifikasiPage;
