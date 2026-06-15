let filmId = null;
let filmData = null;
let posterFile = null;
let posterMode = "link";

const fi = () => {
  setTimeout(() => {
    if (typeof feather !== "undefined") feather.replace();
  }, 10);
};

function showToast(msg, type = "success") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const t = document.createElement("div");
  t.className = "toast" + (type === "error" ? " error" : "");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function getMasterDb() {
  return JSON.parse(localStorage.getItem("pilih-in-db"));
}

function saveMasterDb(db) {
  localStorage.setItem("pilih-in-db", JSON.stringify(db));
}

function loadFilmById(id) {
  const db = getMasterDb();
  if (db?.films) {
    const found = db.films.find((f) => f.id === id);
    if (found) return found;
  }
  return null;
}

// --- Rating (number input → 5 stars) ---
function fillStars(val) {
  const container = document.getElementById("starDisplay");
  if (!container) return;
  const starsToFill = Math.round((val || 0) / 2);
  const all = container.querySelectorAll(".star-btn, .feather-star");
  all.forEach((s, j) => {
    s.classList.toggle("filled", j < starsToFill);
  });
}

// --- Poster mode toggle ---
function setPosterMode(mode) {
  posterMode = mode;
  document.querySelectorAll(".ef-poster-toggle__btn").forEach((b) => {
    b.classList.toggle("ef-poster-toggle__btn--active", b.dataset.mode === mode);
  });
  document.getElementById("posterLinkMode").style.display = mode === "link" ? "block" : "none";
  document.getElementById("posterFileMode").style.display = mode === "file" ? "block" : "none";
}

function updatePosterPreview() {
  const preview = document.getElementById("posterPreview");
  const img = document.getElementById("previewImg");
  const hint = document.getElementById("posterHint");
  if (!preview || !img) return;

  let src = null;
  if (posterMode === "link") {
    src = document.getElementById("posterUrl")?.value.trim();
  } else if (posterFile) {
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
      preview.style.display = "block";
      if (hint) hint.style.display = "none";
    };
    reader.readAsDataURL(posterFile);
    return;
  }

  if (src) {
    img.src = src;
    preview.style.display = "block";
    if (hint) hint.style.display = "none";
  } else {
    preview.style.display = "none";
    img.src = "";
    if (hint) hint.style.display = "block";
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function populateForm(data) {
  document.getElementById("title").value = data.title || "";
  document.getElementById("sinopsis").value = data.sinopsis || "";
  document.getElementById("rating").value = data.rating || 1;
  document.getElementById("releaseDate").value = data.releaseDate || "";

  const posterVal = data.poster || "";
  if (posterVal.startsWith("data:image")) {
    setPosterMode("file");
    updatePosterPreview();
  } else {
    setPosterMode("link");
    document.getElementById("posterUrl").value = posterVal;
    updatePosterPreview();
  }

  fillStars(parseInt(document.getElementById("rating").value));
}

function getFormData() {
  const ratingVal = parseInt(document.getElementById("rating").value);
  return {
    title: document.getElementById("title").value.trim(),
    sinopsis: document.getElementById("sinopsis").value.trim(),
    rating: isNaN(ratingVal) ? 1 : ratingVal,
    releaseDate: document.getElementById("releaseDate").value,
    poster: document.getElementById("posterUrl")?.value.trim() || "",
  };
}

function validateForm(data) {
  if (!data.title) {
    showToast("Judul film wajib diisi", "error");
    return false;
  }
  if (!data.sinopsis) {
    showToast("Sinopsis wajib diisi", "error");
    return false;
  }
  if (!data.releaseDate) {
    showToast("Tanggal rilis wajib diisi", "error");
    return false;
  }
  return true;
}

async function handleSave() {
  let data = getFormData();
  if (!validateForm(data)) return;

  if (posterMode === "file" && posterFile) {
    data.poster = await fileToBase64(posterFile);
  }

  const db = getMasterDb();
  const dbIdx = (db.films || []).findIndex((f) => f.id === filmId);

  if (dbIdx === -1) {
    showToast("Film tidak ditemukan", "error");
    return;
  }

  db.films[dbIdx] = { ...db.films[dbIdx], ...data, status: "pending", updatedAt: new Date().toISOString() };
  saveMasterDb(db);
  try {
    await fetch("http://localhost:3000/api/content/films/" + filmId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(db.films.find(f => f.id === filmId)),
    });
  } catch (err) {
    console.warn("Gagal sync film ke server:", err);
  }

  showToast("Film berhasil disimpan!");
  setTimeout(() => {
    window.location.href = "konten.html";
  }, 1500);
}

