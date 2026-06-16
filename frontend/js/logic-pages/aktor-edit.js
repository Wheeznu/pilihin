let selectedFilms = [];
let currentActorId = null;
let currentActorData = null;

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

function loadActorById(id) {
  const db = getMasterDb();
  if (db?.actors) {
    const found = db.actors.find((a) => a.id === id);
    if (found) return found;
  }
  return null;
}

function populateForm(actor) {
  currentActorData = actor;
  document.getElementById("aktorId").value = actor.id;
  document.getElementById("name").value = actor.name || "";
  document.getElementById("birthDate").value = actor.birthDate || "";
  document.getElementById("photo").value = actor.photo || "";
  selectedFilms = [...(actor.films || [])];
  renderSelectedFilms();
  const titleEl = document.querySelector(".page-header h1");
  if (titleEl) titleEl.innerHTML = `<i data-feather="users"></i> Edit Aktor: ${actor.name}`;
  document.title = `Edit Aktor: ${actor.name} - Pilih.in`;
  fi();
}

function initPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const idFromUrl = urlParams.get("id");

  const idLoaderSection = document.getElementById("idLoaderSection");
  const loadAktorBtn = document.getElementById("loadAktorBtn");
  const aktorIdInput = document.getElementById("aktorIdInput");

  if (idFromUrl) {
    currentActorId = idFromUrl;
    const actor = loadActorById(idFromUrl);
    if (actor) {
      if (idLoaderSection) idLoaderSection.style.display = "none";
      populateForm(actor);
    } else {
      showToast("Aktor tidak ditemukan", "error");
      if (idLoaderSection) idLoaderSection.style.display = "flex";
    }
  } else {
    if (idLoaderSection) idLoaderSection.style.display = "flex";
  }

  if (loadAktorBtn) {
    loadAktorBtn.addEventListener("click", () => {
      const id = aktorIdInput?.value.trim();
      if (!id) {
        showToast("Masukkan ID Aktor", "error");
        return;
      }
      const actor = loadActorById(id);
      if (!actor) {
        showToast("Aktor dengan ID tersebut tidak ditemukan", "error");
        return;
      }
      currentActorId = id;
      if (idLoaderSection) idLoaderSection.style.display = "none";
      populateForm(actor);
    });
  }

  document.getElementById("addFilmBtn")?.addEventListener("click", addFilm);

  document.getElementById("aktorForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name")?.value.trim();
    const birthDate = document.getElementById("birthDate")?.value;
    const photo = document.getElementById("photo")?.value.trim();

    if (!name) {
      showToast("Nama aktor wajib diisi", "error");
      return;
    }
    if (!birthDate) {
      showToast("Tanggal lahir wajib diisi", "error");
      return;
    }

    const actorId = currentActorId || document.getElementById("aktorId")?.value;
    if (!actorId) {
      showToast("Data aktor tidak ditemukan", "error");
      return;
    }

    const db = getMasterDb();
    const dbIdx = (db.actors || []).findIndex((a) => a.id === actorId);

    const updatedActor = {
      ...(dbIdx !== -1 ? db.actors[dbIdx] : {}),
      id: actorId,
      name: name,
      birthDate: birthDate,
      photo: photo,
      films: [...selectedFilms],
      status: "pending",
      createdAt: dbIdx !== -1 ? db.actors[dbIdx].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (dbIdx !== -1) {
      db.actors[dbIdx] = updatedActor;
    } else {
      db.actors = db.actors || [];
      db.actors.push(updatedActor);
    }

    localStorage.setItem("pilih-in-db", JSON.stringify(db));

    try {
      await fetch("http://localhost:3000/api/content/actors/" + actorId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedActor),
      });
    } catch (err) {
      console.warn("Gagal sync aktor ke server:", err);
    }

    showToast("Aktor berhasil disimpan!");
    setTimeout(() => {
      window.location.href = "/frontend/pages/admin/aktor-edit.html?id=" + actorId;
    }, 1500);
  });

  document.getElementById("deleteAktorBtn")?.addEventListener("click", () => {
    const actorId = currentActorId || document.getElementById("aktorId")?.value;
    if (!actorId) {
      showToast("Tidak ada data aktor untuk dihapus", "error");
      return;
    }
    const actor = getMasterDb()?.actors?.find((a) => a.id === actorId);
    const modal = document.getElementById("deleteModal");
    const nameEl = document.getElementById("deleteActorName");
    if (nameEl && actor) nameEl.textContent = actor.name;
    if (modal) {
      modal.classList.add("show");
      modal.dataset.actorId = actorId;
    }
  });

  document.getElementById("cancelDeleteBtn")?.addEventListener("click", () => {
    const modal = document.getElementById("deleteModal");
    if (modal) modal.classList.remove("show");
  });

  document.getElementById("confirmDeleteBtn")?.addEventListener("click", async () => {
    const modal = document.getElementById("deleteModal");
    const actorId = modal?.dataset.actorId;
    if (actorId) {
      const db = getMasterDb();
      db.actors = (db.actors || []).filter((a) => a.id !== actorId);
      localStorage.setItem("pilih-in-db", JSON.stringify(db));

      try {
        await fetch("http://localhost:3000/api/content/actors/" + actorId, { method: "DELETE" });
      } catch (err) {
        console.warn("Gagal hapus aktor dari server:", err);
      }

      if (modal) modal.classList.remove("show");
      showToast("Aktor berhasil dihapus!");
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
      window.location.href = "/frontend/pages/admin/aktor-edit.html";
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
