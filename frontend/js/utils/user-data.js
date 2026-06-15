const API_BASE = "http://localhost:3000";

export const UserData = {
  _getUserId() {
    try {
      const raw = localStorage.getItem("pilih-in-session");
      if (!raw) return null;
      return JSON.parse(raw).userId;
    } catch {
      return null;
    }
  },

  async get(collection) {
    const userId = this._getUserId();
    if (!userId) return [];
    try {
      const res = await fetch(`${API_BASE}/api/user-data/${userId}/${collection}`);
      const json = await res.json();
      return json.data || [];
    } catch {
      console.warn(`UserData: gagal mengambil ${collection}`);
      return [];
    }
  },

  async set(collection, data) {
    const userId = this._getUserId();
    if (!userId) return;
    try {
      await fetch(`${API_BASE}/api/user-data/${userId}/${collection}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.warn(`UserData: gagal menyimpan ${collection}`, err);
    }
  },
};
