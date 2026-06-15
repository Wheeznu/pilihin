// frontend/js/logic-pages/film-create.js

let actors = [];
let posterFile = null;
let posterLink = "";
let posterMode = "link";
let rating = 0;

// Feather helpers
const fi = () => {
  setTimeout(() => {
    if (typeof feather !== "undefined") feather.replace();
  }, 10);
};

// Progress tracker
const progressFields = {
  title: () => document.getElementById("title")?.value.trim().length > 0,
  sinopsis: () => document.getElementById("sinopsis")?.value.trim().length > 0,
  releaseDate: () => document.getElementById("releaseDate")?.value.length > 0,
  rating: () => rating > 0,
  trailerLink: () =>
    document.getElementById("trailerLink")?.value.trim().length > 0,
  videoLink: () =>
    document.getElementById("videoLink")?.value.trim().length > 0,
  poster: () =>
    posterMode === "link"
      ? document.getElementById("posterUrl")?.value.trim().length > 0
      : posterFile !== null,
};

function updateProgress() {
  const keys = Object.keys(progressFields);
  let done = 0;
  keys.forEach((k) => {
    const el = document.getElementById("pf-" + k);
    const isDone = progressFields[k]();
    if (isDone) done++;
    if (el) el.classList.toggle("done", isDone);
  });
  const pct = Math.round((done / keys.length) * 100);
  const bar = document.getElementById("progressBar");
  const label = document.getElementById("progressPct");
  if (bar) bar.style.width = pct + "%";
  if (label) label.textContent = pct + "%";
}

// Watch inputs
["title", "sinopsis", "releaseDate", "trailerLink", "videoLink"].forEach(
  (id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updateProgress);
  },
);

// Rating via text input → stars visual
const starContainer = document.getElementById("starContainer");
const ratingInput = document.getElementById("ratingInput");

function fillStars(val) {
  if (!starContainer) return;
  const starsToFill = Math.round((val || 0) / 2);
  const all = starContainer.querySelectorAll(".star-btn, .feather-star");
  all.forEach((s, j) => {
    s.classList.toggle("filled", j < starsToFill);
  });
}

ratingInput?.addEventListener("input", () => {
  const val = parseInt(ratingInput.value) || 0;
  rating = Math.max(0, Math.min(10, val));
  fillStars(rating);
  updateProgress();
});

// Poster mode toggle
function setPosterMode(mode) {
  posterMode = mode;
  document.querySelectorAll(".ef-poster-toggle__btn").forEach((b) => {
    b.classList.toggle("ef-poster-toggle__btn--active", b.dataset.mode === mode);
  });
  document.getElementById("posterLinkMode").style.display = mode === "link" ? "block" : "none";
  document.getElementById("posterFileMode").style.display = mode === "file" ? "block" : "none";
  updateProgress();
}

document.getElementById("posterToggle")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".ef-poster-toggle__btn");
  if (btn) setPosterMode(btn.dataset.mode);
});

document.getElementById("posterUrl")?.addEventListener("input", () => {
  posterLink = document.getElementById("posterUrl")?.value.trim() || "";
  updateProgress();
});

// Poster upload
const posterInput = document.getElementById("posterInput");
const posterPreview = document.getElementById("posterPreview");
const previewImg = document.getElementById("previewImg");

const posterDropArea = document.getElementById("posterDropArea");
if (posterDropArea) {
  posterDropArea.addEventListener("click", () => posterInput.click());
  posterDropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    posterDropArea.style.borderColor = "var(--accent-primary)";
  });
  posterDropArea.addEventListener("dragleave", () => {
    posterDropArea.style.borderColor = "";
  });
  posterDropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    posterDropArea.style.borderColor = "";
    const file = e.dataTransfer.files[0];
    if (file) handlePosterFile(file);
  });
}

if (posterInput) {
  posterInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) handlePosterFile(file);
  });
}

