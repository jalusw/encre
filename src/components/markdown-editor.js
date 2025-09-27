const markdownExample = `
# Hello World
lorem ipsum dolor sit amet
---

## Lorem Ipsum dolor sit amet
lorem ipsum dolor sit amet
---

## Lorem Ipsum dolor sit amet
lorem ipsum dolor sit amet
---

## Lorem Ipsum dolor sit amet
lorem ipsum dolor sit amet
---

## Lorem Ipsum dolor sit amet
lorem ipsum dolor sit amet
---
`;

export class MarkdownBlock extends HTMLElement {
  constructor(content) {
    super();
    this.content = content;
  }

  connectedCallback() {
    this.innerHTML = `<div contentEditable>
      ${this.content}
    </div>`;
  }
}
export default class MarkdownEditor extends HTMLElement {
  constructor() {
    super();
    this.content = markdownExample.split("\n");
  }

  connectedCallback() {
    const container = document.createElement("div");
    container.classList.add("markdown-editor");

    this.content.map((item) => {
      container.appendChild(new MarkdownBlock(item));
    });

    this.appendChild(container);
  }
}

customElements.define("markdown-editor", MarkdownEditor);
customElements.define("markdown-block", MarkdownBlock);
