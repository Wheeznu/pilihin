const API_BASE = "http://localhost:3000";
const STORAGE_KEY = "pilih-in-theme";

function _getUserId() {
  try {
    const raw = localStorage.getItem("pilih-in-session");
    if (!raw) return null;
    return JSON.parse(raw).userId;
  } catch {
    return null;
  }
}

export const Theme = {
  init() {
    const saved = localStorage.getItem(STORAGE_KEY) || "dark";
    document.documentElement.setAttribute("data-theme", saved);
  },

  getCurrent() {
    const theme = document.documentElement.getAttribute("data-theme");
    return theme || "dark";
  },

  toggle() {
    const current = this.getCurrent();
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY, next);
    this._syncToServer(next);
    return next;
  },

  set(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    this._syncToServer(theme);
  },

  async syncFromServer() {
    const userId = _getUserId();
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/api/user-data/${userId}/theme`);
      const json = await res.json();
      if (json.success && json.data) {
        const theme = json.data;
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem(STORAGE_KEY, theme);
      }
    } catch {
    }
  },

  async _syncToServer(theme) {
    const userId = _getUserId();
    if (!userId) return;
    try {
      await fetch(`${API_BASE}/api/user-data/${userId}/theme`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });
    } catch {
    }
  },
};
