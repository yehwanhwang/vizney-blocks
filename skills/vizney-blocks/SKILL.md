---
name: vizney-blocks
description: "Build dashboard screens with Vizney Blocks (blocks.vizney.com) HTML dashboard cards. Use it when making or editing a single-file HTML dashboard, KPI cards, or a report screen with charts or tables, or when the user mentions Vizney Blocks. For each question the screen answers, pick a card from the purpose index, keep the card code and change only its JSON data. 한국어 요청이나 한국어 화면에도 쓴다(한국어판 SKILL.ko.md)."
---

# Building dashboards with Vizney Blocks

> 한국어로 일할 때(사용자가 한국어로 요청하거나 화면 문구가 한국어일 때)는 같은 폴더의 `SKILL.ko.md`를 읽고 그것을 따른다. Working in Korean? Read `SKILL.ko.md` in this folder and follow it instead; it has the same steps and rules with Korean card code.

Vizney Blocks is a set of copy-paste HTML dashboard cards (v0.45, MIT License). One card is an HTML snippet that bundles `<style>`, a JSON data block and `<script>`, so there is no library to install. Changes, shares, attainment, totals, colors and emphasis are computed and drawn by the card, following the Vizney chart guide.

## Steps

1. Write down the questions the screen answers. One card answers one question.
2. For each metric, check the period, `format` and `better`. Gather only what the request and the data do not tell you and ask it in one go (not one by one). If no answer can come, assume the most likely value, write the assumption on one line and go on. A wrong guess of `better` flips the change colors, so when the metric name does not settle it, always put it in the assumptions.
3. For each question, pick a card in "Pick by purpose" below. Use the base card first, and another card only when its condition fits exactly. When unsure, use the base card. Card names describe the shape, not the metric, so put the metric name in the JSON `title`.
4. Before writing any card code, make the "Design table" below and show it to the user with the assumptions. If the user asks for changes, make them and go on; if you cannot wait for an answer, go on as it is.
5. Download the card code. `https://blocks.vizney.com/cards/<card id>.txt` is the card code as published (card text in English). Use it as received; do not rewrite or shorten it. If you cannot download it, ask the user to paste the content of that address.

   ```bash
   curl -fsSL https://blocks.vizney.com/cards/kpi-line.txt -o kpi-line.html
   ```

6. Change only the JSON values between `<script type="application/json">` and `</script>` in the card. The example JSON in the card code is the reference for fields. Add a field the example lacks only when it is a common field in the rules below or is named in that card's line in https://blocks.vizney.com/llms.txt (for example `sort`, `max`, `focus`). That line also carries the rules the card draws by.
7. Give each row of the design table its own grid element, paste the cards in row order, and make one HTML document. A row of KPI cards alone has a 280px minimum; other rows 340px.

   ```html
   <!doctype html>
   <html lang="en">
   <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sales overview</title></head>
   <body style="margin:0; padding:24px; background:#f4f5f7;">
   <h1 style="margin:0; font:700 22px/1.4 var(--vzb-font); color:var(--vzb-ink);">Sales overview</h1>
   <p style="margin:2px 0 16px; font:400 13px/1.5 var(--vzb-font); color:var(--vzb-muted);">FY2024 · Data source</p>
   <!-- Design table row 1: KPI cards -->
   <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap:16px;">
   <!-- paste the card code here, one after another -->
   </div>
   <!-- Design table row 2 -->
   <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap:16px; margin-top:16px;">
   <!-- paste the card code here, one after another -->
   </div>
   </body>
   </html>
   ```

8. Open it in a browser and go through the "Checklist" below. When you hand over the file, repeat the assumptions.

## Pick by purpose

For each question the screen answers, use the base card first and another card only when its condition fits exactly. When unsure, use the base card. A card not listed here is for cases these conditions do not cover.

### Status · What is the number now?

- Base: KPI - Number (`kpi-number`) — Just the number and its baseline
- KPI - Line (`kpi-line`) — With the last 13 months as a trend
- KPI - Bar (`kpi-bar`) — To compare the month in progress with past months
- KPI - Stacked Bar (`kpi-stacked-bar`) — A total and its breakdown on one card
- Line - Tabs (`line-tabs`) — 2–3 metrics with different units on one card

