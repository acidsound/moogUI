/**
 * <moog-led> — Reusable Vintage Jewel Pilot Lamp & Panel LED Indicator Component
 *
 * High-instance-count optimized:
 *  - Shared adoptedStyleSheets singleton across all LED instances
 *  - CSS `contain: layout style paint` isolation
 *  - Static halo box-shadow animated purely via GPU `opacity` (zero repaint)
 *  - Zero-JS CSS `@keyframes` blink (0 `setInterval` timers even with 100+ LEDs)
 */

const LED_PALETTE = {
  amber: { core: '#fff5cc', mid: '#f59e0b', dark: '#542d03', glow: '245, 158, 11' },
  red: { core: '#ffe4e6', mid: '#ef4444', dark: '#4a0c0c', glow: '239, 68, 68' },
  green: { core: '#dcfce7', mid: '#22c55e', dark: '#083b1b', glow: '34, 197, 94' },
  blue: { core: '#e0f2fe', mid: '#38bdf8', dark: '#082f49', glow: '56, 189, 248' },
  pink: { core: '#fce7f3', mid: '#f472b6', dark: '#4a0d2d', glow: '244, 114, 182' },
};

const LED_SIZES = { sm: 14, md: 20, lg: 28 };

const LED_CSS_TEXT = `
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    vertical-align: middle;
    contain: layout style paint;
    --moog-label-color: rgba(232, 230, 223, 0.72);
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  }
  .wrap {
    display: inline-flex; align-items: center; gap: 6px;
    flex-direction: var(--_led-dir, column);
  }
  .led-label {
    font-size: 9.5px; font-weight: 800; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--moog-label-color);
    text-shadow: 0 1px 2px rgba(0,0,0,0.85);
  }
  .bezel {
    position: relative;
    width: var(--_bezel-size, 26px); height: var(--_bezel-size, 26px);
    border-radius: 50%; padding: 3px; box-sizing: border-box;
    background: var(--_bezel-bg);
    box-shadow: 0 2px 6px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 1px rgba(255,255,255,0.25);
    display: grid; place-items: center;
  }
  .blink-gate {
    position: relative; width: 100%; height: 100%; display: grid; place-items: center;
  }
  :host([blink]:not([blink="false"])) .blink-gate.is-on {
    animation: moog-led-blink var(--_blink-dur, 1000ms) steps(1, end) infinite;
  }
  @keyframes moog-led-blink {
    0%, 49.9% { opacity: 1; }
    50%, 100% { opacity: 0.08; }
  }
  .bulb-halo {
    position: absolute; inset: 0; border-radius: 50%; pointer-events: none;
    opacity: 0; will-change: opacity;
    box-shadow: 0 0 14px rgba(var(--_led-glow), 0.88), 0 0 28px rgba(var(--_led-glow), 0.52);
    transition: opacity 70ms linear;
  }
  .bulb {
    width: 100%; height: 100%; border-radius: 50%; position: relative; overflow: hidden;
    background: radial-gradient(circle at 38% 34%, color-mix(in srgb, var(--_led-mid) 35%, transparent) 0%, var(--_led-dark) 75%, #09090b 100%);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.85);
  }
  .bulb-glow {
    position: absolute; inset: 0; border-radius: 50%; opacity: 0; will-change: opacity;
    background: radial-gradient(circle at 38% 34%, var(--_led-core) 0%, var(--_led-mid) 54%, var(--_led-dark) 100%);
    transition: opacity 70ms linear;
  }
  .bulb.is-jewel::before {
    content: ''; position: absolute; inset: 14%; border-radius: 50%;
    background: conic-gradient(
      from 0deg,
      rgba(255,255,255,0.28) 0deg 30deg, rgba(0,0,0,0.18) 30deg 60deg,
      rgba(255,255,255,0.22) 60deg 90deg, rgba(0,0,0,0.18) 90deg 120deg,
      rgba(255,255,255,0.28) 120deg 150deg, rgba(0,0,0,0.18) 150deg 180deg,
      rgba(255,255,255,0.22) 180deg 210deg, rgba(0,0,0,0.18) 210deg 240deg,
      rgba(255,255,255,0.28) 240deg 270deg, rgba(0,0,0,0.18) 270deg 300deg,
      rgba(255,255,255,0.22) 300deg 330deg, rgba(0,0,0,0.18) 330deg 360deg
    );
    mix-blend-mode: overlay; z-index: 2; pointer-events: none;
  }
  .bulb::after {
    content: ''; position: absolute; top: 14%; left: 20%; width: 34%; height: 24%;
    border-radius: 50%; background: rgba(255,255,255,0.55); transform: rotate(-28deg);
    z-index: 3; pointer-events: none;
  }
`;

let sharedLedSheet = null;
function getLedSheet() {
  if (!sharedLedSheet && typeof CSSStyleSheet !== 'undefined') {
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(LED_CSS_TEXT);
      sharedLedSheet = sheet;
    } catch (_) {
      sharedLedSheet = null;
    }
  }
  return sharedLedSheet;
}

export class MoogLed extends HTMLElement {
  static get observedAttributes() {
    return ['on', 'active', 'intensity', 'color', 'variant', 'bezel', 'size', 'label', 'label-position', 'blink'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._on = false;
    this._intensity = 1;
    this._rendered = false;
    this._renderPending = false;
  }

  connectedCallback() {
    this._syncStateFromAttrs();
    this._render();
    this._updateVisuals();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'on' || name === 'active' || name === 'intensity') {
      this._syncStateFromAttrs();
      if (this._rendered) this._updateVisuals();
      return;
    }
    if (name === 'blink') {
      if (this._rendered) this._updateBlinkVar();
      return;
    }
    if (this._rendered) this._scheduleRender();
  }

