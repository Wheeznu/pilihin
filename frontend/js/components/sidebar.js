const ADMIN_LINKS = [
  {
    href: "/frontend/pages/admin/konten.html",
    icon: "film",
    label: "Kelola Konten",
    isActive: (path) => path.includes("/admin/konten.html")
  },
  {
    href: "/frontend/pages/admin/film-create.html",
    icon: "plus-circle",
    label: "Tambah Film",
    isActive: (path) => path.includes("/admin/film-create.html")
  },
  {
    href: "/frontend/pages/admin/film-edit.html",
    icon: "edit-3",
    label: "Edit Film",
    isActive: (path) => path.includes("/admin/film-edit.html")
  },
  {
    href: "/frontend/pages/admin/aktor-create.html",
    icon: "plus-circle",
    label: "Tambah Aktor",
    isActive: (path) => path.includes("/admin/aktor-create.html")
  },
  {
    href: "/frontend/pages/admin/aktor-edit.html",
    icon: "edit-3",
    label: "Edit Aktor",
    isActive: (path) => path.includes("/admin/aktor-edit.html")
  },
  {
    href: "/frontend/pages/admin/sutradara-create.html",
    icon: "plus-circle",
    label: "Tambah Sutradara",
    isActive: (path) => path.includes("/admin/sutradara-create.html")
  },
  {
    href: "/frontend/pages/admin/sutradara-edit.html",
    icon: "edit-3",
    label: "Edit Sutradara",
    isActive: (path) => path.includes("/admin/sutradara-edit.html")
  },
  {
    href: "/frontend/pages/admin/users.html",
    icon: "users",
    label: "Kelola Pengguna",
    isActive: (path) => path.includes("/admin/users.html")
  },
  {
    href: "/frontend/pages/admin/reviews.html",
    icon: "message-square",
    label: "Kelola Ulasan",
    isActive: (path) => path.includes("/admin/reviews.html")
  },
  {
    href: "/frontend/pages/admin/promo.html",
    icon: "tag",
    label: "Kelola Promo",
    isActive: (path) => path.includes("/admin/promo.html")
  },
  {
    href: "/frontend/pages/admin/faq.html",
    icon: "help-circle",
    label: "Kelola FAQ",
    isActive: (path) => path.includes("/admin/faq.html")
  },
  {
    href: "/frontend/pages/admin/laporan.html",
    icon: "file-text",
    label: "Laporan",
    isActive: (path) => path.includes("/admin/laporan.html")
  },
  {
    href: "/frontend/pages/admin/notifications.html",
    icon: "bell",
    label: "Notifikasi",
    isActive: (path) => path.includes("/admin/notifications.html")
  }
];

const MANAGER_LINKS = [
  {
    href: "/frontend/pages/manager/earnings.html",
    icon: "dollar-sign",
    label: "Pendapatan",
    isActive: (path) => path.includes("/manager/earnings.html")
  },
  {
    href: "/frontend/pages/manager/traffic.html",
    icon: "trending-up",
    label: "Statistik Traffic",
    isActive: (path) => path.includes("/manager/traffic.html")
  },
  {
    href: "/frontend/pages/manager/top-films.html",
    icon: "award",
    label: "Film Terpopuler",
    isActive: (path) => path.includes("/manager/top-films.html")
  },
  {
    href: "/frontend/pages/manager/approvals.html",
    icon: "check-circle",
    label: "Persetujuan",
    isActive: (path) => path.includes("/manager/approvals.html")
  },
  {
    href: "/frontend/pages/manager/exports.html",
    icon: "download",
    label: "Ekspor Laporan",
    isActive: (path) => path.includes("/manager/exports.html")
  },
  {
    href: "/frontend/pages/manager/reviews.html",
    icon: "message-square",
    label: "Ulasan Film",
    isActive: (path) => path.includes("/manager/reviews.html")
  }
];

class Sidebar {
  static TOGGLE_ID = "sidebarToggle";
  static PANEL_ID = "sidebarPanel";
  static OVERLAY_ID = "sidebarOverlay";

  static init() {
    if (document.getElementById(Sidebar.TOGGLE_ID)) return;

    const session = Sidebar._getSession();
    if (!session || (session.role !== "admin" && session.role !== "manager")) return;

    const isDesktop = window.innerWidth > 768;

    Sidebar._createToggle(isDesktop);
    Sidebar._createPanel(session.role, isDesktop);
    Sidebar._createOverlay(isDesktop);
    Sidebar._bindEvents(isDesktop);
  }

