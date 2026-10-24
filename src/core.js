  /* 공통 도구: 숫자 표기, 증감, 카드 머리, 그리기 시작 */
  const SVGNS = 'http://www.w3.org/2000/svg';
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
  function format(d) {
    const dec = (v, fallback) => (d.decimals != null ? d.decimals : fallback);
    switch (d.format) {
      case 'eok': return { parts: (v) => [num(v, dec(v, Number.isInteger(v) || Math.abs(v) >= 100 ? 0 : 1)), '억'], rel: true };
      case 'krw': return { parts: krw, rel: true };
      case 'usd': return { parts: (v) => usd(v, d.decimals), rel: true, usd: true };
      case 'pct': return { parts: (v) => [num(v, dec(v, 1)), '%'], rel: false };
      case 'days': return { parts: (v) => [num(v, dec(v, 1)), '일'], rel: true };
      default: return { parts: (v) => [num(v, dec(v, Number.isInteger(v) ? 0 : 1)), d.unit || ''], rel: true };
    }
  }
  const show = (f, v) => f.parts(v).join('');
  // 그릴 수 있는 숫자인지(빈 값 · 빈 글자 · NaN 제외)
  const fin = (v) => v != null && v !== '' && isFinite(v);
  // 증감: 방향은 화살표로, 좋고 나쁨(tone)은 better(up · down · neutral)로 정합니다. 비율은 %p로 적습니다.
  function delta(f, value, base, better) {
    const diff = value - base;
    const dir = Math.abs(diff) < 1e-9 ? 0 : Math.sign(diff);
    const want = better === 'down' ? -1 : better === 'neutral' ? 0 : 1;
    const tone = dir === 0 || want === 0 ? 'flat' : dir === want ? 'good' : 'bad';
    let text;
    if (!f.rel) text = `${num(Math.abs(diff), 1)}%p`;
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
    if (dl.dir) b.append(arrow(dl.dir), el('span', 'vzb-sr', dl.dir > 0 ? '증가' : '감소'));
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
      line.append(badge(f, value, cmp.value, d.better), el('span', null, cmpText || `${cmp.label || '비교 기간'} 대비`));
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
        let d;
        try { d = JSON.parse(src ? src.textContent : ''); } catch (e) {
          card.append(el('p', 'vzb-error', `카드 데이터(JSON)를 읽지 못했습니다: ${e.message}`));
          return;
        }
        card.setAttribute('role', 'group');
        if (d.title) card.setAttribute('aria-label', d.title);
        try { draw(card, d, format(d)); } catch (e) {
          card.append(el('p', 'vzb-error', `카드를 그리지 못했습니다: ${e.message}`));
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
