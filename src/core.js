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
    'items에 항목을 2~8개 적으세요.': 'List 2 to 8 items in items.', 'labels에 기간을 2개 이상 적으세요.': 'List at least 2 periods in labels.', '재생': 'Play', '일시정지': 'Pause', '되감기': 'Rewind',
    '빨리 감기': 'Fast forward', '%s 강조': '%s highlighted',
    '%1 순위 변화, %2–%3. %4: %5 → %6. 위아래 화살표로 항목을 옮깁니다. 모든 순위는 이어지는 표에 있습니다.': '%1 rank changes, %2–%3. %4: %5 → %6. Use the up and down arrows to move between items. Every rank is in the table that follows.',
    'periods와 values를 확인하세요.': 'Check periods and values.',
    '누계': 'Running total', '누계 %1 → %2': 'Running total %1 → %2', 'items에 항목을 적으세요.': 'List the items in items.', '첫 항목에 시작 값을 숫자로 적으세요.': 'Write the starting value as a number in the first item.',
    '%1. %2 %3 → %4 %5(%6). 좌우 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.': '%1. %2 %3 → %4 %5 (%6). Use the left and right arrows to move between items. Every value is in the table that follows.',
    '%1. %2의 비중은 %3로, %4 대비 %5입니다. 좌우 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.': '%1. %2 holds %3, %5 against %4. Use the left and right arrows to move between items. Every value is in the table that follows.',
    '%1. %2의 비중은 %3입니다. 좌우 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.': '%1. %2 holds %3. Use the left and right arrows to move between items. Every value is in the table that follows.',
    '최근 7일': 'Last 7 days', '최근 30일': 'Last 30 days', '이번 달': 'This month', '지난달': 'Last month', '이번 분기': 'This quarter', '올해': 'This year', '빠른 선택': 'Quick picks',
    '일간': 'days', '일간|1': 'day', '%s 고름': '%s picked', '이전 달': 'Previous month', '다음 달': 'Next month', 'value의 날짜를 YYYY-MM-DD로 적으세요.': 'Write the dates in value as YYYY-MM-DD.',
    'items에 단계를 두 개 이상 적으세요.': 'Write two or more stages in items.', '첫 단계의 값은 0보다 커야 합니다.': 'The first stage needs a value above 0.', '단계': 'Stage', '앞 단계에서': 'From the previous stage', '%1에서 %2 넘어옴': '%2 moved on from %1', '퍼널의 시작': 'Start of the funnel',
    '%1. %2 %3에서 %4 %5까지, 첫 단계 대비 %6. 좌우 화살표로 단계를 옮깁니다. 모든 값은 이어지는 표에 있습니다.': '%1. From %2 %3 to %4 %5, %6 of the first stage. Use the left and right arrows to move between the stages. Every value is in the table that follows.',
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
  // 같은 종류의 카드를 모두 찾아 그립니다. 코드를 두 번 붙여 넣어도 카드는 한 번만 그립니다.
  // 데이터가 바뀌면 다시 그립니다: 페이지의 스크립트가 카드 안 JSON(<script type="application/json">)의 글자를 바꾸면 그 카드만
  // 새 요소로 갈아 끼워 새로 그립니다(필터 · 기간 컨트롤과 잇는 길). 갈아 끼운 카드에는 data-vzb-live가 붙어, 움직이는 카드는
  // 처음부터 다시 재생하지 않고 마지막 장면을 바로 그립니다. 예전 요소가 페이지에서 빠지므로 그 카드의 움직임도 함께 끝납니다.
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
        try { draw(card, d, format(d)); } catch (e) {
          card.append(el('p', 'vzb-error', tx(d, '카드를 그리지 못했습니다: %s', e.message)));
        }
      });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
  }
  // 크기가 바뀔 때마다 그래픽을 다시 그립니다. 차트는 카드에 남은 높이를 채웁니다.
  function onSize(node, fn) {
    let lw = 0, lh = 0;
    new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width), h = Math.floor(entries[0].contentRect.height);
      if (w > 0 && h > 0 && (w !== lw || h !== lh)) { lw = w; lh = h; fn(w, h); }
    }).observe(node);
  }
