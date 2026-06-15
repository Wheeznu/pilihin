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
  return JSON.parse(localStorage.getItem("pilih-in-db")) || { articles: [], news: [] };
}

function saveDb(db) {
  localStorage.setItem("pilih-in-db", JSON.stringify(db));
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

document.getElementById("artikelForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const itemType = document.getElementById("itemType")?.value;
  const title = document.getElementById("title")?.value.trim();
  const slugInput = document.getElementById("slug")?.value.trim();
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

  const slug = slugInput || generateSlug(title);
  const prefix = itemType === "artikel" ? "artikel" : "berita";
  const id = prefix + "-" + Date.now();

  const newItem = {
    id,
    title,
    slug,
    category,
    coverImage,
    excerpt,
    content,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const db = getDb();
  const key = itemType === "artikel" ? "articles" : "news";
  db[key] = db[key] || [];
  db[key].push(newItem);
  saveDb(db);

  try {
    await fetch("http://localhost:3000/api/content/" + (itemType === "artikel" ? "articles" : "news"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    });
  } catch (err) {
    console.warn("Gagal sync artikel/berita ke server:", err);
  }

  showToast(itemType === "artikel" ? "Artikel berhasil ditambahkan!" : "Berita berhasil ditambahkan!");
  setTimeout(() => {
    window.location.href = "artikel.html";
  }, 1500);
});

document.getElementById("cancelBtn")?.addEventListener("click", () => {
  window.location.href = "artikel.html";
});
