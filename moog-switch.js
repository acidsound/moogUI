/**
 * <moog-switch> — Reusable Minimoog Model D Style Rocker & Toggle Switch Component
 *
 * Variants:
 *  - variant="rocker" : Iconic Minimoog Model D 3D illuminated rocker paddle
 *  - variant="toggle" : Classic metallic bat-handle toggle switch with center-locked ball pivot
 *
 * Includes built-in ON LED backlight illumination (disable with backlight="false").
 *
 * @example
 * <moog-switch label="FILTER MOD" color="orange" checked></moog-switch>
 * <moog-switch label="NOISE" color="blue" on-label="WHITE" off-label="PINK"></moog-switch>
 * <moog-switch label="POWER" variant="toggle" checked></moog-switch>
 */

const SWITCH_COLORS = {
  orange: {
    base: '#c94718',
    lit: '#f97316',
    dark: '#7c280a',
    edge: '#ff9d66',
    glow: '249, 115, 22',
    ledCore: '#fff3d6',
    ledBright: '#fb923c',
  },
  blue: {
    base: '#436270',
    lit: '#5b8191',
    dark: '#253841',
    edge: '#82a7b8',
    glow: '56, 189, 248',
    ledCore: '#e0f7ff',
    ledBright: '#38bdf8',
  },
  red: {
    base: '#b91c1c',
    lit: '#ef4444',
    dark: '#6e1010',
    edge: '#fca5a5',
    glow: '239, 68, 68',
    ledCore: '#ffe4e6',
    ledBright: '#f87171',
  },
  ivory: {
    base: '#cfc9b8',
    lit: '#eae4d3',
    dark: '#7a7466',
    edge: '#fbf8f0',
    glow: '245, 158, 11',
    ledCore: '#fffbeb',
    ledBright: '#fbbf24',
  },
  dark: {
    base: '#27292e',
    lit: '#3b3e45',
    dark: '#111215',
    edge: '#565a63',
    glow: '245, 158, 11',
    ledCore: '#fef3c7',
    ledBright: '#f59e0b',
  },
};

const SWITCH_SIZES = {
  sm: 0.82,
  md: 1,
  lg: 1.24,
};

