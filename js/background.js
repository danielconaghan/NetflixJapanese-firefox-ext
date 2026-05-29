// Netflix Japanese — background.js
// Handles keyboard shortcut commands declared in manifest

browser.runtime.onMessage.addListener(message => {
  if (message.type === 'OPEN_JISHO') {
    browser.tabs.create({ url: 'https://jisho.org/search/' + encodeURIComponent(message.query) });
  }
});

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
