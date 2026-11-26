<!-- Vizney Blocks 스킬의 한국어판. 스킬 입구는 같은 폴더의 SKILL.md(영어)이고, 한국어로 일할 때 이 파일을 따른다. Vizney Blocks(blocks.vizney.com)의 HTML 카드로 움직임으로 읽는 차트와 대시보드 컨트롤을 화면에 넣는다. 차트(Bar Overflow · Waffle Flip · Bump Race · Waterfall Walk · Funnel Wave · Butterfly Fold)를 그리거나 컨트롤(Date Picker · Range Slider · Filter Chips · Select Menu · Download Button)을 둘 때, 사용자가 Vizney Blocks를 언급할 때 쓴다. 카드 코드는 그대로 두고 JSON 데이터만 바꾸며, 컨트롤과 차트는 짧은 페이지 스크립트로 잇는다. -->

# Vizney Blocks 카드로 화면 만들기

> 스킬의 한국어판이다. 영어판은 같은 폴더의 `SKILL.md`다. 순서, 카드 목록, 규칙, 체크리스트는 같은 원본에서 만들어져 내용이 같고, 카드 코드 주소(`/ko/cards/`)와 카드 문구가 한국어다.

Vizney Blocks는 움직임으로 읽는 차트와 대시보드 컨트롤을 담은, 복사해 붙여 쓰는 HTML 카드 모음이다(v0.81, MIT License). 카드 하나는 `<style>`, 데이터 JSON, `<script>`를 묶은 HTML 조각이라 설치할 라이브러리가 없다. 넘친 양 · 비중 · 순위 같은 계산과 색 · 강조 · 움직임은 카드가 Vizney 차트 가이드의 규칙대로 맡는다. 그래서 카드 코드는 그대로 두고 JSON 값만 바꾼다. 카드가 정하는 것은 그 차트를 바르게 그리는 방법이고, 화면에 무엇을 둘지는 화면을 만드는 쪽이 정한다.

## 카드

지금 있는 카드는 차트 6종과 컨트롤 5종이 전부다. 요청에 맞는 카드가 없으면 카드를 억지로 맞추지 않는다. 그 부분은 직접 만들고, 카드로 만들지 않았다고 사용자에게 알린다.

### 차트

