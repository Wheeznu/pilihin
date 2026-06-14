import { repositories, getDbReady } from "../../../backend/init.js";
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

function _seedSampleNotifications() {
    const existing = _getCollection("notifications");
    if (existing.length > 0) return;

    const users = _getCollection("users");
    const userList = users.filter((u) => u.role === "user");
    if (userList.length === 0) return;

    const samples = [
        { title: "Film Baru Telah Hadir!", message: "Tonton film terbaru 'Gundala' sekarang juga di Pilih.in. Jangan lewatkan aksi serunya!", target: "all" },
        { title: "Promo Spesial Akhir Bulan", message: "Dapatkan diskon 50% untuk langganan Premium selama bulan ini. Gunakan kode PREMIUM50.", target: "all" },
        { title: "Tagihan Langganan Anda", message: "Tagihan langganan Basic Anda akan jatuh tempo dalam 3 hari. Segera perpanjang untuk terus menikmati film.", target: "user", userId: userList[0]?.id },
        { title: "Selamat! Anda Mendapat Reward", message: "Anda telah menonton 10 film! Dapatkan 100 poin loyalitas yang bisa ditukarkan dengan berbagai hadiah.", target: "all" },
        { title: "Pembaruan Kebijakan Privasi", message: "Kami telah memperbarui kebijakan privasi kami. Silakan baca selengkapnya di halaman privasi.", target: "all" },
    ];

    const notifs = samples.map((s, i) => ({
        id: `notif-${String(i + 1).padStart(3, "0")}`,
        title: s.title,
        message: s.message,
        target: s.target,
        targetUserId: s.userId || null,
        status: "sent",
        sentBy: "manager-001",
        sentAt: new Date(Date.now() - (samples.length - i) * 86400000 * 2).toISOString(),
        link: null,
    }));

    _saveCollection("notifications", notifs);
}

class ManagerKirimNotifikasiPage {
    constructor() {
        this._init();
    }

    async _init() {
        if (!authService.requireRole("manager", "/frontend/pages/main/login.html")) return;

        await getDbReady();
        _seedSampleNotifications();

        this._render();
        this._bindEvents();
    }

    _getNotifications() {
        return _getCollection("notifications");
    }

    _saveNotifications(notifs) {
        _saveCollection("notifications", notifs);
    }

    _getUsers() {
        return _getCollection("users");
    }

    _render() {
        const container = DOM.$("#managerNotifPage");
        if (!container) return;

        const notifs = this._getNotifications();
        const users = this._getUsers();

        container.innerHTML = `
            <div class="notif-header">
                <div>
                    <h1 class="notif-header__title">
                        <i data-feather="bell"></i> Kirim Notifikasi
                    </h1>
                    <p class="notif-header__subtitle">Buat dan kirim notifikasi ke pengguna Pilih.in</p>
                </div>
            </div>

            <form class="notif-form" id="notifForm">
                <div class="notif-form__title">
                    <i data-feather="edit-3"></i> Notifikasi Baru
                </div>
                <div class="notif-form__grid">
                    <div class="notif-form__group">
                        <label class="notif-form__label" for="notifTarget">Tujuan</label>
                        <select class="notif-form__select" id="notifTarget" name="target">
                            <option value="all">Semua Pengguna</option>
                            <option value="user">Pengguna Tertentu</option>
                        </select>
                    </div>
                    <div class="notif-form__group" id="notifUserGroup" style="display:none">
                        <label class="notif-form__label" for="notifUserId">Pilih Pengguna</label>
                        <select class="notif-form__select" id="notifUserId" name="userId">
                            ${users.filter((u) => u.role === "user").map((u) => `
                                <option value="${u.id}">${u.username} (${u.email})</option>
                            `).join("")}
                        </select>
                    </div>
                    <div class="notif-form__group notif-form__group--full">
                        <label class="notif-form__label" for="notifTitle">Judul Notifikasi</label>
                        <input class="notif-form__input" type="text" id="notifTitle" name="title" placeholder="Contoh: Promo Spesial Akhir Pekan" required />
                    </div>
                    <div class="notif-form__group notif-form__group--full">
                        <label class="notif-form__label" for="notifMessage">Pesan</label>
                        <textarea class="notif-form__textarea" id="notifMessage" name="message" placeholder="Tulis pesan notifikasi di sini..." required></textarea>
                    </div>
                    <div class="notif-form__group notif-form__group--full">
                        <label class="notif-form__label" for="notifLink">Link (opsional)</label>
                        <input class="notif-form__input" type="text" id="notifLink" name="link" placeholder="Contoh: /frontend/pages/film/detail.html?id=film-001" />
                    </div>
                </div>
                <div class="notif-form__actions">
                    <button type="reset" class="btn btn-secondary">Reset</button>
                    <button type="submit" class="btn btn-primary">
                        <i data-feather="send"></i> Kirim Notifikasi
                    </button>
                </div>
            </form>

            <div class="notif-history">
                <div class="notif-history__header">
                    <h2 class="notif-history__title">
                        <i data-feather="clock"></i> Riwayat Notifikasi
                    </h2>
                </div>
                ${this._renderTable(notifs, users)}
            </div>
        `;

        feather.replace();
    }

