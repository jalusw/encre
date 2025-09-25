import "./styles/style.css";
import "./pages/main.js";

const init = () => {
  initServiceWorker();
  initRouting();
}

const initServiceWorker = () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js");
  } else {
    console.error("Service workers are not supported in this browser.");
  }
}

const initRouting = () => {
  const pages = {
    '/': '<main-page/>',
  }; 
  const path = window.location.pathname;
  const app = document.getElementById('app');

  app.innerHTML = pages[path];
}

document.addEventListener("DOMContentLoaded", init);
