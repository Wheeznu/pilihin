import Sidebar from "./sidebar.js";
import { Theme } from "../utils/theme.js";

class Navbar {
    constructor(element) {
        this.el = element;
        this._updateToggleIcon();
        this._bindEvents();
    }

    _updateToggleIcon() {
        const btn = this.el.querySelector("#themeToggle i");
        if (!btn) return;
        const theme = Theme.getCurrent();
        btn.setAttribute("data-feather", theme === "dark" ? "moon" : "sun");
        feather.replace();
    }

    _bindEvents() {
        const searchInput = this.el.querySelector(".navbar__search input");
        if (searchInput) {
            searchInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    const query = searchInput.value.trim();
                    if (query) {
                        window.location.href = `/frontend/pages/film/search.html?q=${encodeURIComponent(query)}`;
                    }
                }
            });
        }

        const themeToggle = this.el.querySelector("#themeToggle");
        if (themeToggle) {
            themeToggle.addEventListener("click", () => {
                Theme.toggle();
                this._updateToggleIcon();
            });
        }

        const dropdownTriggers = this.el.querySelectorAll(".navbar__dropdown-trigger");
        dropdownTriggers.forEach((trigger) => {
            trigger.addEventListener("click", (e) => {
                e.preventDefault();
                const dropdown = trigger.closest(".navbar__dropdown");
                if (dropdown) {
                    dropdown.classList.toggle("navbar__dropdown--open");
                }
            });
        });

        document.addEventListener("click", (e) => {
            if (!this.el.contains(e.target)) {
                this.el.querySelectorAll(".navbar__dropdown--open").forEach((el) => {
                    el.classList.remove("navbar__dropdown--open");
                });
            }
        });
    }

    static async load(containerId = "navbar-container") {
        const container = document.getElementById(containerId);
        if (!container) return null;

        try {
            const res = await fetch("/frontend/components/navbar.html");
            const html = await res.text();
            container.innerHTML = html;
            const navbar = container.querySelector("[data-component='navbar']");
            if (navbar) {
                Navbar._updateAuthState(navbar);
                feather.replace();
                return new Navbar(navbar);
            }
        } catch {
            console.warn("Navbar component not found");
        }
        return null;
    }

    static _updateAuthState(navbar) {
        const session = JSON.parse(localStorage.getItem("pilih-in-session"));
        const right = navbar?.querySelector(".navbar__right");
        if (!right) return;

        if (session) {
            const profilePage = {
                user: "/frontend/pages/user/profile.html",
                admin: "/frontend/pages/admin/profile.html",
                manager: "/frontend/pages/manager/profile.html",
            }[session.role] || "/frontend/pages/user/profile.html";

            const hasSidebar = true;

            const avatarHtml = session.profilePhoto
                ? `<img src="${session.profilePhoto}" alt="${session.username}" class="navbar__avatar" />`
                : `<i data-feather="user"></i>`;

            right.innerHTML = `
                <a href="${profilePage}" class="navbar__profile-btn">
                    ${avatarHtml}
                    <span>${session.username || "Profil"}</span>
                </a>
                ${hasSidebar ? "" : `
                <button class="btn btn-danger btn-sm" id="logoutBtn">
                    <i data-feather="log-out"></i> <span>Keluar</span>
                </button>`}
            `;
            const logoutBtn = right.querySelector("#logoutBtn");
            if (logoutBtn) {
                logoutBtn.addEventListener("click", () => {
                    if (!confirm("Anda yakin ingin keluar?")) return;
                    localStorage.removeItem("pilih-in-session");
                    window.location.href = "/frontend/index.html";
                });
            }

            if (hasSidebar) {
                const actions = navbar?.querySelector(".navbar__actions");
                if (actions) actions.remove();
                Sidebar.init();
            }
        }
    }
}

export default Navbar;
