import { getDbReady } from "../../../backend/init.js";
import authService from "../../../backend/services/AuthService.js";

class AdminProfilePage {
  constructor() {
    this.user = null;
    this._init();
  }

  async _init() {
    if (!authService.requireRole("admin", "/frontend/pages/main/login.html")) return;
    await getDbReady();
    this._loadData();
    this._initTheme();
    this._bindEvents();
  }

  _initTheme() {
    const cb = document.getElementById("profileTheme");
    if (!cb) return;
    const current = localStorage.getItem("pilih-in-theme") || "dark";
    cb.checked = current === "dark";
  }

  _getUser() {
    const session = authService.getSession();
    if (!session) return null;
    const db = JSON.parse(localStorage.getItem("pilih-in-db") || "{}");
    const users = db.users || [];
    const match = users.find((u) => u.id === session.userId);
    if (match) return match;
    return { ...session, id: session.userId };
  }

  _loadData() {
    this.user = this._getUser();
    if (!this.user) return;

    const u = this.user;
    const loginDate = u.loginAt ? new Date(u.loginAt) : new Date();
    const fmt = (d) =>
      d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    const fmtTime = (d) =>
      fmt(d) +
      ", " +
      d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) +
      " WIB";

    const joinDate = u.createdAt ? new Date(u.createdAt) : new Date();

    document.querySelectorAll("#adminSince, #tileAdminSince").forEach((el) => {
      if (el) el.textContent = fmt(joinDate);
    });

    document.querySelectorAll("#lastLogin, #tileLastLogin").forEach((el) => {
      if (el) el.textContent = fmtTime(loginDate);
    });

    document.querySelectorAll("#adminId, #tileAdminId").forEach((el) => {
      if (el) el.textContent = u.id;
    });

    const roleEl = document.getElementById("tileRole");
    if (roleEl) roleEl.textContent = "Administrator";

    const avatarImg = document.getElementById("avatarImg");
    if (avatarImg && u.profilePhoto) {
      avatarImg.src = u.profilePhoto;
    }

    const usernameEl = document.getElementById("username");
    const fullnameEl = document.getElementById("fullname");
    const emailEl = document.getElementById("email");
    const phoneEl = document.getElementById("phone");
    const bioEl = document.getElementById("bio");
    const displayNameEl = document.getElementById("displayName");
    const userEmailEl = document.getElementById("userEmail");

    if (usernameEl) usernameEl.value = u.username || "";
    if (fullnameEl) fullnameEl.value = u.fullName || u.username || "";
    if (emailEl) emailEl.value = u.email || "";
    if (phoneEl) phoneEl.value = "+6289999999999";
    if (bioEl) bioEl.value = u.bio || "";
    if (displayNameEl)
      displayNameEl.textContent = u.fullName || u.username || "Admin";
    if (userEmailEl) userEmailEl.textContent = u.email || "";
  }

  _bindEvents() {
    const modal = document.getElementById("photoModal");
    const preview = document.getElementById("photoPreview");
    const uploadInput = document.getElementById("photoUpload");
    const avatarImg = document.getElementById("avatarImg");
    const editPhotoBtn = document.getElementById("editPhotoBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const choosePhotoBtn = document.getElementById("choosePhotoBtn");
    const savePhotoBtn = document.getElementById("savePhotoBtn");
    const saveProfileBtn = document.getElementById("saveProfileBtn");
    const cancelBtn = document.getElementById("cancelBtn");

    if (editPhotoBtn) {
      editPhotoBtn.addEventListener("click", () => {
        if (preview && avatarImg) preview.src = avatarImg.src;
        if (modal) modal.classList.add("show");
        if (typeof feather !== "undefined") feather.replace();
      });
    }

    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", () => {
        if (modal) modal.classList.remove("show");
      });
    }

    if (choosePhotoBtn && uploadInput) {
      choosePhotoBtn.addEventListener("click", () => uploadInput.click());
    }

    if (uploadInput) {
      uploadInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
          this._showToast("Ukuran file melebihi 2 MB");
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (preview) preview.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    if (savePhotoBtn && preview && avatarImg) {
      savePhotoBtn.addEventListener("click", () => {
        if (preview.src && preview.src !== window.location.href) {
          avatarImg.src = preview.src;
        }
        if (modal) modal.classList.remove("show");
        this._showToast("Foto profil berhasil diperbarui");
      });
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("show");
      });
    }

    if (saveProfileBtn) {
      saveProfileBtn.addEventListener("click", () => {
        const session = authService.getSession();
        if (!session) return;

        const db = JSON.parse(localStorage.getItem("pilih-in-db") || "{}");
        const users = db.users || [];
        const idx = users.findIndex((u) => u.id === session.userId);
        if (idx === -1) return;

        const fullname = document.getElementById("fullname")?.value.trim();
        const email = document.getElementById("email")?.value.trim();
        const bio = document.getElementById("bio")?.value.trim();

        users[idx] = {
          ...users[idx],
          fullName: fullname || users[idx].username,
          email: email || users[idx].email,
          bio: bio || "",
          updatedAt: new Date().toISOString(),
        };
        db.users = users;
        localStorage.setItem("pilih-in-db", JSON.stringify(db));

        if (fullname) {
          const displayName = document.getElementById("displayName");
          if (displayName) displayName.textContent = fullname;
        }
        if (email) {
          const userEmail = document.getElementById("userEmail");
          if (userEmail) userEmail.textContent = email;
        }
        this._showToast("Perubahan profil berhasil disimpan");
      });
    }

    const themeCb = document.getElementById("profileTheme");
    if (themeCb) {
      themeCb.addEventListener("change", () => {
        const theme = themeCb.checked ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("pilih-in-theme", theme);
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        ["username", "fullname", "email", "bio"].forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.value = "";
        });
        const phoneEl = document.getElementById("phone");
        if (phoneEl) phoneEl.value = "+6289999999999";
        this._showToast("Perubahan dibatalkan");
      });
    }
  }

  _showToast(msg) {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }
}

export default AdminProfilePage;
