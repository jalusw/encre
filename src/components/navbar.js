import { getTheme, setTheme, cycleTheme, themeLabel } from "../utils/theme";

export default class AppNavbar extends HTMLElement {
  constructor() {
    super();
    this._btn = null;
  }

  connectedCallback() {
    this.classList.add("navbar");
    this.innerHTML = "";

    const left = document.createElement("div");
    left.classList.add("navbar__left");

    const right = document.createElement("div");
    right.classList.add("navbar__right");

    const themeBtn = document.createElement("button");
    themeBtn.classList.add("navbar__btn");
    themeBtn.title = "Theme: Auto/Light/Dark";
    this._btn = themeBtn;
    this.#syncLabel();
    themeBtn.addEventListener("click", () => {
      const next = cycleTheme(getTheme());
      setTheme(next);
      this.#syncLabel();
    });
    right.appendChild(themeBtn);

    this.appendChild(left);
    this.appendChild(right);
  }

  #syncLabel() {
    if (this._btn) this._btn.textContent = themeLabel(getTheme());
  }
}

customElements.define("app-navbar", AppNavbar);