### Trend · How has it changed?

- Base: Line - Basic (`line-basic`) — The course of one metric
- Bar - Basic (`bar-basic`) — Size per period rather than the course
- Line - Compare (`line-compare`) — Against the same month last year
- Line - Multiple (`line-multiple`) — The course of 2–3 items together
- Bump - Basic (`bump-basic`) — How rankings changed rather than values

### Target · How far to the target?

- Base: KPI - Gauge (`kpi-gauge`) — One metric against its target or limit
- Grid - Target (`grid-target`) — Attainment per item, with the amounts
- Bar - Target (`bar-target`) — A different target in each period
- Line - Cumulative (`line-cumulative`) — This month's cumulative pace
- Line - Reference (`line-reference`) — Whether a baseline or average was crossed

### Compare · Which is bigger or smaller?

- Base: Bar - Ranking (`bar-ranking`) — Size and rank per item
- Bar - Compare (`bar-compare`) — Against last year or last month
- Bar - Butterfly (`bar-butterfly`) — Two groups on the same items
- Radar - Basic (`radar-basic`) — Strengths and weaknesses across several scores

### Composition · What is it made of?

- Base: Donut - Basic (`donut-basic`) — Shares at one point in time
- Bar - Stacked 100% (`bar-stacked-100`) — How the mix changed over periods
- Bar - Stacked (`bar-stacked`) — Total and mix over time, together
- Treemap - Basic (`treemap-basic`) — Many items, or items inside groups
- Waffle - Basic (`waffle-basic`) — Shares you can count, in squares

### Table · Exactly how much, per item?

- Base: Grid - Basic (`grid-basic`) — Several metrics and a total per item
- Grid - Spark (`grid-spark`) — A 13-month trend per item at a glance
- Grid - Pivot (`grid-pivot`) — Amounts split two ways, as a crosstab
- Heatmap - Basic (`heatmap-basic`) — Finding high and low cells by color

### Change · Why did it go up or down?

- Base: Waterfall - Basic (`waterfall-basic`) — The change between two points, by factor
- Waterfall - Subtotal (`waterfall-subtotal`) — A profit and loss structure
- Bar - Diverging (`bar-diverging`) — Change or variance from target, per period

### Flow · Where does it drop off, and where does it go?

- Base: Funnel - Flow (`funnel-flow`) — How much drops out at each step
- Sankey - Basic (`sankey-basic`) — Flows between two breakdowns
- Sankey - Levels (`sankey-levels`) — Flows across three or more levels

### Relation · How do two values relate?

- Base: Scatter - Basic (`scatter-basic`) — Whether two measures move together
- Scatter - Quadrant (`scatter-quadrant`) — Sorting items into four groups by two criteria
- Scatter - Connected (`scatter-connected`) — How two metrics moved over time

## Design table

Before writing any card code, lay the screen out as a "row · question · card (id) · height" table, write the assumptions under it, and show it to the user. Put cards of the same height in the same row (KPI - Number 1 unit, KPI - Gauge · KPI - Stacked Bar 1.5 units, the rest 2 units). Paste the cards in the table's row order.

| Row | Question | Card (id) | Height |
|---|---|---|---|
| 1 | How much are sales, orders and the return rate now? | `kpi-number` ×3 (sales · orders · return rate) | 1 unit |
| 2 | How have sales moved? · Which branches are largest? | `line-basic` + `bar-ranking` | 2 units |

Assumptions: return rate `"better": "down"`; amounts as raw values with `"format": "usd"`.

## Rules

