# Netflix Japanese

A Firefox extension for Japanese language learners watching Netflix. Adds real-time furigana (ruby text) above kanji in subtitles, click-to-Jisho lookup, and fine-grained playback speed control.

![Netflix Japanese icon](icon.svg)

## Features

- **Furigana on subtitles** — kanji in Japanese subtitles get hiragana readings above them, powered by [kuromoji](https://github.com/takuyaa/kuromoji) morphological analysis. Readings are context-aware: 一回→いっかい, 今日→きょう, etc.
- **Click-to-Jisho** — click any subtitle to open [jisho.org](https://jisho.org) in a new tab with the subtitle text as the search query. If the video is already paused it stays paused; if playing it pauses first.
- **Fine-grained speed control** — speeds from 0.25× to 2.00× in 0.05 steps, via popup or keyboard shortcuts
- **Keyboard shortcuts** — no mouse needed:
  | Key | Action |
  |-----|--------|
  | `[` | Speed down 0.05× |
  | `]` | Speed up 0.05× |
  | `⌥ + 0` | Reset to 1.0× |

## Installation

This extension is not listed on addons.mozilla.org. Install it manually in Firefox Developer Edition or Firefox Nightly:

1. Download `netflix-japanese-v1.2.xpi` from [Releases](../../releases)
2. In Firefox, go to `about:addons`
3. Click the gear icon → **Install Add-on From File…**
4. Select the `.xpi` file

> Firefox standard edition may require signing. Use [Firefox Developer Edition](https://www.mozilla.org/en-US/firefox/developer/) to install unsigned extensions.

## Building from source

```bash
git clone https://github.com/YOUR_USERNAME/netflix-japanese
cd netflix-japanese
zip -r netflix-japanese-v1.2.xpi manifest.json icon.png icon.svg popup.html popup.css js/ dict/
```

Then install the `.xpi` as above.

## How it works

- `content.js` registers a capture-phase `keydown` listener at `document_start` so it fires before Netflix's own handlers
- `dict_loader.js` pre-fetches the 12 kuromoji dictionary files (IPAdic, ~17 MB) into the browser cache via `fetch()`
- `kuromoji.js` (a bundled, patched build of kuromoji for Firefox content scripts) performs morphological analysis
- `furigana.js` watches the `.player-timedtext` container with a `MutationObserver` and wraps kanji tokens in `<ruby>/<rt>` elements as subtitles change. It also handles click-to-Jisho: since Netflix overlays intercept all clicks, hit detection uses `document.elementsFromPoint()` to check whether the click landed geometrically over a subtitle element. If the video was already paused, a one-shot capture-phase `play` listener cancels Netflix's async play toggle.
- `background.js` handles the `OPEN_JISHO` message from the content script and opens the Jisho tab via `browser.tabs.create()` (content scripts cannot call this API directly)

**Why the patched kuromoji?** Firefox blocks `XMLHttpRequest` from content scripts to `moz-extension://` URLs. The bundled kuromoji is patched to use `fetch()` instead, with a fix for Node's `path.join()` collapsing `moz-extension://` to `moz-extension:/`.

## Limitations

- **Netflix only** — the extension is scoped to `*.netflix.com`
- **Firefox only** — uses `browser.*` WebExtension APIs
- **Seek shortcuts (`,`/`.`) are not available on Netflix** — direct `currentTime` manipulation breaks Netflix's DRM player; these shortcuts are intentionally disabled on Netflix

## Third-party code

- [kuromoji.js](https://github.com/takuyaa/kuromoji) — Apache 2.0 licence — Japanese morphological analyser
- kuromoji bundles the [IPAdic](https://drive.google.com/drive/folders/0B4y35FiV1wh7MWVlSDBCSXZMTXM) dictionary

## Disclaimer

This extension is provided for personal, educational use. Use at your own risk. It is not affiliated with or endorsed by Netflix. The authors accept no liability for any issues arising from its use, including but not limited to account restrictions or playback problems.

## Licence

[MIT](LICENSE)
