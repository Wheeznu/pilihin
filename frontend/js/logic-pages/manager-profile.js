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
    } catch {}
}

function _formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function _getInitials(name) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

class ManagerProfilePage {
    constructor() {
        this.user = null;
        this._init();
    }

    async _init() {
        if (!authService.requireRole("manager", "/frontend/pages/main/login.html")) return;

        await getDbReady();
        await this._loadUser();
        this._render();
        this._bindEvents();
    }

    async _loadUser() {
        this.user = await authService.getCurrentUser();
    }

    _render() {
        const container = DOM.$("#managerProfilePage");
        if (!container || !this.user) {
            if (container) {
                container.innerHTML = `
                    <div class="exports-empty" style="text-align:center;padding:var(--space-3xl)">
                        <i data-feather="user-x"></i>
                        <div class="exports-empty__title">Gagal memuat profil</div>
                        <div class="exports-empty__desc">Silakan login kembali.</div>
                    </div>
                `;
                feather.replace();
            }
            return;
        }

        const u = this.user;
        const prefs = u.preferences || {};
        const allTxns = _getCollection("transactions").filter((t) => t.status === "completed");
        const totalRevenue = allTxns.reduce((s, t) => s + t.totalAmount, 0);
        const publishedFilms = _getCollection("films")?.filter((f) => f.status === "published").length || 0;
        const totalUsers = _getCollection("users")?.length || 0;
        const totalReviews = _getCollection("reviews")?.length || 0;

        const activities = [
            { icon: "log-in", action: "Login ke dashboard", date: u.lastLogin || u.updatedAt },
            { icon: "edit-2", action: "Memperbarui profil", date: u.updatedAt },
            { icon: "check-circle", action: "Moderasi ulasan pengguna", date: new Date(Date.now() - 2 * 86400000).toISOString() },
            { icon: "download", action: "Mengunduh laporan pendapatan", date: new Date(Date.now() - 5 * 86400000).toISOString() },
            { icon: "users", action: "Meninjau data pengguna baru", date: new Date(Date.now() - 7 * 86400000).toISOString() },
            { icon: "film", action: "Memverifikasi konten film", date: new Date(Date.now() - 10 * 86400000).toISOString() },
        ];

        container.innerHTML = `
            <div class="profile-header">
                ${u.profilePhoto
                    ? `<img class="profile-avatar" src="${u.profilePhoto}" alt="${u.username}" onerror="this.style.display='none'" />`
                    : `<div class="profile-avatar__placeholder">${_getInitials(u.username)}</div>`
                }
                <div class="profile-info">
                    <h1 class="profile-info__name">${u.username}</h1>
                    <span class="profile-info__role profile-info__role--manager">
                        <i data-feather="shield"></i> Manager
                    </span>
                    <div class="profile-info__email">${u.email}</div>
                    <div class="profile-info__meta">Bergabung ${_formatDate(u.createdAt)}</div>
                </div>
            </div>

            <div class="profile-stats">
                <div class="profile-stat">
                    <div class="profile-stat__value">${new Intl.NumberFormat("id-ID").format(totalRevenue)}</div>
                    <div class="profile-stat__label">Total Pendapatan</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat__value">${totalUsers}</div>
                    <div class="profile-stat__label">Pengguna</div>
                </div>
                <div class="profile-stat">
                    <div class="profile-stat__value">${publishedFilms}</div>
                    <div class="profile-stat__label">Film Tayang</div>
                </div>
            </div>

            <div class="profile-grid">
                <div class="profile-card">
                    <div class="profile-card__header">
                        <h3 class="profile-card__title"><i data-feather="edit-2"></i> Edit Profil</h3>
                    </div>
                    <div class="profile-card__body">
                        <div class="profile-field">
                            <label class="profile-field__label">Username</label>
                            <input class="profile-field__input" id="profileUsername" value="${u.username}" />
                        </div>
                        <div class="profile-field">
                            <label class="profile-field__label">Email</label>
                            <input class="profile-field__input" id="profileEmail" value="${u.email}" type="email" />
                        </div>
                        <div class="profile-actions">
                            <button class="btn btn-primary" id="saveProfileBtn">
                                <i data-feather="save"></i> Simpan
                            </button>
                        </div>
                        <div class="profile-success" id="profileSuccess">
                            <i data-feather="check-circle"></i>
                            <span>Profil berhasil diperbarui</span>
                        </div>
                    </div>
                </div>

                <div class="profile-card">
                    <div class="profile-card__header">
                        <h3 class="profile-card__title"><i data-feather="settings"></i> Pengaturan</h3>
                    </div>
                    <div class="profile-card__body">
                        <div class="profile-field">
                            <div class="profile-field__row">
                                <div>
                                    <div class="profile-field__label" style="margin-bottom:0">Tema Gelap</div>
                                    <div style="font-size:var(--font-xs);color:var(--text-muted);margin-top:2px">Gunakan tema gelap di seluruh platform</div>
                                </div>
                                <label class="profile-field__switch">
                                    <input type="checkbox" id="profileTheme" ${prefs.theme === "dark" ? "checked" : ""} />
                                    <span class="profile-field__slider"></span>
                                </label>
                            </div>
                        </div>
                        <div class="profile-field">
                            <div class="profile-field__row">
                                <div>
                                    <div class="profile-field__label" style="margin-bottom:0">Notifikasi</div>
                                    <div style="font-size:var(--font-xs);color:var(--text-muted);margin-top:2px">Terima notifikasi aktivitas platform</div>
                                </div>
                                <label class="profile-field__switch">
                                    <input type="checkbox" id="profileNotifications" ${prefs.notifications !== false ? "checked" : ""} />
                                    <span class="profile-field__slider"></span>
                                </label>
                            </div>
                        </div>
                        <div class="profile-field">
                            <label class="profile-field__label">Bahasa</label>
                            <input class="profile-field__input" id="profileLanguage" value="${prefs.language || "id"}" />
                        </div>
                        <div class="profile-field" style="margin-bottom:0">
                            <label class="profile-field__label">Profil Pribadi</label>
                            <div class="profile-field__row">
                                <div style="font-size:var(--font-sm);color:var(--text-secondary)">Sembunyikan profil dari pengguna lain</div>
                                <label class="profile-field__switch">
                                    <input type="checkbox" id="profilePrivate" ${prefs.privateProfile ? "checked" : ""} />
                                    <span class="profile-field__slider"></span>
                                </label>
                            </div>
                        </div>
                        <div class="profile-actions" style="margin-top:var(--space-lg)">
                            <button class="btn btn-primary" id="savePrefsBtn">
                                <i data-feather="save"></i> Simpan Pengaturan
                            </button>
                        </div>
                        <div class="profile-success" id="prefsSuccess">
                            <i data-feather="check-circle"></i>
                            <span>Pengaturan berhasil disimpan</span>
                        </div>
                    </div>
                </div>

                <div class="profile-card">
                    <div class="profile-card__header">
                        <h3 class="profile-card__title"><i data-feather="lock"></i> Ubah Password</h3>
                    </div>
                    <div class="profile-card__body">
                        <div class="profile-field">
                            <label class="profile-field__label">Password Lama</label>
                            <input class="profile-field__input" id="oldPassword" type="password" placeholder="Masukkan password lama" />
                        </div>
                        <div class="profile-field">
                            <label class="profile-field__label">Password Baru</label>
                            <input class="profile-field__input" id="newPassword" type="password" placeholder="Minimal 6 karakter" />
                        </div>
                        <div class="profile-field" style="margin-bottom:0">
                            <label class="profile-field__label">Konfirmasi Password Baru</label>
                            <input class="profile-field__input" id="confirmPassword" type="password" placeholder="Ulangi password baru" />
                        </div>
                        <div class="profile-actions" style="margin-top:var(--space-lg)">
                            <button class="btn btn-primary" id="savePasswordBtn">
                                <i data-feather="lock"></i> Ubah Password
                            </button>
                        </div>
                        <div class="profile-success" id="passwordSuccess">
                            <i data-feather="check-circle"></i>
                            <span>Password berhasil diubah</span>
                        </div>
                        <div class="profile-success" id="passwordError" style="background:rgba(226,33,52,0.15);color:var(--danger)">
                            <i data-feather="alert-circle"></i>
                            <span id="passwordErrorMsg">Terjadi kesalahan</span>
                        </div>
                    </div>
                </div>

                <div class="profile-card">
                    <div class="profile-card__header">
                        <h3 class="profile-card__title"><i data-feather="clock"></i> Aktivitas Terkini</h3>
                    </div>
                    <div class="profile-card__body">
                        <div class="profile-activity">
                            ${activities.map((a) => `
                                <div class="profile-activity__item">
                                    <div class="profile-activity__icon">
                                        <i data-feather="${a.icon}"></i>
                                    </div>
                                    <div class="profile-activity__info">
                                        <div class="profile-activity__action">${a.action}</div>
                                        <div class="profile-activity__date">${_formatDate(a.date)}</div>
                                    </div>
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
        DOM.$("#saveProfileBtn")?.addEventListener("click", () => this._saveProfile());
        DOM.$("#savePrefsBtn")?.addEventListener("click", () => this._savePreferences());
        DOM.$("#savePasswordBtn")?.addEventListener("click", () => this._savePassword());

        DOM.$("#profileTheme")?.addEventListener("change", () => {
            const isDark = DOM.$("#profileTheme").checked;
            document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
            localStorage.setItem("pilih-in-theme", isDark ? "dark" : "light");
        });
    }

