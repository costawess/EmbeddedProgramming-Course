/* Keep the existing dashboard and experiments inside the course navigation. */
(() => {
  let dispose = () => {};

  function mountDashboard() {
    dispose();
    const frame = document.getElementById("ep-dashboard-frame");
    if (!frame) return;
    // Lecture links can open a particular local simulation in the course shell.
    const parameters = new URLSearchParams(window.location.search);
    const lab = parameters.get("lab");
    if (lab && /^(simulations|experiments)\/[a-z0-9_-]+\.html$/.test(lab)) {
      const url = new URL(`../dashboard-app/web/${lab}`, window.location.href);
      parameters.delete("lab");
      url.search = parameters.toString();
      if (frame.src !== url.href) frame.src = url.href;
      const standalone = document.querySelector(".ep-dashboard-toolbar a");
      if (standalone) standalone.href = url.href;
    }
    let resizeObserver;
    let themeObserver;
    let animation;
    const paletteObserver = new MutationObserver(syncPalette);

    function syncPalette() {
      const doc = frame.contentDocument;
      if (!doc?.body) return;
      const dark = document.body.dataset.mdColorScheme === "slate";
      doc.documentElement.classList.toggle("theme-dark", dark);
      const controls = frame.contentWindow.uiSound;
      if (controls) {
        controls.lightsOn = !dark;
        controls.applyTheme();
        controls.syncToggleLabels();
      }
    }

    function enhanceFrame() {
      resizeObserver?.disconnect();
      themeObserver?.disconnect();
      const doc = frame.contentDocument;
      if (!doc?.body) return;
      const style = doc.createElement("style");
      style.textContent = `
        html, body { min-height: 0 !important; height: auto !important; }
        .menu-screen { min-height: 0 !important; }
        html.theme-dark body { background: #1e2129; }
        html.theme-dark { --bg: #1e2129; --panel: #252935; --menu-card-bg: #252935; --menu-card-border: #373b49; }
        html.theme-dark .menu-hero, html.theme-dark .menu-column { background: #252935; border-color: #373b49; box-shadow: none; }
        html.theme-dark .menu-card { background: #1e2129; border-color: #373b49; box-shadow: none; }
        .app { padding: 16px; }
      `;
      doc.head.appendChild(style);
      syncPalette();
      themeObserver = new MutationObserver(() => {
        const dark = doc.documentElement.classList.contains("theme-dark");
        if (dark !== (document.body.dataset.mdColorScheme === "slate")) {
          document.getElementById(dark ? "__palette_0" : "__palette_1")?.click();
        }
      });
      themeObserver.observe(doc.documentElement, { attributes: true, attributeFilter: ["class"] });
      resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(animation);
        animation = requestAnimationFrame(() => {
          frame.style.height = `${Math.max(680, Math.ceil(doc.body.getBoundingClientRect().height))}px`;
        });
      });
      resizeObserver.observe(doc.body);
    }

    frame.addEventListener("load", enhanceFrame);
    paletteObserver.observe(document.body, { attributes: true, attributeFilter: ["data-md-color-scheme"] });
    if (frame.contentDocument?.readyState === "complete") enhanceFrame();
    dispose = () => {
      resizeObserver?.disconnect();
      themeObserver?.disconnect();
      cancelAnimationFrame(animation);
      frame.removeEventListener("load", enhanceFrame);
      paletteObserver.disconnect();
    };
  }

  if (typeof document$ !== "undefined") document$.subscribe(mountDashboard);
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountDashboard);
  else mountDashboard();
})();