- Bar Overflow (`bar-overflow`) · 막대 차트 — 기간별 값을 세로 막대로 세우고 모든 기간에 같은 한도를 가로선 하나로 그어, 선을 넘긴 구간만 빨갛게 깜빡여 알리는 카드입니다. 월 예산이나 월 처리량처럼 기간마다 같은 한도가 있는 값의 추이를 볼 때 씁니다. 목표처럼 넘을수록 좋은 값에는 쓰지 않습니다.
- Waffle Flip (`waffle-flip`) · 와플 차트 — 100칸 와플로 비중을 그리고, 앞 기간에서 바뀐 만큼의 칸을 한 칸씩 뒤집어 보여 주는 카드입니다. 시장 점유율이나 매출 구성비처럼 한 항목의 비중이 얼마나 늘거나 줄었는지 전할 때 씁니다. 두 기간 사이의 변화만 그립니다.
- Bump Race (`bump-race`) · 범프 차트 — 기간마다 순위를 매겨 S자 선으로 잇고, 재생하면 기간을 하나씩 넘기며 순위가 바뀌는 순간을 보여 주는 카드입니다. 상품 · 채널 · 지점의 순위가 한 해 동안 어떻게 오르내렸는지, 특히 한 항목이 몇 위에서 몇 위로 올라왔는지 전할 때 씁니다. 순위는 값의 차이를 감추므로, 차이의 크기가 중요하면 라인 차트를 씁니다.
- Waterfall Walk (`waterfall-walk`) · 워터폴 차트 — 시작 값에서 끝 값까지, 그 사이에 무엇이 얼마나 늘리고 줄였는지를 항목별 막대로 이어 붙여 보여 주는 카드입니다. 재생하면 앞 막대가 끝난 높이에서 점이 하나씩 찍히며 다음 항목으로 걸어가고, 그 높이에서 막대가 오르내리며 막대 끝에 붙은 이름과 값이 함께 따라갑니다. 연초 회원 수가 가입과 해지를 거쳐 연말에 몇 명이 됐는지, 작년 영업이익이 어떤 요인으로 올해 영업이익이 됐는지, 매출액에서 비용이 빠지고 영업이익과 당기순이익이 얼마 남는지처럼 두 지점 사이 증감의 원인을 순서대로 전할 때 씁니다. 기간마다의 추이를 볼 때는 쓰지 않습니다.
- Funnel Wave (`funnel-wave`) · 퍼널 차트 — 리드에서 계약까지처럼 정해진 순서의 단계를 지나며, 처음 단계를 100으로 볼 때 단계마다 얼마가 남아 끝까지 오는지를 보여 주는 카드입니다. 단계마다 그 단계까지 온 수를 물의 높이로 그리고, 재생하면 물이 왼쪽에서 흘러 들어와 단계 경계를 지날 때마다 남은 만큼의 높이로 내려가며 끝까지 흐릅니다. 영업 단계, 구매 전환, 가입 절차처럼 처음 대비 남은 비율과 전체 전환율을 전할 때 씁니다. 순서가 없는 항목끼리 견줄 때는 쓰지 않습니다.
- Butterfly Fold (`butterfly-fold`) · 버터플라이 차트 — 가운데 열에 항목을 두고 대비되는 두 그룹(남성 · 여성, 온라인 · 오프라인 등)의 값을 같은 눈금의 양쪽 막대로 견주는 버터플라이 차트에서, 두 날개를 접었다 펼치는 움직임과 함께, 항목을 짚으면 적은 쪽 막대 끝에서 많은 쪽의 길이까지 반대쪽 색의 점선을 그어 어느 쪽이 얼마나 많은지 보여 주는 카드입니다. 성별 · 채널별로 카테고리 구성을 견주거나 두 그룹이 어느 항목에서 갈리는지 전할 때 씁니다. 두 그룹의 비중만 중요하면 100% 누적 막대 차트를, 항목마다 차이의 크기만 전하면 차이를 바로 그리는 막대 차트를 씁니다.

### 컨트롤

- Date Picker (`date-picker`) — 달력으로 기간(시작일과 끝일)이나 날짜 하나를 고르는 컨트롤입니다. 주문일이나 기준일처럼 날짜로 화면을 거를 때 씁니다. 가만히 있을 때는 지금 기간과 일수를 적은 단추 하나이고, 누르면 그 아래에 날짜를 직접 치는 입력칸과 한 달 달력이 떠오릅니다.
- Range Slider (`range-slider`) — 손잡이 둘로 숫자 범위를 고르는 컨트롤입니다. 주문 금액이나 수량처럼 이어지는 값으로 화면을 거를 때 씁니다. 값의 분포를 주면 끄는 동안 레일 위에 막대로 떠올라, 고른 범위에 데이터가 얼마나 드는지 보여 줍니다.
- Filter Chips (`filter-chips`) — 정해 둔 항목 가운데 여러 개를 칩으로 고르는 컨트롤입니다. 채널이나 지역처럼 몇 개 안 되는 이름으로 화면을 거를 때 씁니다. 맨 앞의 전체 칩이 지금 몇 개를 골랐는지 보여 줍니다.
- Select Menu (`select-menu`) — 항목이 많아 칩으로 다 늘어놓기 어려울 때, 목록을 펼쳐 검색하고 고르는 컨트롤입니다. 국가 · 지역 · 매장 · 상품처럼 이름이 수십 개인 필터에 씁니다. 가만히 있을 때는 고른 것을 적은 단추 하나이고, 누르면 그 아래에 검색칸과 목록이 떠오릅니다. 항목이 8개 안팎이면 한눈에 보이는 Filter Chips가 낫습니다.
- Download Button (`download-button`) — 화면에 있는 차트 카드의 데이터를 파일로 내려받는 단추입니다. 처음에는 아이콘만 있고, 마우스를 올리면 CSV · JSON · PNG 가운데 받을 형식이 나옵니다. 컨트롤로 거른 지금 데이터를 그대로 받을 때 씁니다.

