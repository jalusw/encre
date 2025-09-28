import DatabaseClient from "../db/client";

export default class FileTree extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.client = new DatabaseClient();

    this.innerHTML = "a";

    const list = document.createElement("ul");
    this.client
      .select("SELECT * FROM notes")
      .then(({ result }) => {
        result.forEach((item) => {
          const li = document.createElement("li");
          li.textContent = item.title;
          list.appendChild(li);
        });
      })
      .catch((err) => {
        console.error(err);
      });

    this.classList = ["file-tree"];
    this.appendChild(list);
  }
}

customElements.define("file-tree", FileTree);
