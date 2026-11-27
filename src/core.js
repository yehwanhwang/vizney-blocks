  /* 공통 도구: 카드 안 문구, 숫자 표기, 증감, 카드 머리, 그리기 시작 */
  const SVGNS = 'http://www.w3.org/2000/svg';
  // 카드 안 문구(합계 · 기타 · 툴팁 · 낭독 문구): 한국어가 기본이고, JSON에 "lang": "en"을 적으면 영어로 바뀝니다.
  // 왼쪽의 한국어 원문이 키입니다. %s에는 값이 차례로, %1 · %2에는 그 순서의 값이 들어가고, '|' 뒤는 같은 말을 구분하는 꼬리표라 화면에는 안 나옵니다.
  // 원화 표기(조 · 억 · 만 · 원)는 영어에서도 그대로 둡니다. 숫자 표기는 두 언어가 같습니다.
  const EN = {
    '값': 'Value', '이름': 'Name', '기간': 'Period', '항목': 'Item', '일': 'days', '%s%p': '%spp', '증가': 'up', '감소': 'down', '%s 대비': 'vs %s', '비교 기간': 'prior period', '%1의 %2': '%2 of %1',
    '비중': 'Share', '%s위': '#%s', '%s 순위': '%s ranks', '%s계단 오름': 'up %s', '%s계단 내림': 'down %s', '그대로': 'unchanged', '처음부터 다시': 'Replay', '한도': 'Limit', '차이': 'Difference', '%s 초과|한도': '%s over',
    '%1 초과 · %2의 %3%': '%1 over · %3% of %2', '%1 남음 · %2의 %3%': '%1 left · %3% of %2', '%1개 중 %2개 %3 초과 · +%4': '%2 of %1 over %3 · +%4', '%1개 중 %2개 %3 초과': '%2 of %1 over %3',
    '모두 %s 이내': 'All within %s', '표시할 항목이 없습니다.': 'No items to show.',
    '%1. 항목 %2개 가운데 %3개가 %4 초과입니다. 좌우 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.': '%1. %3 of %2 items are over %4. Use the left and right arrows to move between items. Every value is in the table that follows.',
    'labels와 values를 확인하세요.': 'Check labels and values.', 'limit에 한도를 숫자로 적으세요.': 'Write the limit as a number in limit.', 'options를 확인하세요.': 'Check options.', '필터': 'Filter', '전체': 'All',
    '%1, %2개 중 %3개 고름': '%1, %3 of %2 picked', '%1개 중 %2개 고름': '%2 of %1 picked', '내려받기': 'Download', '%s로 받기': 'Download as %s', '%s로 받았습니다.': 'Downloaded as %s.', '데이터 없음': 'No data',
    '행': 'rows', '행|1': 'row', '받을 데이터가 없습니다.': 'No data to download.', '%s로 1행을 받았습니다.': 'Downloaded 1 row as %s.', '%1로 %2행을 받았습니다.': 'Downloaded %2 rows as %1.',
    'min과 max를 확인하세요.': 'Check min and max.', '%s 최소': 'Minimum %s', '%s 최대': 'Maximum %s', '범위': 'range', 'items에 항목을 2~4개 적으세요.': 'List 2 to 4 items in items.',
    'items에 항목을 2~8개 적으세요.': 'List 2 to 8 items in items.', 'items에 항목을 2~6개 적으세요.': 'List 2 to 6 items in items.', 'items의 value에 0 이상의 값을 적으세요.': 'Put a value of 0 or more in value of each item.', 'labels에 기간을 2개 이상 적으세요.': 'List at least 2 periods in labels.', '재생': 'Play', '일시정지': 'Pause', '되감기': 'Rewind',
    '빨리 감기': 'Fast forward', '%s 강조': '%s highlighted',
    '%1 순위 변화, %2–%3. %4: %5 → %6. 위아래 화살표로 항목을 옮깁니다. 모든 순위는 이어지는 표에 있습니다.': '%1 rank changes, %2–%3. %4: %5 → %6. Use the up and down arrows to move between items. Every rank is in the table that follows.',
    'periods와 values를 확인하세요.': 'Check periods and values.',
    '누계': 'Running total', '누계 %1 → %2': 'Running total %1 → %2', 'items에 항목을 적으세요.': 'List the items in items.', '첫 항목에 시작 값을 숫자로 적으세요.': 'Write the starting value as a number in the first item.',
    '%1. %2 %3 → %4 %5(%6). 좌우 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.': '%1. %2 %3 → %4 %5 (%6). Use the left and right arrows to move between items. Every value is in the table that follows.',
    '%1. %2의 비중은 %3로, %4 대비 %5입니다. 좌우 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.': '%1. %2 holds %3, %5 against %4. Use the left and right arrows to move between items. Every value is in the table that follows.',
    '%1. %2의 비중은 %3입니다. 좌우 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.': '%1. %2 holds %3. Use the left and right arrows to move between items. Every value is in the table that follows.',
    '최근 7일': 'Last 7 days', '최근 30일': 'Last 30 days', '이번 달': 'This month', '지난달': 'Last month', '이번 분기': 'This quarter', '올해': 'This year', '빠른 선택': 'Quick picks',
    '일간': 'days', '일간|1': 'day', '%s 고름': '%s picked', '이전 달': 'Previous month', '다음 달': 'Next month', 'value의 날짜를 YYYY-MM-DD로 적으세요.': 'Write the dates in value as YYYY-MM-DD.',
    '합계': 'Total', 'groups에 왼쪽과 오른쪽 그룹의 이름 2개를 적으세요.': 'List the names of the left and right groups in groups.', 'items에 항목을 2~10개 적으세요.': 'List 2 to 10 items in items.', 'items의 left와 right에 0 이상의 값을 적으세요.': 'Put a value of 0 or more in left and right of each item.', '같음': 'Even', '%1의 %2배': '%2× %1', '%s 합계에서': 'of all %s',
    '%1. %2 %3, %4 %5. 위아래 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.': '%1. %2 %3, %4 %5. Use the up and down arrows to move between items. Every value is in the table that follows.',
    'items에 단계를 두 개 이상 적으세요.': 'Write two or more stages in items.', '첫 단계의 값은 0보다 커야 합니다.': 'The first stage needs a value above 0.', '단계': 'Stage', '앞 단계에서': 'From the previous stage', '%1에서 %2 넘어옴': '%2 moved on from %1', '퍼널의 시작': 'Start of the funnel', '시작 값': 'Starting value', '눌러서 값 입력': 'Click to type a value', '검색': 'Search', '%s 검색': 'Search %s', '검색어 지우기': 'Clear search', '모두 고르기': 'Select all', '모두 풀기': 'Clear', '고른 항목 없음': 'None picked', '"%s"와 맞는 항목이 없습니다.': 'No match for "%s"', '%s개 찾음': '%s found',  '시작일': 'Start date', '끝일': 'End date', '날짜': 'Date', '연도와 달 고르기': 'choose month and year', '날짜로 돌아가기': 'back to the days', '이전 해': 'Previous year', '다음 해': 'Next year', '이전 열두 해': 'Previous 12 years', '다음 열두 해': 'Next 12 years', '날짜를 YYYY-MM-DD로, 고를 수 있는 날짜 안에서 적으세요.': 'Type a date as YYYY-MM-DD, within the dates you can pick.', 
    '%1. %2 %3에서 %4 %5까지, 첫 단계 대비 %6. 좌우 화살표로 단계를 옮깁니다. 모든 값은 이어지는 표에 있습니다.': '%1. From %2 %3 to %4 %5, %6 of the first stage. Use the left and right arrows to move between the stages. Every value is in the table that follows.',
    '%s 역전': 'Crossed in %s', 'items에 항목을 1~2개 적으세요.': 'List 1 or 2 items in items.',
    '%1. %2 %3 %4, %5 %6. 좌우 화살표로 기간을 옮기고 Enter로 짚을 선을 바꿉니다. 모든 값은 이어지는 표에 있습니다.': '%1. In %2, %3 %4 and %5 %6. Use the left and right arrows to move between periods and Enter to switch the highlighted line. Every value is in the table that follows.',
    '%1. %2 %3 %4. 좌우 화살표로 기간을 옮깁니다. 모든 값은 이어지는 표에 있습니다.': '%1. In %2, %3 %4. Use the left and right arrows to move between periods. Every value is in the table that follows.',
    '카드 데이터(JSON)를 읽지 못했습니다: %s': 'Could not read the card data (JSON): %s', '카드를 그리지 못했습니다: %s': 'Could not draw the card: %s',
  };
  // tx(d 또는 f, 원문, 값…): d.lang(format()이 f에 옮겨 둡니다)이 en이면 영어 문구를, 아니면 원문을 돌려줍니다.
  function tx(x, s, ...a) {
    let i = 0;
    const out = x && x.lang === 'en' && EN[s] !== undefined ? EN[s] : s.split('|')[0];
    return out.replace(/%(\d|s)/g, (m, k) => String(a[k === 's' ? i++ : k - 1]));
  }
  // 숫자 뒤의 단위: 영어 단위(days · orders)는 한 칸 띄우고, 기호와 한 글자 단위(% · K · 억)는 붙입니다.
  const withUnit = (n, u) => (/^[A-Za-z]{2}/.test(u) ? `${n} ${u}` : n + u);
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function svgEl(tag, attrs) {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  const nfs = {};
  function num(v, d) {
    nfs[d] = nfs[d] || new Intl.NumberFormat('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d });
    return nfs[d].format(v);
  }
  // 원 금액: 조 · 억 · 만으로 줄여 적습니다. 10만 원보다 작으면 87,324원처럼 원 단위 그대로 적어 객단가 · CAC가 "9만"으로
  // 뭉개지지 않게 합니다. decimals를 주면 줄인 숫자의 소수 자릿수를 그 값으로 맞춥니다(1억 8,600만 원은 2면 1.86억).
  function krw(v, d) {
    const a = Math.abs(v), k = (x) => (d != null ? d : x);
    if (a >= 1e12) return [num(v / 1e12, k(1)), '조'];
    if (a >= 1e8) return [num(v / 1e8, k(a >= 1e10 ? 0 : 1)), '억'];
    if (a >= 1e5) return [num(v / 1e4, k(0)), '만'];
    return [num(v, 0), '원'];
  }
  // 달러 금액: 원래 값을 받아 K · M · B로 줄이고 소수 한 자리로 맞춥니다($745.6K). 접미사는 단위처럼 작게 씁니다.
  function usd(v, d) {
    const a = Math.abs(v), s = v < 0 ? '-' : '';
    const [div, u] = a >= 1e9 ? [1e9, 'B'] : a >= 1e6 ? [1e6, 'M'] : a >= 1e3 ? [1e3, 'K'] : [1, ''];
    return [`${s}$${num(a / div, d != null ? d : div > 1 ? 1 : 0)}`, u];
  }
  // format: eok(억 단위 값) · krw(원 단위 값) · usd(달러 값) · count(unit으로 단위) · pct(증감을 %p로) · days
  // 축이나 탭처럼 카드 안의 다른 객체로 만들 때는 두 번째 인자로 카드 데이터를 주어 lang을 잇습니다.
  function format(d, root) {
    const dec = (v, fallback) => (d.decimals != null ? d.decimals : fallback);
    const F = (o) => Object.assign(o, { lang: (root || d).lang });
    switch (d.format) {
      case 'eok': return F({ parts: (v) => [num(v, dec(v, Number.isInteger(v) || Math.abs(v) >= 100 ? 0 : 1)), '억'], rel: true });
      case 'krw': return F({ parts: (v) => krw(v, d.decimals), rel: true });
      case 'usd': return F({ parts: (v) => usd(v, d.decimals), rel: true, usd: true });
      case 'pct': return F({ parts: (v) => [num(v, dec(v, 1)), '%'], rel: false, dp: d.decimals });
      case 'days': return F({ parts: (v) => [num(v, dec(v, 1)), tx(root || d, '일')], rel: true });
      default: return F({ parts: (v) => [num(v, dec(v, Number.isInteger(v) ? 0 : 1)), d.unit || ''], rel: true });
    }
  }
  const show = (f, v) => withUnit(...f.parts(v));
  // 그릴 수 있는 숫자인지(빈 값 · 빈 글자 · NaN 제외)
  const fin = (v) => v != null && v !== '' && isFinite(v);
  // 비율의 차이(%p) 숫자: 소수 자릿수는 decimals(비우면 한 자리)를 따릅니다. 0이 아닌 차이가 0.0으로 보일 만큼 작으면
  // 자리를 늘려(최대 세 자리) 1.12%에서 1.16%로 오른 것을 0.0%p가 아니라 0.03%p로 적습니다.
  function pp(f, diff) {
    const a = Math.abs(diff);
    let k = f.dp != null ? f.dp : 1;
    while (k < 3 && a > 1e-9 && Math.round(a * 10 ** k) === 0) k++;
    return num(a, k);
  }
  // 증감: 방향은 화살표로, 좋고 나쁨(tone)은 better(up · down · neutral)로 정합니다. 비율은 %p로 적습니다.
  function delta(f, value, base, better) {
    const diff = value - base;
    const dir = Math.abs(diff) < 1e-9 ? 0 : Math.sign(diff);
    const want = better === 'down' ? -1 : better === 'neutral' ? 0 : 1;
    const tone = dir === 0 || want === 0 ? 'flat' : dir === want ? 'good' : 'bad';
    let text;
    if (!f.rel) text = tx(f, '%s%p', pp(f, diff));
    else if (base) text = `${num(Math.abs(diff / base) * 100, 1)}%`;
    else text = show(f, Math.abs(diff));
    return { dir, tone, text };
  }
  function arrow(dir) {
    const s = svgEl('svg', { class: 'vzb-arrow', viewBox: '0 0 12 12', 'aria-hidden': 'true' });
    s.append(svgEl('path', { d: dir > 0 ? 'M3.5 8.5l5-5M4.5 3.5h4v4' : 'M3.5 3.5l5 5M8.5 4.5v4h-4' }));
    return s;
  }
  // 대표 수치(단위는 작게)
  function figure(f, value) {
    const n = el('div', 'vzb-num');
    const [text, unit] = f.parts(value);
    n.append(text);
    if (unit) n.append(el('span', 'vzb-unit', unit));
    return n;
  }
  // 증감 배지: 화살표는 오르내림, 색은 좋고 나쁨(better)입니다.
  function badge(f, value, base, better) {
    const dl = delta(f, value, base, better);
    const b = el('span', `vzb-badge vzb-${dl.tone}`);
    if (dl.dir) b.append(arrow(dl.dir), el('span', 'vzb-sr', tx(f, dl.dir > 0 ? '증가' : '감소')));
    b.append(dl.text);
    return b;
  }
  // 머리: 제목 · 기간 부제(subtitle) · 대표 수치와 바로 뒤의 증감 배지. value가 null이면 제목만 둡니다.
  // 배지는 숫자 바로 뒤에 붙어 있고, 카드가 좁아 한 줄에 다 들어가지 않으면 비교 문구만 숫자 아래 줄로 내려갑니다.
  // 내려갔는지는 카드의 vzb-wrapped로 알려, 높이가 1단위인 카드가 아래 여백으로 그 줄을 받을 수 있게 합니다.
  function head(card, d, f, value, cmp, cmpText) {
    const hd = el('div', 'vzb-hd');
    hd.append(el('div', 'vzb-title', d.title || ''));
    if (d.subtitle) hd.append(el('div', 'vzb-sub', d.subtitle));
    card.append(hd);
    if (value == null) return;
    const fig = el('div', 'vzb-fig');
    const n = figure(f, value);
    fig.append(n);
    if (cmp && cmp.value != null) {
      const line = el('span', 'vzb-delta'), vs = el('span', 'vzb-vs', cmpText || tx(d, '%s 대비', cmp.label || tx(d, '비교 기간')));
      line.append(badge(f, value, cmp.value, d.better), vs);
      fig.append(line);
      onSize(fig, () => card.classList.toggle('vzb-wrapped', vs.offsetTop >= n.offsetTop + n.offsetHeight - 1));   // 숫자 칸 아래에서 시작하면 내려간 것
    }
    card.append(fig);
  }
  // 움직임 값(tokens.css의 --vzb-follow … --vzb-rest). 스프링은 '세기 잦아듦' 두 숫자이고, 시간은 초(s)나 밀리초(ms)입니다.
  // 역할: Follow(끄는 동안 손에 붙음) · Settle(놓이거나 열릴 때 자리를 잡음) · Pop(눌렸다 튀어 오름) · Move(값의 자리로 감, 넘치지 않음) ·
  // Fade(투명도와 색) · Press(눌리는 순간) · Lead(시작 전의 뜸) · Seq(차례의 전체 시간) · Rest(되풀이 전의 쉼). 읽지 못한 값은 아래 기본값을 씁니다.
  const MOTION = { follow: '1000 63', settle: '340 26', pop: '520 21', move: '200 28.3', fade: '0.14s', press: '0.08s', lead: '400ms', seq: '1200ms', rest: '2600ms' };
  // 스프링이 0에서 1로 갈 때의 자리(t는 초). 잦아듦이 2√세기에 닿으면 넘치지 않고 곧장 갑니다.
  function springAt(k, c) {
    const w = Math.sqrt(k), z = c / (2 * w);
    if (z < 0.999) { const wd = w * Math.sqrt(1 - z * z); return (t) => 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t)); }
    return (t) => 1 - (1 + w * t) * Math.exp(-w * t);
  }
  // 스프링을 CSS 전환으로 옮긴 [시간, 곡선]: 목표의 0.5% 안에 든 때까지를 시간으로 잡고, 그 사이를 33점으로 잇습니다.
  function springCss(k, c) {
    const f = springAt(k, c), pts = [];
    let d = 0;
    for (let t = 0; t <= 3; t += 0.005) if (Math.abs(f(t) - 1) > 0.005) d = t;
    d = Math.round((d + 0.01) * 100) / 100;
    for (let i = 0; i <= 32; i++) pts.push(i === 0 ? 0 : i === 32 ? 1 : +f((d * i) / 32).toFixed(3));
    return [`${d}s`, `linear(${pts.join(', ')})`];
  }
  // motion(card): 그 카드에 적용되는 움직임 값. pair(이름)은 스프링의 [세기, 잦아듦], ms(이름)은 밀리초,
  // curve(이름)은 { at(지난 밀리초) → 0에서 1까지의 자리, dur: 다 가는 데 걸리는 밀리초 }, css(이름)은 CSS 전환의 [시간, 곡선]입니다.
  function motion(card) {
    const cs = getComputedStyle(card), raw = (n) => cs.getPropertyValue(`--vzb-${n}`).trim().replace(/\s+/g, ' ');
    const two = (v) => { const p = v.split(' ').map(Number); return p.length === 2 && p[0] > 0 && p[1] > 0 ? p : null; };
    const pair = (n) => two(raw(n)) || two(MOTION[n]);
    const time = (v) => { const x = parseFloat(v); return isFinite(x) && x >= 0 && /s$/.test(v) ? (/ms$/.test(v) ? x : x * 1000) : null; };
    const ms = (n) => { const v = time(raw(n)); return v == null ? time(MOTION[n]) : v; };
    const css = (n) => springCss(...pair(n));
    const curve = (n) => { const f = springAt(...pair(n)); return { at: (t) => (t <= 0 ? 0 : f(t / 1000)), dur: parseFloat(css(n)[0]) * 1000 }; };
    return { pair, ms, css, curve };
  }
  // 스프링 값을 :root나 카드에서 바꿔 적었으면, CSS 전환이 쓰는 시간과 곡선(--vzb-…-t · -e)을 그 값으로 다시 계산해 카드에 적습니다.
  function tune(card) {
    const m = motion(card);
    for (const n of ['settle', 'pop', 'move']) {
      if (m.pair(n).join(' ') === MOTION[n]) continue;
      const [t, e] = m.css(n);
      card.style.setProperty(`--vzb-${n}-t`, t);
      card.style.setProperty(`--vzb-${n}-e`, e);
    }
  }
  // 스프링으로 목표에 다가가는 값: s = { x: 지금 자리, v: 속도 }를 dt(밀리초)만큼 옮깁니다. 가던 중에 목표가 바뀌어도 속도를 이어 갑니다.
  function springTo(s, to, k, c, dt) {
    let n = Math.max(1, Math.ceil(dt / 4));
    const h = dt / 1000 / n;
    while (n--) { s.v += (-k * (s.x - to) - c * s.v) * h; s.x += s.v * h; }
  }
  // 장면 잇기: 데이터가 바뀌어 카드를 갈아 끼울 때, 앞 카드가 화면에 그리고 있던 장면(값과 자리)을 새 카드에 넘깁니다.
  // 카드는 keep(card, 장면을 돌려주는 함수)로 맡기고, 새 카드는 before(card)로 받아 그 장면에서 새 값으로 옮겨 갑니다.
  const SCENE = new WeakMap(), FROM = new WeakMap();
  const keep = (card, fn) => SCENE.set(card, fn);
  const before = (card) => { const s = FROM.get(card); FROM.delete(card); return s || null; };
  // 같은 종류의 카드를 모두 찾아 그립니다. 코드를 두 번 붙여 넣어도 카드는 한 번만 그립니다.
  // 데이터가 바뀌면 다시 그립니다: 페이지의 스크립트가 카드 안 JSON(<script type="application/json">)의 글자를 바꾸면 그 카드만
  // 새 요소로 갈아 끼워 새로 그립니다(필터 · 기간 컨트롤과 잇는 길). 갈아 끼운 카드에는 data-vzb-live가 붙어, 움직이는 카드는
  // 처음부터 다시 재생하지 않습니다. 앞 카드가 장면을 맡겨 두었으면(keep) 그 장면에서 새 값으로 옮겨 가고, 아니면 마지막 장면을 바로 그립니다.
  // 예전 요소가 페이지에서 빠지므로 그 카드의 움직임도 함께 끝납니다.
  // 대비 최소선: 페이지가 바꾼 색으로 글자가 바탕과 4.5:1, 포커스 링이 바탕과 3:1에 못 미치면 콘솔에 한 줄로 알립니다.
  // 그림은 페이지 값 그대로 둡니다(브랜드 색을 카드가 고치지 않습니다). 색은 1×1 캔버스에 칠해 읽으므로 color-mix · oklch도 읽힙니다.
  const CHECKS = [['ink', 'card', 4.5], ['ink-2', 'card', 4.5], ['muted', 'card', 4.5], ['good-ink', 'card', 4.5], ['bad-ink', 'card', 4.5],
    ['alert-ink', 'card', 4.5], ['ink-2', 'track', 4.5], ['card', 'ink', 4.5], ['tip-ink', 'tip', 4.5], ['focus', 'card', 3]];
  // 같은 알림은 페이지에서 한 번만: 카드마다 core.js가 따로 들어 있으므로, 공유 기호(Symbol.for)로 document에 한 벌만 둡니다.
  const WARNED = Symbol.for('vizney-blocks.contrast');
  function checkContrast(card) {
    let ctx;
    try { ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true }); } catch (e) { return; }
    if (!ctx) return;
    const probe = el('i');
    probe.style.cssText = 'position:absolute;visibility:hidden';
    card.append(probe);
    const read = (name) => {
      probe.style.color = name === 'focus' ? 'var(--vzb-focus, var(--vzb-primary))' : `var(--vzb-${name})`;
      return getComputedStyle(probe).color;
    };
    const lum = (bg, fg) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1, 1);
      ctx.fillStyle = bg; ctx.fillRect(0, 0, 1, 1);
      if (fg) { ctx.fillStyle = fg; ctx.fillRect(0, 0, 1, 1); }
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      const c = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
    };
    const low = [];
    CHECKS.forEach(([fg, bg, need]) => {
      const B = read(bg), a = lum(B), b = lum(B, read(fg));
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      if (ratio < need - 0.005) low.push(`${fg === 'focus' ? '--vzb-focus' : `--vzb-${fg}`} on --vzb-${bg} ${ratio.toFixed(2)}:1 (needs ${need}:1)`);
    });
    probe.remove();
    const msg = low.join('; ');
    const warned = document[WARNED] || (document[WARNED] = new Set());
    if (!low.length || warned.has(msg)) return;
    warned.add(msg);
    console.warn(`Vizney Blocks: low contrast with the page's --vzb-* colors: ${msg}`);
  }
  function mount(type, draw) {
    const watch = (card, src) => {
      if (!src || !window.MutationObserver) return;
      const mo = new MutationObserver(() => {
        mo.disconnect();
        if (!card.isConnected) return;
        const next = card.cloneNode(false);
        next.removeAttribute('data-vzb-ready');
        next.setAttribute('data-vzb-live', '');
        next.append(src);
        const scene = SCENE.get(card);
        if (scene) { try { FROM.set(next, scene()); } catch (e) { /* 장면을 못 넘기면 마지막 장면을 바로 그립니다 */ } }
        card.replaceWith(next);
        run();
      });
      mo.observe(src, { childList: true, characterData: true, subtree: true });
    };
    const run = () => {
      document.querySelectorAll(`.vzb-card[data-vzb="${type}"]:not([data-vzb-ready])`).forEach((card) => {
        card.setAttribute('data-vzb-ready', '');
        const src = card.querySelector('script[type="application/json"]');
        const raw = src ? src.textContent : '';
        watch(card, src);
        let d;
        try { d = JSON.parse(raw); } catch (e) {
          card.append(el('p', 'vzb-error', tx(/"lang"\s*:\s*"en"/.test(raw) ? { lang: 'en' } : null, '카드 데이터(JSON)를 읽지 못했습니다: %s', e.message)));
          return;
        }
        card.setAttribute('role', 'group');
        if (d.title) card.setAttribute('aria-label', d.title);
        // 어두운 바탕: JSON에 "theme": "dark"를 적으면 Vizney 검정 바탕에 노랑을 첫째 색으로 그립니다(tokens.css의 .vzb-dark).
        card.classList.toggle('vzb-dark', d.theme === 'dark');
        tune(card);
        checkContrast(card);
        try { draw(card, d, format(d)); } catch (e) {
          card.append(el('p', 'vzb-error', tx(d, '카드를 그리지 못했습니다: %s', e.message)));
        }
      });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
  }
  // 서식 길이: 페이지가 :root에 적은 --vzb-<name>(0 · 4px · 0.5rem 등)을 px 숫자로 읽습니다. 비워 두었으면(initial) fallback을 돌려줍니다.
  // 스크립트가 그리는 SVG(막대 끝, 말풍선, 칸)가 CSS와 같은 모서리 변수를 읽게 하는 길입니다. 길이는 카드에 잠깐 넣은 요소의 폭으로 재서, rem · calc도 읽힙니다.
  function len(card, name, fallback) {
    if (!getComputedStyle(card).getPropertyValue(`--vzb-${name}`).trim()) return fallback;
    const probe = el('i');
    probe.style.cssText = `position:absolute;visibility:hidden;width:var(--vzb-${name})`;
    card.append(probe);
    const v = parseFloat(getComputedStyle(probe).width);
    probe.remove();
    return isFinite(v) && v >= 0 ? v : fallback;
  }
  // 크기가 바뀔 때마다 그래픽을 다시 그립니다. 차트는 카드에 남은 높이를 채웁니다.
  function onSize(node, fn) {
    let lw = 0, lh = 0;
    new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width), h = Math.floor(entries[0].contentRect.height);
      if (w > 0 && h > 0 && (w !== lw || h !== lh)) { lw = w; lh = h; fn(w, h); }
    }).observe(node);
  }
