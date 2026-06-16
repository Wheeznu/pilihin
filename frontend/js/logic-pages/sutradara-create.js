// frontend/js/logic-pages/sutradara-create.js

let selectedFilms = [];
let photoFile = null;

// Feather helpers
const fi = () => {
  setTimeout(() => {
    if (typeof feather !== "undefined") feather.replace();
  }, 10);
};

// Load film dropdown
function loadFilmsDropdown() {
  const films = JSON.parse(localStorage.getItem("pilih-in-db"))?.films || [];
  const select = document.getElementById("filmSelect");
  if (!select) return;

  select.innerHTML = '<option value="">- Pilih Film -</option>';
  films.forEach((film) => {
    const option = document.createElement("option");
    option.value = film.id;
    option.textContent = film.title;
    select.appendChild(option);
  });
}

// Render selected films
function renderSelectedFilms() {
  const container = document.getElementById("selectedFilmsList");
  if (!container) return;

  if (selectedFilms.length === 0) {
    container.innerHTML =
      '<span class="sc-film-empty">Belum ada film yang dipilih</span>';
    fi();
    return;
  }

  const films = JSON.parse(localStorage.getItem("pilih-in-db"))?.films || [];
  container.innerHTML = selectedFilms
    .map((filmId, idx) => {
      const film = films.find((f) => f.id === filmId);
      const title = film ? film.title : filmId;
      return `
            <span class="film-tag">
                ${title}
                <i data-feather="x" class="remove-film" data-idx="${idx}"></i>
            </span>
        `;
    })
    .join("");

  document.querySelectorAll(".remove-film").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedFilms.splice(parseInt(btn.dataset.idx), 1);
      renderSelectedFilms();
    });
  });
  fi();
}

// Add film to list
function addFilm() {
  const select = document.getElementById("filmSelect");
  const id = select?.value;
  if (!id) {
    showToast("Pilih film terlebih dahulu", "error");
    return;
  }
  if (selectedFilms.includes(id)) {
    showToast("Film sudah ditambahkan", "error");
    return;
  }
  selectedFilms.push(id);
  renderSelectedFilms();
  select.value = "";
}

// Photo upload
const photoArea = document.getElementById("photoUpload");
const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");
const previewImg = document.getElementById("previewImg");

if (photoArea) {
  photoArea.addEventListener("click", () => photoInput?.click());
}

if (photoInput) {
  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Ukuran file maksimal 2 MB", "error");
      return;
    }
    if (!file.type.startsWith("image/")) {
      showToast("File harus berupa gambar", "error");
      return;
    }

    photoFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (photoPreview) photoPreview.style.display = "block";
      if (previewImg) previewImg.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    showToast("Foto berhasil diupload");
  });
}

// Konversi file ke base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Submit form
document
  .getElementById("sutradaraForm")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name")?.value.trim();
    const bio = document.getElementById("bio")?.value.trim();
    const birthDate = document.getElementById("birthDate")?.value;

    if (!name) {
      showToast("Nama sutradara wajib diisi", "error");
      return;
    }
    if (!bio) {
      showToast("Bio sutradara wajib diisi", "error");
      return;
    }
    if (!birthDate) {
      showToast("Tanggal lahir wajib diisi", "error");
      return;
    }

    let photoBase64 = null;
    if (photoFile) {
      photoBase64 = await fileToBase64(photoFile);
    }

    const directorData = {
      id: "director-" + Date.now(),
      name: name,
      bio: bio,
      birthDate: birthDate,
      photo: photoBase64,
      films: [...selectedFilms],
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const db = JSON.parse(localStorage.getItem("pilih-in-db"));
    db.directors = db.directors || [];
    db.directors.push(directorData);
    localStorage.setItem("pilih-in-db", JSON.stringify(db));

  try {
    await fetch("http://localhost:3000/api/content/directors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(directorData),
    });
  } catch (err) {
    console.warn("Gagal sync sutradara ke server:", err);
  }

    showToast("Sutradara berhasil ditambahkan!");
    setTimeout(() => {
      window.location.href = "/frontend/pages/admin/sutradara-edit.html";
    }, 1500);
  });

// Cancel button
document.getElementById("cancelBtn")?.addEventListener("click", () => {
  if (confirm("Yakin ingin membatalkan? Data yang diisi akan hilang.")) {
    window.location.href = "/frontend/pages/admin/sutradara-edit.html";
  }
});

// Add film button
document.getElementById("addFilmBtn")?.addEventListener("click", addFilm);

// Initial load
loadFilmsDropdown();
renderSelectedFilms();

function showToast(msg, type = "success") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const t = document.createElement("div");
  t.className = "toast" + (type === "error" ? " error" : "");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
