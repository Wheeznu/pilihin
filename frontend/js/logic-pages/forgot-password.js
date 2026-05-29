import { DOM } from "../utils/dom.js";

class ForgotPasswordPage {
    constructor() {
        this._cacheElements();
        this._bindEvents();
    }

    _cacheElements() {
        this.form = DOM.$("#forgotForm");
        this.emailInput = DOM.$("#email");
        this.submitBtn = DOM.$("#forgotSubmit");
        this.alertBox = DOM.$("#forgotAlert");
        this.alertText = DOM.$("#forgotAlertText");
        this.formCard = DOM.$("#formCard");
        this.successCard = DOM.$("#successCard");
        this.userEmailSpan = DOM.$("#userEmail");
    }

    _bindEvents() {
        this.form?.addEventListener("submit", (e) => this._handleSubmit(e));
    }

    async _handleSubmit(e) {
        e.preventDefault();

        this._hideAlert();

        const email = this.emailInput?.value.trim();
        if (!email) {
            this._showAlert("error", "Masukkan alamat email Anda");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            this._showAlert("error", "Format email tidak valid");
            return;
        }

        this._setLoading(true);

        try {
            await this._sendResetLink(email);
            this._showSuccess(email);
        } catch (err) {
            if (err.message === "Failed to fetch") {
                this._showAlert("error", "Server tidak terhubung. Jalankan backend/server.js");
            } else {
                this._showAlert("error", err.message);
            }
            this._setLoading(false);
        }
    }

    async _sendResetLink(email) {
        const res = await fetch("http://localhost:3000/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        const result = await res.json();

        if (!result.success) {
            throw new Error(result.error || "Gagal mengirim tautan reset");
        }

        console.log(`[DEV] Reset token untuk ${email}: ${result.resetToken}`);
    }

    _showSuccess(email) {
        if (this.userEmailSpan) this.userEmailSpan.textContent = email;
        if (this.formCard) this.formCard.hidden = true;
        if (this.successCard) this.successCard.hidden = false;
    }

    _setLoading(loading) {
        if (!this.submitBtn) return;
        this.submitBtn.disabled = loading;
        this.submitBtn.innerHTML = loading
            ? '<span class="spinner"></span> Mengirim...'
            : '<i data-feather="send"></i> Kirim Tautan Reset';
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

export default ForgotPasswordPage;