카드마다의 규칙과 필드는 https://blocks.vizney.com/ko/llms.txt 의 그 카드 줄에 있다. 카드를 쓰기 전에 그 줄을 읽는다.

## 순서

1. 화면에 둘 것을 적고, 위 "카드"에서 쓰임이 맞는 카드를 고른다. 카드 이름은 지표가 아니라 모양이므로, 무엇의 값인지는 JSON의 `title`에 적는다.
2. 카드마다 기간, `format`, `better`와 그 카드에 필요한 값(한도, 두 기간, 짚을 항목)을 확인한다. 요청과 데이터에서 알 수 없는 것만 모아 한 번에 묻는다(하나씩 묻지 않는다). 답을 받을 수 없으면 가장 그럴듯한 값으로 가정하고, 가정을 한 줄로 적은 뒤 계속한다.
3. 카드 코드를 내려받는다. `https://blocks.vizney.com/ko/cards/<카드 id>.txt`가 카드 코드 원문이다(카드 문구가 한국어). 코드를 다시 쓰거나 줄이지 말고 받은 그대로 쓴다. 내려받을 수 없으면 사용자에게 그 주소의 내용을 붙여 달라고 한다.

   ```bash
   curl -fsSL https://blocks.vizney.com/ko/cards/bar-overflow.txt -o bar-overflow.html
   ```

4. 카드 안 `<script type="application/json">`과 `</script>` 사이의 JSON 값만 바꾼다. 필드는 카드 코드에 든 예시 JSON이 기준이다. 예시에 없는 필드는 아래 규칙의 공통 필드와, llms.txt의 그 카드 줄에 이름이 나온 것만 더한다. 영어 화면이면 `"lang": "en"`을 더한다.
5. 카드를 한 HTML 문서에 붙인다. 컨트롤은 차트 위 필터 줄에, 차트는 격자에 둔다.

   ```html
   <!doctype html>
   <html lang="ko">
   <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>광고비 현황</title></head>
   <body style="margin:0; padding:24px; background:#f4f5f7;">
   <h1 style="margin:0; font:700 22px/1.4 var(--vzb-font); color:var(--vzb-ink);">광고비 현황</h1>
   <p style="margin:2px 0 16px; font:400 14px/1.5 var(--vzb-font); color:var(--vzb-muted);">2026년 11월 기준 · 데이터 출처</p>
   <!-- 필터 줄: 컨트롤은 제목을 그리지 않으므로 페이지가 이름을 적는다. 컨트롤마다 폭이 있는 자리를 준다. -->
   <div style="display:grid; grid-template-columns:minmax(0, 1fr) auto; align-items:end; gap:16px 24px; margin-bottom:16px; padding:16px 20px; border-radius:16px; background:#ffffff;">
   <div><div style="margin-bottom:8px; font:500 12px/16px var(--vzb-font); color:var(--vzb-muted);">채널</div><!-- Filter Chips 카드 코드 --></div>
   <div><!-- Download Button 카드 코드("align": "end") --></div>
   </div>
   <!-- 차트: 격자 한 칸에 차트 카드 코드를 하나씩 붙인다. 스크립트가 찾아야 하는 카드는 id를 준 요소로 감싼다. -->
   <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap:16px;">
   <div id="spend"><!-- Bar Overflow 카드 코드 --></div>
   </div>
   </body>
   </html>
   ```

6. 컨트롤을 두었으면 아래 "컨트롤과 차트 잇기"대로 페이지 스크립트를 쓴다.
7. 브라우저에서 열어 아래 "체크리스트"를 거친다. 완성한 파일을 넘길 때 가정 줄을 다시 알린다.

## 규칙

