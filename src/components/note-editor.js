import createState from "../utils/create-state";
import "./markdown-editor.js";
import DatabaseClient from "../utils/db-client";

export default class NoteEditor extends HTMLElement {
  constructor() {
    super();
    this.client = new DatabaseClient();
    this.state = createState({ currentId: null }, () => {});
    this._saveTimer = null;
    this._lastSavedContent = null;
  }

  connectedCallback() {
    // Host container should flex to fill space next to file tree
    this.classList.add("note-editor-host");

    const mdEditor = document.createElement("markdown-editor");
    mdEditor.value = "# Hello";

    mdEditor.addEventListener("save", async (e) => {
      await this.#persistAndRefresh(e.detail.markdown);
    });

    // Debounced autosave on change
    mdEditor.addEventListener("change", (e) => {
      this.#scheduleSave(e.detail?.markdown ?? "");
    });

    // Listen to file selection from FileTree
    this.addEventListener("select-note", async (e) => {
      const id = e.detail?.id;
      if (id == null) return;
      await this.#load(id, mdEditor);
    });

    this.appendChild(mdEditor);
  }

  async #load(id, mdEditor) {
    try {
      const { result } = await this.client.select(
        `SELECT id, title, content FROM notes WHERE id = ${Number(id)} LIMIT 1`
      );
      const row = result?.[0];
      if (row) {
        this.state.currentId = row.id;
        mdEditor.value = row.content ?? "";
        this._lastSavedContent = row.content ?? "";
      }
    } catch (err) {
      console.error("Failed to load note:", err);
    }
  }

  #scheduleSave(markdown) {
    if (markdown === this._lastSavedContent) return; // no-op
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(async () => {
      await this.#persistAndRefresh(markdown);
    }, 800);
  }

  async #persistAndRefresh(markdown) {
    await this.#persist(markdown);
    this._lastSavedContent = markdown;
    this.dispatchEvent(new CustomEvent("refresh-files", { bubbles: true }));
  }

  async #persist(markdown) {
    try {
      const title = this.#deriveTitle(markdown);
      if (this.state.currentId == null) {
        await this.client.exec(
          `INSERT INTO notes (title, content, created_at, updated_at) VALUES (
            '${this.#escape(title)}',
            '${this.#escape(markdown)}',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )`
        );
        const { result } = await this.client.select(
          `SELECT id FROM notes ORDER BY id DESC LIMIT 1`
        );
        this.state.currentId = result?.[0]?.id ?? null;
      } else {
        await this.client.exec(
          `UPDATE notes SET title='${this.#escape(
            title
          )}', content='${this.#escape(
            markdown
          )}', updated_at=CURRENT_TIMESTAMP WHERE id=${Number(
            this.state.currentId
          )}`
        );
      }
    } catch (err) {
      console.error("Failed to save note:", err);
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

customElements.define("note-editor", NoteEditor);
