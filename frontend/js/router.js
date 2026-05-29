class Router {
    constructor() {
        this._routes = {};
        this._init();
    }

    _init() {
        window.addEventListener("popstate", () => this._resolve());
    }

    register(path, handler) {
        this._routes[path] = handler;
        return this;
    }

    navigate(path, data = {}) {
        history.pushState(data, "", path);
        this._resolve();
    }

    _resolve() {
        const path = window.location.pathname;
        const handler = this._routes[path];
        if (handler) handler();
    }

    getCurrentPath() {
        return window.location.pathname;
    }
}

export default Router;