- 내려받은 카드 코드를 그대로 붙여 넣고 JSON 값만 바꾼다. 스타일과 스크립트는 고치지 않는다. 같은 카드를 여러 장 쓸 때는 카드 코드를 통째로 다시 붙여 넣고 각 JSON만 바꾼다.
- 카드는 놓인 자리의 폭을 채운다. 차트 카드의 높이는 1 · 1.5 · 2단위(1단위 168px, --vzb-unit) 가운데 하나이고, 지금 있는 차트 카드는 모두 2단위(336px)다. 컨트롤(Date Picker · Range Slider · Filter Chips · Select Menu · Download Button)은 카드 머리와 틀 없이 조작부만 그리고, 높이는 조작부 자체의 높이다. 바탕을 비워 두므로 Vizney 색으로 쓸 때는 theme을 놓을 자리의 바탕에 맞춘다(어두운 바탕이면 "dark"). 색 바탕 위라면 "내 화면에 맞추기"을 따른다.
- 여러 장은 감싸는 요소에 격자를 준다: display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap:16px. 차트 카드는 340px보다 좁히지 않는다. 가로로 길게 읽는 차트(13개월 막대, 가로 20칸 와플, 순위 선)는 두 칸이나 전체 폭을 주면 더 잘 읽힌다. 컨트롤은 차트 위 필터 줄이나 머리글에 그대로 놓는다.
- 화면의 서식은 카드를 고치지 않고 :root의 --vzb-* 변수로 맞춘다: 바탕 --vzb-card, 글자 --vzb-ink, 강조 --vzb-primary, 서체 --vzb-font와 --vzb-title-*, 모서리 --vzb-radius · --vzb-radius-control · --vzb-radius-mark(순서는 "내 화면에 맞추기"). 변수 목록과 칠하는 곳은 https://blocks.vizney.com/ko/tokens.css 에 있다(카드 코드의 :where(:root) 블록과 같은 내용). JSON의 theme은 Vizney의 바탕을 고른다. 비우면 흰 바탕에 파랑이 첫째 데이터 색이고, "dark"면 Vizney 검정 바탕에 노랑이다. 내 화면 색에 맞출 때는 밝든 어둡든 비운다.
- 움직임에는 역할이 있고, 역할마다 값이 하나씩 같은 변수 목록에 있다. 손이 닿는 것: --vzb-follow(끄는 동안 손에 붙음, 넘침 없음), --vzb-settle(놓이거나 열리거나 넓어질 때 살짝 넘쳤다 자리를 잡음), --vzb-pop(놓인 단추 · 고른 항목 · 떠오르는 말풍선이 뚜렷이 튐), --vzb-fade와 --vzb-press(시간). 값을 나타내는 것: --vzb-move. 넘치지 않는다. 높이나 자리가 곧 값이라, 튀면 잠깐 틀린 값을 보이기 때문이다. 리듬: --vzb-lead(카드가 시작하기 전의 뜸), --vzb-seq(항목이 차례로 움직일 때 나눠 쓰는 전체 시간), --vzb-rest(되풀이 전의 쉼). 스프링은 '세기 잦아듦' 두 숫자로 적고, CSS 전환에는 미리 계산된 시간과 곡선을 쓴다(예: transition: transform var(--vzb-pop-t) var(--vzb-pop-e)). 카드 둘레에 직접 만드는 요소(KPI 타일, 표, 탭)도 같은 변수로 움직이고, '값은 튀지 않는다'는 규칙을 지킨다.
- 공통 필드: title(무엇의 값인지), subtitle(기간과 기준), format(krw 원 단위 숫자를 만·억·조로 줄여 적음. 10만 원 미만은 87,324원처럼 원 단위 그대로 · eok 억 단위 숫자 · usd 달러 금액을 $745.6K·$1.2M처럼 · count 개수, 단위는 unit · pct 퍼센트 숫자(3.4는 3.4%), 증감은 %p · days 일수), decimals(소수 자릿수, 비우면 카드가 정함), better(up · down · neutral), labels(기간 이름, 값과 같은 길이. 값이 없는 기간은 값을 null로), lang(en이면 카드가 직접 적는 문구가 영어), theme. 컨트롤: label(화면 낭독기가 읽는 이름. 화면에는 그리지 않음), name(컨트롤이 보내는 이벤트의 detail.name). 카드마다의 필드는 카드 코드의 예시 JSON과 llms.txt의 그 카드 줄에 있다.
- 넘친 양, 비중, 순위, 증감, 합계는 카드가 계산하므로 JSON에 적지 않는다. 금액은 미리 반올림하거나 천·백만 단위로 나누지 않고 원래 값을 넣는다.
- 차트 카드는 화면에 보이면 한 번 재생하고 마지막 장면에서 멈춘다. 멈춘 장면만으로 바르게 읽힌다. 움직임이 데이터의 뜻이라 운영체제의 동작 줄이기 설정과 상관없이 재생하고, 마우스를 올리거나 키보드로 포커스하면 잠시 멈추며, 다시 보기 단추나 재생 단추를 둔다. 감싼 요소에 data-vzb-loop를 붙이면 되풀이하지만, 계속 움직이는 카드는 옆 카드를 읽기 어렵게 하므로 갤러리 같은 전시 화면에만 쓴다.
- 카드는 HTML 문서에 그대로 붙이는 조각이다. innerHTML이나 React의 dangerouslySetInnerHTML로 넣으면 카드의 <script>가 실행되지 않는다.
- 낮을수록 좋은 지표는 `"better": "down"`으로 둔다. Waffle Flip은 줄어든 쪽이 초록 배지가 되고, Bump Race는 작은 값이 1위가 된다.
- 월별 추이는 데이터가 있으면 13개월을 넣는다. 처음과 마지막이 같은 달이라 전년 동월과 견줄 수 있다.
- 기간 이름은 `25.09`, `3Q26`처럼 짧게 적는다. 길면 막대 아래와 구간 막대 아래에서 잘리거나 서로 붙는다.
- 항목 이름(채널, 상품 등)은 화면 전체에서 한 언어로 맞춘다. 번역하면 모두 번역하고, 원문을 쓰면 모두 원문으로 둔다.

