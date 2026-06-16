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
const POINTS_FILE = path.join(DATA_DIR, "userpoints.json");
const TRANSACTIONS_FILE = path.join(DATA_DIR, "transactions.json");
const PROMOTIONS_FILE = path.join(DATA_DIR, "promotions.json");
const PRICING_FILE = path.join(DATA_DIR, "pricing-tiers.json");

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

/* ── User Update ───────────────────────────────────────── */

async function handleUpdateUser(req, res, userId) {
  const body = await parseBody(req);
  if (!body) {
    return sendJSON(res, 400, { success: false, error: "Body tidak valid" });
  }

  const db = readJSON(ACCOUNT_FILE);
  if (!db) {
    return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });
  }

  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx === -1) {
    return sendJSON(res, 404, { success: false, error: "User tidak ditemukan" });
  }

  db.users[idx] = { ...db.users[idx], ...body, updatedAt: new Date().toISOString() };
  writeJSON(ACCOUNT_FILE, db);

  sendJSON(res, 200, { success: true, user: db.users[idx] });
}

/* ── Payment & Points ──────────────────────────────────── */

const TIER_MAP = { basic: "tier-001", standard: "tier-003", premium: "tier-004" };
const PROMO_DURATION = {
  "promo-001": 90, "promo-002": 365, "promo-003": 30,
  "promo-004": 30, "promo-005": 7, "promo-006": 2,
};

function readPoints() {
  return readJSON(POINTS_FILE) || { points: [] };
}

function writePoints(data) {
  writeJSON(POINTS_FILE, data);
}

function readTransactions() {
  return readJSON(TRANSACTIONS_FILE) || { transactions: [] };
}

function writeTransactions(data) {
  writeJSON(TRANSACTIONS_FILE, data);
}

function getUserPoints(userId) {
  const db = readPoints();
  let entry = db.points.find((p) => p.userId === userId);
  if (!entry) {
    entry = { userId, totalPoints: 0, lifetimePoints: 0, level: "bronze", history: [], lastUpdated: new Date().toISOString() };
    db.points.push(entry);
    writePoints(db);
  }
  return entry;
}

function addPoints(userId, pts, desc) {
  const db = readPoints();
  let entry = db.points.find((p) => p.userId === userId);
  if (!entry) {
    entry = { userId, totalPoints: 0, lifetimePoints: 0, level: "bronze", history: [], lastUpdated: new Date().toISOString() };
    db.points.push(entry);
  }
  const now = new Date().toISOString();
  entry.totalPoints += pts;
  entry.lifetimePoints += pts;
  entry.history.push({ type: "earn", desc, pts, date: now });
  if (entry.lifetimePoints >= 5000) entry.level = "platinum";
  else if (entry.lifetimePoints >= 2000) entry.level = "gold";
  else if (entry.lifetimePoints >= 500) entry.level = "silver";
  else entry.level = "bronze";
  entry.lastUpdated = now;
  writePoints(db);
  return entry;
}

function deductPoints(userId, pts, desc) {
  const db = readPoints();
  let entry = db.points.find((p) => p.userId === userId);
  if (!entry) return null;
  if (entry.totalPoints < pts) return null;
  const now = new Date().toISOString();
  entry.totalPoints -= pts;
  entry.history.push({ type: "spend", desc, pts: -pts, date: now });
  entry.lastUpdated = now;
  writePoints(db);
  return entry;
}

async function handleGetPoints(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return sendJSON(res, 400, { success: false, error: "Parameter userId wajib" });
  }
  const entry = getUserPoints(userId);
  sendJSON(res, 200, {
    success: true,
    points: { totalPoints: entry.totalPoints, lifetimePoints: entry.lifetimePoints, level: entry.level, history: entry.history },
  });
}

async function handleGetReferral(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return sendJSON(res, 400, { success: false, error: "Parameter userId wajib" });
  }
  const code = userId.slice(0, 8).toUpperCase() + crypto.randomBytes(2).toString("hex").toUpperCase();
  sendJSON(res, 200, { success: true, referralCode: code, friendCount: 0 });
}

function calcExpiry(durationDays) {
  const d = new Date();
  d.setDate(d.getDate() + durationDays);
  return d.toISOString();
}