    _showSuccess(id) {
        const el = DOM.$(`#${id}`);
        if (!el) return;
        el.classList.add("profile-success--visible");
        setTimeout(() => el.classList.remove("profile-success--visible"), 3000);
    }

    _saveProfile() {
        const username = DOM.$("#profileUsername")?.value?.trim();
        const email = DOM.$("#profileEmail")?.value?.trim();

        if (!username || !email) {
            alert("Username dan email wajib diisi");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert("Email tidak valid");
            return;
        }

        const users = _getCollection("users");
        const idx = users.findIndex((u) => u.id === this.user.id);
        if (idx === -1) return;

        users[idx].username = username;
        users[idx].email = email;
        users[idx].updatedAt = new Date().toISOString();
        this.user = users[idx];

        _saveCollection("users", users);

        const profilePhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=ff6600&color=fff`;
        users[idx].profilePhoto = profilePhoto;
        _saveCollection("users", users);
        this.user.profilePhoto = profilePhoto;

        this._render();
        this._bindEvents();
        this._showSuccess("profileSuccess");
    }

    _savePreferences() {
        const users = _getCollection("users");
        const idx = users.findIndex((u) => u.id === this.user.id);
        if (idx === -1) return;

        users[idx].preferences = {
            theme: DOM.$("#profileTheme")?.checked ? "dark" : "light",
            notifications: DOM.$("#profileNotifications")?.checked ?? true,
            language: DOM.$("#profileLanguage")?.value?.trim() || "id",
            privateProfile: DOM.$("#profilePrivate")?.checked ?? false,
        };
        users[idx].updatedAt = new Date().toISOString();
        this.user = users[idx];

        _saveCollection("users", users);
        this._showSuccess("prefsSuccess");
    }

    _savePassword() {
        const oldPassword = DOM.$("#oldPassword")?.value;
        const newPassword = DOM.$("#newPassword")?.value;
        const confirmPassword = DOM.$("#confirmPassword")?.value;

        if (!oldPassword || !newPassword || !confirmPassword) {
            DOM.$("#passwordErrorMsg").textContent = "Semua field password wajib diisi";
            this._showSuccess("passwordError");
            return;
        }

        if (oldPassword !== this.user.password) {
            DOM.$("#passwordErrorMsg").textContent = "Password lama salah";
            this._showSuccess("passwordError");
            return;
        }

        if (newPassword.length < 6) {
            DOM.$("#passwordErrorMsg").textContent = "Password baru minimal 6 karakter";
            this._showSuccess("passwordError");
            return;
        }

        if (newPassword !== confirmPassword) {
            DOM.$("#passwordErrorMsg").textContent = "Konfirmasi password tidak cocok";
            this._showSuccess("passwordError");
            return;
        }

        const users = _getCollection("users");
        const idx = users.findIndex((u) => u.id === this.user.id);
        if (idx === -1) return;

        users[idx].password = newPassword;
        users[idx].updatedAt = new Date().toISOString();
        _saveCollection("users", users);

        DOM.$("#oldPassword").value = "";
        DOM.$("#newPassword").value = "";
        DOM.$("#confirmPassword").value = "";

        this._showSuccess("passwordSuccess");
    }
}

export default ManagerProfilePage;
