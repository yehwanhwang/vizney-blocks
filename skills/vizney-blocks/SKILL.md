---
name: vizney-blocks
description: "Vizney Blocks(blocks.vizney.com)의 HTML 대시보드 카드로 대시보드 화면을 만든다. 한 파일짜리 HTML 대시보드, KPI 카드, 차트나 표가 든 보고 화면을 만들거나 고칠 때, 사용자가 Vizney Blocks를 언급할 때 쓴다. 화면이 답할 질문마다 목적 색인에서 카드를 고르고, 카드 코드는 그대로 둔 채 JSON 데이터만 바꾼다."
---

# Vizney Blocks로 대시보드 만들기

Vizney Blocks는 복사해 붙여 쓰는 HTML 대시보드 카드 모음이다(v0.22, MIT License). 카드 하나는 `<style>`, 데이터 JSON, `<script>`를 묶은 HTML 조각이라 설치할 라이브러리가 없다. 증감, 비중, 달성률, 합계와 색·강조는 카드가 Vizney 차트 가이드의 규칙대로 계산하고 그린다.

## 순서

1. 화면이 답할 질문을 적는다. 카드 한 장은 질문 하나에 답한다.
2. 질문마다 아래 "목적으로 고르기"에서 카드를 고른다. 기본 카드를 먼저 쓰고, 다른 카드는 조건이 정확히 맞을 때만 쓴다. 애매하면 기본 카드를 쓴다. 카드 이름은 지표가 아니라 모양이므로, 지표 이름은 JSON의 `title`로 바꾼다.
3. 카드 코드를 내려받는다. `https://blocks.vizney.com/cards/<카드 id>.txt`가 카드 코드 원문이다. 코드를 다시 쓰거나 줄이지 말고 받은 그대로 쓴다. 내려받을 수 없으면 사용자에게 그 주소의 내용을 붙여 달라고 한다.

   ```bash
   curl -fsSL https://blocks.vizney.com/cards/kpi-line.txt -o kpi-line.html
   ```

4. 카드 안 `<script type="application/json">`과 `</script>` 사이의 JSON 값만 바꾼다. 필드는 카드 코드에 든 예시 JSON이 기준이다. 예시에 없는 필드는 https://blocks.vizney.com/llms.txt 의 그 카드 줄에 이름이 나온 것만 더한다(예: `sort`, `max`, `focus`). 그 줄에는 카드가 그리는 규칙도 있다.
5. 카드를 격자 요소 안에 차례로 붙여 한 HTML 문서로 만든다.

   ```html
   <!doctype html>
   <html lang="ko">
   <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>영업 현황</title></head>
   <body style="margin:0; padding:24px; background:#f4f5f7;">
   <h1 style="margin:0 0 16px; font:700 22px/1.4 var(--vzb-font);">영업 현황</h1>
   <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap:16px;">
   <!-- 카드 코드를 여기에 차례로 붙인다 -->
   </div>
   </body>
   </html>
   ```

6. 브라우저에서 열어 아래 "확인"을 거친다.

## 목적으로 고르기

화면이 답할 질문마다 기본 카드를 먼저 쓰고, 다른 카드는 조건이 정확히 맞을 때만 쓴다. 애매하면 기본 카드를 쓴다. 여기 없는 카드는 이 조건들로 풀리지 않을 때만 쓴다.

### 현황 · 지금 얼마인가?

- 기본: KPI - Number (`kpi-number`) — 숫자와 비교 기준만 둘 때
- KPI - Line (`kpi-line`) — 최근 13개월 흐름도 함께 볼 때
- KPI - Bar (`kpi-bar`) — 진행 중인 이번 달을 지난달들과 견줄 때
- KPI - Stacked Bar (`kpi-stacked-bar`) — 합계와 그 구성을 한 카드에 둘 때
- Line - Tabs (`line-tabs`) — 단위가 다른 지표 2–3개를 한 카드에 둘 때

### 추이 · 어떻게 변해 왔나?

- 기본: Line - Basic (`line-basic`) — 한 지표의 흐름을 볼 때
- Bar - Basic (`bar-basic`) — 흐름보다 기간별 크기를 견줄 때
- Line - Compare (`line-compare`) — 작년 같은 달과 견줄 때
- Line - Multiple (`line-multiple`) — 항목 2–3개의 흐름을 함께 볼 때
- Bump - Basic (`bump-basic`) — 값보다 순위가 바뀐 과정을 볼 때

### 목표 · 목표까지 얼마나 왔나?

- 기본: KPI - Gauge (`kpi-gauge`) — 지표 하나의 목표·한도 대비 진척을 볼 때
- Grid - Target (`grid-target`) — 항목별 달성률을 금액과 함께 볼 때
- Bar - Target (`bar-target`) — 기간마다 목표가 다를 때
- Line - Cumulative (`line-cumulative`) — 이번 달 누계 페이스를 볼 때
- Line - Reference (`line-reference`) — 기준선·평균을 넘었는지 볼 때

### 비교 · 무엇이 크고 작은가?

- 기본: Bar - Ranking (`bar-ranking`) — 항목별 크기와 순위를 볼 때
- Bar - Compare (`bar-compare`) — 작년이나 지난달 값과 견줄 때
- Bar - Butterfly (`bar-butterfly`) — 두 집단을 같은 항목으로 견줄 때
- Radar - Basic (`radar-basic`) — 점수 여러 개로 강점과 약점을 볼 때

### 구성 · 무엇으로 이뤄져 있나?

- 기본: Donut - Basic (`donut-basic`) — 한 시점의 비중을 볼 때
- Bar - Stacked 100% (`bar-stacked-100`) — 기간별 구성비 변화를 볼 때
- Bar - Stacked (`bar-stacked`) — 합계의 흐름과 구성을 함께 볼 때
- Treemap - Basic (`treemap-basic`) — 항목이 많거나 묶음 안에 항목이 있을 때

