import { validateLogin, clearFormErrors } from "../utils/validation.js";
import authService from "../../../backend/services/AuthService.js";
import { DOM } from "../utils/dom.js";

class LoginPage {
    constructor() {
        if (authService.isLoggedIn()) {
            this._redirectToHome();
            return;
        }
        this._cacheElements();
        this._checkRegisteredAlert();
        this._bindEvents();
    }

    _checkRegisteredAlert() {
        const params = new URLSearchParams(window.location.search);
        if (params.has("registered")) {
            this._showAlert("success", "Akun telah berhasil dibuat, silakan login");
            const url = new URL(window.location);
            url.searchParams.delete("registered");
            window.history.replaceState({}, "", url);
        }
    }

    _cacheElements() {
        this.form          = DOM.$("#loginForm");
        this.emailInput    = DOM.$("#email");
        this.passwordInput = DOM.$("#password");
        this.submitBtn     = DOM.$("#loginSubmit");
        this.alertBox      = DOM.$("#loginAlert");
        this.alertText     = DOM.$("#loginAlertText");
        this.togglePassword = DOM.$("#togglePassword");
    }

    _bindEvents() {
        this.form?.addEventListener("submit", (e) => this._handleSubmit(e));
        this.emailInput?.addEventListener("input", () => this._clearFieldError("email"));
        this.passwordInput?.addEventListener("input", () => this._clearFieldError("password"));
        this.emailInput?.addEventListener("keydown", (e) => {
            if (e.key === "Enter") this.passwordInput?.focus();
        });
        this.togglePassword?.addEventListener("click", () => this._togglePasswordVisibility());
    }

    async _handleSubmit(e) {
        e.preventDefault();
        this._hideAlert();

        const { valid, data } = validateLogin(this.form);
        if (!valid) return;

        this._setLoading(true);

        try {
            const user = await authService.login(data.email, data.password);
            this._showAlert("success", `Selamat datang, ${user.username}!`);
            setTimeout(() => { window.location.href = "../../index.html"; }, 1000);
        } catch (err) {
            if (err.message === "Akun dinonaktifkan") {
                this._showSuspendedAlert(data.email, data.password);
            } else {
                this._showAlert("error", err.message);
            }
            this._setLoading(false);
        }
    }

    /* ── Alert akun suspended dengan tombol reaktivasi ── */
    _showSuspendedAlert(email, password) {
        if (!this.alertBox || !this.alertText) return;
        this.alertBox.className = "auth-alert auth-alert--warning";
        this.alertBox.hidden = false;

        this.alertText.innerHTML = `
            <span>Akun ini sedang dinonaktifkan.</span>
            <button id="btnReactivate" style="
                margin-top: 8px;
                display: block;
                width: 100%;
                padding: 8px;
                background: transparent;
                border: 1px solid currentColor;
                border-radius: 6px;
                color: inherit;
                font-family: inherit;
                font-size: 0.85rem;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s;
            ">Aktifkan Kembali Akun</button>
        `;

        document.getElementById("btnReactivate")?.addEventListener("click", () => {
            this._reactivateAccount(email, password);
        });
    }

    async _reactivateAccount(email, password) {
        const btn = document.getElementById("btnReactivate");
        if (btn) { btn.disabled = true; btn.textContent = "Mengaktifkan..."; }

        try {
            const res = await fetch("http://localhost:3000/api/auth/reactivate-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            // Langsung login setelah reaktivasi berhasil
            const user = await authService.login(email, password);
            this._showAlert("success", `Akun berhasil diaktifkan kembali. Selamat datang, ${user.username}!`);
            setTimeout(() => { window.location.href = "../../index.html"; }, 1200);
        } catch (err) {
            const msg = err.message === "Failed to fetch"
                ? "Server tidak terhubung. Jalankan: node backend/server.js"
                : err.message;
            this._showAlert("error", msg);
        }
    }

    _redirectToHome() {
        window.location.href = "../../index.html";
    }

    _togglePasswordVisibility() {
        const isPassword = this.passwordInput.type === "password";
        this.passwordInput.type = isPassword ? "text" : "password";
        this.togglePassword.innerHTML = isPassword
            ? '<i data-feather="eye-off"></i>'
            : '<i data-feather="eye"></i>';
        feather.replace();
    }

    _clearFieldError(field) {
        const input = this.form.querySelector(`[name="${field}"]`);
        if (!input) return;
        input.classList.remove("input--error");
        input.parentNode.querySelector(".field-error")?.remove();
    }

    _setLoading(loading) {
        if (!this.submitBtn) return;
        this.submitBtn.disabled = loading;
        this.submitBtn.innerHTML = loading
            ? '<span class="spinner"></span> Memproses...'
            : '<i data-feather="log-in"></i> Masuk';
        feather.replace();
    }

    _showAlert(type, message) {
        if (!this.alertBox || !this.alertText) return;
        this.alertBox.className = `auth-alert auth-alert--${type}`;
        this.alertText.innerHTML = `<span>${message}</span>`;
        this.alertBox.hidden = false;
    }

    _hideAlert() {
        if (this.alertBox) this.alertBox.hidden = true;
    }
}

export default LoginPage;