## 컨트롤과 차트 잇기

컨트롤과 차트는 서로를 모른다. 페이지의 짧은 스크립트가 컨트롤의 이벤트를 받아 차트 카드의 JSON을 바꿔 적는다.

- 컨트롤은 값이 바뀔 때마다 카드에서 `vzb-change` 이벤트를 보낸다(위로 전달되므로 `document`에서 받는다). `detail`은 `{ name, value }`이고 `name`은 그 컨트롤 JSON의 `name`이다. Date Picker의 `value`는 `["시작", "끝"]` 날짜 글자(YYYY-MM-DD, 끝일 포함), Range Slider의 `value`는 `[시작, 끝]` 숫자, Filter Chips의 `value`는 고른 항목을 `options` 순서대로 담은 배열이다. 지금 값은 카드의 `data-vzb-value` 속성에도 JSON으로 적혀 있다.
- 컨트롤은 처음 그릴 때는 이벤트를 보내지 않는다. 컨트롤의 `value`와 차트의 JSON을 처음부터 같은 조건으로 적는다.
- 차트 카드는 안의 `<script type="application/json">` 글자가 바뀌면 그 카드만 다시 그린다. 페이지가 거르기 전의 전체 데이터를 들고 있다가, 이벤트를 받으면 거른 결과로 차트의 JSON을 만들어 바꿔 적는다. 다시 그린 카드는 처음부터 재생하지 않고, 보는 사람이 고른 기간과 항목은 그대로 둔다. Bar Overflow는 화면에 있던 막대가 그 자리와 높이에서 새 값으로 옮겨 간다. 같은 이름의 기간이 같은 막대이므로 거를 때 `labels`의 이름은 바꾸지 않는다. Funnel Wave는 칸마다 물이 있던 높이에서 새 높이로 옮겨 가고, 알약의 비율과 칸 아래의 값이 물을 따라 바뀐다. 같은 자리의 같은 이름이 같은 단계이므로 거를 때 `items`의 단계와 순서는 그대로 두고 값만 바꾼다(단계의 수가 달라지면 옮겨 가지 않고 바로 그린다). Waterfall Walk는 막대마다 닿아 있던 높이에서 새 높이로 옮겨 가고, 잇는 점 · 막대 끝의 이름과 값 · 끝 막대의 말풍선이 따라간다. 이것도 같은 자리의 같은 이름이 같은 항목이므로 `items`의 항목과 순서는 그대로 두고 값만 바꾼다(항목의 수가 달라지면 바로 그린다). Waffle Flip은 고른 기간에서 달라진 칸만 차례로 뒤집히고, 큰 숫자 · 범례 · 증감 배지가 칸을 따라 바뀐다. 같은 이름의 항목이 같은 순서로 있어야 같은 칸이므로 `items`의 항목과 순서는 그대로 두고 값만 바꾼다(이름이나 순서가 달라지면 바로 그린다). Bump Race는 화면에 있던 선이 새 순위 자리로 옮겨 가고 이름표의 순위가 따라 바뀐다. 같은 이름의 항목이 같은 선이므로 거를 때 `items`의 이름은 바꾸지 않는다(새 항목은 제자리에서 나타나고 빠진 항목은 흐려지며 사라진다). `labels`가 달라지면 옮겨 가지 않고 바로 그린다. Butterfly Fold는 접고 펴지 않고 막대가 있던 길이에서 새 길이로 옮겨 가며, 막대 끝의 값과 합계가 함께 바뀐다. 같은 이름의 항목이 같은 줄이므로 `items`의 순서를 바꾸면 줄이 새 자리로 옮겨 간다(새 항목은 가운데에서 자라고 빠진 항목은 흐려지며 사라진다). `groups`가 달라지면 옮겨 가지 않고 바로 그린다.
- 걸러서 남은 것이 없으면 빈 배열을 준다. Bar Overflow는 `"labels": []`, Waffle Flip · Bump Race · Waterfall Walk · Funnel Wave · Butterfly Fold는 `"items": []`이면 오류 대신 빈 화면을 그린다.
- 같은 종류의 카드를 두 장 쓰면 카드마다 id를 준 요소로 감싸고 그 id로 가려 쓴다(아래 예시의 `#spend`).
- Download Button은 `target`에 적은 종류(`data-vzb`)의 카드 가운데 페이지에서 처음 만나는 카드의 지금 JSON을 받는다. 그래서 컨트롤로 거른 뒤의 값이 그대로 내려간다. 받기 전에 `vzb-download` 이벤트(`detail: { name, target, format, filename, rows }`)를 보내고, 페이지가 `preventDefault()`를 부르면 파일을 만들지 않으므로 서버에서 원본을 받는 화면도 같은 단추를 쓸 수 있다.

