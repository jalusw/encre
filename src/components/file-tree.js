import DatabaseClient from "../db/client";

export default class FileTree extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.client = new DatabaseClient();
  }
}

customElements.define("file-tree", FileTree);
