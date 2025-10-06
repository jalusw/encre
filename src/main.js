import "./styles/style.css";

import "./pages/main.js";
import "./pages/note.js";

import DatabaseClient from "./utils/db-client";
import { initTheme } from "./utils/theme";

const init = async () => {
  initTheme();
  initServiceWorker();
  initRouting();
  await initDatabase();
};

const initServiceWorker = () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((e) => console.error("SW registration failed", e));
  } else {
    console.error("Service workers are not supported in this browser.");
  }
};

const initDatabase = async () => {
  const client = new DatabaseClient();
  await client.migrate();
};

const initRouting = () => {
  const pages = {
    "/": "<main-page/>",
    "/note/:id": "<note-page/>",
  };

  const app = document.getElementById("app");

  app.innerHTML = pages[window.location.pathname] || pages["/"];
};

document.addEventListener("DOMContentLoaded", init);
