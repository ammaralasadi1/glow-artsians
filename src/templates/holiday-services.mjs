import {readContent} from '../../tooling/content.mjs';
import {gallery, galleryFigure} from './holiday-gallery.mjs';
import {organizationNode} from './organization-schema.mjs';

const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const origin = 'https://glowartisans.com';
const cta = '<a class="city-button" href="/contact/holiday-lighting">Request a Holiday Estimate <span aria-hidden="true">↗</span></a>';

export function serviceLinks(services) {
  return `<!-- holiday-services:start -->
    <section class="city-section city-width" aria-labelledby="holiday-services-title">
      <div class="city-section-heading"><div><p class="city-eyebrow">Explore our holiday services</p><h2 id="holiday-services-title">A custom design.<br>The details are yours.</h2></div><p>Explore the possibilities for your exterior. Individual services are available depending on project size, or we can plan your home’s outdoor display together.</p></div>
      <div class="city-services holiday-service-links">${services.map(s=>`<article><h3><a class="city-text-link" href="${s.route}">${escape(s.name)} <span aria-hidden="true">↗</span></a></h3><p>${escape(s.summary)}</p></article>`).join('')}</div>
    </section>
    <!-- holiday-services:end -->`;
}

export async function renderServicePages(services, cities, images) {
  const pages = [];
  const companions = await readContent('holiday-imagery');
  for (const s of services) {
    const detail = gallery.find(item=>item.page===s.page);
    const companion = companions[s.page.includes('tree') ? 1 : s.page.includes('wreath') ? 2 : 0];
    const photo = images[s.image];
    if (!photo) throw new Error(`Run pnpm images to prepare ${s.image}`);
    const srcset = photo.variants.filter(v=>v.width>=320).map(v=>`${v.src} ${v.width}w`).join(', ');
    const heroSrc = (photo.variants.find(v=>v.width===1200)||photo.variants.at(-1)).src;
    const url = origin+s.route;
    const schema = {'@context':'https://schema.org','@graph':[
      organizationNode(),
      {'@type':'Service','@id':url+'#service',name:s.name,serviceType:s.name,url,description:s.description,provider:{'@id':origin+'/#organization'},areaServed:[{ '@type':'Place',name:'Northern Virginia'},...cities.map(c=>({'@type':'Place',name:`${c.name}, ${c.state}`}))]},
      {'@type':'WebPage','@id':url+'#webpage',url,name:s.title,inLanguage:'en-US',about:{'@id':url+'#service'},breadcrumb:{'@id':url+'#breadcrumb'}},
      {'@type':'BreadcrumbList','@id':url+'#breadcrumb',itemListElement:[['Home','/'],['Christmas & Holiday Lighting','/holiday'],[s.name,s.route]].map(([name,path],i)=>({'@type':'ListItem',position:i+1,name,item:origin+path}))}
    ]};
    const faqs = [...s.faqs,
      ['What is included in the service?', 'Your agreed exterior display includes custom design, supplied lights and decorations, installation, seasonal maintenance, post-holiday removal and storage. We confirm the exact areas and materials with you before installation.'],
      ['What happens if the display needs attention during the season?', 'Seasonal maintenance is included for the display we install. Contact Glow Artisans to report an issue so we can review it and arrange the next steps.'],
      ['How do I request an estimate and confirm availability?', 'Use our holiday estimate form to tell us about your home and the display you have in mind. We review the location, project size and scope, and discuss available installation timing. Your requested date is subject to confirmation.']
    ];
    const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#17221e" />
<title>${escape(s.title)}</title>
<meta name="description" content="${escape(s.description)}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escape(s.title)}" />
<meta property="og:description" content="${escape(s.description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${origin+photo.variants.at(-1).src}" />
<meta property="og:image:alt" content="${escape(s.imageAlt)}" />
<meta name="twitter:card" content="summary_large_image" />
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-NZZ28DDL');</script>
<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>
<link data-build="page-css" href="/assets/generated/holiday-service.css" rel="stylesheet" />
<link data-build="utilities" href="/assets/generated/utilities.css" rel="stylesheet" />
</head><body class="site-page-holiday-service">
<a class="city-skip" href="#city-main">Skip to content</a>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NZZ28DDL" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>
<!-- site-header:start --><!-- site-header:end -->
<main id="city-main" class="page-main city-page">
  <div class="city-hero-wrap">
    <nav class="city-breadcrumb city-width" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/holiday">Holiday lighting</a><span aria-hidden="true">/</span><span aria-current="page">${escape(s.name)}</span></nav>
    <section class="city-hero city-width" aria-labelledby="service-title">
      <div class="city-hero-copy"><p class="city-eyebrow">Custom exterior holiday design · For homeowners</p><h1 id="service-title">${escape(s.headline)}<em>${escape(s.accent)}</em></h1><p class="city-hero-description">${escape(s.intro)}</p><div class="city-actions">${cta}<a class="city-phone" href="tel:5717412444">Call (571) 741-2444</a></div><a class="city-text-link" href="#service-details">Explore your design options ↓</a></div>
      <figure class="city-hero-photo service-hero-photo"><img src="${heroSrc}" data-original-src="${s.image}" srcset="${srcset}" sizes="(min-width: 1380px) 640px, (min-width: 960px) 48vw, calc(100vw - 40px)" width="${photo.width}" height="${photo.height}" loading="eager" fetchpriority="high" decoding="async" alt="${escape(s.imageAlt)}" /></figure>
    </section>
    <div class="city-service-strip"><ul class="city-width"><li>Custom exterior design</li><li>Supplied lights &amp; décor</li><li>Installation &amp; seasonal care</li><li>Removal &amp; storage</li></ul></div>
  </div>
  <section id="service-details" class="city-section city-width" aria-labelledby="details-title">
    <div class="city-section-heading"><div><p class="city-eyebrow">Your design possibilities</p><h2 id="details-title">${escape(s.sectionTitle)}</h2></div><p>${escape(s.sectionIntro)}</p></div>
    <div class="city-services">${s.features.map(([title,text],i)=>`<article><span class="city-number" aria-hidden="true">0${i+1} / Design detail</span><h3>${escape(title)}</h3><p>${escape(text)}</p></article>`).join('')}</div>
    <p class="city-scope-note">Exterior only. Standalone services depend on project size and scope. We confirm the specific lights, decorations, installation areas and timing as part of your custom plan. </p>
    <div class="city-gallery service-inspiration" role="group" aria-label="Holiday design inspiration">${galleryFigure(detail,images)}${galleryFigure(companion,images)}</div>
  </section>
  <section class="city-local-wrap" aria-labelledby="planning-title"><div class="city-local city-width"><div><p class="city-eyebrow">Before installation</p><h2 id="planning-title">${escape(s.planningTitle)}</h2><p>${escape(s.planningText)}</p><div class="city-actions">${cta}</div></div><aside class="city-planning" aria-labelledby="checklist-title"><h3 id="checklist-title">Helpful to have in mind</h3><ul>${s.checklist.map(x=>`<li>${escape(x)}</li>`).join('')}</ul><p>A photo of your exterior or a favorite inspiration image can help explain the look you have in mind.</p></aside></div></section>
  <section class="city-section city-width" aria-labelledby="process-title"><div class="city-section-heading"><div><p class="city-eyebrow">All-inclusive holiday service</p><h2 id="process-title">Enjoy the season.<br>We’ll handle the details.</h2></div><p>From your first ideas to the final removal, your agreed display is managed as one coordinated project.</p></div><ol class="city-process">
    <li><span class="city-number">01</span><h3>Design &amp; scope</h3><p>We review your home, priorities and preferred look, then agree on the display and installation timing.</p></li>
    <li><span class="city-number">02</span><h3>Supply &amp; install</h3><p>We supply the agreed lights and decorations and install your custom exterior display.</p></li>
    <li><span class="city-number">03</span><h3>Seasonal care</h3><p>Maintenance is included. Contact our team if the display we installed needs attention.</p></li>
    <li><span class="city-number">04</span><h3>Remove &amp; store</h3><p>After the holidays, we remove and store the display materials, taking the end-of-season work off your list.</p></li>
  </ol></section>
  <section class="city-gallery-wrap" aria-labelledby="areas-title"><div class="city-section city-width"><div class="city-section-heading"><div><p class="city-eyebrow">Local holiday service</p><h2 id="areas-title">A warm welcome,<br>closer to home.</h2></div><p>Serving homeowners in these communities and welcoming inquiries from elsewhere in Northern Virginia. Share your address so we can confirm availability for your property.</p></div><nav class="service-area-links" aria-label="Holiday service areas">${cities.map(c=>`<a href="${c.route}">${escape(c.name)}, ${c.abbr}</a>`).join('')}</nav></div></section>
  <section class="city-section city-width city-faq" aria-labelledby="faq-title"><div><p class="city-eyebrow">Before we get started</p><h2 id="faq-title">Good questions.<br>Clear answers.</h2></div><div class="city-faq-list">${faqs.map(([q,a])=>`<details><summary>${escape(q)}</summary><p>${escape(a)}</p></details>`).join('')}</div></section>
  <section class="city-section city-width service-related" aria-labelledby="related-title"><p class="city-eyebrow">Complete your exterior design</p><h2 id="related-title">Explore the other possibilities.</h2><div class="city-services">${services.filter(other=>other.page!==s.page).map(other=>`<article><h3><a class="city-text-link" href="${other.route}">${escape(other.name)} ↗</a></h3><p>${escape(other.summary)}</p></article>`).join('')}</div></section>
  <section class="city-final" aria-labelledby="final-title"><div class="city-width"><p class="city-eyebrow">Your next holiday starts with an idea</p><h2 id="final-title">Let’s design your holiday welcome.</h2><p>Tell us about your home and the exterior display you have in mind. We’ll review your project and help you take the next step.</p><div class="city-actions">${cta}<a class="city-phone" href="tel:5717412444">Call (571) 741-2444</a></div></div></section>
</main>
<!-- site-footer:start --><!-- site-footer:end -->
<script data-build="site-shell" src="/assets/generated/site-shell.js" defer></script>
</body></html>
`;
    pages.push({name:s.page, output:`${s.page}.html`, html});
  }
  return pages;
}
