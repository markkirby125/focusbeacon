import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(join(__dirname, '..', 'focusbeacon.js'), 'utf8');

function createWindow(options = {}) {
  const dom = new JSDOM(`<!DOCTYPE html>
<html lang="en">
<body>
  <button id="btn">Action</button>
  <input id="inp" type="text" />
  <a href="#main" class="skip-link">Skip</a>
</body>
</html>`, { runScripts: 'dangerously' });

  const { window } = dom;

  if (!window.CSS) {
    window.CSS = {
      supports: (property, value) => {
        if (property === 'selector(:focus-visible)') return true;
        if (value !== undefined) return false;
        return false;
      }
    };
  }

  const originalMatches = window.Element.prototype.matches;
  window.Element.prototype.matches = function (selector) {
    if (selector === ':focus-visible' || selector === ':focus') {
      return this === window.document.activeElement;
    }
    return originalMatches.call(this, selector);
  };

  // JSDOM does not perform layout, so getBoundingClientRect returns all zeros.
  // Provide a non-zero default rect so focus positioning tests can run.
  window.Element.prototype.getBoundingClientRect = function () {
    return { top: 8, left: 8, width: 120, height: 40, right: 128, bottom: 48 };
  };

  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() { return true; },
    });
  }

  if (!window.Element.prototype.animate) {
    window.Element.prototype.animate = function () {
      return { onfinish: null };
    };
  }

  const script = window.document.createElement('script');
  if (options.devMode) script.setAttribute('data-focus-dev', 'true');
  if (options.trailLength) script.setAttribute('data-focus-trail', String(options.trailLength));
  script.textContent = source;
  window.document.body.appendChild(script);

  // JSDOM may report readyState as 'loading' and never fire DOMContentLoaded
  // for dynamically appended inline scripts, so trigger init manually.
  if (!window.document.getElementById('focusbeacon-ring')) {
    window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  }

  return window;
}

describe('FocusBeacon init', () => {
  test('creates the beacon overlay and marks the body active', () => {
    const window = createWindow();

    assert.ok(window.document.getElementById('focusbeacon-ring'));
    assert.ok(window.document.getElementById('focusbeacon-radar'));
    assert.ok(window.document.body.classList.contains('focusbeacon-active'));
    assert.ok(window.FocusBeacon);
  });
});

describe('FocusBeacon focus tracking', () => {
  test('shows the beacon around a keyboard-focused element', () => {
    const window = createWindow();
    const btn = window.document.getElementById('btn');

    btn.focus();
    btn.dispatchEvent(new window.Event('focusin', { bubbles: true }));

    const beacon = window.document.getElementById('focusbeacon-ring');
    assert.ok(beacon.classList.contains('active'));
    assert.ok(beacon.style.width);
    assert.ok(beacon.style.height);
  });

  test('hides the beacon on focusout', () => {
    const window = createWindow();
    const btn = window.document.getElementById('btn');

    btn.focus();
    btn.dispatchEvent(new window.Event('focusin', { bubbles: true }));

    const beacon = window.document.getElementById('focusbeacon-ring');
    assert.ok(beacon.classList.contains('active'));

    btn.dispatchEvent(new window.Event('focusout', { bubbles: true }));
    assert.ok(!beacon.classList.contains('active'));
  });
});

describe('FocusBeacon cursor radar', () => {
  test('shows the radar after a double Ctrl press', () => {
    const window = createWindow();

    window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Control', bubbles: true }));
    window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Control', bubbles: true }));

    const radar = window.document.getElementById('focusbeacon-radar');
    assert.equal(radar.style.display, 'block');
  });
});

describe('FocusBeacon destroy', () => {
  test('removes the beacon, body class, and global reference', () => {
    const window = createWindow();

    assert.ok(window.FocusBeacon);
    window.FocusBeacon.destroy();

    assert.ok(!window.document.getElementById('focusbeacon-ring'));
    assert.ok(!window.document.body.classList.contains('focusbeacon-active'));
    assert.equal(window.FocusBeacon, undefined);
  });

  test('stops tracking focus after destroy', () => {
    const window = createWindow();
    const btn = window.document.getElementById('btn');

    window.FocusBeacon.destroy();
    btn.focus();
    window.document.dispatchEvent(new window.Event('focusin', { bubbles: true }));

    assert.ok(!window.document.getElementById('focusbeacon-ring'));
  });
});
