module.exports = {
  content: ['./src/**/*.{html,js,mjs,json}', './tooling/layout.mjs', './dist/*.html'],
  theme: { extend: {} },
  // Keep dynamically applied interaction states in the compiled stylesheet.
  safelist: ['grid-rows-[0fr]', 'grid-rows-[1fr]', 'opacity-100', 'z-10'],
};
