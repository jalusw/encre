export default class FileTree extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = '<p>Hello world !</p>';
  }
}

customElements.define("file-tree", FileTree);
