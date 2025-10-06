// Simple theme manager using CSS color-scheme and the light-dark() function in CSS
// Themes: 'auto' (follow system), 'light', 'dark'

const THEME_KEY = "theme";

export function getTheme() {
  const v = localStorage.getItem(THEME_KEY);
  return v === "light" || v === "dark" ? v : "auto";
}

export function setTheme(theme) {
  const t = theme === "light" || theme === "dark" ? theme : "auto";
  localStorage.setItem(THEME_KEY, t);
  applyTheme(t);
}

export function cycleTheme(current = getTheme()) {
  switch (current) {
    case "auto":
      return "light";
    case "light":
      return "dark";
    case "dark":
    default:
      return "auto";
  }
}

export function applyTheme(theme = getTheme()) {
  const root = document.documentElement;
  // Force a specific scheme or allow both to follow system
  if (theme === "light") {
    root.style.colorScheme = "light";
    root.dataset.theme = "light";
  } else if (theme === "dark") {
    root.style.colorScheme = "dark";
    root.dataset.theme = "dark";
  } else {
    // auto
    root.style.colorScheme = "light dark";
    root.dataset.theme = "auto";
  }
}

export function initTheme() {
  applyTheme(getTheme());
}

export function themeLabel(theme = getTheme()) {
  return theme === "light" ? "Light" : theme === "dark" ? "Dark" : "Auto";
}
