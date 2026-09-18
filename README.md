# Glow Artisans static website

The twenty HTML pages can be served directly from this folder. Generated assets
are committed with the pages; visitors do not download a CSS compiler.

## Development

Holiday hub, city and contact imagery is mapped in `content/holiday-imagery.json`
and refreshed by `scripts/holiday-imagery.mjs`. These AI-generated inspiration
images are separate from the original portfolio assets, so landscape pages are
unaffected. The holiday video is retained; only its poster is refreshed.

The four holiday service pages are generated from `content/holiday-services.json`
by `scripts/holiday-services.mjs` during every build. Edit those sources rather
than their generated HTML. Shared layout styles live in `holiday-shared.css`,
with service-specific styles in `holiday-service.css`. Service images are AI-generated
design inspiration, not client project photography. Their originals and generation
prompts are saved in the project; run `pnpm images` after changing source images,
then rebuild. Service image paths and alt text live in the service registry.
The build also refreshes
the service-link sections on the holiday hub and all city pages. Service pages use
`/holiday/services/…` URLs and route estimate CTAs to `/contact/holiday-lighting`.

Use Node.js 20 or newer and pnpm. Install pinned dependencies with
`pnpm install --frozen-lockfile`, then run `pnpm run build` after editing HTML,
`assets/css/`, or `assets/js/`. Run `pnpm dev` to build and open a local server at
`http://127.0.0.1:3000`. Use `pnpm preview` when assets are already built.
The local server reads this site's exact `_redirects` rules, so `/holiday` and
all other clean URLs work locally. Rebuild after changing classes, shared partials,
CSS, or scripts; HTML content edits appear on refresh. Set `PORT=3001` if needed.
Do not open pages with `file://` because asset paths are root-relative.

Edit page styles in `assets/css/<page>.css` and interaction scripts in
`assets/js/`. The build compiles Tailwind 3, minifies assets, and updates the
content-hashed stylesheet/script URLs in every page. Complete utility class
strings used by JavaScript are scanned too; add constructed classes to the
Tailwind safelist. The stylesheet order matches the previous CDN injection order.

Shared navigation and footer live in `partials/header.html` and
`partials/footer.html`; the build renders them into all sixteen pages between the
`site-header` / `site-footer` markers. Edit those partials rather than the generated
copies in each HTML page. Shared styling and mobile menu behavior live in
`assets/css/site-shell.css` and `assets/js/site-shell.js`.

The homepage remains landscape-led, with a permanent holiday link in its hero
and a holiday feature after the first landscape demonstration. Holiday service
promotion contains no booking-season dates or availability counts. Holiday
consultation links use `/contact/holiday-lighting`; landscape inquiries use
`/contact/landscape-lighting`. Each contact page offers a link to the other service.
The shared Contact navigation retains the visitor's current service context.

## City holiday pages and CTAs

The city registry is `content/holiday-cities.json`. The eight pages cover McLean,
Great Falls, Vienna, Oakton, Reston, Potomac, Cabin John, and Bethesda. Each is
editable in its root-level `holiday-<city>.html` source and has a clean URL listed
in the registry and `_redirects`. Virginia routes end in `-va`; Maryland routes
end in `-md`. These remain separate from the landscape `/great-falls` page.
The shared green, cream, and muted-gold layout
is in `assets/css/holiday-shared.css`, compiled into both the city page and the
main `/holiday` page. Hub-specific styling is in `assets/css/holiday.css`. The hub
keeps the existing muted holiday video within the split hero, with a pause/play
control, and links to all eight city pages. City-only styling lives in
`assets/css/holiday-city.css`. All city pages use the same fingerprinted CSS asset
so navigating between them can reuse the browser cache. Contact links point at
the unchanged `/contact/holiday-lighting` page. Local planning sections and a
planning FAQ are tailored to each new page without inventing local project claims.

CTA placement: a filled, service-aware header action; hero and closing actions;
a prominent post-gallery holiday consultation button; and service-labeled footer
actions on marketing pages. The homepage holiday feature has its own holiday
consultation button while landscape sections keep landscape destinations. Forms,
privacy, and thank-you pages omit the extra footer CTA banner. Both services remain
accessible through normal footer links. No popups or obstructing sticky bars are used.

