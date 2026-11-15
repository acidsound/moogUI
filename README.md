# `<moog-knob>` — Minimoog Model D Style Rotary Knob Web Component

eBay 아이템 [Minimoog Model D Single Large Knob (`146240621533`)](https://www.ebay.com/itm/146240621533) 디자인을 충실하게 재현한 **의존성 없는 순수 Web Component**입니다.

## 주요 특징

- **정통 Model D 하드웨어 디테일**
  - 6엽 스캘럽드(Scalloped / Fluted) 글로시 블랙 바디와 2.5D 원근 측벽 하이라이트
  - 회전 방향 및 상단 스튜디오 조명에 반응하는 동적 리지(Ridge) 반사광
  - 방사형 브러시드 알루미늄 인레이 캡 (`conic-gradient` + 동심원 선반 가공 질감)
  - 상단 능선과 하단 플레어 스커트에 정렬된 이중 인디케이터 도트
- **3가지 실물 바리에이션 (`variant`)**
  - `large` (기본값 — eBay `146240621533` 대형 오실레이터/필터 노브)
  - `pointer` (포인터 비크가 강조된 중형 노브)
  - `skirtless` (LFO Rate 스타일 스커트리스 노브)
- **프로 오디오 인터랙션**
  - 수직 드래그(기본) 및 원형 드래그(`drag-mode="circular"`) 지원
  - `Shift + 드래그` 정밀 미세 조절 (6배 고해상도)
  - `더블클릭` 또는 `Alt + 클릭`으로 기본값 리셋
  - 마우스 휠 지원 및 터치/펜 포인터 캡처 지원
  - `detents` 속성으로 로터리 스위치(예: 옥타브 레인지) 디텐트 모드 지원
  - `role="slider"`, 방향키/`PageUp`/`PageDown`/`Home`/`End` 키보드 및 ARIA 완벽 지원

## 빠른 시작

```html
<script type="module" src="./moog-knob.js"></script>

<moog-knob
  label="OSCILLATOR TUNE"
  min="-5"
  max="5"
  value="0"
  step="0.05"
  bipolar
  scale-labels="-5,-3,-1,0,+1,+3,+5"
  unit="st"
  size="lg"
></moog-knob>
```

JavaScript로 이벤트 및 커스텀 포맷터 연결:

```js
const cutoff = document.querySelector('#cutoff');
cutoff.format = (v) => {
  const hz = 20 * Math.pow(600, v / 10);
  return hz >= 1000 ? `${(hz / 1000).toFixed(2)} kHz` : `${Math.round(hz)} Hz`;
};

cutoff.addEventListener('input', (e) => {
  console.log('Live:', e.detail.value, e.detail.formatted);
});

cutoff.addEventListener('change', (e) => {
  console.log('Committed:', e.detail.value);
});
```

## 속성 (Attributes)

| 속성 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `value` | `number` | `0` | 현재 값 |
| `min` / `max` | `number` | `0` / `10` | 최소 / 최대 값 |
| `step` | `number` | `0.01` | 스텝 단위 |
| `default-value` | `number` | 초기값 | 더블클릭 리셋 기준값 |
| `label` | `string` | `""` | 노브 상/하단 라벨 |
| `label-position` | `'top' \| 'bottom'` | `'top'` | 라벨 위치 |
| `unit` | `string` | `""` | 값 단위 (예: `Hz`, `st`, `%`) |
| `size` | `'sm'\|'md'\|'lg'\|'xl'\|number` | `'md'` | 노브 크기 (`px` 또는 프리셋) |
| `variant` | `'large'\|'pointer'\|'skirtless'` | `'large'` | 노브 외형 타입 |
| `cap` | `'silver'\|'brass'\|'black'` | `'silver'` | 상단 메탈 인레이 마감 |
| `dot-color` | `string` | `'#f3f3ef'` | 인디케이터 도트 색상 |
| `bipolar` | `boolean` | `false` | 중앙 기준 양방향 강조 눈금 표시 |
| `ticks` | `number` | `11` | 주요 눈금 개수 |
| `minor-ticks` | `number` | `1` | 보조 눈금 개수 |
| `scale-labels` | `string` | `""` | 쉼표 또는 JSON 배열 형태의 눈금 텍스트 |
| `detents` | `number \| boolean` | `false` | 단계형 로터리 스위치 스냅 모드 |
| `drag-mode` | `'vertical'\|'circular'` | `'vertical'` | 드래그 조작 방식 |
| `show-value` | `'always'\|'hover'\|'never'` | `'always'` | 수치 배지 표시 정책 |
| `show-arc` | `boolean` | `false` | 외곽 앰버 LED 링 표시 여부 |
| `disabled` | `boolean` | `false` | 비활성화 여부 |

## 데모 파일

- **GitHub Pages 라이브 데모**: https://acidsound.github.io/knobComponent/
- `index.html`: Web Audio API 기반 실시간 Minimoog 스타일 신시사이저 + 인터랙티브 컴포넌트 플레이그라운드 (단독 실행 가능)
- `demo-esm.html`: ES Module(`moog-knob.js`) 직접 임포트 예제
