const API      = "http://localhost:3000";
const KEY_DB   = "pilih-in-db";

const TIER_NAMES = {
    "tier-001": "Free", "tier-002": "Basic",
    "tier-003": "Standard", "tier-004": "Premium",
    basic: "Basic", standard: "Standard", premium: "Premium",
};

export async function loadNotifBadge(user) {
    if (!user) return;

    try {
        const count = await _countUnread(user);
        _renderBadge(count);
    } catch {
        // Abaikan error — badge tidak tampil, tapi halaman tetap berjalan
    }
}

/* ── Hitung unread dengan mereplikasi logika _buildNotifications ── */
async function _countUnread(user) {
    const userId = user.userId || user.id;
    const db     = _getDb();
    const states = (db.notificationStates?.[userId]) || {};

    const ids = [];

    /* 1. Welcome */
    ids.push(`welcome-${userId}`);

    /* 2. Subscription expiry */
    if (user.subscriptionExpiry) {
        const daysLeft = Math.ceil(
            (new Date(user.subscriptionExpiry) - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysLeft <= 0)  ids.push(`sub-expired-${user.subscriptionExpiry}`);
        else if (daysLeft <= 7) ids.push(`sub-expiring-${user.subscriptionExpiry}`);
    }

    /* 3. Transaksi berhasil */
    try {
        const res  = await fetch(`${API}/api/transactions?userId=${userId}`);
        const data = await res.json();
        (data.transactions || [])
            .filter(t => t.status === "completed")
            .forEach(t => ids.push(`trans-${t.id}`));
    } catch { /* server mati — skip */ }

    /* 4. Promo */
    try {
        const res  = await fetch("/data/promotions.json");
        const data = await res.json();
        (data.promotions || [])
            .filter(p => p.featured || p.discount >= 25)
            .slice(0, 3)
            .forEach(p => ids.push(`promo-${p.id}`));
    } catch { /* skip */ }

    /* 5. Film terbaru */
    try {
        const res  = await fetch("/data/data-film.json");
        const data = await res.json();
        (data.films || [])
            .filter(f => f.status === "published")
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3)
            .forEach(f => ids.push(`film-${f.id}`));
    } catch { /* skip */ }

    /* 6. Balasan review */
    (db.reviews || [])
        .filter(r => r.userId === userId && r.adminReply)
        .forEach((r, i) => ids.push(`review-reply-${r.id || `${r.filmId}-${i}`}`));

    /* Hitung yang belum dismissed dan belum read */
    const unread = ids.filter(id => !states[id]?.dismissed && !states[id]?.read);
    return unread.length;
}

function _getDb() {
    try { return JSON.parse(localStorage.getItem(KEY_DB)) || {}; }
    catch { return {}; }
}

function _renderBadge(count) {
    const link = document.querySelector('.user-sidebar__link[href*="notifications"]');
    if (!link) return;

    // Hapus badge lama
    link.querySelector(".notif-badge")?.remove();
    if (count <= 0) return;

    const badge = document.createElement("span");
    badge.className   = "notif-badge";
    badge.textContent = count > 99 ? "99+" : String(count);
    link.appendChild(badge);
}