  static _getSession() {
    try {
      return JSON.parse(localStorage.getItem("pilih-in-session"));
    } catch {
      return null;
    }
  }

  static _createToggle(isDesktop) {
    const btn = document.createElement("button");
    btn.id = Sidebar.TOGGLE_ID;
    btn.className = "sidebar-toggle-btn";
    btn.innerHTML = isDesktop ? '<i data-feather="x"></i>' : '<i data-feather="menu"></i>';
    btn.setAttribute("aria-label", "Toggle Sidebar");

    const navbarLeft = document.querySelector(".navbar__left");
    if (navbarLeft) {
      navbarLeft.insertBefore(btn, navbarLeft.firstChild);
    } else {
      btn.classList.add("sidebar-toggle-fallback");
      document.body.appendChild(btn);
    }

    requestAnimationFrame(() => {
      feather.replace();
    });
  }

  static _createPanel(role, isDesktop) {
    const panel = document.createElement("aside");
    panel.id = Sidebar.PANEL_ID;
    panel.className = "sidebar-panel";
    if (isDesktop) {
      panel.classList.add("sidebar-panel--open");
      document.body.classList.add("sidebar-open");
    }

    const links = role === "admin" ? ADMIN_LINKS : MANAGER_LINKS;
    const roleLabel = role === "admin" ? "Administrator" : "Manager";

    const currentPath = window.location.pathname;

    panel.innerHTML = `
      <div class="sidebar-panel__header">
        <span class="sidebar-panel__title">${roleLabel}</span>
      </div>
      <nav class="sidebar-panel__nav">
        ${links.map((link) => `
          <a href="${link.href}" class="sidebar-panel__link${link.isActive(currentPath) ? " sidebar-panel__link--active" : ""}">
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

  static _createOverlay(isDesktop) {
    const overlay = document.createElement("div");
    overlay.id = Sidebar.OVERLAY_ID;
    overlay.className = "sidebar-overlay";
    document.body.appendChild(overlay);
  }

  static _bindEvents(isDesktop) {
    const toggle = document.getElementById(Sidebar.TOGGLE_ID);
    const panel = document.getElementById(Sidebar.PANEL_ID);
    const overlay = document.getElementById(Sidebar.OVERLAY_ID);

    toggle?.addEventListener("click", () => {
      const isOpen = panel?.classList.toggle("sidebar-panel--open");
      const currentIsDesktop = window.innerWidth > 768;

      if (currentIsDesktop) {
        document.body.classList.toggle("sidebar-open", isOpen);
        overlay?.classList.remove("sidebar-overlay--open");
      } else {
        document.body.classList.remove("sidebar-open");
        overlay?.classList.toggle("sidebar-overlay--open", isOpen);
      }

      if (toggle) {
        toggle.innerHTML = isOpen
          ? '<i data-feather="x"></i>'
          : '<i data-feather="menu"></i>';
        feather.replace();
      }
    });

    overlay?.addEventListener("click", () => {
      panel?.classList.remove("sidebar-panel--open");
      overlay.classList.remove("sidebar-overlay--open");
      if (toggle) {
        toggle.innerHTML = '<i data-feather="menu"></i>';
        feather.replace();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        panel?.classList.remove("sidebar-panel--open");
        overlay?.classList.remove("sidebar-overlay--open");
        document.body.classList.remove("sidebar-open");
        if (toggle) {
          toggle.innerHTML = '<i data-feather="menu"></i>';
          feather.replace();
        }
      }
    });

    window.addEventListener("resize", () => {
      const isNowDesktop = window.innerWidth > 768;
      const isOpen = panel?.classList.contains("sidebar-panel--open");

      if (isNowDesktop) {
        overlay?.classList.remove("sidebar-overlay--open");
        if (isOpen) {
          document.body.classList.add("sidebar-open");
          if (toggle) {
            toggle.innerHTML = '<i data-feather="x"></i>';
            feather.replace();
          }
        }
      } else {
        document.body.classList.remove("sidebar-open");
        if (isOpen) {
          overlay?.classList.add("sidebar-overlay--open");
          if (toggle) {
            toggle.innerHTML = '<i data-feather="x"></i>';
            feather.replace();
          }
        }
      }
    });
  }
}

export default Sidebar;