export class MoogSwitch extends HTMLElement {
  static get observedAttributes() {
    return [
      'checked',
      'label',
      'label-position',
      'on-label',
      'off-label',
      'variant',
      'color',
      'led-color',
      'backlight',
      'orientation',
      'size',
      'disabled',
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._checked = false;
    this._rendered = false;

    this._onClick = this._onClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  connectedCallback() {
    this._checked = this.hasAttribute('checked') && this.getAttribute('checked') !== 'false';
    this._render();
    this._updateVisuals();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'checked') {
      this._checked = newVal !== null && newVal !== 'false';
      if (this._rendered) this._updateVisuals();
      return;
    }
    if (this._rendered) {
      this._render();
      this._updateVisuals();
    }
  }

  get checked() {
    return this._checked;
  }
  set checked(val) {
    const next = Boolean(val);
    if (next !== this._checked) {
      this._checked = next;
      if (next) this.setAttribute('checked', '');
      else this.removeAttribute('checked');
      if (this._rendered) this._updateVisuals();
    }
  }

  get value() {
    return this._checked
      ? this.getAttribute('on-label') || 'ON'
      : this.getAttribute('off-label') || 'OFF';
  }

  get backlight() {
    return this.getAttribute('backlight') !== 'false';
  }
  set backlight(flag) {
    if (flag) this.removeAttribute('backlight');
    else this.setAttribute('backlight', 'false');
  }

  get disabled() {
    return this.hasAttribute('disabled') && this.getAttribute('disabled') !== 'false';
  }
  set disabled(flag) {
    if (flag) this.setAttribute('disabled', '');
    else this.removeAttribute('disabled');
  }

  get variant() {
    return this.getAttribute('variant') === 'toggle' ? 'toggle' : 'rocker';
  }
  set variant(v) {
    this.setAttribute('variant', v);
  }

  toggle() {
    if (this.disabled) return;
    this.checked = !this._checked;
    const detail = { checked: this._checked, value: this.value };
    this.dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true, detail }));
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail }));
  }

  _onClick(e) {
    if (this.disabled) return;
    e.preventDefault();
    this._btnEl.focus({ preventScroll: true });
    this.toggle();
  }

  _onKeyDown(e) {
    if (this.disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.toggle();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (!this._checked) this.toggle();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (this._checked) this.toggle();
    }
  }

  _render() {
    const label = this.getAttribute('label') || '';
    const labelPos = this.getAttribute('label-position') === 'bottom' ? 'bottom' : 'top';
    const onLabel = this.getAttribute('on-label') || 'ON';
    const offLabel = this.getAttribute('off-label') || 'OFF';
    const isToggle = this.variant === 'toggle';
    const isVert = this.getAttribute('orientation') !== 'horizontal';
    const scale = SWITCH_SIZES[this.getAttribute('size')] || 1;
    const palette = SWITCH_COLORS[this.getAttribute('color')] || SWITCH_COLORS.orange;
    const customLed = this.getAttribute('led-color');
    const ledCore = customLed ? '#ffffff' : palette.ledCore;
    const ledBright = customLed || palette.ledBright;
    const hasBacklight = this.backlight;

    const labelHtml = label ? `<div class="sw-label">${this._esc(label)}</div>` : '';

    const rockerBodyHtml = isVert
      ? `
        <div class="rocker-wrap vertical">
          <span class="state-tag tag-on">${this._esc(onLabel)}</span>
          <button class="rocker-housing vertical" type="button" role="switch" aria-checked="${this._checked}" aria-label="${this._esc(label || onLabel)}">
            <span class="rocker-paddle">
              <span class="paddle-backlight"></span>
              <span class="paddle-led-slit"></span>
              <span class="paddle-ridge"></span>
            </span>
          </button>
          <span class="state-tag tag-off">${this._esc(offLabel)}</span>
        </div>
      `
      : `
        <div class="rocker-wrap horizontal">
          <span class="state-tag tag-off">${this._esc(offLabel)}</span>
          <button class="rocker-housing horizontal" type="button" role="switch" aria-checked="${this._checked}" aria-label="${this._esc(label || onLabel)}">
            <span class="rocker-paddle">
              <span class="paddle-backlight"></span>
              <span class="paddle-led-slit"></span>
              <span class="paddle-ridge"></span>
            </span>
          </button>
          <span class="state-tag tag-on">${this._esc(onLabel)}</span>
        </div>
      `;

    const toggleBodyHtml = `
      <div class="toggle-wrap ${isVert ? 'vertical' : 'horizontal'}">
        <span class="state-tag tag-on">${this._esc(isVert ? onLabel : offLabel)}</span>
        <button class="toggle-housing ${isVert ? 'vertical' : 'horizontal'}" type="button" role="switch" aria-checked="${this._checked}" aria-label="${this._esc(label || onLabel)}">
          <span class="toggle-led-ring"></span>
          <span class="hex-nut"></span>
          <span class="toggle-well"></span>
          <span class="pivot-ball"></span>
          <span class="bat-pivot-stage">
            <span class="bat-arm">
              <span class="bat-tip"></span>
            </span>
          </span>
        </button>
        <span class="state-tag tag-off">${this._esc(isVert ? offLabel : onLabel)}</span>
      </div>
    `;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          user-select: none;
          -webkit-user-select: none;
          vertical-align: middle;
          --moog-label-color: #e8e6df;
          --moog-tag-color: rgba(232, 230, 223, 0.56);
          --moog-tag-active: ${ledBright};
          font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
        }
        :host([disabled]) {
          opacity: 0.45;
          pointer-events: none;
        }
        .wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          transform: scale(${scale});
          transform-origin: center center;
        }
        .sw-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--moog-label-color);
          text-align: center;
          text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        }
        .rocker-wrap, .toggle-wrap {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .rocker-wrap.vertical, .toggle-wrap.vertical {
          flex-direction: column;
        }
        .rocker-wrap.horizontal, .toggle-wrap.horizontal {
          flex-direction: row;
        }
        .state-tag {
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--moog-tag-color);
          transition: color 120ms ease, text-shadow 120ms ease;
        }
        :host([checked]) .tag-on {
          color: var(--moog-tag-active);
          ${hasBacklight ? `text-shadow: 0 0 8px rgba(${palette.glow}, 0.6);` : ''}
        }
        :host(:not([checked])) .tag-off {
          color: #e8e6df;
        }
        /* Swap tag highlight if toggle is horizontal (left=off, right=on) */
        .toggle-wrap.horizontal .tag-on { color: var(--moog-tag-color); text-shadow: none; }
        .toggle-wrap.horizontal .tag-off { color: var(--moog-tag-color); text-shadow: none; }
        :host([checked]) .toggle-wrap.horizontal .tag-off {
          color: var(--moog-tag-active);
          ${hasBacklight ? `text-shadow: 0 0 8px rgba(${palette.glow}, 0.6);` : ''}
        }
        :host(:not([checked])) .toggle-wrap.horizontal .tag-on {
          color: #e8e6df;
        }

        /* ---- Minimoog 3D Illuminated Rocker Paddle ---- */
        .rocker-housing {
          appearance: none;
          border: 1.5px solid #040406;
          background: linear-gradient(180deg, #060608 0%, #141518 100%);
          border-radius: 4px;
          padding: 3px;
          cursor: pointer;
          outline: none;
          position: relative;
          box-shadow:
            0 3px 8px rgba(0, 0, 0, 0.75),
            0 0 0 1px rgba(255, 255, 255, 0.12),
            inset 0 2px 5px rgba(0, 0, 0, 0.9);
          transition: box-shadow 140ms ease;
        }
        .rocker-housing.vertical {
          width: 28px;
          height: 46px;
        }
        .rocker-housing.horizontal {
          width: 46px;
          height: 28px;
        }
        ${
          hasBacklight
            ? `
        .rocker-housing[aria-checked="true"] {
          box-shadow:
            0 3px 8px rgba(0, 0, 0, 0.75),
            0 0 14px rgba(${palette.glow}, 0.45),
            0 0 0 1px rgba(${palette.glow}, 0.55),
            inset 0 2px 5px rgba(0, 0, 0, 0.9);
        }`
            : ''
        }
        .rocker-housing:focus-visible,
        .toggle-housing:focus-visible {
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.85), 0 0 12px rgba(245, 158, 11, 0.45);
        }

        .rocker-paddle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          border-radius: 2.5px;
          position: relative;
          overflow: hidden;
          transition: background 140ms ease, box-shadow 140ms ease;
        }

        .rocker-housing.vertical .rocker-paddle {
          background: linear-gradient(180deg, ${palette.dark} 0%, ${palette.base} 46%, ${palette.lit} 100%);
          box-shadow:
            inset 0 -5px 8px rgba(0, 0, 0, 0.52),
            inset 0 2px 3px rgba(255, 255, 255, 0.22);
        }
        .rocker-housing.vertical[aria-checked="true"] .rocker-paddle {
          background: linear-gradient(180deg, ${palette.lit} 0%, ${palette.base} 54%, ${palette.dark} 100%);
          box-shadow:
            inset 0 5px 8px rgba(0, 0, 0, 0.42),
            inset 0 -2px 3px rgba(255, 255, 255, 0.28);
        }

        .rocker-housing.horizontal .rocker-paddle {
          background: linear-gradient(90deg, ${palette.lit} 0%, ${palette.base} 54%, ${palette.dark} 100%);
          box-shadow:
            inset 5px 0 8px rgba(0, 0, 0, 0.45),
            inset -2px 0 3px rgba(255, 255, 255, 0.22);
        }
        .rocker-housing.horizontal[aria-checked="true"] .rocker-paddle {
          background: linear-gradient(90deg, ${palette.dark} 0%, ${palette.base} 46%, ${palette.lit} 100%);
          box-shadow:
            inset -5px 0 8px rgba(0, 0, 0, 0.42),
            inset 2px 0 3px rgba(255, 255, 255, 0.28);
        }

        /* Internal Translucent LED Backlight Overlay */
        .paddle-backlight {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          transition: opacity 120ms ease;
        }
        .rocker-housing.vertical .paddle-backlight {
          background: radial-gradient(circle at 50% 24%, ${ledCore} 0%, ${ledBright} 38%, transparent 78%);
        }
        .rocker-housing.horizontal .paddle-backlight {
          background: radial-gradient(circle at 76% 50%, ${ledCore} 0%, ${ledBright} 38%, transparent 78%);
        }
        ${
          hasBacklight
            ? `.rocker-housing[aria-checked="true"] .paddle-backlight { opacity: 0.72; }`
            : ''
        }

        /* Crisp Illuminated LED Pip / Lens Slit on the ON side */
        .paddle-led-slit {
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          background: rgba(0, 0, 0, 0.36);
          border: 1px solid rgba(0, 0, 0, 0.45);
          transition: background 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
        }
        .rocker-housing.vertical .paddle-led-slit {
          width: 11px;
          height: 3.5px;
          top: 5px;
          left: 50%;
          transform: translateX(-50%);
        }
        .rocker-housing.horizontal .paddle-led-slit {
          width: 3.5px;
          height: 11px;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
        }
        ${
          hasBacklight
            ? `
        .rocker-housing[aria-checked="true"] .paddle-led-slit {
          background: ${ledCore};
          border-color: ${ledBright};
          box-shadow: 0 0 8px ${ledBright}, 0 0 14px rgba(${palette.glow}, 0.95);
        }`
            : ''
        }

        .paddle-ridge {
          position: absolute;
          background: linear-gradient(90deg, rgba(0,0,0,0.28), ${palette.edge}, rgba(0,0,0,0.28));
          opacity: 0.65;
          border-radius: 1px;
        }
        .rocker-housing.vertical .paddle-ridge {
          width: 82%;
          height: 2.5px;
          top: 50%;
          transform: translateY(-50%);
        }
        .rocker-housing.horizontal .paddle-ridge {
          width: 2.5px;
          height: 82%;
          left: 50%;
          transform: translateX(-50%);
        }

        /* ---- Vintage Chrome Bat Toggle Switch (Center-Locked Pivot) ---- */
        .toggle-housing {
          appearance: none;
          border: none;
          background: transparent;
          width: 44px;
          height: 54px;
          padding: 0;
          cursor: pointer;
          outline: none;
          position: relative;
          display: grid;
          place-items: center;
          border-radius: 8px;
        }
        .toggle-housing.horizontal {
          transform: rotate(90deg);
        }

        /* Illuminated Backlight Ring under Hex Nut when ON */
        .toggle-led-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 30px;
          height: 30px;
          margin-left: -15px;
          margin-top: -15px;
          border-radius: 50%;
          pointer-events: none;
          opacity: 0;
          background: radial-gradient(circle, rgba(${palette.glow}, 0.85) 35%, rgba(${palette.glow}, 0) 75%);
          filter: blur(2px);
          transition: opacity 120ms ease;
        }
        ${
          hasBacklight
            ? `.toggle-housing[aria-checked="true"] .toggle-led-ring { opacity: 0.95; }`
            : ''
        }

        .hex-nut {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 26px;
          height: 26px;
          margin-left: -13px;
          margin-top: -13px;
          background: linear-gradient(135deg, #d7dce2 0%, #7d858e 55%, #b5bcc4 100%);
          clip-path: polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%);
          filter: drop-shadow(0 3px 5px rgba(0,0,0,0.85));
        }

        .toggle-well {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 15px;
          height: 15px;
          margin-left: -7.5px;
          margin-top: -7.5px;
          border-radius: 50%;
          background: radial-gradient(circle, #050507 52%, #3c4047 100%);
          border: 1.5px solid #1e2024;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.95);
        }

        /* Fixed center ball-joint at exact (50%, 50%) */
        .pivot-ball {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 10px;
          height: 10px;
          margin-left: -5px;
          margin-top: -5px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 32%, #f8fafc 0%, #94a3b8 55%, #334155 100%);
          box-shadow: 0 1px 3px rgba(0,0,0,0.9);
          z-index: 2;
        }

        /* Bat handle anchored strictly at (50%, 50%) — flips vertically in Z-plane with zero center drift */
        .bat-pivot-stage {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 0;
          height: 0;
          z-index: 3;
          perspective: 140px;
          pointer-events: none;
        }

        .bat-arm {
          position: absolute;
          left: -4.5px;
          top: -22px;
          width: 9px;
          height: 22px;
          border-radius: 4.5px 4.5px 3px 3px;
          background: linear-gradient(90deg, #525860 0%, #f1f5f9 36%, #9aa2ab 76%, #3f454d 100%);
          box-shadow: 0 3px 6px rgba(0,0,0,0.75);
          transform-origin: 50% 22px;
          /* Flip down around exact base pivot (50%, 22px) -> sits dead-center at (0, 0) = (50%, 50%) */
          transform: rotateX(158deg);
          /* Fast late-accelerating snap, zero overshoot/wobble */
          transition: transform 95ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .toggle-housing[aria-checked="true"] .bat-arm {
          transform: rotateX(22deg);
        }

        .bat-tip {
          position: absolute;
          top: -1px;
          left: -1px;
          width: 11px;
          height: 9px;
          border-radius: 5.5px;
          background: radial-gradient(circle at 38% 35%, #ffffff 0%, #cbd5e1 55%, #475569 100%);
          box-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
      </style>

      <div class="wrap">
        ${labelPos === 'top' ? labelHtml : ''}
        ${isToggle ? toggleBodyHtml : rockerBodyHtml}
        ${labelPos === 'bottom' ? labelHtml : ''}
      </div>
    `;

    this._btnEl = this.shadowRoot.querySelector('button[role="switch"]');
    this._btnEl.addEventListener('click', this._onClick);
    this._btnEl.addEventListener('keydown', this._onKeyDown);
    this._rendered = true;
  }

  _updateVisuals() {
    if (!this._rendered || !this._btnEl) return;
    this._btnEl.setAttribute('aria-checked', String(this._checked));
  }

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

export function registerMoogSwitch(tagName = 'moog-switch') {
  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
    customElements.define(tagName, MoogSwitch);
  }
}

registerMoogSwitch('moog-switch');
