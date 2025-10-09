export function parseMarkdown(input) {
  const lines = input.split(/\r?\n/);
  const ast = { type: "Document", children: [] };

  let i = 0;
  while (i < lines.length) {
    let line = lines[i];

    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }

    // Headings: #, ##, ###
    let headingMatch = /^(#{1,6})\s+(.*)/.exec(line);
    if (headingMatch) {
      ast.children.push({
        type: "Heading",
        level: headingMatch[1].length,
        children: parseInline(headingMatch[2]),
        raw: line,
      });
      i++;
      continue;
    }

    // Blockquote: >
    if (/^>\s?/.test(line)) {
      let content = line.replace(/^>\s?/, "");
      ast.children.push({
        type: "Blockquote",
        children: parseInline(content),
        raw: line,
      });
      i++;
      continue;
    }

    // Code block: ```
    if (/^```/.test(line)) {
      let language = line.slice(3).trim();
      let content = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        content.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      ast.children.push({
        type: "CodeBlock",
        language: language || null,
        value: content.join("\n"),
        raw: `\`\`\`${language}\n${content.join("\n")}\n\`\`\``,
      });
      continue;
    }

    // List (unordered)
    if (/^[-*+]\s+/.test(line)) {
      let items = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        let itemText = lines[i].replace(/^[-*+]\s+/, "");
        items.push({
          type: "ListItem",
          children: parseInline(itemText),
        });
        i++;
      }
      ast.children.push({
        type: "List",
        ordered: false,
        children: items,
        raw: items.map((item) => item.raw).join("\n"),
      });
      continue;
    }

    // Ordered List
    if (/^\d+\.\s+/.test(line)) {
      let items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        let itemText = lines[i].replace(/^\d+\.\s+/, "");
        items.push({
          type: "ListItem",
          children: parseInline(itemText),
          raw: lines[i],
        });
        i++;
      }
      ast.children.push({ type: "List", ordered: true, children: items });
      continue;
    }

    // Divider
    if (/^---/.test(line)) {
      ast.children.push({ type: "Divider", raw: line });
      i++;
      continue;
    }

    // Paragraph
    let paragraphLines = [line];
    i++;
    while (i < lines.length && !/^\s*$/.test(lines[i])) {
      paragraphLines.push(lines[i]);
      i++;
    }
    ast.children.push({
      type: "Paragraph",
      children: parseInline(paragraphLines.join(" ")),
      raw: paragraphLines.join("\n"),
    });
  }

  return ast;
}

export function htmlToAst(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  return {
    type: "Document",
    children: Array.from(doc.body.childNodes).map(nodeToAst),
  };
}

function nodeToAst(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return { type: "Text", value: node.nodeValue };
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const tag = node.tagName.toLowerCase();
  const children = Array.from(node.childNodes).map(nodeToAst).filter(Boolean);

  switch (tag) {
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return { type: "Heading", level: parseInt(tag[1]), children };

    case "p":
      return { type: "Paragraph", children };

    case "strong":
    case "b":
      return { type: "Bold", children };

    case "em":
    case "i":
      return { type: "Italic", children };

    case "a":
      return { type: "Link", url: node.getAttribute("href"), children };

    case "code":
      if (
        node.parentElement &&
        node.parentElement.tagName.toLowerCase() === "pre"
      ) {
        // handled at <pre>
        return null;
      }
      return { type: "InlineCode", value: node.textContent };

    case "pre":
      const code = node.querySelector("code");
      return {
        type: "CodeBlock",
        language: code ? extractLanguage(code) : null,
        value: code ? code.textContent : node.textContent,
      };

    case "ul":
      return { type: "List", ordered: false, children };

    case "ol":
      return { type: "List", ordered: true, children };

    case "li":
      return { type: "ListItem", children };

    case "blockquote":
      return { type: "Blockquote", children };

    default:
      return { type: "Text", value: node.textContent };
  }
}

function extractLanguage(codeNode) {
  const className = codeNode.getAttribute("class") || "";
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : null;
}

// -------- Inline Parsing -------- //
export function parseInline(text) {
  const nodes = [];
  let i = 0;

  while (i < text.length) {
    // Bold (**text** or __text__)
    if (text.startsWith("**", i) || text.startsWith("__", i)) {
      let marker = text.slice(i, i + 2);
      let end = text.indexOf(marker, i + 2);
      if (end !== -1) {
        nodes.push({
          type: "Bold",
          children: parseInline(text.slice(i + 2, end)),
          raw: text.slice(i, end + 2),
        });
        i = end + 2;
        continue;
      }
    }

    // Italic (*text* or _text_)
    if (text[i] === "*" || text[i] === "_") {
      let marker = text[i];
      let end = text.indexOf(marker, i + 1);
      if (end !== -1) {
        nodes.push({
          type: "Italic",
          children: parseInline(text.slice(i + 1, end)),
          raw: text.slice(i, end + 1),
        });
        i = end + 1;
        continue;
      }
    }

    // Inline code `code`
    if (text[i] === "`") {
      let end = text.indexOf("`", i + 1);
      if (end !== -1) {
        nodes.push({
          type: "InlineCode",
          value: text.slice(i + 1, end),
          raw: text.slice(i, end + 1),
        });
        i = end + 1;
        continue;
      }
    }

    // Links [label](url)
    if (text[i] === "[") {
      let closeBracket = text.indexOf("]", i);
      let openParen = text.indexOf("(", closeBracket);
      let closeParen = text.indexOf(")", openParen);
      if (
        closeBracket !== -1 &&
        openParen === closeBracket + 1 &&
        closeParen !== -1
      ) {
        let label = text.slice(i + 1, closeBracket);
        let url = text.slice(openParen + 1, closeParen);
        nodes.push({
          type: "Link",
          url,
          children: parseInline(label),
          raw: text.slice(i, closeParen + 1),
        });
        i = closeParen + 1;
        continue;
      }
    }

    // Plain text
    let nextSpecial = findNextSpecial(text, i);
    nodes.push({
      type: "Text",
      value: text.slice(i, nextSpecial),
      raw: text.slice(i, nextSpecial),
    });
    i = nextSpecial;
  }

  return nodes;
}

