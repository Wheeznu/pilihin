import { DOM } from "../utils/dom.js";

class ContactPage {
    constructor() {
        this._cacheElements();
        this._bindEvents();
    }

    _cacheElements() {
        this.form = DOM.$("#contactForm");
        this.nameInput = DOM.$("#contactName");
        this.emailInput = DOM.$("#contactEmail");
        this.messageInput = DOM.$("#contactMessage");
        this.submitBtn = DOM.$("#contactSubmit");
        this.alertBox = DOM.$("#contactAlert");
    }

    _bindEvents() {
        if (this.form) {
            this.form.addEventListener("submit", (e) => this._handleSubmit(e));
        }
    }

    _showAlert(message, type) {
        if (!this.alertBox) return;
        this.alertBox.textContent = message;
        this.alertBox.className = `contact-alert contact-alert--${type}`;
    }

    _hideAlert() {
        if (this.alertBox) {
            this.alertBox.className = "contact-alert";
        }
    }

    _validate() {
        const name = this.nameInput?.value.trim();
        const email = this.emailInput?.value.trim();
        const message = this.messageInput?.value.trim();

        if (!name) return "Nama wajib diisi";
        if (name.length < 3) return "Nama minimal 3 karakter";
        if (!email) return "Email wajib diisi";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email tidak valid";
        if (!message) return "Pesan wajib diisi";
        if (message.length < 10) return "Pesan minimal 10 karakter";
        return null;
    }

    async _handleSubmit(e) {
        e.preventDefault();
        this._hideAlert();

        const error = this._validate();
        if (error) {
            this._showAlert(error, "error");
            return;
        }

        this.submitBtn.disabled = true;
        this.submitBtn.innerHTML = '<i data-feather="loader"></i> Mengirim...';
        feather.replace();

        try {
            const res = await fetch("http://localhost:3000/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: this.nameInput.value.trim(),
                    email: this.emailInput.value.trim(),
                    message: this.messageInput.value.trim(),
                }),
            });

            const result = await res.json();

            if (!result.success) {
                throw new Error(result.error || "Gagal mengirim pesan");
            }

            this._showAlert("Pesan berhasil dikirim! Kami akan menghubungi Anda segera.", "success");
            this.form.reset();
        } catch (err) {
            if (err.message === "Failed to fetch") {
                this._showAlert("Server tidak terhubung. Jalankan backend/server.js", "error");
            } else {
                this._showAlert(err.message, "error");
            }
        } finally {
            this.submitBtn.disabled = false;
            this.submitBtn.innerHTML = '<i data-feather="send"></i> Kirim Pesan';
            feather.replace();
        }
    }
}

export default ContactPage;
