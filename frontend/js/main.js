import { getDbReady } from "../../backend/init.js";
import Navbar from "./components/navbar.js";
import HomePage from "./logic-pages/home.js";

document.addEventListener("DOMContentLoaded", async () => {
    await Navbar.load("navbar-container");

    await getDbReady();

    const path = window.location.pathname;

    if (path === "/frontend/index.html" || path === "/" || path === "/frontend/") {
        new HomePage();
    }

    feather.replace();
});
