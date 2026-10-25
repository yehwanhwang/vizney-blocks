  /* 공통 도구: 카드 안 문구, 숫자 표기, 증감, 카드 머리, 그리기 시작 */
  const SVGNS = 'http://www.w3.org/2000/svg';
  // 카드 안 문구(합계 · 기타 · 툴팁 · 낭독 문구): 한국어가 기본이고, JSON에 "lang": "en"을 적으면 영어로 바뀝니다.
  // 왼쪽의 한국어 원문이 키입니다. %s에는 값이 차례로, %1 · %2에는 그 순서의 값이 들어가고, '|' 뒤는 같은 말을 구분하는 꼬리표라 화면에는 안 나옵니다.
  // 원화 표기(조 · 억 · 만 · 원)는 영어에서도 그대로 둡니다. 숫자 표기는 두 언어가 같습니다.
  const EN = {
    '합계': 'Total', '합계 %s': 'Total %s', '합계 · 소계': 'Total · Subtotal', '기타': 'Other', '기타 %s개': 'Other (%s)', '그 밖의 %s개': '%s others',
    '값': 'Value', '이름': 'Name', '기간': 'Period', '지표': 'Metrics', '항목': 'Item', '항목|축': 'Axis', '항목 평균': 'Average score',
    '차트': 'chart', '막대 차트': 'bar chart', '선 차트': 'line chart', '워터폴 차트': 'waterfall chart',
    '일': 'days', '%s%p': '%spp', '증가': 'up', '감소': 'down', '%s 대비': 'vs %s', '%s %s 대비': 'vs %s %s', '비교 기간': 'prior period',
    '%s 대비 %s': '%2 vs %1', '%s 대비 %s|비율': '%2 of %1', '%1의 %2': '%2 of %1', '전체의 %s': '%s of total', '전체의 %1 · %2의 %3': '%1 of total · %3 of %2',
    '이번 기간': 'This period', '지난 기간': 'Prior period', '지난 기간 %s': 'Prior period %s', '비교 기간|범례': 'Prior period', '올해': 'This year', '작년': 'Last year',
    '이전': 'Before', '이후': 'After', '직전 시점': 'previous period', '두 기간 모두 %s': 'Both periods: %s', '%s 진행 중': '%s in progress',
    '목표': 'Target', '목표|소문자': 'target', '실적': 'Actual', '달성률': 'Attainment', '상태': 'Status', '달성': 'Met', '미달': 'Missed', '이내': 'Within', '초과': 'Over',
    '%s 초과': '%s exceeded', '%s 미달': '%s missed', '목표 달성': 'Target met', '목표 미달': 'Target missed', '목표 이내': 'Within target', '목표 초과': 'Over target', '목표(100%)': 'Target (100%)',
    '%s %s · 달성률 %s%': '%s %s · Attainment %s%', '목표 %s · 달성률 %s%': 'Target %s · Attainment %s%', '목표의 %s%': '%s% of target',
    '%1 %2의 %3%': '%3% of %1 %2', '%1 %2의 %3% 사용': '%3% of %1 %2 used',
    '평균': 'Average', '기준': 'Reference', '비중': 'Share', '비중 %s%p': 'Share %spp', '이전 대비': 'vs prior', '처음 대비': 'vs first', '흐름': 'Trend', '최근': 'Latest',
    '누계': 'Running total', '반영 후 누계 %s': 'Running total after: %s', '늘린 요인': 'Increase', '줄인 요인': 'Decrease', '빼는 항목': 'Deduction',
    '왼쪽': 'Left', '오른쪽': 'Right', '출발': 'From', '도착': 'To', '가로값': 'X value', '세로값': 'Y value', '외 %s곳 %s': 'and %s more: %s',
    '%s위': '#%s', '%s %s위': '%s #%s', '%s 순위': '%s ranks', '%1 %2위에서 %3': 'from #%2 in %1, %3', '%s계단 오름': 'up %s', '%s계단 내림': 'down %s', '그대로': 'unchanged',
    '첫 단계': 'First step', '시작': 'Start', '전환 %s': 'Conversion %s', '전체 전환율': 'Overall conversion', '앞 단계 대비 %s': '%s of the previous step',
    '앞 단계에서 %s 이탈': '%s dropped from the previous step', '앞 단계에서 %s 빠짐': '%s dropped from the previous step',
    '행마다 작음': 'Low in each row', '큼': 'High', '한 칸 1% · 합계 %s': 'One square = 1% · Total %s', '%1 %2%에서 %3%': '%1 from %2% to %3%',
    '. 열 제목을 누르면 정렬합니다.': '. Click a column heading to sort.', ' 표에 포커스한 뒤 화살표 키로 칸을 옮기면 그 칸의 값을 읽습니다.': ' Focus the table and move between cells with the arrow keys to hear each value.',
    '표시할 데이터가 없습니다.': 'No data to show.',
    '%s %s, %s–%s. 좌우 화살표로 기간을 옮깁니다. 모든 값은 이어지는 표에 있습니다.': '%s %s, %s–%s. Use the left and right arrows to move between periods. Every value is in the table that follows.',
    '%s 추이: %s. 좌우 화살표로 시점을 옮깁니다.': '%s trend: %s. Use the left and right arrows to move between periods.',
    '%s: %s%s. 좌우 화살표로 기간을 옮깁니다.': '%s: %s%s. Use the left and right arrows to move between periods.',
    '%s. 좌우 화살표로 항목을 옮깁니다.': '%s. Use the left and right arrows to move between items.',
    '%s: %s, 합계 %s. 좌우 화살표로 항목을 옮깁니다.': '%s: %s, total %s. Use the left and right arrows to move between items.',
    '%s: %s. 좌우 화살표로 칸을 옮깁니다.': '%s: %s. Use the left and right arrows to move between cells.',
    '%s: %s. 위아래 화살표로 항목을 옮깁니다.': '%s: %s. Use the up and down arrows to move between items.',
    '%s 목록, %s줄. 위아래 화살표로 항목의 자세한 값을 봅니다.': '%s list, %s rows. Use the up and down arrows to see each item.',
    '%s 순위 변화, %s–%s. 위아래 화살표로 항목을 옮깁니다. 모든 순위는 이어지는 표에 있습니다.': '%s rank changes, %s–%s. Use the up and down arrows to move between items. Every rank is in the table that follows.',
    '%s 퍼널, %s. 좌우 화살표로 단계를 옮깁니다.': '%s funnel, %s. Use the left and right arrows to move between steps.',
    '%s 레이더 차트, 항목 %s개와 대상 %s개. 좌우 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.': '%s radar chart, %s axes and %s series. Use the left and right arrows to move between axes. Every value is in the table that follows.',
    '%s 생키 차트, 노드 %s개와 흐름 %s개. 좌우 화살표로 노드와 흐름을 차례로 짚습니다. 모든 흐름은 이어지는 표에 있습니다.': '%s Sankey chart, %s nodes and %s flows. Use the left and right arrows to step through nodes and flows. Every flow is in the table that follows.',
    '%s 산점도, 점 %s개. 좌우 화살표로 점을 옮깁니다. 모든 값은 이어지는 표에 있습니다.': '%s scatter plot, %s points. Use the left and right arrows to move between points. Every value is in the table that follows.',
    '카드 데이터(JSON)를 읽지 못했습니다: %s': 'Could not read the card data (JSON): %s', '카드를 그리지 못했습니다: %s': 'Could not draw the card: %s',
    'labels와 values(또는 series)를 확인하세요.': 'Check labels and values (or series).', 'tabs를 확인하세요.': 'Check tabs.', 'reference.value에 숫자나 "avg"를 적으세요.': 'Set reference.value to a number or "avg".',
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
  function krw(v) {
    const a = Math.abs(v);
    if (a >= 1e12) return [num(v / 1e12, 1), '조'];
    if (a >= 1e8) return [num(v / 1e8, a >= 1e10 ? 0 : 1), '억'];
    if (a >= 1e4) return [num(v / 1e4, 0), '만'];
    return [num(v, 0), '원'];
  }
  // 달러 금액: 원래 값을 받아 K · M · B로 줄이고 소수 한 자리로 맞춥니다($745.6K). 접미사는 단위처럼 작게 씁니다.
  function usd(v, d) {
    const a = Math.abs(v), s = v < 0 ? '−' : '';
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
      case 'krw': return F({ parts: krw, rel: true });
      case 'usd': return F({ parts: (v) => usd(v, d.decimals), rel: true, usd: true });
      case 'pct': return F({ parts: (v) => [num(v, dec(v, 1)), '%'], rel: false });
      case 'days': return F({ parts: (v) => [num(v, dec(v, 1)), tx(root || d, '일')], rel: true });
      default: return F({ parts: (v) => [num(v, dec(v, Number.isInteger(v) ? 0 : 1)), d.unit || ''], rel: true });
    }
  }
  const show = (f, v) => withUnit(...f.parts(v));
  // 그릴 수 있는 숫자인지(빈 값 · 빈 글자 · NaN 제외)
  const fin = (v) => v != null && v !== '' && isFinite(v);
  // 증감: 방향은 화살표로, 좋고 나쁨(tone)은 better(up · down · neutral)로 정합니다. 비율은 %p로 적습니다.
  function delta(f, value, base, better) {
    const diff = value - base;
    const dir = Math.abs(diff) < 1e-9 ? 0 : Math.sign(diff);
    const want = better === 'down' ? -1 : better === 'neutral' ? 0 : 1;
    const tone = dir === 0 || want === 0 ? 'flat' : dir === want ? 'good' : 'bad';
    let text;
    if (!f.rel) text = tx(f, '%s%p', num(Math.abs(diff), 1));
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
  function head(card, d, f, value, cmp, cmpText) {
    const hd = el('div', 'vzb-hd');
    hd.append(el('div', 'vzb-title', d.title || ''));
    if (d.subtitle) hd.append(el('div', 'vzb-sub', d.subtitle));
    card.append(hd);
    if (value == null) return;
    const fig = el('div', 'vzb-fig');
    fig.append(figure(f, value));
    if (cmp && cmp.value != null) {
      const line = el('span', 'vzb-delta');
      line.append(badge(f, value, cmp.value, d.better), el('span', null, cmpText || tx(d, '%s 대비', cmp.label || tx(d, '비교 기간'))));
      fig.append(line);
    }
    card.append(fig);
  }
  // 같은 종류의 카드를 모두 찾아 그립니다. 코드를 두 번 붙여 넣어도 카드는 한 번만 그립니다.
  function mount(type, draw) {
    const run = () => {
      document.querySelectorAll(`.vzb-card[data-vzb="${type}"]:not([data-vzb-ready])`).forEach((card) => {
        card.setAttribute('data-vzb-ready', '');
        const src = card.querySelector('script[type="application/json"]');
        const raw = src ? src.textContent : '';
        let d;
        try { d = JSON.parse(raw); } catch (e) {
          card.append(el('p', 'vzb-error', tx(/"lang"\s*:\s*"en"/.test(raw) ? { lang: 'en' } : null, '카드 데이터(JSON)를 읽지 못했습니다: %s', e.message)));
          return;
        }
        card.setAttribute('role', 'group');
        if (d.title) card.setAttribute('aria-label', d.title);
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
