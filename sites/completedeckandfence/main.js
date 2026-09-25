// Business details. Leave a value empty and anything that uses it stays hidden.
const SITE = {
  phone: "",          // e.g. "(615) 555 0100"
  email: "",          // e.g. "hello@completedeckandfence.com"
  // Where the estimate form sends leads. Any endpoint that accepts a JSON POST
  // works (Formspree, a Supabase edge function, etc). If empty, the form opens
  // an email to SITE.email instead.
  formEndpoint: "",
};

document.documentElement.classList.add("js");

// ── Contact details ─────────────────────────
const digits = SITE.phone.replace(/\D/g, "");
document.querySelectorAll("[data-phone]").forEach((el) => {
  if (!digits) return;
  el.textContent = SITE.phone;
  el.href = `tel:+1${digits.slice(-10)}`;
  el.hidden = false;
});
document.querySelectorAll("[data-email]").forEach((el) => {
  if (!SITE.email) return;
  el.textContent = SITE.email;
  el.href = `mailto:${SITE.email}`;
  el.hidden = false;
});
if (digits) document.querySelectorAll("[data-contact]").forEach((el) => (el.hidden = false));
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

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

const mobileCta = document.querySelector("[data-mobile-cta]");
const estimate = document.getElementById("estimate");
let estimateVisible = false;
const onScroll = () => {
  const y = window.scrollY;
  header.classList.toggle("is-scrolled", y > 8);
  mobileCta.classList.toggle("is-shown", y > 520 && !estimateVisible);
};
new IntersectionObserver(([entry]) => { estimateVisible = entry.isIntersecting; onScroll(); }, { threshold: 0.05 })
  .observe(estimate);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ── Scroll reveals ──────────────────────────
const revealTargets = [
  ".section-head", ".service", ".band-title", ".band-side",
  ".step", ".area-media", ".area-copy", ".estimate-intro", ".planner",
];
const inview = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-in");
    inview.unobserve(entry.target);
  });
}, { rootMargin: "0px 0px -8% 0px" });

revealTargets.forEach((sel) => {
  document.querySelectorAll(sel).forEach((el, i) => {
    el.setAttribute("data-inview", "");
    el.style.setProperty("--d", `${Math.min(i, 3) * 90}ms`);
    inview.observe(el);
  });
});

// ── Estimate planner ────────────────────────
const form = document.querySelector("[data-planner]");
const status = form.querySelector("[data-status]");

// Links that say "deck" or "fence" preselect the project type.
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

const validate = () => {
  let firstBad = null;
  const project = form.querySelector('input[name="project"]:checked');
  const chips = form.querySelector('input[name="project"]').closest(".chips");
  chips.classList.toggle("is-invalid", !project);
  if (!project) firstBad = chips.querySelector("input");

  form.querySelectorAll("input[required]:not([type=radio])").forEach((input) => {
    const ok = input.checkValidity() && input.value.trim() !== "";
    input.setAttribute("aria-invalid", String(!ok));
    if (!ok && !firstBad) firstBad = input;
  });
  return firstBad;
};

form.addEventListener("change", (e) => {
  if (e.target.name === "project") e.target.closest(".chips").classList.remove("is-invalid");
});
form.addEventListener("input", (e) => {
  if (e.target.getAttribute("aria-invalid") === "true" && e.target.checkValidity()) {
    e.target.setAttribute("aria-invalid", "false");
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const bad = validate();
  if (bad) {
    setStatus("Please fill in the highlighted fields.", "error");
    bad.focus();
    return;
  }
  const data = Object.fromEntries(new FormData(form));
  if (data.company) return; // bot filled the hidden field
  delete data.company;
  delete data["form-name"];

  const button = form.querySelector("button[type=submit]");

  if (SITE.formEndpoint) {
    button.disabled = true;
    setStatus("Sending…");
    try {
      const res = await fetch(SITE.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      setStatus("Thank you. We got your request and will be in touch soon.", "ok");
    } catch {
      setStatus("Something went wrong sending that. Please try again in a moment.", "error");
    } finally {
      button.disabled = false;
    }
    return;
  }

  if (SITE.email) {
    const body = Object.entries(data).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");
    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(`Estimate request: ${data.project}`)}&body=${encodeURIComponent(body)}`;
    setStatus("Your email app should open with the details filled in.", "ok");
    return;
  }

  setStatus("Online requests are not connected yet. Please check back soon.", "error");
  console.warn("Estimate form has no destination. Set SITE.formEndpoint or SITE.email in main.js.");
});
