import site from '../data/site.json';

interface TrailerOptions {
  onOpen?: () => void;
}

/** Trailer modal on a native <dialog> (FR-7). The iframe only exists while it is open. */
export function initTrailer({ onOpen }: TrailerOptions = {}) {
  const dialog = document.getElementById('trailer') as HTMLDialogElement | null;
  const frame = dialog?.querySelector<HTMLElement>('[data-trailer-frame]');
  if (!dialog || !frame) return;

  let opener: HTMLElement | null = null;

  const open = (trigger: HTMLElement) => {
    if (dialog.open) return;
    opener = trigger;
    onOpen?.();

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(site.trailerYouTubeId)}?autoplay=1&rel=0&playsinline=1`;
    iframe.title = 'RAÍZ — Official Trailer';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    frame.replaceChildren(iframe);

    document.documentElement.classList.add('rz-lock');
    dialog.showModal();
  };

  dialog.addEventListener('close', () => {
    frame.replaceChildren(); // removing the iframe stops the audio
    document.documentElement.classList.remove('rz-lock');
    opener?.focus();
    opener = null;
  });

  // A click on the dialog element itself is a click outside the box (the backdrop).
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.querySelector('[data-trailer-close]')?.addEventListener('click', () => dialog.close());

  document.querySelectorAll<HTMLElement>('[data-trailer]').forEach((btn) => {
    btn.addEventListener('click', () => open(btn));
  });
}