The city pages target homeowners seeking exterior Christmas lighting and outdoor
holiday decorations. Its all-inclusive service scope is design, installation,
seasonal maintenance, takedown, and storage for an agreed display—not unlimited
decorations or interior work. Other Northern Virginia inquiries remain welcome,
subject to confirming service availability.

Content, FAQs, navigation, and service details are rendered as plain HTML. The
page includes a canonical URL, social metadata, Service, Organization, WebPage,
and BreadcrumbList structured data. It deliberately contains no invented local
address, customer review, rating, or project attribution. Portfolio images are
general examples, without city-specific attribution or visible captions. No video
or form scripts load on the city pages.

For later cities, review real service coverage and provide genuinely useful,
distinct content; do not mass-produce city-name swaps or claim general images
are local projects. Search/AI inclusion is not guaranteed. Nothing is deployed
by the build command; review changes locally before publishing.

## Images and fonts

Keep original images in their existing paths. `pnpm run images` generates WebP
variants and refreshes existing `data-original-src` image references. For a new
image, add `data-original-src` with its original path, `srcset`, `sizes`, and
intrinsic width/height, then run the image command. Choose `sizes` to match the
layout, including image cropping. Run `pnpm run build` afterward.

Images below the fold are lazy-loaded. Hero images remain eager. The holiday
video retains muted autoplay, looping, and its existing poster. Its MP4 is unchanged.

Five Latin WOFF2 font faces are hosted locally with `font-display: swap`, covering
the existing Lato and Playfair Display typography. Fonts are requested only when
used. Licenses are in `assets/fonts/`. Run `node scripts/fonts.mjs` only when
intentionally refreshing the font files, then rebuild; this maintenance command
requires internet access, normal builds do not.

## Forms

Both service-specific contact pages load their existing LeadConnector form eagerly;
the provider helper is deferred. `contact.html` is the landscape source, and
`holiday-contact.html` is the holiday source. Both put the form before supporting
imagery and content. Shared form layout lives in `assets/css/consultation.css`,
with service-specific colors and details in each page's stylesheet.

The provider helper hides inline forms until its resize handshake completes.
Scoped CSS keeps these always-on forms and their generated containers visible
if that handshake fails. Explicit starting heights prevent collapse, while the
helper can still resize them. Do not copy provider-generated wrappers or initialized
markers into source HTML. Both pages always show a direct provider link and a
phone fallback. The holiday landing page links to its contact page and no longer
downloads the form. Smoke-test the real embeds after deployment without submitting
test leads to production.

Form fields, button text, validation, and submissions are managed in LeadConnector,
not this repository. The retained holiday form currently includes a budget-range
question; remove it in the provider's form editor if pricing should also be absent
inside the embed. The surrounding contact-page content contains no pricing.

## Hosting and caching

Publish the HTML pages, assets, and `_headers`; do not publish `node_modules/`.
Netlify/Cloudflare Pages can read `_headers`. Other hosts must configure equivalent
cache headers: long-lived immutable caching for fingerprinted assets, and
revalidation for HTML and the image manifest. The build emits gzip and Brotli
sidecars for CSS/JS; the server must negotiate them with `Content-Encoding` and
`Vary: Accept-Encoding`, or compress responses itself. Do not serve compressed
files as plain CSS/JS. Enable HTML compression at the hosting layer as well.

No production hosting settings are changed by this repository build. Verify the
live response headers after deployment; local checks cannot confirm CDN behavior.

## Clean URLs on Netlify

Publish `_redirects` alongside the HTML files and retain `netlify.toml` at the
repository root. Public links use `/contact/landscape-lighting`,
`/contact/holiday-lighting`, `/holiday`, etc.; the actual source
files keep their `.html` names. Explicit 200 rewrites serve those files, while
forced 301 redirects send legacy `.html` addresses to their clean equivalents.
The old `/contact` URL redirects to the landscape contact page.
The homepage is `/`, and Services links to `/#services` because there is no
separate services page. Unknown paths are not rewritten to the homepage.

Pretty URLs post-processing is disabled in `netlify.toml` so it does not introduce
a competing trailing-slash convention. Canonical tags use the same clean URLs.
These routing changes take effect on the next Netlify deployment. VS Code Live
Server and generic file servers do not read `_redirects`; they may show
`Cannot GET /holiday`. Use `pnpm dev` / `pnpm preview` for this project, or Netlify
Dev for the full platform routing engine. The bundled preview implements only
the exact redirect and rewrite rules used by this site, including video ranges.
