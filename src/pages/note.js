import NoteEditor from "../components/note-editor";
import FileTree from "../components/file-tree";

export default class NotePage extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.classList.add("note-page");
    const noteEditor = new NoteEditor();
    const fileTree = new FileTree();

    this.appendChild(fileTree);
    this.appendChild(noteEditor);

    fileTree.addEventListener("select-note", (e) =>
      noteEditor.dispatchEvent(
        new CustomEvent("select-note", { detail: e.detail })
      )
    );
    noteEditor.addEventListener("refresh-files", () => fileTree.refresh());
  }
}

customElements.define("note-page", NotePage);
