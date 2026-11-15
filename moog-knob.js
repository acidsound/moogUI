/**
 * <moog-knob> — Reusable Minimoog Model D Style Rotary Knob Web Component
 *
 * Authentic recreation of the iconic Minimoog Model D large skirted knob
 * (fluted 6-lobe glossy black body, flared skirt with dual aligned indicator dots,
 * radial spun-aluminum inlay cap, and vintage silkscreened dial scale).
 *
 * Features:
 *  - Pure zero-dependency Web Component (Shadow DOM + SVG + CSS)
 *  - Variants: "large" (Model D Oscillator/Filter), "pointer", "skirtless"
 *  - Cap finishes: "silver" (brushed aluminum), "brass", "black"
 *  - Vertical or circular pointer drag, Shift for fine precision
 *  - Double-click / Alt+click to reset to default value
 *  - Mouse wheel support & full keyboard/ARIA slider accessibility
 *  - Continuous mode OR stepped rotary detent mode (e.g. Octave Range switch)
 *  - Dynamic specular flute highlights reacting to studio light angle as you turn
 *
 * @example
 * <moog-knob
 *   label="OSCILLATOR TUNE"
 *   min="-5"
 *   max="5"
 *   value="0"
 *   step="0.05"
 *   bipolar
 *   scale-labels="-5,-3,-1,0,+1,+3,+5"
 *   unit="st"
 * ></moog-knob>
 */

