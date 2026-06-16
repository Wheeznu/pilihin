import { getDbReady, apiRequest } from "../../../backend/init.js";
import { DOM } from "../utils/dom.js";
import authService from "../../../backend/services/AuthService.js";

const DB_KEY = "pilih-in-db";
const ROLE_LABELS = { user: "User", manager: "Manager", admin: "Admin" };
const STATUS_LABELS = { active: "Aktif", suspended: "Discorsuspend", banned: "Diblokir" };

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

function _getInitials(name) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function _seedSampleUsers() {
    const existing = _getCollection("users");
    if (existing.length > 0) return;

    const users = [
        { id: "user-001", username: "budi", fullName: "Budi", email: "budi@gmail.com", password: "user123", role: "user", profilePhoto: "", phone: "+6289999999999", bio: "", status: "active", subscriptionTier: "tier-001", subscriptionExpiry: null, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-06-01T10:00:00Z", lastLogin: "2025-06-07T07:30:00Z" },
        { id: "user-002", username: "siti", fullName: "Siti", email: "siti@gmail.com", password: "user123", role: "user", profilePhoto: "", phone: "+6289999999999", bio: "", status: "active", subscriptionTier: "tier-002", subscriptionExpiry: "2025-08-15T00:00:00Z", createdAt: "2025-02-10T08:00:00Z", updatedAt: "2025-06-05T12:00:00Z", lastLogin: "2025-06-06T18:00:00Z" },
        { id: "user-003", username: "agus", fullName: "Agus", email: "agus@yahoo.com", password: "user123", role: "user", profilePhoto: "", phone: "+6289999999999", bio: "", status: "suspended", subscriptionTier: "tier-001", subscriptionExpiry: null, createdAt: "2025-03-01T08:00:00Z", updatedAt: "2025-05-20T09:00:00Z", lastLogin: "2025-05-15T14:00:00Z" },
        { id: "user-004", username: "dewi", fullName: "Dewi", email: "dewi@gmail.com", password: "user123", role: "user", profilePhoto: "", phone: "+6289999999999", bio: "", status: "active", subscriptionTier: "tier-003", subscriptionExpiry: "2025-12-31T00:00:00Z", createdAt: "2025-01-20T08:00:00Z", updatedAt: "2025-06-07T08:00:00Z", lastLogin: "2025-06-07T08:00:00Z" },
        { id: "user-005", username: "eko", fullName: "Eko", email: "eko@outlook.com", password: "user123", role: "user", profilePhoto: "", phone: "+6289999999999", bio: "", status: "banned", subscriptionTier: null, subscriptionExpiry: null, createdAt: "2025-04-10T08:00:00Z", updatedAt: "2025-05-30T11:00:00Z", lastLogin: "2025-05-25T09:00:00Z" },
        { id: "user-006", username: "fajar", fullName: "Fajar", email: "fajar@gmail.com", password: "user123", role: "user", profilePhoto: "", phone: "+6289999999999", bio: "", status: "active", subscriptionTier: "tier-002", subscriptionExpiry: "2025-10-01T00:00:00Z", createdAt: "2025-02-25T08:00:00Z", updatedAt: "2025-06-06T15:00:00Z", lastLogin: "2025-06-06T15:00:00Z" },
        { id: "user-007", username: "gita", fullName: "Gita", email: "gita@gmail.com", password: "user123", role: "user", profilePhoto: "", phone: "+6289999999999", bio: "", status: "active", subscriptionTier: "tier-001", subscriptionExpiry: null, createdAt: "2025-03-15T08:00:00Z", updatedAt: "2025-06-04T10:30:00Z", lastLogin: "2025-06-03T20:00:00Z" },
        { id: "user-008", username: "hari", fullName: "Hari", email: "hari@yahoo.com", password: "user123", role: "user", profilePhoto: "", phone: "+6289999999999", bio: "", status: "suspended", subscriptionTier: "tier-001", subscriptionExpiry: null, createdAt: "2025-04-01T08:00:00Z", updatedAt: "2025-05-28T16:00:00Z", lastLogin: "2025-05-20T11:00:00Z" },
        { id: "manager-001", username: "manager1", fullName: "Manager", email: "manager@pilihin.com", password: "manager123", role: "manager", profilePhoto: "", phone: "+6289999999999", bio: "", status: "active", subscriptionTier: null, subscriptionExpiry: null, createdAt: "2025-01-01T08:00:00Z", updatedAt: "2025-06-07T09:00:00Z", lastLogin: "2025-06-07T09:00:00Z" },
        { id: "admin-001", username: "admin1", fullName: "Admin", email: "admin@pilihin.com", password: "admin123", role: "admin", profilePhoto: "", phone: "+6289999999999", bio: "", status: "active", subscriptionTier: null, subscriptionExpiry: null, createdAt: "2025-01-01T08:00:00Z", updatedAt: "2025-06-07T09:00:00Z", lastLogin: "2025-06-07T09:00:00Z" },
    ];

    _saveCollection("users", users);
}

class ManagerKelolaAkunPage {
    constructor() {
        this.currentTab = "all";
        this.searchQuery = "";
        this._init();
    }

    async _init() {
        if (!authService.requireRole("manager", "/frontend/pages/main/login.html")) return;

        await getDbReady();
        _seedSampleUsers();

        this._render();
        this._bindEvents();
    }

    _getUsers() {
        return _getCollection("users");
    }

    _saveUsers(users) {
        _saveCollection("users", users);
    }

    _getFilteredUsers() {
        let users = this._getUsers();

        if (this.currentTab !== "all") {
            users = users.filter((u) => u.status === this.currentTab);
        }

        if (this.searchQuery.trim()) {
            const q = this.searchQuery.trim().toLowerCase();
            users = users.filter(
                (u) =>
                    u.username.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q) ||
                    u.id.toLowerCase().includes(q),
            );
        }

        return users;
    }

    _render() {
        const container = DOM.$("#managerAccountPage");
        if (!container) return;

        const allUsers = this._getUsers();
        const active = allUsers.filter((u) => u.status === "active").length;
        const suspended = allUsers.filter((u) => u.status === "suspended").length;
        const banned = allUsers.filter((u) => u.status === "banned").length;
        const managers = allUsers.filter((u) => u.role === "manager").length;

        const filtered = this._getFilteredUsers();

        container.innerHTML = `
            <div class="account-header">
                <div class="account-header__left">
                    <h1 class="account-header__title">
                        <i data-feather="user-check"></i> Kelola Akun
                    </h1>
                    <p class="account-header__subtitle">Kelola role, suspend, atau ban akun pengguna</p>
                </div>
                <div class="account-header__search">
                    <i data-feather="search"></i>
                    <input class="account-header__search-input" type="text" id="accountSearch" placeholder="Cari username, email, atau ID..." value="${this.searchQuery}" />
                </div>
            </div>

            <div class="account-stats">
                <div class="account-stat account-stat--active">
                    <div class="account-stat__value">${active}</div>
                    <div class="account-stat__label">Aktif</div>
                </div>
                <div class="account-stat account-stat--suspended">
                    <div class="account-stat__value">${suspended}</div>
                    <div class="account-stat__label">Discorsuspend</div>
                </div>
                <div class="account-stat account-stat--banned">
                    <div class="account-stat__value">${banned}</div>
                    <div class="account-stat__label">Diblokir</div>
                </div>
                <div class="account-stat account-stat--manager">
                    <div class="account-stat__value">${managers}</div>
                    <div class="account-stat__label">Manager</div>
                </div>
            </div>

            <div class="account-tabs">
                <button class="account-tab ${this.currentTab === "all" ? "account-tab--active" : ""}" data-tab="all">Semua (${allUsers.length})</button>
                <button class="account-tab ${this.currentTab === "active" ? "account-tab--active" : ""}" data-tab="active">Aktif (${active})</button>
                <button class="account-tab ${this.currentTab === "suspended" ? "account-tab--active" : ""}" data-tab="suspended">Discorsuspend (${suspended})</button>
                <button class="account-tab ${this.currentTab === "banned" ? "account-tab--active" : ""}" data-tab="banned">Diblokir (${banned})</button>
            </div>

            ${this._renderTable(filtered)}
        `;

        feather.replace();
    }

    _renderTable(users) {
        if (users.length === 0) {
            return `
                <div class="account-empty">
                    <i data-feather="users"></i>
                    <div class="account-empty__title">Tidak ada akun ditemukan</div>
                    <div class="account-empty__desc">Coba ubah filter atau kata kunci pencarian.</div>
                </div>
            `;
        }

        return `
            <div class="account-table-wrapper">
                <table class="account-table">
                    <thead>
                        <tr>
                            <th>Pengguna</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Terakhir Login</th>
                            <th>Ubah Role</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map((u) => this._userRow(u)).join("")}
                    </tbody>
                </table>
            </div>
        `;
    }

    _userRow(user) {
        const roleOptions = ["user", "manager", "admin"].map((r) =>
            `<option value="${r}" ${user.role === r ? "selected" : ""}>${ROLE_LABELS[r]}</option>`,
        ).join("");

        const isSelf = user.id === authService.getSession()?.userId;

        return `
            <tr data-user-id="${user.id}">
                <td>
                    <div class="account-user">
                        ${user.profilePhoto
                            ? `<img class="account-user__avatar" src="${user.profilePhoto}" alt="${user.username}" onerror="this.style.display='none'" />`
                            : `<div class="account-user__avatar-fallback">${_getInitials(user.username)}</div>`
                        }
                        <div>
                            <div class="account-user__name">${user.username}</div>
                            <div class="account-user__email">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="account-badge account-badge--${user.role}">
                        <i data-feather="${user.role === "admin" ? "shield" : user.role === "manager" ? "star" : "user"}"></i>
                        ${ROLE_LABELS[user.role]}
                    </span>
                </td>
                <td>
                    <span class="account-status account-status--${user.status}">
                        <i data-feather="${user.status === "active" ? "check-circle" : user.status === "suspended" ? "alert-circle" : "x-circle"}"></i>
                        ${STATUS_LABELS[user.status]}
                    </span>
                </td>
                <td>
                    <span class="account-user__email">${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Belum pernah"}</span>
                </td>
                <td>
                    <select class="account-select" data-action="changeRole" data-id="${user.id}" ${isSelf ? "disabled" : ""}>
                        ${roleOptions}
                    </select>
                </td>
                <td>
                    <div class="account-actions">
                        ${user.status === "active" && !isSelf ? `
                            <button class="btn btn-ghost btn-sm" data-action="suspend" data-id="${user.id}" title="Suspend">
                                <i data-feather="pause-circle"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" data-action="ban" data-id="${user.id}" title="Ban">
                                <i data-feather="slash"></i>
                            </button>
                        ` : user.status === "suspended" && !isSelf ? `
                            <button class="btn btn-primary btn-sm" data-action="activate" data-id="${user.id}" title="Aktifkan">
                                <i data-feather="play-circle"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" data-action="ban" data-id="${user.id}" title="Ban">
                                <i data-feather="slash"></i>
                            </button>
                        ` : user.status === "banned" && !isSelf ? `
                            <button class="btn btn-primary btn-sm" data-action="activate" data-id="${user.id}" title="Aktifkan">
                                <i data-feather="play-circle"></i>
                            </button>
                        ` : `
                            <span style="font-size:var(--font-xs);color:var(--text-muted)">-</span>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }

    _bindEvents() {
        const searchInput = DOM.$("#accountSearch");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this.searchQuery = e.target.value;
                this._render();
                this._bindEvents();
            });
        }

        DOM.$("#managerAccountPage")?.addEventListener("click", (e) => {
            const tabBtn = e.target.closest(".account-tab");
            if (tabBtn) {
                this.currentTab = tabBtn.dataset.tab;
                this._render();
                this._bindEvents();
                return;
            }

            const actionBtn = e.target.closest("[data-action]");
            if (!actionBtn) return;

            const action = actionBtn.dataset.action;
            const userId = actionBtn.dataset.id;
            if (!userId) return;

            if (action === "suspend") this._suspendUser(userId);
            else if (action === "ban") this._banUser(userId);
            else if (action === "activate") this._activateUser(userId);
        });

        DOM.$("#managerAccountPage")?.addEventListener("change", (e) => {
            const select = e.target.closest("[data-action='changeRole']");
            if (!select) return;

            const userId = select.dataset.id;
            const newRole = select.value;
            this._changeRole(userId, newRole);
        });
    }

    _changeRole(userId, newRole) {
        if (!confirm(`Ubah role pengguna ini menjadi ${ROLE_LABELS[newRole]}?`)) return;

        const users = this._getUsers();
        const user = users.find((u) => u.id === userId);
        if (!user) return;

        user.role = newRole;
        user.updatedAt = new Date().toISOString();
        this._saveUsers(users);
        apiRequest("PUT", `/api/users/${userId}`, { role: newRole });
        this._render();
        this._bindEvents();
        DOM.showToast(`Role berhasil diubah ke ${ROLE_LABELS[newRole]}`, "success");
    }

    _suspendUser(userId) {
        if (!confirm(`Suspend akun ini? Pengguna tidak akan bisa login.`)) return;

        const users = this._getUsers();
        const user = users.find((u) => u.id === userId);
        if (!user) return;

        user.status = "suspended";
        user.updatedAt = new Date().toISOString();
        this._saveUsers(users);
        apiRequest("PUT", `/api/users/${userId}`, { status: "suspended" });
        this._render();
        this._bindEvents();
        DOM.showToast("Akun berhasil di-suspend", "success");
    }

    _banUser(userId) {
        if (!confirm(`Ban akun ini? Tindakan ini bisa dibatalkan dengan mengaktifkan kembali.`)) return;

        const users = this._getUsers();
        const user = users.find((u) => u.id === userId);
        if (!user) return;

        user.status = "banned";
        user.updatedAt = new Date().toISOString();
        this._saveUsers(users);
        apiRequest("PUT", `/api/users/${userId}`, { status: "banned" });
        this._render();
        this._bindEvents();
        DOM.showToast("Akun berhasil diblokir", "success");
    }

    _activateUser(userId) {
        const users = this._getUsers();
        const user = users.find((u) => u.id === userId);
        if (!user) return;

        user.status = "active";
        user.updatedAt = new Date().toISOString();
        this._saveUsers(users);
        apiRequest("PUT", `/api/users/${userId}`, { status: "active" });
        this._render();
        this._bindEvents();
        DOM.showToast("Akun berhasil diaktifkan kembali", "success");
    }
}

export default ManagerKelolaAkunPage;
