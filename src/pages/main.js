import "../components/file-tree.js";
import "../components/markdown-editor.js";

export default class MainPage extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
      <style>
        .main-page {
          display: flex;
        }
      </style>
      <main class="main-page">
        <file-tree></file-tree>
        <markdown-editor></markdown-editor>
      </main>
    `;
  }
}

customElements.define("main-page", MainPage);
