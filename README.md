# Jan Konop Big Band — Website

**Live:** [bigband.konop.pl](https://bigband.konop.pl)

A single-page promotional site for **Jan Konop Big Band**, a jazz/big-band orchestra founded in 2009 in Gdańsk, Poland. Built and maintained by [Karol Konop](https://www.karol.konop.pl).

## What it does

The site is a scrolling, section-based "digital business card" for the band, served from a single `public/index.html`:

- **Bio** — the band's history and lineup background.
- **Roster** — band members grouped by section (trumpets, trombones, saxophones, rhythm section, vocalists), each with a photo card; members without a photo fall back to a generated initials avatar.
- **Repertoire** — a video carousel of live performance clips with poster frames and a custom play/pause control layer.
- **Jan Konop** — biography of the band's founder and conductor.
- **For organisers** — downloadable technical rider (PDF) and press kit (ZIP) for event bookers.
- **Awards** — festival awards and recognitions.
- **Contact** — direct email/phone links and the band's Facebook page.
- **Bilingual UI** (Polish/English) — content is swapped client-side from `public/translations.json` via `data-ts` attributes on translatable elements, toggled by a flag icon in the nav bar.

## Tech stack

- **Backend**: [Express 5](https://expressjs.com/) (`jkbb-website-express-app.js`) — a minimal static file server that serves everything under `public/` on port 3001. There's no database, API, or server-rendered templating; the app's only job is to host the static bundle.
- **Frontend**: plain HTML/CSS/vanilla JS — no frontend framework or bundler. All interactivity (section navigation, keyboard scrolling, video carousel controls, language toggle, responsive card-title auto-sizing) is hand-written in a single inline `<script>` block in `index.html`.
- **Styling**: [Bootstrap 5.3.8](https://getbootstrap.com/) — the Sass source is pulled in via the npm package and customized through variable overrides in `src/main.scss` (brand colors, typography, disabled rounding/dark-mode), then compiled to the checked-in `public/main.css` (with source map). Bootstrap's JS bundle itself is loaded from a CDN with a Subresource Integrity hash rather than bundled, keeping the deployed payload small.
- **Fonts**: Google Fonts (Montserrat), loaded with `preconnect` hints.
- **Assets**: images are shipped in dual formats (WebP with JPEG fallback) for section backgrounds, lazy-loaded (`loading="lazy"`) roster photos, and video poster frames to keep the carousel from triggering premature video downloads.

## Notable implementation details

- **Accessibility**: keyboard up/down-arrow navigation between sections is scoped to only fire when nothing is focused, so it never hijacks arrow-key behavior inside links, buttons, or the video player; headings, ARIA labels, and `visually-hidden` text are used throughout for screen readers.
- **i18n without a framework**: translation strings live in a flat JSON file keyed by element id, and the DOM is re-rendered in place on toggle rather than reloading — a lightweight approach appropriate for a page this size.
- **No contact form / no backend state**: contact is handled via plain `mailto:`/`tel:` links, deliberately avoiding the complexity (and spam/security surface) of a server-side form handler for a low-traffic promotional site.
- **Large media kept out of the deploy path**: performance video clips live under `public/video/`, which is intentionally excluded via `.gitignore` (too large to version-control sensibly) and is expected to be present on the deployment target independently of the git repo.

## Project structure

```
jkbb-website-express-app.js   Express static file server (entry point)
package.json                  npm metadata, "start" script
public/
  index.html                   the entire site (single page)
  main.css / main.css.map      compiled Bootstrap + custom styles
  translations.json            PL/EN copy for data-ts elements
  img/, roster/, posters/, sm/ images and icons
  files/                       rider PDF, press kit ZIP for download
  video/                       performance clips (gitignored, not shipped in the repo)
src/
  main.scss                    Sass source (Bootstrap overrides + custom styles)
```

## Running locally

```bash
npm install
npm start
```

This starts the Express server on `http://localhost:3001`. There are no environment variables required — the app has no external services, database, or secrets to configure.

If you change `src/main.scss`, recompile it to `public/main.css` with any Sass compiler (e.g. `npx sass src/main.scss public/main.css`); there is currently no dedicated build script wired into `package.json` for this step.

## Deployment

No deployment configuration (nginx, PM2, Docker, CI) is checked into this repository — the app is a plain Node/Express process (`npm start`) intended to run behind whatever reverse proxy/process manager the host environment provides.