    _renderTable(notifs, users) {
        if (notifs.length === 0) {
            return `
                <div class="notif-empty">
                    <i data-feather="bell"></i>
                    <div class="notif-empty__title">Belum ada notifikasi</div>
                    <div class="notif-empty__desc">Notifikasi yang dikirim akan muncul di sini.</div>
                </div>
            `;
        }

        const sorted = [...notifs].sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

        return `
            <table class="notif-table">
                <thead>
                    <tr>
                        <th>Pesan</th>
                        <th>Tujuan</th>
                        <th>Status</th>
                        <th>Tanggal</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map((n) => this._notifRow(n, users)).join("")}
                </tbody>
            </table>
        `;
    }

    _notifRow(notif, users) {
        const recipientLabel = notif.target === "all"
            ? "Semua Pengguna"
            : users.find((u) => u.id === notif.targetUserId)?.username || "Pengguna tidak dikenal";

        const recipientDetail = notif.target === "all"
            ? `${users.filter((u) => u.role === "user").length} penerima`
            : "1 penerima";

        return `
            <tr data-notif-id="${notif.id}">
                <td>
                    <div class="notif-message">
                        <div class="notif-message__title">${notif.title}</div>
                        <div class="notif-message__preview">${notif.message}</div>
                    </div>
                </td>
                <td>
                    <div class="notif-recipient">
                        <div>${recipientLabel}</div>
                        <div class="notif-recipient__count">${recipientDetail}</div>
                    </div>
                </td>
                <td>
                    <span class="notif-status notif-status--${notif.status}">
                        <i data-feather="${notif.status === "sent" ? "check-circle" : "clock"}"></i>
                        ${notif.status === "sent" ? "Terkirim" : "Draft"}
                    </span>
                </td>
                <td>
                    <span class="notif-date">${new Date(notif.sentAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </td>
                <td>
                    <button class="btn btn-ghost btn-sm" data-action="preview" data-id="${notif.id}">
                        <i data-feather="eye"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" data-action="delete" data-id="${notif.id}">
                        <i data-feather="trash-2"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    _bindEvents() {
        const form = DOM.$("#notifForm");
        if (form) {
            form.addEventListener("submit", (e) => this._handleSubmit(e));
        }

        const targetSelect = DOM.$("#notifTarget");
        const userGroup = DOM.$("#notifUserGroup");
        if (targetSelect && userGroup) {
            targetSelect.addEventListener("change", () => {
                userGroup.style.display = targetSelect.value === "user" ? "" : "none";
            });
        }

        DOM.$("#managerNotifPage")?.addEventListener("click", (e) => {
            const actionBtn = e.target.closest("[data-action]");
            if (!actionBtn) return;

            const action = actionBtn.dataset.action;
            const id = actionBtn.dataset.id;
            if (!id) return;

            if (action === "delete") this._deleteNotif(id);
            else if (action === "preview") this._previewNotif(id);
        });
    }

    _handleSubmit(e) {
        e.preventDefault();

        const title = DOM.$("#notifTitle")?.value.trim();
        const message = DOM.$("#notifMessage")?.value.trim();
        const target = DOM.$("#notifTarget")?.value;
        const userId = DOM.$("#notifUserId")?.value || null;
        const link = DOM.$("#notifLink")?.value.trim() || null;

        if (!title || !message) {
            DOM.showToast("Judul dan pesan harus diisi", "error");
            return;
        }

        const notifs = this._getNotifications();
        const newNotif = {
            id: `notif-${String(notifs.length + 1).padStart(3, "0")}`,
            title,
            message,
            target,
            targetUserId: target === "user" ? userId : null,
            link,
            status: "sent",
            sentBy: authService.getSession()?.userId || "unknown",
            sentAt: new Date().toISOString(),
        };

        notifs.push(newNotif);
        this._saveNotifications(notifs);
        this._render();
        this._bindEvents();
        DOM.showToast("Notifikasi berhasil dikirim!", "success");
    }

    _deleteNotif(id) {
        if (!confirm("Hapus notifikasi ini?")) return;

        let notifs = this._getNotifications();
        notifs = notifs.filter((n) => n.id !== id);
        this._saveNotifications(notifs);
        this._render();
        this._bindEvents();
        DOM.showToast("Notifikasi dihapus", "success");
    }

    _previewNotif(id) {
        const notifs = this._getNotifications();
        const notif = notifs.find((n) => n.id === id);
        if (!notif) return;

        alert(`Judul: ${notif.title}\n\nPesan: ${notif.message}\n\nTujuan: ${notif.target === "all" ? "Semua Pengguna" : `Pengguna: ${notif.targetUserId}`}\n\nDikirim: ${new Date(notif.sentAt).toLocaleString("id-ID")}`);
    }
}

export default ManagerKirimNotifikasiPage;
