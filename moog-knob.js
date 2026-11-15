/**
 * <moog-knob> — Reusable Minimoog Model D Style Rotary Knob Web Component
 *
 * High-instance-count optimized:
 *  - Shared adoptedStyleSheets (single parsed CSSStyleSheet across all instances)
 *  - Memoized 6-lobe & winged-pointer SVG geometry cache
 *  - CSS `contain: layout style paint` isolation per knob
 *  - rAF-coalesced pointermove updates & drag-scoped `will-change: transform`
 *  - Microtask-batched attribute re-renders & lazy hover/focus wheel listeners
 */

const LIGHT_ANGLE_RAD = (-135 * Math.PI) / 180;

const SIZE_MAP = {
  sm: 72,
  md: 98,
  lg: 126,
  xl: 162,
};

const VARIANT_CONFIG = {
  large: {
    rSkirt: 68,
    rBodyBasePeak: 52.5,
    rBodyBaseValley: 43.0,
    rBodyTopPeak: 47.5,
    rBodyTopValley: 39.5,
    rCap: 33.8,
    rDotTop: 41.2,
    rDotSkirt: 59.5,
    dotTopRadius: 3.1,
    dotSkirtRadius: 3.4,
    hasSkirt: true,
    skirtDot: true,
    bodyDy: 5.5,
    isWingPointer: false,
  },
  pointer: {
    rSkirt: 68,
    rHubBase: 36.0,
    rHubTop: 33.5,
    rCap: 24.5,
    rDotTop: 0,
    rDotSkirt: 0,
    hasSkirt: true,
    skirtDot: false,
    bodyDy: 5.8,
    isWingPointer: true,
  },
  skirtless: {
    rSkirt: 50,
    rBodyBasePeak: 49.0,
    rBodyBaseValley: 40.5,
    rBodyTopPeak: 44.5,
    rBodyTopValley: 37.0,
    rCap: 31.5,
    rDotTop: 38.6,
    rDotSkirt: 0,
    dotTopRadius: 3.0,
    dotSkirtRadius: 0,
    hasSkirt: false,
    skirtDot: false,
    bodyDy: 5.2,
    isWingPointer: false,
  },
};

