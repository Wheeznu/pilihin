export const Rules = {
    required: (v) => (v?.toString().trim() ? null : "Field wajib diisi"),
    email: (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Email tidak valid",
    minLen: (n) => (v) => (v?.length >= n ? null : `Minimal ${n} karakter`),
    maxLen: (n) => (v) => (v?.length <= n ? null : `Maksimal ${n} karakter`),
    phone: (v) => (/^\+?[0-9]{10,15}$/.test(v) ? null : "Nomor tidak valid"),
    rating: (v) =>
        Number.isInteger(v) && v >= 1 && v <= 10 ? null : "Rating 1-10",
    positiveNum: (v) =>
        typeof v === "number" && v > 0 ? null : "Harus bilangan positif",
    password: (v) =>
        v?.length >= 6 ? null : "Password minimal 6 karakter",
};

export function validate(data, schema) {
    const errors = {};
    for (const [field, rules] of Object.entries(schema)) {
        for (const rule of rules) {
            const err = rule(data[field]);
            if (err) {
                errors[field] = err;
                break;
            }
        }
    }
    return Object.keys(errors).length ? errors : null;
}

export function showFormErrors(form, errors) {
    form.querySelectorAll(".field-error").forEach((el) => el.remove());
    form.querySelectorAll(".input--error").forEach((el) =>
        el.classList.remove("input--error"),
    );
    for (const [field, msg] of Object.entries(errors)) {
        const input = form.querySelector(`[name="${field}"]`);
        if (!input) continue;
        input.classList.add("input--error");
        const span = document.createElement("span");
        span.className = "field-error";
        span.textContent = msg;
        input.parentNode.appendChild(span);
    }
}

export const loginSchema = {
    email: [Rules.required, Rules.email],
    password: [Rules.required, Rules.password],
};

export function validateLogin(form) {
    const data = {
        email: form.querySelector('[name="email"]')?.value,
        password: form.querySelector('[name="password"]')?.value,
    };

    const errors = validate(data, loginSchema);

    showFormErrors(form, errors || {});

    return { valid: !errors, data, errors };
}

export function clearFormErrors(form) {
    form.querySelectorAll(".field-error").forEach((el) => el.remove());
    form.querySelectorAll(".input--error").forEach((el) =>
        el.classList.remove("input--error"),
    );
}