- Paste the card code you downloaded as it is and change only the JSON values. Do not edit the styles or the script. To use the same card several times, paste the whole card code again and change each JSON.
- A card fills the width of its slot, and its height is one of 1 · 1.5 · 2 units (1 unit = 168px, --vzb-unit): KPI - Number 1 unit, KPI - Gauge · KPI - Stacked Bar 1.5 units, the rest 2 units. Cards in a row stretch to the tallest one and their graphics sit on the bottom, so to leave no gaps, put cards of the same height in a row.
- For several cards, give the wrapper a grid: display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap:16px. Below 340px, the text in tables, donuts, funnels and waterfalls clips or overlaps. A row of KPI cards alone can go down to 280px, so four fit across a 1280px page.
- Change colors and the font with the --vzb-* variables on :root (--vzb-primary, --vzb-font, …). The variable list and what each one does are in https://blocks.vizney.com/tokens.css (the same content as the :where(:root) block in the card code). To match a whole page, re-declare that file's values on :root.
- Common fields: title (metric name), subtitle (period), value (the headline figure of a KPI card; KPI - Line and KPI - Bar use the last value when it is empty), format (usd dollar amounts, shortened to $745.6K · $1.2M · count a count, with its unit in unit · pct a percentage (3.4 is 3.4%), changes in pp · days a number of days · eok and krw are Korean won notations; krw writes amounts under 100,000 won in full), decimals (decimal places of the numbers; empty lets the card decide, and pct changes follow it too), better (up · down · neutral: the change color), compare ({ label, value }), labels (period names, the same length as values; null for a period without a value), series ([{ name, values }]), rows (table rows), curve (line shape of the line cards: smooth · linear · step), lang (en: the words the card prints itself, like Total, Other and Met, in English).
- Changes, shares, attainment and totals are computed by the card, so do not write them in the JSON. Ranking and share cards also sort by size and fold the rest into Other, so do not sort or fold the data beforehand.
- Give amounts as raw values, not rounded or divided into thousands or millions. The card shortens them to the format (usd) and computes totals and changes from the raw values, so totals agree across cards and decimals match. usd tables and scatter axes pick one of K · M · B per column or axis and write it in the column heading or axis name, like $K. Grid - Basic takes "format": "usd" on amount columns.
- A metric where lower is better (return rate, cost, defect rate) gets `"better": "down"`. An increase becomes a red badge.
- A ratio metric gets `"format": "pct"`. Its change is written in pp.
- A monthly trend gets 13 months when the data has them. The first and last are the same month, so the year-over-year comparison is visible.
- A period still in progress, like this month, is compared with the same days of the previous period (month to date), and that basis goes in `compare.label` and `subtitle`.
- Keep period names short, like `Sep '25` or `3Q26`. Long ones clip or run together on axes and under bars.
- When the same metric appears on several cards, check that their periods and totals agree. If they do not, do not fix the values; ask the user.
- Keep item names (regions, categories) in one language across the screen. Translate all of them or keep all of them as they are.
- A card is a snippet pasted into the HTML document as it is. Inserted with innerHTML or React's dangerouslySetInnerHTML, the card's `<script>` does not run.

### Picking and layout

Where AI agents actually went wrong building dashboards with these cards (3 briefs × 2 models). The numbers are measured on the cards drawn with the real font.

