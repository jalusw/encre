import DatabaseClient from "../db/client";

export default class FileTree extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.client = new DatabaseClient();
    this.client.select("SELECT * FROM notes").then(({ data }) => {
      console.log(data.result);
    });

    this.innerHTML = "<p>Hello world !</p>";
  }
}

customElements.define("file-tree", FileTree);
