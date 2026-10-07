import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://completedeckandfence.com",
  trailingSlash: "always",
  build: { format: "directory", inlineStylesheets: "always" },
  compressHTML: true,
  integrations: [sitemap({ filter: (page) => !page.endsWith("/404/") && !page.endsWith("/thank-you/") })],
});
