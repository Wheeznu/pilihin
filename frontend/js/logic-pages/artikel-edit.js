let artikelId = null;
let artikelData = null;
let artikelType = "artikel";

const fi = () => {
  setTimeout(() => {
    if (typeof feather !== "undefined") feather.replace();
  }, 10);
};

function showToast(msg, type) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const t = document.createElement("div");
  t.className = "toast" + (type === "error" ? " error" : "");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function getDb() {
  try {
    return JSON.parse(localStorage.getItem("pilih-in-db")) || { articles: [], news: [] };
  } catch {
    return { articles: [], news: [] };
  }
}

function saveDb(db) {
  localStorage.setItem("pilih-in-db", JSON.stringify(db));
}

function loadDataById(id) {
  const db = getDb();
  const article = (db.articles || []).find((a) => a.id === id);
  if (article) return { data: article, type: "artikel" };
  const news = (db.news || []).find((n) => n.id === id);
  if (news) return { data: news, type: "berita" };
  return null;
}

function updateCoverPreview() {
  const url = document.getElementById("coverImage").value.trim();
  const preview = document.getElementById("coverPreview");
  const img = document.getElementById("previewImg");
  if (!preview || !img) return;
  if (url) {
    preview.style.display = "block";
    img.src = url;
  } else {
    preview.style.display = "none";
    img.src = "";
  }
}

function showForm() {
  document.getElementById("idLoaderSection").style.display = "none";
  document.getElementById("formSection").style.display = "block";
}

function hideForm() {
  document.getElementById("idLoaderSection").style.display = "block";
  document.getElementById("formSection").style.display = "none";
}

function populateForm(data) {
  document.getElementById("title").value = data.title || "";
  document.getElementById("slug").value = data.slug || "";
  document.getElementById("category").value = data.category || "";
  document.getElementById("coverImage").value = data.coverImage || "";
  document.getElementById("excerpt").value = data.excerpt || "";
  document.getElementById("content").value = data.content || "";
  document.getElementById("typeToggle").value = artikelType;
  updateCoverPreview();
}

function initPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const idFromUrl = urlParams.get("id");

  if (idFromUrl) {
    const result = loadDataById(idFromUrl);
    if (result) {
      artikelId = idFromUrl;
      artikelData = result.data;
      artikelType = result.type;
      populateForm(artikelData);
      showForm();
      const pageTitle = document.getElementById("pageTitle");
      if (pageTitle) pageTitle.textContent = `Edit ${artikelType === "artikel" ? "Artikel" : "Berita"}: ${artikelData.title}`;
      document.title = `Edit ${artikelType === "artikel" ? "Artikel" : "Berita"}: ${artikelData.title} - Pilih.in`;
    } else {
      showToast("Konten tidak ditemukan", "error");
      setTimeout(() => { window.location.href = "konten.html"; }, 1500);
    }
  } else {
    hideForm();
  }

  document.getElementById("typeToggle")?.addEventListener("change", (e) => {
    artikelType = e.target.value;
  });

  document.getElementById("coverImage")?.addEventListener("input", updateCoverPreview);

  document.getElementById("loadArtikelBtn")?.addEventListener("click", () => {
    const input = document.getElementById("artikelIdInput");
    const id = input?.value.trim();
    if (!id) {
      showToast("Masukkan ID konten", "error");
      return;
    }
    const result = loadDataById(id);
    if (result) {
      artikelId = id;
      artikelData = result.data;
      artikelType = result.type;
      document.getElementById("typeToggle").value = artikelType;
      populateForm(artikelData);
      showForm();
      const pageTitle = document.getElementById("pageTitle");
      if (pageTitle) pageTitle.textContent = `Edit ${artikelType === "artikel" ? "Artikel" : "Berita"}: ${artikelData.title}`;
      document.title = `Edit ${artikelType === "artikel" ? "Artikel" : "Berita"}: ${artikelData.title} - Pilih.in`;
    } else {
      showToast("Konten tidak ditemukan", "error");
    }
  });

  document.getElementById("artikelForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!artikelId || !artikelData) {
      showToast("Load data konten terlebih dahulu", "error");
      return;
    }

    const title = document.getElementById("title")?.value.trim();
    const slug = document.getElementById("slug")?.value.trim();
    const category = document.getElementById("category")?.value.trim();
    const coverImage = document.getElementById("coverImage")?.value.trim();
    const excerpt = document.getElementById("excerpt")?.value.trim();
    const content = document.getElementById("content")?.value.trim();

    if (!title) {
      showToast("Judul wajib diisi", "error");
      return;
    }
    if (!content) {
      showToast("Konten wajib diisi", "error");
      return;
    }

    const updatedData = {
      ...artikelData,
      title,
      slug: slug || title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      category,
      coverImage,
      excerpt,
      content,
      status: "pending",
      updatedAt: new Date().toISOString(),
    };

    const db = getDb();
    let targetArray = artikelType === "artikel" ? "articles" : "news";

    if (artikelType !== (artikelData._subtype || (artikelData.publishedAt ? "berita" : "artikel"))) {
      const sourceArray = (artikelData._subtype || (artikelData.publishedAt ? "berita" : "artikel")) === "artikel" ? "articles" : "news";
      db[sourceArray] = (db[sourceArray] || []).filter((item) => item.id !== artikelId);
    }

    const index = (db[targetArray] || []).findIndex((item) => item.id === artikelId);
    if (index !== -1) {
      db[targetArray][index] = updatedData;
    } else {
      db[targetArray] = db[targetArray] || [];
      db[targetArray].push(updatedData);
    }

    saveDb(db);
    showToast("Konten berhasil diperbarui!");
    setTimeout(() => { window.location.href = "konten.html"; }, 1500);
  });

  document.getElementById("deleteArtikelBtn")?.addEventListener("click", () => {
    if (!artikelData) {
      showToast("Load data konten terlebih dahulu", "error");
      return;
    }
    const titleEl = document.getElementById("deleteArtikelTitle");
    if (titleEl) titleEl.textContent = artikelData.title;
    document.getElementById("deleteModal")?.classList.add("show");
  });

  document.getElementById("confirmDeleteBtn")?.addEventListener("click", () => {
    if (!artikelId) return;
    const db = getDb();
    const targetArray = artikelType === "artikel" ? "articles" : "news";
    db[targetArray] = (db[targetArray] || []).filter((item) => item.id !== artikelId);
    saveDb(db);
    document.getElementById("deleteModal")?.classList.remove("show");
    showToast("Konten berhasil dihapus!");
    setTimeout(() => { window.location.href = "konten.html"; }, 1500);
  });

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
