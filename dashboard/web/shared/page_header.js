(function () {
  const pageMeta = {
    "course_topics_lab.html": {
      icon: "../assets/cards/ep_simulations.svg"
    },
    "arduino_flowchart_converter.html": {
      icon: "../assets/cards/arduino_flowchart.svg"
    }
  };

  // Every page with this header also gets Arduino syntax colours in its code blocks.
  const highlightScriptSrc = document.currentScript
    ? new URL("ino_highlight.js", document.currentScript.src).href
    : "../shared/ino_highlight.js";

  function loadCodeHighlighter() {
    if (typeof window.highlightIno === "function" || document.getElementById("inoHighlightScript")) return;
    const script = document.createElement("script");
    script.id = "inoHighlightScript";
    script.src = highlightScriptSrc;
    document.head.appendChild(script);
  }

  function getBaseName() {
    const parts = window.location.pathname.split("/");
    return parts[parts.length - 1] || "";
  }

  function getIconPath(baseName) {
    if (pageMeta[baseName]?.icon) return pageMeta[baseName].icon;
    return `../assets/cards/${baseName.replace(/\.html$/i, ".svg")}`;
  }

  function injectStyles() {
    if (document.getElementById("pageHeaderEnhancerStyles")) return;
    const style = document.createElement("style");
    style.id = "pageHeaderEnhancerStyles";
    style.textContent = `
      .header.ep-page-header {
        grid-template-columns: minmax(0, 1fr) auto;
      }
      .header.ep-page-header .title {
        min-width: 0;
      }
      .header.ep-page-header .back {
        justify-self: end;
      }
      .ep-header-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
      .ep-header-actions .back { font: inherit; font-weight: 800; cursor: pointer; text-align: center; }
      #epInstructions { position: fixed; inset: 0; margin: auto; width: min(620px, calc(100% - 32px)); max-height: 85vh; overflow: auto; padding: 26px; border: 2px solid var(--line, #526779); border-radius: 22px; background: var(--bg, #142431); color: var(--text, #edf7fb); line-height: 1.6; }
      #epInstructions::backdrop { background: rgba(0, 0, 0, .65); }
      #epInstructions h2 { margin: 0 0 16px; }
      #epInstructions p { margin: 12px 0; }
      #epInstructions h3 { margin: 22px 0 8px; }
      #epInstructions pre { margin: 12px 0; padding: 14px 16px; border: 1px solid #526779; border-radius: 12px; background: #161b22; color: #e6edf3; overflow-x: auto; text-align: left; line-height: 1.7; }
      #epInstructions .uart-command { color: #ff7b72; }
      #epInstructions .uart-bits { color: #79c0ff; }
      #epInstructions button { margin-top: 16px; }
      .ep-page-title-wrap {
        display: grid;
        grid-template-columns: 72px minmax(0, 1fr);
        gap: 16px;
        align-items: center;
      }
      .ep-page-title-icon {
        width: 72px;
        height: 72px;
        border-radius: 18px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.04);
        object-fit: cover;
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
      }
      .ep-page-title-copy {
        min-width: 0;
        display: grid;
        gap: 4px;
      }
      .ep-page-title-copy h1,
      .ep-page-title-copy p {
        margin: 0;
      }
      @media (max-width: 760px) {
        .header.ep-page-header { grid-template-columns: 1fr; }
        .ep-page-title-wrap {
          grid-template-columns: 56px minmax(0, 1fr);
          gap: 12px;
          align-items: start;
        }
        .ep-page-title-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
        }
      }
    `;
    // Simulations no longer show the coloured status pill under the topic title.
    if (window.location.pathname.includes("/simulations/")) {
      style.textContent += `
      #statusPill.status-pill, #topicStatus.status-pill:not(.has-select):not(.has-toggle) { display: none !important; }
      `;
    }
    document.head.appendChild(style);
  }

  function enhanceHeader() {
    const header = document.querySelector(".header");
    const titleHost = header ? header.querySelector(".title") : null;
    if (!titleHost || titleHost.dataset.headerEnhanced === "true") return;

    const backLink = header.querySelector(".back");
    const brandLogo = header.querySelector(".brand-logo");
    if (brandLogo) {
      brandLogo.remove();
    }
    if (backLink) {
      header.insertBefore(titleHost, header.firstChild);
      header.appendChild(backLink);
      header.classList.add("ep-page-header");
    }

    const baseName = getBaseName();
    const meta = pageMeta[baseName] || {};
    const h1 = titleHost.querySelector("h1");
    const p = titleHost.querySelector("p");
    if (!h1) return;

    const titleText = meta.title || h1.textContent.trim();
    const descriptionText = meta.description || (p ? p.textContent.trim() : "");
    const iconPath = getIconPath(baseName);

    titleHost.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.className = "ep-page-title-wrap";

    const icon = document.createElement("img");
    icon.className = "ep-page-title-icon";
    icon.src = iconPath;
    icon.alt = `${titleText} icon`;

    const copy = document.createElement("div");
    copy.className = "ep-page-title-copy";

    const newH1 = document.createElement("h1");
    newH1.textContent = titleText;
    copy.appendChild(newH1);

    if (descriptionText) {
      const newP = document.createElement("p");
      newP.textContent = descriptionText;
      copy.appendChild(newP);
    }

    wrap.appendChild(icon);
    wrap.appendChild(copy);
    titleHost.appendChild(wrap);
    titleHost.dataset.headerEnhanced = "true";
    if (backLink && window.location.pathname.includes("/experiments/")) {
      const experiment = baseName.replace(/\.html$/i, "");
      const actions = document.createElement("nav");
      actions.className = "ep-header-actions";
      actions.setAttribute("aria-label", "Experiment resources");
      const instructions = document.createElement("button");
      instructions.type = "button";
      instructions.className = "back";
      instructions.textContent = "Instructions";
      const example = document.createElement("a");
      example.className = "back";
      example.textContent = "Example code";
      example.href = `../shared/example_code.html?experiment=${encodeURIComponent(experiment)}`;
      example.target = "_blank";
      example.rel = "noopener";
      actions.append(instructions);
      if (experiment !== "traffic_lights") actions.append(example);
      actions.append(backLink);
      header.appendChild(actions);

      const dialog = document.createElement("dialog");
      dialog.id = "epInstructions";
      dialog.setAttribute("aria-labelledby", "epInstructionsTitle");
      const heading = document.createElement("h2");
      heading.id = "epInstructionsTitle";
      heading.textContent = `${titleText} — Instructions`;
      dialog.appendChild(heading);
      const addParagraph = text => {
        if (!text) return;
        const paragraph = document.createElement("p");
        paragraph.textContent = text;
        dialog.appendChild(paragraph);
      };
      addParagraph(descriptionText);
      const existing = document.getElementById("instructions");
      if (existing) {
        const copy = existing.cloneNode(true);
        copy.removeAttribute("id");
        copy.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
        dialog.appendChild(copy);
      }
      if (document.getElementById("serialToggleBtn")) {
        addParagraph((experiment === "traffic_lights" ? "" : "Open Example code to view the Arduino sketch for this experiment. ") + "Upload your sketch to the ESP32, select the matching baud rate, then use Connect to select the serial port. Close other serial monitors before connecting (for instance, the Arduino IDE's Serial Monitor).");
        addParagraph(document.getElementById("serialHint")?.textContent);
      }
      const testInput = document.getElementById("uartTestInput");
      if (experiment === "dual_seven_segment") {
        const addSection = title => {
          const h3 = document.createElement("h3");
          h3.textContent = title;
          dialog.appendChild(h3);
        };
        const addFrames = frames => {
          const pre = document.createElement("pre");
          const code = document.createElement("code");
          frames.forEach(([command, bits], index) => {
            if (index) code.appendChild(document.createTextNode("\n"));
            const label = document.createElement("span");
            label.className = "uart-command";
            label.textContent = `${command}:`;
            const payload = document.createElement("span");
            payload.className = "uart-bits";
            payload.textContent = bits;
            code.append(label, payload);
          });
          pre.appendChild(code);
          dialog.appendChild(pre);
        };
        addSection("UART message format");
        addParagraph("Select 1, 2, or 4 displays on the page. Send exactly 8 bits per display in ABCDEFGDP order: 1 turns a segment on and 0 turns it off. Keep leading zeros. End every command with a newline (Serial.println).");
        addSection("1. Update individual displays");
        addParagraph("Use D1:, D2:, D3:, or D4: followed by the segment bits. Each command updates only that display. These two lines show 01 when 2 displays are selected:");
        addFrames([["D1", "11111100"], ["D2", "01100000"]]);
        addParagraph("Aliases: LEFT: or DISPLAY1: for D1; RIGHT: or DISPLAY2: for D2; DISPLAY3: and DISPLAY4: for D3 and D4. DISPLAY: on its own is not accepted.");
        addSection("2. Update all displays in one line");
        addParagraph("Use DISPLAYS: followed by comma-separated groups of 8 bits. The number of groups must match the selected display count.");
        addParagraph("1 display — shows 1:");
        addFrames([["DISPLAYS", "01100000"]]);
        addParagraph("2 displays — shows 01:");
        addFrames([["DISPLAYS", "11111100,01100000"]]);
        addParagraph("4 displays — shows 0123:");
        addFrames([["DISPLAYS", "11111100,01100000,11011010,11110010"]]);
        addParagraph("Send segment bits, not decimal numbers. NUMBER:42 is not supported. Serial.println(value, BIN) omits leading zeros, so send all 8 bits explicitly.");
      }
      if (testInput) addParagraph(`You can also test without hardware using the UART test field. ${testInput.placeholder}`);
      const close = document.createElement("button");
      close.type = "button";
      close.textContent = "Close";
      close.addEventListener("click", () => dialog.close());
      dialog.appendChild(close);
      document.body.appendChild(dialog);
      // Keep experiment keyboard shortcuts from running while reading instructions.
      window.addEventListener("keydown", event => {
        if (dialog.open) event.stopImmediatePropagation();
      }, true);
      instructions.addEventListener("click", () => dialog.showModal());
    }
  }

  function compactExperimentSerial() {
    if (!window.location.pathname.includes("/experiments/")) return;
    const button = document.getElementById("serialToggleBtn");
    const baud = document.getElementById("baudSelect");
    const status = document.getElementById("serialStatus");
    if (!button || !baud || !status) return;
    const test = document.getElementById("uartTestInput");
    const originalParent = button.parentElement;
    const anchor = document.createComment("Serial connect button position");
    originalParent.insertBefore(anchor, button);
    const sourceCard = originalParent.closest(".serial-card, .serial, .uart-card, .card");
    const separateCard = sourceCard && test && !sourceCard.contains(test) ? sourceCard : null;
    let testRow = null;
    if (test) {
      testRow = document.createElement("div");
      testRow.className = "ep-connected-uart-test";
      test.parentElement.insertBefore(testRow, test);
      testRow.appendChild(test);
    }
    const style = document.createElement("style");
    style.textContent = `
      .ep-serial-collapsed { display: none !important; }
      .ep-connected-uart-test { min-width: 0; width: 100%; }
      .ep-connected-uart-test.is-connected { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: center; }
      .ep-connected-uart-test input { min-width: 0; width: 100%; }
      .ep-connected-uart-test #serialToggleBtn { width: auto; margin: 0; white-space: nowrap; }
      @media (max-width: 520px) { .ep-connected-uart-test.is-connected { grid-template-columns: minmax(0, 1fr); } }
    `;
    document.head.appendChild(style);
    function update() {
      // Read the actual baud reported by the page, rather than a changed selector.
      const match = /^Connected at (\d+) baud/i.exec(status.textContent.trim());
      const connected = Boolean(match);
      if (connected) {
        const label = `Disconnect (${match[1]} baud)`;
        if (button.textContent !== label) button.textContent = label;
        button.title = "Disconnect (Key C)";
        if (testRow && button.parentElement !== testRow) testRow.appendChild(button);
      } else {
        if (button.parentElement !== originalParent) originalParent.insertBefore(button, anchor.nextSibling);
        if (/^Disconnect/.test(button.textContent)) button.textContent = "Connect (Key C)";
        button.title = "Connect (Key C)";
      }
      if (testRow) testRow.classList.toggle("is-connected", connected);
      // Without a test field, keep Disconnect in its original row and hide only baud.
      const collapse = testRow ? originalParent : (baud.closest("label, .uart-field, .field") || baud);
      collapse.classList.toggle("ep-serial-collapsed", connected);
      status.classList.toggle("ep-serial-collapsed", connected);
      if (separateCard) separateCard.classList.toggle("ep-serial-collapsed", connected);
    }
    const observer = new MutationObserver(update);
    observer.observe(status, { childList: true, subtree: true, characterData: true });
    observer.observe(button, { childList: true, subtree: true, characterData: true });
    update();
  }

  function boot() {
    injectStyles();
    enhanceHeader();
    compactExperimentSerial();
    loadCodeHighlighter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
