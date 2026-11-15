---
name: moog-ui-components
description: >
  Create, customize, and wire authentic Minimoog Model D style hardware Web Components
  (<moog-knob>, <moog-switch>, <moog-led>) for web audio synthesizers, DAW interfaces,
  and tactile control panels. Supports 6-lobe scalloped knobs, winged pointer knobs,
  360-degree endless/wrapped rotary encoders, illuminated rocker & center-locked toggle
  switches, and faceted jewel/flat LEDs. Use whenever an agent needs to build, extend,
  style, or integrate these components in HTML, ES modules, TypeScript, or Web Audio apps.
---

# Minimoog Model D Hardware Web UI Components Skill

Use this skill when creating a new audio/hardware control surface, extending `<moog-knob>` / `<moog-switch>` / `<moog-led>`, or wiring them into a web application or Web Audio synthesizer.

## 1. Repository Files & Entry Points

- `moog-knob.js` — `<moog-knob>` Custom Element (`MoogKnob`, `registerMoogKnob`)
- `moog-switch.js` — `<moog-switch>` Custom Element (`MoogSwitch`, `registerMoogSwitch`)
- `moog-led.js` — `<moog-led>` Custom Element (`MoogLed`, `registerMoogLed`)
- `moog-ui.js` — Unified ES Module barrel exporting all three components
- `moog-knob.d.ts` / `moog-ui.d.ts` — Full TypeScript definitions + `HTMLElementTagNameMap`
- `index.html` — Full self-contained Web Audio Minimoog demo + 3-tab Interactive Inspector
- `references/api-reference.md` — Complete attribute, property, event, and CSS variable reference
- `templates/synth-panel-starter.html` — Minimal copy-ready starter template

## 2. Integration Patterns

### Pattern A: ES Module Import (Vite / Modern Browsers / ESM)
```html
<script type="module" src="./moog-ui.js"></script>

<moog-knob label="CUTOFF" variant="large" min="0" max="10" value="5.5" scale-labels="0,2,4,6,8,10"></moog-knob>
<moog-knob label="RANGE" variant="pointer" detents scale-labels="LO,32',16',8',4',2'" value="2"></moog-knob>
<moog-knob label="PHASE" endless wrap min="0" max="360" step="1" unit="°" show-arc></moog-knob>
<moog-switch label="FILTER MOD" color="orange" checked></moog-switch>
<moog-switch label="POWER" variant="toggle" checked></moog-switch>
<moog-led label="OVERLOAD" color="amber" variant="jewel" on></moog-led>
```

### Pattern B: Self-Contained Single-File HTML (Offline / Sandboxed Iframe Safe)
When targeting standalone HTML previews or `sandbox="allow-scripts"` iframes with no network or relative module resolution:
1. Inline the contents of `moog-knob.js`, `moog-switch.js`, and `moog-led.js` inside a `<script>` tag (stripping `export` keywords from `export class` / `export function`).
2. Keep all CSS, SVG gradients, and `conic-gradient` metal textures inline—do **not** introduce external fonts, stylesheets, or image URLs.

### Pattern C: Web Audio API Binding
Always use exponential/logarithmic mapping for frequency parameters and `setTargetAtTime` to prevent zipper noise:
```js
const cutoffKnob = document.querySelector('#cutoff');
const toHz = (v) => 24 * Math.pow(500, v / 10); // 24 Hz .. 12 kHz
cutoffKnob.format = (v) => {
  const hz = toHz(v);
  return hz >= 1000 ? `${(hz / 1000).toFixed(2)} kHz` : `${Math.round(hz)} Hz`;
};

cutoffKnob.addEventListener('input', (e) => {
  biquadFilter.frequency.setTargetAtTime(toHz(e.detail.value), audioCtx.currentTime, 0.02);
});
```

Drive `<moog-led>` continuously from an `AnalyserNode` peak:
```js
overloadLed.on = peak > 0.25;
overloadLed.intensity = Math.min(1, peak * 2.2);
```

