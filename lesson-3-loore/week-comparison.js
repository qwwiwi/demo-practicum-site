"use strict";
function renderWeekComparison(rows, previousLabel, currentLabel) {
  const container = document.getElementById("week-bars");
  const ceiling = Math.max(1, ...rows.flatMap(row => row.slice(1, 3)));
  const legend = document.createElement("p");
  legend.className = "week-key";
  const fragment = document.createDocumentFragment();
  [previousLabel, currentLabel].forEach((text, i) => {
    const label = document.createElement("span");
    label.className = "week-series series-" + i;
    label.textContent = text;
    legend.append(label);
  });
  fragment.append(legend);
  for (const [platform, before, now] of rows) {
    const row = document.createElement("div");
    row.className = "week-pair";
    const label = document.createElement("strong");
    label.textContent = platform;
    row.append(label);
    const pair = document.createElement("div");
    [before, now].forEach((value, index) => {
      const band = document.createElement("div");
      band.className = "week-band series-" + index;
      const bar = document.createElement("i");
      bar.style.width = (82 * value / ceiling) + "%";
      const count = document.createElement("span");
      count.textContent = String(value);
      band.append(bar, count);
      pair.append(band);
    });
    row.append(pair);
    fragment.append(row);
  }
  container.replaceChildren(fragment);
}
