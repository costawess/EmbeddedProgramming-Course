(function () {
  if (window.__epMouseGlowInit) return;
  window.__epMouseGlowInit = true;

  if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return;

  const style = document.createElement("style");
  style.textContent = `
    body.ep-mouse-glow-host {
      position: relative;
      isolation: isolate;
    }

    body.ep-mouse-glow-host > *:not(.ep-mouse-glow) {
      position: relative;
      z-index: 1;
    }

    .ep-mouse-glow {
      position: fixed;
      left: 0;
      top: 0;
      width: 240px;
      height: 240px;
      border-radius: 50%;
      pointer-events: none;
      background:
        radial-gradient(circle,
          rgba(77, 184, 255, 0.14) 0%,
          rgba(77, 184, 255, 0.08) 34%,
          rgba(34, 190, 220, 0.04) 56%,
          rgba(34, 190, 220, 0) 74%);
      filter: blur(14px);
      opacity: 0;
      transform: translate(-50%, -50%);
      transition: opacity 0.18s ease;
      z-index: 0;
    }
  `;
  document.head.appendChild(style);

  const glow = document.createElement("div");
  glow.className = "ep-mouse-glow";

  const mount = () => {
    if (!document.body || glow.isConnected) return;
    document.body.classList.add("ep-mouse-glow-host");
    document.body.appendChild(glow);
  };

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount, { once: true });

  let pointerX = 0;
  let pointerY = 0;
  let rafId = 0;

  function render() {
    rafId = 0;
    glow.style.left = `${pointerX}px`;
    glow.style.top = `${pointerY}px`;
  }

  function scheduleRender() {
    if (rafId) return;
    rafId = requestAnimationFrame(render);
  }

  window.addEventListener("pointermove", event => {
    mount();
    pointerX = event.clientX;
    pointerY = event.clientY;
    glow.style.opacity = "1";
    scheduleRender();
  }, { passive: true });

  document.addEventListener("mouseleave", () => {
    glow.style.opacity = "0";
  });

  window.addEventListener("blur", () => {
    glow.style.opacity = "0";
  });
})();