### 표 · 항목마다 정확히 얼마인가?

- 기본: Grid - Basic (`grid-basic`) — 항목마다 여러 지표와 합계를 적을 때
- Grid - Spark (`grid-spark`) — 항목마다 13개월 흐름까지 훑을 때
- Grid - Pivot (`grid-pivot`) — 두 기준으로 나눈 금액을 교차표로 볼 때
- Heatmap - Basic (`heatmap-basic`) — 많고 적은 칸을 색으로 찾을 때

### 증감 · 왜 늘고 줄었나?

- 기본: Waterfall - Basic (`waterfall-basic`) — 두 시점 사이의 변화를 요인별로 나눌 때
- Waterfall - Subtotal (`waterfall-subtotal`) — 손익 구조를 보여줄 때
- Bar - Diverging (`bar-diverging`) — 기간별 증감·목표 차이를 볼 때

### 흐름 · 어디서 빠지고 어디로 가나?

- 기본: Funnel - Flow (`funnel-flow`) — 단계마다 얼마나 빠져나가는지 볼 때
- Sankey - Levels (`sankey-levels`) — 여러 갈래로 나뉘는 흐름을 볼 때

### 관계 · 두 값은 어떤 관계인가?

- 기본: Scatter - Basic (`scatter-basic`) — 두 측정값이 함께 움직이는지 볼 때
- Scatter - Quadrant (`scatter-quadrant`) — 두 기준으로 대상을 네 무리로 나눌 때
- Scatter - Connected (`scatter-connected`) — 두 지표의 이동 경로를 볼 때

## 규칙

- 내려받은 카드 코드를 그대로 붙여 넣고 JSON 값만 바꾼다. 스타일과 스크립트는 고치지 않는다. 같은 카드를 여러 장 쓸 때는 카드 코드를 통째로 다시 붙여 넣고 각 JSON만 바꾼다.
- 카드는 놓인 자리의 폭을 채우고, 높이는 1 · 1.5 · 2단위(1단위 168px, --vzb-unit) 중 하나다: KPI - Number 1단위, KPI - Gauge · KPI - Paired Bar · KPI - Stacked Bar 1.5단위, 나머지 2단위. 같은 줄의 카드는 가장 높은 카드에 맞춰 늘어나고 그래픽은 바닥에 붙으므로, 빈 곳이 없게 하려면 높이가 같은 카드끼리 한 줄에 둔다.
- 여러 장은 감싸는 요소에 격자를 준다: display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap:16px. 카드 폭이 340px보다 좁으면 표, 도넛, 퍼널, 워터폴의 글자가 잘리거나 겹친다. KPI 카드만 둔 줄은 300px까지 줄여도 된다.
- 색과 글꼴은 :root의 --vzb-* 변수(--vzb-primary, --vzb-font 등)로 바꾼다. 변수 목록은 카드 코드의 :where(:root) 블록에 있다.
- 공통 필드: title(지표명), subtitle(기간 부제), value(KPI 카드의 대표 수치. KPI - Line과 KPI - Bar는 비우면 마지막 값), format(eok 억 단위 숫자 · krw 원 단위 숫자를 만·억·조로 줄여 적음 · count 개수, 단위는 unit · pct 퍼센트 숫자(3.4는 3.4%), 증감은 %p · days 일수), better(up · down · neutral, 증감 색), compare({ label, value }), labels(기간 이름. values와 같은 길이로 적고, 값이 없는 기간의 값은 null), series([{ name, values }]), rows(표의 줄), curve(라인 카드의 선 모양: smooth · linear · step).
- 증감, 비중, 달성률, 합계는 카드가 계산하므로 JSON에 적지 않는다. 순위·비중 카드는 큰 순서 정렬과 "기타" 묶기도 직접 하므로 데이터를 미리 정렬하거나 묶지 않는다.
- 낮을수록 좋은 지표(반품률, 비용, 불량률)는 `"better": "down"`으로 둔다. 증가가 빨간 배지가 된다.
- 비율 지표는 `"format": "pct"`로 둔다. 증감이 %p로 적힌다.
- 월별 추이는 데이터가 있으면 13개월을 넣는다. 처음과 마지막이 같은 달이라 전년 동월과 견줄 수 있다.
- 이번 달처럼 진행 중인 기간은 지난 기간의 같은 날짜까지와 견주고(전월 동기), `compare.label`과 `subtitle`에 그 기준을 적는다.
- 기간 이름은 `25.09`, `3Q26`처럼 짧게 적는다. 길면 축과 막대 아래에서 잘리거나 서로 붙는다.
- 같은 지표가 여러 카드에 나오면 기간과 합계가 서로 맞는지 본다. 맞지 않으면 값을 고치지 말고 사용자에게 묻는다.
- 카드는 HTML 문서에 그대로 붙이는 조각이다. innerHTML이나 React의 dangerouslySetInnerHTML로 넣으면 카드의 `<script>`가 실행되지 않는다.

## 확인

- 브라우저 콘솔에 오류가 없고, 카드 안에 오류 문구(`.vzb-error`)가 없다.
- 카드는 넘치는 글자를 오류 없이 말줄임(…)으로 자르므로, 폭 1280px과 390px에서 화면을 캡처해 잘리거나 겹친 글자가 없는지 본다. 캡처할 수 없으면 카드 안에서 `scrollWidth`가 `clientWidth`보다 큰 요소가 없는지 확인한다.
- 같은 줄에 놓인 카드의 높이가 맞고, 늘어난 카드에 큰 빈 곳이 없다.

갤러리: https://blocks.vizney.com/ · 소스: https://github.com/yehwanhwang/vizney-blocks