  _scheduleRender() {
    if (this._renderPending) return;
    this._renderPending = true;
    queueMicrotask(() => {
      this._renderPending = false;
      if (!this.isConnected) return;
      this._render();
      this._updateVisuals();
    });
  }

  _syncStateFromAttrs() {
    const hasOn = (this.hasAttribute('on') && this.getAttribute('on') !== 'false') ||
                  (this.hasAttribute('active') && this.getAttribute('active') !== 'false');
    this._on = hasOn;
    const rawInt = this.getAttribute('intensity');
    if (rawInt !== null && rawInt.trim() !== '' && Number.isFinite(Number(rawInt))) {
      this._intensity = Math.min(1, Math.max(0, Number(rawInt)));
    } else {
      this._intensity = 1;
    }
  }

  get on() { return this._on; }
  set on(v) {
    const next = Boolean(v);
    if (next !== this._on) {
      this._on = next;
      if (next) this.setAttribute('on', '');
      else {
        this.removeAttribute('on');
        this.removeAttribute('active');
      }
      if (this._rendered) this._updateVisuals();
    }
  }

  get intensity() { return this._intensity; }
  set intensity(v) {
    const n = Math.min(1, Math.max(0, Number(v) || 0));
    if (Math.abs(n - this._intensity) < 0.005) return;
    this._intensity = n;
    if (this._rendered) this._updateVisuals();
  }

  _getSizePx() {
    const raw = this.getAttribute('size') || 'md';
    if (LED_SIZES[raw]) return LED_SIZES[raw];
    const n = Number(raw);
    return Number.isFinite(n) && n >= 8 ? n : LED_SIZES.md;
  }

  _getBlinkDurationMs() {
    const rawMs = Number(this.getAttribute('blink'));
    const half = Number.isFinite(rawMs) && rawMs >= 60 ? rawMs : 500;
    return half * 2;
  }

  _updateBlinkVar() {
    if (this._wrapEl) {
      this._wrapEl.style.setProperty('--_blink-dur', `${this._getBlinkDurationMs()}ms`);
    }
  }

  _render() {
    const sizePx = this._getSizePx();
    const label = this.getAttribute('label') || '';
    const labelPos = this.getAttribute('label-position') || 'top';
    const isJewel = this.getAttribute('variant') !== 'flat';
    const bezel = this.getAttribute('bezel') || 'black';
    const colKey = (this.getAttribute('color') || 'amber').toLowerCase();
    const pal = LED_PALETTE[colKey] || {
      core: '#ffffff',
      mid: this.getAttribute('color') || '#f59e0b',
      dark: '#262626',
      glow: '245, 158, 11',
    };

    const bezelGrad =
      bezel === 'chrome'
        ? 'linear-gradient(135deg, #e2e8f0 0%, #64748b 55%, #cbd5e1 100%)'
        : bezel === 'brass'
          ? 'linear-gradient(135deg, #f3d78a 0%, #8a6a24 55%, #d4af53 100%)'
          : 'linear-gradient(135deg, #32353b 0%, #0a0b0d 65%, #23252a 100%)';

    const dir = labelPos === 'right' || labelPos === 'left' ? 'row' : 'column';
    const labelHtml = label ? `<span class="led-label">${this._esc(label)}</span>` : '';
    const sheet = getLedSheet();
    const useAdopted = sheet && this.shadowRoot.adoptedStyleSheets !== undefined;
    const styleVars = `--_led-dir:${dir};--_bezel-size:${sizePx + 6}px;--_bezel-bg:${bezelGrad};--_led-core:${pal.core};--_led-mid:${pal.mid};--_led-dark:${pal.dark};--_led-glow:${pal.glow};--_blink-dur:${this._getBlinkDurationMs()}ms;`;

    this.shadowRoot.innerHTML = `
      ${useAdopted ? '' : `<style>${LED_CSS_TEXT}</style>`}
      <div class="wrap" style="${styleVars}" role="status" aria-label="${this._esc(label || 'LED Indicator')}">
        ${labelPos === 'top' || labelPos === 'left' ? labelHtml : ''}
        <div class="bezel">
          <div class="blink-gate">
            <div class="bulb-halo"></div>
            <div class="bulb ${isJewel ? 'is-jewel' : ''}">
              <div class="bulb-glow"></div>
            </div>
          </div>
        </div>
        ${labelPos === 'bottom' || labelPos === 'right' ? labelHtml : ''}
      </div>
    `;

    if (useAdopted) this.shadowRoot.adoptedStyleSheets = [sheet];

    this._wrapEl = this.shadowRoot.querySelector('.wrap');
    this._blinkGateEl = this.shadowRoot.querySelector('.blink-gate');
    this._haloEl = this.shadowRoot.querySelector('.bulb-halo');
    this._glowEl = this.shadowRoot.querySelector('.bulb-glow');
    this._rendered = true;
  }

  _updateVisuals() {
    if (!this._rendered || !this._glowEl) return;
    const effective = this._on ? this._intensity : 0;
    const op = effective.toFixed(3);
    this._glowEl.style.opacity = op;
    if (this._haloEl) this._haloEl.style.opacity = op;
    if (this._blinkGateEl) this._blinkGateEl.classList.toggle('is-on', this._on);
  }

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

export function registerMoogLed(tagName = 'moog-led') {
  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
    customElements.define(tagName, MoogLed);
  }
}

registerMoogLed('moog-led');
