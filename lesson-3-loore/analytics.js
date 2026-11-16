"use strict";
function setupAnalytics(data, start, end) {
  const dates=Array.from({length:7},(_,i)=>start+i*86400000);
  const dateKey=t=>new Date(t+3*3600000).toISOString().slice(0,10);
  const dayLabels=dates.map(t=>new Date(t).toLocaleDateString("ru",{day:"numeric",month:"short",timeZone:"Europe/Moscow"}));
  const stamp=new Date(end).toLocaleTimeString("ru",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Moscow"});
  const channels=data.channels.map(c=>({...c,posts:c.posts.filter(p=>Date.parse(p.date)>=start&&Date.parse(p.date)<=end)}));
  const counts=channels.map(c=>dates.map(t=>c.posts.filter(p=>dateKey(Date.parse(p.date))===dateKey(t)).length));
  const sign=v=>v>0?"+"+fmt.format(v):fmt.format(v);
  function table(id,head,rows){
    const host=el(id),tr=node("tr");for(const h of head)tr.append(node("th",h));
    const thead=node("thead");thead.append(tr);const tbody=node("tbody");
    for(const row of rows){const r=node("tr");for(const v of row)r.append(node("td",v));tbody.append(r);}
    host.replaceChildren(thead,tbody);
  }
  const priorPeriod={start:"2026-11-03",end:"2026-11-09",currentStart:"2026-11-10",currentEnd:"2026-11-16",counts:{YouTube:0,Telegram:7,Instagram:8}};
  if(dateKey(start)===priorPeriod.currentStart && dateKey(end)===priorPeriod.currentEnd){
    const comparisonRows=channels.map(c=>[c.platform,priorPeriod.counts[c.platform],c.posts.length]);
    if(typeof renderWeekComparison==="function")renderWeekComparison(comparisonRows,"3–9 ноября","10–16 ноября");
    comparisonRows.push(["Все площадки",comparisonRows.reduce((s,r)=>s+r[1],0),comparisonRows.reduce((s,r)=>s+r[2],0)]);
    table("comparison-table",["Площадка","3–9 ноября","10–16 ноября","Изменение","Рост"],comparisonRows.map(([name,before,now])=>[name,before,now,sign(now-before),before?sign(Math.round(1000*(now-before)/before)/10)+"%":"—"]));
    el("comparison-hint").textContent="Instagram включает Reels и карусели в обеих неделях. Последний день текущей недели учтён до "+stamp+" МСК. При нулевой базе рост в процентах не рассчитывается.";
    el("comparison").hidden=false;
  }
  let frequency, historyLoaded=false;
  el("daily-hint").textContent="По дате выхода, МСК. "+dayLabels[6]+" — неполный день, данные до "+stamp+".";
  const totals=dates.map((_,i)=>counts.reduce((a,c)=>a+c[i],0));
  table("daily",["Дата",...channels.map(c=>c.platform),"Всего","К предыдущему дню"],dates.map((_,i)=>[dayLabels[i]+(i===6?" *":""),...counts.map(c=>c[i]),totals[i],i?sign(totals[i]-totals[i-1]):"—"]));
  table("weekly",["Площадка","Публикаций","С просмотрами","Сумма","Медиана"],channels.map(c=>{
    const views=c.posts.map(p=>p.views).filter(hasNumber).sort((a,b)=>a-b), n=views.length;
    return [c.platform,c.posts.length,n,n?fmt.format(views.reduce((sum,v)=>sum+v,0)):"—",n?fmt.format((views[Math.floor((n-1)/2)]+views[Math.floor(n/2)])/2):"—"];
  }));
  async function growth(){
    const today=dateKey(end);let prior=[],unavailable=false;
    try{const r=await fetch("./history.json",{cache:"no-cache"});if(!r.ok)throw Error("history");const history=await r.json();prior=history.snapshots.filter(s=>s.date>=dateKey(start)&&s.date<today).sort((a,b)=>a.date.localeCompare(b.date));}catch{unavailable=true;}
    const text=unavailable?"История замеров недоступна.":prior.length?"Первый и последний доступные замеры в пределах недели. Просмотры сравниваются по одним и тем же публикациям.":"Первый замер "+day(end)+". Изменение появится после замера в другой день.";
    el("growth-hint").textContent=text;
    table("growth",["Площадка","Интервал, МСК","Подписчики, ±","Просмотры, ±","Общих публикаций"],channels.map(c=>{
      const first=prior.find(s=>s.channels?.some(ch=>ch.platform===c.platform));
      if(!first)return [c.platform,today,"—","—","—"];
      const prev=first.channels.find(ch=>ch.platform===c.platform);
      const oldViews=new Map((prev.posts||[]).filter(p=>p.url&&hasNumber(p.views)).map(p=>[p.url,p.views]));
      const matched=c.posts.filter(p=>hasNumber(p.views)&&oldViews.has(p.url));
      return [c.platform,first.date+" → "+today,hasNumber(c.followers)&&hasNumber(prev.followers)?sign(c.followers-prev.followers):"—",matched.length?sign(matched.reduce((sum,p)=>sum+p.views-oldViews.get(p.url),0)):"—",matched.length];
    }));
  }
  for (const c of channels) el("activity-platform").append(node("option",c.platform));
  function renderActivity(){
    const cumulative=el("activity-mode").value==="cumulative";
    const platform=el("activity-platform").value;
    const datasets=channels.flatMap((c,i)=>{
      if(platform!=="Все"&&platform!==c.platform)return [];
      let sum=0;
      const color=colors[c.platform.toLowerCase()];
      return [{label:c.platform,data:counts[i].map(v=>cumulative?(sum+=v):v),borderColor:color,backgroundColor:color,borderWidth:cumulative?3:0,pointRadius:4}];
    });
    frequency?.destroy();
    frequency=new Chart(el("frequency"),{type:cumulative?"line":"bar",data:{labels:dayLabels,datasets},options:{responsive:true,maintainAspectRatio:false,animation:false,scales:{x:{stacked:!cumulative,grid:{display:false}},y:{stacked:!cumulative,beginAtZero:true,ticks:{precision:0}}}}});
  }
  el("activity-platform").onchange=renderActivity;
  el("activity-mode").onchange=renderActivity;
  let instagramReady=false;
  function activate(show){
    el("view-posts").setAttribute("aria-pressed",String(!show));el("view-analytics").setAttribute("aria-pressed",String(show));
    el("analytics").hidden=!show;el("metrics").hidden=show;el("history").hidden=show;
    if(show&&!instagramReady&&typeof setupInstagramMetrics==="function"){setupInstagramMetrics(data);instagramReady=true;}
    if(show&&!frequency&&window.Chart){renderActivity();comparisonCharts(channels);}
    if(show&&!historyLoaded){historyLoaded=true;growth();}
  }
  el("view-posts").onclick=()=>activate(false);el("view-analytics").onclick=()=>activate(true);
}