- Share cards (Donut - Basic, Waffle - Basic, KPI - Stacked Bar) color only the three largest items and fold the rest into "Other". When Other is larger than the third slice, the screen cannot say what is second largest, so use Bar - Ranking. The same holds when a pie was asked for; tell the user why it changed.
- KPI - Number is the default in a KPI row. When the metric has its own trend card, do not use KPI - Line or KPI - Bar. A metric drawn in two places leaves the reader unsure which to read and leaves room for periods and totals to disagree.
- Up to four KPI cards per row. With five or more metrics, drop the least important or put two or three with different units into one Line - Tabs. Do not lower the grid minimum below 280px to fit five, and do not split them into rows of different widths such as 3 + 2.
- For daily or weekly data, where the last value is not the headline, put the period total in `value` on Line - Tabs tabs and KPI - Line, and name that basis in the subtitle. Left empty, the last day's value becomes the headline and clashes with the weekly KPI on the same screen. For a ratio, where a total means nothing, leave it empty and write "as of the last day" in the subtitle.
- Bar lists and tables (Bar - Ranking, Bar - Compare, Grid - Basic, Grid - Target) fit 2 units up to six rows; from the seventh row each row adds 32px and stretches the other cards in that row. Use the default five rows plus "Other". If every item must show, put cards with the same number of rows in one row. With no card to pair, give that row's grid `auto-fill` instead of `auto-fit` so the card keeps one column's width instead of stretching across.
- Give the full width, or a two-column slot, only to cards whose width carries information: a 13-month line with several series, a table or heatmap with seven or more columns, a waterfall with seven or more items, a sankey. Do not put those at half width. A bar list or a short table gains nothing from the width; the eye only travels farther.
- A waterfall with seven or more items has its value labels touch at 390px. If it must read on a phone, fold small items (non-operating items and tax into "Non-operating & tax") to about six.
- On a 390px screen (cards 342px wide) a table fits a name column and three number columns. With four or more number columns it scrolls sideways inside the card, so split the table or move the change to another card.
- A table that shows only the top N gets no total row (Grid - Basic: `"total": false`). A total row reads as the grand total. To give the whole, write it in the subtitle, such as "of 875.6B total".
- Keep one screen title and one line for the as-of date and source; put no group headings ("Key metrics", "Channels") between rows of cards. The card titles are already the questions, so group headings repeat them and change the row spacing, which breaks the grid.
- When the chosen card cannot draw the data well (overlapping or clipped text), do not switch to a card of another shape. Fold items or shorten names, and tell the user what is left, with the card's name.

## Checklist

Go through it before handing over the file. If anything is off, fix it and check again.

### Card code

- [ ] The card code is as downloaded; only the JSON values changed.
- [ ] Fields are only those in the example JSON, the common fields in the rules, or that card's line in llms.txt.
- [ ] No changes, shares, attainment or totals in the JSON, and no data sorted or folded into "Other" in advance.
- [ ] Amounts are raw values, not rounded or divided into thousands or millions.

### Data

- [ ] Lower-is-better metrics have `"better": "down"`; ratio metrics have `"format": "pct"`.
- [ ] Monthly trends have 13 months when the data has them.
- [ ] A period in progress names its comparison basis in `compare.label` and `subtitle`.
- [ ] Period names are short, and item names are in one language across the screen.
- [ ] Periods and totals of the same metric agree across cards. Where they do not, the values were left as they are and the user was asked.
- [ ] A share card's "Other" is smaller than its third slice. If not, it was changed to Bar - Ranking.
- [ ] The headline figures of daily or weekly tabs and KPIs are the values of the intended period.
- [ ] A table that shows only the top N has no total row.

### Layout

- [ ] Cards in a row have the same height, and no stretched card has a large gap.
- [ ] The grid minimum is 340px (280px for a row of KPI cards alone).
- [ ] At most four KPI cards per row, and each metric is drawn only once on the screen.
- [ ] Bar lists and tables have six rows or fewer, or the stretched cards share a row.
- [ ] Wide slots go only to cards whose width carries information, and no table scrolls sideways at 390px.
- [ ] No group headings between card rows besides the screen title and one line for the date and source.
- [ ] No card was inserted with innerHTML or dangerouslySetInnerHTML.

### Screen

- [ ] No errors in the browser console, and no error message (`.vzb-error`) inside a card.
- [ ] Screenshots at 1280px and 390px show no clipped or overlapping text. Cards cut overflowing text with an ellipsis (…) without an error, so look. If you cannot take screenshots, check that no element inside a card has a `scrollWidth` larger than its `clientWidth`.
- [ ] The assumptions were shared with the user.

## Examples

Worked examples that follow one request through questions, checks, the design table, what was done differently from the request, the key JSON and the checks. They are written in Korean, but the judgments apply as they are.

- [예시 1 · 영업 월간 보고](examples/sales-monthly.md)
- [예시 2 · 분기 손익 임원 보고](examples/pnl-quarterly.md)
- [예시 3 · 마케팅 주간 리포트](examples/growth-weekly.md)

Gallery: https://blocks.vizney.com/ (Korean https://blocks.vizney.com/ko/) · Source: https://github.com/yehwanhwang/vizney-blocks
