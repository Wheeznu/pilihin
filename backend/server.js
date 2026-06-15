const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = 3000;
const DATA_DIR = path.join(__dirname, "..", "data");
const ACCOUNT_FILE = path.join(DATA_DIR, "account.json");
const CONTACT_FILE = path.join(DATA_DIR, "contact-messages.json");
const USERDATA_FILE = path.join(DATA_DIR, "user-data.json");

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

/* ── Router ────────────────────────────────────────────── */

const USER_DATA_RE = /^\/api\/user-data\/([^/]+)\/([^/]+)(?:\/([^/]+))?$/;

const server = http.createServer(async (req, res) => {
  if (handleCORS(req, res)) return;

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === "POST" && pathname === "/api/auth/register") {
    await handleRegister(req, res);
  } else if (req.method === "POST" && pathname === "/api/auth/forgot-password") {
    await handleForgotPassword(req, res);
  } else if (req.method === "POST" && pathname === "/api/contact") {
    await handleContact(req, res);
  } else {
    const m = pathname.match(USER_DATA_RE);
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
