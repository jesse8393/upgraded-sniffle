// Mobile menu, header state, the sticky mobile call to action, and the estimate form.
// Contact details are rendered at build time from src/lib/site.js.

// ── Header + mobile menu ────────────────────
const header = document.querySelector("[data-header]");
const menuBtn = document.querySelector("[data-menu]");
const nav = document.getElementById("site-nav");

const setMenu = (open) => {
  menuBtn.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
};
menuBtn.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

// The header rule and the mobile CTA react to what is on screen, not to scroll events.
const mobileCta = document.querySelector("[data-mobile-cta]");
const firstBlock = document.querySelector("main > :first-child");
const estimate = document.getElementById("estimate");
const seen = { top: true, first: true, estimate: false };
const sync = () => {
  header.classList.toggle("is-scrolled", !seen.top);
  mobileCta.classList.toggle("is-shown", !seen.first && !seen.estimate && Boolean(estimate));
};
const watch = (el, key, opts) => {
  if (!el) return;
  new IntersectionObserver(([entry]) => { seen[key] = entry.isIntersecting; sync(); }, opts).observe(el);
};
watch(document.querySelector("[data-sentinel]"), "top");
watch(firstBlock, "first");
watch(estimate, "estimate", { threshold: 0.05 });

// ── Estimate form ───────────────────────────
const form = document.querySelector("[data-planner]");
if (form) {
  const status = form.querySelector("[data-status]");
  const endpoint = form.dataset.endpoint || "";
  const email = form.dataset.email || "";

  // Links marked with a project type preselect it in the form.
  document.querySelectorAll("[data-project]").forEach((link) => {
    link.addEventListener("click", () => {
      const want = link.dataset.project === "deck" ? "Deck" : "Fence";
      const radio = form.querySelector(`input[name="project"][value="${want}"]`);
      if (radio) radio.checked = true;
    });
  });

  const setStatus = (msg, kind) => {
    status.textContent = msg;
    status.className = `form-status${kind ? ` is-${kind}` : ""}`;
  };

  const projectField = form.querySelector("[data-project-field]");
  const markField = (input, ok) => {
    input.setAttribute("aria-invalid", String(!ok));
    input.closest(".field").classList.toggle("is-invalid", !ok);
  };

  const validate = () => {
    let firstBad = null;
    const hasProject = Boolean(form.querySelector('input[name="project"]:checked'));
    projectField.classList.toggle("is-invalid", !hasProject);
    projectField.querySelector(".chips").classList.toggle("is-invalid", !hasProject);
    if (!hasProject) firstBad = projectField.querySelector("input");

    form.querySelectorAll("input[required]:not([type=radio])").forEach((input) => {
      const ok = input.checkValidity() && input.value.trim() !== "";
      markField(input, ok);
      if (!ok && !firstBad) firstBad = input;
    });
    return firstBad;
  };

  form.addEventListener("change", (e) => {
    if (e.target.name === "project") {
      projectField.classList.remove("is-invalid");
      projectField.querySelector(".chips").classList.remove("is-invalid");
    }
  });
  form.addEventListener("input", (e) => {
    if (e.target.getAttribute("aria-invalid") === "true" && e.target.checkValidity()) markField(e.target, true);
  });
  form.addEventListener("focusout", (e) => {
    const input = e.target;
    if (input.matches("input[required]:not([type=radio])") && input.value.trim() !== "") markField(input, input.checkValidity());
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const bad = validate();
    if (bad) {
      setStatus("A few details need a second look.", "error");
      bad.focus();
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    if (data.company) return; // a bot filled the hidden field
    delete data.company;
    // Unchecked boxes are left out of FormData, so send both text consents as true or false.
    for (const name of ["sms_transactional_consent", "sms_marketing_consent"]) data[name] = form.elements[name]?.checked === true;

    const sendByEmail = () => {
      const body = Object.entries(data)
        .map(([k, v]) => [k, typeof v === "boolean" ? (v ? "yes" : "no") : v])
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(`Estimate request: ${data.project}`)}&body=${encodeURIComponent(body)}`;
      setStatus("Your email app should open with the details filled in.", "ok");
    };

    const button = form.querySelector("[data-submit]");

    if (endpoint) {
      button.setAttribute("aria-busy", "true");
      setStatus("Sending your request…");
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (res.status === 503) {
          if (email) sendByEmail();
          else setStatus("Online requests are not connected yet. Please check back soon.", "error");
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        setStatus("Thank you. We got your request and will be in touch soon.", "ok");
      } catch {
        setStatus("Something went wrong sending that. Please try again in a moment.", "error");
      } finally {
        button.removeAttribute("aria-busy");
      }
      return;
    }

    if (email) {
      sendByEmail();
      return;
    }

    setStatus("Online requests are not connected yet. Please check back soon.", "error");
    console.warn("Estimate form has no destination. Set SITE.formEndpoint or SITE.email in src/lib/site.js.");
  });
}
