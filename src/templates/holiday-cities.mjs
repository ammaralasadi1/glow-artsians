import fs from 'node:fs/promises';
import {sourcePath} from '../../tooling/paths.mjs';
import {organizationNode} from './organization-schema.mjs';

const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const origin = 'https://glowartisans.com';

export async function renderCityPages(cities) {
  const template = await fs.readFile(sourcePath('templates', 'holiday-city.html'), 'utf8');
  return cities.map(city => {
    const url = origin + city.route;
    const title = `Christmas Lighting & Holiday Decorating in ${city.name}, ${city.abbr} | Glow Artisans`;
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        organizationNode(),
        {'@type': 'Service', '@id': `${url}#service`, name: `Exterior Christmas lighting and holiday decorating in ${city.name}, ${city.state}`, serviceType: 'Residential exterior Christmas lighting and outdoor holiday decoration', url, provider: {'@id': `${origin}/#organization`}, areaServed: [{'@type': 'Place', name: `${city.name}, ${city.state}`}, {'@type': 'Place', name: 'Northern Virginia'}], description: 'All-inclusive exterior holiday service for homeowners: design, installation, seasonal maintenance, takedown and storage. Display scope and service availability are confirmed during the consultation.'},
        {'@type': 'WebPage', '@id': `${url}#webpage`, url, name: title, inLanguage: 'en-US', about: {'@id': `${url}#service`}, breadcrumb: {'@id': `${url}#breadcrumb`}},
        {'@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: [['Home', '/'], ['Christmas & Holiday Lighting', '/holiday'], [`${city.name}, ${city.abbr}`, city.route]].map(([name, route], index) => ({'@type': 'ListItem', position: index + 1, name, item: origin + route}))},
      ],
    };
    const values = Object.fromEntries(Object.entries(city).filter(([, value]) => typeof value === 'string').map(([key, value]) => [key, escape(value)]));
    Object.assign(values, {
      localTitle: city.localTitle.map(escape).join('<br>'),
      localParagraphs: city.localParagraphs.map(text => `<p>${escape(text)}</p>`).join(''),
      checklist: city.checklist.map(text => `<li>${escape(text)}</li>`).join(''),
      faqs: city.faqs.map(([question, answer]) => `        <details><summary>${escape(question)}</summary><p>${escape(answer)}</p></details>`).join('\n'),
      schema: JSON.stringify(schema).replaceAll('<', '\\u003c'),
    });
    const html = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      if (!(key in values)) throw new Error(`${city.page}: unknown template field ${key}`);
      return values[key];
    });
    return {name: city.page, output: `${city.page}.html`, html};
  });
}
