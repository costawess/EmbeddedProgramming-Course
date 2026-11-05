(function () {
  const STORAGE_KEY = "embedded-sound-muted";
  const LIGHTS_STORAGE_KEY = "embedded-dashboard-lights-on";
  const LEGACY_LIGHTS_STORAGE_KEY = "embedded-lights-on";

  function getPageName() {
    return window.location.pathname.split("/").pop() || "";
  }

  class UiSoundManager {
    constructor() {
      this.pageName = getPageName();
      this.showsLightsToggle = this.pageName === "index.html";
      this.syncsLightsTheme = this.showsLightsToggle || document.documentElement.hasAttribute("data-sync-dashboard-lights");
      this.muted = false;
      this.lightsOn = false;
      try {
        this.muted = localStorage.getItem(STORAGE_KEY) === "true";
        if (this.syncsLightsTheme) {
          const storedLights = localStorage.getItem(LIGHTS_STORAGE_KEY);
          const legacyStoredLights = localStorage.getItem(LEGACY_LIGHTS_STORAGE_KEY);
          const resolvedLights = storedLights ?? legacyStoredLights;
          this.lightsOn = resolvedLights === "true";
        }
      } catch (error) {
        this.muted = false;
        this.lightsOn = false;
      }
      this.audioContext = null;
      this.masterGain = null;
      this.lastPlayAt = 0;
      this.pendingResume = null;
    }

    init() {
      this.injectStyles();
      this.installHeaderToggles();
      this.installAudioUnlock();
      this.installGlobalListeners();
      this.syncToggleLabels();
    }

    injectStyles() {
      if (document.getElementById("embedded-sound-style")) return;
      const style = document.createElement("style");
      style.id = "embedded-sound-style";
      style.textContent = `
        .header-tools {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          min-width: 0;
          flex-wrap: wrap;
        }
        .header-toggle {
          appearance: none;
          border: 1px solid rgba(132, 171, 211, 0.42);
          border-radius: 999px;
          padding: 11px 16px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(239, 247, 255, 0.94) 100%);
          color: #0e3f71;
          font: 700 14px "Segoe UI", Arial, sans-serif;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 10px 24px rgba(40, 89, 142, 0.12);
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
        }
        .header-toggle:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(40, 89, 142, 0.16);
        }
        .header-toggle.is-off {
          color: #6e88a3;
          background: rgba(255, 255, 255, 0.72);
          border-color: rgba(132, 171, 211, 0.28);
          box-shadow: none;
        }
        html.theme-dark .header-toggle {
          border-color: rgba(125, 163, 182, 0.45);
          background: rgba(12, 24, 34, 0.84);
          color: #e8f6ff;
          box-shadow: none;
        }
        html.theme-dark .header-toggle.is-off {
          color: #9db9c8;
          opacity: 0.85;
        }
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) {
          --bg: #eef5ff;
          --panel: rgba(255, 255, 255, 0.88);
          --panel-soft: rgba(248, 251, 255, 0.94);
          --card: rgba(248, 251, 255, 0.96);
          --line: #d4e3f4;
          --text: #244765;
          --subtle: #6f88a3;
          --accent: #2d86e6;
          --accent-soft: rgba(45, 134, 230, 0.14);
          --green: #2bbd68;
          --yellow: #e4b428;
          --red: #e45a58;
          --purple: #8f6ce4;
          --orange: #ea9440;
          --cyan: #24b9d4;
          --white: #244765;
          --button-bg: #f5f9ff;
          --button-border: #cfe0f5;
          --button-text: #244765;
          --code-bg: #f4f8fd;
          --code-text: #355775;
          --stage-bg: linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%);
          --canvas-wrap-bg: rgba(244, 248, 253, 0.96);
          --shadow: 0 18px 42px rgba(48, 92, 145, 0.12);
        }
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) body {
          background:
            radial-gradient(circle at top left, rgba(120, 180, 255, 0.18) 0%, transparent 28%),
            linear-gradient(180deg, #f8fbff 0%, var(--bg) 58%, #e8f1ff 100%);
          color: var(--text);
        }
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .header,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .panel,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .card,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .controls-card,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .visual-card,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .timeline-card,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .code-card,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .visual-stage,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .canvas-wrap,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .circuit-board,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .circuit-area,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .lane,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .truth-card,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .mini-io-card,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .combo-card,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .counter-box,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .sensor-box,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .push-button,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .function-box,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .serial-box,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .code-box,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .state-chip,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .compare-box {
          box-shadow: var(--shadow);
        }
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) input[type="text"],
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) input[type="search"],
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) input[type="number"],
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) select,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) textarea,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .copy-btn,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .action-btn,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) button:not(.status-toggle-btn):not([data-lights-toggle]):not([data-sound-toggle]),
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .back,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .back-button {
          background: var(--button-bg);
          color: var(--text);
          border-color: var(--line);
        }
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .visual-stage,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .circuit-board,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .circuit-area {
          background: var(--stage-bg);
        }
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .logic-box,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .summary-box,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .interpret-box,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .helper-card,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .formula-box,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .memory-byte,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .segment-card,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .byte-cell,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .bit-chip,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .mini-box,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .legend-chip,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .memory-note-box,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .variable-row,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .debounce-rig,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .debounce-meter,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .button-plate,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .char-card,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .char-glyph,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .line-card,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .bit-card,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .bit-value,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .mini-btn,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .diagram-card {
          background: rgba(255, 255, 255, 0.72);
          border-color: var(--line);
          color: var(--text);
        }
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .char-glyph {
          background: radial-gradient(circle at top, rgba(45, 134, 230, 0.16) 0%, rgba(255, 255, 255, 0.92) 76%);
        }
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .logic-box span,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .summary-box span,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .interpret-box span,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .helper-card span,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .memory-byte span,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .memory-byte .hex,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .formula-box strong,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .segment-card,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .byte-cell.used,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .bit-chip.one,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .mini-box span,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .mcu-pin strong,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .adc-node-pill,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .combo-card strong,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .loop-led-item strong,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .state-chip span,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .truth-table tr.active-row td,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .status-pill span,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .state-diagram-svg .diagram-node.active text {
          color: var(--text);
          fill: var(--text);
        }
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .segment-card small {
          color: var(--subtle);
        }
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .mini-btn {
          color: var(--text);
        }
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .state-diagram-svg .diagram-node circle {
          fill: rgba(255, 255, 255, 0.78);
        }
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .state-diagram-svg .diagram-node .outer-ring {
          stroke: rgba(111, 136, 163, 0.24);
        }
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .switch-contact,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .switch-contact::after,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .cross-v span,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .cross-h span,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .dot.white {
          background: #ffffff;
        }
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) pre.code-block,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .lane code,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) pre,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) code {
          background: var(--code-bg);
          color: var(--code-text);
        }
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .code-line.active {
          color: #163b63;
        }
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) canvas.timeline-canvas,
        html[data-sync-dashboard-lights="true"]:not(.theme-dark) .timeline-canvas {
          background: var(--canvas-wrap-bg);
        }
      `;
      document.head.appendChild(style);
    }

    installHeaderToggles() {
      if (!this.showsLightsToggle) return;

      document.querySelectorAll(".brand-logo").forEach((logo, index) => {
        if (logo.parentElement && logo.parentElement.classList.contains("header-tools")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "header-tools";

        const lightsButton = document.createElement("button");
        lightsButton.type = "button";
        lightsButton.className = "header-toggle lights-toggle";
        lightsButton.dataset.lightsToggle = "true";
        lightsButton.dataset.lightsToggleId = String(index);
        lightsButton.addEventListener("click", event => {
          event.preventDefault();
          this.toggleLights();
        });

        const button = document.createElement("button");
        button.type = "button";
        button.className = "header-toggle sound-toggle";
        button.dataset.soundToggle = "true";
        button.dataset.soundToggleId = String(index);
        button.addEventListener("click", event => {
          event.preventDefault();
          this.toggleMuted();
        });

        logo.parentNode.insertBefore(wrapper, logo);
        wrapper.appendChild(lightsButton);
        wrapper.appendChild(button);
        wrapper.appendChild(logo);
      });
    }

    installGlobalListeners() {
      document.addEventListener("click", event => {
        const target = event.target.closest("button, .launch-button, .back, .back-button, a[href]");
        if (!target) return;
        if (target.matches("[data-sound-toggle], [data-lights-toggle]")) {
          this.play("toggle");
          return;
        }
        if (target.matches(".launch-button, .back, .back-button, a[href]")) this.play("navigate");
        else this.play("click");
      }, true);

      document.addEventListener("change", event => {
        if (event.target.matches("select, input[type='range'], input[type='checkbox']")) this.play("tick");
      }, true);

      window.addEventListener("keydown", event => {
        const tag = document.activeElement?.tagName || "";
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || event.repeat) return;
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Enter"].includes(event.key)) this.play("tick");
      });
    }

    syncToggleLabels() {
      if (this.showsLightsToggle) {
        document.querySelectorAll("[data-lights-toggle]").forEach(button => {
          button.textContent = this.lightsOn ? "Lights ON" : "Lights OFF";
          button.classList.toggle("is-off", !this.lightsOn);
          button.setAttribute("aria-pressed", String(this.lightsOn));
        });
      }
      document.querySelectorAll("[data-sound-toggle]").forEach(button => {
        button.textContent = this.muted ? "Sound OFF" : "Sound ON";
        button.classList.toggle("is-off", this.muted);
        button.setAttribute("aria-pressed", String(!this.muted));
      });
    }

    getLogoVariantSource(source, variant) {
      const fileName = variant === "light"
        ? "logo-hanze-oranje-zwart-rgb.png"
        : "logo-hanze-oranje-wit-rgb.png";
      return source.replace(/(?:hanze_logo|logo-hanze-oranje-(?:zwart|wit)-rgb)\.png$/i, fileName);
    }

    syncBrandLogos() {
      const isDarkTheme = document.documentElement.classList.contains("theme-dark");
      document.querySelectorAll(".brand-logo").forEach(logo => {
        if (!logo.dataset.logoLightSrc || !logo.dataset.logoDarkSrc) {
          const currentSource = logo.getAttribute("src") || logo.src;
          logo.dataset.logoLightSrc = this.getLogoVariantSource(currentSource, "light");
          logo.dataset.logoDarkSrc = this.getLogoVariantSource(currentSource, "dark");
        }
        logo.setAttribute("src", isDarkTheme ? logo.dataset.logoDarkSrc : logo.dataset.logoLightSrc);
      });
    }

    applyTheme() {
      if (this.syncsLightsTheme) {
        document.documentElement.classList.toggle("theme-dark", !this.lightsOn);
      }
      this.syncBrandLogos();
    }

    toggleLights() {
      if (!this.showsLightsToggle) return;
      this.lightsOn = !this.lightsOn;
      try {
        localStorage.setItem(LIGHTS_STORAGE_KEY, String(this.lightsOn));
      } catch (error) {
        // Ignore storage failures in restricted browser modes.
      }
      this.applyTheme();
      this.syncToggleLabels();
    }

    toggleMuted() {
      this.muted = !this.muted;
      try {
        localStorage.setItem(STORAGE_KEY, String(this.muted));
      } catch (error) {
        // Ignore storage failures in restricted browser modes.
      }
      this.syncToggleLabels();
    }

    installAudioUnlock() {
      const unlock = () => {
        this.ensureAudio();
      };
      window.addEventListener("pointerdown", unlock, { passive: true });
      window.addEventListener("touchstart", unlock, { passive: true });
      window.addEventListener("keydown", unlock, { passive: true });
    }

    ensureAudio() {
      if (!this.audioContext) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return false;
        try {
          this.audioContext = new Ctx();
        } catch (error) {
          return false;
        }
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.26;
        this.masterGain.connect(this.audioContext.destination);
      }
      if (this.audioContext.state === "suspended" && !this.pendingResume) {
        this.pendingResume = this.audioContext.resume().catch(() => {}).finally(() => {
          this.pendingResume = null;
        });
      }
      return true;
    }

    beep(frequency, duration, type = "sine", gain = 1) {
      if (this.muted) return;
      if (!this.ensureAudio()) return;
      if (this.audioContext.state !== "running") {
        if (this.pendingResume) {
          this.pendingResume.then(() => this.beep(frequency, duration, type, gain));
        }
        return;
      }

      const now = this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      const amp = this.audioContext.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, now);
      amp.gain.setValueAtTime(0.0001, now);
      amp.gain.exponentialRampToValueAtTime(0.18 * gain, now + 0.01);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(amp);
      amp.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    }

    play(kind = "click") {
      if (this.muted) return;
      const now = performance.now();
      if (now - this.lastPlayAt < 45) return;
      this.lastPlayAt = now;

      if (kind === "toggle") {
        this.beep(620, 0.05, "square", 0.9);
        this.beep(820, 0.07, "triangle", 0.7);
      } else if (kind === "navigate") {
        this.beep(500, 0.05, "triangle", 0.8);
        this.beep(760, 0.08, "triangle", 0.7);
      } else if (kind === "tick") {
        this.beep(720, 0.04, "square", 0.5);
      } else if (kind === "success") {
        this.beep(560, 0.05, "triangle", 0.7);
        this.beep(780, 0.09, "triangle", 0.85);
      } else if (kind === "warning") {
        this.beep(420, 0.08, "sawtooth", 0.7);
      } else if (kind === "error") {
        this.beep(320, 0.1, "sawtooth", 0.8);
      } else {
        this.beep(640, 0.05, "triangle", 0.6);
      }
    }
  }

  window.uiSound = new UiSoundManager();
  window.addEventListener("DOMContentLoaded", () => {
    window.uiSound.applyTheme();
    window.uiSound.init();
  });
})();
