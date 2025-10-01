import { parseMarkdown, astToHtml } from "../utils/markdown-parser";

export default class MarkdownBlock extends HTMLElement {
  constructor() {
    super();
    this._markdown = this.textContent || "";
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ["markdown"];
  }

  attributeChangedCallback(name, _old, value) {
    if (name === "markdown") {
      this._markdown = value || "";
      this.render();
    }
  }

  set markdown(v) {
    this._markdown = String(v ?? "");
    this.render();
  }

  get markdown() {
    return this._markdown;
  }

  render() {
    try {
      const ast = parseMarkdown(this._markdown);
      this.innerHTML = astToHtml(ast);
    } catch (e) {
      console.error(e);
      this.innerHTML = "";
    }
  }
}

customElements.define("markdown-block", MarkdownBlock);
