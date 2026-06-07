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
        this.form = DOM.$("#loginForm");
        this.emailInput = DOM.$("#email");
        this.passwordInput = DOM.$("#password");
        this.submitBtn = DOM.$("#loginSubmit");
        this.alertBox = DOM.$("#loginAlert");
        this.alertText = DOM.$("#loginAlertText");
        this.togglePassword = DOM.$("#togglePassword");
        this.loadingSpinner = DOM.$("#loginSpinner");
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

        const { valid, data, errors } = validateLogin(this.form);
        if (!valid) return;

        this._setLoading(true);

        try {
            const user = await authService.login(data.email, data.password);
            this._showAlert("success", `Selamat datang, ${user.username}!`);
            setTimeout(() => {
                window.location.href = "../../index.html";
            }, 1000);
        } catch (err) {
            this._showAlert("error", err.message);
            this._setLoading(false);
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
        const errorEl = input.parentNode.querySelector(".field-error");
        if (errorEl) errorEl.remove();
    }

    _setLoading(loading) {
        if (!this.submitBtn) return;
        this.submitBtn.disabled = loading;
        this.submitBtn.innerHTML = loading
            ? '<span id="loginSpinner" class="spinner"></span> Memproses...'
            : '<i data-feather="log-in"></i> Masuk';
        if (loading) {
            feather.replace();
        }
    }

    _showAlert(type, message) {
        if (!this.alertBox || !this.alertText) return;
        this.alertBox.className = `auth-alert auth-alert--${type}`;
        this.alertText.textContent = message;
        this.alertBox.hidden = false;
    }

    _hideAlert() {
        if (this.alertBox) this.alertBox.hidden = true;
    }
}

export default LoginPage;
