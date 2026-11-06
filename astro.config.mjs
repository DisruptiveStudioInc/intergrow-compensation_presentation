import { defineConfig } from 'astro/config';
export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  i18n: { locales: ['es', 'en', 'fr'], defaultLocale: 'es', routing: { prefixDefaultLocale: false } },
  vite: { build: { sourcemap: false } },
});
