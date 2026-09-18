# Glow Artisans

A static marketing website with shared templates and an isolated deployment
build. No client-side framework or runtime CSS compiler is required.

## Quick start

Use Node.js 22 and pnpm with the committed lockfile.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:3000. The development server watches source files and rebuilds
on changes; refresh after a successful build. Set PORT=3001 to use another port.

## Organization

```text
src/
  pages/       Unique pages grouped by service and contact flow
  content/     Page registry, city/service copy, image inventories
  templates/   Shared city/service renderers and gallery components
  partials/    Shared header and footer
  styles/      Editable CSS, shared styles, Tailwind entry point
  scripts/     Browser interactions
public/
  assets/      Original images, fonts and video
  _redirects   Canonical clean URLs and legacy redirects
  _headers     Deployment cache rules
tooling/       Build, assets, images, layout, preview and development server
tests/         Page invariants, HTTP routes and architecture tests
dist/          Generated deployment output (ignored by Git)
.cache/        Reusable image derivatives (ignored by Git)
```

## Editing

- Unique page content: edit `src/pages/`. `src/content/pages.json` maps source
  pages to output filenames. Public URLs live in `public/_redirects`.
- City pages: edit `src/content/holiday-cities.json`. All eight share
  `src/templates/holiday-city.html`; local copy, FAQs and metadata remain unique.
- Service pages: edit `src/content/holiday-services.json` and the shared renderer
  in `src/templates/holiday-services.mjs`.
- Navigation/footer: edit `src/partials/`. Source pages contain insertion slots,
  not duplicated rendered navigation.
- Images: add originals to `public/assets/images/`, then update the inventory or
  page's `data-original-src`. Builds create responsive WebP sizes, dimensions and
  srcset automatically; never hand-edit hashed URLs.
- Styles/behavior: edit `src/styles/` and `src/scripts/`. Dynamic utility classes
  must be complete strings or listed in the Tailwind safelist.
- Forms: provider-owned GHL forms remain embedded on separate landscape and
  holiday contact pages. Edit form fields in GHL, not in page templates.

## Commands

```sh
pnpm build     # Generate the complete site, including responsive images
pnpm preview   # Serve the existing dist build
pnpm test      # Validate the existing build and run regression tests
pnpm check     # Build, then test
pnpm images    # Warm the image cache without modifying source pages
```

Builds never rewrite source files. The pipeline reads content, renders templates,
inserts navigation, resolves responsive images, compiles and fingerprints CSS/JS,
and writes compressed variants. Image caching uses file bytes and encoding
settings. The cache can be discarded and rebuilt offline from committed originals.
Only current derivatives enter the deployment output.

The preview server serves only public pages/assets from dist, supports video
byte-range requests, and rejects repository paths and traversal attempts.

## Deployment

Netlify runs `pnpm build` and publishes `dist`, configured in `netlify.toml`.
Do not publish the repository root or edit generated output. Existing clean URLs,
legacy redirects, canonical metadata, service-specific consultation links and
the holiday video are preserved.

Font binaries and licenses are committed. `tooling/fonts.mjs` is an optional
networked maintenance utility, never part of the regular build.
