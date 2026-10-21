  /* 탭 카드(Line · Bar · Donut - Tabs): 머리 아래를 똑같은 폭의 칸으로 나눠 지표 이름과 대표 수치를 두고, 고른 탭만 그립니다.
     탭마다 format이 달라도 되고, 대표 수치는 value가 없으면 마지막 값입니다. 값이 없는 탭(목록)은 이름만 적습니다.
     draw는 lineCard · barCard · basicList, make(탭)은 그 탭의 그리기 설정입니다. 탭은 좌우 화살표로도 옮깁니다. */
  function tabsCard(card, d, draw, make) {
    const tabs = (d.tabs || []).slice(0, 3);
    if (!tabs.length) throw new Error('tabs를 확인하세요.');
    const n = (d.labels || []).length;
    const fmts = tabs.map((t) => format(t));
    const row = el('div', 'vzb-tabs');
    row.setAttribute('role', 'tablist');
    row.setAttribute('aria-label', d.title || '지표');
    let cur = 0, chart = null;
    const spec = (i) => Object.assign({ f: fmts[i], fmt: tabs[i], name: tabs[i].name }, make(tabs[i]));
    if (!tabs.some((t) => Array.isArray(t.values))) row.classList.add('is-plain');
    const btns = tabs.map((t, i) => {
      const b = el('button', 'vzb-tab');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      const vals = t.values || [];
      let k = Math.min(vals.length, n) - 1;
      while (k >= 0 && vals[k] == null) k--;
      const v = t.value != null ? t.value : k >= 0 ? vals[k] : null;
      b.append(el('span', null, t.name));
      if (v != null) {
        const [text, unit] = fmts[i].parts(v);
        const fig = el('b', null, text);
        if (unit) fig.append(el('small', null, unit));
        b.append(fig);
      }
      b.addEventListener('click', () => pick(i));
      row.append(b);
      return b;
    });
    row.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      pick((cur + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length);
      btns[cur].focus();
    });
    const mark = () => btns.forEach((b, k) => { b.setAttribute('aria-selected', String(k === cur)); b.tabIndex = k === cur ? 0 : -1; });
    function pick(i) {
      if (i === cur) return;
      cur = i;
      mark();
      chart.show(spec(i));
    }
    mark();
    chart = draw(card, d, fmts[0], Object.assign({ top: row }, spec(0)));
  }
