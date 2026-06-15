const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = 3000;
const DATA_DIR = path.join(__dirname, "..", "data");
const ACCOUNT_FILE = path.join(DATA_DIR, "account.json");
const CONTACT_FILE = path.join(DATA_DIR, "contact-messages.json");
const USERDATA_FILE = path.join(DATA_DIR, "user-data.json");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");

const SEED_SOURCES = {
  films: path.join(DATA_DIR, "data-film.json"),
  actors: path.join(DATA_DIR, "data-actor.json"),
  directors: path.join(DATA_DIR, "data-director.json"),
  genres: path.join(DATA_DIR, "genres.json"),
  articles: path.join(DATA_DIR, "data-artikel.json"),
  news: path.join(DATA_DIR, "data-berita.json"),
  faqs: path.join(DATA_DIR, "faq.json"),
};

const CONTENT_COLLECTIONS = ["films", "actors", "directors", "articles", "news"];

const CORS_ORIGINS = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://127.0.0.1:5501",
  "http://localhost:5501",
];

function readJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function generateId(prefix = "user") {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve(null);
      }
    });
  });
}

function sendJSON(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function handleCORS(req, res) {
  const origin = req.headers.origin;
  if (origin && CORS_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
}

async function handleRegister(req, res) {
  const body = await parseBody(req);
  if (!body || !body.username || !body.email || !body.password) {
    return sendJSON(res, 400, { success: false, error: "Semua field wajib diisi" });
  }

  const username = body.username.trim();
  const email = body.email.trim().toLowerCase();
  const password = body.password;

  if (username.length < 3) {
    return sendJSON(res, 400, { success: false, error: "Username minimal 3 karakter" });
  }

  const db = readJSON(ACCOUNT_FILE);
  if (!db) {
    return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });
  }

  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    return sendJSON(res, 409, { success: false, error: "Email sudah terdaftar" });
  }

  const now = new Date().toISOString();
  const newUser = {
    id: generateId("user"),
    username,
    email,
    password,
    role: "user",
    status: "active",
    profilePhoto: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1db954&color=fff`,
    subscriptionTier: "tier-002",
    subscriptionExpiry: null,
    preferences: {
      theme: "dark",
      language: "id",
      notifications: true,
      privateProfile: false,
    },
    createdAt: now,
    updatedAt: now,
    lastLogin: null,
  };

  db.users.push(newUser);
  writeJSON(ACCOUNT_FILE, db);

  sendJSON(res, 201, {
    success: true,
    user: newUser,
  });
}

async function handleForgotPassword(req, res) {
  const body = await parseBody(req);
  if (!body || !body.email) {
    return sendJSON(res, 400, { success: false, error: "Email wajib diisi" });
  }

  const email = body.email.trim().toLowerCase();

  const db = readJSON(ACCOUNT_FILE);
  if (!db) {
    return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });
  }

  const user = db.users.find((u) => u.email.toLowerCase() === email);
  if (!user) {
    return sendJSON(res, 404, { success: false, error: "Email tidak terdaftar" });
  }

  const resetToken = crypto.randomBytes(20).toString("hex");
  user.resetToken = resetToken;
  user.resetTokenExpiry = Date.now() + 3600000;
  user.updatedAt = new Date().toISOString();

  writeJSON(ACCOUNT_FILE, db);

  sendJSON(res, 200, {
    success: true,
    message: "Tautan reset password telah dikirim ke email Anda",
    resetToken,
  });
}

async function handleContact(req, res) {
  const body = await parseBody(req);
  if (!body || !body.name || !body.email || !body.message) {
    return sendJSON(res, 400, { success: false, error: "Semua field wajib diisi" });
  }

  const name = body.name.trim();
  const email = body.email.trim().toLowerCase();
  const message = body.message.trim();

  if (name.length < 3) {
    return sendJSON(res, 400, { success: false, error: "Nama minimal 3 karakter" });
  }
  if (message.length < 10) {
    return sendJSON(res, 400, { success: false, error: "Pesan minimal 10 karakter" });
  }

  const db = readJSON(CONTACT_FILE);
  if (!db) {
    return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });
  }

  const now = new Date().toISOString();
  const newMessage = {
    id: generateId("msg"),
    name,
    email,
    message,
    createdAt: now,
    read: false,
  };

  db.messages.push(newMessage);
  writeJSON(CONTACT_FILE, db);

  sendJSON(res, 201, {
    success: true,
    message: "Pesan berhasil dikirim",
  });
}

/* ── User Data ─────────────────────────────────────────── */

function readUserData() {
  try {
    return JSON.parse(fs.readFileSync(USERDATA_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeUserData(data) {
  fs.writeFileSync(USERDATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function handleGetUserCollection(req, res, userId, collection) {
  const VALID_COLLECTIONS = ["reviews", "watchLists", "favorites", "watchHistory", "notifications", "actorFavorites", "directorFavorites", "theme"];
  if (!VALID_COLLECTIONS.includes(collection)) {
    return sendJSON(res, 400, { success: false, error: "Koleksi tidak valid" });
  }

  const allData = readUserData();
  const userData = allData[userId] || {};
  let data = userData[collection] ?? null;
  if (data === null) {
    data = collection === "theme" ? "dark" : [];
  }

  sendJSON(res, 200, { success: true, data });
}

async function handlePutUserCollection(req, res, userId, collection) {
  const VALID_COLLECTIONS = ["reviews", "watchLists", "favorites", "watchHistory", "notifications", "actorFavorites", "directorFavorites", "theme"];
  if (!VALID_COLLECTIONS.includes(collection)) {
    return sendJSON(res, 400, { success: false, error: "Koleksi tidak valid" });
  }

  const body = await parseBody(req);
  if (collection === "theme") {
    if (typeof body !== "string" || !["dark", "light"].includes(body)) {
      return sendJSON(res, 400, { success: false, error: "Theme harus 'dark' atau 'light'" });
    }
  } else if (!Array.isArray(body)) {
    return sendJSON(res, 400, { success: false, error: "Body harus berupa array" });
  }

  const allData = readUserData();
  if (!allData[userId]) allData[userId] = {};
  allData[userId][collection] = body;
  writeUserData(allData);

  sendJSON(res, 200, { success: true });
}

async function handleDeleteUserCollectionItem(req, res, userId, collection, itemId) {
  const VALID_COLLECTIONS = ["reviews", "watchLists", "favorites", "watchHistory", "notifications", "actorFavorites", "directorFavorites", "theme"];
  if (!VALID_COLLECTIONS.includes(collection)) {
    return sendJSON(res, 400, { success: false, error: "Koleksi tidak valid" });
  }

  if (collection === "theme") {
    return sendJSON(res, 400, { success: false, error: "Theme tidak bisa dihapus" });
  }

  const allData = readUserData();
  const userData = allData[userId] || {};
  const items = userData[collection] || [];
  const filtered = items.filter((item) => item.id !== itemId);
  allData[userId][collection] = filtered;
  writeUserData(allData);

  sendJSON(res, 200, { success: true });
}

/* ── Content CRUD ─────────────────────────────────────── */

function readContent() {
  return readJSON(CONTENT_FILE) || Object.fromEntries(CONTENT_COLLECTIONS.map((c) => [c, []]));
}

function writeContent(data) {
  writeJSON(CONTENT_FILE, data);
}

function readSeed(key) {
  const filePath = SEED_SOURCES[key];
  if (!filePath) return [];
  const data = readJSON(filePath);
  return data?.[key] || [];
}

function mergeById(base, extra) {
  const map = new Map();
  base.forEach((item) => map.set(item.id, item));
  extra.forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
}

const CONTENT_COL_RE = /^\/api\/content\/(films|actors|directors|articles|news)$/;
const CONTENT_ITEM_RE = /^\/api\/content\/(films|actors|directors|articles|news)\/([^/]+)$/;

async function handleGetSeedData(req, res) {
  const content = readContent();
  const result = {};
  for (const key of [...CONTENT_COLLECTIONS, "genres", "faqs"]) {
    const seed = readSeed(key);
    const userContent = content[key] || [];
    let items = mergeById(seed, userContent);
    if (key !== "genres" && key !== "faqs") {
      items = items.map((item) => {
        if (!item.status) item.status = "published";
        return item;
      });
    }
    result[key] = items;
  }
  sendJSON(res, 200, { success: true, data: result });
}

async function handleGetContent(req, res, collection) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const status = url.searchParams.get("status");
  const content = readContent();
  let items = content[collection] || [];

  if (status === "published" || status === "all") {
    const seed = readSeed(collection);
    items = mergeById(items, seed);
  }

  if (status && status !== "all") {
    items = items.filter((item) => item.status === status);
  }

  sendJSON(res, 200, { success: true, data: items });
}

async function handleCreateContent(req, res, collection) {
  const body = await parseBody(req);
  if (!body) {
    return sendJSON(res, 400, { success: false, error: "Body tidak valid" });
  }
  const now = new Date().toISOString();
  const item = {
    id: generateId(collection.slice(0, -1)),
    ...body,
    createdAt: body.createdAt || now,
    updatedAt: now,
  };
  const content = readContent();
  content[collection] = content[collection] || [];
  content[collection].push(item);
  writeContent(content);
  sendJSON(res, 201, { success: true, data: item });
}

async function handleUpdateContent(req, res, collection, itemId) {
  const body = await parseBody(req);
  if (!body) {
    return sendJSON(res, 400, { success: false, error: "Body tidak valid" });
  }
  const now = new Date().toISOString();
  const content = readContent();
  const items = content[collection] || [];
  const idx = items.findIndex((i) => i.id === itemId);

  if (idx !== -1) {
    const item = { ...items[idx], ...body, updatedAt: now };

    if (body.status === "published") {
      const seedFile = SEED_SOURCES[collection];
      if (seedFile) {
        const seedData = readJSON(seedFile);
        if (seedData) {
          seedData[collection] = seedData[collection] || [];
          seedData[collection].push(item);
          writeJSON(seedFile, seedData);
        }
      }
      content[collection] = items.filter((_, i) => i !== idx);
      writeContent(content);
    } else {
      items[idx] = item;
      writeContent(content);
    }

    return sendJSON(res, 200, { success: true, data: item });
  }

  const seedFile = SEED_SOURCES[collection];
  if (seedFile) {
    const seedData = readJSON(seedFile);
    if (seedData) {
      const seedItems = seedData[collection] || [];
      const seedIdx = seedItems.findIndex((i) => i.id === itemId);
      if (seedIdx !== -1) {
        seedItems[seedIdx] = { ...seedItems[seedIdx], ...body, updatedAt: now };
        writeJSON(seedFile, seedData);
        return sendJSON(res, 200, { success: true, data: seedItems[seedIdx] });
      }
    }
  }

  sendJSON(res, 404, { success: false, error: "Item tidak ditemukan" });
}

async function handleDeleteContent(req, res, collection, itemId) {
  const content = readContent();
  const items = content[collection] || [];
  const filtered = items.filter((i) => i.id !== itemId);
  if (filtered.length !== items.length) {
    content[collection] = filtered;
    writeContent(content);
    return sendJSON(res, 200, { success: true });
  }

  const seedFile = SEED_SOURCES[collection];
  if (seedFile) {
    const seedData = readJSON(seedFile);
    if (seedData) {
      const seedItems = seedData[collection] || [];
      const seedFiltered = seedItems.filter((i) => i.id !== itemId);
      if (seedFiltered.length !== seedItems.length) {
        seedData[collection] = seedFiltered;
        writeJSON(seedFile, seedData);
        return sendJSON(res, 200, { success: true });
      }
    }
  }

  sendJSON(res, 404, { success: false, error: "Item tidak ditemukan" });
}

/* ── Router ────────────────────────────────────────────── */

const USER_DATA_RE = /^\/api\/user-data\/([^/]+)\/([^/]+)(?:\/([^/]+))?$/;

const server = http.createServer(async (req, res) => {
  if (handleCORS(req, res)) return;

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === "GET" && pathname === "/api/seed-data") {
    await handleGetSeedData(req, res);
  } else if (req.method === "POST" && pathname === "/api/auth/register") {
    await handleRegister(req, res);
  } else if (req.method === "POST" && pathname === "/api/auth/forgot-password") {
    await handleForgotPassword(req, res);
  } else if (req.method === "POST" && pathname === "/api/contact") {
    await handleContact(req, res);
  } else {
    let m = pathname.match(CONTENT_COL_RE);
    if (m) {
      const collection = m[1];
      if (req.method === "GET") {
        await handleGetContent(req, res, collection);
      } else if (req.method === "POST") {
        await handleCreateContent(req, res, collection);
      } else {
        sendJSON(res, 405, { success: false, error: "Method tidak diizinkan" });
      }
      return;
    }
    m = pathname.match(CONTENT_ITEM_RE);
    if (m) {
      const collection = m[1];
      const itemId = m[2];
      if (req.method === "PUT") {
        await handleUpdateContent(req, res, collection, itemId);
      } else if (req.method === "DELETE") {
        await handleDeleteContent(req, res, collection, itemId);
      } else {
        sendJSON(res, 405, { success: false, error: "Method tidak diizinkan" });
      }
      return;
    }
    m = pathname.match(USER_DATA_RE);
    if (m) {
      const userId = m[1];
      const collection = m[2];
      const itemId = m[3];

      if (req.method === "GET") {
        await handleGetUserCollection(req, res, userId, collection);
      } else if (req.method === "PUT") {
        await handlePutUserCollection(req, res, userId, collection);
      } else if (req.method === "DELETE" && itemId) {
        await handleDeleteUserCollectionItem(req, res, userId, collection, itemId);
      } else {
        sendJSON(res, 405, { success: false, error: "Method tidak diizinkan" });
      }
    } else {
      sendJSON(res, 404, { success: false, error: "Endpoint tidak ditemukan" });
    }
  }
});

server.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
