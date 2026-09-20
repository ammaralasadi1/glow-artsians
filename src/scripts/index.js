document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("slider-root");
  if (!root) return;
  const overlay = document.getElementById("slider-overlay");
  const image = document.getElementById("slider-inner-img");
  const handle = document.getElementById("slider-handle");
  const hint = document.getElementById("slider-cta");
  let value = 50;
  let dragging = false;
  root.setAttribute("role", "slider");
  root.setAttribute("tabindex", "0");
  root.setAttribute("aria-label", "Reveal landscape lighting");
  root.setAttribute("aria-valuemin", "0");
  root.setAttribute("aria-valuemax", "100");
  const update = next => {
    value = Math.max(0, Math.min(100, next));
    overlay.style.width = value + "%";
    handle.style.left = value + "%";
    root.setAttribute("aria-valuenow", String(Math.round(value)));
    root.setAttribute("aria-valuetext", Math.round(value) + "% illuminated");
  };
  const sync = () => { image.style.width = root.offsetWidth + "px"; };
  sync(); update(value);
  window.addEventListener("resize", sync);
  const move = event => {
    const bounds = root.getBoundingClientRect();
    update((event.clientX - bounds.left) / bounds.width * 100);
  };
  root.style.touchAction = "pan-y";
  root.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    dragging = true;
    root.setPointerCapture(event.pointerId);
    hint.style.opacity = "0";
    move(event);
  });
  root.addEventListener("pointermove", event => { if (dragging) move(event); });
  root.addEventListener("pointerup", () => { dragging = false; });
  root.addEventListener("pointercancel", () => { dragging = false; });
  root.addEventListener("keydown", event => {
    const keys = {ArrowRight: value + 5, ArrowUp: value + 5, ArrowLeft: value - 5, ArrowDown: value - 5, Home: 0, End: 100};
    if (!(event.key in keys)) return;
    event.preventDefault();
    hint.style.opacity = "0";
    update(keys[event.key]);
  });
});
