  // Butterfly Flap: 가운데 열에 항목 이름을 두고, 왼쪽 그룹(첫째 데이터 색)과 오른쪽 그룹(둘째 데이터 색)의 막대를 양쪽으로 뻗어 항목마다 두 그룹을 견주는 버터플라이 차트입니다
  // (예: 여성 · 남성 회원의 카테고리별 주문 수). 두 날개는 같은 눈금이고, 가운데에는 이름만 두어 두 날개를 가까이 붙입니다(이름 열이 나비의 몸통). 값은 제 막대 끝에 적습니다.
  // 데칼코마니: 항목마다 적은 쪽 막대 끝에서 많은 쪽의 길이까지 회색 면을 이어 그립니다(반대쪽과의 차이). 그래서 날개의 바깥 윤곽은 좌우 대칭이 되고,
  // 회색이 있는 쪽이 그 항목에서 적은 쪽, 회색의 길이가 두 그룹의 차이입니다. 막대와 회색 사이는 카드 바탕색 2px로 끊고, 적은 쪽의 값은 제 막대 끝, 회색 면 위에 놓입니다.
  // 움직임: 화면에 보이면 접혀 있던 두 날개가 좌우로 펼쳐지고(값 그대로의 막대), 한 번 접어 잠깐 맞닿았다가 다시 펼칩니다. 맞닿은 날개는 서로의 길이를 옮겨 받아,
  // 다시 펼칠 때 회색 면이 함께 펼쳐집니다. 날개는 경첩(이름 열의 가장자리)을 축으로 화면 앞쪽으로 들리며 접히고, 두 날개는 거울처럼 함께 움직입니다.
  // 날갯짓처럼 부드럽게: 움직임은 멈춤과 출발이 느린 진자 같은 곡선을 따르고, 날개는 뿌리가 먼저 움직이고 끝이 조금 늦게 따라오며 휘어집니다. 펼칠 때는 살짝 더 벌어졌다가 제자리로 잦아듭니다.
  // 움직이는 동안 막대는 원근으로 짧아 보이고, 멈춘 장면의 길이는 값 그대로입니다.
  // 값은 날개에 붙어 함께 움직이며 접힐수록 옅어지고, 이름은 움직이지 않습니다.
  // 카드가 화면에 보이면 한 번 움직이고, 다시 보기 단추로 되풀이합니다. 마우스를 올리거나 키보드로 포커스하면 움직임을 잠시 멈춥니다.
  // 데이터가 바뀌어 다시 그릴 때(data-vzb-live)는 마지막 장면(펼친 날개와 회색 면)을 바로 그립니다.
  // 카드를 감싼 요소에 data-vzb-loop가 있으면(갤러리) 끝에서 잠시 쉬고, 날개를 접었다가 처음부터 다시 펼칩니다.
  mount('butterfly-flap', (card, d, f) => {
    // 걸러서 남은 항목이 없을 때(items가 빈 배열)는 오류가 아니라 빈 화면입니다.
    if (Array.isArray(d.items) && !d.items.length) {
      head(card, d, f, null);
      card.append(el('p', 'vzb-bf-none', tx(d, '표시할 항목이 없습니다.')));
      return;
    }
    const groups = Array.isArray(d.groups) ? d.groups.map(String) : [];
    if (groups.length !== 2) throw new Error(tx(d, 'groups에 왼쪽과 오른쪽 그룹의 이름 2개를 적으세요.'));
    const list = Array.isArray(d.items) ? d.items.filter((it) => it && it.name != null && it.name !== '') : [];
    if (list.length < 2 || list.length > 10) throw new Error(tx(d, 'items에 항목을 2~10개 적으세요.'));
    const okv = (v) => v == null || (fin(v) && v >= 0);
    if (list.some((it) => !okv(it.left) || !okv(it.right))) throw new Error(tx(d, 'items의 left와 right에 0 이상의 값을 적으세요.'));
    const items = list.map((it) => ({ name: String(it.name), v: [it.left, it.right].map((x) => (fin(x) ? +x : null)) }));
    const N = items.length;
    const vmax = Math.max(0, ...items.flatMap((it) => it.v.filter((x) => x != null))) || 1;
    const tot = [0, 1].map((s) => items.reduce((a, it) => a + (it.v[s] || 0), 0));
    // 항목마다 두 그룹의 차이: lead는 많은 쪽(0 왼쪽, 1 오른쪽), 같으면 -1, 한쪽 값이 없으면 null입니다.
    items.forEach((it) => {
      const [a, b] = it.v;
      it.lead = a == null || b == null ? null : a > b ? 0 : b > a ? 1 : -1;
      it.gap = it.lead == null ? 0 : Math.abs(a - b);
    });
    const anyGap = items.some((it) => it.lead != null && it.lead >= 0);
    const bare = (v) => f.parts(v)[0];   // 막대 끝의 값은 숫자만, 단위는 위쪽 줄과 툴팁에 적습니다
    const pct1 = (r) => `${num(r * 100, 1)}%`;
    const fx = (v) => v.toFixed(1);
    const gapText = (it) => (it.lead == null ? '–' : it.lead < 0 ? tx(d, '같음') : `${groups[it.lead]} ${signed(f, it.gap)}`);

    const live = card.hasAttribute('data-vzb-live');   // 데이터가 바뀌어 다시 그린 카드: 처음부터 재생하지 않고 마지막 장면을 그립니다
    head(card, d, f, null);
    const hd = card.querySelector('.vzb-hd');
    const btn = el('button', 'vzb-bf-btn');
    btn.type = 'button';
    btn.setAttribute('aria-label', tx(d, '처음부터 다시'));
    const ic = svgEl('svg', { class: 'vzb-bf-ic', viewBox: '0 0 16 16', 'aria-hidden': 'true' });
    ic.append(svgEl('path', { d: 'M3.7 9a4.4 4.4 0 1 0 1.2-4.2' }), svgEl('path', { d: 'M4.6 2.6v2.6h2.6' }));
    btn.append(ic);
    hd.append(btn);   // 다시 보기 단추는 머리의 오른쪽 위
    // 위쪽 줄: 왼쪽 끝에 왼쪽 그룹, 오른쪽 끝에 오른쪽 그룹(견본 · 이름 · 합계), 가운데에 회색 면의 뜻. 범례를 대신합니다.
    const keys = el('div', 'vzb-bf-keys');
    const gk = [0, 1].map((s) => {
      const k = el('span', `vzb-bf-key ${s ? 'is-right' : 'is-left'}`), b = el('b', 'vzb-bf-tot'), [a, u] = f.parts(tot[s]);
      b.append(el('span', null, a));
      if (u) b.append(el('span', 'vzb-bf-u', u));
      k.append(el('i', `vzb-key is-box vzb-t${s + 1}`), el('span', null, groups[s]), b);
      return k;
    });
    const gkey = el('span', 'vzb-bf-gkey is-off');
    gkey.append(el('i', 'vzb-bf-gsw'), el('span', null, tx(d, '반대쪽과의 차이')));
    keys.append(gk[0], gkey, gk[1]);
    const foot = el('div', 'vzb-foot vzb-fill vzb-bf');
    const plot = el('div', 'vzb-plot vzb-bf-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', tx(d, '%1. %2 %3, %4 %5. 위아래 화살표로 항목을 옮깁니다. 모든 값은 이어지는 표에 있습니다.',
      d.title || '', groups[0], show(f, tot[0]), groups[1], show(f, tot[1])));
    const svg = svgEl('svg', { class: 'vzb-bf-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    foot.append(keys, plot);
    card.append(foot);
    // 화면 낭독기용 표: 항목 · 두 그룹의 값 · 차이, 맨 아래에 합계
    const sr = el('div', 'vzb-sr'), table = el('table'), hr0 = el('tr');
    hr0.append(...[tx(d, '항목'), groups[0], groups[1], tx(d, '차이')].map((k) => el('th', null, k)));
    table.append(el('caption', null, d.title || ''), hr0);
    items.forEach((it) => {
      const tr = el('tr');
      tr.append(el('th', null, it.name), ...it.v.map((v) => el('td', null, v == null ? '–' : show(f, v))), el('td', null, gapText(it)));
      table.append(tr);
    });
    const trT = el('tr');
    trT.append(el('th', null, tx(d, '합계')), ...tot.map((v) => el('td', null, show(f, v))), el('td', null, ''));
    table.append(trT);
    sr.append(table);
    card.append(sr);

    // 그림(아래부터): 짚은 줄의 띠 · 회색 면 · 막대 · 이름과 값(값은 회색 면 위에 놓일 수 있습니다)
    const band = svgEl('rect', { class: 'vzb-bf-band', rx: 4 });
    const gTail = svgEl('g', {}), gBar = svgEl('g', {}), gTxt = svgEl('g', {});
    items.forEach((it) => {
      it.bar = [0, 1].map((s) => svgEl('path', { class: `vzb-bf-bar ${s ? 'is-r' : 'is-l'}` }));
      it.tail = [0, 1].map(() => svgEl('path', { class: 'vzb-bf-tail' }));
      it.nm = svgText(0, 0, it.name, 'vzb-bf-nm', 'middle');
      it.lab = [0, 1].map((s) => svgText(0, 0, it.v[s] == null ? '–' : bare(it.v[s]), 'vzb-bf-val', s ? 'start' : 'end'));   // 값은 제 막대의 바깥 끝에 붙입니다
      gTail.append(...it.tail);
      gBar.append(...it.bar);
      gTxt.append(it.nm, ...it.lab);
    });
    svg.append(band, gTail, gBar, gTxt);

    // 가운데 열과 값의 폭(짚으면 굵어지므로 굵은 글자로 잽니다). 글꼴이 늦게 실리면 실린 뒤 다시 잽니다(아래 fonts.ready).
    const fam = getComputedStyle(card).fontFamily;
    let nameW = 0, valW = 0;
    const measure = () => {
      nameW = Math.max(...items.map((it) => textW(it.name, 700, fam, 14)));
      items.forEach((it) => { it.lw = it.lab.map((l) => textW(l.textContent, 700, fam, 14)); });
      valW = Math.max(...items.flatMap((it) => it.lw));
    };
    measure();
    // 가운데 열은 가장 긴 이름에 양옆 10px이고, 그 가장자리가 경첩입니다. 날개는 경첩에서 값 자리(6px + 가장 긴 값)를 남기고 카드 끝까지 뻗습니다.
    // 막대 두께는 줄 간격의 72%(최대 32px)입니다.
    let W = 0, H = 0, cx = 0, hl = 0, hr = 0, span = 1, pitch = 1, hh = 1, ym = 0, PD = 1;
    const PK = 11;   // 원근: 보는 눈이 가장 긴 날개 길이의 11배 떨어져 있습니다(접힌 날개 끝이 위아래로 10%쯤만 벌어집니다)
    const sc = (v) => (v > 0 ? (v / vmax) * span : 0);
    const rowY = (r) => pitch * (r + 0.5);
    function layout(w, h) {
      W = w; H = h;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      cx = w / 2;
      const body = nameW / 2 + 10;
      hl = cx - body;
      hr = cx + body;
      span = Math.max(12, w / 2 - body - 6 - valW - 2);
      pitch = h / N;
      hh = Math.max(3, Math.min(16, pitch * 0.36));
      ym = h / 2;
      PD = span * PK;
      items.forEach((it, r) => { it.nm.setAttribute('x', fx(cx)); it.nm.setAttribute('y', fx(rowY(r) + 5)); });
      band.setAttribute('x', 0);
      band.setAttribute('width', fx(w));
      band.setAttribute('height', fx(Math.max(0, pitch - 2)));
      // 위쪽 줄이 한 줄에 들어가지 않으면 회색 면의 뜻을 두 그룹 아래 줄로 내립니다.
      keys.classList.remove('is-wrap');
      const need = [...keys.children].reduce((a, c) => a + c.scrollWidth, 0) + 48;
      keys.classList.toggle('is-wrap', need > keys.clientWidth);
      render();
    }

    // 날개의 모양: 날개는 뻣뻣한 판이 아니라 뿌리(경첩)가 먼저 움직이고 끝이 조금 늦게 따라오는 부드러운 날개입니다(끝이 LAG만큼 늦습니다).
    // 날개를 S마디로 나눠 마디마다 들린 각(TH)을 구하고, 경첩에서부터 이어 붙여 마디 끝의 가로 자리(X)와 화면 앞으로 나온 깊이(Z)를 셉니다.
    // 깊이 z에 있는 점은 g = PD / (PD - z)배로 커 보여, 들린 날개의 끝은 경첩 쪽으로 다가오며 위아래로 조금 벌어집니다.
    const A_MAX = 1.42;   // 접힘은 81°: 날개가 아주 사라지지 않고 경첩 옆에 짧은 띠(길이의 15%쯤)로 남습니다
    const S = 24, LAG = 130;
    const TH = new Float64Array(S + 1), X = new Float64Array(S + 1), Z = new Float64Array(S + 1);
    let flat = true;
    function shape() {
      const ds = span / S;
      flat = true;
      for (let i = 0; i <= S; i++) { TH[i] = A_MAX * curve(tau - (LAG * i) / S); if (Math.abs(TH[i]) > 1e-4) flat = false; }
      X[0] = 0; Z[0] = 0;
      for (let i = 1; i <= S; i++) { const a = (TH[i - 1] + TH[i]) / 2; X[i] = X[i - 1] + ds * Math.cos(a); Z[i] = Z[i - 1] + ds * Math.sin(a); }
    }
    // 경첩에서 r만큼 떨어진 점의 자리(날개 끝 밖은 끝 마디의 방향으로 잇습니다)
    function proj(hx, dir, r, y) {
      const ds = span / S, q = r / ds, i = Math.max(0, Math.min(S - 1, Math.floor(q))), k = q - i, over = r > span ? r - span : 0;
      const x = over ? X[S] + over * Math.cos(TH[S]) : X[i] + (X[i + 1] - X[i]) * k, z = over ? Z[S] + over * Math.sin(TH[S]) : Z[i] + (Z[i + 1] - Z[i]) * k;
      const g = PD / (PD - z);
      return [hx + dir * x * g, ym + (y - ym) * g];
    }
    const angleAt = (r) => TH[Math.max(0, Math.min(S, Math.round((r / span) * S)))];
    // 날개 위의 막대 한 조각(경첩에서 r0부터 r1까지): 날개가 휘어 있으면 마디마다 꺾어 그리고, 바깥 끝만 4px 둥급니다.
    const pts = (a) => a.map((q) => `${fx(q[0])},${fx(q[1])}`).join('L');
    function slab(hx, dir, r0, r1, yc) {
      if (r1 - r0 < 0.5) return '';
      const rr = Math.min(4, (r1 - r0) / 2, hh), rs = [r0], ds = span / S;
      if (!flat) for (let i = Math.floor(r0 / ds) + 1; i * ds < r1 - rr - 0.5; i++) rs.push(i * ds);
      rs.push(r1 - rr);
      const top = rs.map((r) => proj(hx, dir, r, yc - hh)), bot = rs.map((r) => proj(hx, dir, r, yc + hh)).reverse();
      const B = proj(hx, dir, r1, yc - hh), C = proj(hx, dir, r1, yc + hh);
      if (Math.abs(B[0] - top[0][0]) < 0.3) return '';
      const rv = Math.min(rr, (C[1] - B[1]) / 2);
      return `M${pts(top)}Q${fx(B[0])},${fx(B[1])} ${fx(B[0])},${fx(B[1] + rv)}L${fx(C[0])},${fx(C[1] - rv)}Q${fx(C[0])},${fx(C[1])} ${pts(bot)}Z`;
    }
    // 움직임의 시간표: [밀리초, 접힌 정도(1 접힘, 0 펼침, 음수는 펼친 자리보다 조금 더 벌어짐)]. 점 사이는 코사인 곡선으로 이어, 점마다 속도가 0이 되는 진자 같은 움직임입니다.
    // 펼침(살짝 더 벌어졌다 돌아옴) → 숨 고르기 → 접음(맞닿는 순간 서로의 길이를 옮겨 받음) → 다시 펼침(회색 면과 함께, 살짝 더 벌어졌다 잦아듦)
    const KEYS = [[0, 1], [680, -0.06], [960, 0], [1180, 0], [1800, 1], [2520, -0.07], [2840, 0.015], [3080, 0]];
    const T_FOLDED = 1800, END = 3080, CLOSE = 560, REST = 2800;
    const blend = (a, b, k) => a + ((b - a) * (1 - Math.cos(Math.PI * k))) / 2;
    function pose(t) {
      if (t <= 0) return 1;
      if (t >= END) return 0;
      let i = 1;
      while (KEYS[i][0] < t) i++;
      return blend(KEYS[i - 1][1], KEYS[i][1], (t - KEYS[i - 1][0]) / (KEYS[i][0] - KEYS[i - 1][0]));
    }
    // 상태: mode가 'play'면 시간표를, 'close'면 다시 보기 전에 날개를 접는 움직임(c0에서 접힘까지)을 따릅니다. tau는 그 움직임의 시각,
    // pressed는 한 번 접었다 펼쳐 회색 면이 생겼는지입니다.
    let mode = 'play', tau = live ? END + LAG : 0, c0 = 0, pressed = live, hot = -1;
    const curve = (x) => (mode === 'play' ? pose(x) : x <= 0 ? c0 : x >= CLOSE ? 1 : blend(c0, 1, x / CLOSE));
    function render() {
      if (!W) return;
      shape();
      items.forEach((it, r) => {
        const yc = rowY(r);
        [0, 1].forEach((s) => {
          const dir = s ? 1 : -1, hx = s ? hr : hl, v = it.v[s], o = it.v[1 - s], len = sc(v || 0);
          it.bar[s].setAttribute('d', v == null ? '' : slab(hx, dir, 0, len, yc));
          // 회색 면: 적은 쪽 막대 끝에서 2px 띄우고 많은 쪽의 길이까지
          const r0 = len > 0.5 ? len + 2 : 0, r1 = sc(o || 0);
          const tail = pressed && v != null && o != null && o > v && r1 - r0 >= 2;
          it.tail[s].setAttribute('d', tail ? slab(hx, dir, r0, r1, yc) : '');
          // 값: 제 막대 끝에서 6px 밖(회색 면이 16px보다 짧으면 그 바깥)에 두고, 날개를 따라 움직입니다. 그 자리의 날개가 접힐수록 옅어집니다.
          const off = tail && r1 - len < 16 ? r1 - len + 6 : 6, P = proj(hx, dir, len + off, yc), lab = it.lab[s];
          lab.setAttribute('x', fx(P[0]));
          lab.setAttribute('y', fx(P[1] + 5));
          lab.style.opacity = Math.max(0, Math.min(1, (Math.cos(angleAt(len + off)) - 0.3) / 0.45)).toFixed(3);
        });
      });
      gkey.classList.toggle('is-off', !(pressed && anyGap));
      band.style.display = hot < 0 ? 'none' : '';
      if (hot >= 0) band.setAttribute('y', fx(rowY(hot) - pitch / 2 + 1));
    }

    // 재생: 화면에 보이고(inView) 마우스 · 포커스로 잠시 멈추지 않았을 때(holds)만 나아갑니다. 카드가 페이지에서 빠지면 멈춥니다.
    const loop = !!card.closest('[data-vzb-loop]');
    const holds = new Set();
    let idle = 0, playing = false, seen = false, inView = false, raf = 0, last = 0;
    const busy = () => playing && !holds.size;
    const fold = () => { c0 = curve(tau); mode = 'close'; tau = 0; };   // 지금 자리에서 접기 시작합니다
    function advance(dt) {
      if (idle > 0) { idle = Math.max(0, idle - dt); if (!idle) fold(); return; }   // 갤러리: 쉬고 난 뒤 날개를 접고, 처음부터 다시 펼칩니다
      tau += dt;
      if (mode === 'close') { if (tau >= CLOSE + LAG) { mode = 'play'; tau = 0; pressed = false; } return; }
      pressed = tau >= T_FOLDED + LAG / 2;   // 날개가 다 접혔을 때 회색 면이 생깁니다
      if (tau >= END + LAG) { tau = END + LAG; if (loop) idle = REST; else playing = false; }
    }
    function tick(stamp) {
      raf = 0;
      if (!card.isConnected || !inView) { last = 0; return; }
      const dt = last ? Math.min(64, stamp - last) : 16;
      last = stamp;
      if (busy()) advance(dt);
      render();
      if (busy()) raf = requestAnimationFrame(tick); else last = 0;
    }
    function kick() { if (!raf && inView && card.isConnected && busy()) raf = requestAnimationFrame(tick); }
    // 다시 보기: 날개가 펼쳐져 있으면 그 자리에서 접은 뒤 처음부터 펼칩니다(접힌 날개로 건너뛰지 않습니다).
    function play() {
      idle = 0;
      playing = true;
      last = 0;
      if (mode === 'play' && tau > 0) fold();
      render();
      kick();
    }
    btn.addEventListener('click', play);
    plot.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') holds.add('hover'); });
    plot.addEventListener('pointerleave', () => { holds.delete('hover'); kick(); });
    plot.addEventListener('focus', () => { if (plot.matches(':focus-visible')) holds.add('focus'); });   // 키보드로 들어왔을 때만 멈춥니다
    plot.addEventListener('blur', () => { holds.delete('focus'); kick(); });
    // 짚는 자리: 항목(줄). 마우스는 그 줄을 짚고, 키보드는 위아래 화살표로 옮깁니다.
    // 짚으면 그 줄에 옅은 띠를 깔고 이름과 두 값을 굵게, 그 줄의 회색 면을 한 단계 진하게 둡니다(값은 숨기지 않습니다). 툴팁은 두 값을 되풀이하지 않고,
    // 어느 쪽이 얼마나 많은지(차이와 배수)와 두 값이 각 그룹 합계에서 차지하는 비중을 적습니다.
    // 툴팁은 날개 바깥에 자리가 있으면 그 줄 옆에 두어 다른 줄의 값과 합계를 덮지 않고, 자리가 없으면 그 줄 위, 많은 쪽 날개 쪽에 둡니다.
    interact(plot, N,
      (x0, y0) => { const r = plot.getBoundingClientRect(); return Math.max(0, Math.min(N - 1, Math.floor(((y0 - r.top) * N) / (r.height || 1)))); },
      (k) => {
        const it = items[k], r = plot.getBoundingClientRect(), k2 = r.width / (W || 1);
        hot = k;
        svg.classList.add('is-hover');
        items.forEach((x, q) => [x.nm, ...x.lab, ...x.tail].forEach((n2) => n2.classList.toggle('is-on', q === k)));
        render();
        const note = [];
        if (it.lead != null && it.lead >= 0 && it.v[1 - it.lead] > 0) note.push(tx(d, '%1의 %2배', groups[1 - it.lead], num(it.v[it.lead] / it.v[1 - it.lead], 1)));
        if (it.lead != null && tot[0] > 0 && tot[1] > 0) note.push(tx(d, '%1 합계의 %2 · %3 합계의 %4', groups[0], pct1(it.v[0] / tot[0]), groups[1], pct1(it.v[1] / tot[1])));
        const tb = tipBody({ value: gapText(it), big: true, note }, it.name);
        const s = it.lead === 1 ? 1 : 0, m = Math.max(sc(it.v[0] || 0), sc(it.v[1] || 0));
        const x = it.lead == null || it.lead < 0 ? cx : (s ? hr : hl) + (s ? 1 : -1) * Math.max(24, m / 2);
        // 날개 바깥(값이 끝나는 곳 밖)에 툴팁이 들어갈 자리(250px)가 있으면 그 줄 옆에 둡니다. 많은 쪽을 먼저 쓰고, 없으면 반대쪽을 씁니다.
        const edge = [0, 1].map((z) => Math.max(...items.map((x) => Math.max(sc(x.v[0] || 0), sc(x.v[1] || 0)) + 6 + x.lw[z] + 4)));
        const outL = r.left + (hl - edge[0]) * k2, outR = r.left + (hr + edge[1]) * k2;
        const roomL = outL >= 250, roomR = window.innerWidth - outR >= 250, right = s ? roomR || !roomL : !roomL && roomR;
        if (roomL || roomR) return { x: right ? outR : outL, y: r.top + rowY(k) * k2, side: right ? 'right' : 'left', label: it.name, value: tb.node, text: tb.text };
        return { x: r.left + x * k2, y: r.top + (rowY(k) - pitch / 2 + 2) * k2, label: it.name, value: tb.node, text: tb.text };
      },
      () => { hot = -1; svg.classList.remove('is-hover'); items.forEach((x) => [x.nm, ...x.lab, ...x.tail].forEach((n2) => n2.classList.remove('is-on'))); render(); },
      true);

    onSize(plot, layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); if (W) layout(W, H); });
    // 화면에 처음 보일 때 움직입니다. 화면 밖에 있는 동안은 멈춰 둡니다.
    const start = () => { if (!seen) { seen = true; if (!live) play(); } };
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
