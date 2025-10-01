import DatabaseClient from "../utils/db-client";

export default class FileTree extends HTMLElement {
  constructor() {
    super();
    this.client = new DatabaseClient();
    this._list = null;
  }

  connectedCallback() {
    this.classList = ["file-tree"];

    const header = document.createElement("div");
    header.classList.add("file-tree__header");
    header.innerHTML = `<span class="file-tree__title">Notes</span>`;

    const newBtn = document.createElement("button");
    newBtn.classList.add("file-tree__new-btn");
    newBtn.textContent = "+ New";
    newBtn.addEventListener("click", () => this.#createNewNote());
    header.appendChild(newBtn);

    const list = document.createElement("ul");
    list.classList.add("file-tree__files");
    this._list = list;

    this.appendChild(header);
    this.appendChild(list);

    this.refresh();
  }

  async refresh() {
    if (!this._list) return;
    this._list.innerHTML = "";
    try {
      const { result } = await this.client.select(
        `SELECT id, title, updated_at FROM notes ORDER BY updated_at DESC`
      );
      result.forEach((row) => this.#appendItem(row));
    } catch (err) {
      console.error("Failed to load notes:", err);
    }
  }

  #appendItem(item) {
    const li = document.createElement("li");
    li.classList.add("file-tree__file");
    li.textContent = item.title || "Untitled";
    li.title = `Last updated: ${item.updated_at || ""}`;
    li.dataset.id = String(item.id);
    li.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("select-note", {
          bubbles: true,
          detail: { id: item.id },
        })
      );
    });
    this._list.appendChild(li);
  }

  async #createNewNote() {
    try {
      // Default content for a new note
      const content = "# New Note\n\nStart typing...";
      const title = this.#deriveTitle(content);
      await this.client.exec(
        `INSERT INTO notes (title, content, created_at, updated_at) VALUES (
          '${this.#escape(title)}',
          '${this.#escape(content)}',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )`
      );
      // Fetch the newly created id
      const { result } = await this.client.select(
        `SELECT id FROM notes ORDER BY id DESC LIMIT 1`
      );
      const id = result?.[0]?.id;
      await this.refresh();
      if (id != null) {
        this.dispatchEvent(
          new CustomEvent("select-note", { bubbles: true, detail: { id } })
        );
      }
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  }

  #deriveTitle(markdown) {
    const firstLine =
      (markdown || "").split(/\r?\n/).find((x) => x.trim() !== "") ||
      "Untitled";
    const m = /^#\s+(.*)/.exec(firstLine);
    return (m ? m[1] : firstLine).slice(0, 120);
  }

  #escape(s) {
    return String(s).replaceAll("'", "''");
  }
}

customElements.define("file-tree", FileTree);