export function toHTML(ast) {
  return ast.map((node) => {
    if (node.type === "Text") {
      return node.value;
    }
    if (node.type === "Bold") {
      return `<strong>${toHTML(node.children)}</strong>`;
    }
    if (node.type === "Italic") {
      return `<em>${toHTML(node.children)}</em>`;
    }
    if (node.type === "InlineCode") {
      return `<code>${node.value}</code>`;
    }
    if (node.type === "Link") {
      return `<a href="${node.url}">${toHTML(node.children)}</a>`;
    }
    if (node.type === "List") {
      return `<ul>${node.children.map(toHTML).join("")}</ul>`;
    }
    if (node.type === "ListItem") {
      return `<li>${toHTML(node.children)}</li>`;
    }
    if (node.type === "Divider") {
      return `<hr/>`;
    }
    return "";
  });
}
export function astToHtml(node) {
  switch (node.type) {
    case "Document":
      return node.children.map(astToHtml).join("");

    case "Heading":
      return `<h${node.level}>${node.children.map(astToHtml).join("")}</h${
        node.level
      }>`;

    case "Paragraph":
      return `<p>${node.children.map(astToHtml).join("")}</p>`;

    case "Bold":
      return `<strong>${node.children.map(astToHtml).join("")}</strong>`;

    case "Italic":
      return `<em>${node.children.map(astToHtml).join("")}</em>`;

    case "Link":
      return `<a href="${escapeHtmlAttr(node.url)}">${node.children
        .map(astToHtml)
        .join("")}</a>`;

    case "InlineCode":
      return `<code>${escapeHtml(node.value)}</code>`;

    case "CodeBlock":
      const langClass = node.language
        ? ` class="language-${escapeHtmlAttr(node.language)}"`
        : "";
      return `<pre><code${langClass}>${escapeHtml(node.value)}</code></pre>`;

    case "List":
      const tag = node.ordered ? "ol" : "ul";
      return `<${tag}>${node.children.map(astToHtml).join("")}</${tag}>`;

    case "ListItem":
      return `<li>${node.children.map(astToHtml).join("")}</li>`;

    case "Blockquote":
      return `<blockquote>${node.children
        .map(astToHtml)
        .join("")}</blockquote>`;

    case "Text":
      return escapeHtml(node.value);

    case "Divider":
      return `<hr/>`;

    default:
      return "";
  }
}

// ---- Helpers ---- //
export function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeHtmlAttr(text) {
  return escapeHtml(text).replace(/"/g, "&quot;");
}

// Helper: find next special marker
export function findNextSpecial(text, start) {
  let specials = ["**", "__", "*", "_", "`", "[", "]"];
  let positions = specials
    .map((s) => text.indexOf(s, start))
    .filter((p) => p !== -1);
  return positions.length > 0 ? Math.min(...positions) : text.length;
}

export function htmlToMarkdown(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  return Array.from(doc.body.childNodes)
    .map((node) => nodeToMarkdown(node))
    .filter(Boolean)
    .join("\n\n"); // double newline between block elements
}

function nodeToMarkdown(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue.replace(/\n/g, ""); // remove raw line breaks
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const tag = node.tagName.toLowerCase();
  const children = Array.from(node.childNodes)
    .map(nodeToMarkdown)
    .filter(Boolean)
    .join("");

  switch (tag) {
    case "h1":
      return `# ${children}`;
    case "h2":
      return `## ${children}`;
    case "h3":
      return `### ${children}`;
    case "h4":
      return `#### ${children}`;
    case "h5":
      return `##### ${children}`;
    case "h6":
      return `###### ${children}`;

    case "p":
      return children;

    case "strong":
    case "b":
      return `**${children}**`;

    case "em":
    case "i":
      return `*${children}*`;

    case "a":
      const href = node.getAttribute("href") || "";
      return `[${children}](${href})`;

    case "code":
      if (
        node.parentElement &&
        node.parentElement.tagName.toLowerCase() === "pre"
      ) {
        return null; // handled at <pre>
      }
      return `\`${children}\``;

    case "pre":
      const code = node.querySelector("code");
      const codeText = code ? code.textContent : node.textContent;
      return `\`\`\`${code ? extractLanguage(code) || "" : ""}\n${codeText}\n\`\`\``;

    case "ul":
      return Array.from(node.children)
        .map((li) => `- ${nodeToMarkdown(li)}`)
        .join("\n");

    case "ol":
      return Array.from(node.children)
        .map((li, i) => `${i + 1}. ${nodeToMarkdown(li)}`)
        .join("\n");

    case "li":
      return children;

    case "blockquote":
      return children
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");

    default:
      return children; // fallback: treat unknown tags as text
  }
}
