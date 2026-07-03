// Lightweight global scroll store shared between Lenis and the R3F canvas.
// Avoids prop-drilling scroll progress into the 3D scene.

export const scrollStore = {
  // 0..1 progress of full page
  progress: 0,
  // raw scroll velocity (px/frame-ish) for subtle motion
  velocity: 0,
  // section anchors registered by name -> { top, height } in progress units
  sections: {},
};

export function setScroll(progress, velocity) {
  scrollStore.progress = progress;
  scrollStore.velocity = velocity;
}

export function registerSection(name, el) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const top = window.scrollY + rect.top;
  const docHeight = document.body.scrollHeight - window.innerHeight;
  scrollStore.sections[name] = {
    start: docHeight > 0 ? top / docHeight : 0,
    center:
      docHeight > 0 ? (top + rect.height / 2 - window.innerHeight / 2) / docHeight : 0,
  };
}