```html
<div><!-- Filter Chips 카드 코드: "name": "channel" --></div>
<div id="spend"><!-- Bar Overflow 카드 코드 --></div>
<script>
// 페이지가 들고 있는 전체 데이터: 기간 이름과, 채널마다의 월별 값
const LABELS = ['25.11', '25.12', '26.01'];
const SPEND = { SNS: [8600000, 16200000, 9700000], 검색: [9500000, 10300000, 10100000] };
document.addEventListener('vzb-change', (e) => {
  if (e.detail.name !== 'channel') return;
  const picked = e.detail.value;   // 고른 채널들
  const src = document.querySelector('#spend .vzb-card script[type="application/json"]');
  const d = JSON.parse(src.textContent);
  d.labels = picked.length ? LABELS : [];   // 고른 것이 없으면 빈 배열: 카드가 빈 화면을 그린다
  d.values = d.labels.map((_, t) => picked.reduce((sum, c) => sum + SPEND[c][t], 0));
  src.textContent = JSON.stringify(d);   // 글자가 바뀌면 카드가 다시 그린다
});
</script>
```

## 내 화면에 맞추기

카드 코드는 고치지 않고 :root의 --vzb-* 변수만 적어, 블록이 놓인 화면의 서식을 따르게 한다. 움직임 · 계산 · 키보드 조작 · 낭독 문구는 그대로이고 생김새(색 · 서체 · 모서리 · 그림자)만 바뀐다. 변수마다 칠하는 곳은 https://blocks.vizney.com/ko/tokens.css 에 있다.

