export default class MarkdownEditor extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `<div contentEditable>
    <h1>Hello World </h1>
      </div>`;
  }
}

customElements.define("markdown-editor", MarkdownEditor);
