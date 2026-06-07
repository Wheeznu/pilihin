class Footer {
    static async load(containerId = "footer-container") {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            const res = await fetch("/frontend/components/footer.html");
            const html = await res.text();
            container.innerHTML = html;
            feather.replace();
        } catch {
            console.warn("Footer component not found");
        }
    }
}

export default Footer;
