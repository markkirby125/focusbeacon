# FocusBeacon

**A focus ring and cursor radar you cannot lose — for keyboard users with tunnel vision, photophobia, or low contrast sensitivity.**

Standard 16×16px cursors and 1px CSS focus rings vanish on high-resolution and ultrawide displays. For users with peripheral field loss, photophobia, or reduced contrast sensitivity, that means hunting for the insertion point or losing track of the active control entirely.

FocusBeacon is an ultra-lightweight vanilla JavaScript accessibility engine that draws a guaranteed-visible dual-contour focus ring and adds a motion-safe cursor radar on demand.

**[Try the interactive demo](https://markkirby125.github.io/focusbeacon/)** · **[Vision Apps](https://github.com/markkirby125/vision-apps)**

*Updated: 2026-09-10*

## Features

- **Dual-Contour Focus Ring** — pure-white inner ring, pure-black outer ring. Minimum 4.58:1 contrast against any sRGB background.
- **Overflow Escape** — detached floating overlay, so `overflow: hidden` and stacking contexts cannot clip it.
- **focus-visible Aware** — activates only on keyboard navigation, preserving standard mouse interaction.
- **Cursor Radar** — double-tap `Control` to project an expanding reticle around the cursor.
- **Focus Trail** — breadcrumb halos for recent focus history (`data-focus-trail`).
- **Saccade Animation** — directional cue for focus jumps >300px.
- **Skip-Link Beacon** — extra arrow indicator when skip-to-content links receive focus.
- **Developer Accessibility HUD** — floating debug panel with focus metadata.
- **Reduced Motion Safe** — fully respects `prefers-reduced-motion: reduce`, downgrading animations to instant, static high-contrast reticles.
- **Forced Colors Support** — retains visibility under Windows High Contrast Mode (`forced-colors: active`).

## Quick start

FocusBeacon is not yet on npm, so install from source:

```bash
git clone https://github.com/markkirby125/focusbeacon.git
cd focusbeacon
node build.js            # regenerates focusbeacon.min.js from focusbeacon.js
```

```html
<script src="focusbeacon.min.js" async></script>
```

Optional features are enabled with `data-` attributes on the same tag:

```html
<script src="focusbeacon.min.js" data-focus-trail="5" data-focus-dev="true" async></script>
```

## API: data attributes and runtime control

FocusBeacon initializes automatically when the script loads.

Optional features can be enabled via `data-` attributes on the `<script>` tag:

- `data-focus-trail="5"` — enables Focus Trail mode, leaving breadcrumb halos on the last 5 focused elements.
- `data-focus-dev="true"` — enables the Developer Accessibility HUD, displaying tag, classes, `tabindex`, input method, and bounding rect.

### Runtime control

After initialization, `window.FocusBeacon` exposes:

- `window.FocusBeacon.isReducedMotion`: boolean, reflects the current `prefers-reduced-motion` preference.
- `window.FocusBeacon.config`: the resolved configuration object.
- `window.FocusBeacon.destroy()`: removes all injected DOM elements and event listeners.

## How the contrast guarantee works

Single-color focus rings fail on some backgrounds. WCAG 2.2 Level AAA Focus Appearance (SC 2.4.13) and W3C Advisory Technique C40 recommend a dual-color focus indicator.

FocusBeacon implements a concentric **pure white (`#FFFFFF`) inner contour** paired with a **pure black (`#000000`) outer contour**. The minimum possible contrast against any arbitrary sRGB background color is **4.58:1**, exceeding the WCAG 3:1 non-text requirement by 52.7% and meeting the strict 4.5:1 text contrast standard (SC 1.4.3 Level AA). It guarantees universal visibility without light/dark mode variations.

## Browser support

FocusBeacon relies on standard DOM APIs and `:focus-visible`. It works in all modern browsers (Chrome, Firefox, Safari, Edge). It degrades safely on older browsers without polyfills.

> FocusBeacon improves focus visibility. It is not a screen reader and does not replace assistive technology.

## Contributing

Open an issue or submit a pull request. Test your changes with High Contrast mode and Reduced Motion enabled.

## Part of the Vision Apps toolkit

FocusBeacon is the focus-visibility piece of the four-tool [Vision Apps](https://github.com/markkirby125/vision-apps) accessibility kit.

| Project | What it does |
| --- | --- |
| [ChromaCalm](https://github.com/markkirby125/chromacalm) | Zero-install spectral notch filtering for photophobia, migraine and screen halation. |
| [SoftContrast](https://github.com/markkirby125/softcontrast) | Anti-halation reading palettes built on APCA and OKLCH. |
| [terminal-a11y](https://github.com/markkirby125/terminal-a11y) | Screen-reader, photophobia, braille and sensory-budget modes for the command line. |
| **FocusBeacon** *(this repo)* | High-contrast dual-contour focus ring and cursor radar for tunnel vision. |

## License

MIT License. See [LICENSE](LICENSE) for details.

## Sources

- [W3C. Understanding SC 2.4.13: Focus Appearance (WCAG 2.2, Level AAA).](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)
- [MDN. prefers-reduced-motion CSS media feature.](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
