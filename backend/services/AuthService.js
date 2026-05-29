class AuthService {
    static SESSION_KEY = "pilih-in-session";

    async _loadUsers() {
        try {
            const res = await fetch("/data/account.json");
            const data = await res.json();
            return data.users || [];
        } catch {
            return [];
        }
    }

    _findUser(users, email) {
        return users.find((u) => u.email === email) || null;
    }

    async login(email, password) {
        const users = await this._loadUsers();
        const user = this._findUser(users, email);
        if (!user) throw new Error("Email tidak ditemukan");
        if (password !== user.password)
            throw new Error("Password salah");
        if (user.status !== "active") throw new Error("Akun dinonaktifkan");

        const session = {
            userId: user.id,
            role: user.role,
            loginAt: new Date().toISOString(),
        };
        localStorage.setItem(AuthService.SESSION_KEY, JSON.stringify(session));

        return user;
    }

    logout() {
        localStorage.removeItem(AuthService.SESSION_KEY);
    }

    getSession() {
        try {
            return JSON.parse(localStorage.getItem(AuthService.SESSION_KEY));
        } catch {
            return null;
        }
    }

    async getCurrentUser() {
        const session = this.getSession();
        if (!session) return null;

        const users = await this._loadUsers();
        return users.find((u) => u.id === session.userId) || null;
    }

    isLoggedIn() {
        return !!this.getSession();
    }

    isAdmin() {
        return this.getSession()?.role === "admin";
    }

    isManager() {
        return this.getSession()?.role === "manager";
    }

    isUser() {
        return this.getSession()?.role === "user";
    }

    requireAuth(redirectTo = "/frontend/pages/main/login.html") {
        if (!this.isLoggedIn()) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }

    requireRole(role, redirectTo = "/frontend/index.html") {
        if (this.getSession()?.role !== role) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }

    async register(data) {
        const users = await this._loadUsers();
        const existing = this._findUser(users, data.email);
        if (existing) throw new Error("Email sudah terdaftar");

        throw new Error("Register harus melalui server backend/server.js");
    }

}

const authService = new AuthService();
export default authService;