const PATH_CACHE = new Map();

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function parseNumAttr(el, name, fallback) {
  const raw = el.getAttribute(name);
  if (raw === null || raw.trim() === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function roundToStep(val, step, base = 0) {
  if (!step || step <= 0) return val;
  const steps = Math.round((val - base) / step);
  const res = base + steps * step;
  const decimals = (String(step).split('.')[1] || '').length;
  return Number(res.toFixed(Math.min(decimals + 2, 8)));
}

function wrapValue(val, min, max) {
  const span = max - min;
  if (span <= 0) return min;
  const mod = (((val - min) % span) + span) % span;
  return min + mod;
}

function polar(cx, cy, r, rad) {
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function getScallopedPath(cx, cy, rPeak, rValley, samples = 120) {
  const key = `s:${cx}:${cy}:${rPeak}:${rValley}:${samples}`;
  let cached = PATH_CACHE.get(key);
  if (cached) return cached;

  const rMid = (rPeak + rValley) / 2;
  const amp = (rPeak - rValley) / 2;
  const pts = new Array(samples + 1);
  for (let i = 0; i < samples; i++) {
    const u = (i / samples) * Math.PI * 2;
    const harmonic = Math.cos(6 * u) + 0.25 * Math.cos(12 * u) - 0.25;
    const r = rMid + amp * harmonic;
    const theta = u - Math.PI / 2;
    const [x, y] = polar(cx, cy, r, theta);
    pts[i] = `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }
  pts[samples] = 'Z';
  cached = pts.join(' ');
  PATH_CACHE.set(key, cached);
  return cached;
}

function getWingPointerPath(cx, cy, rHub, scale = 1) {
  const key = `w:${cx}:${cy}:${rHub}:${scale}`;
  let cached = PATH_CACHE.get(key);
  if (cached) return cached;

  const noseTipY = cy - 60.5 * scale;
  const noseTopY = cy - 57.5 * scale;
  const noseHalfTip = 7.2 * scale;
  const noseHalfBase = 9.0 * scale;
  const noseJoinY = cy - Math.sqrt(Math.max(1, rHub * rHub - noseHalfBase * noseHalfBase));
  const wingJoinX = rHub * 0.905;
  const wingJoinY = cy + rHub * 0.425;
  const wingCornerX = 25.5 * scale;
  const wingCornerY = cy + 41.5 * scale;
  const wingBackX = 19.5 * scale;
  const wingBackY = cy + 46.8 * scale;
  const wingCenterBackY = cy + 49.0 * scale;

  cached = [
    `M${(cx - noseHalfTip).toFixed(2)},${noseTopY.toFixed(2)}`,
    `Q${cx.toFixed(2)},${(noseTipY - 2.5 * scale).toFixed(2)} ${(cx + noseHalfTip).toFixed(2)},${noseTopY.toFixed(2)}`,
    `L${(cx + noseHalfBase).toFixed(2)},${noseJoinY.toFixed(2)}`,
    `A${rHub},${rHub} 0 0 1 ${(cx + wingJoinX).toFixed(2)},${wingJoinY.toFixed(2)}`,
    `C${(cx + rHub * 0.88).toFixed(2)},${(cy + 27 * scale).toFixed(2)} ${(cx + wingCornerX * 1.03).toFixed(2)},${(cy + 34 * scale).toFixed(2)} ${(cx + wingCornerX).toFixed(2)},${wingCornerY.toFixed(2)}`,
    `Q${(cx + wingCornerX).toFixed(2)},${wingBackY.toFixed(2)} ${(cx + wingBackX).toFixed(2)},${wingBackY.toFixed(2)}`,
    `Q${cx.toFixed(2)},${wingCenterBackY.toFixed(2)} ${(cx - wingBackX).toFixed(2)},${wingBackY.toFixed(2)}`,
    `Q${(cx - wingCornerX).toFixed(2)},${wingBackY.toFixed(2)} ${(cx - wingCornerX).toFixed(2)},${wingCornerY.toFixed(2)}`,
    `C${(cx - wingCornerX * 1.03).toFixed(2)},${(cy + 34 * scale).toFixed(2)} ${(cx - rHub * 0.88).toFixed(2)},${(cy + 27 * scale).toFixed(2)} ${(cx - wingJoinX).toFixed(2)},${wingJoinY.toFixed(2)}`,
    `A${rHub},${rHub} 0 0 1 ${(cx - noseHalfBase).toFixed(2)},${noseJoinY.toFixed(2)}`,
    'Z',
  ].join(' ');
  PATH_CACHE.set(key, cached);
  return cached;
}

function buildArcPath(cx, cy, r, startDeg, endDeg) {
  const diff = endDeg - startDeg;
  if (Math.abs(diff) < 0.01) return '';
  if (Math.abs(diff) >= 359.9) {
    return `M${cx},${cy - r} A${r},${r} 0 1 1 ${cx - 0.01},${cy - r}`;
  }
  const startRad = ((startDeg - 90) * Math.PI) / 180;
  const endRad = ((endDeg - 90) * Math.PI) / 180;
  const [x1, y1] = polar(cx, cy, r, startRad);
  const [x2, y2] = polar(cx, cy, r, endRad);
  const largeArc = Math.abs(diff) > 180 ? 1 : 0;
  const sweep = diff > 0 ? 1 : 0;
  return `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${largeArc} ${sweep} ${x2.toFixed(2)},${y2.toFixed(2)}`;
}

const KNOB_CSS_TEXT = `
  :host {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    user-select: none;
    -webkit-user-select: none;
    vertical-align: top;
    contain: layout style paint;
    --moog-label-color: #e8e6df;
    --moog-tick-color: rgba(236, 234, 226, 0.85);
    --moog-tick-minor-color: rgba(236, 234, 226, 0.42);
    --moog-accent-color: #f59e0b;
    --moog-value-bg: rgba(10, 10, 12, 0.72);
    --moog-value-color: #f3efe4;
    --moog-font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    --moog-mono-font: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
    font-family: var(--moog-font-family);
  }
  :host([disabled]) { opacity: 0.48; pointer-events: none; }
  .wrap { display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .knob-label {
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.11em;
    text-transform: uppercase; color: var(--moog-label-color);
    text-align: center; line-height: 1.25; max-width: var(--_label-max, 180px);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }
  .dial-stage {
    position: relative; width: var(--_widget-w, 145px); height: var(--_widget-w, 145px);
    cursor: ns-resize; touch-action: pan-y; outline: none; border-radius: 50%;
  }
  .skirt-base, .rot-skirt, .rot-body-base, .rot-body-top { touch-action: none; }
  .dial-stage.is-active .rot-skirt,
  .dial-stage.is-active .rot-body-base,
  .dial-stage.is-active .rot-body-top { will-change: transform; }
  :host([drag-mode="circular"]) .dial-stage { cursor: grab; }
  :host([drag-mode="circular"]) .dial-stage.is-active { cursor: grabbing; }
  .dial-stage:focus-visible {
    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.7), 0 0 14px rgba(245, 158, 11, 0.35);
  }
  svg.knob-svg { width: 100%; height: 100%; display: block; overflow: visible; }
  .tick-major { stroke: var(--moog-tick-color); stroke-width: 1.85; stroke-linecap: round; }
  .tick-major.tick-center { stroke: var(--moog-accent-color); stroke-width: 2.3; }
  .tick-minor { stroke: var(--moog-tick-minor-color); stroke-width: 1.2; stroke-linecap: round; }
  .scale-label {
    fill: var(--moog-tick-color); font-size: 11px; font-weight: 600;
    letter-spacing: 0.02em; text-anchor: middle; dominant-baseline: central;
    font-family: var(--moog-font-family);
  }
  .arc-track { fill: none; stroke: rgba(255, 255, 255, 0.1); stroke-width: 3; stroke-linecap: round; }
  .arc-fill { fill: none; stroke: var(--moog-accent-color); stroke-width: 3; stroke-linecap: round; }
  .ridge-glint { stroke: rgba(255, 255, 255, 0.72); stroke-width: 2.6; stroke-linecap: round; pointer-events: none; }
  .cap-disc {
    position: absolute; left: var(--_cap-left); top: var(--_cap-top);
    width: var(--_cap-diam); height: var(--_cap-diam);
    border-radius: 50%; pointer-events: none; box-sizing: border-box;
    box-shadow: inset 0 1px 1.5px rgba(255,255,255,0.55), inset 0 -1.5px 2.5px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.85);
  }
  .cap-disc.cap-silver {
    background:
      repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 0px, rgba(0,0,0,0.055) 1px, transparent 2px),
      conic-gradient(from -38deg, #cfd4d9 0deg, #f7f9fb 26deg, #949ba3 66deg, #777e86 98deg, #c7cdd3 145deg, #f4f7fa 188deg, #8f969e 232deg, #727980 266deg, #c3c9cf 314deg, #cfd4d9 360deg);
  }
  .cap-disc.cap-brass {
    background:
      repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.055) 0px, rgba(0,0,0,0.055) 1px, transparent 2px),
      conic-gradient(from -38deg, #c9a65b 0deg, #f6e3a8 26deg, #8c6f32 66deg, #6e5420 98deg, #bfa054 145deg, #f2dc9b 188deg, #886a2f 232deg, #664e1c 266deg, #ba994e 314deg, #c9a65b 360deg);
  }
  .cap-disc.cap-black {
    background:
      repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.035) 0px, rgba(0,0,0,0.08) 1px, transparent 2px),
      conic-gradient(from -38deg, #2a2c30 0deg, #464950 26deg, #1b1c20 66deg, #141518 98deg, #27292e 145deg, #41444a 188deg, #191a1e 232deg, #121316 266deg, #25272b 314deg, #2a2c30 360deg);
    box-shadow: inset 0 1px 1.5px rgba(255,255,255,0.16), inset 0 -1.5px 2.5px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,0,0,0.95);
  }
  .cap-disc::after {
    content: ''; position: absolute; inset: 0; border-radius: 50%;
    background: radial-gradient(circle at 36% 32%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 58%, rgba(0,0,0,0.16) 100%);
  }
  .knob-value {
    font-family: var(--moog-mono-font); font-size: 11px; font-weight: 600;
    color: var(--moog-value-color); background: var(--moog-value-bg);
    border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px;
    padding: 1.5px 7px; min-width: 48px; text-align: center; letter-spacing: 0.03em;
  }
  .dial-stage.is-active ~ .knob-value,
  .dial-stage:focus-visible ~ .knob-value { border-color: rgba(245, 158, 11, 0.6); }
  .knob-value.only-hover { opacity: 0; transition: opacity 150ms ease; }
  .wrap:hover .knob-value.only-hover,
  .dial-stage.is-active ~ .knob-value.only-hover,
  .dial-stage:focus-visible ~ .knob-value.only-hover { opacity: 1; }
`;

let sharedKnobSheet = null;
function getKnobSheet() {
  if (!sharedKnobSheet && typeof CSSStyleSheet !== 'undefined') {
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(KNOB_CSS_TEXT);
      sharedKnobSheet = sheet;
    } catch (_) {
      sharedKnobSheet = null;
    }
  }
  return sharedKnobSheet;
}

export class MoogKnob extends HTMLElement {
  static get observedAttributes() {
    return [
      'value',
      'min',
      'max',
      'step',
      'default-value',
      'label',
      'label-position',
      'unit',
      'size',
      'variant',
      'cap',
      'dot-color',
      'bipolar',
      'endless',
      'wrap',
      'revolution',
      'ticks',
      'minor-ticks',
      'scale-labels',
      'detents',
      'min-angle',
      'max-angle',
      'drag-mode',
      'sensitivity',
      'wheel',
      'show-value',
      'show-arc',
      'disabled',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this._value = 0;
    this._continuousValue = 0;
    this._defaultValue = null;
    this._dragging = false;
    this._dragStartY = 0;
    this._dragStartValue = 0;
    this._dragStartContinuous = 0;
    this._prevCircularAngle = 0;
    this._formatFn = null;
    this._reflectingValue = false;
    this._renderPending = false;
    this._moveRaf = null;
    this._pendingPointerEvent = null;
    this._lastRenderedDeg = NaN;
    this._uid = `mk-${Math.random().toString(36).slice(2, 9)}`;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onDblClick = this._onDblClick.bind(this);
    this._onWheel = this._onWheel.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onEngageWheel = this._onEngageWheel.bind(this);
    this._onDisengageWheel = this._onDisengageWheel.bind(this);

    this._rendered = false;
  }

  connectedCallback() {
    if (this._defaultValue === null) {
      if (this.hasAttribute('default-value')) {
        this._defaultValue = Number(this.getAttribute('default-value'));
      } else if (this.bipolar && !this.endless) {
        this._defaultValue = (this.min + this.max) / 2;
      } else if (this.hasAttribute('value')) {
        this._defaultValue = Number(this.getAttribute('value'));
      } else {
        this._defaultValue = this.min;
      }
    }

    const initial = this.hasAttribute('value') ? Number(this.getAttribute('value')) : this._defaultValue;
    this._value = this._sanitize(initial);
    this._continuousValue = Number.isFinite(initial) ? initial : this._value;

    this._render();
    this._updateVisuals();
  }

  disconnectedCallback() {
    this._cleanupDragListeners();
    this._onDisengageWheel();
    if (this._moveRaf) cancelAnimationFrame(this._moveRaf);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;

    if (name === 'value') {
      if (!this._rendered || this._reflectingValue) return;
      const rawNum = Number(newVal);
      const next = this._sanitize(rawNum);
      if (next !== this._value) {
        this._value = next;
        this._continuousValue = next;
        this._updateVisuals();
      }
      return;
    }

    if (name === 'default-value') {
      this._defaultValue = newVal !== null ? Number(newVal) : null;
    }

    if (this._rendered) {
      this._value = this._sanitize(this._value);
      this._scheduleRender();
    }
  }

  _scheduleRender() {
    if (this._renderPending) return;
    this._renderPending = true;
    queueMicrotask(() => {
      this._renderPending = false;
      if (!this.isConnected) return;
      this._value = this._sanitize(this._value);
      this._render();
      this._updateVisuals();
    });
  }

  get value() {
    return this._value;
  }
  set value(v) {
    const num = Number(v);
    const next = this._sanitize(num);
    if (next !== this._value) {
      this._value = next;
      this._continuousValue = next;
      this._reflectValueAttr(next);
      if (this._rendered) this._updateVisuals();
    }
  }

  _reflectValueAttr(val) {
    this._reflectingValue = true;
    this.setAttribute('value', String(val));
    this._reflectingValue = false;
  }

  get min() {
    const dets = this._getDetentLabels();
    if (dets && !this.hasAttribute('min')) return 0;
    return parseNumAttr(this, 'min', 0);
  }
  set min(v) { this.setAttribute('min', String(v)); }

  get max() {
    const dets = this._getDetentLabels();
    if (dets && !this.hasAttribute('max')) return Math.max(0, dets.length - 1);
    return parseNumAttr(this, 'max', 10);
  }
  set max(v) { this.setAttribute('max', String(v)); }

  get step() {
    if (this.hasAttribute('detents')) {
      const detVal = this.getAttribute('detents');
      const n = Number(detVal);
      if (Number.isFinite(n) && n > 1) return (this.max - this.min) / (n - 1);
      return 1;
    }
    const v = parseNumAttr(this, 'step', this.endless ? 1 : 0.01);
    return v > 0 ? v : 0.01;
  }
  set step(v) { this.setAttribute('step', String(v)); }

  get defaultValue() {
    if (this._defaultValue !== null && Number.isFinite(this._defaultValue)) {
      return this._sanitize(this._defaultValue);
    }
    return this.bipolar && !this.endless ? this._sanitize((this.min + this.max) / 2) : this.min;
  }
  set defaultValue(v) {
    this._defaultValue = Number(v);
    this.setAttribute('default-value', String(v));
  }

  get bipolar() { return this.hasAttribute('bipolar') && this.getAttribute('bipolar') !== 'false'; }
  set bipolar(flag) { if (flag) this.setAttribute('bipolar', ''); else this.removeAttribute('bipolar'); }

  get endless() { return this.hasAttribute('endless') && this.getAttribute('endless') !== 'false'; }
  set endless(flag) { if (flag) this.setAttribute('endless', ''); else this.removeAttribute('endless'); }

  get wrap() { return this.hasAttribute('wrap') && this.getAttribute('wrap') !== 'false'; }
  set wrap(flag) { if (flag) this.setAttribute('wrap', ''); else this.removeAttribute('wrap'); }

  get revolution() {
    const custom = parseNumAttr(this, 'revolution', 0);
    if (custom > 0) return custom;
    const span = this.max - this.min;
    return span > 0 ? span : 24;
  }
  set revolution(v) { this.setAttribute('revolution', String(v)); }

  get disabled() { return this.hasAttribute('disabled') && this.getAttribute('disabled') !== 'false'; }
  set disabled(flag) { if (flag) this.setAttribute('disabled', ''); else this.removeAttribute('disabled'); }

  get variant() {
    const v = this.getAttribute('variant');
    return VARIANT_CONFIG[v] ? v : 'large';
  }
  set variant(v) { this.setAttribute('variant', v); }

  get cap() {
    const c = this.getAttribute('cap');
    return c === 'brass' || c === 'black' ? c : 'silver';
  }
  set cap(c) { this.setAttribute('cap', c); }

  get format() { return this._formatFn; }
  set format(fn) {
    this._formatFn = typeof fn === 'function' ? fn : null;
    if (this._rendered) this._updateVisuals(true);
  }

  get normalized() {
    const span = this.max - this.min;
    if (span <= 0) return 0;
    if (this.endless && !this.wrap) {
      const rev = this.revolution;
      return (((this._continuousValue - this.min) % rev) + rev) % rev / rev;
    }
    return clamp((this._value - this.min) / span, 0, 1);
  }

  get turns() {
    if (!this.endless) return 0;
    return Math.floor((this._continuousValue - this.min) / this.revolution);
  }

  get formattedValue() {
    const dets = this._getDetentLabels();
    if (dets && this.hasAttribute('detents')) {
      const idx = Math.round(this.normalized * (dets.length - 1));
      if (dets[idx] !== undefined) return dets[idx];
    }
    if (this._formatFn) return String(this._formatFn(this._value));
    const unit = this.getAttribute('unit') || '';
    const step = this.step;
    const dec = step >= 1 ? 0 : Math.min(2, (String(step).split('.')[1] || '').length);
    const numStr = this._value.toFixed(dec);
    const signed = (this.bipolar || (this.endless && !this.wrap)) && this._value > 0 ? `+${numStr}` : numStr;
    return unit ? `${signed}${unit.startsWith('°') ? '' : ' '}${unit}` : signed;
  }

  reset() {
    const def = this.defaultValue;
    this._continuousValue = def;
    this._commitValue(def, true);
  }

  _getSizePx() {
    const raw = this.getAttribute('size') || 'md';
    if (SIZE_MAP[raw]) return SIZE_MAP[raw];
    const n = Number(raw);
    return Number.isFinite(n) && n >= 36 ? n : SIZE_MAP.md;
  }

  _getMinAngle() { return parseNumAttr(this, 'min-angle', -150); }
  _getMaxAngle() { return parseNumAttr(this, 'max-angle', 150); }

  _getScaleLabels() {
    const raw = this.getAttribute('scale-labels');
    if (!raw) return null;
    try {
      if (raw.trim().startsWith('[')) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(String);
      }
    } catch (_) {}
    return raw.split(',').map((s) => s.trim());
  }

  _getDetentLabels() {
    if (!this.hasAttribute('detents')) return null;
    const labels = this._getScaleLabels();
    if (labels && labels.length > 1) return labels;
    const n = Number(this.getAttribute('detents'));
    if (Number.isFinite(n) && n > 1) return Array.from({ length: n }, (_, i) => String(i + 1));
    return null;
  }

  _sanitize(v) {
    if (!Number.isFinite(v)) return this.min;
    if (this.endless) {
      if (this.wrap) {
        const wrapped = wrapValue(v, this.min, this.max);
        const rounded = roundToStep(wrapped, this.step, this.min);
        return rounded >= this.max ? this.min : rounded;
      }
      return roundToStep(v, this.step, 0);
    }
    const clamped = clamp(v, this.min, this.max);
    return clamp(roundToStep(clamped, this.step, this.min), this.min, this.max);
  }

  _valueToAngle(val) {
    if (this.endless) {
      return ((this._continuousValue - this.min) / this.revolution) * 360;
    }
    const minA = this._getMinAngle();
    const maxA = this._getMaxAngle();
    const span = this.max - this.min;
    if (span <= 0) return minA;
    const norm = clamp((val - this.min) / span, 0, 1);
    return minA + norm * (maxA - minA);
  }

  _setValueInternal(nextVal, emitInput = true) {
    const prev = this._value;
    if (this.endless) {
      this._continuousValue = roundToStep(nextVal, this.step, this.wrap ? this.min : 0);
    }
    const sanitized = this._sanitize(nextVal);
    if (sanitized === prev && !this.endless) return false;
    const delta = sanitized - prev;
    if (this.endless && delta === 0) return false;

    this._value = sanitized;
    if (!this.endless) this._continuousValue = sanitized;
    this._reflectValueAttr(sanitized);
    this._updateVisuals();
    if (emitInput) this._emit('input', delta);
    return true;
  }

  _commitValue(nextVal, emitBoth = false) {
    const prev = this._value;
    const changed = this._setValueInternal(nextVal, emitBoth);
    if (changed || emitBoth) this._emit('change', this._value - prev);
  }

  _emit(type, delta = 0) {
    this.dispatchEvent(
      new CustomEvent(type, {
        bubbles: true,
        composed: true,
        detail: {
          value: this._value,
          delta,
          turns: this.turns,
          angle: this._valueToAngle(this._value),
          normalized: this.normalized,
          formatted: this.formattedValue,
        },
      })
    );
  }

  _onPointerDown(e) {
    if (this.disabled || e.button > 0) return;
    e.preventDefault();
    this._dialEl.focus({ preventScroll: true });

    this._dragging = true;
    this._dragStartY = e.clientY;
    this._dragStartValue = this._value;
    this._dragStartContinuous = this._continuousValue;
    this._dragMoved = false;
    this._dialEl.classList.add('is-active');

    try { this._dialEl.setPointerCapture(e.pointerId); } catch (_) {}

    if (e.altKey) {
      this.reset();
      return;
    }

    if (this.getAttribute('drag-mode') === 'circular') {
      if (this.endless) this._prevCircularAngle = this._pointerAngleDeg(e);
      else this._applyCircularPointer(e);
    }

    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerUp);
  }

  _pointerAngleDeg(e) {
    const rect = this._dialEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let deg = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90;
    if (deg > 180) deg -= 360;
    return deg;
  }

  _onPointerMove(e) {
    if (!this._dragging) return;
    this._dragMoved = true;
    this._pendingPointerEvent = { clientX: e.clientX, clientY: e.clientY, shiftKey: e.shiftKey };

    if (typeof requestAnimationFrame === 'undefined') {
      this._flushPointerMove();
      return;
    }
    if (!this._moveRaf) {
      this._moveRaf = requestAnimationFrame(() => {
        this._moveRaf = null;
        this._flushPointerMove();
      });
    }
  }

  _flushPointerMove() {
    if (!this._dragging || !this._pendingPointerEvent) return;
    const ev = this._pendingPointerEvent;
    this._pendingPointerEvent = null;

    if (this.getAttribute('drag-mode') === 'circular') {
      this._applyCircularPointer(ev);
      return;
    }

    const baseSens = parseNumAttr(this, 'sensitivity', 170);
    const sens = ev.shiftKey ? baseSens * 6 : baseSens;
    const dy = this._dragStartY - ev.clientY;
    const span = this.endless ? this.revolution : this.max - this.min;
    const delta = (dy / sens) * span;
    const base = this.endless ? this._dragStartContinuous : this._dragStartValue;
    this._setValueInternal(base + delta, true);
  }

  _applyCircularPointer(e) {
    const deg = this._pointerAngleDeg(e);
    if (this.endless) {
      let diff = deg - this._prevCircularAngle;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      this._prevCircularAngle = deg;
      const valDelta = (diff / 360) * this.revolution;
      this._setValueInternal(this._continuousValue + valDelta, true);
      return;
    }
    const minA = this._getMinAngle();
    const maxA = this._getMaxAngle();
    const clampedDeg = clamp(deg, minA, maxA);
    const norm = (clampedDeg - minA) / (maxA - minA);
    this._setValueInternal(this.min + norm * (this.max - this.min), true);
  }

  _onPointerUp(e) {
    if (!this._dragging) return;
    if (this._moveRaf) {
      cancelAnimationFrame(this._moveRaf);
      this._moveRaf = null;
    }
    this._flushPointerMove();
    this._dragging = false;
    this._dialEl.classList.remove('is-active');
    try { this._dialEl.releasePointerCapture(e.pointerId); } catch (_) {}
    this._cleanupDragListeners();
    if (this._dragMoved && this._value !== this._dragStartValue) {
      this._emit('change', this._value - this._dragStartValue);
    }
  }

  _cleanupDragListeners() {
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerUp);
  }

  _onEngageWheel() {
    if (this._dialEl && !this._wheelBound) {
      this._wheelBound = true;
      this._dialEl.addEventListener('wheel', this._onWheel, { passive: false });
    }
  }

  _onDisengageWheel() {
    if (this._dialEl && this._wheelBound) {
      this._wheelBound = false;
      this._dialEl.removeEventListener('wheel', this._onWheel);
    }
  }

  _onDblClick(e) {
    if (this.disabled) return;
    e.preventDefault();
    this.reset();
  }

  _onWheel(e) {
    if (this.disabled || this.getAttribute('wheel') === 'false') return;
    e.preventDefault();
    const dir = e.deltaY < 0 ? 1 : -1;
    const span = this.endless ? this.revolution : this.max - this.min;
    const baseIncrement = this.hasAttribute('detents')
      ? this.step
      : Math.max(this.step, span / (e.shiftKey ? 200 : 45));
    const prev = this._value;
    const base = this.endless ? this._continuousValue : this._value;
    this._setValueInternal(base + dir * baseIncrement, true);
    if (this._value !== prev) {
      clearTimeout(this._wheelCommitTimer);
      this._wheelCommitTimer = setTimeout(() => this._emit('change', this._value - prev), 160);
    }
  }

  _onKeyDown(e) {
    if (this.disabled) return;
    const span = this.endless ? this.revolution : this.max - this.min;
    const isDetent = this.hasAttribute('detents');
    const fineStep = isDetent ? this.step : Math.max(this.step, span / 100);
    const normalStep = isDetent ? this.step : Math.max(this.step, span / 25);
    const coarseStep = isDetent ? this.step : Math.max(this.step, span / 8);
    const delta = e.shiftKey ? fineStep : normalStep;

    let handled = true;
    const base = this.endless ? this._continuousValue : this._value;
    let next = base;
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight': next = base + delta; break;
      case 'ArrowDown':
      case 'ArrowLeft': next = base - delta; break;
      case 'PageUp': next = base + coarseStep; break;
      case 'PageDown': next = base - coarseStep; break;
      case 'Home': next = this.min; break;
      case 'End': next = this.endless ? base + this.revolution : this.max; break;
      default: handled = false;
    }

    if (handled) {
      e.preventDefault();
      this._commitValue(next, true);
    }
  }

  _render() {
    const cfg = VARIANT_CONFIG[this.variant];
    const sizePx = this._getSizePx();
    const dotColor = this.getAttribute('dot-color') || '#f3f3ef';
    const label = this.getAttribute('label') || '';
    const labelPos = this.getAttribute('label-position') === 'bottom' ? 'bottom' : 'top';
    const showValueMode = this.getAttribute('show-value') || 'always';
    const showArc = this.hasAttribute('show-arc') && this.getAttribute('show-arc') !== 'false';
    const capType = this.cap;
    const isEndless = this.endless;

    const minA = isEndless ? 0 : this._getMinAngle();
    const maxA = isEndless ? 360 : this._getMaxAngle();
    const cx = 110;
    const cy = 110;
    const bodyCy = cy - 2;
    const baseCy = bodyCy + cfg.bodyDy;

    const labels = this._getScaleLabels();
    const tickCountAttr = this.getAttribute('ticks');
    const majorCount = labels
      ? labels.length
      : tickCountAttr !== null
        ? Math.max(0, parseNumAttr(this, 'ticks', isEndless ? 12 : 11))
        : isEndless ? 12 : 11;
    const minorPerGap = this.hasAttribute('detents')
      ? 0
      : Math.max(0, parseNumAttr(this, 'minor-ticks', 1));

    let ticksSvg = '';
    if (majorCount > 1) {
      const rTickIn = cfg.hasSkirt ? 74 : 58;
      const rTickOutMajor = cfg.hasSkirt ? 83 : 67;
      const rTickOutMinor = cfg.hasSkirt ? 78.5 : 62.5;
      const rLabel = cfg.hasSkirt ? 96 : 80;
      const denom = isEndless ? majorCount : majorCount - 1;

      for (let i = 0; i < majorCount; i++) {
        const t = i / denom;
        const deg = minA + t * (maxA - minA);
        const rad = ((deg - 90) * Math.PI) / 180;
        const [x1, y1] = polar(cx, cy, rTickIn, rad);
        const [x2, y2] = polar(cx, cy, rTickOutMajor, rad);
        const isCenterBipolar = !isEndless && this.bipolar && Math.abs(deg) < 1;
        ticksSvg += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="tick-major ${isCenterBipolar ? 'tick-center' : ''}" />`;

        if (labels && labels[i] !== undefined) {
          const [lx, ly] = polar(cx, cy, rLabel, rad);
          ticksSvg += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" class="scale-label">${this._escapeHtml(labels[i])}</text>`;
        }

        if (minorPerGap > 0 && (isEndless || i < majorCount - 1)) {
          for (let m = 1; m <= minorPerGap; m++) {
            const mt = (i + m / (minorPerGap + 1)) / denom;
            const mdeg = minA + mt * (maxA - minA);
            const mrad = ((mdeg - 90) * Math.PI) / 180;
            const [mx1, my1] = polar(cx, cy, rTickIn, mrad);
            const [mx2, my2] = polar(cx, cy, rTickOutMinor, mrad);
            ticksSvg += `<line x1="${mx1.toFixed(1)}" y1="${my1.toFixed(1)}" x2="${mx2.toFixed(1)}" y2="${my2.toFixed(1)}" class="tick-minor" />`;
          }
        }
      }
    }

    let basePathD = '';
    let topPathD = '';
    let ridgeHighlightsSvg = '';
    let topIndicatorSvg = '';

    if (cfg.isWingPointer) {
      basePathD = getWingPointerPath(cx, baseCy, cfg.rHubBase, 1.03);
      topPathD = getWingPointerPath(cx, bodyCy, cfg.rHubTop, 1.0);
      const stripeW = 4.2;
      const stripeTopY = bodyCy - 59.0;
      const stripeBotY = bodyCy - cfg.rCap - 1.5;
      topIndicatorSvg = `
        <rect x="${(cx - stripeW / 2).toFixed(2)}" y="${stripeTopY.toFixed(2)}" width="${stripeW}" height="${(stripeBotY - stripeTopY).toFixed(2)}" rx="1.6" fill="${this._escapeHtml(dotColor)}" stroke="rgba(0,0,0,0.65)" stroke-width="0.6" />
      `;
      ridgeHighlightsSvg = `
        <line class="pointer-nose-bevel" x1="${cx}" y1="${(bodyCy - 59.0).toFixed(2)}" x2="${cx}" y2="${(baseCy - 60.5).toFixed(2)}" stroke="${this._escapeHtml(dotColor)}" stroke-width="3.6" stroke-linecap="round" opacity="0.88" />
      `;
    } else {
      basePathD = getScallopedPath(cx, baseCy, cfg.rBodyBasePeak, cfg.rBodyBaseValley);
      topPathD = getScallopedPath(cx, bodyCy, cfg.rBodyTopPeak, cfg.rBodyTopValley);
      for (let i = 0; i < 6; i++) {
        ridgeHighlightsSvg += `<line class="ridge-glint" data-lobe="${i}" x1="0" y1="0" x2="0" y2="0" />`;
      }
      topIndicatorSvg = `
        <circle cx="${cx}" cy="${bodyCy - cfg.rDotTop}" r="${cfg.dotTopRadius}" fill="${this._escapeHtml(dotColor)}" stroke="rgba(0,0,0,0.75)" stroke-width="0.7" />
      `;
    }

    const capDiamPct = (((cfg.rCap * 2) / 220) * 100).toFixed(3) + '%';
    const capLeftPct = (((cx - cfg.rCap) / 220) * 100).toFixed(3) + '%';
    const capTopPct = (((bodyCy - cfg.rCap) / 220) * 100).toFixed(3) + '%';
    const widgetWidth = Math.round(sizePx * 1.48);

    const uid = this._uid;
    const labelHtml = label ? `<div class="knob-label">${this._escapeHtml(label)}</div>` : '';
    const valueHtml = showValueMode !== 'never'
      ? `<div class="knob-value ${showValueMode === 'hover' ? 'only-hover' : ''}" part="value"></div>`
      : '';

    const sheet = getKnobSheet();
    const useAdopted = sheet && this.shadowRoot.adoptedStyleSheets !== undefined;

    this.shadowRoot.innerHTML = `
      ${useAdopted ? '' : `<style>${KNOB_CSS_TEXT}</style>`}
      <div class="wrap" style="--_widget-w:${widgetWidth}px;--_label-max:${widgetWidth + 16}px;--_cap-left:${capLeftPct};--_cap-top:${capTopPct};--_cap-diam:${capDiamPct};">
        ${labelPos === 'top' ? labelHtml : ''}
        <div
          class="dial-stage"
          role="slider"
          tabindex="${this.disabled ? '-1' : '0'}"
          aria-label="${this._escapeHtml(label || 'Rotary Knob')}"
          aria-valuemin="${this.min}"
          aria-valuemax="${this.max}"
          aria-valuenow="${this._value}"
        >
          <svg class="knob-svg" viewBox="0 0 220 220" aria-hidden="true">
            <defs>
              <radialGradient id="${uid}-shadow" cx="50%" cy="50%" r="50%">
                <stop offset="62%" stop-color="#000000" stop-opacity="0.82" />
                <stop offset="86%" stop-color="#000000" stop-opacity="0.38" />
                <stop offset="100%" stop-color="#000000" stop-opacity="0" />
              </radialGradient>
              <radialGradient id="${uid}-skirt-grad" cx="38%" cy="34%" r="65%">
                <stop offset="0%" stop-color="#3c3f45" />
                <stop offset="45%" stop-color="#191a1d" />
                <stop offset="82%" stop-color="#0a0a0c" />
                <stop offset="100%" stop-color="#1e2024" />
              </radialGradient>
              <linearGradient id="${uid}-skirt-rim" x1="15%" y1="10%" x2="85%" y2="90%">
                <stop offset="0%" stop-color="rgba(255,255,255,0.42)" />
                <stop offset="35%" stop-color="rgba(255,255,255,0.08)" />
                <stop offset="70%" stop-color="rgba(0,0,0,0.5)" />
                <stop offset="100%" stop-color="rgba(255,255,255,0.16)" />
              </linearGradient>
              <linearGradient id="${uid}-sidewall" x1="18%" y1="12%" x2="84%" y2="88%">
                <stop offset="0%" stop-color="#2c2f35" />
                <stop offset="42%" stop-color="#121316" />
                <stop offset="100%" stop-color="#060608" />
              </linearGradient>
              <linearGradient id="${uid}-topface" x1="20%" y1="12%" x2="82%" y2="88%">
                <stop offset="0%" stop-color="#35383f" />
                <stop offset="40%" stop-color="#18191c" />
                <stop offset="100%" stop-color="#09090b" />
              </linearGradient>
              <linearGradient id="${uid}-topedge" x1="15%" y1="10%" x2="85%" y2="90%">
                <stop offset="0%" stop-color="rgba(255,255,255,0.48)" />
                <stop offset="42%" stop-color="rgba(255,255,255,0.10)" />
                <stop offset="100%" stop-color="rgba(255,255,255,0.05)" />
              </linearGradient>
              <radialGradient id="${uid}-ao" cx="50%" cy="50%" r="50%">
                <stop offset="58%" stop-color="#000000" stop-opacity="0.72" />
                <stop offset="85%" stop-color="#000000" stop-opacity="0.32" />
                <stop offset="100%" stop-color="#000000" stop-opacity="0" />
              </radialGradient>
            </defs>

            <g class="dial-scale">${ticksSvg}</g>

            ${
              showArc
                ? `<path class="arc-track" d="${buildArcPath(cx, cy, cfg.rSkirt + 4, isEndless ? 0 : minA, isEndless ? 359.9 : maxA)}" />
                   <path class="arc-fill" d="" />`
                : ''
            }

            <circle cx="${cx + 4}" cy="${cy + 7}" r="${cfg.rSkirt + 10}" fill="url(#${uid}-shadow)" />

            ${
              cfg.hasSkirt
                ? `<g class="skirt-base">
                    <circle cx="${cx}" cy="${cy + 3.5}" r="${cfg.rSkirt}" fill="#050507" />
                    <circle cx="${cx}" cy="${cy + 1.5}" r="${cfg.rSkirt}" fill="url(#${uid}-skirt-grad)" stroke="url(#${uid}-skirt-rim)" stroke-width="1.2" />
                    <circle cx="${cx}" cy="${cy + 1.5}" r="${cfg.rSkirt - 2.2}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="0.8" />
                  </g>`
                : ''
            }

            ${
              cfg.skirtDot
                ? `<g class="rot-skirt">
                    <circle cx="${cx}" cy="${cy + 1.5 - cfg.rDotSkirt}" r="${cfg.dotSkirtRadius}" fill="${this._escapeHtml(dotColor)}" stroke="rgba(0,0,0,0.75)" stroke-width="0.7" />
                  </g>`
                : ''
            }

            <g class="rot-body-base">
              <circle cx="${cx + 2}" cy="${baseCy + 3}" r="${cfg.isWingPointer ? cfg.rHubBase + 10 : cfg.rBodyBasePeak + 5}" fill="url(#${uid}-ao)" />
              <path d="${basePathD}" fill="url(#${uid}-sidewall)" stroke="#050507" stroke-width="1.1" />
              ${cfg.isWingPointer ? ridgeHighlightsSvg : ''}
            </g>

            ${!cfg.isWingPointer ? `<g class="ridge-glints">${ridgeHighlightsSvg}</g>` : ''}

            <g class="rot-body-top">
              <path d="${topPathD}" fill="url(#${uid}-topface)" stroke="url(#${uid}-topedge)" stroke-width="1.25" />
              <circle cx="${cx}" cy="${bodyCy}" r="${cfg.rCap + 1.6}" fill="#08080a" stroke="rgba(255,255,255,0.14)" stroke-width="0.7" />
              ${topIndicatorSvg}
            </g>
          </svg>

          <div class="cap-disc cap-${capType}" aria-hidden="true"></div>
        </div>
        ${labelPos === 'bottom' ? labelHtml : ''}
        ${valueHtml}
      </div>
    `;

    if (useAdopted) {
      this.shadowRoot.adoptedStyleSheets = [sheet];
    }

    this._dialEl = this.shadowRoot.querySelector('.dial-stage');
    this._valueEl = this.shadowRoot.querySelector('.knob-value');
    this._rotSkirtEl = this.shadowRoot.querySelector('.rot-skirt');
    this._rotBodyBaseEl = this.shadowRoot.querySelector('.rot-body-base');
    this._rotBodyTopEl = this.shadowRoot.querySelector('.rot-body-top');
    this._ridgeGlints = Array.from(this.shadowRoot.querySelectorAll('.ridge-glint'));
    this._arcFillEl = this.shadowRoot.querySelector('.arc-fill');

    this._dialEl.addEventListener('pointerdown', this._onPointerDown);
    this._dialEl.addEventListener('dblclick', this._onDblClick);
    this._dialEl.addEventListener('keydown', this._onKeyDown);
    this._dialEl.addEventListener('pointerenter', this._onEngageWheel);
    this._dialEl.addEventListener('pointerleave', this._onDisengageWheel);
    this._dialEl.addEventListener('focus', this._onEngageWheel);
    this._dialEl.addEventListener('blur', this._onDisengageWheel);

    this._lastRenderedDeg = NaN;
    this._rendered = true;
  }

  _updateVisuals(force = false) {
    if (!this._rendered) return;
    const cfg = VARIANT_CONFIG[this.variant];
    const deg = this._valueToAngle(this._value);
    const cx = 110;
    const cy = 110;
    const bodyCy = cy - 2;
    const baseCy = bodyCy + cfg.bodyDy;

    if (force || Math.abs(deg - this._lastRenderedDeg) >= 0.05 || Number.isNaN(this._lastRenderedDeg)) {
      this._lastRenderedDeg = deg;
      const degStr = deg.toFixed(2);
      if (this._rotSkirtEl) {
        this._rotSkirtEl.setAttribute('transform', `rotate(${degStr} ${cx} ${cy + 1.5})`);
      }
      if (this._rotBodyBaseEl) {
        this._rotBodyBaseEl.setAttribute('transform', `rotate(${degStr} ${cx} ${baseCy})`);
      }
      if (this._rotBodyTopEl) {
        this._rotBodyTopEl.setAttribute('transform', `rotate(${degStr} ${cx} ${bodyCy})`);
      }

      if (!cfg.isWingPointer && this._ridgeGlints.length) {
        const knobRad = (deg * Math.PI) / 180;
        for (let i = 0; i < this._ridgeGlints.length; i++) {
          const worldTheta = knobRad + (i * Math.PI) / 3 - Math.PI / 2;
          const [tx, ty] = polar(cx, bodyCy, cfg.rBodyTopPeak - 1.0, worldTheta);
          const [bx, by] = polar(cx, baseCy, cfg.rBodyBasePeak - 1.0, worldTheta);
          const line = this._ridgeGlints[i];
          line.setAttribute('x1', tx.toFixed(2));
          line.setAttribute('y1', ty.toFixed(2));
          line.setAttribute('x2', bx.toFixed(2));
          line.setAttribute('y2', by.toFixed(2));
          const cosLight = Math.cos(worldTheta - LIGHT_ANGLE_RAD);
          const spec = Math.pow(Math.max(0, cosLight), 2.0) * 0.52 + 0.05;
          line.setAttribute('opacity', spec.toFixed(3));
        }
      }

      if (this._arcFillEl) {
        if (this.endless) {
          const normDeg = (((deg % 360) + 360) % 360);
          this._arcFillEl.setAttribute('d', buildArcPath(cx, cy, cfg.rSkirt + 4, 0, normDeg || 0.01));
        } else {
          const minA = this._getMinAngle();
          const maxA = this._getMaxAngle();
          const startA = this.bipolar ? (minA + maxA) / 2 : minA;
          this._arcFillEl.setAttribute('d', buildArcPath(cx, cy, cfg.rSkirt + 4, startA, deg));
        }
      }
    }

    const formatted = this.formattedValue;
    if (this._valueEl) this._valueEl.textContent = formatted;
    this._dialEl.setAttribute('aria-valuemin', String(this.min));
    this._dialEl.setAttribute('aria-valuemax', String(this.max));
    this._dialEl.setAttribute('aria-valuenow', String(this._value));
    this._dialEl.setAttribute('aria-valuetext', formatted);
  }

  _escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

export function registerMoogKnob(tagName = 'moog-knob') {
  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
    customElements.define(tagName, MoogKnob);
  }
}

registerMoogKnob('moog-knob');
