---
name: vizney-blocks
description: "Add charts read through their motion and dashboard controls to an HTML page with Vizney Blocks (blocks.vizney.com) cards. Use it to draw one of the charts (Bar Overflow · Waffle Flip · Bump Race · Waterfall Walk) or add one of the controls (Date Picker · Range Slider · Filter Chips · Download Button), or when the user mentions Vizney Blocks. Keep the card code, change only its JSON data, and connect controls to charts with a short page script. 한국어 요청이나 한국어 화면에도 쓴다(한국어판 SKILL.ko.md)."
---

# Building screens with Vizney Blocks cards

> 한국어로 일할 때(사용자가 한국어로 요청하거나 화면 문구가 한국어일 때)는 같은 폴더의 `SKILL.ko.md`를 읽고 그것을 따른다. Working in Korean? Read `SKILL.ko.md` in this folder and follow it instead; it has the same steps and rules with the Korean card addresses.

Vizney Blocks is a set of copy-paste HTML cards: charts you read through their motion, and dashboard controls (v0.64, MIT License). One card is an HTML snippet that bundles `<style>`, a JSON data block and `<script>`, so there is no library to install. The card does the arithmetic (the amount over a limit, shares, ranks) and the colors, emphasis and motion, by the rules of the Vizney chart guide. So keep the card code and change only the JSON values. A card decides how to draw its chart correctly; what goes on the screen is up to whoever builds it.

## Cards

The cards are these 4 charts and 4 controls, and no others. When no card fits a request, do not bend one to it: build that part yourself and tell the user it is not a card.

### Charts

- Bar Overflow (`bar-overflow`) · Bar Chart — Bars for each period stand against one horizontal line, the same limit for every period, and only the parts above the line blink red. Use it for a trend with the same limit each period, such as a monthly budget or a monthly capacity. Do not use it for a target, where more is better.
- Waffle Flip (`waffle-flip`) · Waffle Chart — A card that draws shares as a 100-cell waffle and flips, one by one, the cells that changed hands since the earlier period. Use it to show how much one item's share grew or shrank, such as a market share or a sales mix. It draws the change between two periods only.
- Bump Race (`bump-race`) · Bump Chart — A card that ranks the items in every period, joins the ranks with S-curves, and plays through the periods one at a time so the moments the order changes are visible. Use it to show how products, channels or branches moved up and down over a year, above all how far one item climbed. Ranks hide the size of the differences, so when the gaps matter, use a line chart.
- Waterfall Walk (`waterfall-walk`) · Waterfall Chart — A card that joins what raised and what cut a value between a starting point and an end point, as one bar per item. On play, dots appear one by one from the level where the last bar ended and walk to the next item, the bar then rises or falls from that level, and the name and value attached to its end travel with it. Use it to tell, in order, what moved a value between two points: how the members at the start of the year became the members at the end through sign-ups and cancellations, which drivers turned last year's operating profit into this year's, or how much of revenue is left as operating profit and net income after costs. Do not use it for a trend over periods.

### Controls

- Date Picker (`date-picker`) — A control that picks a period (a start and an end date), or a single date, on a calendar. Use it to filter a screen by a date, such as the order date or a reference date. At rest it is one button with the current period and its number of days; press it and a month calendar rises below it.
- Range Slider (`range-slider`) — A control that picks a numeric range with two thumbs. Use it to filter a screen by a continuous value such as order value or quantity. Give it the distribution of the values and, while you drag, bars rise over the rail to show how much data falls in the range.
- Filter Chips (`filter-chips`) — A control that picks several items from a fixed list as chips. Use it to filter a screen by a few names, such as channels or regions. The All chip at the front shows how many are picked.
- Download Button (`download-button`) — A button that downloads the data of a chart card on the screen as a file. It starts as an icon alone; hover and the formats to pick from (CSV, JSON, PNG) come out. Use it to export exactly what the controls show.

Each card's rules and fields are in its line of https://blocks.vizney.com/llms.txt. Read that line before using a card.

## Steps

1. Write down what the screen shows and pick the cards whose use fits in "Cards" above. Card names describe the shape, not the metric, so put what the values are in the JSON `title`.
2. For each card, check the period, `format`, `better` and the values that card needs (the limit, the two periods, the item to follow). Gather only what the request and the data do not tell you and ask it in one go (not one by one). If no answer can come, assume the most likely value, write the assumption on one line and go on.
3. Download the card code. `https://blocks.vizney.com/cards/<card id>.txt` is the card code as published (card text in English). Use it as received; do not rewrite or shorten it. If you cannot download it, ask the user to paste the content of that address.

   ```bash
   curl -fsSL https://blocks.vizney.com/cards/bar-overflow.txt -o bar-overflow.html
   ```

