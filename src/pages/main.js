import FileTree from "../components/file-tree.js";
import MarkdownEditor from "../components/markdown-editor.js";

export default class MainPage extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const fileTree = new FileTree();
    const markdownEditor = new MarkdownEditor();

    this.classList.add("main-page");

    this.appendChild(fileTree);
    this.appendChild(markdownEditor);
  }
}

customElements.define("main-page", MainPage);
