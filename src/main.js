import "./styles/style.css";

document.addEventListener("DOMContentLoaded", () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js");
  } else {
    console.warn("Service workers are not supported in this browser.");
  }
});
