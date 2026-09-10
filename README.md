# FocusBeacon

**FocusBeacon** is an ultra-lightweight vanilla JavaScript accessibility engine that provides a mathematically guaranteed high-contrast dual-contour focus ring and a low-latency motion-safe Cursor Radar.

## Clinical Motivation

Users with visual impairments—specifically peripheral field loss (tunnel vision from glaucoma and retinitis pigmentosa), photophobia, and reduced contrast sensitivity—face severe visual acquisition barriers in modern web applications. On high-resolution (4K/Retina) and ultrawide displays, standard 16×16px operating system cursors and subtle 1px CSS focus rings disappear from their narrow field of view.

### The WCAG 2.2 SC 2.4.13 Solution

FocusBeacon directly addresses the **WCAG 2.2 Level AAA Focus Appearance (SC 2.4.13)** requirement. Single-color focus rings inevitably fail on certain backgrounds. W3C Advisory Technique C40 recommends a dual-color focus indicator. FocusBeacon implements a concentric **Pure White (`#FFFFFF`) inner contour** paired with a **Pure Black (`#000000`) outer contour**.

### The Math Guarantee

The minimum possible contrast against *any* arbitrary sRGB background color is **4.58:1**, exceeding the WCAG 3:1 non-text requirement by 52.7%, and meeting the strict 4.5:1 text contrast standard (SC 1.4.3 Level AA). It guarantees universal visibility without the need for light/dark mode variations.

## Features

- **Dual-Contour Focus Ring:** Pure white inner and pure black outer rings.
- **Overflow Escape:** Bypasses `overflow: hidden` and stacking context clipping via a detached floating DOM overlay.
- **focus-visible Aware:** Activates only on keyboard navigation, preserving standard mouse interaction.
- **Cursor Radar:** Double-tap `Control` to project an expanding concentric reticle around the cursor.
- **Focus Trail:** Optional breadcrumb halos showing recent focus history (`data-focus-trail`).
- **Saccade Animation:** Directional cue for large focus jumps (>300px).
- **Skip-Link Beacon:** Extra arrow indicator when skip-to-content links receive focus.
- **Developer Accessibility HUD:** Floating debug panel with focus metadata.
- **Reduced Motion Safe:** Fully respects `prefers-reduced-motion: reduce`, downgrading animations to instant, static high-contrast reticles.
- **Forced Colors Support:** Retains visibility under Windows High Contrast Mode (`forced-colors: active`).

## Installation

### Via Script Tag (CDN)

```html
<script src="https://cdn.jsdelivr.net/npm/focusbeacon@1.0.0/focusbeacon.min.js" async></script>
```

### Via NPM

```bash
npm install focusbeacon
```

```javascript
import 'focusbeacon';
```

## API Reference

FocusBeacon initializes automatically when the script loads.

Optional features can be enabled via `data-` attributes on the `<script>` tag:

- `data-focus-trail="5"`: Enables Focus Trail mode, leaving breadcrumb halos on the last 5 focused elements.
- `data-focus-dev="true"`: Enables the Developer Accessibility HUD, displaying tag, classes, `tabindex`, input method, and bounding rect.

### Runtime Control

After initialization, `window.FocusBeacon` exposes:

- `window.FocusBeacon.isReducedMotion`: boolean, reflects the current `prefers-reduced-motion` preference.
- `window.FocusBeacon.config`: the resolved configuration object.
- `window.FocusBeacon.destroy()`: removes all injected DOM elements and event listeners.

## Demo

Experience FocusBeacon in action: [FocusBeacon Interactive Demo](https://markkirby125.github.io/focusbeacon/)

## Browser Support

FocusBeacon relies on standard DOM APIs and `:focus-visible`. It works in all modern browsers (Chrome, Firefox, Safari, Edge). It degrades safely on older browsers without polyfills.

## Contributing

Contributions are welcome! Please check out the issue tracker and feel free to submit pull requests. Ensure you test your changes with various accessibility features enabled (like High Contrast mode and Reduced Motion).

## License

MIT License. See [LICENSE](LICENSE) for details.

## Sources
- [W3C. Understanding SC 2.4.13: Focus Appearance (WCAG 2.2, Level AAA).](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)
- [MDN. prefers-reduced-motion CSS media feature.](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
