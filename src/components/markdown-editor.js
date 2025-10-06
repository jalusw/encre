import {
  parseMarkdown,
  astToHtml,
  htmlToMarkdown,
} from "../utils/markdown-parser";

export default class MarkdownEditor extends HTMLElement {
  constructor() {
    super();
    this._value = "";
    this._editorEl = null;
    this._viewerEl = null;
  }

  connectedCallback() {
    this.classList.add("note-editor");

    const editor = document.createElement("textarea");
    const viewer = document.createElement("div");

    editor.classList.add("note-editor__editor");
    viewer.classList.add("note-editor__viewer");

    this.appendChild(editor);
    this.appendChild(viewer);

    this._editorEl = editor;
    this._viewerEl = viewer;

    // Initial render
    editor.value = this._value;
    // Stretch the textarea and remove manual resize
    editor.setAttribute("spellcheck", "false");

    // Sync height with viewport for a better split view
    const resize = () => {
      // keep both panes visually aligned
      const h = window.innerHeight - 2 * 16; // padding approximation
      editor.style.height = `${h}px`;
      // viewer uses flex + overflow; no explicit height needed
    };
    resize();
    window.addEventListener("resize", resize);
    this.#renderPreview();

    editor.addEventListener("input", () => {
      this._value = editor.value;
      this.#renderPreview();
      this.#emitChange();
    });

    // keep preview scrolled in proportion to textarea
    const syncScroll = () => {
      const maxEditorScroll = editor.scrollHeight - editor.clientHeight;
      const maxViewerScroll = viewer.scrollHeight - viewer.clientHeight;
      if (maxEditorScroll <= 0 || maxViewerScroll <= 0) return;
      const ratio = editor.scrollTop / maxEditorScroll;
      viewer.scrollTop = Math.round(ratio * maxViewerScroll);
    };
    editor.addEventListener("scroll", syncScroll);

    // Enable Ctrl/Cmd+S to emit a save event with markdown/html payload
    this.addEventListener("keydown", (e) => {
      const isSave =
        (e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S");
      if (isSave) {
        e.preventDefault();
        this.dispatchEvent(
          new CustomEvent("save", {
            bubbles: true,
            detail: {
              markdown: this.value,
              html: this.html,
            },
          })
        );
      }
    });
  }

  set value(v) {
    this._value = String(v ?? "");
    if (this._editorEl) {
      this._editorEl.value = this._value;
      this.#renderPreview();
    }
  }

  get value() {
    return this._value;
  }

  get ast() {
    try {
      return parseMarkdown(this._value || "");
    } catch (e) {
      console.error(e);
      return { type: "Document", children: [] };
    }
  }

  get html() {
    try {
      return astToHtml(this.ast);
    } catch (e) {
      console.error(e);
      return "";
    }
  }

  // Accept external HTML and convert to markdown for the editor value
  set html(v) {
    const md = htmlToMarkdown(String(v ?? ""));
    this.value = md;
  }

  #renderPreview() {
    if (!this._viewerEl) return;
    this._viewerEl.innerHTML = this.html;
  }

  #emitChange() {
    this.dispatchEvent(
      new CustomEvent("change", {
        bubbles: true,
        detail: {
          markdown: this._value,
          ast: this.ast,
          html: this.html,
        },
      })
    );
  }
}

customElements.define("markdown-editor", MarkdownEditor);
