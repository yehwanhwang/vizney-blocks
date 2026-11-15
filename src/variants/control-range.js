  // Range Slider: 숫자 범위를 손잡이 둘로 고르는 컨트롤입니다(주문 금액 · 수량 필터). min과 max 사이를 step 간격으로 고르고
  // (step을 비우면 범위의 1/100에 가까운 1 · 2 · 5와 그 열 배들), 고른 범위는 format대로 위 줄에 적습니다. value는 처음 범위 [시작, 끝]이고 비우면 전체입니다.
  // counts(min~max를 같은 폭으로 나눈 칸마다의 개수)를 주면 트랙 위에 분포 막대를 그리고, 범위 안의 개수를 noun(예: 건 · orders)과 함께 적습니다..
  // 값이 바뀌면 vzb-change 이벤트의 detail.value로 [시작, 끝] 숫자를 보냅니다(src/slider.js).
  mount('control-range', (card, d, f) => {
    const min = +d.min, max = +d.max;
    if (!fin(d.min) || !fin(d.max) || !(max > min)) throw new Error(tx(d, 'min과 max를 확인하세요.'));
    let step = fin(d.step) && +d.step > 0 ? +d.step : 0;
    if (!step) {
      const raw = (max - min) / 100, p = 10 ** Math.floor(Math.log10(raw)), q = raw / p;
      step = (q < 1.5 ? 1 : q < 3.5 ? 2 : q < 7.5 ? 5 : 10) * p;
    }
    const n = Math.max(1, Math.round((max - min) / step));
    const at = (i) => (i >= n ? max : +(min + i * step).toPrecision(12));
    const seat = (v, or) => (fin(v) ? Math.max(0, Math.min(n, Math.round((+v - min) / step))) : or);
    const v = Array.isArray(d.value) ? d.value : [], a = seat(v[0], 0), b = seat(v[1], n);
    const hist = Array.isArray(d.counts) && d.counts.length ? { counts: d.counts.map((c) => (fin(c) ? +c : 0)), min, max, noun: d.noun || '' } : null;
    slider(card, d, f, { n, text: (i) => show(f, at(i)), value: at, start: [Math.min(a, b), Math.max(a, b)], aria: [tx(d, '%s 최소', d.title || ''), tx(d, '%s 최대', d.title || '')], hist });
  });
