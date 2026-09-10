# FocusBeacon — Implementation Plan

## Overview
FocusBeacon is an ultra-lightweight (~2KB) vanilla JavaScript accessibility engine that provides a mathematically guaranteed high-contrast dual-contour focus ring, a low-latency motion-safe Cursor Radar, and container-clipping immunity. It is designed to assist users with visual impairments such as peripheral field loss (tunnel vision), photophobia, and reduced contrast sensitivity.

## Scope Definition
### In Scope
- Dual-Contour Focus Ring (pure white inner, pure black outer) meeting WCAG 2.2 Level AAA SC 2.4.13.
- Floating DOM overlay architecture to bypass `overflow: hidden` container clipping.
- Integration with `:focus-visible` to respect mouse vs. keyboard interaction.
- Cursor Radar functionality via double-tapping `Control`.
- `prefers-reduced-motion` safe degradation for radar and animations.
- Windows High Contrast / `forced-colors` support.
- Focus Trail (breadcrumb mode) and Saccade Animation for large focus jumps.
- Skip-Link Beacon enhancement.
- Developer Accessibility HUD.
- Distribution via CDN and npm.
- GitHub Pages Demo.

### Out of Scope
- Polyfilling native `:focus-visible` for obsolete browsers (e.g., IE11).
- Overriding complex third-party iframe content styles.
- Support for mobile/touch platforms that do not use physical pointers or keyboards (although it degrades safely).
- Full application logic or focus trapping (it is a visual indicator, not a focus manager).

## Technical Architecture
FocusBeacon relies on a pooled DOM overlay model. It intercepts `focusin`, `focusout`, `pointermove`, and `keydown` events. It uses `translate3d` to position a dynamically sized beacon element over the `document.activeElement`. It also manages a separate cursor radar overlay that reacts to `Control` key double-taps.

## File Map (every file the project will contain — main lib, demo, tests)
- `focusbeacon.js`: The core library (vanilla JS).
- `focusbeacon.min.js`: Minified production bundle.
- `index.html`: The GitHub Pages demo and documentation.
- `styles.css`: Optional CSS for the demo page.
- `tests/focusbeacon.test.mjs`: Unit and integration tests.
- `package.json`: NPM package metadata and build scripts.
- `README.md`: Project documentation.
- `LICENSE`: MIT License.
- `.gitignore`: Git ignore patterns.
- `.github/workflows/build.yml`: CI/CD action for minification and testing.
- `.github/ISSUE_TEMPLATE/bug_report.md`: Issue template.
- `.github/ISSUE_TEMPLATE/feature_request.md`: Issue template.
- `.github/labels.yml`: GitHub labels configuration.
- `.github/milestones.yml`: GitHub milestones configuration.

## Implementation Phases
### Phase 1: ✅ Dual-Contour Focus Ring Core
- **Goal:** Implement the basic focus ring logic using a floating DOM element.
- **Files touched:** `focusbeacon.js`, `index.html`
- **Steps:**
  - [x] 1. Create `focusbeacon.js` and wrap logic in an IIFE.
  - [x] 2. Inject the beacon `div` into `document.body` with dual borders (white inner, black outer).
  - [x] 3. Attach `focusin` and `focusout` event listeners.
  - [x] 4. Implement `updateBeacon(element)` to sync position and size via `getBoundingClientRect()`.
- **Verification criteria:** Tabbing between buttons on the demo page shows a high-contrast ring that accurately outlines the elements.

### Phase 2: ✅ DOM Floating Overlay (overflow-clip escape)
- **Goal:** Ensure the ring escapes `overflow: hidden` containers.
- **Files touched:** `focusbeacon.js`
- **Steps:**
  - [x] 1. Ensure the beacon has `position: fixed` and `z-index: 2147483647`.
  - [x] 2. Test inside a container with `overflow: scroll` and `clip-path`.
  - [x] 3. Add `scroll` and `resize` event listeners to dynamically update the beacon's position.
- **Verification criteria:** The focus ring is fully visible and tracks the active element even within scrolling or clipped ancestor containers.

### Phase 3: ✅ focus-visible Integration
- **Goal:** Only show the beacon for keyboard navigation.
- **Files touched:** `focusbeacon.js`
- **Steps:**
  - [x] 1. Update the `focusin` listener to check if `e.target.matches(':focus-visible')`.
  - [x] 2. Hide the beacon if the element was focused via mouse click.
- **Verification criteria:** Clicking a button does not show the focus ring. Tabbing to the button shows the focus ring.

