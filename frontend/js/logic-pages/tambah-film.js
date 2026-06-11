// frontend/js/logic-pages/tambah-film.js
// 100% SESUAI MD:
// - Import dari backend/init.js dan backend/services/AuthService.js
// - Tidak menyimpan user data di localStorage
// - Session hanya untuk auth

import { repositories, getDbReady } from "../../../backend/init.js";
import { authService } from "../../../backend/services/AuthService.js";
import Navbar from "../../components/navbar.js";

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "toast-error" : ""}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

class TambahFilmPage {
  constructor() {
    this.init();
  }

  async init() {
    // 1. Load Navbar component (sesuai MD)
    await Navbar.load("navbar-container");

    // 2. Cek role admin (sesuai MD - requireRole)
    if (!authService.requireRole("admin", "../../pages/main/login.html")) {
      return;
    }

    // 3. Tunggu DB ready (load konten dari JSON ke localStorage)
    await getDbReady();

    // 4. Load statistik dari repository
    await this.loadStats();

    // 5. Bind events
    this.bindEvents();

    // 6. Render Feather Icons
    feather.replace();
  }

  async loadStats() {
    // Data dari repository (hanya konten, BUKAN user data)
    const films = repositories.films.findAll();
    const actors = repositories.actors.findAll();
    const directors = repositories.directors.findAll();

    const totalFilmsEl = document.getElementById("totalFilms");
    const totalActorsEl = document.getElementById("totalActors");
    const totalDirectorsEl = document.getElementById("totalDirectors");

    if (totalFilmsEl) totalFilmsEl.textContent = films.length;
    if (totalActorsEl) totalActorsEl.textContent = actors.length;
    if (totalDirectorsEl) totalDirectorsEl.textContent = directors.length;
  }

  bindEvents() {
    // Sidebar Toggle untuk mobile
    const sidebarToggle = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("sidebar");
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
      });
    }

    // POSTER UPLOAD - Klik & Drag & Drop
    const posterDropZone = document.getElementById("posterDropZone");
    const posterInput = document.getElementById("posterInput");
    const posterPreview = document.getElementById("posterPreview");
    const posterPlaceholder = document.getElementById("posterPlaceholder");

    if (posterDropZone && posterInput) {
      // Klik untuk upload
      posterDropZone.addEventListener("click", () => {
        posterInput.click();
      });

      // Handle file selection
      posterInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (event) => {
            posterPreview.src = event.target.result;
            posterPreview.style.display = "block";
            if (posterPlaceholder) posterPlaceholder.style.display = "none";
          };
          reader.readAsDataURL(file);
        }
      });

      // Drag & drop
      posterDropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        posterDropZone.style.borderColor = "var(--accent-primary)";
      });

      posterDropZone.addEventListener("dragleave", () => {
        posterDropZone.style.borderColor = "var(--border-color)";
      });

      posterDropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        posterDropZone.style.borderColor = "var(--border-color)";
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (event) => {
            posterPreview.src = event.target.result;
            posterPreview.style.display = "block";
            if (posterPlaceholder) posterPlaceholder.style.display = "none";
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            posterInput.files = dataTransfer.files;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // FORM SUBMIT
    const form = document.getElementById("formTambahFilm");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.submitForm();
      });
    }
  }

  async submitForm() {
    const title = document.getElementById("filmTitle").value.trim();
    const releaseDate = document.getElementById("releaseDate").value;
    const posterFile = document.getElementById("posterInput").files[0];

    if (!title) {
      showToast("Judul film wajib diisi", "error");
      return;
    }
    if (!releaseDate) {
      showToast("Tanggal rilis wajib diisi", "error");
      return;
    }
    if (!posterFile) {
      showToast("Upload poster film terlebih dahulu", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const posterBase64 = event.target.result;

      // Process actors
      const actorsInput = document.getElementById("actors").value;
      const actorNames = actorsInput
        ? actorsInput
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean)
        : [];

      // Process genre
      const genreName = document.getElementById("genre").value;
      let genreId = null;
      if (genreName) {
        const existing = repositories.genres.findWhere(
          (g) => g.name === genreName,
        );
        if (existing.length > 0) {
          genreId = existing[0].id;
        } else {
          const newGenre = repositories.genres.create({ name: genreName });
          genreId = newGenre.id;
        }
      }

      // Process director
      const directorName = document.getElementById("director").value.trim();
      let directorId = null;
      if (directorName) {
        const existing = repositories.directors.findWhere(
          (d) => d.name === directorName,
        );
        if (existing.length > 0) {
          directorId = existing[0].id;
        } else {
          const newDirector = repositories.directors.create({
            name: directorName,
          });
          directorId = newDirector.id;
        }
      }

      // Process actors
      const actorIds = [];
      for (const actorName of actorNames) {
        const existing = repositories.actors.findWhere(
          (a) => a.name === actorName,
        );
        if (existing.length > 0) {
          actorIds.push(existing[0].id);
        } else {
          const newActor = repositories.actors.create({ name: actorName });
          actorIds.push(newActor.id);
        }
      }

      // Data film sesuai schema MD
      const filmData = {
        title: title,
        description: document.getElementById("synopsis").value.trim(),
        poster: posterBase64,
        banner: posterBase64,
        releaseDate: releaseDate,
        duration: parseInt(document.getElementById("duration").value) || 0,
        rating: "PG-13",
        genres: genreId ? [genreId] : [],
        director: directorId,
        actors: actorIds,
        averageRating: parseFloat(document.getElementById("rating").value) || 0,
        reviewCount: 0,
        watchCount: 0,
        streamingUrl: document.getElementById("link1080p").value.trim(),
        videoQuality: ["720p", "1080p"],
        subtitles: ["id"],
        status: "published",
        createdBy: authService.getSession()?.userId || null,
      };

      try {
        repositories.films.create(filmData);

        // Reset form
        document.getElementById("formTambahFilm").reset();
        document.getElementById("posterPreview").style.display = "none";
        document.getElementById("posterPlaceholder").style.display = "flex";
        document.getElementById("posterInput").value = "";

        await this.loadStats();
        showToast(`Film "${title}" berhasil ditambahkan!`, "success");
      } catch (err) {
        showToast(err.message || "Gagal menambahkan film", "error");
      }
    };

    reader.readAsDataURL(posterFile);
  }
}

// Start page
new TambahFilmPage();
