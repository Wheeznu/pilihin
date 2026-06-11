// ========================================
// DATA STATE
// ========================================
const state = {
  user: {
    fullname: "Budi Santoso",
    username: "budi.santoso",
    email: "budi.santoso@gmail.com",
    role: "member",
    status: "active",
    subscriptionTier: "Premium",
    subscriptionExpiry: "15 Juni 2026",
    memberSince: "15 Januari 2024",
  },
  stats: {
    moviesWatched: 47,
    favorites: 12,
    watchHours: 128,
  },
  selectedAvatarFile: null,
};

// ========================================
// FUNGSI UTILITAS
// ========================================
const showToast = (message, type = "success") => {
  const existingToast = document.querySelector(".toast");
  if (existingToast) existingToast.remove();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
};

const initFeather = () => {
  if (typeof feather !== "undefined") feather.replace();
};

// ========================================
// RENDER UI
// ========================================
const renderProfile = () => {
  // Render teks sederhana
  document.getElementById("profileName").textContent = state.user.fullname;
  document.getElementById("profileEmail").textContent = state.user.email;
  document.getElementById("profileRole").textContent =
    state.user.role === "admin" ? "Admin" : "Member";
  document.getElementById("profileStatus").textContent =
    state.user.status === "active" ? "Aktif" : "Tidak Aktif";

  // Render Stats
  document.getElementById("statMovies").textContent = state.stats.moviesWatched;
  document.getElementById("statFavorites").textContent = state.stats.favorites;
  document.getElementById("statHours").textContent = state.stats.watchHours;

  // Render Info List dengan Template Literals
  const infoList = document.getElementById("infoList");
  if (infoList) {
    infoList.innerHTML = `
                    ${renderInfoRow("Nama Lengkap", state.user.fullname)}
                    ${renderInfoRow("Username", state.user.username)}
                    ${renderInfoRow("Email", state.user.email)}
                    ${renderInfoRow("Role", state.user.role === "admin" ? "Administrator" : "Member")}
                    ${renderInfoRow("Status", state.user.status === "active" ? "Aktif" : "Tidak Aktif")}
                    ${renderInfoRow("Bergabung", state.user.memberSince)}
                `;
  }

  // Render Subscription
  const subEl = document.getElementById("subscriptionInfo");
  if (subEl) {
    subEl.innerHTML = `
                    <div class="subscription-plan">${state.user.subscriptionTier}</div>
                    <div class="subscription-expiry">Berlaku hingga: ${state.user.subscriptionExpiry}</div>
                `;
  }
  initFeather();
};

const renderInfoRow = (label, value) => `
            <div class="info-row">
                <span class="info-label">${label}</span>
                <span class="info-value">${value}</span>
            </div>
        `;

// ========================================
// MANAJEMEN MODAL & AVATAR
// ========================================
const toggleModal = (modalId, show = true) => {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.toggle("active", show);
};

const handleAvatarChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/"))
    return showToast("File harus gambar!", "error");
  if (file.size > 2 * 1024 * 1024) return showToast("Maksimal 2MB!", "error");

  state.selectedAvatarFile = file;
  const reader = new FileReader();
  reader.onload = (event) => {
    document.getElementById("avatarPreview").src = event.target.result;
    document.getElementById("saveAvatarBtn").disabled = false;
  };
  reader.readAsDataURL(file);
};

// ========================================
// INISIALISASI & EVENT BINDING
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  renderProfile();

  // Theme logic
  const savedTheme = localStorage.getItem("pilih-in-theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  // Event Listeners
  document.getElementById("themeToggleBtn")?.addEventListener("click", () => {
    const newTheme =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("pilih-in-theme", newTheme);
  });

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    if (confirm("Keluar dari akun?")) {
      localStorage.removeItem("pilih-in-session");
      window.location.href = "/frontend/pages/main/login.html";
    }
  });

  // Avatar Handlers
  document
    .getElementById("editAvatarBtn")
    ?.addEventListener("click", () => toggleModal("avatarModal"));
  document
    .getElementById("closeAvatarBtn")
    ?.addEventListener("click", () => toggleModal("avatarModal", false));
  document
    .getElementById("avatarFile")
    ?.addEventListener("change", handleAvatarChange);

  // Select Image Button
  document.getElementById("selectImageBtn")?.addEventListener("click", () => {
    document.getElementById("avatarFile").click();
  });

  document.getElementById("saveAvatarBtn")?.addEventListener("click", () => {
    document.getElementById("profileAvatar").src =
      document.getElementById("avatarPreview").src;
    showToast("Avatar diperbarui!");
    toggleModal("avatarModal", false);
  });

  // Overlay close
  document.getElementById("avatarOverlay")?.addEventListener("click", () => {
    toggleModal("avatarModal", false);
  });
});
