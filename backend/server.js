const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = 3000;
const DATA_DIR = path.join(__dirname, "..", "data");
const ACCOUNT_FILE = path.join(DATA_DIR, "account.json");
const CONTACT_FILE = path.join(DATA_DIR, "contact-messages.json");

// Izinkan semua localhost & 127.0.0.1 di port manapun
function isAllowedOrigin(origin) {
  if (!origin) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

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
    // Limit 10MB untuk handle foto base64
    const MAX = 10 * 1024 * 1024;
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX) {
        resolve(null);
        req.destroy();
      }
    });
    req.on("end", () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve(null); }
    });
  });
}

function sendJSON(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function handleCORS(req, res) {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
}

/* ─────────────────────────────────────────
   AUTH HANDLERS
───────────────────────────────────────── */
async function handleRegister(req, res) {
  const body = await parseBody(req);
  if (!body || !body.username || !body.email || !body.password) {
    return sendJSON(res, 400, { success: false, error: "Semua field wajib diisi" });
  }

  const username = body.username.trim();
  const email    = body.email.trim().toLowerCase();
  const password = body.password;

  if (username.length < 3) {
    return sendJSON(res, 400, { success: false, error: "Username minimal 3 karakter" });
  }

  const db = readJSON(ACCOUNT_FILE);
  if (!db) return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });

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
  sendJSON(res, 201, { success: true, user: newUser });
}

async function handleForgotPassword(req, res) {
  const body = await parseBody(req);
  if (!body || !body.email) {
    return sendJSON(res, 400, { success: false, error: "Email wajib diisi" });
  }

  const email = body.email.trim().toLowerCase();
  const db    = readJSON(ACCOUNT_FILE);
  if (!db) return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });

  const user = db.users.find((u) => u.email.toLowerCase() === email);
  if (!user) return sendJSON(res, 404, { success: false, error: "Email tidak terdaftar" });

  const resetToken = crypto.randomBytes(20).toString("hex");
  user.resetToken       = resetToken;
  user.resetTokenExpiry = Date.now() + 3600000;
  user.updatedAt        = new Date().toISOString();
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

  const name    = body.name.trim();
  const email   = body.email.trim().toLowerCase();
  const message = body.message.trim();

  if (name.length < 3)    return sendJSON(res, 400, { success: false, error: "Nama minimal 3 karakter" });
  if (message.length < 10) return sendJSON(res, 400, { success: false, error: "Pesan minimal 10 karakter" });

  const db = readJSON(CONTACT_FILE);
  if (!db) return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });

  const now = new Date().toISOString();
  db.messages.push({
    id: generateId("msg"),
    name,
    email,
    message,
    createdAt: now,
    read: false,
  });
  writeJSON(CONTACT_FILE, db);
  sendJSON(res, 201, { success: true, message: "Pesan berhasil dikirim" });
}

async function handleUpdateProfile(req, res) {
  const body = await parseBody(req);
  if (!body || !body.userId)
    return sendJSON(res, 400, { success: false, error: "userId wajib diisi" });

  const db = readJSON(ACCOUNT_FILE);
  if (!db) return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });

  const idx = db.users.findIndex((u) => u.id === body.userId);
  if (idx === -1) return sendJSON(res, 404, { success: false, error: "User tidak ditemukan" });

  const user = db.users[idx];

  if (body.username !== undefined) {
    if (body.username.trim().length < 3)
      return sendJSON(res, 400, { success: false, error: "Username minimal 3 karakter" });
    const duplicate = db.users.find((u) => u.username === body.username.trim() && u.id !== body.userId);
    if (duplicate) return sendJSON(res, 409, { success: false, error: "Username sudah dipakai" });
    user.username = body.username.trim();
  }

  if (body.profilePhoto  !== undefined) user.profilePhoto  = body.profilePhoto;
  if (body.fullName      !== undefined) user.fullName      = body.fullName;
  if (body.gender        !== undefined) user.gender        = body.gender;
  if (body.birthDate     !== undefined) user.birthDate     = body.birthDate;
  if (body.bio           !== undefined) user.bio           = body.bio;
  if (body.phone         !== undefined) user.phone         = body.phone;
  if (body.status        !== undefined) user.status        = body.status;
  if (body.twoFactorEnabled !== undefined) user.twoFactorEnabled = body.twoFactorEnabled;
  if (body.twoFactorCode    !== undefined) user.twoFactorCode    = body.twoFactorCode;
  if (body.emailVerified    !== undefined) user.emailVerified    = body.emailVerified;
  if (body.preferences   !== undefined) user.preferences   = { ...user.preferences, ...body.preferences };

  user.updatedAt = new Date().toISOString();
  db.users[idx] = user;
  writeJSON(ACCOUNT_FILE, db);
  sendJSON(res, 200, { success: true, user });
}

