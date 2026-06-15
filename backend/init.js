import DatabaseManager from "./DatabaseManager.js";
import FilmRepository from "./repositories/FilmRepository.js";
import UserRepository from "./repositories/UserRepository.js";
import ArticleRepository from "./repositories/ArticleRepository.js";
import NewsRepository from "./repositories/NewsRepository.js";

export const dbManager = new DatabaseManager("pilih-in-db");

const DATA_SOURCES = [
  { path: "/data/account.json", key: "users" },
  { path: "/data/data-film.json", key: "films" },
  { path: "/data/data-actor.json", key: "actors" },
  { path: "/data/data-director.json", key: "directors" },
  { path: "/data/genres.json", key: "genres" },
  { path: "/data/data-artikel.json", key: "articles" },
  { path: "/data/data-berita.json", key: "news" },
  { path: "/data/faq.json", key: "faqs" },
];

const DB_VERSION = "2.3";

export const API_BASE = "http://localhost:3000";

async function _loadSeedData() {
  const db = dbManager.getDatabase();
  for (const src of DATA_SOURCES) {
    try {
      const res = await fetch(src.path);
      const data = await res.json();
      db[src.key] = data[src.key] || [];
    } catch (err) {
      console.warn(`Gagal memuat ${src.path}:`, err);
    }
  }

  (db.actors || []).forEach((a) => { if (!a.status) a.status = "published"; });
  (db.directors || []).forEach((d) => { if (!d.status) d.status = "published"; });
  (db.films || []).forEach((f) => { if (!f.status) f.status = "published"; });
  (db.articles || []).forEach((a) => { if (!a.status) a.status = "published"; });
  (db.news || []).forEach((n) => { if (!n.status) n.status = "published"; });

  db.metadata = {
    ...db.metadata,
    version: DB_VERSION,
    lastInitialized: new Date().toISOString(),
    totalUsers: db.users?.length || 0,
    totalFilms: db.films?.length || 0,
    totalActors: db.actors?.length || 0,
    totalDirectors: db.directors?.length || 0,
    totalArticles: db.articles?.length || 0,
    totalNews: db.news?.length || 0,
    totalFaqs: db.faqs?.length || 0,
  };

  dbManager.saveDatabase(db);
  localStorage.setItem("pilih-in-initialized", "true");
  console.log("Seed data loaded");
}

async function _syncFromApi() {
  try {
    const res = await fetch(`${API_BASE}/api/seed-data`);
    const result = await res.json();
    if (!result.success) return;

    const db = dbManager.getDatabase();
    for (const key of ["films", "actors", "directors", "articles", "news"]) {
      const apiItems = result.data[key] || [];
      if (apiItems.length > 0) {
        const map = new Map((db[key] || []).map((i) => [i.id, i]));
        apiItems.forEach((apiItem) => {
          const existing = map.get(apiItem.id);
          map.set(apiItem.id, existing ? { ...existing, ...apiItem } : apiItem);
        });
        db[key] = Array.from(map.values());
      }
    }
    dbManager.saveDatabase(db);
  } catch (err) {
    console.warn("Gagal sync dari server:", err);
  }
}

async function _loadInitialData() {
  const initialized = localStorage.getItem("pilih-in-initialized");
  const existing = dbManager.getDatabase();

  if (!initialized || existing?.metadata?.version !== DB_VERSION) {
    await _loadSeedData();
  }

  await _syncFromApi();
}

const initPromise = _loadInitialData();

export const repositories = {
  films: new FilmRepository(dbManager),
  users: new UserRepository(dbManager),
  articles: new ArticleRepository(dbManager),
  news: new NewsRepository(dbManager),
};

export function getDbReady() {
  return initPromise;
}

export async function apiRequest(method, path, body) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return await res.json();
  } catch (err) {
    console.warn(`API ${method} ${path} gagal:`, err);
    return null;
  }
}
