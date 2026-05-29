import { validate, showFormErrors, clearFormErrors } from "../utils/validation.js";
import authService from "../../../backend/services/AuthService.js";
import { DOM } from "../utils/dom.js";

class RegisterPage {
    constructor() {
        if (authService.isLoggedIn()) {
            window.location.href = "../index.html";
            return;
        }
        this._cacheElements();
        this._bindEvents();
    }

    _cacheElements() {
        this.form = DOM.$("#registerForm");
        this.submitBtn = DOM.$("#registerSubmit");
        this.alertBox = DOM.$("#registerAlert");
        this.alertText = DOM.$("#registerAlertText");
        this.passwordInput = DOM.$("#password");
        this.confirmPasswordInput = DOM.$("#confirmPassword");
        this.togglePassword = DOM.$("#togglePassword");
        this.toggleConfirmPassword = DOM.$("#toggleConfirmPassword");
    }

    _bindEvents() {
        this.form?.addEventListener("submit", (e) => this._handleSubmit(e));

        this.form?.querySelectorAll(".form-input").forEach((input) => {
            input.addEventListener("input", () => this._clearFieldError(input.name));
        });

        this.togglePassword?.addEventListener("click", () =>
            this._toggleVisibility(this.passwordInput, this.togglePassword),
        );

        this.toggleConfirmPassword?.addEventListener("click", () =>
            this._toggleVisibility(this.confirmPasswordInput, this.toggleConfirmPassword),
        );
    }

    _toggleVisibility(input, btn) {
        if (!input) return;
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        btn.innerHTML = isPassword
            ? '<i data-feather="eye-off"></i>'
            : '<i data-feather="eye"></i>';
        feather.replace();
    }

    _clearFieldError(name) {
        const input = this.form?.querySelector(`[name="${name}"]`);
        if (!input) return;
        input.classList.remove("input--error");
        const errorEl = input.parentNode.querySelector(".field-error");
        if (errorEl) errorEl.remove();
    }

    _validateForm(data) {
        const errors = {};

        if (!data.username?.trim()) errors.username = "Username wajib diisi";
        else if (data.username.trim().length < 3) errors.username = "Minimal 3 karakter";
        else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) errors.username = "Hanya huruf, angka, dan underscore";

        if (!data.email?.trim()) errors.email = "Email wajib diisi";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Format email tidak valid";

        if (!data.password) errors.password = "Password wajib diisi";
        else if (data.password.length < 6) errors.password = "Minimal 6 karakter";

        if (!data.confirmPassword) errors.confirmPassword = "Konfirmasi password wajib diisi";
        else if (data.password !== data.confirmPassword) errors.confirmPassword = "Password tidak cocok";

        return Object.keys(errors).length ? errors : null;
    }

    async _handleSubmit(e) {
        e.preventDefault();
        this._hideAlert();
        clearFormErrors(this.form);

        const data = {
            username: this.form?.querySelector('[name="username"]')?.value || "",
            email: this.form?.querySelector('[name="email"]')?.value || "",
            password: this.passwordInput?.value || "",
            confirmPassword: this.confirmPasswordInput?.value || "",
        };

        const errors = this._validateForm(data);
        if (errors) {
            showFormErrors(this.form, errors);
            return;
        }

        this._setLoading(true);

        try {
            const res = await fetch("http://localhost:3000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: data.username.trim(),
                    email: data.email.trim(),
                    password: data.password,
                }),
            });

            const result = await res.json();

            if (!result.success) {
                throw new Error(result.error || "Pendaftaran gagal");
            }

            const db = JSON.parse(localStorage.getItem("pilih-in-db"));
            if (db) {
                db.users.push(result.user);
                localStorage.setItem("pilih-in-db", JSON.stringify(db));
            }

            this._showAlert("success", "Pendaftaran berhasil! Mengarahkan ke halaman login...");
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
        } catch (err) {
            if (err.message === "Failed to fetch") {
                this._showAlert("error", "Server tidak terhubung. Jalankan backend/server.js");
            } else {
                this._showAlert("error", err.message);
            }
            this._setLoading(false);
        }
    }

    _setLoading(loading) {
        if (!this.submitBtn) return;
        this.submitBtn.disabled = loading;
        this.submitBtn.innerHTML = loading
            ? '<span class="spinner"></span> Mendaftarkan...'
            : '<i data-feather="user-plus"></i> Daftar';
        feather.replace();
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

export default RegisterPage;
