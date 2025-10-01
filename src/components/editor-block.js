import { astToHtml } from "../utils/markdown-parser";

export default class EditorBlock extends HTMLElement {
  constructor(node, onChange) {
    super();
    this.node = node;
    this.onChange = onChange;
  }

  connectedCallback() {
    this.classList = ["editor-block"];
    this.contentEditable = true;
    this.innerHTML = astToHtml(this.node);
  }
}

customElements.define("editor-block", EditorBlock);
