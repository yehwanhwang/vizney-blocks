  // KPI - Bar: 최근 기간의 규모를 0에서 시작하는 세로 막대로 둡니다. 지난 기간은 옅게, 마지막 기간만 진하게 그리고,
  // 진행 중(partial)이면 점선 윤곽으로 그려 다 끝난 기간과 길이를 그대로 비교하지 않게 합니다. 집계 기간은 부제(subtitle)에 적습니다.
  mount('kpi-bar', (card, d, f) => {
    const b = d.bars, vals = b.values, labels = b.labels, last = vals.length - 1;
    const partial = !!b.partial;
    const now = partial ? `${labels[last]}${typeof b.partial === 'string' ? ` ${b.partial}` : ''} 진행 중` : '';
    head(card, d, f, d.value != null ? d.value : vals[last], d.compare);
    const foot = el('div', 'vzb-foot vzb-fill');
    const plot = el('div', 'vzb-plot');
    plot.tabIndex = 0;
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', `${d.title || ''}: ${labels.map((l, i) => `${l} ${show(f, vals[i])}`).join(', ')}${partial ? ` (${now})` : ''}. 좌우 화살표로 기간을 옮깁니다.`);
    const svg = svgEl('svg', { class: 'vzb-br-svg', 'aria-hidden': 'true' });
    plot.append(svg);
    foot.append(plot);
    card.append(foot);

    const LAB = 24, max = Math.max(0, ...vals) || 1;
    const step = Math.max(1, Math.ceil(vals.length / 5));   // 기간 이름은 다섯 개 안팎, 마지막은 항상
    let slot = 0, bars = [], PH = 0;
    const top = (v) => PH - (Math.max(0, v) / max) * (PH - 6);
    onSize(plot, (w, h) => {
      PH = h - LAB;
      slot = w / vals.length;
      const bw = Math.min(14, slot * 0.5);
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.replaceChildren();
      for (let k = 0; k < 3; k++) {
        const y = 0.5 + Math.round(((PH - 1) * k) / 2);
        svg.append(svgEl('line', { x1: 0, x2: w, y1: y, y2: y, class: 'vzb-grid' }));
      }
      bars = vals.map((v, i) => {
        const cls = i < last ? 'vzb-br-bar' : partial ? 'vzb-br-bar is-now' : 'vzb-br-bar is-last';
        const bar = svgEl('path', { d: column(i * slot + (slot - bw) / 2, top(v), bw, PH - top(v), 4), class: cls });
        svg.append(bar);
        if ((last - i) % step === 0) {
          const t = svgEl('text', { x: +(i * slot + slot / 2).toFixed(2), y: PH + 18, 'text-anchor': 'middle', class: i === last ? 'vzb-axis is-last' : 'vzb-axis' });
          t.textContent = labels[i];
          svg.append(t);
        }
        return bar;
      });
    });
    interact(plot, vals.length,
      (cx) => Math.max(0, Math.min(last, Math.floor((cx - plot.getBoundingClientRect().left) / slot))),
      (i) => {
        bars.forEach((p, j) => p.classList.toggle('is-hover', j === i));
        const r = plot.getBoundingClientRect();
        return { x: r.left + i * slot + slot / 2, y: r.top + top(vals[i]), label: i === last && partial ? now : labels[i], value: show(f, vals[i]) };
      },
      () => bars.forEach((p) => p.classList.remove('is-hover')));
  });

  // 위쪽 끝만 둥근 세로 막대. 바닥은 기준선에 붙어 각집니다.
  function column(x, y, w, h, r) {
    const q = (v) => +v.toFixed(2);
    r = Math.max(0, Math.min(r, w / 2, h));
    return `M${q(x)},${q(y + h)}V${q(y + r)}A${q(r)},${q(r)} 0 0 1 ${q(x + r)},${q(y)}H${q(x + w - r)}A${q(r)},${q(r)} 0 0 1 ${q(x + w)},${q(y + r)}V${q(y + h)}Z`;
  }
