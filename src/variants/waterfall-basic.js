  // Waterfall - Basic: 기준 합계에서 요인별 증감을 쌓아 결과 합계에 이르는 과정을 보여줍니다. 합계는 주황, 늘린 요인은 초록,
  // 줄인 요인은 빨강(KPI 배지와 같은 색)이며, 낮을수록 좋은 지표("better": "down")는 증감 색을 뒤집습니다.
  // 한 요인을 짚을 때: ask(highest · lowest)를 적으면 가장 크게 늘린 · 줄인 요인을 카드가 찾아 첫째 색으로 짚고, focus에는 요인 이름을 적습니다.
  // 짚은 요인만 첫째 색, 나머지 요인은 회색, 합계는 글자색으로 바뀌고, 막대가 왼쪽부터 하나씩 쌓이며 나타납니다(동작 줄이기 설정에서는 바로 그립니다).
  mount('waterfall-basic', (card, d, f) => {
    const want = d.better === 'down' ? -1 : 1;
    if (d.ask != null && d.ask !== 'highest' && d.ask !== 'lowest') throw new Error(tx(d, 'ask에는 highest나 lowest를 적으세요.'));
    const facs = (d.items || []).filter((it) => it && it.name != null && it.type !== 'total' && fin(it.value));
    let mark = null;
    if (d.focus != null) {
      mark = facs.find((it) => String(it.name) === String(d.focus));
      if (!mark) throw new Error(tx(d, 'focus의 이름이 items에 없습니다: %s', d.focus));
    } else if (d.ask) mark = facs.slice().sort((x, y) => (d.ask === 'highest' ? y.value - x.value : x.value - y.value))[0] || null;
    if (mark) {
      // 화면에 처음 보일 때부터 쌓이도록, 보이기 전에는 움직임을 멈춰 둡니다.
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((es) => { if (es[es.length - 1].isIntersecting) { card.classList.add('is-in'); io.disconnect(); } }, { threshold: 0.3 });
        io.observe(card);
      } else card.classList.add('is-in');
    }
    waterfallCard(card, d, f, {
      build: !!mark,
      toneOf: (r) => (mark ? (r.total ? 'ti' : r.name === String(mark.name) ? 'f1' : 'f0')
        : r.total ? 'f1' : Math.sign(r.value) * want > 0 ? 'fg' : r.value === 0 ? 'f0' : 'fb'),
      totalNote: (r, first) => { const diff = r.value - first.value, sg = diff > 0 ? '+' : diff < 0 ? '−' : ''; return tx(d, '%s 대비 %s', first.name, `${sg}${show(f, Math.abs(diff))}${first.value ? ` (${sg}${num(Math.abs(diff / first.value) * 100, 1)}%)` : ''}`); },
      legend: mark ? [{ name: tx(d, '합계'), tone: 'ti', box: true }, { name: String(mark.name), tone: 'f1', box: true }, { name: tx(d, '그 밖의 요인'), tone: 'f0', box: true }]
        : [{ name: tx(d, '합계'), tone: 'f1', box: true }, { name: tx(d, want > 0 ? '늘린 요인' : '줄인 요인'), tone: 'fg', box: true }, { name: tx(d, want > 0 ? '줄인 요인' : '늘린 요인'), tone: 'fb', box: true }],
    });
  });
