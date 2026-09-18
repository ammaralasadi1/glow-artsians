// The native details menu works without JavaScript. Enhance dismissal and focus.
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