- 화면에서 다섯 값을 잰다: 패널(카드) 바탕색, 본문 글자색, 강조색, 서체(본문과 제목), 모서리(카드 · 단추 · 막대 같은 작은 표시). 브라우저 개발자 도구의 계산된 스타일(background-color, color, font-family, border-radius)에서 읽는다.
- `:root`에 옮긴다: 바탕 `--vzb-card`, 글자 `--vzb-ink`, 강조 `--vzb-primary`, 서체 `--vzb-font`(제목이 다르면 `--vzb-title-font`), 모서리 `--vzb-radius`(카드 · 떠 있는 창) · `--vzb-radius-control`(칩 · 단추 · 입력칸 · 손잡이) · `--vzb-radius-mark`(막대 끝 · 와플 칸 · 말풍선 · 범례 견본). 각진 화면이면 셋 다 0이다.
- 회색 단계(`--vzb-ink-2` · `--vzb-muted` · `--vzb-grid` · `--vzb-track` · `--vzb-other` · `--vzb-base`), 배지의 바탕과 글자, 툴팁 색은 바탕 · 글자 · 뜻 색을 섞어 만들어지므로 적지 않아도 따라온다. 화면과 다르게 보이는 것만 따로 적는다.
- 필요하면 더한다: 테두리와 그림자(`--vzb-edge` · `--vzb-shadow`, 떠 있는 창은 `--vzb-shadow-float`), 제목 · 부제의 크기 · 굵기 · 대소문자 · 자간(`--vzb-title-size` · `-weight` · `-case` · `-tracking`, `--vzb-sub-*`), 증감 색(`--vzb-good` · `--vzb-bad`, 증감만 칠한다), 주의 색(`--vzb-alert`, 한도 초과 · 입력 오류), 포커스 링(`--vzb-focus`, 강조색이 바탕과 비슷할 때).
- 어두운 화면이어도 theme은 비우고 `:root`에 어두운 바탕과 밝은 글자를 적는다. `"theme": "dark"`는 Vizney 검정 바탕을 고르는 값이라, 카드 안에서 같은 변수를 다시 정해 `:root` 값을 가린다.
- 색 바탕 위의 컨트롤(인디고 필터 줄 등)은 그 컨트롤의 JSON에 `"theme": "dark"`를 적고, 그 줄의 `.vzb-card`에 바탕(`--vzb-card`, 그 줄의 색)과 글자(`--vzb-ink`), 필요하면 강조(`--vzb-primary`)만 적는다. 회색 단계는 그 두 색에서 따라온다.
- 바뀌지 않는 것: 조작부 크기(40 · 44 · 32px, 손잡이 20px)와 글자 크기 단계는 변수로 열지 않는다. 제목 · 부제는 12px 밑으로 내려가지 않는다. 작은 견본(범례 · 체크 상자 · 개수 배지)은 적은 모서리가 커도 제 기본값보다 둥글게 그리지 않고, 와플 칸은 한 변의 1/4을 넘기지 않는다.
- 확인: 바꾼 색으로 글자 대비가 4.5:1, 포커스 링이 3:1에 못 미치면 카드가 콘솔에 `Vizney Blocks: low contrast …` 한 줄로 알린다. 알린 변수를 고친다. `--vzb-font`를 바꾸면 카드는 밖으로 아무것도 요청하지 않는다(기본 글꼴일 때만 jsDelivr에서 Spoqa Han Sans Neo 파일을 받는다).

