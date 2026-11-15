/**
 * <moog-led> — Reusable Vintage Jewel Pilot Lamp & Panel LED Indicator Component
 *
 * Variants:
 *  - variant="jewel" : Faceted Minimoog OVERLOAD-style glass jewel lamp in bezel housing
 *  - variant="flat"  : Crisp 5mm recessed diode LED with metallic collar
 *
 * Supports analog dimming via `intensity` (0..1) and optional automatic `blink` interval.
 *
 * @example
 * <moog-led label="OVERLOAD" color="amber" on></moog-led>
 * <moog-led label="LFO SYNC" variant="flat" color="red" blink="450"></moog-led>
 */

const LED_PALETTE = {
  amber: { core: '#fff5cc', mid: '#f59e0b', dark: '#542d03', glow: '245, 158, 11' },
  red: { core: '#ffe4e6', mid: '#ef4444', dark: '#4a0c0c', glow: '239, 68, 68' },
  green: { core: '#dcfce7', mid: '#22c55e', dark: '#083b1b', glow: '34, 197, 94' },
  blue: { core: '#e0f2fe', mid: '#38bdf8', dark: '#082f49', glow: '56, 189, 248' },
  pink: { core: '#fce7f3', mid: '#f472b6', dark: '#4a0d2d', glow: '244, 114, 182' },
};

const LED_SIZES = {
  sm: 14,
  md: 20,
  lg: 28,
};

