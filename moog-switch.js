/**
 * <moog-switch> — Reusable Minimoog Model D Style Rocker & Toggle Switch Component
 *
 * Variants:
 *  - variant="rocker" : Iconic Minimoog Model D angled 3D rocker paddle (orange / blue / red / ivory / dark)
 *  - variant="toggle" : Classic metallic bat-handle toggle switch with hex mounting nut
 *
 * @example
 * <moog-switch label="FILTER MOD" color="orange" checked></moog-switch>
 * <moog-switch label="NOISE" color="blue" on-label="WHITE" off-label="PINK"></moog-switch>
 * <moog-switch label="POWER" variant="toggle" checked></moog-switch>
 */

const SWITCH_COLORS = {
  orange: {
    base: '#c94718',
    lit: '#f0642b',
    dark: '#7c280a',
    edge: '#ff8a54',
    text: '#fff4ec',
  },
  blue: {
    base: '#436270',
    lit: '#5b8191',
    dark: '#253841',
    edge: '#82a7b8',
    text: '#eef6fa',
  },
  red: {
    base: '#b91c1c',
    lit: '#e12d2d',
    dark: '#6e1010',
    edge: '#f87171',
    text: '#fff1f2',
  },
  ivory: {
    base: '#cfc9b8',
    lit: '#eae4d3',
    dark: '#7a7466',
    edge: '#fbf8f0',
    text: '#1f1d18',
  },
  dark: {
    base: '#27292e',
    lit: '#3b3e45',
    dark: '#111215',
    edge: '#565a63',
    text: '#e8e6df',
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

    const labelHtml = label ? `<div class="sw-label">${this._esc(label)}</div>` : '';

    const rockerBodyHtml = isVert
      ? `
        <div class="rocker-wrap vertical">
          <span class="state-tag tag-on">${this._esc(onLabel)}</span>
          <button class="rocker-housing vertical" type="button" role="switch" aria-checked="${this._checked}" aria-label="${this._esc(label || onLabel)}">
            <span class="rocker-paddle">
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
              <span class="paddle-ridge"></span>
            </span>
          </button>
          <span class="state-tag tag-on">${this._esc(onLabel)}</span>
        </div>
      `;

    const toggleBodyHtml = `
      <div class="toggle-wrap">
        <span class="state-tag tag-on">${this._esc(onLabel)}</span>
        <button class="toggle-housing" type="button" role="switch" aria-checked="${this._checked}" aria-label="${this._esc(label || onLabel)}">
          <span class="hex-nut"></span>
          <span class="toggle-well"></span>
          <span class="bat-arm">
            <span class="bat-tip"></span>
          </span>
        </button>
        <span class="state-tag tag-off">${this._esc(offLabel)}</span>
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
          --moog-tag-color: rgba(232, 230, 223, 0.58);
          --moog-tag-active: #f59e0b;
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
        .rocker-wrap.vertical, .toggle-wrap {
          flex-direction: column;
        }
        .rocker-wrap.horizontal {
          flex-direction: row;
        }
        .state-tag {
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--moog-tag-color);
          transition: color 120ms ease;
        }
        :host([checked]) .tag-on {
          color: var(--moog-tag-active);
        }
        :host(:not([checked])) .tag-off {
          color: #e8e6df;
        }

        /* ---- Minimoog 3D Rocker Paddle ---- */
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
        }
        .rocker-housing.vertical {
          width: 28px;
          height: 46px;
        }
        .rocker-housing.horizontal {
          width: 46px;
          height: 28px;
        }
        .rocker-housing:focus-visible,
        .toggle-housing:focus-visible {
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.8), 0 0 12px rgba(245, 158, 11, 0.4);
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
          transition: background 140ms ease, box-shadow 140ms ease, transform 120ms ease;
        }

        .rocker-housing.vertical .rocker-paddle {
          background: linear-gradient(180deg, ${palette.dark} 0%, ${palette.base} 46%, ${palette.lit} 100%);
          box-shadow:
            inset 0 -5px 8px rgba(0, 0, 0, 0.52),
            inset 0 2px 3px rgba(255, 255, 255, 0.25);
        }
        .rocker-housing.vertical[aria-checked="true"] .rocker-paddle {
          background: linear-gradient(180deg, ${palette.lit} 0%, ${palette.base} 54%, ${palette.dark} 100%);
          box-shadow:
            inset 0 5px 8px rgba(0, 0, 0, 0.45),
            inset 0 -2px 3px rgba(255, 255, 255, 0.28);
        }

        .rocker-housing.horizontal .rocker-paddle {
          background: linear-gradient(90deg, ${palette.lit} 0%, ${palette.base} 54%, ${palette.dark} 100%);
          box-shadow:
            inset 5px 0 8px rgba(0, 0, 0, 0.45),
            inset -2px 0 3px rgba(255, 255, 255, 0.25);
        }
        .rocker-housing.horizontal[aria-checked="true"] .rocker-paddle {
          background: linear-gradient(90deg, ${palette.dark} 0%, ${palette.base} 46%, ${palette.lit} 100%);
          box-shadow:
            inset -5px 0 8px rgba(0, 0, 0, 0.45),
            inset 2px 0 3px rgba(255, 255, 255, 0.28);
        }

        .paddle-ridge {
          position: absolute;
          background: linear-gradient(90deg, rgba(0,0,0,0.28), ${palette.edge}, rgba(0,0,0,0.28));
          opacity: 0.72;
          border-radius: 1px;
        }
        .rocker-housing.vertical .paddle-ridge {
          width: 82%;
          height: 3px;
          top: 50%;
          transform: translateY(-50%);
        }
        .rocker-housing.horizontal .paddle-ridge {
          width: 3px;
          height: 82%;
          left: 50%;
          transform: translateX(-50%);
        }

        /* ---- Vintage Chrome Bat Toggle Switch ---- */
        .toggle-housing {
          appearance: none;
          border: none;
          background: transparent;
          width: 36px;
          height: 46px;
          padding: 0;
          cursor: pointer;
          outline: none;
          position: relative;
          display: grid;
          place-items: center;
        }
        .hex-nut {
          width: 26px;
          height: 26px;
          background: linear-gradient(135deg, #d7dce2 0%, #7d858e 55%, #b5bcc4 100%);
          clip-path: polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%);
          box-shadow: 0 3px 6px rgba(0,0,0,0.85);
          position: relative;
        }
        .toggle-well {
          position: absolute;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: radial-gradient(circle, #060608 55%, #3c4047 100%);
          border: 1.5px solid #22252a;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.95);
        }
        .bat-arm {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 8px;
          height: 22px;
          margin-left: -4px;
          border-radius: 4px;
          background: linear-gradient(90deg, #646b73 0%, #f1f5f9 38%, #9aa2ab 75%, #474d54 100%);
          box-shadow: 0 3px 6px rgba(0,0,0,0.75);
          transform-origin: center 18px;
          transition: transform 130ms cubic-bezier(0.25, 0.9, 0.35, 1.15);
          transform: translateY(-4px) rotate(180deg) scaleY(0.95);
        }
        .toggle-housing[aria-checked="true"] .bat-arm {
          transform: translateY(-21px) rotate(0deg) scaleY(1);
        }
        .bat-tip {
          position: absolute;
          top: 0;
          left: -1px;
          width: 10px;
          height: 8px;
          border-radius: 5px;
          background: radial-gradient(circle at 35% 30%, #ffffff 0%, #b8c0c8 60%, #5c636b 100%);
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