async function handleProcessPayment(req, res) {
  const body = await parseBody(req);
  if (!body || !body.userId || !body.paymentMethod) {
    return sendJSON(res, 400, { success: false, error: "Data pembayaran tidak lengkap" });
  }

  const { userId, tierId, paymentMethod, sourceType, promoId, promoCode, discountAmount, pointsUsed, voucherName, billingPeriod } = body;

  const db = readJSON(ACCOUNT_FILE);
  if (!db) return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx === -1) return sendJSON(res, 404, { success: false, error: "User tidak ditemukan" });
  const user = db.users[idx];

  let newTier, amount, durationDays, itemLabel;

  if (sourceType === "promo") {
    const promos = readJSON(PROMOTIONS_FILE);
    const promo = promos?.promotions?.find((p) => p.id === promoId);
    if (!promo) return sendJSON(res, 400, { success: false, error: "Promo tidak ditemukan" });
    amount = promo.promoPrice;
    durationDays = PROMO_DURATION[promoId] || 30;
    newTier = TIER_MAP[tierId] || "tier-004";
    itemLabel = promo.title;
  } else {
    const tiers = readJSON(PRICING_FILE);
    const tier = tiers?.tiers?.find((t) => t.id === tierId);
    if (!tier) return sendJSON(res, 400, { success: false, error: "Tier tidak ditemukan" });
    amount = billingPeriod === "tahunan" ? tier.priceYearly : tier.price;
    durationDays = billingPeriod === "tahunan" ? 365 : 30;
    newTier = TIER_MAP[tierId] || "tier-003";
    itemLabel = billingPeriod === "tahunan" ? `Paket ${tier.name} (Tahunan)` : `Paket ${tier.name}`;
  }

  const totalAmount = Math.max(0, amount - (discountAmount || 0));

  if (pointsUsed > 0) {
    const ptsEntry = deductPoints(userId, pointsUsed, `Voucher diskon: ${voucherName || "Diskon"}`);
    if (!ptsEntry) return sendJSON(res, 400, { success: false, error: "Gagal memotong poin" });
  }

  const now = new Date().toISOString();
  const currentExpiry = user.subscriptionExpiry ? new Date(user.subscriptionExpiry).getTime() : 0;
  const baseDate = currentExpiry > Date.now() ? new Date(user.subscriptionExpiry) : new Date();
  const expiryDate = new Date(baseDate);
  expiryDate.setDate(expiryDate.getDate() + durationDays);

  user.subscriptionTier = newTier;
  user.subscriptionExpiry = expiryDate.toISOString();
  user.updatedAt = now;
  db.users[idx] = user;
  writeJSON(ACCOUNT_FILE, db);

  const transId = generateId("trans");
  const transaction = {
    id: transId,
    userId,
    tierId: tierId || "premium",
    sourceType: sourceType || "tier",
    promoId: promoId || null,
    itemLabel,
    amount,
    currency: "IDR",
    paymentMethod,
    status: "completed",
    promoCode: promoCode || null,
    voucherName: voucherName || null,
    discountAmount: discountAmount || 0,
    pointsUsed: pointsUsed || 0,
    totalAmount,
    durationDays,
    billingPeriod: billingPeriod || null,
    invoiceUrl: null,
    paidAt: now,
    expiresAt: expiryDate.toISOString(),
    createdAt: now,
    updatedAt: now,
  };
  const txns = readTransactions();
  txns.transactions.push(transaction);
  writeTransactions(txns);

  const bonusPts = tierId === "standard" ? 50 : 100;
  const desc = `Berlangganan ${itemLabel}`;
  const pointsEntry = addPoints(userId, bonusPts, desc);

  sendJSON(res, 200, {
    success: true,
    transaction,
    points: {
      totalPoints: pointsEntry.totalPoints,
      lifetimePoints: pointsEntry.lifetimePoints,
      level: pointsEntry.level,
      history: pointsEntry.history,
    },
    user: { id: user.id, email: user.email, subscriptionTier: user.subscriptionTier, subscriptionExpiry: user.subscriptionExpiry },
    bonusPoints: bonusPts,
  });
}

/* ── Router ────────────────────────────────────────────── */

const USER_RE = /^\/api\/users\/([^/]+)$/;
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
  } else if (req.method === "PUT" && pathname.match(/^\/api\/users\/([^/]+)$/)) {
    const m = pathname.match(USER_RE);
    await handleUpdateUser(req, res, m[1]);
  } else if (req.method === "GET" && pathname === "/api/points") {
    await handleGetPoints(req, res);
  } else if (req.method === "GET" && pathname === "/api/referral") {
    await handleGetReferral(req, res);
  } else if (req.method === "POST" && pathname === "/api/payment/process") {
    await handleProcessPayment(req, res);
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
