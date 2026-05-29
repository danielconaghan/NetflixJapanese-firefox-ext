// Injected into the page context so it has direct access to window.netflix.
document.addEventListener('NJ_TOGGLE_SUBTITLE', () => {
  try {
    const repo = window.netflix.appContext.state.playerApp.getState()
      .videoPlayer.cadmiumPlayerRepository;
    const player = Object.values(repo.playersById)[0];
    if (!player) return;
    const current = player.getTimedTextTrack();
    const tracks  = player.getTimedTextTrackList();
    const target  = (current && /^ja/i.test(current.bcp47))
      ? tracks.find(t => t && /^en/i.test(t.bcp47))
      : tracks.find(t => t && /^ja/i.test(t.bcp47));
    if (target) player.setTimedTextTrack(target);
  } catch(e) {
    console.warn('[NJ] subtitle toggle failed:', e);
  }
});
