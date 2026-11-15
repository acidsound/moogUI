# Minimoog Model D Style Web UI Kit (`<moog-knob>`, `<moog-switch>`, `<moog-led>`)

Minimoog Model D 하드웨어 컨트롤을 충실하게 재현한 **의존성 없는 순수 Web Components UI 키트**입니다.

- **GitHub Pages 라이브 데모**: https://acidsound.github.io/knobComponent/

## 포함 컴포넌트

1. **`<moog-knob>`** (`moog-knob.js`)
   - `variant="large"`: 6엽 스캘럽드(Scalloped / Fluted) 글로시 블랙 바디 + 방사형 브러시드 메탈 인레이 + 이중 인디케이터 도트 (eBay `146240621533`)
   - `variant="pointer"`: 윙 패들 포인터 노브 + 노즈 화이트 인레이 스트라이프 + 동심원 메탈 캡
   - `variant="skirtless"`: LFO Rate 스타일 컴팩트 스커트리스 노브
   - **모드 지원**: 일반 포텐셔미터(`-150°..+150°`), 단계형 로터리 스위치(`detents`), **무한 회전 인코더(`endless`, `wrap`, `revolution`)**
2. **`<moog-switch>`** (`moog-switch.js`)
   - `variant="rocker"`: Minimoog Model D 입체 3D 로커 스위치 (`orange`, `blue`, `red`, `ivory`, `dark` / 수직·수평 지원)
   - `variant="toggle"`: 육각 너트 & 크롬 배트 핸들 토글 스위치
3. **`<moog-led>`** (`moog-led.js`)
   - `variant="jewel"`: 컷 글래스 쥬얼 파일럿 램프 (`OVERLOAD` 스타일)
   - `variant="flat"`: 리세스드 5mm 패널 다이오드 LED (`intensity` 아날로그 밝기 조절 및 `blink` 지원)

## 빠른 시작

```html
<script type="module" src="./moog-ui.js"></script>

<!-- 1. 대형 스캘럽드 바이폴라 노브 -->
<moog-knob
  label="OSCILLATOR TUNE"
  variant="large"
  min="-5"
  max="5"
  value="0"
  bipolar
  scale-labels="-5,-3,-1,0,+1,+3,+5"
  unit="st"
></moog-knob>

<!-- 2. 윙 포인터 로터리 스위치 -->
<moog-knob
  label="RANGE"
  variant="pointer"
  detents
  scale-labels="LO,32',16',8',4',2'"
  value="2"
></moog-knob>

<!-- 3. 무한 회전 360° 인코더 -->
<moog-knob
  label="PHASE"
  endless
  wrap
  min="0"
  max="360"
  step="1"
  value="0"
  unit="°"
  show-arc
></moog-knob>

<!-- 4. 스위치 & LED -->
<moog-switch label="FILTER MOD" color="orange" checked></moog-switch>
<moog-led label="OVERLOAD" color="amber" variant="jewel" on></moog-led>
```

## Agent Skill

AI 코딩 에이전트가 이 컴포넌트를 생성·참조·확장할 수 있도록 표준 Agent Skill이 포함되어 있습니다:
- `skills/moog-ui-components/SKILL.md`
- `skills/moog-ui-components/references/api-reference.md`
- `skills/moog-ui-components/templates/synth-panel-starter.html`

## `<moog-knob>` 주요 속성

| 속성 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `variant` | `'large' \| 'pointer' \| 'skirtless'` | `'large'` | 노브 외형 스타일 |
| `cap` | `'silver' \| 'brass' \| 'black'` | `'silver'` | 상단 메탈 인레이 마감 |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| number` | `'md'` | 노브 크기 (`px` 또는 프리셋) |
| `endless` | `boolean` | `false` | 360° 무한 회전 인코더 모드 |
| `wrap` | `boolean` | `false` | `endless` 모드에서 `[min, max)` 순환 래핑 |
| `revolution` | `number` | `max-min` | `endless` 모드에서 1회전(360°)당 값 변화량 |
| `detents` | `number \| boolean` | `false` | 단계형 로터리 스위치 스냅 모드 |
| `bipolar` | `boolean` | `false` | 중앙 기준 양방향 눈금 및 리셋 |
| `drag-mode` | `'vertical' \| 'circular'` | `'vertical'` | 드래그 조작 방식 |
| `show-arc` | `boolean` | `false` | 외곽 앰버 LED 링 표시 |
