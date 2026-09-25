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

// Header shadow and the mobile CTA react to what is on screen, not to scroll events.
const mobileCta = document.querySelector("[data-mobile-cta]");
const seen = { top: true, hero: true, estimate: false };
const sync = () => {
  header.classList.toggle("is-scrolled", !seen.top);
  mobileCta.classList.toggle("is-shown", !seen.hero && !seen.estimate);
};
const watch = (el, key, opts) =>
  new IntersectionObserver(([entry]) => { seen[key] = entry.isIntersecting; sync(); }, opts).observe(el);
watch(document.querySelector("[data-sentinel]"), "top");
watch(document.querySelector(".hero"), "hero");
watch(document.getElementById("estimate"), "estimate", { threshold: 0.05 });

// ── Magnetic buttons (mouse only) ───────────
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (finePointer && !calm) {
  document.querySelectorAll(".magnetic").forEach((btn) => {
    let frame = 0;
    btn.addEventListener("pointermove", (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty("--mx", `${((e.clientX - r.left) / r.width - 0.5) * 12}px`);
        btn.style.setProperty("--my", `${((e.clientY - r.top) / r.height - 0.5) * 10}px`);
      });
    });
    btn.addEventListener("pointerleave", () => {
      cancelAnimationFrame(frame);
      btn.style.setProperty("--mx", "0px");
      btn.style.setProperty("--my", "0px");
    });
  });
}

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

const projectField = form.querySelector("[data-project-field]");

const markField = (input, ok) => {
  input.setAttribute("aria-invalid", String(!ok));
  input.closest(".field").classList.toggle("is-invalid", !ok);
};

const validate = () => {
  let firstBad = null;
  const hasProject = !!form.querySelector('input[name="project"]:checked');
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
  if (data.company) return; // bot filled the hidden field
  delete data.company;
  delete data["form-name"];

  const button = form.querySelector("[data-submit]");

  if (SITE.formEndpoint) {
    button.setAttribute("aria-busy", "true");
    setStatus("Sending your request…");
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
      button.removeAttribute("aria-busy");
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
