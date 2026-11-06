# 예시 1 · 영업 월간 보고

진행 중인 달을 견주는 KPI, 작년과 견주는 추이, 항목이 많은 목록을 한 화면에 둔 예시다. 이 예시는 AI 에이전트가 이 스킬로 실제로 만든 결과를 고쳐 정리했다.

## 요청

영업기획팀 월간 보고. 보고 시점 10월 27일, 10월은 26일까지 집계.

- 매출 · 영업이익 · 신규 거래처 · 반품률 현황(전월 대비)
- 월별 매출 추이, 작년과 비교
- 권역별 매출, 작년 같은 기간과 비교
- 제품군별 매출 비중은 파이차트로
- 권역별 목표 달성률(목표 · 실적 금액 함께)
- 매출 상위 거래처 10개(작년 대비 증감도)

## 1–2단계 · 질문과 확인

| 지표 | 기간 | format | better | 판단 |
|---|---|---|---|---|
| 매출 · 영업이익 | 10월 1–26일 | `eok` | up | 진행 중인 달이라 9월 전체가 아니라 9월 1–26일과 견준다 |
| 신규 거래처 | 10월 1–26일 | `count`, `unit: "곳"` | up | |
| 반품률 | 10월 1–26일 | `pct` | **down** | 이름으로 판단했지만 색이 거꾸로 나오면 안 되므로 가정 줄에 적는다 |

데이터에서 찾은 어긋남: 1–10월 매출이 월별 합 8,756억, 제품군 합 8,756억인데 권역 합은 8,540억이다. 값을 고치지 않고 사용자에게 묻는다.

## 3–4단계 · 설계표

| 줄 | 질문 | 카드(id) | 높이 |
|---|---|---|---|
| 1 | 매출 · 영업이익 · 신규 거래처 · 반품률은 9월 같은 기간보다 어떤가? | `kpi-number` ×4 | 1단위 |
| 2 | 월별 매출은 작년과 어떻게 다른가? · 제품군별로 무엇이 큰가? | `line-compare` + `bar-ranking` | 2단위 |
| 3 | 권역별 매출은 작년보다 늘었나? · 권역별 목표를 채웠나? | `bar-compare` + `grid-target` | 2단위보다 김(둘 다 8줄) |
| 4 | 상위 거래처 10곳은 작년보다 늘었나? | `bar-compare` (`max: 10`) | 2단위보다 김, `auto-fill`로 한 칸 폭 |

가정: 반품률 `"better": "down"` · KPI는 9월 1–26일과 비교 · 월별 추이의 올해 선은 9월까지(10월은 26일까지라 작년 10월 전체와 견줄 수 없음) · 권역 합계가 다른 합계와 216억 다름(확인 필요).

## 요청과 다르게 한 것

- **파이 → Bar - Ranking.** 큰 세 제품군 밖의 합(2,383억)이 셋째 조각(모터 1,512억)보다 크다. 도넛으로 그리면 '기타'가 둘째로 큰 조각이 되어 둘째로 큰 제품군이 무엇인지 화면이 답하지 못한다. 여섯 항목을 `max: 6`으로 모두 보이고, 바꾼 이유를 사용자에게 알린다.
- **KPI는 KPI - Number.** 매출 추이 카드가 따로 있으므로 KPI - Line · KPI - Bar로 같은 그래픽을 두 번 그리지 않는다.
- **상위 10곳은 혼자 한 줄.** 열 줄이라 2단위를 넘고 짝 지을 카드가 없다. 그 줄의 격자를 `auto-fill`로 두어 전체 폭으로 늘어나지 않게 한다.

## 6단계 · JSON 핵심

KPI(진행 중인 달):

```json
{ "title": "매출", "subtitle": "10월 1~26일", "value": 791, "format": "eok", "better": "up",
  "compare": { "label": "9월 1~26일", "value": 812 } }
```

```json
{ "title": "반품률", "subtitle": "10월 1~26일", "value": 2.6, "format": "pct", "better": "down",
  "compare": { "label": "9월 1~26일", "value": 2.5 } }
```

월별 추이(올해 선은 끝난 달까지):

```json
{ "title": "월별 매출", "subtitle": "2026년은 9월까지(10월은 26일 집계라 제외)", "format": "eok", "better": "up",
  "labels": ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
  "current": { "name": "2026년", "values": [852, 838, 871, 884, 902, 868, 915, 897, 938] },
  "previous": { "name": "2025년", "values": [731, 702, 756, 769, 781, 760, 802, 788, 823, 812, 846, 905] } }
```

제품군(파이 대신, 정렬과 비중은 카드가 한다):

```json
{ "title": "제품군별 매출", "subtitle": "2026년 1~10월 누계", "format": "eok", "max": 6,
  "items": [{ "name": "산업용 베어링", "value": 2894 }, { "name": "감속기", "value": 1967 }, { "name": "모터", "value": 1512 },
            { "name": "유압부품", "value": 1088 }, { "name": "센서 모듈", "value": 742 }, { "name": "소모품·기타", "value": 553 }] }
```

상위 거래처(증감 배지는 카드가 계산):

```json
{ "title": "매출 상위 거래처 10곳", "subtitle": "2026년 1~10월 누계, 전년 동기 대비", "format": "eok", "better": "up",
  "currentLabel": "2026년 1~10월", "compareLabel": "2025년 1~10월", "max": 10,
  "items": [{ "name": "한성중공업", "value": 612, "prev": 548 }, { "name": "대림기계", "value": 487, "prev": 502 }] }
```

(거래처는 열 곳을 모두 적는다. 여기서는 두 곳만 보였다.)

## 7단계 · 배치

```html
<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap:16px;">
  <!-- kpi-number ×4 -->
</div>
<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap:16px; margin-top:16px;">
  <!-- line-compare, bar-ranking -->
</div>
<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap:16px; margin-top:16px;">
  <!-- bar-compare(권역 8줄), grid-target(8줄) -->
</div>
<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap:16px; margin-top:16px;">
  <!-- bar-compare(거래처 10줄): 혼자라 auto-fill -->
</div>
```

## 8단계 · 확인 결과

- 1280px: KPI 네 장 296×168, 2줄 두 장 336, 3줄 두 장 419(같은 높이), 4줄 한 장 400폭.
- 390px: 가로 넘침 없음, 콘솔 오류 없음.
- 사용자에게 알린 것: 파이를 막대로 바꾼 이유, 반품률 better: down, 올해 선을 9월에서 멈춘 이유, 권역 합계의 216억 차이.
