export default class MarkdownBlock extends HTMLElement {
  constructor(content) {
    super();
    this.content = content;
  }

  connectedCallback() {
    this.innerHTML = `<div contentEditable>
      ${this.content}
    </div>`;
  }
}

customElements.define("markdown-block", MarkdownBlock);
