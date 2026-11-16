"use strict";
const reelMetrics = [
  ["views", "Просмотры"], ["likes", "Лайки"], ["comments", "Комментарии"],
  ["saves", "Сохранения"], ["shares", "Пересылки"], ["reposts", "Репосты"]
];
function appendInstagramMetrics(body, post) {
  if (post.platform !== "Instagram") return;
  const strip = node("dl", null, "reel-metric-strip");
  for (const [key, title] of reelMetrics) {
    const pair = node("div");
    pair.append(node("dt", title), node("dd", hasNumber(post[key]) ? fmt.format(post[key]) : "Нет данных"));
    strip.append(pair);
  }
  body.append(strip);
}
function setupInstagramMetrics(data) {
  const host = el("instagram-metrics");
  const channel = data.channels.find(c => c.platform === "Instagram");
  if (!channel || !host) return;
  let kind = "all", metric = "likes";
  const formats = node("div",null,"ig-controls ig-formats");
  formats.setAttribute("aria-label","Формат публикации");
  const controls = node("div", null, "ig-controls");
  const status = node("p", null, "hint");
  status.setAttribute("aria-live", "polite");
  const chart = node("div", null, "ig-ranks");
  const period = node("p","Выберите формат и показатель. Нажмите на публикацию, чтобы открыть её карточку.","hint");
  host.append(node("h2","Сравнение публикаций Instagram"),period,formats,controls,status,chart);
  function render(key) {
    metric = key;
    const all = channel.posts.filter(p => kind === "all" || (p.kind || "reel") === kind);
    for (const button of formats.children) button.setAttribute("aria-pressed",String(button.dataset.kind === kind));
    const known = all.filter(p => hasNumber(p[key])).sort((a,b) => b[key]-a[key]);
    const missing = all.filter(p => !hasNumber(p[key]));
    const total = known.reduce((sum,p) => sum + p[key],0);
    const max = known[0]?.[key] || 1;
    status.textContent = "Данные для "+known.length+" из "+all.length+" публикаций"+(known.length ? " · Сумма "+fmt.format(total) : " · Счётчик недоступен");
    for (const button of controls.children) button.setAttribute("aria-pressed",String(button.dataset.key === key));
    chart.replaceChildren();
    for (const post of [...known,...missing]) {
      const row = node("button",null,"ig-rank");
      const date = new Date(post.date).toLocaleDateString("ru",{day:"numeric",month:"short",timeZone:"Europe/Moscow"});
      const shortcode = post.url.split("/").filter(Boolean).pop();
      const caption = post.title && post.title !== "Публикация без подписи" ? post.title : (post.kind === "carousel" ? "Карусель " : "Reel ")+shortcode;
      const value = hasNumber(post[key]) ? fmt.format(post[key]) : "Нет данных";
      const track = node("span",null,"ig-track"), fill = node("i");
      fill.style.width = (hasNumber(post[key]) ? post[key]/max*100 : 0)+"%";
      track.append(fill);
      row.append(node("span",date+" · "+(post.kind==="carousel"?"Карусель":"Reel"),"ig-date"),node("span",caption,"ig-caption"),node("strong",value),track);
      row.onclick = () => showDetail({...post,platform:"Instagram"});
      chart.append(row);
    }
  }
  for (const [id, label] of [["all","Все"],["reel","Reels"],["carousel","Карусели"]]) {
    const button=node("button",label);button.type="button";button.dataset.kind=id;button.onclick=()=>{kind=id;render(metric);};formats.append(button);
  }
  for (const [key,label] of reelMetrics) {
    const button = node("button",label);
    button.type="button";button.dataset.key=key;button.onclick=()=>render(key);controls.append(button);
  }
  render("likes");
}
