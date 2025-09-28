export default class MarkdownBlock extends HTMLElement {
  constructor(content, onChange) {
    super();
    this.content = content.trim();
    this.onChange = onChange;
  }

  connectedCallback() {
    this.classList = ["markdown-block"];

    this.contentEditable = true;
    this.textContent = this.content;

    this.addEventListener("input",() => {
      if(this.onChange) {
        this.onChange(this.innerHTML)
      }
    });
  }
}

customElements.define("markdown-block", MarkdownBlock);
