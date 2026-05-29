// Netflix Japanese — content.js
// Run at document_start so our capture-phase keydown listener is registered
// before other sites add their own — prevents stopImmediatePropagation silencing us.

let currentSpeed = 1.0;

const onNetflix = window.location.hostname.endsWith('netflix.com');

function applySpeed(speed) {
  currentSpeed = speed;
  document.querySelectorAll('video, audio').forEach(el => {
    el.playbackRate = speed;
  });
}

function seekVideo(video, deltaSeconds) {
  video.currentTime = Math.max(0, Math.min(video.duration || Infinity, video.currentTime + deltaSeconds));
}

function frameStep(video, deltaSeconds) {
  video.pause();
  seekVideo(video, deltaSeconds);
}

function injectPageScript() {
  const s = document.createElement('script');
  s.src = browser.runtime.getURL('js/page-script.js');
  (document.head || document.documentElement).appendChild(s);
  s.remove();
}

if (onNetflix) injectPageScript();

// Registered immediately (document_start) so we're first in the capture chain.
document.addEventListener('keydown', e => {
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement && document.activeElement.isContentEditable)) return;
  if (e.ctrlKey || e.metaKey) return;

  const video = document.querySelector('video');

  if (e.altKey) {
    if (!video) return;

    // ⌥ + ,  →  step one frame back
    // ⌥ + .  →  step one frame forward
    // Use e.code (physical key) not e.key — Option key on Mac changes e.key to ≤/≥
    if (e.code === 'Comma') {
      if (onNetflix) return;
      frameStep(video, -(1 / 30));
      e.preventDefault();
    } else if (e.code === 'Period') {
      if (onNetflix) return;
      frameStep(video, 1 / 30);
      e.preventDefault();
    } else if (e.code === 'Digit0') {
      browser.storage.local.set({ speed: 1.0 });
      applySpeed(1.0);
      e.preventDefault();
    }
    return;
  }

  // t  →  toggle Japanese ↔ English subtitles (Netflix only)
  if (e.code === 'KeyT') {
    if (!onNetflix) return;
    document.dispatchEvent(new CustomEvent('NJ_TOGGLE_SUBTITLE'));
    e.preventDefault();
    return;
  }

  // ,  →  rewind 1 second   .  →  forward 1 second
  // Skipped on Netflix — direct currentTime manipulation breaks their DRM player.
  if (e.code === 'Comma') {
    if (!video || onNetflix) return;
    seekVideo(video, -1);
    e.preventDefault();
  } else if (e.code === 'Period') {
    if (!video || onNetflix) return;
    seekVideo(video, 1);
    e.preventDefault();

  // [ → speed down 0.05  |  ] → speed up 0.05
  } else if (e.code === 'BracketLeft' || e.code === 'BracketRight') {
    browser.storage.local.get('speed', result => {
      const step = 0.05;
      const min  = 0.25;
      const max  = 2.00;
      let speed  = result.speed || 1.0;
      speed = e.code === 'BracketLeft' ? speed - step : speed + step;
      speed = Math.round(Math.max(min, Math.min(max, speed)) * 100) / 100;
      browser.storage.local.set({ speed });
      applySpeed(speed);
    });
    e.preventDefault();
  }
}, true);

document.addEventListener('ratechange', e => {
  if (currentSpeed === 1.0) return;
  if ((e.target.nodeName === 'VIDEO' || e.target.nodeName === 'AUDIO')
      && e.target.playbackRate !== currentSpeed) {
    e.target.playbackRate = currentSpeed;
  }
}, true);

document.addEventListener('play', e => {
  if (currentSpeed === 1.0) return;
  if (e.target.nodeName === 'VIDEO' || e.target.nodeName === 'AUDIO') {
    e.target.playbackRate = currentSpeed;
  }
}, true);

function onDOMReady() {
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeName === 'VIDEO' || node.nodeName === 'AUDIO') {
          node.playbackRate = currentSpeed;
        }
        if (node.querySelectorAll) {
          node.querySelectorAll('video, audio').forEach(el => {
            el.playbackRate = currentSpeed;
          });
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  browser.storage.local.get('speed', result => {
    if (result.speed) applySpeed(result.speed);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onDOMReady);
} else {
  onDOMReady();
}

setInterval(() => {
  if (currentSpeed === 1.0) return;
  document.querySelectorAll('video, audio').forEach(el => {
    if (el.playbackRate !== currentSpeed) el.playbackRate = currentSpeed;
  });
}, 2000);

browser.runtime.onMessage.addListener(message => {
  if (message.type === 'SET_SPEED') applySpeed(message.speed);
});
