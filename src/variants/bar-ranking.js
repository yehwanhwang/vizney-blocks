  // Bar - Ranking: 이름을 막대 안에 얹고 값은 오른쪽에 적은 순위 목록입니다. 큰 순서로 다섯 줄을 보여주고
  // 나머지는 '기타 n개' 한 줄(막대 없이 합계만)로 묶습니다. 순서가 정해진 항목은 "sort": false로 적은 순서를 지킵니다.
  mount('bar-ranking', (card, d, f) => {
    basicList(card, d, f, { items: d.items || [], columns: d.columns, max: d.max, sort: d.sort });
  });
