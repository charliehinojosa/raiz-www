const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/** Keep --vw equal to 1% of the layout width, excluding any classic scrollbar (FR-2.2). */
function trackViewportWidth() {
  const root = document.documentElement;
  const update = () => root.style.setProperty('--vw', `${root.clientWidth / 100}px`);
  update();
  window.addEventListener('resize', update, { passive: true });
}

/** Autoplay the silent hero loop; iOS needs the muted property set before play() (FR-2.1). */
function startVideo() {
  const video = document.getElementById('hero-video') as HTMLVideoElement | null;
  if (!video) return;
  video.muted = true;
  video.play().catch(() => {
    // Autoplay refused (e.g. Low Power Mode): the poster stays up.
  });
}

/** Grow the roots with scroll (FR-3.3); fully grown and static with reduced motion (FR-3.4). */
function growRoots() {
  const roots = document.getElementById('roots');
  if (!roots) return;
  let frame = 0;

  const render = () => {
    frame = 0;
    if (reducedMotion.matches) {
      roots.style.clipPath = '';
      roots.style.visibility = '';
      return;
    }
    const span = Math.max(240, window.innerWidth * 0.5625 * 0.55);
    const t = Math.min(1, Math.max(0, window.scrollY / span));
    const e = 1 - (1 - t) ** 2;
    roots.style.clipPath = `circle(${(e * 50).toFixed(2)}% at 50% 59.5%)`;
    roots.style.visibility = t > 0.005 ? 'visible' : 'hidden';
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(render);
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  reducedMotion.addEventListener('change', schedule);
  render();
}

export function initHero() {
  trackViewportWidth();
  startVideo();
  growRoots();
}