```html
<style>
  :root {
    --vzb-card: #ffffff;        /* 바탕 */
    --vzb-ink: #17153a;         /* 글자. 회색 단계가 따라온다 */
    --vzb-primary: #4338ca;     /* 강조 */
    --vzb-font: 'Inter', sans-serif;
    --vzb-title-font: 'IBM Plex Mono', monospace;
    --vzb-title-case: uppercase;
    --vzb-radius: 0;            /* 카드 · 떠 있는 창 */
    --vzb-radius-control: 0;    /* 칩 · 단추 · 입력칸 · 손잡이 */
    --vzb-radius-mark: 0;       /* 막대 끝 · 와플 칸 · 말풍선 */
  }
  /* 인디고 필터 줄 위의 컨트롤: 그 컨트롤의 JSON은 "theme": "dark" */
  .filters .vzb-card { --vzb-card: #2a2670; --vzb-ink: #ffffff; }
</style>
```

## 체크리스트

완성한 파일을 넘기기 전에 하나씩 확인한다. 하나라도 어긋나면 고친 뒤 다시 확인한다.

### 카드 코드

- [ ] 카드 코드는 내려받은 그대로이고, JSON 값만 바꿨다.
- [ ] 필드는 예시 JSON, 규칙의 공통 필드, llms.txt의 그 카드 줄에 나온 것만 썼다.
- [ ] 넘친 양, 비중, 순위, 증감, 합계를 JSON에 적지 않았고, 금액은 반올림하거나 나누지 않은 원래 값이다.
- [ ] 카드를 innerHTML이나 dangerouslySetInnerHTML로 넣지 않았다.

### 데이터

- [ ] `labels`와 `values`의 길이가 같고, 값이 없는 기간은 값이 `null`이다.
- [ ] 낮을수록 좋은 지표는 `"better": "down"`이다.
- [ ] Bar Overflow의 `limit`은 넘으면 안 되는 한도다. 넘을수록 좋은 목표에는 쓰지 않았다.
- [ ] 기간 이름은 짧고, 항목 이름은 화면 전체에서 한 언어다.

### 컨트롤

- [ ] 컨트롤마다 `label`(화면 낭독기가 읽는 이름)과 `name`(이벤트 이름)이 있다.
- [ ] 컨트롤의 `theme`이 놓인 자리의 바탕과 맞다.
- [ ] 컨트롤의 처음 `value`와 차트의 처음 JSON이 같은 조건이다.
- [ ] 값을 바꾸면 차트가 다시 그려지고, 모두 풀었다가 다시 골라도 돌아온다.
- [ ] Download Button의 `target`이 받을 카드의 `data-vzb`와 같다.

### 화면

- [ ] 브라우저 콘솔에 오류가 없고, 카드 안에 오류 문구(`.vzb-error`)가 없다.
- [ ] 폭 1280px과 390px에서 화면을 캡처해 잘리거나 겹친 글자가 없다.
- [ ] 화면의 서식에 맞췄다면 카드 코드는 그대로이고 :root(색 바탕 위 컨트롤은 그 줄의 .vzb-card) 변수만 적었으며, 콘솔에 대비 경고가 없다.
- [ ] 차트 카드는 한 번 재생하고 멈춘다. 계속 되풀이하게 두지 않았다.
- [ ] 가정 줄을 사용자에게 알렸다.

## 예시

요청 하나를 고른 카드 · JSON 핵심 · 잇는 스크립트 · 확인 결과까지 따라간 예시다. 비슷한 요청을 받으면 먼저 읽는다.

- [예시 · 채널을 고르면 다시 그려지는 광고비 화면](examples/ad-spend-filter.md) — Filter Chips로 채널을 고르면 Bar Overflow가 다시 그려지고, Download Button이 고른 결과를 그대로 내려받는 예시

갤러리: https://blocks.vizney.com/ (한국어 https://blocks.vizney.com/ko/) · 소스: https://github.com/yehwanhwang/vizney-blocks
