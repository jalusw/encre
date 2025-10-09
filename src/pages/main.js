import FileTree from "../components/file-tree.js";
import NoteEditor from "../components/note-editor.js";
import "../components/navbar.js";

export default class MainPage extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const fileTree = new FileTree();
    const noteEditor = new NoteEditor();

    this.classList.add("main-page");

    const navbar = document.createElement("app-navbar");
    navbar.classList.add("main-page__navbar");

    const content = document.createElement("div");
    content.classList.add("main-page__content");
    content.appendChild(fileTree);
    content.appendChild(noteEditor);

    this.appendChild(navbar);
    this.appendChild(content);

    // Bubble selection to editor and refresh to tree
    fileTree.addEventListener("select-note", (e) =>
      noteEditor.dispatchEvent(
        new CustomEvent("select-note", { detail: e.detail }),
      ),
    );
    noteEditor.addEventListener("refresh-files", () => fileTree.refresh());
  }
}

customElements.define("main-page", MainPage);
