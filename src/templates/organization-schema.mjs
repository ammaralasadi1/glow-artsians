// Canonical business entity node, referenced by the same @id across every
// page so search engines and AI answer engines merge signals into one entity
// instead of treating each page's schema as a separate, unrelated business.
export function organizationNode(extra = {}) {
  return {
    '@type': 'HomeAndConstructionBusiness',
    '@id': 'https://glowartisans.com/#organization',
    name: 'Glow Artisans',
    url: 'https://glowartisans.com/',
    telephone: '+1-571-741-2444',
    priceRange: '$$$',
    address: {'@type': 'PostalAddress', addressLocality: 'Tysons Corner', addressRegion: 'VA', addressCountry: 'US'},
    openingHoursSpecification: {'@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '00:00', closes: '23:59'},
    sameAs: [
      'https://www.instagram.com/glowartsianslighting/',
      'https://www.facebook.com/glowartisanslighting',
      'https://maps.app.goo.gl/GHFci1hjT1QaJ7kA6',
      'https://www.yelp.com/biz/glow-artisans-centreville',
    ],
    ...extra,
  };
}