### Pattern D: React / Vue / Framework Integration
Web Components emit `CustomEvent`s (`input` and `change`) with `{ bubbles: true, composed: true, detail }`. In React 18 or older, attach listeners via `ref.addEventListener('input', handler)` (React 19 supports custom element events directly). Import `moog-ui.d.ts` for JSX `HTMLElementTagNameMap` typing.

## 3. Component Design & Choosing the Right Variant

### `<moog-knob>` Variants & Modes
- **`variant="large"`**: Iconic 6-lobe scalloped glossy black body + wide flared skirt + dual aligned dots + spun aluminum cap. Use for primary continuous controls (`CUTOFF`, `OSCILLATOR TUNE`, `MAIN VOLUME`).
- **`variant="pointer"`**: Winged paddle pointer body with recessed white nose stripe + rear fan-tail wing + concentric silver cap. Use for **selector switches (`detents`)** like `RANGE`, `WAVEFORM`, or `MOD SOURCE`.
- **`variant="skirtless"`**: Compact 6-lobe body without bottom skirt. Use for secondary controls (`LFO RATE`, `ATTACK`, `DECAY`, `DETUNE`).
- **Continuous Bounded Mode (default)**: `-150°` to `+150°` sweep. Add `bipolar` when zero/center is the neutral point (e.g., `-5..+5`).
- **Rotary Switch Mode (`detents`)**: Combine `detents` with `scale-labels="LO,32',16',8',4',2'"` for crisp discrete snapping.
- **Endless Encoder Mode (`endless`)**: Removes hard angle stops for infinite 360° rotation.
  - Add `wrap` with `min`/`max` (e.g., `min="0" max="360"`) for cyclic parameters.
  - Omit `wrap` and set `revolution="24"` for unbounded relative step counters (`e.detail.delta`, `e.detail.turns`).

### `<moog-switch>` Variants
- **`variant="rocker"`**: Minimoog 3D angled rocker paddle (`color`: `orange`, `blue`, `red`, `ivory`, `dark`; `orientation`: `vertical` | `horizontal`). Automatically illuminates an internal translucent LED backlight + slit when `checked`.
- **`variant="toggle"`**: Precision SVG chrome bat handle fused to a center ball joint inside a hex nut. Uses zero-drift vertical Z-plane foreshortening with crisp `95ms` ease-out snap (no overshoot) and a glowing ring backlight when `checked`.

### `<moog-led>` Variants
- **`variant="jewel"`**: Faceted cut-glass dome inside a threaded bezel (`black`, `chrome`, `brass`). Best for `OVERLOAD` / pilot lamps.
- **`variant="flat"`**: Recessed 5mm diode LED. Best for `POWER`, `GATE`, `LFO SYNC` (`blink="450"`).

## 4. Implementation Rules (When Modifying or Extending Source Code)

1. **Never parse optional numeric attributes with bare `Number(el.getAttribute(name))`**:
   `Number(null)` evaluates to `0`, which breaks negative/non-zero defaults like `min-angle="-150"`. Always use `parseNumAttr(el, name, fallback)` checking `raw === null || raw.trim() === ''`.
2. **Keep lighting stationary while geometry rotates**:
   - In `<moog-knob>`, the 6-lobe profile uses `cos(6u) + 0.25 * cos(12u) - 0.25`.
   - The `conic-gradient` brushed metal cap and panel drop shadow remain fixed to top-left studio lighting (`-135°`), while `.rot-skirt`, `.rot-body-base`, `.rot-body-top`, and panel-space `.ridge-glint` lines update with the rotation angle.
3. **Keep toggle handles fused to center `(30, 30)`**:
   Do not use CSS `translateY` + `rotate(180deg)` or overshoot `cubic-bezier(..., >1)` on toggle handles. Always render the SVG shaft anchored at `(30, 30)` and animate with `ease-out` cubic (`1 - (1 - p)^3`, ~95ms).
4. **Always validate before finishing**:
   Run `node --check` on modified `.js` files and test Shadow DOM rendering/rotation/state transitions in Node.