async function handleChangePassword(req, res) {
  const body = await parseBody(req);
  if (!body || !body.userId || !body.currentPassword || !body.newPassword)
    return sendJSON(res, 400, { success: false, error: "Data tidak lengkap" });

  const db = readJSON(ACCOUNT_FILE);
  if (!db) return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });

  const idx = db.users.findIndex((u) => u.id === body.userId);
  if (idx === -1) return sendJSON(res, 404, { success: false, error: "User tidak ditemukan" });

  const user = db.users[idx];
  if (user.password !== body.currentPassword)
    return sendJSON(res, 401, { success: false, error: "Password saat ini salah" });
  if (body.newPassword.length < 8)
    return sendJSON(res, 400, { success: false, error: "Password baru minimal 8 karakter" });
  if (body.newPassword === body.currentPassword)
    return sendJSON(res, 400, { success: false, error: "Password baru harus berbeda" });

  user.password  = body.newPassword;
  user.updatedAt = new Date().toISOString();
  db.users[idx]  = user;
  writeJSON(ACCOUNT_FILE, db);
  sendJSON(res, 200, { success: true, user });
}

async function handleChangeEmail(req, res) {
  const body = await parseBody(req);
  if (!body || !body.userId || !body.newEmail)
    return sendJSON(res, 400, { success: false, error: "Data tidak lengkap" });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.newEmail))
    return sendJSON(res, 400, { success: false, error: "Format email tidak valid" });

  const db = readJSON(ACCOUNT_FILE);
  if (!db) return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });

  const idx = db.users.findIndex((u) => u.id === body.userId);
  if (idx === -1) return sendJSON(res, 404, { success: false, error: "User tidak ditemukan" });

  const duplicate = db.users.find((u) => u.email === body.newEmail && u.id !== body.userId);
  if (duplicate) return sendJSON(res, 409, { success: false, error: "Email sudah digunakan akun lain" });

  db.users[idx].email     = body.newEmail;
  db.users[idx].updatedAt = new Date().toISOString();
  writeJSON(ACCOUNT_FILE, db);
  sendJSON(res, 200, { success: true, user: db.users[idx] });
}

async function handleReactivateAccount(req, res) {
  const body = await parseBody(req);
  if (!body || !body.email || !body.password)
    return sendJSON(res, 400, { success: false, error: "Email dan password wajib diisi" });

  const db = readJSON(ACCOUNT_FILE);
  if (!db) return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });

  const idx = db.users.findIndex((u) => u.email === body.email);
  if (idx === -1) return sendJSON(res, 404, { success: false, error: "Email tidak ditemukan" });

  const user = db.users[idx];
  if (user.password !== body.password)
    return sendJSON(res, 401, { success: false, error: "Password salah" });
  if (user.status === "active")
    return sendJSON(res, 400, { success: false, error: "Akun sudah aktif" });

  user.status    = "active";
  user.updatedAt = new Date().toISOString();
  db.users[idx]  = user;
  writeJSON(ACCOUNT_FILE, db);
  sendJSON(res, 200, { success: true, user });
}

async function handleDeleteAccount(req, res) {
  const body = await parseBody(req);
  if (!body || !body.userId)
    return sendJSON(res, 400, { success: false, error: "userId wajib diisi" });

  const db = readJSON(ACCOUNT_FILE);
  if (!db) return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });

  const idx = db.users.findIndex((u) => u.id === body.userId);
  if (idx === -1) return sendJSON(res, 404, { success: false, error: "User tidak ditemukan" });

  db.users.splice(idx, 1);
  writeJSON(ACCOUNT_FILE, db);
  sendJSON(res, 200, { success: true, message: "Akun berhasil dihapus" });
}

/* ─────────────────────────────────────────
   ROUTING
───────────────────────────────────────── */
const server = http.createServer(async (req, res) => {
  if (handleCORS(req, res)) return;

  const url      = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if      (req.method === "POST" && pathname === "/api/auth/register")           await handleRegister(req, res);
  else if (req.method === "POST" && pathname === "/api/auth/forgot-password")    await handleForgotPassword(req, res);
  else if (req.method === "POST" && pathname === "/api/contact")                 await handleContact(req, res);
  else if (req.method === "POST" && pathname === "/api/auth/update-profile")     await handleUpdateProfile(req, res);
  else if (req.method === "POST" && pathname === "/api/auth/change-password")    await handleChangePassword(req, res);
  else if (req.method === "POST" && pathname === "/api/auth/change-email")       await handleChangeEmail(req, res);
  else if (req.method === "POST" && pathname === "/api/auth/reactivate-account") await handleReactivateAccount(req, res);
  else if (req.method === "POST" && pathname === "/api/auth/delete-account")     await handleDeleteAccount(req, res);
  else sendJSON(res, 404, { success: false, error: "Endpoint tidak ditemukan" });
});

server.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});