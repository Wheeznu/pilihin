let selectedFilms = [];
let currentDirectorId = null;
let currentDirectorData = null;

const fi = () => {
  setTimeout(() => {
    if (typeof feather !== "undefined") feather.replace();
  }, 10);
};

function getMasterDb() {
  return JSON.parse(localStorage.getItem("pilih-in-db"));
}

function getAllFilms() {
  const db = getMasterDb();
  return db?.films || [];
}

function loadFilmsDropdown() {
  const films = getAllFilms();
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

function renderSelectedFilms() {
  const container = document.getElementById("selectedFilmsList");
  if (!container) return;
  if (selectedFilms.length === 0) {
    container.innerHTML = '<span style="font-size: 13px; color: var(--text-muted);">Belum ada film yang dipilih</span>';
    fi();
    return;
  }
  const films = getAllFilms();
  container.innerHTML = selectedFilms
    .map((filmId, idx) => {
      const film = films.find((f) => f.id === filmId);
      const title = film ? film.title : filmId;
      return `<span class="films-count" style="display: inline-flex; align-items: center; gap: 6px;"><span>${title}</span><i data-feather="x" class="remove-film" data-idx="${idx}" style="width: 14px; height: 14px; cursor: pointer; color: var(--text-muted);"></i></span>`;
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

function loadDirectorById(id) {
  const db = getMasterDb();
  if (db?.directors) {
    const found = db.directors.find((d) => d.id === id);
    if (found) return found;
  }
  return null;
}

function populateForm(data) {
  currentDirectorData = data;
  document.getElementById("sutradaraId").value = data.id;
  document.getElementById("name").value = data.name || "";
  document.getElementById("birthDate").value = data.birthDate || "";
  document.getElementById("photo").value = data.photo || "";
  selectedFilms = [...(data.films || [])];
  renderSelectedFilms();
  const titleEl = document.querySelector(".page-header h1");
  if (titleEl) titleEl.innerHTML = `<i data-feather="user"></i> Edit Sutradara: ${data.name}`;
  document.title = `Edit Sutradara: ${data.name} - Pilih.in`;
  fi();
}

function initPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const idFromUrl = urlParams.get("id");

  const idLoaderSection = document.getElementById("idLoaderSection");
  const loadBtn = document.getElementById("loadSutradaraBtn");
  const idInput = document.getElementById("sutradaraIdInput");

  if (idFromUrl) {
    currentDirectorId = idFromUrl;
    const data = loadDirectorById(idFromUrl);
    if (data) {
      if (idLoaderSection) idLoaderSection.style.display = "none";
      populateForm(data);
    } else {
      showToast("Sutradara tidak ditemukan", "error");
      if (idLoaderSection) idLoaderSection.style.display = "flex";
    }
  } else {
    if (idLoaderSection) idLoaderSection.style.display = "flex";
  }

  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      const id = idInput?.value.trim();
      if (!id) {
        showToast("Masukkan ID Sutradara", "error");
        return;
      }
      const data = loadDirectorById(id);
      if (!data) {
        showToast("Sutradara dengan ID tersebut tidak ditemukan", "error");
        return;
      }
      currentDirectorId = id;
      if (idLoaderSection) idLoaderSection.style.display = "none";
      populateForm(data);
    });
  }

  document.getElementById("addFilmBtn")?.addEventListener("click", addFilm);

  document.getElementById("sutradaraForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name")?.value.trim();
    const birthDate = document.getElementById("birthDate")?.value;
    const photo = document.getElementById("photo")?.value.trim();

    if (!name) {
      showToast("Nama sutradara wajib diisi", "error");
      return;
    }
    if (!birthDate) {
      showToast("Tanggal lahir wajib diisi", "error");
      return;
    }

    const dirId = currentDirectorId || document.getElementById("sutradaraId")?.value;
    if (!dirId) {
      showToast("Data sutradara tidak ditemukan", "error");
      return;
    }

    const db = getMasterDb();
    const dbIdx = (db.directors || []).findIndex((d) => d.id === dirId);

    const updatedData = {
      ...(dbIdx !== -1 ? db.directors[dbIdx] : {}),
      id: dirId,
      name: name,
      birthDate: birthDate,
      photo: photo,
      films: [...selectedFilms],
      status: "pending",
      createdAt: dbIdx !== -1 ? db.directors[dbIdx].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (dbIdx !== -1) {
      db.directors[dbIdx] = updatedData;
    } else {
      db.directors = db.directors || [];
      db.directors.push(updatedData);
    }

    localStorage.setItem("pilih-in-db", JSON.stringify(db));

    try {
      await fetch("http://localhost:3000/api/content/directors/" + dirId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
    } catch (err) {
      console.warn("Gagal sync sutradara ke server:", err);
    }

    showToast("Sutradara berhasil disimpan!");
    setTimeout(() => {
      window.location.href = "/frontend/pages/admin/sutradara-edit.html?id=" + dirId;
    }, 1500);
  });

  document.getElementById("deleteSutradaraBtn")?.addEventListener("click", () => {
    const dirId = currentDirectorId || document.getElementById("sutradaraId")?.value;
    if (!dirId) {
      showToast("Tidak ada data sutradara untuk dihapus", "error");
      return;
    }
    const director = getMasterDb()?.directors?.find((d) => d.id === dirId);
    const modal = document.getElementById("deleteModal");
    const nameEl = document.getElementById("deleteDirectorName");
    if (nameEl && director) nameEl.textContent = director.name;
    if (modal) {
      modal.classList.add("show");
      modal.dataset.directorId = dirId;
    }
  });

  document.getElementById("cancelDeleteBtn")?.addEventListener("click", () => {
    const modal = document.getElementById("deleteModal");
    if (modal) modal.classList.remove("show");
  });

  document.getElementById("confirmDeleteBtn")?.addEventListener("click", async () => {
    const modal = document.getElementById("deleteModal");
    const dirId = modal?.dataset.directorId;
    if (dirId) {
      const db = getMasterDb();
      db.directors = (db.directors || []).filter((d) => d.id !== dirId);
      localStorage.setItem("pilih-in-db", JSON.stringify(db));

      try {
        await fetch("http://localhost:3000/api/content/directors/" + dirId, { method: "DELETE" });
      } catch (err) {
        console.warn("Gagal hapus sutradara dari server:", err);
      }

      if (modal) modal.classList.remove("show");
      showToast("Sutradara berhasil dihapus!");
      setTimeout(() => {
        window.location.href = "/frontend/pages/admin/konten.html";
      }, 1500);
    }
  });

  const modal = document.getElementById("deleteModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("show");
    });
  }

  document.getElementById("cancelBtn")?.addEventListener("click", () => {
    if (confirm("Yakin ingin membatalkan? Perubahan yang belum disimpan akan hilang.")) {
      window.location.href = "/frontend/pages/admin/sutradara-edit.html";
    }
  });

  loadFilmsDropdown();
}

function showToast(msg, type = "success") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const t = document.createElement("div");
  t.className = "toast" + (type === "error" ? " error" : "");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

initPage();
