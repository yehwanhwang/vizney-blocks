  // Date Slider: 기간을 손잡이 둘로 고르는 컨트롤입니다(날짜 파라미터). min과 max를 YYYY-MM으로 적으면 한 칸이 한 달,
  // YYYY-MM-DD로 적으면 하루입니다. value는 처음 기간 [시작, 끝]이고(min과 같은 모양) 비우면 전체입니다. 끝도 고른 기간에 들어갑니다.
  // 말풍선에는 짧게 적습니다: 달은 26.06(영어 Jun '26), 날은 11.14(영어 Nov 14)이고 해가 걸치면 해를 붙입니다.
  // 값이 바뀌면 vzb-change 이벤트의 detail.value로 [시작, 끝]을 min과 같은 모양의 글자로 보냅니다(src/slider.js).
  mount('control-date', (card, d, f) => {
    const read = (s) => { const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(s == null ? '' : String(s)); return m ? { y: +m[1], m: +m[2], d: m[3] ? +m[3] : 0 } : null; };
    const p0 = read(d.min), p1 = read(d.max), byDay = !!(p0 && p0.d);
    if (!p0 || !p1 || !!p1.d !== byDay) throw new Error(tx(d, 'min과 max를 확인하세요.'));
    const DAY = 864e5, t0 = Date.UTC(p0.y, p0.m - 1, p0.d || 1);
    const seatOf = (p) => (byDay ? Math.round((Date.UTC(p.y, p.m - 1, p.d) - t0) / DAY) : (p.y - p0.y) * 12 + p.m - p0.m);
    const n = seatOf(p1);
    if (!(n >= 1)) throw new Error(tx(d, 'min과 max를 확인하세요.'));
    const day = (i) => (byDay ? new Date(t0 + i * DAY) : new Date(Date.UTC(p0.y, p0.m - 1 + i, 1)));
    const two = (v) => String(v).padStart(2, '0');
    const iso = (i) => { const x = day(i); return `${x.getUTCFullYear()}-${two(x.getUTCMonth() + 1)}${byDay ? `-${two(x.getUTCDate())}` : ''}`; };
    const years = p0.y !== p1.y, en = d.lang === 'en', mon = en ? new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }) : null;
    const text = (i) => {
      const x = day(i), yy = two(x.getUTCFullYear() % 100), mm = two(x.getUTCMonth() + 1), dd = x.getUTCDate();
      if (en) return byDay ? `${mon.format(x)} ${dd}${years ? ` '${yy}` : ''}` : `${mon.format(x)} '${yy}`;
      return byDay ? `${years ? `${yy}.` : ''}${mm}.${two(dd)}` : `${yy}.${mm}`;
    };
    const seat = (s, or) => { const p = read(s); return p && !!p.d === byDay ? Math.max(0, Math.min(n, seatOf(p))) : or; };
    const v = Array.isArray(d.value) ? d.value : [], a = seat(v[0], 0), b = seat(v[1], n);
    slider(card, d, f, { n, text, value: iso, start: [Math.min(a, b), Math.max(a, b)], aria: [tx(d, '%s 시작', d.label || d.title || tx(d, '기간')), tx(d, '%s 끝', d.label || d.title || tx(d, '기간'))] });
  });
