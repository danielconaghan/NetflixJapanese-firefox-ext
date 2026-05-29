// Netflix Japanese — furigana.js
// Uses kuromoji for morphological analysis — context-aware readings,
// correct phonetic changes (一回→いっかい), special readings (今日→きょう), etc.

const KANJI_RE = /[一-龯㐀-䶿]/;
const DICT_PATH = browser.runtime.getURL('dict/');

let tokenizer = null;
let subtitleContainer = null;

// Katakana → hiragana (kuromoji returns readings in katakana)
function toHiragana(str) {
  return str.replace(/[ァ-ヶ]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

function makeRuby(surface, reading) {
  const ruby = document.createElement('ruby');
  ruby.appendChild(document.createTextNode(surface));
  const rt = document.createElement('rt');
  rt.textContent = reading;
  ruby.appendChild(rt);
  return ruby;
}

function annotate(textNode) {
  if (!tokenizer) return;
  const text = textNode.textContent;
  if (!KANJI_RE.test(text) || !textNode.parentNode) return;

  const tokens = tokenizer.tokenize(text);
  const frag = document.createDocumentFragment();
  let hasAny = false;

  for (const token of tokens) {
    const surface = token.surface_form;
    const reading = token.reading;
    if (KANJI_RE.test(surface) && reading && reading !== '*') {
      frag.appendChild(makeRuby(surface, toHiragana(reading)));
      hasAny = true;
    } else {
      frag.appendChild(document.createTextNode(surface));
    }
  }

  if (hasAny) textNode.parentNode.replaceChild(frag, textNode);
}

function processNode(root) {
  if (!root) return;
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    { acceptNode: n => n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP }
  );
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  nodes.forEach(annotate);
}

function getSubtitleText(container) {
  const clone = container.cloneNode(true);
  clone.querySelectorAll('rt').forEach(rt => rt.remove());
  return clone.textContent.trim();
}

function attachToContainer(container) {
  subtitleContainer = container;

  document.addEventListener('click', e => {
    const text = getSubtitleText(container);
    if (!text) return;
    const hit = document.elementsFromPoint(e.clientX, e.clientY)
      .some(el => container.contains(el) && el !== container);
    if (!hit) return;
    const video = document.querySelector('video');
    const wasPaused = video && video.paused;
    browser.runtime.sendMessage({ type: 'OPEN_JISHO', query: text });
    if (wasPaused) {
      // Netflix fires play() asynchronously after the click — intercept it once
      video.addEventListener('play', e => { e.target.pause(); }, { once: true, capture: true });
    }
  }, true);

  const observer = new MutationObserver(mutations => {
    observer.disconnect();
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) processNode(node);
        else if (node.nodeType === Node.TEXT_NODE) annotate(node);
      }
    }
    observer.observe(container, { childList: true, subtree: true });
  });

  processNode(container);
  observer.observe(container, { childList: true, subtree: true });
}

// Wait for dict_loader.js to pre-fetch dicts into browser cache before starting kuromoji.
// Takes ~1-2s; subtitles that appear before it's ready are processed once it finishes.
document.addEventListener('NJDictsReady', function () {
  kuromoji.builder({ dicPath: DICT_PATH }).build((err, built) => {
    if (err) { console.error('[NJ] kuromoji init failed:', err); return; }
    tokenizer = built;
    if (subtitleContainer) processNode(subtitleContainer);
  });
}, { once: true });

// Watch for player-timedtext to appear
const bodyObserver = new MutationObserver(() => {
  const container = document.querySelector('.player-timedtext');
  if (container) {
    bodyObserver.disconnect();
    attachToContainer(container);
  }
});

const target = document.body || document.documentElement;
bodyObserver.observe(target, { childList: true, subtree: true });

const existing = document.querySelector('.player-timedtext');
if (existing) {
  bodyObserver.disconnect();
  attachToContainer(existing);
}
