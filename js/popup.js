// Netflix Japanese — popup.js

const STEP = 0.05;
const MIN  = 0.25;
const MAX  = 2.00;

function clamp(val) {
  return Math.round(Math.max(MIN, Math.min(MAX, val)) * 100) / 100;
}

function setSpeed(speed) {
  speed = clamp(speed);

  // Save to storage
  browser.storage.local.set({ speed });

  // Update display
  updateDisplay(speed);

  // Send to active tab immediately
  browser.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0]) {
      browser.tabs.sendMessage(tabs[0].id, { type: 'SET_SPEED', speed })
        .catch(() => {}); // Silently ignore if content script not loaded yet
    }
  });
}

// Wire up all speed buttons
document.querySelectorAll('.btn-grid button').forEach(btn => {
  btn.addEventListener('click', () => setSpeed(parseFloat(btn.dataset.speed)));
});

// Nudge buttons
document.getElementById('nudge-down').addEventListener('click', () => {
  browser.storage.local.get('speed', result => {
    setSpeed((result.speed || 1.0) - STEP);
  });
});

document.getElementById('nudge-up').addEventListener('click', () => {
  browser.storage.local.get('speed', result => {
    setSpeed((result.speed || 1.0) + STEP);
  });
});

document.getElementById('reset-btn').addEventListener('click', () => {
  setSpeed(1.0);
});

function updateDisplay(speed) {
  document.getElementById('current-speed').textContent = speed.toFixed(2) + 'x';
  document.querySelectorAll('.btn-grid button').forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.dataset.speed) === speed);
  });
}

// Load current speed when popup opens
document.addEventListener('DOMContentLoaded', () => {
  browser.storage.local.get('speed', result => {
    updateDisplay(result.speed || 1.0);
  });
});

// Keep display in sync when keyboard shortcuts change speed
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.speed) {
    updateDisplay(changes.speed.newValue);
  }
});
