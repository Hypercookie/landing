# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build

There are no npm scripts defined. Use the CLI directly:

```bash
# Compile Tailwind CSS (run after editing styles.css or changing Tailwind config)
npx @tailwindcss/cli -i ./src/styles.css -o ./src/output.css

# Watch mode during development
npx @tailwindcss/cli -i ./src/styles.css -o ./src/output.css --watch

# Format with Prettier (sorts Tailwind classes automatically)
npx prettier --write src/index.html
```

The compiled `src/output.css` is committed to the repository.

## Architecture

This is a single-page static portfolio site with no framework or bundler.

- **`src/index.html`** — the entire page; header + hero section + experience timeline + footer
- **`src/impressum.html`**, **`src/datenschutz.html`** — legal pages (German), styled with `prose`
- **`src/styles.css`** — Tailwind v4 source: self-hosted fonts, Faustinus `@theme` tokens, a few hand-written rules
- **`src/output.css`** — compiled output, committed and served directly
- **`src/script.js`** — footer year + console easter egg
- **`src/favicon.{ico,svg}`, `src/apple-touch-icon.png`, `src/img/brand/`** — Faustinus brand assets, copied from the brand kit (served locally, not from brand.faustinus.eu, so the page loads nothing from third parties as the Datenschutzerklärung promises)

## Deployment

Pushing to `master` triggers `.github/workflows/docker-publish.yml`, which:
1. Runs `npm install` and builds `output.css`
2. Builds a Docker image using `lipanski/docker-static-website` (serves `src/` as static files)
3. Tests HTTP 200 on port 3000
4. Pushes to `ghcr.io` and signs with cosign

## Tailwind Setup

- **Version**: Tailwind v4, configured entirely in `src/styles.css` (`@theme`, `@plugin`); there is no `tailwind.config.js`
- **Brand (Faustinus)**: colors `ink` #0B0D12, `slate` #1B1F2A, `steel` #6B7280, `bone` #EDE8DF, single accent `ember` #FF5A1F, status-only `ok` #3DDC97 / `warning` #FFB020. Rules: one accent, no gradients, no shadows, pills instead of sharp corners, circles only for status, `rounded-slab` (30%) for slab shapes, never recolor the mark's dot
- **Fonts**: Inter (`font-sans`, body) and JetBrains Mono (`font-mono`, numbers/labels), self-hosted woff2 in `src/fonts/`. If fonts change, update the font names in `datenschutz.html` section 2
- **Dark mode**: `media` strategy (Ink background in dark, Bone in light)
- **Plugins**: `@tailwindcss/typography`
- **Prettier**: `prettier-plugin-tailwindcss` auto-sorts classes using `src/styles.css`
