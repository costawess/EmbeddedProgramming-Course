// Lightweight Arduino/C++ highlighting with the Arduino IDE colours.
// Text nodes preserve the original sketch, so copying the code still works.
(function () {
  // Blocks that show Arduino code and are highlighted automatically.
  // Add data-ino to any other <pre> or <code> to include it.
  const AUTO_SELECTOR = "pre.code-block, pre#code, .helper-box code, pre[data-ino], code[data-ino]";

  const words = list => new Set(list.split(/\s+/));
  const types = words(
    "auto bool boolean byte char class const constexpr double enum explicit extern float friend " +
    "inline int long namespace operator private protected public register short signed static " +
    "struct template typedef typename union unsigned virtual void volatile word String size_t " +
    "uint8_t uint16_t uint32_t uint64_t int8_t int16_t int32_t int64_t"
  );
  const keywords = words(
    "alignas alignof break case catch continue default delete do else for goto if new return " +
    "sizeof static_cast switch this throw try using while"
  );
  const literals = words("true false nullptr NULL");
  const objects = words("Serial Serial1 Serial2 Serial3 Wire SPI WiFi EEPROM Keyboard Mouse");
  const tokens = /\/\/[^\r\n]*|\/\*[\s\S]*?(?:\*\/|$)|R"([^\s()\\]{0,16})\([\s\S]*?\)\1"|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|^[ \t]*#[ \t]*\w+|\b(?:0[xX][\da-fA-F]+|0[bB][01]+|\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)[uUlLfF]*\b|\b[A-Za-z_]\w*\b/gm;

  function injectStyles() {
    if (document.getElementById("inoHighlightStyles")) return;
    const style = document.createElement("style");
    style.id = "inoHighlightStyles";
    // Arduino IDE 2 light theme by default, dark theme when the dashboard lights are off.
    style.textContent = `
      .ino-code { background: #ffffff !important; color: #4e5b61 !important; }
      .ino-code code { background: transparent !important; color: inherit !important; }
      .ino-code .code-line.active { color: inherit !important; }
      .ino-code .syntax-comment { color: #7f8c8d; }
      .ino-code .syntax-string, .ino-code .syntax-number { color: #005c5f; }
      .ino-code .syntax-type, .ino-code .syntax-constant { color: #00979d; }
      .ino-code .syntax-keyword, .ino-code .syntax-directive { color: #728e00; }
      .ino-code .syntax-function { color: #d35400; }
      html.theme-dark .ino-code { background: #1f272a !important; color: #dae3e3 !important; }
      html.theme-dark .ino-code .syntax-comment { color: #7f8c8d; }
      html.theme-dark .ino-code .syntax-string, html.theme-dark .ino-code .syntax-number { color: #7fcbcd; }
      html.theme-dark .ino-code .syntax-type, html.theme-dark .ino-code .syntax-constant { color: #0ca1a6; }
      html.theme-dark .ino-code .syntax-keyword, html.theme-dark .ino-code .syntax-directive { color: #c586c0; }
      html.theme-dark .ino-code .syntax-function { color: #f39c12; }
    `;
    document.head.appendChild(style);
  }

  // Splits the source into [text, kind] pairs; kind is "" for plain text.
  function tokenize(source) {
    const parts = [];
    let offset = 0;
    for (const match of source.matchAll(tokens)) {
      if (match.index > offset) parts.push([source.slice(offset, match.index), ""]);
      const value = match[0];
      let kind = "";
      if (value.startsWith("//") || value.startsWith("/*")) kind = "comment";
      else if (/^(?:R"|["'])/.test(value)) kind = "string";
      else if (value.trimStart().startsWith("#")) kind = "directive";
      else if (/^\d/.test(value)) kind = "number";
      else if (types.has(value)) kind = "type";
      else if (keywords.has(value)) kind = "keyword";
      else if (literals.has(value)) kind = "constant";
      else if (objects.has(value)) kind = "function";
      else if (/^\s*\(/.test(source.slice(match.index + value.length))) kind = "function";
      else if (/^[A-Z][A-Z\d_]*$/.test(value)) kind = "constant";
      parts.push([value, kind]);
      offset = match.index + value.length;
    }
    if (offset < source.length) parts.push([source.slice(offset), ""]);
    return parts;
  }

  function createNode(text, kind) {
    if (!kind) return document.createTextNode(text);
    const node = document.createElement("span");
    node.className = `syntax-${kind}`;
    node.textContent = text;
    return node;
  }

  function markCodeBlock(element) {
    injectStyles();
    const pre = element.tagName === "CODE" ? element.closest("pre") : null;
    (pre || element).classList.add("ino-code");
  }

  function highlightIno(element, source) {
    markCodeBlock(element);
    const fragment = document.createDocumentFragment();
    for (const [text, kind] of tokenize(source)) fragment.appendChild(createNode(text, kind));
    element.replaceChildren(fragment);
  }

  // For blocks rendered as one <span class="code-line"> per line: the whole sketch is
  // tokenized at once (so multi-line comments work) and the tokens go back into their lines.
  function highlightInoLines(element, lines) {
    markCodeBlock(element);
    const source = lines.map(line => line.textContent).join("\n");
    const fragments = lines.map(() => document.createDocumentFragment());
    let lineIndex = 0;
    for (const [text, kind] of tokenize(source)) {
      text.split("\n").forEach((piece, index) => {
        if (index) lineIndex += 1;
        if (piece) fragments[lineIndex].appendChild(createNode(piece, kind));
      });
    }
    lines.forEach((line, index) => line.replaceChildren(fragments[index]));
  }

  function highlightBlock(element) {
    const lines = [...element.querySelectorAll(":scope > .code-line")];
    if (lines.length) highlightInoLines(element, lines);
    else highlightIno(element, element.textContent);
  }

  function startAutoHighlight() {
    const observer = new MutationObserver(records => {
      const blocks = new Set();
      for (const record of records) {
        const target = record.target.nodeType === Node.ELEMENT_NODE ? record.target : record.target.parentElement;
        const owner = target ? target.closest(AUTO_SELECTOR) : null;
        if (owner) blocks.add(owner);
        for (const node of record.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          if (node.matches(AUTO_SELECTOR)) blocks.add(node);
          node.querySelectorAll(AUTO_SELECTOR).forEach(block => blocks.add(block));
        }
      }
      blocks.forEach(block => { if (block.isConnected) highlightBlock(block); });
      // Drop the mutations caused by the highlighting itself.
      observer.takeRecords();
    });
    document.querySelectorAll(AUTO_SELECTOR).forEach(highlightBlock);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  }

  window.highlightIno = highlightIno;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startAutoHighlight, { once: true });
  } else {
    startAutoHighlight();
  }
})();