4. Change only the JSON values between `<script type="application/json">` and `</script>` in the card. The example JSON in the card code is the reference for fields. Add a field the example lacks only when it is a common field in the rules below or is named in that card's line in llms.txt.
5. Paste the cards into one HTML document: the controls in a filter bar above the charts, the charts in a grid.

   ```html
   <!doctype html>
   <html lang="en">
   <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ad spend</title></head>
   <body style="margin:0; padding:24px; background:#f4f5f7;">
   <h1 style="margin:0; font:700 22px/1.4 var(--vzb-font); color:var(--vzb-ink);">Ad spend</h1>
   <p style="margin:2px 0 16px; font:400 13px/1.5 var(--vzb-font); color:var(--vzb-muted);">As of November 2026 · Data source</p>
   <!-- Filter bar: a control draws no title, so the page names it. Give each control a slot with a width. -->
   <div style="display:grid; grid-template-columns:minmax(0, 1fr) auto; align-items:end; gap:16px 24px; margin-bottom:16px; padding:16px 20px; border-radius:16px; background:#ffffff;">
   <div><div style="margin-bottom:8px; font:500 12px/16px var(--vzb-font); color:var(--vzb-muted);">Channel</div><!-- the Filter Chips card code --></div>
   <div><!-- the Download Button card code, with "align": "end" --></div>
   </div>
   <!-- Charts: paste the chart card code, one card per grid cell. Wrap a card the script must find in an element with an id. -->
   <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap:16px;">
   <div id="spend"><!-- the Bar Overflow card code --></div>
   </div>
   </body>
   </html>
   ```

6. If the screen has controls, write the page script as in "Connecting controls and charts" below.
7. Open it in a browser and go through the "Checklist" below. When you hand over the file, repeat the assumptions.

## Rules