function handleDelete() {
  const modal = document.getElementById("deleteModal");
  const titleEl = document.getElementById("deleteFilmTitle");
  if (titleEl && filmData) titleEl.textContent = filmData.title;
  if (modal) modal.classList.add("show");
}

async function confirmDelete() {
  const db = getMasterDb();
  db.films = (db.films || []).filter((f) => f.id !== filmId);
  saveMasterDb(db);
  try {
    await fetch("http://localhost:3000/api/content/films/" + filmId, { method: "DELETE" });
  } catch (err) {
    console.warn("Gagal hapus film dari server:", err);
  }

  showToast("Film berhasil dihapus!");
  setTimeout(() => {
    window.location.href = "konten.html";
  }, 1500);
}

function showForm() {
  document.getElementById("idLoaderSection").style.display = "none";
  document.getElementById("formSection").style.display = "block";
}

function hideForm() {
  document.getElementById("idLoaderSection").style.display = "block";
  document.getElementById("formSection").style.display = "none";
}

function initPage() {
  const params = new URLSearchParams(window.location.search);
  filmId = params.get("id");

  if (filmId) {
    filmData = loadFilmById(filmId);
    if (!filmData) {
      showToast("Film tidak ditemukan", "error");
      setTimeout(() => {
        window.location.href = "konten.html";
      }, 1500);
      return;
    }
    showForm();
    populateForm(filmData);
    const pageTitle = document.getElementById("pageTitle");
    if (pageTitle) pageTitle.textContent = `Edit: ${filmData.title}`;
    document.title = `Edit Film: ${filmData.title} - Pilih.in`;
  } else {
    hideForm();
  }

  // Rating input → fill stars
  document.getElementById("rating")?.addEventListener("input", (e) => {
    const val = parseInt(e.target.value) || 0;
    fillStars(val);
  });

  // Poster link input → preview
  document.getElementById("posterUrl")?.addEventListener("input", updatePosterPreview);

  // Poster mode toggle
  document.getElementById("posterToggle")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".ef-poster-toggle__btn");
    if (!btn) return;
    setPosterMode(btn.dataset.mode);
    updatePosterPreview();
  });

  // Poster file drop area
  const dropArea = document.getElementById("posterDropArea");
  const fileInput = document.getElementById("posterFileInput");

  dropArea?.addEventListener("click", () => fileInput?.click());

  dropArea?.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.style.borderColor = "var(--accent-primary)";
  });

  dropArea?.addEventListener("dragleave", () => {
    dropArea.style.borderColor = "";
  });

  dropArea?.addEventListener("drop", (e) => {
    e.preventDefault();
    dropArea.style.borderColor = "";
    const file = e.dataTransfer?.files?.[0];
    if (file) handlePosterFile(file);
  });

  fileInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) handlePosterFile(file);
  });

  function handlePosterFile(file) {
    if (!file.type.startsWith("image/")) {
      showToast("File harus berupa gambar", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Ukuran file maksimal 2 MB", "error");
      return;
    }
    posterFile = file;
    updatePosterPreview();
    showToast("Poster berhasil dipilih");
  }

  // Load by ID button
  document.getElementById("loadFilmBtn")?.addEventListener("click", () => {
    const id = document.getElementById("filmIdInput")?.value.trim();
    if (!id) {
      showToast("Masukkan ID film", "error");
      return;
    }
    const data = loadFilmById(id);
    if (!data) {
      showToast("Film tidak ditemukan", "error");
      return;
    }
    filmId = id;
    filmData = data;
    posterFile = null;
    showForm();
    populateForm(data);
    const pageTitle = document.getElementById("pageTitle");
    if (pageTitle) pageTitle.textContent = `Edit: ${data.title}`;
    document.title = `Edit Film: ${data.title} - Pilih.in`;
  });

  document.getElementById("saveFilmBtn")?.addEventListener("click", handleSave);
  document.getElementById("deleteFilmBtn")?.addEventListener("click", handleDelete);
  document.getElementById("confirmDeleteBtn")?.addEventListener("click", confirmDelete);
  document.getElementById("cancelDeleteBtn")?.addEventListener("click", () => {
    document.getElementById("deleteModal")?.classList.remove("show");
  });

  document.getElementById("cancelBtn")?.addEventListener("click", () => {
    window.location.href = "konten.html";
  });

  const modal = document.getElementById("deleteModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("show");
    });
  }
}

initPage();