### Phase 4: ✅ Windows High Contrast / forced-colors Support
- **Goal:** Maintain visibility in High Contrast modes.
- **Files touched:** `focusbeacon.js`
- **Steps:**
  - [x] 1. Ensure the beacon uses CSS borders and outlines rather than relying solely on `box-shadow` which is stripped.
  - [x] 2. Verify transparent borders map to the system `Highlight` color if needed.
- **Verification criteria:** The beacon remains visible when forcing High Contrast mode / `forced-colors: active` in browser DevTools.

### Phase 5: ✅ Cursor Radar (double-tap Ctrl)
- **Goal:** Add hotkey-triggered cursor localization.
- **Files touched:** `focusbeacon.js`
- **Steps:**
  - [x] 1. Inject the radar `div` into `document.body`.
  - [x] 2. Track `pointermove` to cache `pointerX` and `pointerY`.
  - [x] 3. Listen for `keydown` on the `Control` key, detecting double-taps within 350ms.
  - [x] 4. Ensure `document.pointerLockElement` aborts radar activation.
  - [x] 5. Trigger an expanding concentric ripple animation using the Web Animations API.
- **Verification criteria:** Double-tapping Ctrl displays an expanding ring at the cursor's location.

### Phase 6: ✅ prefers-reduced-motion Safe Degradation
- **Goal:** Provide safe alternatives for vestibular sensitivities.
- **Files touched:** `focusbeacon.js`
- **Steps:**
  1. Add `window.matchMedia('(prefers-reduced-motion: reduce)')` listener.
  2. Modify Cursor Radar to show a static high-contrast reticle instead of a scaling ripple when reduced motion is requested.
  3. Remove smooth transition glide from the focus beacon.
- **Verification criteria:** Enabling reduced motion in OS settings removes the scaling animation and uses a static reticle for the radar, and instant teleportation for the focus ring.

### Phase 7: Focus Trail (breadcrumb mode)
- **Goal:** Provide visual history of focus navigation.
- **Files touched:** `focusbeacon.js`
- **Steps:**
  1. Parse the `data-focus-trail` attribute from the script tag.
  2. Store the last `N` focused element coordinates in a buffer.
  3. Render fading static halos at the previous positions.
- **Verification criteria:** Tabbing rapidly leaves fading trailing rings at the previous elements.

### Phase 8: Saccade Animation for Large Focus Jumps
- **Goal:** Provide directional cues for large focus movements.
- **Files touched:** `focusbeacon.js`
- **Steps:**
  1. Calculate distance between previous focus and new focus.
  2. If distance > 300px, render a rapid, brief directional line or trailing comet animation.
- **Verification criteria:** Jumping from header to footer triggers a visible directional cue.

### Phase 9: Skip-Link Beacon
- **Goal:** Highlight hidden skip-to-main-content links upon initial tab.
- **Files touched:** `focusbeacon.js`
- **Steps:**
  1. Detect focus on anchors with `href` matching `#main*` or similar patterns.
  2. Inject a persistent pulsing arrow in the top-left if activated.
- **Verification criteria:** Focusing a skip link makes it highly visible with an added directional indicator.

### Phase 10: Developer Accessibility HUD
- **Goal:** Show focus debug information.
- **Files touched:** `focusbeacon.js`
- **Steps:**
  1. Check for `data-focus-dev="true"`.
  2. If true, inject a floating panel displaying element tag, classes, tabindex, and focus method.
- **Verification criteria:** Enabling dev mode shows the HUD panel updating on focus change.

### Phase 11: Demo Page + CDN Distribution
- **Goal:** Create an interactive showcase.
- **Files touched:** `index.html`, `package.json`
- **Steps:**
  1. Build `index.html` with varied UI components (scrolling areas, modals, buttons).
  2. Prepare npm package structure.
- **Verification criteria:** The demo page successfully loads and demonstrates all FocusBeacon features.

### Phase 12: GitHub Pages + README
- **Goal:** Finalize documentation and deployment.
- **Files touched:** `README.md`, GitHub Actions
- **Steps:**
  1. Draft comprehensive README detailing clinical motivation, installation, API, and math guarantees.
  2. Configure GitHub Pages deployment.
- **Verification criteria:** The README provides clear setup instructions and clinical context.

## GitHub Project Setup
### Labels
- `bug`
- `enhancement`
- `documentation`
- `good first issue`
- `wcag-2.2`
- `focus-ring`
- `cursor-radar`
- `tunnel-vision`
- `forced-colors`
- `reduced-motion`
- `a11y`
- `low-vision`
- `keyboard-nav`

### Milestones
- `v0.1` (Core focus ring)
- `v0.2` (Cursor radar + reduced-motion)
- `v0.3` (Trail + saccade + skip-link)
- `v1.0` (Full release + CDN)

### Issue Templates
- `bug_report.md`
- `feature_request.md`
