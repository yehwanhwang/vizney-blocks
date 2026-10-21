  /* 툴팁과 조작: 마우스는 올리면 보이고 벗어나면 숨깁니다. 터치는 탭하면 보이고 다른 곳을 탭하면 닫힙니다.
     키보드는 그래프에 포커스한 뒤 화살표로 옮깁니다(가로 그래프는 좌우, 목록은 위아래). */
  let tip;
  // value는 글자나 요소입니다. side가 참이면 점 위가 아니라 세로선 옆, 그래프 윗선에 맞춰 둡니다(선 · 막대 차트).
  function showTip(x, y, label, value, side) {
    if (!tip) {
      tip = el('div', 'vzb-tip');
      tip.setAttribute('aria-hidden', 'true');
      document.body.append(tip);
    }
    tip.replaceChildren(el('span', 'vzb-tip-label', label), typeof value === 'string' ? el('span', 'vzb-tip-value', value) : value);
    tip.classList.add('is-on');
    const w = tip.offsetWidth, h = tip.offsetHeight, W = window.innerWidth, H = window.innerHeight;
    if (side) {
      // side가 'left'이면 기준선 왼쪽을 먼저, 그 밖에는 오른쪽을 먼저 씁니다. 자리가 모자라면 반대쪽으로 넘깁니다.
      const right = x + 14 + w <= W - 8, left = x - w - 14 >= 8;
      tip.style.left = `${(side === 'left' ? left || !right : !right) ? Math.max(8, x - w - 14) : x + 14}px`;
      tip.style.top = `${Math.min(Math.max(8, y), H - h - 8)}px`;
      return;
    }
    tip.style.left = `${Math.min(Math.max(8, x - w / 2), W - w - 8)}px`;
    tip.style.top = `${y - h - 12 < 8 ? y + 16 : y - h - 12}px`;
  }
  function hideTip() { if (tip) tip.classList.remove('is-on'); }
  // 툴팁 내용: { value, note } 또는 { rows: [{ tone, value, name }], note }. 값이 먼저, 이름은 뒤에 옅게 적습니다.
  function tipBody(spec, label) {
    const body = el('span', 'vzb-tip-body');
    let text = label;
    if (spec.rows) {
      const grid = el('span', 'vzb-tip-rows');
      spec.rows.forEach((r) => {
        const row = el('span', 'vzb-tip-row');
        row.append(el('i', `vzb-tip-key vzb-${r.tone}`), el('b', null, r.value), el('span', null, r.name));
        grid.append(row);
        text += `, ${r.name} ${r.value}`;
      });
      body.append(grid);
    } else {
      body.append(el('span', 'vzb-tip-value', spec.value));
      text += ` ${spec.value}`;
    }
    // note는 한 줄 글 또는 줄마다 나눈 배열입니다.
    (Array.isArray(spec.note) ? spec.note : [spec.note]).filter(Boolean).forEach((line) => {
      body.append(el('span', 'vzb-tip-note', line));
      text += `, ${line}`;
    });
    return { node: body, text };
  }
  // 범례: [{ name, tone, box(면), dot(점), dim(옅게), tick(세로 눈금) }]. 선은 짧은 선, 막대와 면은 네모, 점은 동그라미로 표시합니다.
  function legendEl(items) {
    const ul = el('ul', 'vzb-legend');
    items.forEach((it) => {
      const li = el('li');
      li.append(el('i', `vzb-key vzb-${it.tone}${it.box ? ' is-box' : ''}${it.dot ? ' is-dot' : ''}${it.dim ? ' is-dim' : ''}${it.tick ? ' is-tick' : ''}`), it.name);
      ul.append(li);
    });
    return ul;
  }
  // 글자 폭(12px 기준, size를 주면 그 크기)과 SVG 글자
  let meter;
  function textW(s, weight, family, size) {
    meter = meter || document.createElement('canvas').getContext('2d');
    meter.font = `${weight} ${size || 12}px ${family}`;
    return meter.measureText(s).width;
  }
  function svgText(x, y, s, cls, anchor) {
    const t = svgEl('text', { x, y, class: cls, 'text-anchor': anchor || 'start' });
    t.textContent = s;
    return t;
  }
  // 차이를 부호와 함께 적습니다. 비율 지표는 %p입니다.
  function signed(f, diff) {
    const s = diff > 0 ? '+' : diff < 0 ? '−' : '';
    return f.rel ? `${s}${show(f, Math.abs(diff))}` : `${s}${num(Math.abs(diff), 1)}%p`;
  }
  // pick(clientX, clientY) → 순번, point(순번) → { x, y, label, value, text, side }(화면 좌표), clear() → 강조 해제
  // n은 개수나 개수를 돌려주는 함수입니다. vertical이면 위아래 화살표로 옮깁니다. 돌려주는 { show(순번), at() }로 키를 더 붙입니다.
  // 아무것도 고르지 않은 채 화살표를 누르면 기간 차트는 마지막(최근)부터, vertical이나 first면 첫 순번부터 짚습니다.
  function interact(plot, n, pick, point, clear, vertical, first) {
    let idx = -1, touched = false;
    const count = () => (typeof n === 'function' ? n() : n);
    const live = el('span', 'vzb-sr');
    live.setAttribute('aria-live', 'polite');
    plot.after(live);
    const go = (i) => {
      if (i < 0 || i >= count()) return;
      idx = i;
      const p = point(i);
      showTip(p.x, p.y, p.label, p.value, p.side);
      live.textContent = p.text || `${p.label} ${p.value}`;
    };
    const end = () => {
      if (idx < 0) return;
      idx = -1;
      clear();
      hideTip();
    };
    const [back, next] = vertical ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight'];
    // pick이 -1이면(조각 밖) 강조를 풉니다.
    const at = (e) => { const i = pick(e.clientX, e.clientY); if (i < 0) end(); else go(i); };
    plot.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch' || touched) at(e); });
    plot.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') { touched = true; at(e); } });
    plot.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') end(); });
    document.addEventListener('pointerdown', (e) => { if (touched && !plot.contains(e.target)) { touched = false; end(); } }, true);
    plot.addEventListener('keydown', (e) => {
      if (e.key !== back && e.key !== next) return;
      e.preventDefault();
      const last = count() - 1;
      go(idx < 0 ? (vertical || first ? 0 : last) : Math.max(0, Math.min(last, idx + (e.key === next ? 1 : -1))));
    });
    plot.addEventListener('blur', end);
    window.addEventListener('scroll', end, { passive: true });
    return { show: go, at: () => idx, end };
  }
