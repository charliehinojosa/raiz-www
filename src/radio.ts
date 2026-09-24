import data from '../data/tracks.json';

export interface Radio {
  pause(): void;
}

const TUNE_DELAY_MS = 280;
const STATIC_VOLUME = 0.35;

/** RAÍZ Radio preview player (FR-8). */
export function initRadio(): Radio {
  const root = document.getElementById('radio');
  const noop: Radio = { pause() {} };
  if (!root) return noop;

  const $ = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
  const panel = $<HTMLElement>('.rz-radio');
  const pill = $<HTMLButtonElement>('.rz-radio-pill');
  const audio = $<HTMLAudioElement>('audio[data-track]');
  const staticFx = $<HTMLAudioElement>('audio[data-static]');
  const needle = $<HTMLElement>('.rz-needle');
  const fill = $<HTMLElement>('.rz-radio-prog-fill');
  const air = $<HTMLElement>('[data-air]');
  const num = $<HTMLElement>('[data-num]');
  const freq = $<HTMLElement>('[data-freq]');
  const title = $<HTMLElement>('[data-title]');
  const toggle = $<HTMLButtonElement>('[data-toggle]');
  const stations = [...root.querySelectorAll<HTMLButtonElement>('.rz-station')];

  const tracks = data.tracks;
  const n = tracks.length;
  const cover = new URL('/assets/img/album-cover-1400.jpg', location.href).href;
  let index = 0;
  let unlocked = false;
  let tuneTimer = 0;

  staticFx.volume = STATIC_VOLUME;

  const isPlaying = () => !audio.paused && !audio.ended;
  const pos = (i: number) => `${8 + (i * 84) / Math.max(1, n - 1)}%`;

  function render() {
    const t = tracks[index];
    needle.style.left = pos(index);
    stations.forEach((s, i) => {
      s.classList.toggle('rz-station-on', i === index);
      s.setAttribute('aria-pressed', String(i === index));
    });
    num.textContent = String(index + 1).padStart(2, '0');
    freq.textContent = t.freq;
    title.textContent = t.title;
    updatePlayState();
    updateMediaSession();
  }

  function updatePlayState() {
    const playing = isPlaying();
    root!.dataset.playing = String(playing);
    air.textContent = playing ? 'ON AIR' : 'OFF AIR';
    toggle.setAttribute('aria-label', playing ? 'Pause' : `Play ${tracks[index].title}`);
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }

  function play() {
    audio.play().catch(() => updatePlayState());
  }

  /** iOS only lets an element play later if it was first played inside a user gesture. */
  function unlockStatic() {
    if (unlocked) return;
    unlocked = true;
    staticFx.muted = true;
    staticFx.play().then(
      () => {
        staticFx.pause();
        staticFx.currentTime = 0;
        staticFx.muted = false;
      },
      () => {
        staticFx.muted = false;
      },
    );
  }

  /** Static burst, then the new track ~280ms later (FR-8.3). Tuning always plays. */
  function tune(i: number) {
    index = ((i % n) + n) % n;
    clearTimeout(tuneTimer);
    staticFx.currentTime = 0;
    staticFx.play().catch(() => {});
    audio.src = '/' + tracks[index].src;
    audio.load();
    fill.style.transform = 'scaleX(0)';
    render();
    tuneTimer = window.setTimeout(play, TUNE_DELAY_MS);
  }

  function setOpen(open: boolean) {
    root!.dataset.open = String(open);
    panel.hidden = !open;
  }

  function openRadio() {
    // Opening starts playback; this runs inside the click, which satisfies autoplay rules.
    unlockStatic();
    setOpen(true);
    if (!isPlaying()) play();
    toggle.focus();
  }

  function minimize() {
    setOpen(false); // keeps playing
    pill.focus();
  }

  function updateMediaSession() {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: tracks[index].title,
      artist: 'RAÍZ',
      album: 'RAÍZ',
      artwork: [{ src: cover, sizes: '1400x1400', type: 'image/jpeg' }],
    });
  }

  function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => play()],
      ['pause', () => audio.pause()],
      ['previoustrack', () => tune(index - 1)],
      ['nexttrack', () => tune(index + 1)],
    ];
    for (const [action, handler] of handlers) {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        // Action not supported by this browser.
      }
    }
  }

  // Play state comes from the element's own events, never a local flag.
  audio.addEventListener('play', updatePlayState);
  audio.addEventListener('pause', updatePlayState);
  audio.addEventListener('ended', () => tune(index + 1)); // auto-advance and wrap
  audio.addEventListener('timeupdate', () => {
    if (audio.duration) fill.style.transform = `scaleX(${audio.currentTime / audio.duration})`;
  });

  // The pill and the "Tune in to RAÍZ Radio" button in Meet RAÍZ.
  document.querySelectorAll('[data-radio-open]').forEach((b) => b.addEventListener('click', openRadio));
  $('[data-radio-min]').addEventListener('click', minimize);
  $('[data-prev]').addEventListener('click', () => tune(index - 1));
  $('[data-next]').addEventListener('click', () => tune(index + 1));
  toggle.addEventListener('click', () => (isPlaying() ? audio.pause() : play()));
  stations.forEach((s, i) => s.addEventListener('click', () => tune(i)));

  setupMediaSession();
  render();

  return {
    pause() {
      clearTimeout(tuneTimer);
      audio.pause();
    },
  };
}
