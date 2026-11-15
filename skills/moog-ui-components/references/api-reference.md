# Moog UI Components — Quick API Reference

## `<moog-knob>`

### Attributes
- `value`: `number` (current value)
- `min` / `max`: `number` (default `0` / `10`; auto-derived from `scale-labels` when `detents` is set)
- `step`: `number` (default `0.01`, or `1` in `endless` mode)
- `default-value`: `number` (reset target on double-click / `Alt+Click`; defaults to center if `bipolar`)
- `variant`: `'large' | 'pointer' | 'skirtless'` (default `'large'`)
- `cap`: `'silver' | 'brass' | 'black'` (default `'silver'`)
- `size`: `'sm' | 'md' | 'lg' | 'xl' | number` (`sm=72`, `md=98`, `lg=126`, `xl=162`)
- `dot-color`: CSS color string (default `'#f3f3ef'`)
- `label`: `string`, `label-position`: `'top' | 'bottom'`
- `unit`: `string`
- `bipolar`: boolean — highlights center tick and resets to midpoint
- `detents`: `boolean | number` — discrete rotary switch snapping
- `endless`: boolean — infinite 360° rotation without stops
- `wrap`: boolean — wraps `endless` values within `[min, max)`
- `revolution`: `number` — value delta per full 360° rotation in `endless` mode
- `ticks`: `number`, `minor-ticks`: `number`, `scale-labels`: comma-separated or JSON array string
- `min-angle` / `max-angle`: `number` (default `-150` / `150`)
- `drag-mode`: `'vertical' | 'circular'` (default `'vertical'`)
- `sensitivity`: `number` (px per sweep, default `170`; `Shift` multiplies by 6)
- `wheel`: `'false'` to disable mouse wheel
- `show-value`: `'always' | 'hover' | 'never'`
- `show-arc`: boolean — outer amber LED arc
- `disabled`: boolean

### Properties & Methods
- `knob.value`, `knob.normalized`, `knob.turns`, `knob.formattedValue`
- `knob.format = (val) => string`
- `knob.reset()`

### Events (`input`, `change`)
`event.detail`: `{ value, delta, turns, angle, normalized, formatted }`

### CSS Custom Properties
- `--moog-label-color`, `--moog-tick-color`, `--moog-tick-minor-color`
- `--moog-accent-color`, `--moog-value-bg`, `--moog-value-color`
- `--moog-font-family`, `--moog-mono-font`

---

## `<moog-switch>`

### Attributes
- `checked`: boolean
- `variant`: `'rocker' | 'toggle'` (default `'rocker'`)
- `color`: `'orange' | 'blue' | 'red' | 'ivory' | 'dark'` (default `'orange'`)
- `orientation`: `'vertical' | 'horizontal'` (default `'vertical'`)
- `size`: `'sm' | 'md' | 'lg'`
- `label`, `label-position`: `'top' | 'bottom'`
- `on-label` / `off-label`: string (defaults `'ON'` / `'OFF'`)
- `backlight`: set `'false'` to disable ON LED backlight
- `led-color`: custom CSS color override for backlight
- `disabled`: boolean

### Properties, Methods & Events
- `sw.checked`, `sw.value`, `sw.backlight`, `sw.toggle()`
- `input` / `change` `event.detail`: `{ checked, value }`

---

## `<moog-led>`

### Attributes
- `on` / `active`: boolean
- `intensity`: `number` (`0` to `1`)
- `variant`: `'jewel' | 'flat'` (default `'jewel'`)
- `color`: `'amber' | 'red' | 'green' | 'blue' | 'pink'` or custom CSS color
- `bezel`: `'black' | 'chrome' | 'brass'` (default `'black'`)
- `size`: `'sm' | 'md' | 'lg' | number`
- `blink`: boolean or interval in ms (`>= 60`, e.g. `blink="450"`)
- `label`, `label-position`: `'top' | 'bottom' | 'left' | 'right'`
