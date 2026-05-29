// Netflix Japanese — background.js
// Handles keyboard shortcut commands declared in manifest

browser.commands.onCommand.addListener(command => {
  if (command === 'speed-reset') {
    browser.storage.local.set({ speed: 1.0 });
    browser.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) {
        browser.tabs.sendMessage(tabs[0].id, { type: 'SET_SPEED', speed: 1.0 });
      }
    });
  }
});
