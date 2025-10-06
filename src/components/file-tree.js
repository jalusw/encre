import DatabaseClient from "../utils/db-client";
// theme is adjusted via the top navbar now

export default class FileTree extends HTMLElement {
  constructor() {
    super();
    this.client = new DatabaseClient();
    this._list = null;
    this._searchTerm = "";
    this._searchTimer = null;
  }

  connectedCallback() {
    this.classList = ["file-tree"];

    const header = document.createElement("div");
    header.classList.add("file-tree__header");
    const actions = document.createElement("div");
    actions.classList.add("file-tree__actions");

    // Search input
    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "Search notes...";
    search.classList.add("file-tree__search");
    search.value = this._searchTerm;
    search.addEventListener("input", () => this.#onSearch(search.value));

    const newBtn = document.createElement("button");
    newBtn.classList.add("file-tree__new-btn");
    newBtn.textContent = "+ New";
    newBtn.setAttribute("aria-label", "Create new note");
    newBtn.addEventListener("click", () => this.#createNewNote());
    actions.appendChild(newBtn);

    // Theme toggle moved to navbar
    header.appendChild(search);
    header.appendChild(actions);

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
      const q = (this._searchTerm || "").trim();
      let query = `SELECT id, title, updated_at FROM notes`;
      if (q) {
        const like = this.#escapeLike(q);
        query += ` WHERE title LIKE '%${like}%' ESCAPE '\\' OR content LIKE '%${like}%' ESCAPE '\\'`;
      }
      query += ` ORDER BY updated_at DESC`;
      const { result } = await this.client.select(query);
      result.forEach((row) => this.#appendItem(row));
    } catch (err) {
      console.error("Failed to load notes:", err);
    }
  }

  #appendItem(item) {
    const li = document.createElement("li");
    li.classList.add("file-tree__file");
    const title = document.createElement("span");
    title.classList.add("file-tree__file-title");
    title.textContent = item.title || "Untitled";
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

    const del = document.createElement("button");
    del.classList.add("file-tree__delete");
    del.setAttribute("aria-label", "Delete note");
    del.textContent = "Delete";
    del.addEventListener("click", async (e) => {
      e.stopPropagation();
      await this.#deleteNote(item.id);
    });

    li.appendChild(title);
    li.appendChild(del);
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

  #escapeLike(s) {
    // Escape for LIKE and quotes; use ESCAPE '\\' in SQL
    return this.#escape(
      String(s)
        .replaceAll("\\", "\\\\")
        .replaceAll("%", "\\%")
        .replaceAll("_", "\\_")
    );
  }

  #onSearch(value) {
    this._searchTerm = value || "";
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => this.refresh(), 200);
  }

  async #deleteNote(id) {
    try {
      const ok = confirm("Delete this note? This cannot be undone.");
      if (!ok) return;
      await this.client.exec(`DELETE FROM notes WHERE id = ${Number(id)}`);
      // Inform listeners so editor can clear if needed
      this.dispatchEvent(
        new CustomEvent("note-deleted", { bubbles: true, detail: { id } })
      );
      await this.refresh();
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  }
}

customElements.define("file-tree", FileTree);
