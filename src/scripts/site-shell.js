// The native details menu works without JavaScript. Enhance dismissal and focus.
// Intent events are not confirmed submissions. Never include form values or URL parameters.
document.addEventListener('click', event => {
  const link = event.target.closest?.('a[href]');
  if (!link) return;
  const url = new URL(link.href, location.href);
  let action;
  let service = 'unspecified';
  if (url.protocol === 'tel:') action = 'phone_click';
  else if (url.protocol === 'mailto:') action = 'email_click';
  else if (url.origin === location.origin && /^\/contact\/(landscape-lighting|holiday-lighting)\/?$/.test(url.pathname)) {
    action = 'consultation_click';
    service = url.pathname.includes('holiday') ? 'holiday' : 'landscape';
  }
  if (!action) return;
  const placement = link.closest('.site-header') ? 'header' : link.closest('.site-footer') ? 'footer' : 'content';
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({event: 'inquiry_intent', inquiry_action: action, inquiry_service: service, inquiry_placement: placement});
});
const menu = document.querySelector('.site-menu');
if (menu) {
  const trigger = menu.querySelector('summary');
  menu.addEventListener('toggle', () => trigger.setAttribute('aria-label', menu.open ? 'Close navigation' : 'Open navigation'));
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menu.open = false;
    const target = new URL(link.href);
    if (target.pathname === location.pathname && target.hash) {
      const section = document.getElementById(target.hash.slice(1));
      if (section) {
        section.setAttribute('tabindex', '-1');
        section.focus({preventScroll: true});
      }
    }
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      trigger.focus();
    }
  });
  document.addEventListener('click', event => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });
  matchMedia('(min-width: 1100px)').addEventListener('change', event => {
    if (event.matches) menu.open = false;
  });
}
