  // Range Slider: 숫자 범위를 손잡이 둘로 고르는 컨트롤입니다(주문 금액 · 수량 필터). min과 max 사이를 끌거나 화살표로 step 간격으로 고르고,
  // 손잡이 아래 값을 눌러(손잡이에서 Enter) 칸에 맞지 않는 값도 직접 칠 수 있습니다
  // (step을 비우면 범위의 1/100에 가까운 1 · 2 · 5와 그 열 배들), 고른 값은 format대로 손잡이 아래에 붙어 따라갑니다. value는 처음 범위 [시작, 끝]이고 비우면 전체입니다.
  // counts(min~max를 같은 폭으로 나눈 칸마다의 개수)를 주면 끄는 동안과 키보드로 옮기는 동안 레일 위에 분포 막대가 떠오르고, 범위 안의 개수를 noun(비우면 행)과 함께 적습니다..
  // 값이 바뀌면 vzb-change 이벤트의 detail.value로 [시작, 끝] 숫자를 보냅니다(src/slider.js).
  mount('range-slider', (card, d, f) => {
    const min = +d.min, max = +d.max;
    if (!fin(d.min) || !fin(d.max) || !(max > min)) throw new Error(tx(d, 'min과 max를 확인하세요.'));
    let step = fin(d.step) && +d.step > 0 ? +d.step : 0;
    if (!step) {
      const raw = (max - min) / 100, p = 10 ** Math.floor(Math.log10(raw)), q = raw / p;
      step = (q < 1.5 ? 1 : q < 3.5 ? 2 : q < 7.5 ? 5 : 10) * p;
    }
    const n = Math.max(1, Math.round((max - min) / step));
    const at = (i) => (i >= n ? max : +(min + i * step).toPrecision(12));
    // 자리: 값이 min에서 몇 칸째인지. 칸 사이의 값(직접 친 값, 칸에 맞지 않는 처음 값)은 소수 자리로 그대로 둡니다.
    const seat = (v, or) => (fin(v) ? Math.max(0, Math.min(n, (+v - min) / step)) : or);
    const v = Array.isArray(d.value) ? d.value : [], a = seat(v[0], 0), b = seat(v[1], n);
    const name = d.label || d.title || tx(d, '범위');   // 제목을 그리지 않으므로 화면 낭독기용 이름은 label에서 읽습니다
    const hist = Array.isArray(d.counts) && d.counts.length ? { counts: d.counts.map((c) => (fin(c) ? +c : 0)), min, max, noun: d.noun || '' } : null;
    // 직접 입력: 입력칸에는 단위 없는 숫자(천 단위 쉼표)를 넣고, 단위는 칸 앞뒤에 둡니다($ · 원 · unit 등). 칠 때는 쉼표 · 단위를 빼고 읽고,
    // K · M · B(천 · 백만 · 십억)와 천 · 만 · 억을 붙인 값도 읽습니다(6만 → 60000, 1.2K → 1200).
    const affix = { usd: ['$', ''], krw: ['', '원'], eok: ['', '억'], pct: ['', '%'], days: ['', tx(d, '일')] }[d.format] || ['', d.unit || ''];
    const plain = (v) => num(v, Number.isInteger(v) ? 0 : 2).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    // 배수 글자(화면에 쓰지 않으므로 유니코드로 적습니다): \uCC9C 천 · \uB9CC 만 · \uC5B5 억 · \uC870 조. eok은 값이 이미 억 단위입니다.
    const MUL = d.format === 'eok' ? { '\uC5B5': 1, '\uC870': 1e4 } : { k: 1e3, m: 1e6, b: 1e9, '\uCC9C': 1e3, '\uB9CC': 1e4, '\uC5B5': 1e8 };
    const read = (s) => {
      const m = /(-?\d+(?:\.\d+)?)\s*([kmb\uCC9C\uB9CC\uC5B5\uC870])?/i.exec(String(s).replace(/,/g, ''));
      if (!m) return null;
      const v = parseFloat(m[1]) * (MUL[(m[2] || '').toLowerCase()] || 1);
      return isFinite(v) ? seat(Math.max(min, Math.min(max, v)), null) : null;
    };
    slider(card, d, f, { n, text: (i) => show(f, at(i)), value: at, start: [Math.min(a, b), Math.max(a, b)], aria: [tx(d, '%s 최소', name), tx(d, '%s 최대', name)], hist,
      edit: { raw: (i) => plain(at(i)), read, pre: affix[0], suf: affix[1] } });
  });