- Paste the card code you downloaded as it is and change only the JSON values. Do not edit the styles or the script. To use the same card several times, paste the whole card code again and change each JSON.
- A card fills the width of its slot. A chart card is 1, 1.5 or 2 units tall (1 unit = 168px, --vzb-unit), and every chart card is now 2 units (336px). The controls (Date Picker · Range Slider · Filter Chips · Download Button) draw only the control, with no card head or frame, at the height of the control itself. Their background is left empty, so set "theme" to match where they sit ("dark" on a dark background).
- For several cards, give the wrapper a grid: display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap:16px. Keep a chart card at least 340px wide. A chart that reads along a long axis (13 months of bars, the 20 cells across a waffle, rank lines) reads better with two columns or the full width. Put the controls as they are in a filter bar above the charts or in the page header.
- Change colors and the font with the --vzb-* variables on :root (--vzb-primary, --vzb-font, …). The variable list and what each one does are in https://blocks.vizney.com/tokens.css (the same content as the :where(:root) block in the card code). The background is picked per card with "theme" in its JSON: empty is white with blue as the first data color, "dark" is Vizney black with yellow as the first data color.
- Common fields: title (what the values are), subtitle (the period and the basis), format (usd dollar amounts, shortened to $745.6K · $1.2M · count a count, with its unit in unit · pct a percentage (3.4 is 3.4%), changes in pp · days a number of days · eok and krw are Korean won notations), decimals (decimal places; empty lets the card decide), better (up · down · neutral), labels (period names, the same length as the values; null for a period without a value), lang (en: the words the card prints itself in English), theme. Controls: label (the name screen readers read; not drawn on screen) and name (detail.name of the control's events). Each card's own fields are in the example JSON of its code and in that card's line in llms.txt.
- The amount over a limit, shares, ranks, changes and totals are computed by the card, so do not write them in the JSON. Give amounts as raw values, not rounded or divided into thousands or millions.
- A chart card plays once when it comes into view and stops on its last frame. The still frame reads correctly by itself. The motion carries the data, so cards play whatever the reduced-motion setting of the system; mouse-over and keyboard focus pause them, and a replay button or player sits on the card. A wrapper with data-vzb-loop makes the card repeat; a card that keeps moving makes its neighbours hard to read, so use that only on a showcase such as a gallery.
- A card is a snippet pasted into the HTML document as it is. Inserted with innerHTML or React's dangerouslySetInnerHTML, the card's <script> does not run.
- A metric where lower is better gets `"better": "down"`. Waffle Flip then shows a decrease as the green badge, and Bump Race ranks the smallest value first.
- A monthly trend gets 13 months when the data has them. The first and last are the same month, so the year-over-year comparison is visible.
- Keep period names short, like `Sep '25` or `3Q26`. Long ones clip or run together under the bars and under the scrubber.
- Keep item names (channels, products) in one language across the screen. Translate all of them or keep all of them as they are.

## Connecting controls and charts

Controls and charts do not know each other. A short page script takes a control's event and rewrites the chart card's JSON.

- A control sends a `vzb-change` event from its card whenever its value changes (it bubbles, so listen on `document`). `detail` is `{ name, value }`, where `name` is the `name` in that control's JSON. Date Picker's `value` is `["start", "end"]` as date strings (YYYY-MM-DD, the end date included); Range Slider's `value` is `[from, to]` as numbers; Filter Chips' `value` is the picked items in the order of `options`. The current value is also on the card, as JSON in its `data-vzb-value` attribute.
- A control sends nothing when it first draws. Write the control's `value` and the chart's JSON for the same starting condition.
- A chart card redraws by itself when the text of its `<script type="application/json">` changes. The page keeps the full data; on an event it filters the data, builds the chart's JSON from the result and writes it back. The redrawn card does not play from the start: it draws its last frame at once and keeps the period and the item the viewer picked.
- When the filter leaves nothing, give an empty array. Bar Overflow draws an empty state for `"labels": []`, and Waffle Flip, Bump Race and Waterfall Walk for `"items": []`, instead of an error.
- With two cards of the same kind on a page, wrap each in an element with an id and address it through that id (`#spend` in the example).
- Download Button downloads the current JSON of the first card on the page whose `data-vzb` is its `target`, so the file holds what the controls left on screen. Before that it sends a `vzb-download` event (`detail: { name, target, format, filename, rows }`); if the page calls `preventDefault()`, the card makes no file, so a screen that gets the source data from a server can use the same button.

```html
<div><!-- the Filter Chips card code, with "name": "channel" --></div>
<div id="spend"><!-- the Bar Overflow card code --></div>
<script>
// The full data the page holds: the period names and the monthly values of each channel.
const LABELS = ["Nov '25", "Dec '25", "Jan '26"];
const SPEND = { Social: [8600, 16200, 9700], Search: [9500, 10300, 10100] };
document.addEventListener('vzb-change', (e) => {
  if (e.detail.name !== 'channel') return;
  const picked = e.detail.value;   // the channels picked
  const src = document.querySelector('#spend .vzb-card script[type="application/json"]');
  const d = JSON.parse(src.textContent);
  d.labels = picked.length ? LABELS : [];   // nothing picked: an empty array, and the card draws its empty state
  d.values = d.labels.map((_, t) => picked.reduce((sum, c) => sum + SPEND[c][t], 0));
  src.textContent = JSON.stringify(d);   // the card redraws when this text changes
});
</script>
```

## Checklist

Go through it before handing over the file. If anything is off, fix it and check again.

### Card code

- [ ] The card code is as downloaded; only the JSON values changed.
- [ ] Fields are only those in the example JSON, the common fields in the rules, or that card's line in llms.txt.
- [ ] No amount over a limit, share, rank, change or total in the JSON, and amounts are raw values, not rounded or divided.
- [ ] No card was inserted with innerHTML or dangerouslySetInnerHTML.

### Data

- [ ] `labels` and `values` have the same length, and a period without a value has `null`.
- [ ] Lower-is-better metrics have `"better": "down"`.
- [ ] The `limit` of Bar Overflow is a limit not to cross. It is not used for a target, where more is better.
- [ ] Period names are short, and item names are in one language across the screen.

### Controls

- [ ] Every control has a `label` (the name screen readers read) and a `name` (the event name).
- [ ] Each control's `theme` matches the background it sits on.
- [ ] The first `value` of each control and the first JSON of the chart are for the same condition.
- [ ] Changing a value redraws the chart, and clearing everything and picking again brings it back.
- [ ] The `target` of Download Button is the `data-vzb` of the card to download.

### Screen

- [ ] No errors in the browser console, and no error message (`.vzb-error`) inside a card.
- [ ] Screenshots at 1280px and 390px show no clipped or overlapping text.
- [ ] Chart cards play once and stop. None is left repeating.
- [ ] The assumptions were shared with the user.

## Examples

A worked example that follows one request through the cards picked, the key JSON, the connecting script and the checks. It is written in Korean, but the judgments apply as they are.

- [예시 · 채널을 고르면 다시 그려지는 광고비 화면](examples/ad-spend-filter.md)

Gallery: https://blocks.vizney.com/ (Korean https://blocks.vizney.com/ko/) · Source: https://github.com/yehwanhwang/vizney-blocks
