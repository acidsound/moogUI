/**
 * <moog-switch> — Reusable Minimoog Model D Style Rocker & Toggle Switch Component
 *
 * Variants:
 *  - variant="rocker" : Iconic Minimoog Model D 3D illuminated rocker paddle
 *  - variant="toggle" : Precision SVG metallic bat-handle toggle switch with
 *                       center-fused ball pivot & zero-drift 3D foreshortening
 *
 * Includes built-in ON LED backlight illumination (disable with backlight="false").
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

function buildToggleBatPath(cx, cy, tilt) {
  // tilt: -1 = straight UP (ON), 0 = pointing toward camera, +1 = straight DOWN (OFF)
  const rBase = 3.8;
  const rTip = 6.1 - 0.7 * Math.abs(tilt);
  const tipY = cy + tilt * 18.5;
  const dy = tipY - cy;

  if (Math.abs(dy) < 0.8) {
    return {
      d: `M${cx - rTip},${cy} A${rTip},${rTip} 0 1 1 ${cx + rTip},${cy} A${rTip},${rTip} 0 1 1 ${cx - rTip},${cy} Z`,
      tipY,
      rTip,
    };
  }

  const sweep = dy < 0 ? 1 : 0;
  const wTip = rTip * 0.96;
  const d = [
    `M${(cx - rBase).toFixed(2)},${cy.toFixed(2)}`,
    `L${(cx - wTip).toFixed(2)},${tipY.toFixed(2)}`,
    `A${rTip.toFixed(2)},${rTip.toFixed(2)} 0 1 ${sweep} ${(cx + wTip).toFixed(2)},${tipY.toFixed(2)}`,
    `L${(cx + rBase).toFixed(2)},${cy.toFixed(2)}`,
    `A${rBase.toFixed(2)},${rBase.toFixed(2)} 0 1 ${sweep} ${(cx - rBase).toFixed(2)},${cy.toFixed(2)}`,
    'Z',
  ].join(' ');

  return { d, tipY, rTip };
}

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
    this._toggleTilt = 1; // +1 = OFF (down), -1 = ON (up)
    this._animRaf = null;
    this._uid = `ms-${Math.random().toString(36).slice(2, 9)}`;

    this._onClick = this._onClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  connectedCallback() {
    this._checked = this.hasAttribute('checked') && this.getAttribute('checked') !== 'false';
    this._toggleTilt = this._checked ? -1 : 1;
    this._render();
    this._updateVisuals(false);
  }

  disconnectedCallback() {
    if (this._animRaf) cancelAnimationFrame(this._animRaf);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'checked') {
      this._checked = newVal !== null && newVal !== 'false';
      if (this._rendered) this._updateVisuals(true);
      return;
    }
    if (this._rendered) {
      this._render();
      this._updateVisuals(false);
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
      if (this._rendered) this._updateVisuals(true);
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
    const uid = this._uid;

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

    // Hex nut points around exact center (30, 30), radius 14.5
    const hexPts = Array.from({ length: 6 }, (_, i) => {
      const a = (i * Math.PI) / 3 - Math.PI / 2;
      return `${(30 + 14.5 * Math.cos(a)).toFixed(2)},${(30 + 14.5 * Math.sin(a)).toFixed(2)}`;
    }).join(' ');

    const initBat = buildToggleBatPath(30, 30, this._toggleTilt);

    const toggleBodyHtml = `
      <div class="toggle-wrap ${isVert ? 'vertical' : 'horizontal'}">
        <span class="state-tag tag-on">${this._esc(isVert ? onLabel : offLabel)}</span>
        <button class="toggle-housing ${isVert ? 'vertical' : 'horizontal'}" type="button" role="switch" aria-checked="${this._checked}" aria-label="${this._esc(label || onLabel)}">
          <svg class="toggle-svg" viewBox="0 0 60 60" aria-hidden="true">
            <defs>
              <radialGradient id="${uid}-glow" cx="50%" cy="50%" r="50%">
                <stop offset="35%" stop-color="${ledBright}" stop-opacity="0.95" />
                <stop offset="72%" stop-color="${ledBright}" stop-opacity="0.35" />
                <stop offset="100%" stop-color="${ledBright}" stop-opacity="0" />
              </radialGradient>
              <linearGradient id="${uid}-nut" x1="15%" y1="10%" x2="85%" y2="90%">
                <stop offset="0%" stop-color="#e2e8f0" />
                <stop offset="50%" stop-color="#8b949e" />
                <stop offset="100%" stop-color="#4b525a" />
              </linearGradient>
              <radialGradient id="${uid}-well" cx="50%" cy="50%" r="50%">
                <stop offset="45%" stop-color="#050507" />
                <stop offset="85%" stop-color="#1e2126" />
                <stop offset="100%" stop-color="#474d56" />
              </radialGradient>
              <linearGradient id="${uid}-chrome" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#474e57" />
                <stop offset="28%" stop-color="#f1f5f9" />
                <stop offset="52%" stop-color="#cbd5e1" />
                <stop offset="78%" stop-color="#64748b" />
                <stop offset="100%" stop-color="#334155" />
              </linearGradient>
              <radialGradient id="${uid}-tipglint" cx="35%" cy="32%" r="60%">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
                <stop offset="55%" stop-color="#e2e8f0" stop-opacity="0.35" />
                <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
              </radialGradient>
            </defs>

            <!-- Backlight Ring behind Hex Nut -->
            <circle class="toggle-led-ring" cx="30" cy="30" r="22" fill="url(#${uid}-glow)" />

            <!-- Hex Mounting Nut & Recessed Washer -->
            <polygon points="${hexPts}" fill="url(#${uid}-nut)" stroke="#1a1c20" stroke-width="1" />
            <circle cx="30" cy="30" r="10.2" fill="#2c3037" stroke="rgba(255,255,255,0.22)" stroke-width="0.7" />
            <circle cx="30" cy="30" r="8.2" fill="url(#${uid}-well)" />

            <!-- Center-Fused Ball Pivot & Unified Chrome Bat Handle -->
            <path class="bat-shadow" d="${initBat.d}" fill="rgba(0,0,0,0.62)" transform="translate(2.2, 2.8)" />
            <circle cx="30" cy="30" r="4.6" fill="url(#${uid}-chrome)" stroke="#0f1115" stroke-width="0.6" />
            <path class="bat-shaft" d="${initBat.d}" fill="url(#${uid}-chrome)" stroke="#1e242c" stroke-width="0.65" />
            <circle class="bat-tip-glint" cx="28.7" cy="${(initBat.tipY - 1.2).toFixed(2)}" r="${(initBat.rTip * 0.72).toFixed(2)}" fill="url(#${uid}-tipglint)" />
          </svg>
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
        .rocker-housing.vertical { width: 28px; height: 46px; }
        .rocker-housing.horizontal { width: 46px; height: 28px; }
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
          box-shadow: inset 0 -5px 8px rgba(0, 0, 0, 0.52), inset 0 2px 3px rgba(255, 255, 255, 0.22);
        }
        .rocker-housing.vertical[aria-checked="true"] .rocker-paddle {
          background: linear-gradient(180deg, ${palette.lit} 0%, ${palette.base} 54%, ${palette.dark} 100%);
          box-shadow: inset 0 5px 8px rgba(0, 0, 0, 0.42), inset 0 -2px 3px rgba(255, 255, 255, 0.28);
        }
        .rocker-housing.horizontal .rocker-paddle {
          background: linear-gradient(90deg, ${palette.lit} 0%, ${palette.base} 54%, ${palette.dark} 100%);
          box-shadow: inset 5px 0 8px rgba(0, 0, 0, 0.45), inset -2px 0 3px rgba(255, 255, 255, 0.22);
        }
        .rocker-housing.horizontal[aria-checked="true"] .rocker-paddle {
          background: linear-gradient(90deg, ${palette.dark} 0%, ${palette.base} 46%, ${palette.lit} 100%);
          box-shadow: inset -5px 0 8px rgba(0, 0, 0, 0.42), inset 2px 0 3px rgba(255, 255, 255, 0.28);
        }

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
        ${hasBacklight ? `.rocker-housing[aria-checked="true"] .paddle-backlight { opacity: 0.72; }` : ''}

        .paddle-led-slit {
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          background: rgba(0, 0, 0, 0.36);
          border: 1px solid rgba(0, 0, 0, 0.45);
          transition: background 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
        }
        .rocker-housing.vertical .paddle-led-slit {
          width: 11px; height: 3.5px; top: 5px; left: 50%; transform: translateX(-50%);
        }
        .rocker-housing.horizontal .paddle-led-slit {
          width: 3.5px; height: 11px; right: 5px; top: 50%; transform: translateY(-50%);
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
          width: 82%; height: 2.5px; top: 50%; transform: translateY(-50%);
        }
        .rocker-housing.horizontal .paddle-ridge {
          width: 2.5px; height: 82%; left: 50%; transform: translateX(-50%);
        }

        /* ---- Precision SVG Toggle Switch ---- */
        .toggle-housing {
          appearance: none;
          border: none;
          background: transparent;
          width: 54px;
          height: 54px;
          padding: 0;
          cursor: pointer;
          outline: none;
          display: block;
          border-radius: 10px;
        }
        .toggle-housing.horizontal {
          transform: rotate(90deg);
        }
        .toggle-svg {
          width: 100%;
          height: 100%;
          display: block;
          overflow: visible;
        }
        .toggle-led-ring {
          opacity: 0;
          transition: opacity 120ms ease;
        }
        ${hasBacklight ? `.toggle-housing[aria-checked="true"] .toggle-led-ring { opacity: 0.95; }` : ''}
      </style>

      <div class="wrap">
        ${labelPos === 'top' ? labelHtml : ''}
        ${isToggle ? toggleBodyHtml : rockerBodyHtml}
        ${labelPos === 'bottom' ? labelHtml : ''}
      </div>
    `;

    this._btnEl = this.shadowRoot.querySelector('button[role="switch"]');
    this._batShaftEl = this.shadowRoot.querySelector('.bat-shaft');
    this._batShadowEl = this.shadowRoot.querySelector('.bat-shadow');
    this._batGlintEl = this.shadowRoot.querySelector('.bat-tip-glint');

    this._btnEl.addEventListener('click', this._onClick);
    this._btnEl.addEventListener('keydown', this._onKeyDown);
    this._rendered = true;
  }

  _applyToggleTilt(tilt) {
    this._toggleTilt = tilt;
    if (!this._batShaftEl) return;
    const bat = buildToggleBatPath(30, 30, tilt);
    this._batShaftEl.setAttribute('d', bat.d);
    if (this._batShadowEl) this._batShadowEl.setAttribute('d', bat.d);
    if (this._batGlintEl) {
      this._batGlintEl.setAttribute('cy', (bat.tipY - 1.2).toFixed(2));
      this._batGlintEl.setAttribute('r', (bat.rTip * 0.72).toFixed(2));
    }
  }

  _updateVisuals(animate = true) {
    if (!this._rendered || !this._btnEl) return;
    this._btnEl.setAttribute('aria-checked', String(this._checked));

    if (this.variant !== 'toggle' || !this._batShaftEl) return;

    const targetTilt = this._checked ? -1 : 1;
    if (!animate || typeof requestAnimationFrame === 'undefined') {
      this._applyToggleTilt(targetTilt);
      return;
    }

    if (this._animRaf) cancelAnimationFrame(this._animRaf);
    const startTilt = this._toggleTilt;
    if (Math.abs(targetTilt - startTilt) < 0.001) return;

    const duration = 95;
    const startTime = performance.now();

    const step = (now) => {
      const p = Math.min(1, (now - startTime) / duration);
      // Crisp ease-out cubic: zero overshoot, zero wobble
      const eased = 1 - Math.pow(1 - p, 3);
      this._applyToggleTilt(startTilt + (targetTilt - startTilt) * eased);
      if (p < 1) {
        this._animRaf = requestAnimationFrame(step);
      } else {
        this._animRaf = null;
      }
    };
    this._animRaf = requestAnimationFrame(step);
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
