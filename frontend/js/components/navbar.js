import Sidebar from "./sidebar.js";

class Navbar {
    constructor(element) {
        this.el = element;
        this._bindEvents();
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
            right.innerHTML = `
                <a href="/frontend/pages/user/profile.html" class="btn btn-ghost btn-sm">
                    <i data-feather="user"></i> Profil
                </a>
                <button class="btn btn-danger btn-sm" id="logoutBtn">
                    <i data-feather="log-out"></i> Keluar
                </button>
            `;
            const logoutBtn = right.querySelector("#logoutBtn");
            if (logoutBtn) {
                logoutBtn.addEventListener("click", () => {
                    localStorage.removeItem("pilih-in-session");
                    window.location.href = "/frontend/index.html";
                });
            }

            if (session.role === "admin" || session.role === "manager") {
                Sidebar.init();
            }
        }
    }
}

export default Navbar;
