"use strict";
const el = id => document.getElementById(id);
const fmt = new Intl.NumberFormat("ru");
const day = value => new Intl.DateTimeFormat("ru", {day:"numeric",month:"short",year:"numeric",timeZone:"Europe/Moscow"}).format(value);
const colors = {youtube:"#bc483a",telegram:"#247eb3",instagram:"#9753a0"};
const hasNumber = value => typeof value === "number" && Number.isFinite(value);
function node(tag, text, cls) {
  const item = document.createElement(tag);
  if (text != null) item.textContent = text;
  if (cls) item.className = cls;
  return item;
}
function external(text, url) {
  const a = node("a", text);
  if (/^https:\/\//.test(url)) { a.href = url; a.target="_blank"; a.rel="noopener noreferrer"; }
  return a;
}
let chart, details={}, snapshotEnd, snapshotStart;
function mediaURL(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const u=new URL(value, document.baseURI);
  return (u.protocol==="https:" || u.origin===location.origin) ? u.href : null;
}
function showDetail(post){
 const dialog=el("detail"), body=el("detail-body");
 body.replaceChildren();el("detail-title").textContent=post.title||"Публикация";
 el("detail-meta").textContent=post.platform+" · "+day(Date.parse(post.date));
 body.append(external("Открыть оригинал",post.url));
 const detail=details[post.url]||{},download=mediaURL(detail.download);
 const fullText=detail.text||post.text;
 if(fullText && fullText!==post.title){body.append(node("h3","Текст публикации"),node("p",fullText));}
 let embed=mediaURL(detail.embed);
 if(post.platform==="YouTube"){
  const u=new URL(post.url), id=u.searchParams.get("v")||u.pathname.split("/").pop();
  if(/^[A-Za-z0-9_-]{11}$/.test(id))embed="https://www.youtube-nocookie.com/embed/"+id;
 }
 const imageDownload=download && ((detail.mediaType||"").startsWith("image") || /\.(jpg|jpeg|png|webp)(?:$|\?)/i.test(download));
 const photos=detail.images?.length ? detail.images : imageDownload ? [download] : [];
 for(const photo of photos){const url=mediaURL(typeof photo==="string"?photo:photo.url);if(!url)continue;const img=node("img",null,"post-image");img.alt="Изображение публикации";img.src=url;body.append(img);}
 if(download && !imageDownload){
  const v=node("video");v.controls=true;v.preload="metadata";v.src=download;body.append(v);
 }else if(embed){
  const f=node("iframe");f.title="Плеер публикации";f.src=embed;f.allowFullscreen=true;f.referrerPolicy="strict-origin-when-cross-origin";body.append(f);
 }
 if(download){const a=node("a","Скачать файл");a.href=download;a.download="";const line=node("p");line.append(a);body.append(line);}
 body.append(node("h3","Раскадровка"));
 const frames=detail.frames||[];
 if(frames.length){
   body.append(node("p","Нажмите кадр, чтобы открыть изображение в полном размере.","hint"));
   const strip=node("div",null,"frames");
   for(const frame of frames){
     const url=mediaURL(frame.url);
     if(!url)continue;
     const fig=node("figure"),img=node("img"),link=node("a");
     link.href=url;link.target="_blank";link.rel="noopener noreferrer";
     img.src=url;img.alt="Открыть кадр "+(frame.time??"");link.append(img);
     fig.append(link,node("figcaption",String(frame.time??"")));strip.append(fig);
   }
   body.append(strip);
 }else body.append(node("p","Раскадровка недоступна.","hint"));
 body.append(node("h3","Транскрипт"),node("p",detail.transcript||"Транскрипт недоступен."));
 dialog.showModal();
}
el("close-detail").onclick=()=>el("detail").close();
el("detail").addEventListener("close",()=>el("detail-body").replaceChildren());
function display(channels, selected) {
  for (const b of el("filters").children) b.setAttribute("aria-pressed",String(b.dataset.key === selected));
  const visible=channels.filter(c=>selected==="Все" || c.platform===selected);
  const posts=visible.flatMap(c=>c.posts.map(p=>({...p,platform:c.platform}))).filter(p=>Date.parse(p.date)>=snapshotStart && Date.parse(p.date)<=snapshotEnd).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
  el("legend").replaceChildren();
  const datasets=visible.map(c=>{
    const color=colors[c.platform.toLowerCase()] || "#555";
    const label=node("span"); const dot=node("i",null,"dot");dot.style.background=color;label.append(dot,c.platform); el("legend").append(label);
    return {label:c.platform,backgroundColor:color,pointRadius:5,pointHoverRadius:7,data:posts.filter(p=>p.platform===c.platform && hasNumber(p.views)).map(p=>({x:Date.parse(p.date),y:p.views,title:p.title,post:p}))};
  });
  if(chart) chart.destroy();
  if(window.Chart) chart=new Chart(el("graph"),{type:"scatter",data:{datasets},options:{onClick:(_event,items,active)=>{if(items.length){const i=items[0];showDetail(active.data.datasets[i.datasetIndex].data[i.index].post);}},responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:false},tooltip:{callbacks:{title:items=>items[0].raw.title,label:ctx=>day(ctx.raw.x)+" · "+fmt.format(ctx.raw.y)+" просмотров"}}},scales:{x:{type:"linear",min:snapshotStart,max:snapshotStart+7*86400000-1,ticks:{maxTicksLimit:5,callback:value=>new Date(value).toLocaleDateString("ru",{day:"numeric",month:"short",timeZone:"Europe/Moscow"})},grid:{display:false}},y:{beginAtZero:true,ticks:{maxTicksLimit:6,callback:value=>new Intl.NumberFormat("ru",{notation:"compact"}).format(value)}}}}});
  el("rows").replaceChildren();
  el("count").textContent="В выборке: "+posts.length+" · по дате публикации";
  for(const p of posts){
    const row=node("div",null,"row"),left=node("div");
    const action=node("button",p.title||"Посмотреть публикацию","post-btn");action.onclick=()=>showDetail(p);left.append(node("div",p.platform+" · "+day(Date.parse(p.date)),"meta"),action);
    const origin=node("div",null,"meta");origin.append(external("Оригинал",p.url));left.append(origin);
    const count=node("strong",hasNumber(p.views)?fmt.format(p.views):"—");
    count.title=hasNumber(p.views)?"Просмотры":"Число просмотров недоступно";
    row.append(left,count);el("rows").append(row);
  }
}
async function start(){
 const result=await fetch("./oscar.json",{cache:"no-cache"});
 if(!result.ok)throw Error("load");
 const data=await result.json(), channels=data.channels;
 if(!Array.isArray(channels)||!channels.length)throw Error("schema");
 snapshotEnd=Date.parse(data.updatedAt);
 const moscowMidnight=new Date(snapshotEnd+3*3600000).toISOString().slice(0,10)+"T00:00:00+03:00";
 snapshotStart=Date.parse(moscowMidnight)-6*86400000;
 el("period").textContent=day(snapshotStart)+" — "+day(snapshotEnd)+" · 7 календарных дней";
 try {const res=await fetch("./details.json",{cache:"no-cache"});if(res.ok)details=await res.json();}catch{}
 el("updated").textContent="Аудитория и просмотры публикаций · данные на "+day(Date.parse(data.updatedAt));
 for(const c of channels){
   const card=node("div",null,"channel");card.append(external(c.platform,c.url),node("strong",hasNumber(c.followers)?fmt.format(c.followers):"—"),node("small","подписчиков"));el("channels").append(card);
 }
 for(const key of ["Все",...channels.map(c=>c.platform)]){const b=node("button",key);b.dataset.key=key;b.onclick=()=>display(channels,key);el("filters").append(b);}
 el("metrics").hidden=false;el("history").hidden=false;display(channels,"Все");el("status").hidden=true;
 setupAnalytics(data,snapshotStart,snapshotEnd);
}
start().catch(()=>{el("status").textContent="Не удалось загрузить данные. Обновите страницу, чтобы повторить.";});
