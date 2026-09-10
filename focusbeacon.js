(function() {
  'use strict';

  if (document.getElementById('focusbeacon-ring')) return;

  const supportsFocusVisible = CSS.supports && CSS.supports('selector(:focus-visible)');
  const currentScript = document.currentScript;
  const config = {
    trailLength: parseInt(currentScript && currentScript.getAttribute('data-focus-trail'), 10) || 0,
    devMode: currentScript && currentScript.getAttribute('data-focus-dev') === 'true'
  };

  let beacon = null;
  let radar = null;
  let skipLinkArrow = null;
  let devHud = null;
  let pointerX = 0;
  let pointerY = 0;
  let lastCtrlPress = 0;
  let styleElement = null;
  let updateCallback = null;
  let mqlReducedMotion = null;
  let handleMotionChange = null;
  let trailContainer = null;
  let trailBuffer = [];
  let previousRect = null;
  let lastInputMethod = 'unknown';
  let lastKeyTime = 0;
  let lastPointerTime = 0;

  function init() {
    if (beacon) return;

    beacon = document.createElement('div');
    beacon.id = 'focusbeacon-ring';

    radar = document.createElement('div');
    radar.id = 'focusbeacon-radar';

    if (config.trailLength > 0) {
      trailContainer = document.createElement('div');
      trailContainer.id = 'focusbeacon-trail';
    }

    if (config.devMode) {
      devHud = createDevHud();
    }

    styleElement = document.createElement('style');
    styleElement.textContent = `
      #focusbeacon-ring, #focusbeacon-radar, .focusbeacon-trail-halo, #focusbeacon-saccade, #focusbeacon-skip-arrow, #focusbeacon-dev-hud {
        position: fixed;
        pointer-events: none;
        z-index: 2147483647;
        box-sizing: border-box;
      }
      #focusbeacon-ring {
        border-radius: 4px;
        outline: 2px solid transparent;
        box-shadow: 0 0 0 2px #fff, 0 0 0 4px #000;
        transition: transform 0.1s ease-out, width 0.1s ease-out, height 0.1s ease-out;
        display: none;
      }
      #focusbeacon-ring.active {
        display: block;
      }
      @media (forced-colors: active) {
        #focusbeacon-ring {
          outline: 2px solid Highlight;
        }
        .focusbeacon-trail-halo {
          outline: 2px solid Highlight;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        #focusbeacon-ring {
          transition: none !important;
        }
      }
      #focusbeacon-radar {
        border-radius: 50%;
        border: 4px solid #fff;
        box-shadow: 0 0 0 4px #000 inset, 0 0 0 4px #000;
        transform: translate(-50%, -50%);
        display: none;
      }
      #focusbeacon-trail {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2147483646;
      }
      .focusbeacon-trail-halo {
        border-radius: 4px;
        outline: 2px solid transparent;
        box-shadow: 0 0 0 2px #fff, 0 0 0 4px #000;
        opacity: 0.6;
      }
      #focusbeacon-saccade {
        height: 4px;
        background: linear-gradient(90deg, #000 0%, #fff 50%, #000 100%);
        transform-origin: left center;
        border-radius: 2px;
        display: none;
      }
      #focusbeacon-skip-arrow {
        top: 16px;
        left: 16px;
        width: 48px;
        height: 48px;
        display: none;
      }
      #focusbeacon-skip-arrow.active {
        display: block;
      }
      #focusbeacon-skip-arrow svg {
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 0 0 2px #fff) drop-shadow(0 0 0 4px #000);
      }
      @media (prefers-reduced-motion: reduce) {
        #focusbeacon-skip-arrow svg {
          animation: none !important;
        }
      }
      #focusbeacon-dev-hud {
        bottom: 16px;
        right: 16px;
        min-width: 240px;
        max-width: 360px;
        padding: 12px;
        background: #000;
        color: #fff;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px;
        line-height: 1.5;
        border-radius: 4px;
        border: 2px solid #fff;
        box-shadow: 0 0 0 2px #000;
      }
      #focusbeacon-dev-hud dl {
        margin: 0;
      }
      #focusbeacon-dev-hud dt {
        color: #aaa;
        font-weight: bold;
        margin-top: 8px;
      }
      #focusbeacon-dev-hud dt:first-child {
        margin-top: 0;
      }
      #focusbeacon-dev-hud dd {
        margin: 0;
        word-break: break-word;
      }
    `;
    document.head.appendChild(styleElement);
    document.body.appendChild(beacon);
    document.body.appendChild(radar);
    if (trailContainer) document.body.appendChild(trailContainer);
    if (devHud) document.body.appendChild(devHud);
    document.body.classList.add('focusbeacon-active');

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    updateCallback = function() {
      if (beacon && beacon.classList.contains('active') && document.activeElement) {
        updateBeacon(document.activeElement);
      }
    };

    window.addEventListener('resize', updateCallback);
    document.addEventListener('scroll', updateCallback, true);

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    mqlReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    handleMotionChange = function(e) {
      if (window.FocusBeacon) {
        window.FocusBeacon.isReducedMotion = e.matches;
      }
    };

    if (mqlReducedMotion.addEventListener) {
      mqlReducedMotion.addEventListener('change', handleMotionChange);
    } else if (mqlReducedMotion.addListener) {
      mqlReducedMotion.addListener(handleMotionChange);
    }

    window.FocusBeacon = {
      isReducedMotion: mqlReducedMotion.matches,
      config: config,
      destroy: function() {
        if (beacon && beacon.parentNode) beacon.parentNode.removeChild(beacon);
        if (radar && radar.parentNode) radar.parentNode.removeChild(radar);
        if (trailContainer && trailContainer.parentNode) trailContainer.parentNode.removeChild(trailContainer);
        if (skipLinkArrow && skipLinkArrow.parentNode) skipLinkArrow.parentNode.removeChild(skipLinkArrow);
        if (devHud && devHud.parentNode) devHud.parentNode.removeChild(devHud);
        if (styleElement && styleElement.parentNode) styleElement.parentNode.removeChild(styleElement);

        document.body.classList.remove('focusbeacon-active');

        document.removeEventListener('focusin', handleFocusIn);
        document.removeEventListener('focusout', handleFocusOut);

        if (updateCallback) {
          window.removeEventListener('resize', updateCallback);
          document.removeEventListener('scroll', updateCallback, true);
        }

        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('pointerdown', handlePointerDown);

        if (mqlReducedMotion && handleMotionChange) {
          if (mqlReducedMotion.removeEventListener) {
            mqlReducedMotion.removeEventListener('change', handleMotionChange);
          } else if (mqlReducedMotion.removeListener) {
            mqlReducedMotion.removeListener(handleMotionChange);
          }
        }

        beacon = null;
        radar = null;
        trailContainer = null;
        skipLinkArrow = null;
        devHud = null;
        styleElement = null;
        updateCallback = null;
        mqlReducedMotion = null;
        handleMotionChange = null;
        trailBuffer = [];
        previousRect = null;
        delete window.FocusBeacon;
      }
    };
  }

  function createDevHud() {
    const panel = document.createElement('div');
    panel.id = 'focusbeacon-dev-hud';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'FocusBeacon developer HUD');
    panel.innerHTML = `
      <dl>
        <dt>Tag</dt><dd data-fb="tag">—</dd>
        <dt>Classes</dt><dd data-fb="classes">—</dd>
        <dt>tabIndex</dt><dd data-fb="tabindex">—</dd>
        <dt>Method</dt><dd data-fb="method">—</dd>
        <dt>Rect</dt><dd data-fb="rect">—</dd>
      </dl>
    `;
    return panel;
  }

  function updateDevHud(element) {
    if (!devHud || !element) return;

    const rect = element.getBoundingClientRect();
    devHud.querySelector('[data-fb="tag"]').textContent = element.tagName.toLowerCase();
    devHud.querySelector('[data-fb="classes"]').textContent = element.className || '—';
    devHud.querySelector('[data-fb="tabindex"]').textContent = element.hasAttribute('tabindex')
      ? element.getAttribute('tabindex')
      : 'default';
    devHud.querySelector('[data-fb="method"]').textContent = lastInputMethod;
    devHud.querySelector('[data-fb="rect"]').textContent =
      `${Math.round(rect.width)}×${Math.round(rect.height)} @ (${Math.round(rect.left)}, ${Math.round(rect.top)})`;
  }

  function hideBeacon() {
    if (beacon) beacon.classList.remove('active');
  }

  function handlePointerMove(e) {
    pointerX = e.clientX;
    pointerY = e.clientY;
  }

  function handlePointerDown() {
    lastPointerTime = Date.now();
    lastInputMethod = 'pointer';
  }

  function handleKeyDown(e) {
    if (e.key !== 'Control') {
      lastKeyTime = Date.now();
      lastInputMethod = 'keyboard';
    }

    if (e.key !== 'Control') return;

    if (document.pointerLockElement) return;

    const now = Date.now();
    if (now - lastCtrlPress < 350) {
      triggerRadar();
      lastCtrlPress = 0;
    } else {
      lastCtrlPress = now;
    }
  }

  function triggerRadar() {
    if (!radar) return;

    radar.style.display = 'block';
    radar.style.left = `${pointerX}px`;
    radar.style.top = `${pointerY}px`;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      radar.style.width = '100px';
      radar.style.height = '100px';
      radar.style.opacity = '1';

      const animation = radar.animate([
        { opacity: 1 },
        { opacity: 0 }
      ], {
        duration: 600,
        easing: 'ease-out'
      });

      animation.onfinish = () => {
        radar.style.display = 'none';
        radar.style.width = '';
        radar.style.height = '';
        radar.style.opacity = '';
      };
    } else {
      const animation = radar.animate([
        { width: '0px', height: '0px', opacity: 1 },
        { width: '150px', height: '150px', opacity: 0 }
      ], {
        duration: 600,
        easing: 'ease-out'
      });

      animation.onfinish = () => {
        radar.style.display = 'none';
      };
    }
  }

  function isFocusVisible(element) {
    if (!(element instanceof Element)) return false;
    if (supportsFocusVisible) {
      return element.matches(':focus-visible');
    }
    try {
      return element.matches(':focus-visible');
    } catch (err) {
      return true;
    }
  }

  function handleFocusIn(e) {
    if (!beacon) return;

    const target = e.target;

    if (!isFocusVisible(target)) {
      hideBeacon();
      updateSkipLinkBeacon(null);
      updateDevHud(target);
      return;
    }

    const rect = getNormalizedRect(target);

    if (config.trailLength > 0 && rect) {
      pushTrail(rect);
    }

    if (previousRect && rect) {
      const distance = rectDistance(previousRect, rect);
      if (distance > 300) {
        renderSaccade(previousRect, rect);
      }
    }

    previousRect = rect;

    updateBeacon(target, rect);
    updateSkipLinkBeacon(target);
    updateDevHud(target);
  }

  function handleFocusOut(e) {
    hideBeacon();
    updateSkipLinkBeacon(null);
  }

  function getNormalizedRect(element) {
    if (!element || element === document || element === document.body) return null;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return rect;
  }

  function updateBeacon(element, rect) {
    if (!element || element === document || element === document.body) {
      hideBeacon();
      return;
    }

    const targetRect = rect || getNormalizedRect(element);
    if (!targetRect) {
      hideBeacon();
      return;
    }

    beacon.style.width = `${targetRect.width}px`;
    beacon.style.height = `${targetRect.height}px`;
    beacon.style.transform = `translate3d(${targetRect.left}px, ${targetRect.top}px, 0)`;

    beacon.classList.add('active');
  }

  function pushTrail(rect) {
    trailBuffer.push(rect);
    if (trailBuffer.length > config.trailLength) {
      trailBuffer.shift();
    }
    renderTrail();
  }

  function renderTrail() {
    if (!trailContainer) return;
    trailContainer.innerHTML = '';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    trailBuffer.forEach((rect, index) => {
      const halo = document.createElement('div');
      halo.className = 'focusbeacon-trail-halo';
      halo.style.width = `${rect.width}px`;
      halo.style.height = `${rect.height}px`;
      halo.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
      halo.style.opacity = String(0.5 * (index + 1) / trailBuffer.length);

      trailContainer.appendChild(halo);

      if (!prefersReducedMotion) {
        const animation = halo.animate([
          { opacity: 0.5 * (index + 1) / trailBuffer.length },
          { opacity: 0 }
        ], {
          duration: 900,
          delay: index * 100,
          easing: 'ease-out',
          fill: 'forwards'
        });

        animation.onfinish = () => {
          if (halo.parentNode) halo.parentNode.removeChild(halo);
        };
      } else {
        setTimeout(() => {
          if (halo.parentNode) halo.parentNode.removeChild(halo);
        }, 900 + index * 100);
      }
    });
  }

  function rectDistance(a, b) {
    const ax = a.left + a.width / 2;
    const ay = a.top + a.height / 2;
    const bx = b.left + b.width / 2;
    const by = b.top + b.height / 2;
    return Math.hypot(ax - bx, ay - by);
  }

  function renderSaccade(fromRect, toRect) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let saccade = document.getElementById('focusbeacon-saccade');
    if (!saccade) {
      saccade = document.createElement('div');
      saccade.id = 'focusbeacon-saccade';
      document.body.appendChild(saccade);
    }

    const x1 = fromRect.left + fromRect.width / 2;
    const y1 = fromRect.top + fromRect.height / 2;
    const x2 = toRect.left + toRect.width / 2;
    const y2 = toRect.top + toRect.height / 2;
    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

    saccade.style.display = 'block';
    saccade.style.width = `${length}px`;
    saccade.style.left = `${x1}px`;
    saccade.style.top = `${y1}px`;
    saccade.style.transform = `rotate(${angle}deg)`;

    const animation = saccade.animate([
      { opacity: 1, width: '0px' },
      { opacity: 1, width: `${length}px` },
      { opacity: 0 }
    ], {
      duration: 350,
      easing: 'ease-out',
      fill: 'forwards'
    });

    animation.onfinish = () => {
      saccade.style.display = 'none';
    };
  }

  function updateSkipLinkBeacon(element) {
    const isSkipLink = element && element.tagName === 'A' &&
      typeof element.getAttribute('href') === 'string' &&
      /^#main/i.test(element.getAttribute('href'));

    if (!isSkipLink) {
      if (skipLinkArrow && skipLinkArrow.parentNode) {
        skipLinkArrow.parentNode.removeChild(skipLinkArrow);
        skipLinkArrow = null;
      }
      return;
    }

    if (!skipLinkArrow) {
      skipLinkArrow = document.createElement('div');
      skipLinkArrow.id = 'focusbeacon-skip-arrow';
      skipLinkArrow.setAttribute('aria-hidden', 'true');
      skipLinkArrow.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 19V5M12 5l-7 7m7-7l7 7" stroke="#000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 19V5M12 5l-7 7m7-7l7 7" stroke="#fff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      document.body.appendChild(skipLinkArrow);
    }

    skipLinkArrow.classList.add('active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
