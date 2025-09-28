import MarkdownBlock from "./markdown-block";

const markdownExample = `# Hello World
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
---`;

function createState(initialState, onChange) {
  return new Proxy({
    listeners: [],
    ...initialState,
    },{
    set(target, key, value) {
      target[key] = value;
      onChange(target);
      return true;
    },
  });
}

export default class MarkdownEditor extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.state = createState(
      {
        content: markdownExample.split("\n"),
      },
      () => {
        this.render();
      }
    );
    this.render();
  }

  render() {
    this.classList.add("markdown-editor");

    this.state.content.map((item, index) => {
      this.appendChild(new MarkdownBlock(item, (v) => {
      }));
    });

    this.appendChild(this.createBlock());
  }

  createBlock() {
    const block = new MarkdownBlock("", (v) => {
      console.log(v);
    });
    block.addEventListener("click", () => {
      this.appendChild(block);
    });
    return block;
  }
}

customElements.define("markdown-editor", MarkdownEditor);
