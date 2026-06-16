const ADMIN_LINKS = [
  {
    href: "/frontend/pages/admin/profile.html",
    icon: "user",
    label: "Profil",
    isActive: (path) => path.includes("/admin/profile.html")
  },
  {
    href: "/frontend/pages/admin/konten.html",
    icon: "film",
    label: "Kelola Konten",
    isActive: (path) => path.includes("/admin/konten.html")
  },
  {
    href: "/frontend/pages/admin/artikel-create.html",
    icon: "plus-circle",
    label: "Tambah Artikel",
    isActive: (path) => path.includes("/admin/artikel-create.html")
  },
  {
    href: "/frontend/pages/admin/artikel-edit.html",
    icon: "edit-3",
    label: "Edit Artikel",
    isActive: (path) => path.includes("/admin/artikel-edit.html")
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
    href: "/frontend/pages/admin/faq.html",
    icon: "help-circle",
    label: "Kelola FAQ",
    isActive: (path) => path.includes("/admin/faq.html")
  }
];

const MANAGER_LINKS = [
  {
    href: "/frontend/pages/manager/profile.html",
    icon: "user",
    label: "Profil Manager",
    isActive: (path) => path.includes("/manager/profile.html")
  },
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
    href: "/frontend/pages/manager/laporan.html",
    icon: "bar-chart-2",
    label: "Laporan",
    isActive: (path) => path.includes("/manager/laporan.html")
  },
  {
    href: "/frontend/pages/manager/exports.html",
    icon: "download",
    label: "Ekspor Laporan",
    isActive: (path) => path.includes("/manager/exports.html")
  },
  {
    href: "/frontend/pages/manager/kelola-akun.html",
    icon: "shield",
    label: "Kelola Akun",
    isActive: (path) => path.includes("/manager/kelola-akun.html")
  },
  {
    href: "/frontend/pages/manager/balas-ulasan-user.html",
    icon: "message-square",
    label: "Balas Ulasan",
    isActive: (path) => path.includes("/manager/balas-ulasan-user.html")
  },
  {
    href: "/frontend/pages/manager/reviews.html",
    icon: "message-square",
    label: "Ulasan Film",
    isActive: (path) => path.includes("/manager/reviews.html")
  },
  {
    href: "/frontend/pages/manager/kirim-notifikasi.html",
    icon: "send",
    label: "Kirim Notifikasi",
    isActive: (path) => path.includes("/manager/kirim-notifikasi.html")
  }
];

const USER_LINKS = [
  {
    href: "/frontend/pages/user/profile.html",
    icon: "user",
    label: "Profil",
    isActive: (path) => path.includes("/user/profile.html")
  },
  {
    href: "/frontend/pages/user/security.html",
    icon: "shield",
    label: "Keamanan",
    isActive: (path) => path.includes("/user/security.html")
  },
  {
    href: "/frontend/pages/user/settings.html",
    icon: "settings",
    label: "Pengaturan",
    isActive: (path) => path.includes("/user/settings.html")
  },
  {
    href: "/frontend/pages/user/history.html",
    icon: "clock",
    label: "Riwayat Tonton",
    isActive: (path) => path.includes("/user/history.html")
  },
  {
    href: "/frontend/pages/user/favorites-film.html",
    icon: "film",
    label: "Film Favorit",
    isActive: (path) => path.includes("/user/favorites-film.html")
  },
  {
    href: "/frontend/pages/user/favorites-aktor.html",
    icon: "users",
    label: "Aktor Favorit",
    isActive: (path) => path.includes("/user/favorites-aktor.html")
  },
  {
    href: "/frontend/pages/user/favorites-sutradara.html",
    icon: "user",
    label: "Sutradara Favorit",
    isActive: (path) => path.includes("/user/favorites-sutradara.html")
  },
  {
    href: "/frontend/pages/user/watchlist.html",
    icon: "bookmark",
    label: "Daftar Tonton",
    isActive: (path) => path.includes("/user/watchlist.html")
  },
  {
    href: "/frontend/pages/user/subscription.html",
    icon: "star",
    label: "Status Langganan",
    isActive: (path) => path.includes("/user/subscription.html")
  },
  {
    href: "/frontend/pages/user/payment.html",
    icon: "gift",
    label: "Pembayaran & Poin",
    isActive: (path) => path.includes("/user/payment.html")
  },
  {
    href: "/frontend/pages/user/transactions.html",
    icon: "credit-card",
    label: "Transaksi",
    isActive: (path) => path.includes("/user/transactions.html")
  },
  {
    href: "/frontend/pages/user/notifications.html",
    icon: "bell",
    label: "Notifikasi",
    isActive: (path) => path.includes("/user/notifications.html")
  }
];

class Sidebar {
  static TOGGLE_ID = "sidebarToggle";
  static PANEL_ID = "sidebarPanel";
  static OVERLAY_ID = "sidebarOverlay";

  static STORAGE_KEY = "pilih-in-sidebar-closed";

  static _wasClosed() {
    return localStorage.getItem(Sidebar.STORAGE_KEY) === "true";
  }

  static _setClosed(closed) {
    if (closed) {
      localStorage.setItem(Sidebar.STORAGE_KEY, "true");
    } else {
      localStorage.removeItem(Sidebar.STORAGE_KEY);
    }
  }

  static init() {
    if (document.getElementById(Sidebar.TOGGLE_ID)) return;

    const session = Sidebar._getSession();
    if (!session) return;

    const isDesktop = window.innerWidth > 768;
    const wasClosed = Sidebar._wasClosed();

    Sidebar._createToggle(isDesktop, wasClosed);
    Sidebar._createPanel(session, isDesktop, wasClosed);
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

  static _createToggle(isDesktop, wasClosed) {
    const btn = document.createElement("button");
    btn.id = Sidebar.TOGGLE_ID;
    btn.className = "sidebar-toggle-btn";
    const showClose = isDesktop && !wasClosed;
    btn.innerHTML = showClose ? '<i data-feather="x"></i>' : '<i data-feather="menu"></i>';
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

  static _createPanel(session, isDesktop, wasClosed) {
    const panel = document.createElement("aside");
    panel.id = Sidebar.PANEL_ID;
    panel.className = "sidebar-panel";
    if (isDesktop && !wasClosed) {
      panel.classList.add("sidebar-panel--open");
      document.body.classList.add("sidebar-open");
    }

    const role = session.role || "user";
    const links = role === "admin" ? ADMIN_LINKS : role === "manager" ? MANAGER_LINKS : USER_LINKS;
    const roleLabel = role === "admin" ? "Administrator" : role === "manager" ? "Manager" : (session.username || "Pengguna");

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
      <div class="sidebar-panel__footer">
        <button class="sidebar-panel__logout" id="sidebarLogoutBtn">
          <i data-feather="log-out"></i>
          <span>Keluar</span>
        </button>
      </div>
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

    const logoutBtn = document.getElementById("sidebarLogoutBtn");
    logoutBtn?.addEventListener("click", () => {
      if (!confirm("Anda yakin ingin keluar?")) return;
      localStorage.removeItem("pilih-in-session");
      window.location.href = "/frontend/index.html";
    });

    toggle?.addEventListener("click", () => {
      const isOpen = panel?.classList.toggle("sidebar-panel--open");
      const currentIsDesktop = window.innerWidth > 768;

      Sidebar._setClosed(!isOpen);

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
      Sidebar._setClosed(true);
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
        Sidebar._setClosed(true);
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
