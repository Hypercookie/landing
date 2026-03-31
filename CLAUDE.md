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

- **`src/index.html`** — the entire page; hero section + experience section + footer
- **`src/styles.css`** — minimal Tailwind v4 source (`@import "tailwindcss"` + patterns plugin)
- **`src/output.css`** — compiled output (568KB), committed and served directly
- **`src/script.js`** — animated blob using Simplex noise + spline curves, loaded from CDN imports

The blob animation in `script.js` adapts colors to dark/light mode and speed to mouse movement. CDN dependencies (`@georgedoescode/spline`, `simplex-noise`) are imported via ES module URLs, not npm.

## Deployment

Pushing to `master` triggers `.github/workflows/docker-publish.yml`, which:
1. Runs `npm install` and builds `output.css`
2. Builds a Docker image using `lipanski/docker-static-website` (serves `src/` as static files)
3. Tests HTTP 200 on port 3000
4. Pushes to `ghcr.io` and signs with cosign

## Tailwind Setup

- **Version**: Tailwind v4 (config in `tailwind.config.js`, imported via `@plugin` in CSS)
- **Custom theme**: `knime-yellow` brand color, `grayscale` and `blue_scale` palettes, Space Grotesk font
- **Dark mode**: `media` strategy (respects system preference)
- **Plugins**: `@tailwindcss/typography`, `tailwind-heropatterns` (topography pattern in hero), `@rozsazoltan/tailwindcss-patterns`
- **Prettier**: `prettier-plugin-tailwindcss` auto-sorts classes using `tailwind.config.js`