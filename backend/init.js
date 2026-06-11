import DatabaseManager from "./DatabaseManager.js";
import FilmRepository from "./repositories/FilmRepository.js";
import UserRepository from "./repositories/UserRepository.js";

export const dbManager = new DatabaseManager("pilih-in-db");

const DATA_SOURCES = [
  { path: "/data/account.json", key: "users" },
  { path: "/data/data-film.json", key: "films" },
  { path: "/data/data-artikel.json", key: "articles" },
  { path: "/data/data-berita.json", key: "news" },
  { path: "/data/faq.json", key: "faqs" },
];

async function _loadInitialData() {
  const initialized = localStorage.getItem("pilih-in-initialized");
  if (initialized) return;

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

  db.metadata = {
    ...db.metadata,
    version: "2.0",
    lastInitialized: new Date().toISOString(),
    totalUsers: db.users?.length || 0,
    totalFilms: db.films?.length || 0,
    totalArticles: db.articles?.length || 0,
    totalNews: db.news?.length || 0,
    totalFaqs: db.faqs?.length || 0,
  };

  dbManager.saveDatabase(db);
  localStorage.setItem("pilih-in-initialized", "true");
  console.log("Database initialized from JSON files");
}

const initPromise = _loadInitialData();

export const repositories = {
  films: new FilmRepository(dbManager),
  users: new UserRepository(dbManager),
};

export function getDbReady() {
  return initPromise;
}
