module.exports = {
  content: ['./*.html', './assets/js/*.js'],
  theme: { extend: {} },
  // Dynamic UI states are also present as complete strings in assets/js.
  safelist: ['grid-rows-[0fr]', 'grid-rows-[1fr]', 'opacity-100', 'z-10'],
};