function handlePosterFile(file) {
  if (file.size > 2 * 1024 * 1024) {
    showToast("Ukuran file maksimal 2 MB", "error");
    return;
  }
  if (!file.type.startsWith("image/")) {
    showToast("File harus berupa gambar", "error");
    return;
  }

  posterFile = file;
  posterLink = "";
  const reader = new FileReader();
  reader.onload = (ev) => {
    if (posterPreview) posterPreview.style.display = "block";
    if (previewImg) previewImg.src = ev.target.result;
  };
  reader.readAsDataURL(file);
  updateProgress();
}

// Actors functions
function renderActors() {
  const container = document.getElementById("actorsList");
  if (!container) return;

  if (actors.length === 0) {
    container.innerHTML =
      '<span class="tf-actor-empty">Belum ada pemeran ditambahkan</span>';
    fi();
    return;
  }

  container.innerHTML = actors
    .map(
      (a, idx) => `
        <span class="actor-tag">
            ${a}
            <i data-feather="x" class="remove-actor" data-index="${idx}"></i>
        </span>
    `,
    )
    .join("");

  document.querySelectorAll(".remove-actor").forEach((btn) => {
    btn.addEventListener("click", () => {
      actors.splice(parseInt(btn.dataset.index), 1);
      renderActors();
    });
  });
  fi();
}

function addActor() {
  const input = document.getElementById("actorInput");
  const name = input?.value.trim();
  if (!name) {
    showToast("Masukkan nama aktor", "error");
    return;
  }
  if (actors.includes(name)) {
    showToast("Aktor sudah ditambahkan", "error");
    return;
  }
  actors.push(name);
  renderActors();
  if (input) {
    input.value = "";
    input.focus();
  }
}

document.getElementById("addActorBtn")?.addEventListener("click", addActor);
document.getElementById("actorInput")?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addActor();
  }
});

// Cancel button
document.getElementById("cancelBtn")?.addEventListener("click", () => {
  if (confirm("Yakin ingin membatalkan? Data yang diisi akan hilang.")) {
    window.location.href = "/frontend/pages/admin/konten.html";
  }
});

// Konversi file ke base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Form submit
document.getElementById("filmForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title")?.value.trim();
  const sinopsis = document.getElementById("sinopsis")?.value.trim();
  const releaseDate = document.getElementById("releaseDate")?.value;
  const trailerLink = document.getElementById("trailerLink")?.value.trim();
  const videoLink = document.getElementById("videoLink")?.value.trim();

  if (!title) {
    showToast("Judul film wajib diisi", "error");
    return;
  }
  if (!sinopsis) {
    showToast("Sinopsis wajib diisi", "error");
    return;
  }
  if (rating === 0) {
    showToast("Rating wajib dipilih", "error");
    return;
  }
  if (!releaseDate) {
    showToast("Release date wajib diisi", "error");
    return;
  }
  if (!trailerLink) {
    showToast("Link trailer wajib diisi", "error");
    return;
  }
  if (!videoLink) {
    showToast("Link video film wajib diisi", "error");
    return;
  }

  // Dapatkan poster
  let posterValue = "";
  if (posterMode === "link") {
    posterValue = document.getElementById("posterUrl")?.value.trim() || "";
  } else if (posterFile) {
    posterValue = await fileToBase64(posterFile);
  }

  const filmData = {
    id: "film-" + Date.now(),
    title: title,
    sinopsis: sinopsis,
    rating: rating,
    actors: [...actors],
    releaseDate: releaseDate,
    trailerLink: trailerLink,
    videoLink: videoLink,
    poster: posterValue,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const db = JSON.parse(localStorage.getItem("pilih-in-db"));
  db.films = db.films || [];
  db.films.push(filmData);
  localStorage.setItem("pilih-in-db", JSON.stringify(db));

  try {
    await fetch("http://localhost:3000/api/content/films", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filmData),
    });
  } catch (err) {
    console.warn("Gagal sync film ke server:", err);
  }

  showToast("Film berhasil ditambahkan!");
  setTimeout(() => {
    window.location.href = "/frontend/pages/admin/konten.html";
  }, 1500);
});

function showToast(msg, type = "success") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const t = document.createElement("div");
  t.className = "toast" + (type === "error" ? " error" : "");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// Initial progress update
updateProgress();
