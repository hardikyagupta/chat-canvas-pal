// Short audible cue played when an AI response finishes generating.
// Lazily creates and reuses a single HTMLAudioElement, plays it from the start
// at a modest volume, and swallows any error (missing file, browser autoplay
// policy) so it can never break the UI.
let cue: HTMLAudioElement | null = null;

export function playResponseCue() {
  try {
    if (!cue) {
      cue = new Audio('/response-ready.wav');
      cue.volume = 0.4;
    }
    cue.currentTime = 0;
    void cue.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

// Soft switch click played when the LHS nav is expanded/collapsed.
let toggleCue: HTMLAudioElement | null = null;

export function playToggleCue() {
  try {
    if (!toggleCue) {
      toggleCue = new Audio('/nav-toggle.ogg');
      toggleCue.volume = 0.5;
    }
    toggleCue.currentTime = 0;
    void toggleCue.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

// Confirmation blip played when content is copied.
let copyCue: HTMLAudioElement | null = null;

export function playCopyCue() {
  try {
    if (!copyCue) {
      copyCue = new Audio('/copy.ogg');
      copyCue.volume = 0.5;
    }
    copyCue.currentTime = 0;
    void copyCue.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

// Air-zoom whoosh played when the artifact is expanded/restored.
let expandCue: HTMLAudioElement | null = null;

export function playExpandCue() {
  try {
    if (!expandCue) {
      expandCue = new Audio('/artifact-expand.wav');
      expandCue.volume = 0.4;
    }
    expandCue.currentTime = 0;
    void expandCue.play().catch(() => {});
  } catch {
    /* ignore */
  }
}