export class MoogLed extends HTMLElement {
  static get observedAttributes() {
    return ['on', 'active', 'intensity', 'color', 'variant', 'bezel', 'size', 'label', 'label-position', 'blink'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._on = false;
    this._intensity = 1;
    this._blinkPhase = true;
    this._blinkTimer = null;
    this._rendered = false;
  }

  connectedCallback() {
    this._syncStateFromAttrs();
    this._render();
    this._updateVisuals();
    this._setupBlink();
  }

  disconnectedCallback() {
    clearInterval(this._blinkTimer);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'on' || name === 'active' || name === 'intensity') {
      this._syncStateFromAttrs();
      if (this._rendered) this._updateVisuals();
      return;
    }
    if (name === 'blink') {
      this._setupBlink();
      if (this._rendered) this._updateVisuals();
      return;
    }
    if (this._rendered) {
      this._render();
      this._updateVisuals();
    }
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

  get on() {
    return this._on;
  }
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

  get intensity() {
    return this._intensity;
  }
  set intensity(v) {
    const n = Math.min(1, Math.max(0, Number(v) || 0));
    this._intensity = n;
    this.setAttribute('intensity', String(n));
    if (this._rendered) this._updateVisuals();
  }

  _setupBlink() {
    clearInterval(this._blinkTimer);
    this._blinkPhase = true;
    if (!this.hasAttribute('blink') || this.getAttribute('blink') === 'false') return;
    const rawMs = Number(this.getAttribute('blink'));
    const ms = Number.isFinite(rawMs) && rawMs >= 60 ? rawMs : 500;
    this._blinkTimer = setInterval(() => {
      this._blinkPhase = !this._blinkPhase;
      this._updateVisuals();
    }, ms);
  }

  _getSizePx() {
    const raw = this.getAttribute('size') || 'md';
    if (LED_SIZES[raw]) return LED_SIZES[raw];
    const n = Number(raw);
    return Number.isFinite(n) && n >= 8 ? n : LED_SIZES.md;
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

    const labelHtml = label ? `<span class="led-label">${this._esc(label)}</span>` : '';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          user-select: none;
          vertical-align: middle;
          --moog-label-color: rgba(232, 230, 223, 0.72);
          font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
        }
        .wrap {
          display: inline-flex;
          flex-direction: ${labelPos === 'right' || labelPos === 'left' ? 'row' : 'column'};
          align-items: center;
          gap: 6px;
        }
        .led-label {
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--moog-label-color);
          text-shadow: 0 1px 2px rgba(0,0,0,0.85);
        }
        .bezel {
          width: ${sizePx + 6}px;
          height: ${sizePx + 6}px;
          border-radius: 50%;
          padding: 3px;
          box-sizing: border-box;
          background: ${bezelGrad};
          box-shadow:
            0 2px 6px rgba(0, 0, 0, 0.85),
            0 0 0 1px rgba(255, 255, 255, 0.12),
            inset 0 1px 1px rgba(255, 255, 255, 0.25);
          display: grid;
          place-items: center;
        }
        .bulb {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          position: relative;
          overflow: hidden;
          background: radial-gradient(circle at 38% 34%, ${pal.mid}55 0%, ${pal.dark} 75%, #09090b 100%);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.85);
          transition: box-shadow 70ms linear, filter 70ms linear;
        }
        .bulb-glow {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          opacity: 0;
          background: ${
            isJewel
              ? `radial-gradient(circle at 38% 34%, ${pal.core} 0%, ${pal.mid} 50%, ${pal.dark} 100%)`
              : `radial-gradient(circle at 40% 38%, ${pal.core} 0%, ${pal.mid} 68%, ${pal.dark} 100%)`
          };
          transition: opacity 70ms linear;
        }
        ${
          isJewel
            ? `
        .bulb::before {
          content: '';
          position: absolute;
          inset: 14%;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            rgba(255,255,255,0.28) 0deg 30deg,
            rgba(0,0,0,0.18) 30deg 60deg,
            rgba(255,255,255,0.22) 60deg 90deg,
            rgba(0,0,0,0.18) 90deg 120deg,
            rgba(255,255,255,0.28) 120deg 150deg,
            rgba(0,0,0,0.18) 150deg 180deg,
            rgba(255,255,255,0.22) 180deg 210deg,
            rgba(0,0,0,0.18) 210deg 240deg,
            rgba(255,255,255,0.28) 240deg 270deg,
            rgba(0,0,0,0.18) 270deg 300deg,
            rgba(255,255,255,0.22) 300deg 330deg,
            rgba(0,0,0,0.18) 330deg 360deg
          );
          mix-blend-mode: overlay;
          z-index: 2;
          pointer-events: none;
        }`
            : ''
        }
        .bulb::after {
          content: '';
          position: absolute;
          top: 14%;
          left: 20%;
          width: 34%;
          height: 24%;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.55);
          transform: rotate(-28deg);
          z-index: 3;
          pointer-events: none;
        }
      </style>
      <div class="wrap" role="status" aria-label="${this._esc(label || 'LED Indicator')}">
        ${labelPos === 'top' || labelPos === 'left' ? labelHtml : ''}
        <div class="bezel">
          <div class="bulb" data-glow-rgb="${pal.glow}">
            <div class="bulb-glow"></div>
          </div>
        </div>
        ${labelPos === 'bottom' || labelPos === 'right' ? labelHtml : ''}
      </div>
    `;

    this._bulbEl = this.shadowRoot.querySelector('.bulb');
    this._glowEl = this.shadowRoot.querySelector('.bulb-glow');
    this._rendered = true;
  }

  _updateVisuals() {
    if (!this._rendered || !this._glowEl) return;
    const effective = this._on && this._blinkPhase ? this._intensity : 0;
    const rgb = this._bulbEl.dataset.glowRgb || '245, 158, 11';
    this._glowEl.style.opacity = effective.toFixed(3);
    if (effective > 0.02) {
      this._bulbEl.style.boxShadow = `0 0 ${(14 * effective).toFixed(1)}px rgba(${rgb}, ${(0.88 * effective).toFixed(2)}), 0 0 ${(28 * effective).toFixed(1)}px rgba(${rgb}, ${(0.52 * effective).toFixed(2)}), inset 0 1px 2px rgba(255,255,255,0.45)`;
    } else {
      this._bulbEl.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.85)';
    }
  }

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

export function registerMoogLed(tagName = 'moog-led') {
  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
    customElements.define(tagName, MoogLed);
  }
}

registerMoogLed('moog-led');
