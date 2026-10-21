  // Bump - Focus: 한 항목("focus")만 주황 굵은 선으로 강조하고 점 안에 그 기간의 순위를 적습니다. 나머지 항목은 회색으로 두어
  // 한 항목이 다른 항목들 사이에서 어떻게 오르내렸는지를 먼저 읽게 합니다. focus를 적지 않으면 순위가 가장 많이 오른 항목을 고릅니다.
  mount('bump-focus', (card, d, f) => {
    let pick = d.focus;
    bumpCard(card, d, f, {
      toneOf: (it, all) => {
        if (pick == null) {
          const gain = (x) => { const a = x.ranks.findIndex(Boolean); let b = x.ranks.length - 1; while (b >= 0 && !x.ranks[b]) b -= 1; return a < 0 || b < 0 ? -Infinity : x.ranks[a] - x.ranks[b]; };
          pick = all.slice().sort((x, y) => gain(y) - gain(x))[0].name;
        }
        return it.name === pick ? 't1' : 'tx';
      },
      focus: (it) => it.name === pick,
    });
  });
