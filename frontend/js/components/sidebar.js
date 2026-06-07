const ADMIN_LINKS = [
  { href: "/frontend/pages/admin/dashboard.html", icon: "grid", label: "Dashboard" },
  { href: "/frontend/pages/admin/films-crud.html", icon: "video", label: "Kelola Film" },
  { href: "/frontend/pages/admin/actors-crud.html", icon: "users", label: "Kelola Aktor" },
  { href: "/frontend/pages/admin/directors-crud.html", icon: "camera", label: "Kelola Sutradara" },
  { href: "/frontend/pages/admin/articles-crud.html", icon: "file-text", label: "Kelola Artikel" },
  { href: "/frontend/pages/admin/users-management.html", icon: "user-check", label: "Manajemen User" },
  { href: "/frontend/pages/admin/pricing-vouchers.html", icon: "tag", label: "Harga & Voucher" },
  { href: "/frontend/pages/admin/faq-crud.html", icon: "help-circle", label: "Kelola FAQ" },
  { href: "/frontend/pages/admin/reviews-moderation.html", icon: "message-square", label: "Moderasi Review" },
];

const MANAGER_LINKS = [
  { href: "/frontend/pages/manager/dashboard.html", icon: "bar-chart-2", label: "Dashboard" },
  { href: "/frontend/pages/manager/earnings.html", icon: "dollar-sign", label: "Pendapatan" },
  { href: "/frontend/pages/manager/traffic-stats.html", icon: "trending-up", label: "Statistik Traffic" },
  { href: "/frontend/pages/manager/top-films.html", icon: "award", label: "Film Terpopuler" },
  { href: "/frontend/pages/manager/approvals.html", icon: "check-circle", label: "Persetujuan" },
  { href: "/frontend/pages/manager/reports-export.html", icon: "download", label: "Laporan" },
];

class Sidebar {
  static TOGGLE_ID = "sidebarToggle";
  static PANEL_ID = "sidebarPanel";
  static OVERLAY_ID = "sidebarOverlay";

  static init() {
    if (document.getElementById(Sidebar.TOGGLE_ID)) return;

    const session = Sidebar._getSession();
    if (!session || (session.role !== "admin" && session.role !== "manager")) return;

    Sidebar._createToggle();
    Sidebar._createPanel(session.role);
    Sidebar._createOverlay();
    Sidebar._bindEvents();
  }

  static _getSession() {
    try {
      return JSON.parse(localStorage.getItem("pilih-in-session"));
    } catch {
      return null;
    }
  }

  static _createToggle() {
    const btn = document.createElement("button");
    btn.id = Sidebar.TOGGLE_ID;
    btn.className = "sidebar-toggle";
    btn.innerHTML = '<i data-feather="chevron-right"></i>';
    document.body.appendChild(btn);

    requestAnimationFrame(() => {
      btn.classList.add("sidebar-toggle--visible");
      feather.replace();
    });
  }

  static _createPanel(role) {
    const panel = document.createElement("aside");
    panel.id = Sidebar.PANEL_ID;
    panel.className = "sidebar-panel";

    const links = role === "admin" ? ADMIN_LINKS : MANAGER_LINKS;
    const roleLabel = role === "admin" ? "Administrator" : "Manager";

    const currentPath = window.location.pathname;

    panel.innerHTML = `
      <div class="sidebar-panel__header">
        <span class="sidebar-panel__title">${roleLabel}</span>
      </div>
      <nav class="sidebar-panel__nav">
        ${links.map((link) => `
          <a href="${link.href}" class="sidebar-panel__link${currentPath === link.href ? " sidebar-panel__link--active" : ""}">
            <i data-feather="${link.icon}"></i>
            <span>${link.label}</span>
          </a>
        `).join("")}
      </nav>
    `;

    document.body.appendChild(panel);

    requestAnimationFrame(() => {
      feather.replace();
    });
  }

  static _createOverlay() {
    const overlay = document.createElement("div");
    overlay.id = Sidebar.OVERLAY_ID;
    overlay.className = "sidebar-overlay";
    document.body.appendChild(overlay);
  }

  static _bindEvents() {
    const toggle = document.getElementById(Sidebar.TOGGLE_ID);
    const panel = document.getElementById(Sidebar.PANEL_ID);
    const overlay = document.getElementById(Sidebar.OVERLAY_ID);

    toggle?.addEventListener("click", () => {
      const isOpen = panel?.classList.toggle("sidebar-panel--open");
      overlay?.classList.toggle("sidebar-overlay--open", isOpen);
      if (toggle) {
        toggle.innerHTML = isOpen
          ? '<i data-feather="chevron-left"></i>'
          : '<i data-feather="chevron-right"></i>';
        feather.replace();
      }
    });

    overlay?.addEventListener("click", () => {
      panel?.classList.remove("sidebar-panel--open");
      overlay.classList.remove("sidebar-overlay--open");
      if (toggle) {
        toggle.innerHTML = '<i data-feather="chevron-right"></i>';
        feather.replace();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        panel?.classList.remove("sidebar-panel--open");
        overlay?.classList.remove("sidebar-overlay--open");
        if (toggle) {
          toggle.innerHTML = '<i data-feather="chevron-right"></i>';
          feather.replace();
        }
      }
    });
  }
}

export default Sidebar;