const LIGHT_ANGLE_RAD = (-135 * Math.PI) / 180; // Top-left studio key light

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
    pointerExtend: 0,
    hasSkirt: true,
    skirtDot: true,
    bodyDy: 5.5,
  },
  pointer: {
    rSkirt: 64,
    rBodyBasePeak: 46.5,
    rBodyBaseValley: 38.5,
    rBodyTopPeak: 41.5,
    rBodyTopValley: 35.0,
    rCap: 27.5,
    rDotTop: 37.5,
    rDotSkirt: 57.5,
    dotTopRadius: 2.7,
    dotSkirtRadius: 3.0,
    pointerExtend: 6.5,
    hasSkirt: true,
    skirtDot: true,
    bodyDy: 5.0,
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
    pointerExtend: 0,
    hasSkirt: false,
    skirtDot: false,
    bodyDy: 5.2,
  },
};

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function parseNumAttr(el, name, fallback) {
  const raw = el.getAttribute(name);
  if (raw === null || raw.trim() === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function roundToStep(val, step, min) {
  if (!step || step <= 0) return val;
  const steps = Math.round((val - min) / step);
  const res = min + steps * step;
  const decimals = (String(step).split('.')[1] || '').length;
  return Number(res.toFixed(Math.min(decimals + 2, 8)));
}

function polar(cx, cy, r, rad) {
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

/**
 * Generates an SVG path for the 6-lobed scalloped Moog knob profile.
 * Uses the harmonic profile cos(6θ) + 0.25*cos(12θ) which creates
 * narrow rounded ridges and wide smooth concave flutes.
 */
function buildScallopedPath(cx, cy, rPeak, rValley, pointerExtend = 0, samples = 180) {
  const rMid = (rPeak + rValley) / 2;
  const amp = (rPeak - rValley) / 2;
  // Normalize harmonic (cos(6t)+0.25*cos(12t)) range [-0.75, +1.25] -> [-1, +1]
  // f(t) = (cos(6t) + 0.25*cos(12t) - 0.25) -> range [-1, +1]
  const pts = [];
  for (let i = 0; i < samples; i++) {
    const u = (i / samples) * Math.PI * 2; // 0 = straight UP (-PI/2)
    const harmonic = Math.cos(6 * u) + 0.25 * Math.cos(12 * u) - 0.25;
    let r = rMid + amp * harmonic;
    if (pointerExtend > 0) {
      // Smooth Gaussian-like extension on lobe 0 (around u = 0 / 2PI)
      const dist = Math.min(u, Math.PI * 2 - u);
      if (dist < 0.45) {
        const w = Math.cos((dist / 0.45) * (Math.PI / 2));
        r += pointerExtend * w * w;
      }
    }
    const theta = u - Math.PI / 2;
    const [x, y] = polar(cx, cy, r, theta);
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  pts.push('Z');
  return pts.join(' ');
}

/**
 * Generates an SVG arc path from startDeg to endDeg (0 deg = straight UP).
 */
function buildArcPath(cx, cy, r, startDeg, endDeg) {
  if (Math.abs(endDeg - startDeg) < 0.01) return '';
  const startRad = ((startDeg - 90) * Math.PI) / 180;
  const endRad = ((endDeg - 90) * Math.PI) / 180;
  const [x1, y1] = polar(cx, cy, r, startRad);
  const [x2, y2] = polar(cx, cy, r, endRad);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const sweep = endDeg > startDeg ? 1 : 0;
  return `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${largeArc} ${sweep} ${x2.toFixed(2)},${y2.toFixed(2)}`;
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
    this._defaultValue = null;
    this._dragging = false;
    this._dragStartY = 0;
    this._dragStartValue = 0;
    this._formatFn = null;
    this._uid = `mk-${Math.random().toString(36).slice(2, 9)}`;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onDblClick = this._onDblClick.bind(this);
    this._onWheel = this._onWheel.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);

    this._rendered = false;
  }

  connectedCallback() {
    if (this._defaultValue === null) {
      if (this.hasAttribute('default-value')) {
        this._defaultValue = Number(this.getAttribute('default-value'));
      } else if (this.bipolar) {
        this._defaultValue = (this.min + this.max) / 2;
      } else if (this.hasAttribute('value')) {
        this._defaultValue = Number(this.getAttribute('value'));
      } else {
        this._defaultValue = this.min;
      }
    }

    if (this.hasAttribute('value')) {
      this._value = this._sanitize(Number(this.getAttribute('value')));
    } else {
      this._value = this._sanitize(this._defaultValue);
    }

    this._render();
    this._updateVisuals();
  }

  disconnectedCallback() {
    this._cleanupDragListeners();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;

    if (name === 'value') {
      if (!this._rendered) return;
      const next = this._sanitize(Number(newVal));
      if (next !== this._value) {
        this._value = next;
        this._updateVisuals();
      }
      return;
    }

    if (name === 'default-value') {
      this._defaultValue = newVal !== null ? Number(newVal) : null;
    }

    if (this._rendered) {
      this._value = this._sanitize(this._value);
      this._render();
      this._updateVisuals();
    }
  }

  // ---- Public Properties ----

  get value() {
    return this._value;
  }
  set value(v) {
    const next = this._sanitize(Number(v));
    if (next !== this._value) {
      this._value = next;
      this.setAttribute('value', String(next));
      if (this._rendered) this._updateVisuals();
    }
  }

  get min() {
    const dets = this._getDetentLabels();
    if (dets && !this.hasAttribute('min')) return 0;
    return parseNumAttr(this, 'min', 0);
  }
  set min(v) {
    this.setAttribute('min', String(v));
  }

  get max() {
    const dets = this._getDetentLabels();
    if (dets && !this.hasAttribute('max')) return Math.max(0, dets.length - 1);
    return parseNumAttr(this, 'max', 10);
  }
  set max(v) {
    this.setAttribute('max', String(v));
  }

  get step() {
    if (this.hasAttribute('detents')) {
      const detVal = this.getAttribute('detents');
      const n = Number(detVal);
      if (Number.isFinite(n) && n > 1) {
        return (this.max - this.min) / (n - 1);
      }
      return 1;
    }
    const v = parseNumAttr(this, 'step', 0.01);
    return v > 0 ? v : 0.01;
  }
  set step(v) {
    this.setAttribute('step', String(v));
  }

  get defaultValue() {
    if (this._defaultValue !== null && Number.isFinite(this._defaultValue)) {
      return this._sanitize(this._defaultValue);
    }
    return this.bipolar ? this._sanitize((this.min + this.max) / 2) : this.min;
  }
  set defaultValue(v) {
    this._defaultValue = Number(v);
    this.setAttribute('default-value', String(v));
  }

  get bipolar() {
    return this.hasAttribute('bipolar') && this.getAttribute('bipolar') !== 'false';
  }
  set bipolar(flag) {
    if (flag) this.setAttribute('bipolar', '');
    else this.removeAttribute('bipolar');
  }

  get disabled() {
    return this.hasAttribute('disabled') && this.getAttribute('disabled') !== 'false';
  }
  set disabled(flag) {
    if (flag) this.setAttribute('disabled', '');
    else this.removeAttribute('disabled');
  }

  get variant() {
    const v = this.getAttribute('variant');
    return VARIANT_CONFIG[v] ? v : 'large';
  }
  set variant(v) {
    this.setAttribute('variant', v);
  }

  get cap() {
    const c = this.getAttribute('cap');
    return c === 'brass' || c === 'black' ? c : 'silver';
  }
  set cap(c) {
    this.setAttribute('cap', c);
  }

  get format() {
    return this._formatFn;
  }
  set format(fn) {
    this._formatFn = typeof fn === 'function' ? fn : null;
    if (this._rendered) this._updateVisuals();
  }

  get normalized() {
    const span = this.max - this.min;
    if (span <= 0) return 0;
    return clamp((this._value - this.min) / span, 0, 1);
  }

  get formattedValue() {
    const dets = this._getDetentLabels();
    if (dets && this.hasAttribute('detents')) {
      const idx = Math.round(this.normalized * (dets.length - 1));
      if (dets[idx] !== undefined) return dets[idx];
    }
    if (this._formatFn) {
      return String(this._formatFn(this._value));
    }
    const unit = this.getAttribute('unit') || '';
    const step = this.step;
    const dec = step >= 1 ? 0 : Math.min(2, (String(step).split('.')[1] || '').length);
    const numStr = this._value.toFixed(dec);
    const signed = this.bipolar && this._value > 0 ? `+${numStr}` : numStr;
    return unit ? `${signed} ${unit}` : signed;
  }

  reset() {
    this._commitValue(this.defaultValue, true);
  }

  // ---- Internal Helpers ----

  _getSizePx() {
    const raw = this.getAttribute('size') || 'md';
    if (SIZE_MAP[raw]) return SIZE_MAP[raw];
    const n = Number(raw);
    return Number.isFinite(n) && n >= 36 ? n : SIZE_MAP.md;
  }

  _getMinAngle() {
    return parseNumAttr(this, 'min-angle', -150);
  }

  _getMaxAngle() {
    return parseNumAttr(this, 'max-angle', 150);
  }

  _getScaleLabels() {
    const raw = this.getAttribute('scale-labels');
    if (!raw) return null;
    try {
      if (raw.trim().startsWith('[')) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(String);
      }
    } catch (_) {
      // Fallback to comma-separated
    }
    return raw.split(',').map((s) => s.trim());
  }

  _getDetentLabels() {
    if (!this.hasAttribute('detents')) return null;
    const labels = this._getScaleLabels();
    if (labels && labels.length > 1) return labels;
    const n = Number(this.getAttribute('detents'));
    if (Number.isFinite(n) && n > 1) {
      return Array.from({ length: n }, (_, i) => String(i + 1));
    }
    return null;
  }

  _sanitize(v) {
    if (!Number.isFinite(v)) return this.min;
    const clamped = clamp(v, this.min, this.max);
    return clamp(roundToStep(clamped, this.step, this.min), this.min, this.max);
  }

  _valueToAngle(val) {
    const minA = this._getMinAngle();
    const maxA = this._getMaxAngle();
    const span = this.max - this.min;
    if (span <= 0) return minA;
    const norm = clamp((val - this.min) / span, 0, 1);
    return minA + norm * (maxA - minA);
  }

  _setValueInternal(nextVal, emitInput = true) {
    const sanitized = this._sanitize(nextVal);
    if (sanitized === this._value) return false;
    this._value = sanitized;
    this.setAttribute('value', String(sanitized));
    this._updateVisuals();
    if (emitInput) {
      this._emit('input');
    }
    return true;
  }

  _commitValue(nextVal, emitBoth = false) {
    const changed = this._setValueInternal(nextVal, emitBoth);
    if (changed || emitBoth) {
      this._emit('change');
    }
  }

  _emit(type) {
    this.dispatchEvent(
      new CustomEvent(type, {
        bubbles: true,
        composed: true,
        detail: {
          value: this._value,
          normalized: this.normalized,
          formatted: this.formattedValue,
        },
      })
    );
  }

  // ---- Interaction Handlers ----

  _onPointerDown(e) {
    if (this.disabled || e.button > 0) return;
    e.preventDefault();
    this._dialEl.focus({ preventScroll: true });

    this._dragging = true;
    this._dragStartY = e.clientY;
    this._dragStartValue = this._value;
    this._dragMoved = false;
    this._dialEl.classList.add('is-active');

    try {
      this._dialEl.setPointerCapture(e.pointerId);
    } catch (_) {}

    if (e.altKey) {
      this.reset();
      return;
    }

    if (this.getAttribute('drag-mode') === 'circular') {
      this._applyCircularPointer(e);
    }

    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerUp);
  }

  _onPointerMove(e) {
    if (!this._dragging) return;
    this._dragMoved = true;

    if (this.getAttribute('drag-mode') === 'circular') {
      this._applyCircularPointer(e);
      return;
    }

    const baseSens = parseNumAttr(this, 'sensitivity', 170);
    const sens = e.shiftKey ? baseSens * 6 : baseSens;
    const dy = this._dragStartY - e.clientY;
    const span = this.max - this.min;
    const delta = (dy / sens) * span;
    this._setValueInternal(this._dragStartValue + delta, true);
  }

  _applyCircularPointer(e) {
    const rect = this._dialEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // Angle where 0 deg = straight UP, clockwise positive
    let deg = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90;
    if (deg > 180) deg -= 360;
    const minA = this._getMinAngle();
    const maxA = this._getMaxAngle();
    const clampedDeg = clamp(deg, minA, maxA);
    const norm = (clampedDeg - minA) / (maxA - minA);
    this._setValueInternal(this.min + norm * (this.max - this.min), true);
  }

  _onPointerUp(e) {
    if (!this._dragging) return;
    this._dragging = false;
    this._dialEl.classList.remove('is-active');
    try {
      this._dialEl.releasePointerCapture(e.pointerId);
    } catch (_) {}
    this._cleanupDragListeners();
    if (this._dragMoved && this._value !== this._dragStartValue) {
      this._emit('change');
    }
  }

  _cleanupDragListeners() {
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerUp);
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
    const span = this.max - this.min;
    const baseIncrement = this.hasAttribute('detents')
      ? this.step
      : Math.max(this.step, span / (e.shiftKey ? 200 : 45));
    const prev = this._value;
    this._setValueInternal(this._value + dir * baseIncrement, true);
    if (this._value !== prev) {
      clearTimeout(this._wheelCommitTimer);
      this._wheelCommitTimer = setTimeout(() => this._emit('change'), 160);
    }
  }

  _onKeyDown(e) {
    if (this.disabled) return;
    const span = this.max - this.min;
    const isDetent = this.hasAttribute('detents');
    const fineStep = isDetent ? this.step : Math.max(this.step, span / 100);
    const normalStep = isDetent ? this.step : Math.max(this.step, span / 25);
    const coarseStep = isDetent ? this.step : Math.max(this.step, span / 8);
    const delta = e.shiftKey ? fineStep : normalStep;

    let handled = true;
    let next = this._value;
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        next = this._value + delta;
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        next = this._value - delta;
        break;
      case 'PageUp':
        next = this._value + coarseStep;
        break;
      case 'PageDown':
        next = this._value - coarseStep;
        break;
      case 'Home':
        next = this.min;
        break;
      case 'End':
        next = this.max;
        break;
      default:
        handled = false;
    }

    if (handled) {
      e.preventDefault();
      this._commitValue(next, true);
    }
  }

  // ---- Rendering ----

  _render() {
    const cfg = VARIANT_CONFIG[this.variant];
    const sizePx = this._getSizePx();
    const dotColor = this.getAttribute('dot-color') || '#f3f3ef';
    const label = this.getAttribute('label') || '';
    const labelPos = this.getAttribute('label-position') === 'bottom' ? 'bottom' : 'top';
    const showValueMode = this.getAttribute('show-value') || 'always';
    const showArc = this.hasAttribute('show-arc') && this.getAttribute('show-arc') !== 'false';
    const capType = this.cap;

    const minA = this._getMinAngle();
    const maxA = this._getMaxAngle();

    // SVG coordinate system: 220x220 centered at (110, 110)
    // Leaves room outside rSkirt=68 for ticks (r=74..85) and scale labels (r=96)
    const cx = 110;
    const cy = 110;
    const bodyCy = cy - 2; // slight perspective lift
    const baseCy = bodyCy + cfg.bodyDy;

    const baseScallop = buildScallopedPath(
      cx,
      baseCy,
      cfg.rBodyBasePeak,
      cfg.rBodyBaseValley,
      cfg.pointerExtend
    );
    const topScallop = buildScallopedPath(
      cx,
      bodyCy,
      cfg.rBodyTopPeak,
      cfg.rBodyTopValley,
      cfg.pointerExtend
    );

    // Build dial ticks & labels
    const labels = this._getScaleLabels();
    const tickCountAttr = this.getAttribute('ticks');
    const majorCount = labels
      ? labels.length
      : tickCountAttr !== null
        ? Math.max(0, parseNumAttr(this, 'ticks', 11))
        : 11;
    const minorPerGap = this.hasAttribute('detents')
      ? 0
      : Math.max(0, parseNumAttr(this, 'minor-ticks', 1));

    let ticksSvg = '';
    if (majorCount > 1) {
      const rTickIn = cfg.hasSkirt ? 74 : 58;
      const rTickOutMajor = cfg.hasSkirt ? 83 : 67;
      const rTickOutMinor = cfg.hasSkirt ? 78.5 : 62.5;
      const rLabel = cfg.hasSkirt ? 96 : 80;

      for (let i = 0; i < majorCount; i++) {
        const t = i / (majorCount - 1);
        const deg = minA + t * (maxA - minA);
        const rad = ((deg - 90) * Math.PI) / 180;
        const [x1, y1] = polar(cx, cy, rTickIn, rad);
        const [x2, y2] = polar(cx, cy, rTickOutMajor, rad);
        const isCenterBipolar = this.bipolar && Math.abs(deg) < 1;
        ticksSvg += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="tick-major ${isCenterBipolar ? 'tick-center' : ''}" />`;

        if (labels && labels[i] !== undefined) {
          const [lx, ly] = polar(cx, cy, rLabel, rad);
          ticksSvg += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" class="scale-label">${this._escapeHtml(labels[i])}</text>`;
        }

        if (minorPerGap > 0 && i < majorCount - 1) {
          for (let m = 1; m <= minorPerGap; m++) {
            const mt = (i + m / (minorPerGap + 1)) / (majorCount - 1);
            const mdeg = minA + mt * (maxA - minA);
            const mrad = ((mdeg - 90) * Math.PI) / 180;
            const [mx1, my1] = polar(cx, cy, rTickIn, mrad);
            const [mx2, my2] = polar(cx, cy, rTickOutMinor, mrad);
            ticksSvg += `<line x1="${mx1.toFixed(1)}" y1="${my1.toFixed(1)}" x2="${mx2.toFixed(1)}" y2="${my2.toFixed(1)}" class="tick-minor" />`;
          }
        }
      }
    }

    // 6 dynamic perspective ridge highlights in panel space (placed behind top face)
    let ridgeHighlightsSvg = '';
    for (let i = 0; i < 6; i++) {
      ridgeHighlightsSvg += `<line class="ridge-glint" data-lobe="${i}" x1="0" y1="0" x2="0" y2="0" />`;
    }

    // Cap disc geometry percentages inside the 220x220 viewBox
    const capDiamPct = ((cfg.rCap * 2) / 220) * 100;
    const capLeftPct = ((cx - cfg.rCap) / 220) * 100;
    const capTopPct = ((bodyCy - cfg.rCap) / 220) * 100;

    // SVG size needs extra margin for dial labels (220 viewBox vs knob diameter 136 -> ~1.55x)
    const widgetWidth = Math.round(sizePx * 1.48);

    const uid = this._uid;
    const labelHtml = label ? `<div class="knob-label">${this._escapeHtml(label)}</div>` : '';
    const valueHtml =
      showValueMode !== 'never'
        ? `<div class="knob-value ${showValueMode === 'hover' ? 'only-hover' : ''}" part="value"></div>`
        : '';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          user-select: none;
          -webkit-user-select: none;
          vertical-align: top;
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

        :host([disabled]) {
          opacity: 0.48;
          pointer-events: none;
        }

        .wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }

        .knob-label {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.11em;
          text-transform: uppercase;
          color: var(--moog-label-color);
          text-align: center;
          line-height: 1.25;
          max-width: ${widgetWidth + 16}px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }

        .dial-stage {
          position: relative;
          width: ${widgetWidth}px;
          height: ${widgetWidth}px;
          cursor: ns-resize;
          touch-action: none;
          outline: none;
          border-radius: 50%;
          transition: filter 120ms ease;
        }

        :host([drag-mode="circular"]) .dial-stage {
          cursor: grab;
        }
        :host([drag-mode="circular"]) .dial-stage.is-active {
          cursor: grabbing;
        }

        .dial-stage:focus-visible {
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.7), 0 0 14px rgba(245, 158, 11, 0.35);
        }

        svg.knob-svg {
          width: 100%;
          height: 100%;
          display: block;
          overflow: visible;
        }

        .tick-major {
          stroke: var(--moog-tick-color);
          stroke-width: 1.85;
          stroke-linecap: round;
        }

        .tick-major.tick-center {
          stroke: var(--moog-accent-color);
          stroke-width: 2.3;
        }

        .tick-minor {
          stroke: var(--moog-tick-minor-color);
          stroke-width: 1.2;
          stroke-linecap: round;
        }

        .scale-label {
          fill: var(--moog-tick-color);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.02em;
          text-anchor: middle;
          dominant-baseline: central;
          font-family: var(--moog-font-family);
        }

        .arc-track {
          fill: none;
          stroke: rgba(255, 255, 255, 0.1);
          stroke-width: 3;
          stroke-linecap: round;
        }

        .arc-fill {
          fill: none;
          stroke: var(--moog-accent-color);
          stroke-width: 3;
          stroke-linecap: round;
          filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.55));
        }

        .ridge-glint {
          stroke: rgba(255, 255, 255, 0.72);
          stroke-width: 2.6;
          stroke-linecap: round;
          pointer-events: none;
        }

        /* Radial Brushed Aluminum / Brass / Black Top Cap */
        .cap-disc {
          position: absolute;
          left: ${capLeftPct.toFixed(3)}%;
          top: ${capTopPct.toFixed(3)}%;
          width: ${capDiamPct.toFixed(3)}%;
          height: ${capDiamPct.toFixed(3)}%;
          border-radius: 50%;
          pointer-events: none;
          box-sizing: border-box;
          box-shadow:
            inset 0 1px 1.5px rgba(255, 255, 255, 0.55),
            inset 0 -1.5px 2.5px rgba(0, 0, 0, 0.55),
            0 0 0 1px rgba(0, 0, 0, 0.85);
        }

        .cap-disc.cap-silver {
          background:
            repeating-radial-gradient(
              circle at 50% 50%,
              rgba(255, 255, 255, 0.045) 0px,
              rgba(0, 0, 0, 0.04) 1px,
              transparent 2px
            ),
            conic-gradient(
              from -38deg,
              #cfd4d9 0deg,
              #f7f9fb 26deg,
              #949ba3 66deg,
              #777e86 98deg,
              #c7cdd3 145deg,
              #f4f7fa 188deg,
              #8f969e 232deg,
              #727980 266deg,
              #c3c9cf 314deg,
              #cfd4d9 360deg
            );
        }

        .cap-disc.cap-brass {
          background:
            repeating-radial-gradient(
              circle at 50% 50%,
              rgba(255, 255, 255, 0.04) 0px,
              rgba(0, 0, 0, 0.04) 1px,
              transparent 2px
            ),
            conic-gradient(
              from -38deg,
              #c9a65b 0deg,
              #f6e3a8 26deg,
              #8c6f32 66deg,
              #6e5420 98deg,
              #bfa054 145deg,
              #f2dc9b 188deg,
              #886a2f 232deg,
              #664e1c 266deg,
              #ba994e 314deg,
              #c9a65b 360deg
            );
        }

        .cap-disc.cap-black {
          background:
            repeating-radial-gradient(
              circle at 50% 50%,
              rgba(255, 255, 255, 0.03) 0px,
              rgba(0, 0, 0, 0.06) 1px,
              transparent 2px
            ),
            conic-gradient(
              from -38deg,
              #2a2c30 0deg,
              #464950 26deg,
              #1b1c20 66deg,
              #141518 98deg,
              #27292e 145deg,
              #41444a 188deg,
              #191a1e 232deg,
              #121316 266deg,
              #25272b 314deg,
              #2a2c30 360deg
            );
          box-shadow:
            inset 0 1px 1.5px rgba(255, 255, 255, 0.16),
            inset 0 -1.5px 2.5px rgba(0, 0, 0, 0.8),
            0 0 0 1px rgba(0, 0, 0, 0.95);
        }

        /* Subtle lathe center dimple */
        .cap-disc::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(
            circle at 36% 32%,
            rgba(255, 255, 255, 0.22) 0%,
            rgba(255, 255, 255, 0) 58%,
            rgba(0, 0, 0, 0.16) 100%
          );
        }

        .knob-value {
          font-family: var(--moog-mono-font);
          font-size: 11px;
          font-weight: 600;
          color: var(--moog-value-color);
          background: var(--moog-value-bg);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 1.5px 7px;
          min-width: 48px;
          text-align: center;
          letter-spacing: 0.03em;
          transition: opacity 150ms ease, border-color 150ms ease;
        }

        .dial-stage.is-active ~ .knob-value,
        .dial-stage:focus-visible ~ .knob-value {
          border-color: rgba(245, 158, 11, 0.6);
        }

        .knob-value.only-hover {
          opacity: 0;
        }
        .wrap:hover .knob-value.only-hover,
        .dial-stage.is-active ~ .knob-value.only-hover,
        .dial-stage:focus-visible ~ .knob-value.only-hover {
          opacity: 1;
        }
      </style>

      <div class="wrap">
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
              <!-- Panel Contact Shadow -->
              <radialGradient id="${uid}-shadow" cx="50%" cy="50%" r="50%">
                <stop offset="62%" stop-color="#000000" stop-opacity="0.82" />
                <stop offset="86%" stop-color="#000000" stop-opacity="0.38" />
                <stop offset="100%" stop-color="#000000" stop-opacity="0" />
              </radialGradient>

              <!-- Glossy Flared Skirt Surface (anchored to studio lighting) -->
              <radialGradient id="${uid}-skirt-grad" cx="38%" cy="34%" r="65%">
                <stop offset="0%" stop-color="#3c3f45" />
                <stop offset="45%" stop-color="#191a1d" />
                <stop offset="82%" stop-color="#0a0a0c" />
                <stop offset="100%" stop-color="#1e2024" />
              </radialGradient>

              <!-- Skirt Rim Specular Sheen -->
              <linearGradient id="${uid}-skirt-rim" x1="15%" y1="10%" x2="85%" y2="90%">
                <stop offset="0%" stop-color="rgba(255,255,255,0.42)" />
                <stop offset="35%" stop-color="rgba(255,255,255,0.08)" />
                <stop offset="70%" stop-color="rgba(0,0,0,0.5)" />
                <stop offset="100%" stop-color="rgba(255,255,255,0.16)" />
              </linearGradient>

              <!-- Scalloped Body Sidewall Gradient -->
              <linearGradient id="${uid}-sidewall" x1="18%" y1="12%" x2="84%" y2="88%">
                <stop offset="0%" stop-color="#2c2f35" />
                <stop offset="42%" stop-color="#121316" />
                <stop offset="100%" stop-color="#060608" />
              </linearGradient>

              <!-- Scalloped Top Face Glossy Bakelite -->
              <linearGradient id="${uid}-topface" x1="20%" y1="12%" x2="82%" y2="88%">
                <stop offset="0%" stop-color="#35383f" />
                <stop offset="40%" stop-color="#18191c" />
                <stop offset="100%" stop-color="#09090b" />
              </linearGradient>

              <!-- Top Edge Highlight -->
              <linearGradient id="${uid}-topedge" x1="15%" y1="10%" x2="85%" y2="90%">
                <stop offset="0%" stop-color="rgba(255,255,255,0.48)" />
                <stop offset="42%" stop-color="rgba(255,255,255,0.10)" />
                <stop offset="100%" stop-color="rgba(255,255,255,0.05)" />
              </linearGradient>

              <!-- Body-on-Skirt Ambient Occlusion -->
              <filter id="${uid}-ao" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="3.6" />
              </filter>
            </defs>

            <!-- Scale Ticks & Labels -->
            <g class="dial-scale">${ticksSvg}</g>

            <!-- Optional Hybrid LED Ring Arc -->
            ${
              showArc
                ? `<path class="arc-track" d="${buildArcPath(cx, cy, cfg.rSkirt + 4, minA, maxA)}" />
                   <path class="arc-fill" d="" />`
                : ''
            }

            <!-- Cast Shadow onto Control Panel (offset down-right from top-left light) -->
            <circle cx="${cx + 4}" cy="${cy + 7}" r="${cfg.rSkirt + 10}" fill="url(#${uid}-shadow)" />

            <!-- Flared Black Skirt Base -->
            ${
              cfg.hasSkirt
                ? `
              <g class="skirt-base">
                <circle cx="${cx}" cy="${cy + 3.5}" r="${cfg.rSkirt}" fill="#050507" />
                <circle cx="${cx}" cy="${cy + 1.5}" r="${cfg.rSkirt}" fill="url(#${uid}-skirt-grad)" stroke="url(#${uid}-skirt-rim)" stroke-width="1.2" />
                <circle cx="${cx}" cy="${cy + 1.5}" r="${cfg.rSkirt - 2.2}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="0.8" />
              </g>
            `
                : ''
            }

            <!-- Rotating Skirt Dot (rotates around panel center) -->
            ${
              cfg.skirtDot
                ? `
              <g class="rot-skirt">
                <circle
                  cx="${cx}"
                  cy="${cy + 1.5 - cfg.rDotSkirt}"
                  r="${cfg.dotSkirtRadius}"
                  fill="${this._escapeHtml(dotColor)}"
                  stroke="rgba(0,0,0,0.65)"
                  stroke-width="0.6"
                />
              </g>
            `
                : ''
            }

            <!-- 3D Extruded Fluted Body Base & Ambient Occlusion (rotates around base center) -->
            <g class="rot-body-base">
              <path d="${baseScallop}" fill="rgba(0,0,0,0.75)" filter="url(#${uid}-ao)" transform="translate(2, 3)" />
              <path d="${baseScallop}" fill="url(#${uid}-sidewall)" stroke="#050507" stroke-width="1.1" />
            </g>

            <!-- True 2.5D Perspective Sidewall Ridge Glints (occluded by top face when rotated behind) -->
            <g class="ridge-glints">${ridgeHighlightsSvg}</g>

            <!-- Fluted Body Top Face & Upper White Indicator Dot (rotates around top center) -->
            <g class="rot-body-top">
              <path d="${topScallop}" fill="url(#${uid}-topface)" stroke="url(#${uid}-topedge)" stroke-width="1.25" />
              <!-- Recessed Chamfer around Metal Cap -->
              <circle cx="${cx}" cy="${bodyCy}" r="${cfg.rCap + 1.6}" fill="#08080a" stroke="rgba(255,255,255,0.12)" stroke-width="0.7" />
              <!-- Iconic Upper Ridge White Dot -->
              <circle
                cx="${cx}"
                cy="${bodyCy - cfg.rDotTop - (cfg.pointerExtend > 0 ? 3.5 : 0)}"
                r="${cfg.dotTopRadius}"
                fill="${this._escapeHtml(dotColor)}"
                stroke="rgba(0,0,0,0.65)"
                stroke-width="0.6"
              />
            </g>
          </svg>

          <!-- Spun Radial Brushed Metal Inlay Cap -->
          <div class="cap-disc cap-${capType}" aria-hidden="true"></div>
        </div>
        ${labelPos === 'bottom' ? labelHtml : ''}
        ${valueHtml}
      </div>
    `;

    this._dialEl = this.shadowRoot.querySelector('.dial-stage');
    this._valueEl = this.shadowRoot.querySelector('.knob-value');
    this._rotSkirtEl = this.shadowRoot.querySelector('.rot-skirt');
    this._rotBodyBaseEl = this.shadowRoot.querySelector('.rot-body-base');
    this._rotBodyTopEl = this.shadowRoot.querySelector('.rot-body-top');
    this._ridgeGlints = Array.from(this.shadowRoot.querySelectorAll('.ridge-glint'));
    this._arcFillEl = this.shadowRoot.querySelector('.arc-fill');

    this._dialEl.addEventListener('pointerdown', this._onPointerDown);
    this._dialEl.addEventListener('dblclick', this._onDblClick);
    this._dialEl.addEventListener('wheel', this._onWheel, { passive: false });
    this._dialEl.addEventListener('keydown', this._onKeyDown);

    this._rendered = true;
  }

  _updateVisuals() {
    if (!this._rendered) return;
    const cfg = VARIANT_CONFIG[this.variant];
    const deg = this._valueToAngle(this._value);
    const cx = 110;
    const cy = 110;
    const bodyCy = cy - 2;
    const baseCy = bodyCy + cfg.bodyDy;

    if (this._rotSkirtEl) {
      this._rotSkirtEl.setAttribute('transform', `rotate(${deg.toFixed(2)} ${cx} ${cy + 1.5})`);
    }
    if (this._rotBodyBaseEl) {
      this._rotBodyBaseEl.setAttribute('transform', `rotate(${deg.toFixed(2)} ${cx} ${baseCy})`);
    }
    if (this._rotBodyTopEl) {
      this._rotBodyTopEl.setAttribute('transform', `rotate(${deg.toFixed(2)} ${cx} ${bodyCy})`);
    }

    // Update dynamic 2.5D perspective specular ridge highlights relative to stationary top-left light
    const knobRad = (deg * Math.PI) / 180;
    for (let i = 0; i < this._ridgeGlints.length; i++) {
      const worldTheta = knobRad + (i * Math.PI) / 3 - Math.PI / 2;
      const rPeakTop = cfg.rBodyTopPeak + (i === 0 ? cfg.pointerExtend : 0);
      const rPeakBase = cfg.rBodyBasePeak + (i === 0 ? cfg.pointerExtend : 0);
      const [tx, ty] = polar(cx, bodyCy, rPeakTop - 1.0, worldTheta);
      const [bx, by] = polar(cx, baseCy, rPeakBase - 1.0, worldTheta);
      const line = this._ridgeGlints[i];
      line.setAttribute('x1', tx.toFixed(2));
      line.setAttribute('y1', ty.toFixed(2));
      line.setAttribute('x2', bx.toFixed(2));
      line.setAttribute('y2', by.toFixed(2));
      const cosLight = Math.cos(worldTheta - LIGHT_ANGLE_RAD);
      const spec = Math.pow(Math.max(0, cosLight), 2.0) * 0.52 + 0.05;
      line.setAttribute('opacity', spec.toFixed(3));
    }

    if (this._arcFillEl) {
      const minA = this._getMinAngle();
      const maxA = this._getMaxAngle();
      const startA = this.bipolar ? (minA + maxA) / 2 : minA;
      this._arcFillEl.setAttribute('d', buildArcPath(cx, cy, cfg.rSkirt + 4, startA, deg));
    }

    const formatted = this.formattedValue;
    if (this._valueEl) {
      this._valueEl.textContent = formatted;
    }

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
