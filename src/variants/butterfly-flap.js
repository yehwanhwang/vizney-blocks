  // Butterfly Flap: 가운데 열에 항목 이름(연령대 등)을 두고, 왼쪽 그룹(첫째 데이터 색)과 오른쪽 그룹(둘째 데이터 색)의 막대를 양쪽으로 뻗는 버터플라이 차트입니다.
  // 두 날개는 모든 기간에 같은 눈금이라, 기간을 옮겨도 막대 길이를 그대로 견줄 수 있습니다. 값은 가운데 열 양옆, 막대가 시작하는 자리에 적어 막대 끝을 비워 둡니다(끝에는 눈금이 옵니다).
  // 기간을 옮기면 두 날개가 거울처럼 함께 새 길이로 가고, 막대 끝이 용수철처럼 살짝 넘쳤다가 잦아듭니다(몇 px 안). 많이 바뀐 막대일수록 크게 떨려 눈이 그 줄로 갑니다.
  // 막대를 접거나 줄여 그리지 않으므로, 움직이는 동안에도 길이는 값을 따라갑니다.
  // 잔상: 떠나온 막대가 회색 면으로 남았다가 사라지고, 방금 떠나온 기간의 끝자리에 세로 눈금 하나가 남습니다. 막대가 눈금을 넘으면 늘어난 것이고, 못 미치면 줄어든 것입니다.
  // 기간이 두 개면 머리 오른쪽 위의 기간 단추로 오가고, 세 개 이상이면 아래 구간 막대와 되감기 · 재생/일시정지 · 빨리 감기 단추로 옮깁니다.
  // 위쪽 줄에 두 그룹의 이름과 합계(그려진 막대를 세어 함께 바뀝니다), 가운데에 눈금이 어느 기간의 자리인지 적습니다. 막대 옆의 값은 굴리지 않고 한 번에 바꿉니다.
  // 움직임: 화면에 보이면 첫 기간에서 잠시 멈췄다가 끝까지 한 번 재생하고 멈춥니다. 그래프에 마우스를 올리거나 키보드로 포커스하면 다음 기간으로 넘기지 않습니다.
  // 데이터가 바뀌어 다시 그릴 때(data-vzb-live)는 고른 기간(data-vzb-period, 없으면 마지막)과 눈금의 기간(data-vzb-from, 없으면 그 앞 기간)을 바로 그립니다.
  // 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 끝에서 잠시 쉬고 처음 기간으로 돌아가 다시 재생합니다. 손을 대면 되풀이를 멈춥니다.
  mount('butterfly-flap', (card, d, f) => {
    // 걸러서 남은 항목이 없을 때(items가 빈 배열)는 오류가 아니라 빈 화면입니다.
    const none = () => { head(card, d, f, null); card.append(el('p', 'vzb-bf-none', tx(d, '표시할 항목이 없습니다.'))); };
    if (Array.isArray(d.items) && !d.items.length) { none(); return; }
    const labels = Array.isArray(d.labels) ? d.labels.map(String) : [], n = labels.length, last = n - 1;
    const groups = Array.isArray(d.groups) ? d.groups.map(String) : [];
    const list = Array.isArray(d.items) ? d.items.filter((it) => it && it.name != null && it.name !== '') : [];
    if (n < 1) throw new Error(tx(d, 'labels에 기간을 1개 이상 적으세요.'));
    if (groups.length !== 2) throw new Error(tx(d, 'groups에 왼쪽과 오른쪽 그룹의 이름 2개를 적으세요.'));
    if (list.length < 2 || list.length > 10) throw new Error(tx(d, 'items에 항목을 2~10개 적으세요.'));
    const ok = (a) => Array.isArray(a) && a.length === n && a.every((v) => v == null || (fin(v) && v >= 0));
    if (list.some((it) => !ok(it.left) || !ok(it.right))) throw new Error(tx(d, 'labels와 left · right를 확인하세요.'));
    const items = list.map((it) => ({ name: String(it.name), vals: [it.left, it.right].map((a) => a.map((v) => (fin(v) ? +v : null))), x: [0, 0], vel: [0, 0], a0: [0, 0], zeta: [1, 1], gx: [0, 0] }));
    const N = items.length;
    let vmax = 0;
    items.forEach((it) => it.vals.forEach((a) => a.forEach((v) => { if (v != null && v > vmax) vmax = v; })));
    if (!(vmax > 0)) { none(); return; }
    const whole = items.every((it) => it.vals.every((a) => a.every((v) => v == null || Number.isInteger(v))));
    const val = (it, s, t) => (t >= 0 ? it.vals[s][t] : null);
    const sum = (s, t) => items.reduce((a, it) => a + (val(it, s, t) || 0), 0);
    const round = (v) => (whole ? Math.round(v) : Math.round(v * 10) / 10);
    const bare = (v) => f.parts(v)[0];   // 막대 옆의 값은 숫자만, 단위는 위쪽 줄과 툴팁에 적습니다
    const fx = (v) => v.toFixed(1);
    const pctText = (v) => `${num(v, 1)}%`;

    head(card, d, f, null);
    const hd = card.querySelector('.vzb-hd');
    // 기간 단추(두 기간): 머리 오른쪽 위의 라디오 묶음입니다. 고른 기간에는 글자색 알약이 미끄러져 옮겨 갑니다.
    let per = null, pill = null, opts = [];
    if (n === 2) {
      per = el('div', 'vzb-bf-per');
      per.setAttribute('role', 'radiogroup');
      per.setAttribute('aria-label', tx(d, '기간'));
      pill = el('span', 'vzb-bf-pill');
      pill.setAttribute('aria-hidden', 'true');
      per.append(pill);
      opts = labels.map((name, t) => {
        const b = el('button', 'vzb-bf-opt', name);
        b.type = 'button';
        b.setAttribute('role', 'radio');
        b.addEventListener('click', () => pickAt(t));
        per.append(b);
        return b;
      });
      per.addEventListener('keydown', (e) => {
        const k = e.key, step = k === 'ArrowRight' || k === 'ArrowDown' ? 1 : k === 'ArrowLeft' || k === 'ArrowUp' ? -1 : 0;
        const t = k === 'Home' ? 0 : k === 'End' ? last : step ? (cur + step + n) % n : -1;
        if (t < 0) return;
        e.preventDefault();
        pickAt(t);
        opts[t].focus();
      });
      hd.append(per);
    }
    // 위쪽 줄: 왼쪽 그룹(이름 · 합계) · 눈금의 기간 · 오른쪽 그룹. 두 그룹은 날개와 같은 쪽 끝에 둡니다.
    const keys = el('div', 'vzb-bf-keys');
    const tots = [0, 1].map((s) => {
      const k = el('span', `vzb-bf-key ${s ? 'is-right' : 'is-left'}`), b = el('b', 'vzb-bf-tot'), nb = el('span'), ub = el('span', 'vzb-bf-u');
      b.append(nb, ub);
      k.append(el('i', `vzb-key is-box vzb-t${s + 1}`), el('span', null, groups[s]), b);
      return { k, b, nb, ub };
    });
    const gkey = el('span', 'vzb-bf-gkey'), gname = el('span');
    gkey.append(el('i', 'vzb-bf-gsw'), gname);
    keys.append(tots[0].k, gkey, tots[1].k);
    const foot = el('div', 'vzb-foot vzb-fill vzb-bf');
    const plot = el('div', 'vzb-plot vzb-bf-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    const svg = svgEl('svg', { class: 'vzb-bf-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    foot.append(keys, plot);
    // 구간 막대와 재생 단추(세 기간 이상): Bump Race와 같은 모양과 조작입니다.
    let scrub = null, ssvg = null, ctl = null, btn = null, rew = null, ff = null;
    if (n > 2) {
      ctl = el('div', 'vzb-bf-ctl');
      const mk = (cls, paths) => {
        const b = el('button', `vzb-bf-btn ${cls}`);
        b.type = 'button';
        const ic = svgEl('svg', { class: 'vzb-bf-ic', viewBox: '0 0 16 16', 'aria-hidden': 'true' });
        paths.forEach(([c, dd]) => ic.append(svgEl('path', { class: c, d: dd })));
        b.append(ic);
        ctl.append(b);
        return b;
      };
      rew = mk('vzb-bf-rew', [['vzb-bf-play', 'M8 4.4v7.2L3.2 8zM13.6 4.4v7.2L8.8 8z']]);
      btn = mk('vzb-bf-main', [['vzb-bf-play', 'M5.6 3.9v8.2l6.6-4.1z'], ['vzb-bf-pause', 'M5.4 4v8M10.6 4v8']]);
      ff = mk('vzb-bf-ff', [['vzb-bf-play', 'M2.4 4.4v7.2L7.2 8zM8 4.4v7.2L12.8 8z']]);
      rew.setAttribute('aria-label', tx(d, '되감기'));
      ff.setAttribute('aria-label', tx(d, '빨리 감기'));
      scrub = el('div', 'vzb-bf-scrub');
      scrub.tabIndex = 0;
      scrub.setAttribute('role', 'slider');
      scrub.setAttribute('aria-label', tx(d, '기간'));
      scrub.setAttribute('aria-valuemin', '0');
      scrub.setAttribute('aria-valuemax', String(last));
      ssvg = svgEl('svg', { class: 'vzb-bf-ssvg', 'aria-hidden': 'true' });
      scrub.append(ssvg);
      const bar = el('div', 'vzb-bf-time');
      bar.append(scrub, ctl);
      foot.append(bar);
    }
    card.append(foot);
    // 화면 낭독기용 표: 항목마다 기간별 두 그룹의 값, 맨 아래에 합계
    const sr = el('div', 'vzb-sr'), table = el('table'), hr = el('tr');
    hr.append(el('th', null, tx(d, '항목')), ...labels.map((l) => el('th', null, l)));
    table.append(el('caption', null, d.title || ''), hr);
    const cell = (s, v) => `${groups[s]} ${v == null ? '–' : show(f, v)}`;
    items.concat({ name: tx(d, '합계'), total: true }).forEach((it) => {
      const tr = el('tr');
      tr.append(el('th', null, it.name), ...labels.map((_, t) => el('td', null, [0, 1].map((s) => cell(s, it.total ? sum(s, t) : val(it, s, t))).join(', '))));
      table.append(tr);
    });
    const say = el('div', 'vzb-sr');   // 기간을 옮기면 읽어 줍니다
    say.setAttribute('aria-live', 'polite');
    sr.append(table);
    card.append(sr, say);

    // 그림: 짚은 줄의 띠 → 잔상(회색 면) → 막대 → 눈금(바탕색 틈 위에 선) → 가운데 이름 → 값 순서로 쌓습니다.
    // 잔상은 막대 아래에 있어 줄어든 만큼만 보이고, 눈금은 막대 위에 있어 늘어난 막대 안에서도 보입니다.
    const band = svgEl('rect', { class: 'vzb-bf-band', rx: 4 });
    const gGhost = svgEl('g', {}), gBars = svgEl('g', {}), gTicks = svgEl('g', {}), gNames = svgEl('g', {}), gVals = svgEl('g', {});
    items.forEach((it) => {
      it.gh = [0, 1].map(() => svgEl('path', { class: 'vzb-bf-gh' }));
      it.bar = [0, 1].map((s) => svgEl('path', { class: `vzb-bf-bar ${s ? 'is-r' : 'is-l'}` }));
      it.tk = [0, 1].map(() => { const g = svgEl('g', { class: 'vzb-bf-tk' }); g.append(svgEl('line', { class: 'vzb-bf-tk0' }), svgEl('line', { class: 'vzb-bf-tk1' })); return g; });
      it.nm = svgText(0, 0, it.name, 'vzb-bf-nm', 'middle');
      it.lab = [0, 1].map((s) => svgText(0, 0, '', 'vzb-bf-val', s ? 'end' : 'start'));   // 값은 제 막대가 시작하는 쪽에 붙입니다
      gGhost.append(...it.gh);
      gBars.append(...it.bar);
      gTicks.append(...it.tk);
      gNames.append(it.nm);
      gVals.append(...it.lab);
    });
    svg.append(band, gGhost, gBars, gTicks, gNames, gVals);
    let track, fill, ticks = [], halo, thumb, endA, endB, now;
    if (scrub) {
      track = svgEl('line', { class: 'vzb-bf-track' });
      fill = svgEl('line', { class: 'vzb-bf-fill' });
      ticks = labels.map(() => svgEl('circle', { class: 'vzb-bf-tick', r: 1.5 }));
      halo = svgEl('circle', { class: 'vzb-bf-halo', r: 11 });
      thumb = svgEl('circle', { class: 'vzb-bf-thumb', r: 6 });
      endA = svgText(0, 30, labels[0], 'vzb-bf-end', 'start');
      endB = svgText(0, 30, labels[last], 'vzb-bf-end', 'end');
      now = svgText(0, 30, '', 'vzb-bf-now', 'middle');
      ssvg.append(track, fill, ...ticks, halo, thumb, endA, endB, now);
    }

    const fam = getComputedStyle(card).fontFamily;
    // 가운데 열과 값의 폭: 글꼴이 늦게 실리면 처음에는 대체 글꼴로 재게 되므로, 글꼴이 실린 뒤 다시 잽니다(아래 fonts.ready).
    let nameW = 0, valW = 0, nowW = 0, totW = 0, perW = 0;
    const measure = () => {
      // 합계 칸은 가장 긴 합계의 폭으로 잡아, 재생하는 동안 숫자가 바뀌어도 위쪽 줄이 흔들리지 않게 합니다.
      totW = Math.max(...[0, 1].flatMap((s) => labels.map((_, t) => { const [a, u] = f.parts(sum(s, t)); return textW(a, 700, fam, 14) + (u ? 2 + textW(u, 400, fam, 12) : 0); })));
      nameW = Math.max(...items.map((it) => textW(it.name, 400, fam, 14)));
      valW = Math.max(...items.flatMap((it) => it.vals.flat().filter((v) => v != null).map((v) => textW(bare(v), 700, fam, 14))));   // 짚으면 굵게
      nowW = Math.max(...labels.map((l) => textW(l, 700, fam, 14)));
      perW = Math.max(...labels.map((l) => textW(tx(d, '%1 위치', l), 400, fam, 14)));
    };
    measure();
    let W = 0, H = 0, hl = 0, hr2 = 0, cx = 0, span = 0, pitch = 0, hh = 0;
    const sc = (v) => (v > 0 ? (v / vmax) * span : 0);
    const rowY = (r) => pitch * (r + 0.5);
    // 막대: 경첩(가운데 열의 가장자리)에서 len만큼 뻗고, 바깥 끝만 4px 둥급니다.
    function barPath(hx, dir, yc, len) {
      if (len <= 0.5) return '';
      const ox = hx + dir * len, r = Math.min(4, len, hh), t = yc - hh, b = yc + hh;
      return `M${fx(hx)},${fx(t)}L${fx(ox - dir * r)},${fx(t)}Q${fx(ox)},${fx(t)} ${fx(ox)},${fx(t + r)}L${fx(ox)},${fx(b - r)}Q${fx(ox)},${fx(b)} ${fx(ox - dir * r)},${fx(b)}L${fx(hx)},${fx(b)}Z`;
    }
    let sx = () => 0, sw = 0;
    function layout(w, h) {
      W = w; H = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      // 가운데 열은 가장 긴 이름, 그 양옆 10px 밖에 값 칸(가장 긴 값의 폭), 값 칸에서 6px 밖이 경첩입니다. 날개는 경첩에서 남은 폭만큼 뻗습니다(넘칠 자리 4px은 남깁니다).
      cx = w / 2;
      const body = nameW / 2 + 10 + valW + 6;
      hl = cx - body;
      hr2 = cx + body;
      span = Math.max(12, w / 2 - body - 4);
      svg.classList.toggle('is-tight', span < 100);   // 날개가 짧으면 눈금 둘레의 틈을 좁힙니다
      pitch = h / N;
      hh = Math.max(3, Math.min(14, pitch * 0.36));   // 막대 두께는 줄 간격의 72%(최대 28px)
      items.forEach((it, r) => {
        it.nm.setAttribute('x', fx(cx)); it.nm.setAttribute('y', fx(rowY(r) + 5));
        it.lab.forEach((lab, z) => { lab.setAttribute('x', fx(z ? hr2 - 6 : hl + 6)); lab.setAttribute('y', fx(rowY(r) + 5)); });
      });
      // 위쪽 줄이 한 줄에 들어가지 않으면 눈금의 기간을 두 그룹 아래 줄로 내립니다.
      tots.forEach((o) => { o.b.style.minWidth = `${Math.ceil(totW)}px`; });
      gname.style.minWidth = `${Math.ceil(perW)}px`;   // 눈금의 기간도 가장 긴 글자의 폭으로
      keys.classList.remove('is-wrap');
      const need = [...keys.children].reduce((a, c) => a + c.scrollWidth, 0) + 48;   // 사이마다 24px은 남깁니다
      keys.classList.toggle('is-wrap', need > keys.clientWidth);
      if (per) hd.style.paddingRight = `${per.offsetWidth + 12}px`;   // 제목은 기간 단추 왼쪽까지
      if (scrub) {
        sw = scrub.clientWidth;
        ssvg.setAttribute('width', sw);
        ssvg.setAttribute('height', 34);
        ssvg.setAttribute('viewBox', `0 0 ${sw} 34`);
        const L = 6, R = Math.max(L + 10, sw - 6);
        sx = (t) => L + (t * (R - L)) / last;
        [track, fill].forEach((l) => { l.setAttribute('y1', 9); l.setAttribute('y2', 9); });
        track.setAttribute('x1', fx(sx(0)));
        track.setAttribute('x2', fx(sx(last)));
        fill.setAttribute('x1', fx(sx(0)));
        ticks.forEach((c, t) => { c.setAttribute('cx', fx(sx(t))); c.setAttribute('cy', 9); });
        endA.setAttribute('x', 0);
        endB.setAttribute('x', fx(sw));
      }
      placePill();
      render();
    }

    // 상태: cur는 고른 기간, from은 방금 떠나온 기간(눈금, 없으면 -1)입니다.
    // 막대마다 용수철 하나가 그려진 값(x)을 고른 기간의 값으로 끌고 갑니다. 옮기는 도중에 다시 옮겨도 그려진 자리와 속도에서 이어 가므로 막대가 튀지 않습니다.
    const live = card.hasAttribute('data-vzb-live'), loop = !!card.closest('[data-vzb-loop]');
    const kept = labels.indexOf(card.getAttribute('data-vzb-period')), keptFrom = labels.indexOf(card.getAttribute('data-vzb-from'));
    let cur = live ? (kept >= 0 ? kept : last) : 0;
    let from = live ? (keptFrom >= 0 && keptFrom !== cur ? keptFrom : cur - 1) : -1;
    const OMEGA = 11, GFADE = 800, TKIN = 220;
    let tp = cur, gT = GFADE, busy = false, hot = -1;
    items.forEach((it) => [0, 1].forEach((s) => { it.x[s] = it.a0[s] = val(it, s, cur) || 0; }));
    // 넘치는 양: 옮겨 갈 거리(px)가 길수록 크지만 7px을 넘지 않습니다(40px에 3.5px, 100px에 5px). 용수철의 감쇠를 그 양에 맞춥니다.
    function aim() {
      items.forEach((it) => [0, 1].forEach((s) => {
        const dist = Math.abs(sc(val(it, s, cur) || 0) - sc(it.x[s])), fr = 7 / (dist + 40), ln = Math.log(fr);
        it.zeta[s] = -ln / Math.sqrt(Math.PI * Math.PI + ln * ln);
        it.a0[s] = it.gx[s] = it.x[s];
      }));
      gT = 0;
      busy = true;
    }
    function step(dt) {
      let rem = dt / 1000, any = false;
      while (rem > 1e-6) {
        const h = Math.min(0.004, rem);
        rem -= h;
        items.forEach((it) => [0, 1].forEach((s) => {
          const to = val(it, s, cur) || 0;
          it.vel[s] += (-OMEGA * OMEGA * (it.x[s] - to) - 2 * it.zeta[s] * OMEGA * it.vel[s]) * h;
          it.x[s] += it.vel[s] * h;
        }));
      }
      const px = span / vmax;
      items.forEach((it) => [0, 1].forEach((s) => {
        const to = val(it, s, cur) || 0;
        if (Math.abs(it.x[s] - to) * px < 0.05 && Math.abs(it.vel[s]) * px < 2) { it.x[s] = to; it.vel[s] = 0; } else any = true;
      }));
      gT = Math.min(GFADE, gT + dt);
      busy = any || gT < GFADE;
    }
    const ghostOn = () => from >= 0 && from !== cur;
    function render() {
      if (!W) return;
      const tot = [0, 0], ghost = ghostOn();
      const ga = 1 - (gT / GFADE) ** 2, ta = Math.min(1, gT / TKIN);
      items.forEach((it, r) => {
        const yc = rowY(r);
        [0, 1].forEach((s) => {
          const to = val(it, s, cur) || 0, lo = Math.min(it.a0[s], to), hi = Math.max(it.a0[s], to);
          tot[s] += Math.max(lo, Math.min(hi, it.x[s]));   // 합계는 넘친 양을 빼고 셉니다
          const dir = s ? 1 : -1, hx = s ? hr2 : hl, ext = sc(Math.max(0, it.x[s]));
          it.bar[s].setAttribute('d', barPath(hx, dir, yc, ext));
          // 잔상: 떠나올 때 그려져 있던 막대가 회색 면으로 남았다가 사라집니다.
          const gh = it.gh[s], gon = ga > 0.004 && sc(it.gx[s]) > ext + 0.5;
          gh.style.display = gon ? '' : 'none';
          if (gon) { gh.setAttribute('d', barPath(hx, dir, yc, sc(it.gx[s]))); gh.style.opacity = ga.toFixed(3); }
          // 눈금: 방금 떠나온 기간의 끝자리. 값이 그대로면(2px 안) 그리지 않습니다.
          const pv = ghost ? val(it, s, from) : null, tl = sc(pv || 0), tk = it.tk[s], ton = pv != null && tl > 1 && Math.abs(tl - sc(to)) >= 2;
          tk.style.display = ton ? '' : 'none';
          if (ton) {
            const x = fx(hx + dir * tl), [h0, l1] = tk.children;
            h0.setAttribute('x1', x); h0.setAttribute('x2', x); h0.setAttribute('y1', fx(yc - hh)); h0.setAttribute('y2', fx(yc + hh));
            l1.setAttribute('x1', x); l1.setAttribute('x2', x); l1.setAttribute('y1', fx(yc - hh - 2)); l1.setAttribute('y2', fx(yc + hh + 2));
            tk.style.opacity = ta.toFixed(3);
          }
          const lab = it.lab[s], has = val(it, s, cur) != null;
          lab.style.display = has ? '' : 'none';
          const t = has ? bare(to) : '';   // 값은 굴리지 않고 새 값으로 한 번에 바꿉니다
          if (lab.textContent !== t) lab.textContent = t;
        });
      });
      // 위쪽 줄: 합계는 그려진 막대를 세어 함께 바뀝니다. 단위는 작게 씁니다.
      tots.forEach((o, s) => {
        const [a, b] = f.parts(round(tot[s]));
        if (o.nb.textContent !== a) o.nb.textContent = a;
        if (o.ub.textContent !== (b || '')) o.ub.textContent = b || '';
      });
      gkey.classList.toggle('is-off', !ghost);
      const gt = ghost ? tx(d, '%1 위치', labels[from]) : '';
      if (ghost && gname.textContent !== gt) gname.textContent = gt;
      // 짚은 줄의 띠: 그 날개의 값 칸에서 날개 끝까지
      band.style.display = hot < 0 ? 'none' : '';
      if (hot >= 0) {
        const s = hot & 1, bw = span + valW + 16;
        band.setAttribute('x', fx(s ? hr2 - valW - 12 : hl + valW + 12 - bw));
        band.setAttribute('y', fx(rowY(hot >> 1) - pitch / 2 + 1));
        band.setAttribute('width', fx(bw));
        band.setAttribute('height', fx(Math.max(0, pitch - 2)));
      }
      if (scrub) {
        const hx = sx(tp);
        fill.setAttribute('x2', fx(hx));
        ticks.forEach((c, t) => c.classList.toggle('is-past', t <= tp + 1e-6));
        thumb.setAttribute('cx', fx(hx));
        thumb.setAttribute('cy', 9);
        halo.setAttribute('cx', fx(hx));
        halo.setAttribute('cy', 9);
        if (now.textContent !== labels[cur]) now.textContent = labels[cur];
        const nw = nowW / 2 + 2, nx = Math.max(nw - 2, Math.min(sw - nw, hx));
        now.setAttribute('x', fx(nx));
        const aw = textW(labels[0], 400, fam, 12), bw = textW(labels[last], 400, fam, 12);
        endA.style.opacity = nx - nw < aw + 8 ? 0 : 1;
        endB.style.opacity = nx + nw > sw - bw - 8 ? 0 : 1;
      }
    }
    function describe() {
      plot.setAttribute('aria-label', tx(d, '%1, %2. %3 %4, %5 %6. 화살표로 막대를 옮깁니다. 모든 값은 이어지는 표에 있습니다.',
        d.title || '', labels[cur], groups[0], show(f, sum(0, cur)), groups[1], show(f, sum(1, cur))));
      if (scrub) {
        scrub.setAttribute('aria-valuenow', String(cur));
        scrub.setAttribute('aria-valuetext', labels[cur]);
      }
      setPill(cur);
    }

    // 재생: 기간 하나를 넘기고 STEP 동안 그 장면을 읽게 둡니다. 처음 첫 기간을 읽는 시간은 LEAD입니다.
    // 막대와 손잡이는 늘 끝까지 움직이고, 마우스 · 포커스로 잠시 멈추면(holds) 다음 기간으로 넘기지 않습니다. 화면 밖에서는 모두 멈춥니다.
    const STEP = 2000, LEAD = 900;
    const holds = new Set();
    let playing = false, wait = 0, rest = 0, scan = 0, scanT = 0, seen = false, inView = false, took = false, drag = null, raf = 0, stamp0 = 0;
    const moving = () => busy || Math.abs(tp - cur) > 1e-3;
    const on = () => (moving() || (!holds.size && (playing || rest > 0 || scan))) && inView && card.isConnected;
    function setBtn() {
      if (!btn) return;
      btn.classList.toggle('is-on', playing);
      btn.setAttribute('aria-label', playing ? tx(d, '일시정지') : tx(d, '재생'));
    }
    // t 기간으로 옮깁니다. 지금 기간은 눈금으로 남고, 두 날개가 지금 그려진 자리에서 새 값으로 갑니다.
    function go(t) {
      t = Math.max(0, Math.min(last, t));
      if (t === cur) return;
      from = cur;
      cur = t;
      aim();
      if (took) {
        card.setAttribute('data-vzb-period', labels[cur]);
        card.setAttribute('data-vzb-from', labels[from]);
        say.textContent = `${labels[cur]}: ${groups[0]} ${show(f, sum(0, cur))}, ${groups[1]} ${show(f, sum(1, cur))}`;
      }
      describe();
      kick();
    }
    function tick(stamp) {
      raf = 0;
      if (!on()) { stamp0 = 0; return; }
      const dt = stamp0 ? Math.min(100, stamp - stamp0) : 16;
      stamp0 = stamp;
      if (busy) step(dt);
      if (!drag) tp = Math.abs(cur - tp) < 1e-3 ? cur : tp + (cur - tp) * (1 - Math.exp(-dt / 70));   // 손잡이는 고른 기간으로 미끄러집니다
      if (!holds.size) {
        if (scan) {
          scanT -= dt;
          if (scanT <= 0) { scanT = 240; go(cur + scan); }   // 누르고 있으면 빠르게 한 기간씩
        } else if (rest > 0) {
          rest -= dt;
          if (rest <= 0) { rest = 0; go(0); playing = true; wait = STEP; setBtn(); }   // 갤러리: 처음 기간으로 돌아가 다시 재생
        } else if (playing) {
          wait -= dt;
          if (wait <= 0) {
            go(cur + 1);
            wait = STEP;
            if (cur >= last) { playing = false; setBtn(); if (!took && loop) rest = STEP + 1800; }
          }
        }
      }
      render();
      if (on()) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && on()) raf = requestAnimationFrame(tick); }
    // 사용자가 고른 기간: 재생과 되풀이를 멈추고 그 기간으로 옮깁니다.
    function pickAt(t) {
      took = true;
      rest = 0;
      playing = false;
      setBtn();
      go(t);
    }
    function play() {
      took = true;
      rest = 0;
      if (playing) { playing = false; setBtn(); return; }
      playing = true;
      setBtn();
      if (cur >= last) { go(0); wait = STEP; }   // 끝에 있으면 처음 기간으로 돌아가 재생합니다
      else wait = 300;
      kick();
    }
    if (btn) btn.addEventListener('click', play);
    // 되감기 · 빨리 감기: 누르면 한 기간, 누르고 있으면 계속. 키보드(Enter · Space)는 한 기간씩입니다.
    [[rew, -1], [ff, 1]].forEach(([b, dir]) => {
      if (!b) return;
      let timer = 0;
      const stop = () => { clearTimeout(timer); timer = 0; scan = 0; };
      b.addEventListener('pointerdown', (e) => {
        if (e.button) return;
        b.setPointerCapture(e.pointerId);
        pickAt(cur + dir);
        timer = setTimeout(() => { timer = 0; scan = dir; scanT = 0; stamp0 = 0; kick(); }, 380);
      });
      b.addEventListener('pointerup', stop);
      b.addEventListener('pointercancel', stop);
      b.addEventListener('lostpointercapture', stop);
      b.addEventListener('click', (e) => { if (e.detail === 0) pickAt(cur + dir); });
    });
    // 구간 막대: 누르면 그 기간으로, 끄는 동안은 손잡이가 손을 따라가고 가까운 기간으로 옮깁니다. 놓으면 손잡이가 그 기간에 자리를 잡습니다.
    if (scrub) {
      const qAt = (x0) => { const r = scrub.getBoundingClientRect(); return Math.max(0, Math.min(last, ((x0 - r.left - sx(0)) / Math.max(1, sx(last) - sx(0))) * last)); };
      scrub.addEventListener('pointerdown', (e) => {
        if (e.button) return;
        drag = { id: e.pointerId };
        scrub.setPointerCapture(e.pointerId);
        scrub.classList.add('is-drag');
        pickAt(Math.round(qAt(e.clientX)));
      });
      scrub.addEventListener('pointermove', (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        tp = qAt(e.clientX);
        const t = Math.round(tp);
        if (t !== cur) go(t);
        render();
      });
      const drop = (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        drag = null;
        scrub.classList.remove('is-drag');
        kick();
      };
      scrub.addEventListener('pointerup', drop);
      scrub.addEventListener('pointercancel', drop);
      scrub.addEventListener('keydown', (e) => {
        const t = { ArrowRight: cur + 1, ArrowUp: cur + 1, ArrowLeft: cur - 1, ArrowDown: cur - 1, PageUp: cur + 3, PageDown: cur - 3, Home: 0, End: last }[e.key];
        if (t == null) return;
        e.preventDefault();
        pickAt(t);
      });
    }
    // 기간 단추의 알약: 처음 자리는 움직이지 않고 놓은 뒤부터 미끄러집니다(is-ready).
    function placePill() {
      if (!per) return;
      const b = opts[cur];
      pill.style.width = `${b.offsetWidth}px`;
      pill.style.transform = `translateX(${b.offsetLeft}px)`;
      if (!per.classList.contains('is-ready') && b.offsetWidth) requestAnimationFrame(() => per.classList.add('is-ready'));
    }
    function setPill(t) {
      if (!per) return;
      opts.forEach((b, q) => { b.setAttribute('aria-checked', String(q === t)); b.tabIndex = q === t ? 0 : -1; b.classList.toggle('is-on', q === t); });
      placePill();
    }
    plot.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') holds.add('hover'); });
    plot.addEventListener('pointerleave', () => { holds.delete('hover'); kick(); });
    plot.addEventListener('focus', () => { if (plot.matches(':focus-visible')) holds.add('focus'); });   // 키보드로 들어왔을 때만 멈춥니다
    plot.addEventListener('blur', () => { holds.delete('focus'); kick(); });
    // 툴팁: 막대를 짚으면 그 줄에 옅은 띠를 깔고 그 값을 굵게 둡니다(다른 막대는 그대로 둡니다). 툴팁은 그 값이 어디서 왔는지(눈금의 기간 → 지금 기간, 증감)와
    // 그룹 안의 비중을 적고, 날개 바깥쪽에 띄워 막대와 합계를 덮지 않습니다. 바깥에 자리가 없으면 반대쪽 날개 위에 띄웁니다.
    // 키보드는 그래프에 포커스한 뒤 위아래 화살표로 줄을, 좌우 화살표로 날개를 옮깁니다.
    let api = null;
    plot.addEventListener('keydown', (e) => {
      const k = api ? api.at() : -1, mv = { ArrowUp: -2, ArrowDown: 2, ArrowLeft: k % 2 ? -1 : 0, ArrowRight: k % 2 ? 0 : 1 }[e.key];
      if (mv == null) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (k < 0) { api.show(e.key === 'ArrowRight' ? 1 : 0); return; }
      const j = k + mv;
      if (j >= 0 && j < N * 2) api.show(j);
    });
    api = interact(plot, N * 2,
      (x0, y0) => {
        const r = plot.getBoundingClientRect(), x = x0 - r.left, y = y0 - r.top;
        const row = Math.max(0, Math.min(N - 1, Math.floor(y / pitch)));
        return row * 2 + (x < cx ? 0 : 1);
      },
      (k) => {
        const row = k >> 1, s = k & 1, it = items[row], v = val(it, s, cur), pv = from >= 0 && from !== cur ? val(it, s, from) : null;
        hot = k;
        items.forEach((x, q) => [0, 1].forEach((z) => { const hit = q === row && z === s; x.lab[z].classList.toggle('is-on', hit); x.tk[z].classList.toggle('is-on', hit); }));
        render();
        const note = [], g = sum(s, cur);
        let spec;
        if (v != null && pv != null) {
          const dl = delta(f, v, pv, d.better), sg = dl.dir > 0 ? '+' : dl.dir < 0 ? '-' : '';
          note.push({ text: pv ? `${signed(f, v - pv)} (${sg}${dl.text})` : signed(f, v - pv), tone: dl.tone === 'flat' ? null : dl.tone });
          spec = { flow: [{ value: show(f, pv), name: labels[from] }, { value: show(f, v), name: labels[cur] }] };
        } else spec = { value: v == null ? '–' : show(f, v) };
        if (v != null && g > 0) note.push(tx(d, '%1 가운데 %2', groups[s], pctText((v / g) * 100)));
        spec.note = note;
        const tb = tipBody(spec, `${groups[s]} · ${it.name}`);
        // 툴팁 자리: 짚은 줄과 위아래 두 줄의 막대 · 눈금이 끝나는 곳 바깥. 화면에 그만한 자리(220px)가 없으면 반대쪽 날개의 경첩 옆에 둡니다.
        const r = plot.getBoundingClientRect(), dir = s ? 1 : -1, hx = s ? hr2 : hl;
        let out = 0;
        for (let q = Math.max(0, row - 2); q <= Math.min(N - 1, row + 2); q++) out = Math.max(out, sc(val(items[q], s, cur) || 0), ghostOn() ? sc(val(items[q], s, from) || 0) : 0);
        const xo = r.left + hx + dir * (out + 2), room = s ? window.innerWidth - xo >= 236 : xo >= 236;
        return { x: room ? xo : r.left + (s ? hl : hr2), y: r.top + rowY(row), side: (room ? s : !s) ? 'right' : 'left', label: `${groups[s]} · ${it.name}`, value: tb.node, text: tb.text };
      },
      () => { hot = -1; items.forEach((x) => [0, 1].forEach((z) => { x.lab[z].classList.remove('is-on'); x.tk[z].classList.remove('is-on'); })); render(); },
      true);

    setBtn();
    describe();
    onSize(plot, layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); if (W) layout(W, H); });
    // 화면에 처음 보일 때 첫 기간에서 잠시 멈췄다가 재생합니다. 화면 밖에 있는 동안은 멈춰 둡니다.
    const start = () => { if (!seen) { seen = true; if (!live && n > 1 && !took) { playing = true; wait = LEAD; setBtn(); } } };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => {
        if (!card.isConnected) { io.disconnect(); return; }
        inView = es[es.length - 1].isIntersecting;
        if (inView) start();
        kick();
      }, { threshold: 0.3 });
      io.observe(card);
    } else { inView = true; start(); }
  });
