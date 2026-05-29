export const DOM = {
    $(selector, ctx = document) {
        return ctx.querySelector(selector);
    },

    $$(selector, ctx = document) {
        return [...ctx.querySelectorAll(selector)];
    },

    create(tag, attrs = {}, children = []) {
        const el = document.createElement(tag);
        for (const [key, val] of Object.entries(attrs)) {
            if (key === "className") {
                el.className = val;
            } else if (key === "dataset") {
                Object.assign(el.dataset, val);
            } else if (key === "textContent") {
                el.textContent = val;
            } else if (key === "innerHTML") {
                el.innerHTML = val;
            } else {
                el.setAttribute(key, val);
            }
        }
        children.forEach((child) => {
            if (typeof child === "string") {
                el.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                el.appendChild(child);
            }
        });
        return el;
    },

    clear(el) {
        el.innerHTML = "";
    },

    remove(el) {
        el.remove();
    },
};
