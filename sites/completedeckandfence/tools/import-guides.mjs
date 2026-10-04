// Turns an owner supplied markdown file of guides (see docs/new-guides-oct-2026.md)
// into src/content/guides/{slug}.json plus entries in src/data/guides.json.
// The text is kept word for word; only the structure is converted.
//   node tools/import-guides.mjs docs/new-guides-oct-2026.md 2026-10-04
import { readFileSync, writeFileSync } from "node:fs";

const [file, published] = process.argv.slice(2);
if (!file || !published) throw new Error("usage: node tools/import-guides.mjs <file.md> <YYYY-MM-DD>");
const src = readFileSync(file, "utf8");
const guidesPath = new URL("../src/data/guides.json", import.meta.url);
const guides = JSON.parse(readFileSync(guidesPath, "utf8"));

const serviceFor = (eyebrow) => (/^fence/i.test(eyebrow) ? "fence" : /^deck/i.test(eyebrow) ? "deck" : "both");

for (const part of src.split(/\n## FILE: [\w-]+\.md\n/).slice(1)) {
  const [, fm, rawBody] = part.match(/\s*---\n([\s\S]*?)\n---\n([\s\S]*)/);
  const meta = Object.fromEntries(fm.trim().split("\n").map((l) => { const i = l.indexOf(": "); return [l.slice(0, i), l.slice(i + 2)]; }));
  const slug = meta.slug.replace(/^\/guides\/|\/$/g, "");
  const lines = rawBody.replace(/\n-{3,}\s*$/, "").trim().split("\n");

  // Group lines into blocks separated by blank lines, tracking ## and ### headings.
  const sections = [];
  let current = null;
  let dek = "";
  let faqs = [];
  let keepReading = [];
  let closing = "";
  let mode = "intro";
  let buf = [];
  const flush = () => {
    if (!buf.length) return;
    const text = buf.join("\n");
    buf = [];
    if (mode === "intro") { if (!text.startsWith("# ")) dek = dek ? `${dek} ${text}` : text; return; }
    if (mode === "faq") { faqs.at(-1).a = faqs.at(-1).a ? `${faqs.at(-1).a} ${text}` : text; return; }
    if (mode === "keep") {
      for (const l of text.split("\n")) {
        const m = l.match(/^\* \[([^\]]+)\]\(([^)]+)\)/);
        if (m) keepReading.push({ title: m[1], href: m[2] });
        else closing = closing ? `${closing} ${l}` : l;
      }
      return;
    }
    const rows = text.split("\n");
    if (rows.every((r) => r.startsWith("* "))) current.blocks.push({ type: "ul", items: rows.map((r) => r.slice(2)) });
    else if (rows.every((r) => /^\d+\. /.test(r))) current.blocks.push({ type: "ol", items: rows.map((r) => r.replace(/^\d+\. /, "")) });
    else if (rows.every((r) => r.startsWith("|"))) {
      const cells = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      current.blocks.push({ type: "table", head: cells(rows[0]), rows: rows.slice(2).map(cells) });
    } else current.blocks.push({ type: "p", text: rows.join(" ") });
  };
  for (const line of lines) {
    if (!line.trim()) { flush(); continue; }
    let m;
    if ((m = line.match(/^## (.+)/))) {
      flush();
      if (m[1] === "Quick answers") mode = "faq";
      else if (m[1] === "Keep reading") mode = "keep";
      else { mode = "body"; current = { heading: m[1], blocks: [] }; sections.push(current); }
      continue;
    }
    if ((m = line.match(/^### (.+)/))) {
      flush();
      if (mode === "faq") faqs.push({ q: m[1], a: "" });
      else current.blocks.push({ type: "h3", text: m[1] });
      continue;
    }
    buf.push(line);
  }
  flush();

  const content = { slug, description: meta.meta_description, dek, sections, faqs, keepReading, closing };
  writeFileSync(new URL(`../src/content/guides/${slug}.json`, import.meta.url), JSON.stringify(content, null, 2) + "\n");

  const entry = {
    slug, service: serviceFor(meta.eyebrow), keyword: meta.primary_keyword, title: meta.title,
    eyebrow: meta.eyebrow, verbatim: true, published,
    angle: "Owner supplied article, published word for word. Edit the source markdown and re import instead of rewriting.",
  };
  const i = guides.findIndex((g) => g.slug === slug);
  if (i >= 0) guides[i] = entry; else guides.push(entry);
  console.log(`${slug}: ${sections.length} sections, ${faqs.length} quick answers, ${keepReading.length} keep reading links`);
}
// One guide per line, matching the hand written style of the file.
writeFileSync(guidesPath, "[\n" + guides.map((g) => `  ${JSON.stringify(g)}`).join(",\n") + "\n]\n");
