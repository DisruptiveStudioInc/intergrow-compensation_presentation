import { defineConfig } from 'astro/config';

const presentationSiteUrl = process.env.PRESENTATION_SITE_URL?.trim();

export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  ...(presentationSiteUrl ? { site: presentationSiteUrl } : {}),
  i18n: { locales: ['es', 'en', 'fr'], defaultLocale: 'es', routing: { prefixDefaultLocale: false } },
  vite: { build: { sourcemap: false } },
});
