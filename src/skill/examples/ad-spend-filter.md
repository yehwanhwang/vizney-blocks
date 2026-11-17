# 예시 · 채널을 고르면 다시 그려지는 광고비 화면

Filter Chips로 채널을 고르면 Bar Overflow가 다시 그려지고, Download Button이 고른 결과를 그대로 내려받는 예시다. 스킬의 미리보기(`preview/index.html`)는 같은 화면의 영어판이며, 같은 방식의 스크립트로 잇는다.

## 요청

마케팅팀 월간 화면. 최근 13개월의 월별 광고비를 월 예산과 견주어 보고, 채널을 골라서 볼 수 있어야 한다. 보고 있는 숫자를 엑셀로 받을 수 있으면 좋겠다. 채널은 SNS · 검색 · 디스플레이 · 동영상 · 제휴 · 리타게팅 여섯 개이고, 채널마다 월 예산이 따로 있다.

## 1–2단계 · 고른 카드와 확인

| 화면에 둘 것 | 카드(id) | 확인한 것 |
|---|---|---|
| 월별 광고비가 예산을 넘었는가 | Bar Overflow (`bar-overflow`) | 예산은 넘으면 안 되는 한도다. 모든 달에 같은 값이라 한도선 하나로 그릴 수 있다 |
| 채널 고르기 | Filter Chips (`filter-chips`) | 채널이 여섯 개라 한눈에 들어온다 |
| 지금 보이는 값 내려받기 | Download Button (`download-button`) | 고른 채널의 값을 받아야 하므로 서버 원본이 아니라 화면의 카드에서 받는다 |

가정: 금액은 원 단위 원래 값(`"format": "krw"`) · 채널을 고르면 한도도 고른 채널의 예산 합으로 바꾼다(전체 예산과 견주면 일부 채널만 볼 때 늘 남는 것처럼 보이기 때문이다).

카드에 없는 것: 채널별 비중이나 전환율은 요청에 없어 넣지 않았다. 필요하면 Waffle Flip(두 기간의 비중 변화)을 검토하고, 맞는 카드가 없는 차트는 직접 만든다.

## 4단계 · JSON 핵심

Filter Chips. 처음부터 모든 채널을 고른 상태로 두어, 처음 화면의 차트(전체 합)와 같은 조건이 되게 한다.

```json
{ "label": "채널", "name": "channel", "all": "전체",
  "options": ["SNS", "검색", "디스플레이", "동영상", "제휴", "리타게팅"],
  "value": ["SNS", "검색", "디스플레이", "동영상", "제휴", "리타게팅"] }
```

Bar Overflow. 13개월의 전체 합과 전체 예산으로 시작한다.

```json
{ "title": "월별 광고비", "subtitle": "모든 채널, 월 예산 4,000만 원 대비", "format": "krw",
  "limit": 40000000, "limitLabel": "예산",
  "labels": ["25.11", "25.12", "26.01", "26.02", "26.03", "26.04", "26.05", "26.06", "26.07", "26.08", "26.09", "26.10", "26.11"],
  "values": [34200000, 46100000, 31500000, 33000000, 43400000, 36200000, 35800000, 38400000, 32900000, 48700000, 37100000, 39200000, 45300000] }
```

Download Button. 필터 줄의 오른쪽 끝에 두므로 `align`을 `end`로 적어 왼쪽으로 펼친다.

```json
{ "label": "월별 광고비 내려받기", "name": "export", "target": "bar-overflow",
  "filename": "monthly-ad-spend", "formats": ["csv", "png"], "align": "end" }
```

## 5–6단계 · 붙이기와 잇기

컨트롤은 제목을 그리지 않으므로 필터 줄에서 페이지가 '채널'이라고 적는다. Bar Overflow는 스크립트가 찾을 수 있게 `id="spend"`인 요소로 감싼다.

```html
<script>
// 페이지가 들고 있는 전체 데이터: 기간 이름, 채널마다의 월별 광고비와 월 예산
const LABELS = ['25.11', '25.12', /* … */ '26.11'];
const SPEND = { SNS: [8600000, 16200000, /* … */ 16400000], 검색: [9500000, 10300000, /* … */ 10700000] /* … */ };
const BUDGET = { SNS: 12000000, 검색: 11200000, 디스플레이: 5600000, 동영상: 4800000, 제휴: 3600000, 리타게팅: 2800000 };
document.addEventListener('vzb-change', (e) => {
  if (e.detail.name !== 'channel') return;
  const picked = e.detail.value;   // 고른 채널들
  const src = document.querySelector('#spend .vzb-card script[type="application/json"]');
  const d = JSON.parse(src.textContent);
  d.labels = picked.length ? LABELS : [];   // 고른 것이 없으면 빈 배열: 카드가 빈 화면을 그린다
  d.values = d.labels.map((_, t) => picked.reduce((sum, c) => sum + SPEND[c][t], 0));
  d.limit = picked.reduce((sum, c) => sum + BUDGET[c], 0);
  d.subtitle = !picked.length ? '고른 채널 없음'
    : (picked.length === 6 ? '모든 채널' : picked.join(' · ')) + ', 월 예산 ' + (d.limit / 10000).toLocaleString('ko-KR') + '만 원 대비';
  src.textContent = JSON.stringify(d);   // 글자가 바뀌면 카드가 다시 그린다
});
</script>
```

기간 이름을 `LABELS`로 따로 들고 있는 까닭: 채널을 모두 풀면 `labels`를 빈 배열로 바꾸는데, 카드의 JSON에서 다시 읽으면 그 뒤로는 기간을 되살릴 수 없다.

## 확인 결과

- 채널을 하나 풀면(디스플레이) 막대와 한도선이 함께 바뀌고(예산 4,000만 → 3,440만), 넘친 달 수와 넘친 양이 다시 계산된다(13개 중 4개 예산 초과 · +2,130만). 다시 그릴 때는 막대가 처음부터 차오르지 않고 마지막 장면이 바로 나온다.
- 채널을 모두 풀면 '표시할 항목이 없습니다.'가 나오고, 다시 고르면 돌아온다.
- 내려받은 CSV는 13행이고, 고른 채널의 합이 `label` · `value` · `limit` 열로 들어 있다.
- 폭 390px에서는 칩이 옆으로 미는 한 줄이 되고, 내려받기 형식은 아이콘 왼쪽으로 펼쳐진다. 콘솔 오류는 없다.
