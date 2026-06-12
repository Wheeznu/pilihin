const http = require("http");
const fs   = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT           = 3000;
const DATA_DIR       = path.join(__dirname, "..", "data");
const ACCOUNT_FILE   = path.join(DATA_DIR, "account.json");
const CONTACT_FILE   = path.join(DATA_DIR, "contact-messages.json");
const TRANS_FILE     = path.join(DATA_DIR, "transactions.json");
const POINTS_FILE    = path.join(DATA_DIR, "userpoints.json");

const CORS_ORIGINS = [
  "http://127.0.0.1:5500", "http://localhost:5500",
  "http://127.0.0.1:5501", "http://localhost:5501",
];

/* ── helpers ── */
function readJSON(fp)        { try { return JSON.parse(fs.readFileSync(fp,"utf-8")); } catch { return null; } }
function writeJSON(fp, data) { fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf-8"); }
function genId(pfx)          { return `${pfx}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`; }
function parseBody(req) {
  return new Promise(resolve => {
    let b = "";
    req.on("data", c => b += c);
    req.on("end", () => { try { resolve(JSON.parse(b)); } catch { resolve(null); } });
  });
}
function sendJSON(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}
function handleCORS(req, res) {
  const o = req.headers.origin;
  if (o && CORS_ORIGINS.includes(o)) {
    res.setHeader("Access-Control-Allow-Origin", o);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return true; }
  return false;
}

/* ── POIN helpers ── */
const TIER_BONUS = { basic: 0, standard: 50, premium: 100 };

function calcLevel(pts) {
  if (pts >= 5000) return "platinum";
  if (pts >= 2000) return "gold";
  if (pts >= 500)  return "silver";
  return "bronze";
}

function getOrCreatePoints(db, userId) {
  let rec = db.points.find(p => p.userId === userId);
  if (!rec) {
    rec = { userId, totalPoints: 0, lifetimePoints: 0, level: "bronze", history: [], lastUpdated: new Date().toISOString() };
    db.points.push(rec);
  }
  if (!rec.history) rec.history = [];
  return rec;
}

function addPoints(db, userId, amount, desc) {
  const rec = getOrCreatePoints(db, userId);
  rec.totalPoints    += amount;
  rec.lifetimePoints += amount;
  rec.level           = calcLevel(rec.totalPoints);
  rec.lastUpdated     = new Date().toISOString();
  rec.history.unshift({ type: "earn", desc, pts: amount, date: new Date().toISOString() });
  return rec;
}

function spendPoints(db, userId, amount, desc) {
  const rec = getOrCreatePoints(db, userId);
  if (rec.totalPoints < amount) throw new Error("Poin tidak cukup");
  rec.totalPoints -= amount;
  rec.level        = calcLevel(rec.totalPoints);
  rec.lastUpdated  = new Date().toISOString();
  rec.history.unshift({ type: "spend", desc, pts: -amount, date: new Date().toISOString() });
  return rec;
}

/* ════════════════════════ HANDLERS ════════════════════════ */

async function handleRegister(req, res) {
  const body = await parseBody(req);
  if (!body || !body.username || !body.email || !body.password)
    return sendJSON(res, 400, { success: false, error: "Semua field wajib diisi" });

  const username = body.username.trim();
  const email    = body.email.trim().toLowerCase();
  if (username.length < 3)
    return sendJSON(res, 400, { success: false, error: "Username minimal 3 karakter" });

  const db = readJSON(ACCOUNT_FILE);
  if (!db) return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });
  if (db.users.some(u => u.email.toLowerCase() === email))
    return sendJSON(res, 409, { success: false, error: "Email sudah terdaftar" });

  // Jika ada referral code yang valid, catat agar poin bisa diberikan
  const referredBy = body.referredBy || null;
  let referrerId   = null;
  if (referredBy) {
    const refUser = db.users.find(u => u.referralCode === referredBy);
    if (refUser) referrerId = refUser.id;
  }

  const now  = new Date().toISOString();
  const code = crypto.randomBytes(4).toString("hex").toUpperCase(); // referral code unik
  const newUser = {
    id: genId("user"), username, email, password: body.password,
    role: "user", status: "active",
    profilePhoto: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1db954&color=fff`,
    subscriptionTier: "tier-002", subscriptionExpiry: null,
    referralCode: code, referredBy,
    preferences: { theme: "dark", language: "id", notifications: true, privateProfile: false },
    createdAt: now, updatedAt: now, lastLogin: null,
  };
  db.users.push(newUser);
  writeJSON(ACCOUNT_FILE, db);

  // Beri 20 poin ke pengundang
  if (referrerId) {
    const pdb = readJSON(POINTS_FILE) || { points: [] };
    addPoints(pdb, referrerId, 20, `Ajak teman bergabung: @${username}`);
    writeJSON(POINTS_FILE, pdb);
  }

  sendJSON(res, 201, { success: true, user: newUser });
}

async function handleForgotPassword(req, res) {
  const body = await parseBody(req);
  if (!body || !body.email) return sendJSON(res, 400, { success: false, error: "Email wajib diisi" });
  const db = readJSON(ACCOUNT_FILE);
  if (!db) return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });
  const user = db.users.find(u => u.email.toLowerCase() === body.email.trim().toLowerCase());
  if (!user) return sendJSON(res, 404, { success: false, error: "Email tidak terdaftar" });
  user.resetToken = crypto.randomBytes(20).toString("hex");
  user.resetTokenExpiry = Date.now() + 3600000;
  user.updatedAt = new Date().toISOString();
  writeJSON(ACCOUNT_FILE, db);
  sendJSON(res, 200, { success: true, message: "Tautan reset password telah dikirim", resetToken: user.resetToken });
}

async function handleContact(req, res) {
  const body = await parseBody(req);
  if (!body || !body.name || !body.email || !body.message)
    return sendJSON(res, 400, { success: false, error: "Semua field wajib diisi" });
  if (body.name.trim().length < 3) return sendJSON(res, 400, { success: false, error: "Nama minimal 3 karakter" });
  if (body.message.trim().length < 10) return sendJSON(res, 400, { success: false, error: "Pesan minimal 10 karakter" });
  const db = readJSON(CONTACT_FILE);
  if (!db) return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });
  const now = new Date().toISOString();
  db.messages.push({ id: genId("msg"), name: body.name.trim(), email: body.email.trim().toLowerCase(), message: body.message.trim(), createdAt: now, read: false });
  writeJSON(CONTACT_FILE, db);
  sendJSON(res, 201, { success: true, message: "Pesan berhasil dikirim" });
}

/* ── POST /api/auth/update-profile ── */
async function handleUpdateProfile(req, res) {
  const body = await parseBody(req);
  if (!body || !body.userId) return sendJSON(res, 400, { success: false, error: "userId diperlukan" });
  const db = readJSON(ACCOUNT_FILE);
  if (!db) return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });
  const user = db.users.find(u => u.id === body.userId);
  if (!user) return sendJSON(res, 404, { success: false, error: "User tidak ditemukan" });
  const allowed = ["username","fullName","phone","profilePhoto","preferences","gender","birthDate","bio","status"];
  allowed.forEach(k => { if (body[k] !== undefined) user[k] = body[k]; });
  user.updatedAt = new Date().toISOString();
  writeJSON(ACCOUNT_FILE, db);
  sendJSON(res, 200, { success: true, user });
}

/* ── POST /api/auth/change-password ── */
async function handleChangePassword(req, res) {
  const body = await parseBody(req);
  const { userId, currentPassword, newPassword } = body || {};
  if (!userId || !currentPassword || !newPassword)
    return sendJSON(res, 400, { success: false, error: "userId, currentPassword, newPassword wajib diisi" });
  const db = readJSON(ACCOUNT_FILE);
  if (!db) return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });
  const user = db.users.find(u => u.id === userId);
  if (!user) return sendJSON(res, 404, { success: false, error: "User tidak ditemukan" });
  if (user.password !== currentPassword)
    return sendJSON(res, 401, { success: false, error: "Password saat ini salah" });
  if (newPassword.length < 8)
    return sendJSON(res, 400, { success: false, error: "Password baru minimal 8 karakter" });
  user.password = newPassword;
  user.updatedAt = new Date().toISOString();
  writeJSON(ACCOUNT_FILE, db);
  sendJSON(res, 200, { success: true, user });
}

/* ── POST /api/auth/change-email ── */
async function handleChangeEmail(req, res) {
  const body = await parseBody(req);
  const { userId, newEmail } = body || {};
  if (!userId || !newEmail)
    return sendJSON(res, 400, { success: false, error: "userId dan newEmail wajib diisi" });
  const db = readJSON(ACCOUNT_FILE);
  if (!db) return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });
  const user = db.users.find(u => u.id === userId);
  if (!user) return sendJSON(res, 404, { success: false, error: "User tidak ditemukan" });
  const emailLower = newEmail.trim().toLowerCase();
  if (db.users.some(u => u.id !== userId && u.email.toLowerCase() === emailLower))
    return sendJSON(res, 409, { success: false, error: "Email sudah digunakan oleh akun lain" });
  user.email = emailLower;
  user.updatedAt = new Date().toISOString();
  writeJSON(ACCOUNT_FILE, db);
  sendJSON(res, 200, { success: true, user });
}

/* ── POST /api/auth/reactivate-account ── */
async function handleReactivateAccount(req, res) {
  const body = await parseBody(req);
  const { email, password } = body || {};
  if (!email || !password)
    return sendJSON(res, 400, { success: false, error: "email dan password wajib diisi" });
  const db = readJSON(ACCOUNT_FILE);
  if (!db) return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });
  const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) return sendJSON(res, 404, { success: false, error: "Email tidak ditemukan" });
  if (user.password !== password)
    return sendJSON(res, 401, { success: false, error: "Password salah" });
  user.status = "active";
  user.updatedAt = new Date().toISOString();
  writeJSON(ACCOUNT_FILE, db);
  sendJSON(res, 200, { success: true, user });
}

/* ── POST /api/auth/delete-account ── */
async function handleDeleteAccount(req, res) {
  const body = await parseBody(req);
  const { userId } = body || {};
  if (!userId) return sendJSON(res, 400, { success: false, error: "userId diperlukan" });
  const db = readJSON(ACCOUNT_FILE);
  if (!db) return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });
  const idx = db.users.findIndex(u => u.id === userId);
  if (idx === -1) return sendJSON(res, 404, { success: false, error: "User tidak ditemukan" });
  db.users.splice(idx, 1);
  writeJSON(ACCOUNT_FILE, db);
  sendJSON(res, 200, { success: true });
}

/* ── POST /api/payment/process ──
   body: { userId, tierId, paymentMethod, promoCode?, discountAmount?, pointsUsed? }
   - simpan transaksi
   - update subscriptionTier & expiry di user
   - tambah poin bonus
   - kurangi poin jika dipakai
*/
async function handlePayment(req, res) {
  const body = await parseBody(req);
  const { userId, tierId, paymentMethod, promoCode, discountAmount = 0, pointsUsed = 0 } = body || {};
  if (!userId || !tierId || !paymentMethod)
    return sendJSON(res, 400, { success: false, error: "userId, tierId, paymentMethod wajib diisi" });

  const adb = readJSON(ACCOUNT_FILE);
  if (!adb) return sendJSON(res, 500, { success: false, error: "Gagal membaca database" });
  const user = adb.users.find(u => u.id === userId);
  if (!user) return sendJSON(res, 404, { success: false, error: "User tidak ditemukan" });

  // Harga dari pricing-tiers
  const ptiers = readJSON(path.join(DATA_DIR, "pricing-tiers.json"));
  const tier   = ptiers?.tiers?.find(t => t.id === tierId);
  if (!tier) return sendJSON(res, 404, { success: false, error: "Paket tidak ditemukan" });

  const basePrice   = tier.price;
  const totalAmount = Math.max(0, basePrice - discountAmount);
  const now         = new Date().toISOString();

  // Simpan transaksi
  const tdb = readJSON(TRANS_FILE) || { transactions: [] };
  const trans = {
    id: genId("trans"),
    userId, tierId,
    amount: basePrice,
    currency: "IDR",
    paymentMethod,
    status: "completed",
    promoCode: promoCode || null,
    discountAmount,
    pointsUsed,
    totalAmount,
    billingPeriod: "bulanan",
    invoiceUrl: null,
    paidAt: now,
    // masa berlaku 30 hari
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: now,
    updatedAt: now,
  };
  tdb.transactions.push(trans);
  writeJSON(TRANS_FILE, tdb);

  // Update user: tier & expiry
  // map tier id (basic/standard/premium) → tier-00x
  const tierCodeMap = { basic: "tier-002", standard: "tier-003", premium: "tier-004" };
  user.subscriptionTier   = tierCodeMap[tierId] || user.subscriptionTier;
  user.subscriptionExpiry = trans.expiresAt;
  user.updatedAt          = now;
  writeJSON(ACCOUNT_FILE, adb);

  // Poin: kurangi jika dipakai, lalu bonus
  const pdb = readJSON(POINTS_FILE) || { points: [] };

  if (pointsUsed > 0) {
    try { spendPoints(pdb, userId, pointsUsed, `Diskon poin untuk paket ${tier.name}`); }
    catch (e) { return sendJSON(res, 400, { success: false, error: e.message }); }
  }

  const bonus = TIER_BONUS[tierId] || 0;
  let pointRec = null;
  if (bonus > 0) {
    pointRec = addPoints(pdb, userId, bonus, `Berlangganan paket ${tier.name}`);
  } else {
    pointRec = getOrCreatePoints(pdb, userId);
  }
  writeJSON(POINTS_FILE, pdb);

  sendJSON(res, 200, { success: true, transaction: trans, user, points: pointRec });
}

/* ── GET /api/points?userId=xxx ── */
async function handleGetPoints(req, res, url) {
  const userId = url.searchParams.get("userId");
  if (!userId) return sendJSON(res, 400, { success: false, error: "userId diperlukan" });
  const pdb = readJSON(POINTS_FILE) || { points: [] };
  const rec = getOrCreatePoints(pdb, userId);
  sendJSON(res, 200, { success: true, points: rec });
}

/* ── POST /api/points/review ── { userId }
   +10 poin saat user menulis ulasan
*/
async function handleReviewPoints(req, res) {
  const body = await parseBody(req);
  if (!body?.userId) return sendJSON(res, 400, { success: false, error: "userId diperlukan" });
  const pdb = readJSON(POINTS_FILE) || { points: [] };
  const rec = addPoints(pdb, body.userId, 10, body.filmTitle ? `Ulasan: ${body.filmTitle}` : "Menulis ulasan film");
  writeJSON(POINTS_FILE, pdb);
  sendJSON(res, 200, { success: true, points: rec });
}

/* ── POST /api/points/redeem ── { userId, rewardId, rewardName, cost } ── */
async function handleRedeemPoints(req, res) {
  const body = await parseBody(req);
  const { userId, rewardName, cost } = body || {};
  if (!userId || !cost) return sendJSON(res, 400, { success: false, error: "userId dan cost diperlukan" });
  const pdb = readJSON(POINTS_FILE) || { points: [] };
  try {
    const rec = spendPoints(pdb, userId, cost, `Ditukar: ${rewardName || "Hadiah"}`);
    writeJSON(POINTS_FILE, pdb);
    sendJSON(res, 200, { success: true, points: rec });
  } catch (e) {
    sendJSON(res, 400, { success: false, error: e.message });
  }
}

/* ── GET /api/transactions?userId=xxx ── */
async function handleGetTransactions(req, res, url) {
  const userId = url.searchParams.get("userId");
  if (!userId) return sendJSON(res, 400, { success: false, error: "userId diperlukan" });
  const tdb  = readJSON(TRANS_FILE) || { transactions: [] };
  const list = tdb.transactions.filter(t => t.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  sendJSON(res, 200, { success: true, transactions: list });
}

/* ── GET /api/referral?userId=xxx ── referral code user ── */
async function handleGetReferral(req, res, url) {
  const userId = url.searchParams.get("userId");
  if (!userId) return sendJSON(res, 400, { success: false, error: "userId diperlukan" });
  const adb  = readJSON(ACCOUNT_FILE);
  const user = adb?.users?.find(u => u.id === userId);
  if (!user) return sendJSON(res, 404, { success: false, error: "User tidak ditemukan" });

  // Generate jika belum ada
  if (!user.referralCode) {
    user.referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    user.updatedAt    = new Date().toISOString();
    writeJSON(ACCOUNT_FILE, adb);
  }

  // Hitung teman yang sudah bergabung via kode ini
  const friends = adb.users.filter(u => u.referredBy === user.referralCode);
  sendJSON(res, 200, { success: true, referralCode: user.referralCode, friendCount: friends.length, friends: friends.map(f => ({ username: f.username, joinedAt: f.createdAt })) });
}

/* ════════════════════════ ROUTER ════════════════════════ */
const server = http.createServer(async (req, res) => {
  if (handleCORS(req, res)) return;
  const url      = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if      (req.method === "POST" && pathname === "/api/auth/register")          await handleRegister(req, res);
  else if (req.method === "POST" && pathname === "/api/auth/forgot-password")   await handleForgotPassword(req, res);
  else if (req.method === "POST" && pathname === "/api/auth/update-profile")    await handleUpdateProfile(req, res);
    else if (req.method === "POST" && pathname === "/api/auth/change-password")   await handleChangePassword(req, res);
  else if (req.method === "POST" && pathname === "/api/auth/change-email")        await handleChangeEmail(req, res);
  else if (req.method === "POST" && pathname === "/api/auth/reactivate-account")  await handleReactivateAccount(req, res);
  else if (req.method === "POST" && pathname === "/api/auth/delete-account")      await handleDeleteAccount(req, res);
  else if (req.method === "POST" && pathname === "/api/contact")                await handleContact(req, res);
  else if (req.method === "POST" && pathname === "/api/payment/process")        await handlePayment(req, res);
  else if (req.method === "POST" && pathname === "/api/points/review")          await handleReviewPoints(req, res);
  else if (req.method === "POST" && pathname === "/api/points/redeem")          await handleRedeemPoints(req, res);
  else if (req.method === "GET"  && pathname === "/api/points")                 await handleGetPoints(req, res, url);
  else if (req.method === "GET"  && pathname === "/api/transactions")           await handleGetTransactions(req, res, url);
  else if (req.method === "GET"  && pathname === "/api/referral")               await handleGetReferral(req, res, url);
  else sendJSON(res, 404, { success: false, error: "Endpoint tidak ditemukan" });
});

server.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));