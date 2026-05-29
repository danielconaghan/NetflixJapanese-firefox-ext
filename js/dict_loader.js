// Netflix Japanese — dict_loader.js
// Pre-fetches all kuromoji dictionary files into the browser cache so that
// kuromoji's own fetch() calls return instantly when build() is called.
// Dispatches 'NJDictsReady' on document when all files are cached.

(function () {
  const DICT_PATH = browser.runtime.getURL('dict/');
  const FILES = [
    'base.dat.gz', 'check.dat.gz',
    'tid.dat.gz',  'tid_map.dat.gz', 'tid_pos.dat.gz',
    'cc.dat.gz',
    'unk.dat.gz',  'unk_char.dat.gz', 'unk_compat.dat.gz',
    'unk_invoke.dat.gz', 'unk_map.dat.gz', 'unk_pos.dat.gz'
  ];

  Promise.all(FILES.map(f =>
    fetch(DICT_PATH + f)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .catch(e => console.error('[NJ] dict fetch failed:', f, e))
  )).then(() => {
    document.dispatchEvent(new CustomEvent('NJDictsReady'));
  });
})();
