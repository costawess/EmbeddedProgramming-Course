(function () {
  const currentPath = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  const siteContact = window.SITE_CONTACT ?? {};

  document.querySelectorAll(".site-nav a").forEach(link => {
    const href = link.getAttribute("href");
    if (!href) return;
    const target = href.replace("./", "").toLowerCase();
    if (target === currentPath) link.classList.add("is-active");
  });

  document.querySelectorAll("[data-current-year]").forEach(node => {
    node.textContent = String(new Date().getFullYear());
  });

  document.querySelectorAll("[data-contact-name]").forEach(node => {
    node.textContent = siteContact.name || "Your Name";
  });

  document.querySelectorAll("[data-contact-email]").forEach(node => {
    node.textContent = siteContact.email || "your.email@example.com";
  });

  document.querySelectorAll("[data-contact-email-link]").forEach(node => {
    const email = siteContact.email || "your.email@example.com";
    node.textContent = email;
    node.setAttribute("href", `mailto:${email}`);
  });

  document.querySelectorAll("[data-last-edition]").forEach(node => {
    node.textContent = siteContact.lastEdition || "April 13, 2026";
  });
})();
