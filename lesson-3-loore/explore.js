"use strict";
function median(values) {
  if (!values.length) return null;
  const sorted=[...values].sort((a,b)=>a-b);
  return (sorted[Math.floor((sorted.length-1)/2)]+sorted[Math.floor(sorted.length/2)])/2;
}
function comparisonCharts(channels) {
  const labels=channels.map(c=>c.platform);
  const palette=labels.map(key=>colors[key.toLowerCase()]);
  let shareChart, channelChart;
  function redrawShare() {
    const posts=el("share-metric").value==="posts";
    const values=channels.map(c=>posts?c.posts.length:c.posts.reduce((sum,p)=>sum+(hasNumber(p.views)?p.views:0),0));
    const total=values.reduce((a,b)=>a+b,0);
    shareChart?.destroy();
    shareChart=new Chart(el("share-chart"),{type:"doughnut",data:{labels,datasets:[{data:values,backgroundColor:palette,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,animation:false,cutout:"64%",plugins:{legend:{display:false}}}});
    const valuesHost=el("share-values");valuesHost.replaceChildren();
    labels.forEach((label,i)=>{
      const item=node("span"),dot=node("i");dot.style.backgroundColor=palette[i];item.append(dot,label+" "+(total?fmt.format(Math.round(1000*values[i]/total)/10)+"%":"—"));valuesHost.append(item);
    });
  }
  function redrawChannels() {
    const metric=el("audience-metric").value;
    const values=channels.map(c=>{
      const views=c.posts.map(p=>p.views).filter(hasNumber);
      if(metric==="median")return median(views);
      if(metric==="followers")return c.followers;
      return views.length?views.reduce((a,b)=>a+b,0):null;
    });
    channelChart?.destroy();
    channelChart=new Chart(el("channel-chart"),{type:"bar",data:{labels,datasets:[{label:el("audience-metric").selectedOptions[0].text,data:values,backgroundColor:palette,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:"y",animation:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,ticks:{maxTicksLimit:4,callback:v=>new Intl.NumberFormat("ru",{notation:"compact"}).format(v)}},y:{grid:{display:false}}}}});
  }
  el("share-metric").onchange=redrawShare;el("audience-metric").onchange=redrawChannels;
  redrawShare();redrawChannels();
}
