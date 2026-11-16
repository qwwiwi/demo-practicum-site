(() => {
  const sheet = document.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = new URL('booking.css', document.currentScript?.src || location.href).href;
  document.head.append(sheet);

  function setup() {
    const host = document.querySelector('#booking');
    if (!host || host.querySelector('.stay-widget')) return;
    const homes = [
      ['Сосна', 6000, 8000], ['Берёза', 8500, 10500], ['Кедр', 11000, 14000]
    ];
    const rub = value => value.toLocaleString('ru-RU') + ' ₽';
    const today = new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Moscow'}).format(new Date());
    const date = key => new Date(key + 'T12:00:00Z');
    const key = d => d.toISOString().slice(0,10);
    const next = (d,n=1) => new Date(+d + n*86400000);
    const format = (d,options) => d.toLocaleDateString('ru-RU',{...options,timeZone:'UTC'});
    const short = k => format(date(k),{day:'numeric',month:'short'});
    const monthOf = (d,n=0) => new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+n,1,12));
    let month = monthOf(date(today)), home = 0, start = '', end = '', confirmed = false;
    if (!host.querySelector('h2')) {
      const title = document.createElement('h2');
      title.textContent = 'Выберите даты отдыха';
      host.append(title);
    }
    const widget = document.createElement('div');
    widget.className = 'stay-widget';
    host.append(widget);
    function render(focus) {
      const firstOffset=(month.getUTCDay()+6)%7;
      const cells=Array.from({length:firstOffset},()=>'<span></span>');
      for(let d=month; d.getUTCMonth()===month.getUTCMonth(); d=next(d)) {
        const k=key(d), selected=k===start||k===end, weekend=[5,6].includes(d.getUTCDay());
        cells.push('<button type="button" data-day="'+k+'" aria-label="'+format(d,{dateStyle:'full'})+', '+rub(homes[home][weekend?2:1])+' за ночь" aria-pressed="'+selected+'" '+(k<today?'disabled':'')+' class="'+(selected?'chosen':start&&end&&k>start&&k<end?'between':'')+'">'+d.getUTCDate()+'</button>');
      }
      let total=0,nights=0;
      if(start&&end) for(let d=date(start); key(d)<end; d=next(d)){
        total+=homes[home][[5,6].includes(d.getUTCDay())?2:1]; nights++;
      }
      widget.innerHTML='<div class="stay-calendar"><div class="stay-head"><strong>'+format(month,{month:'long',year:'numeric'})+'</strong><div><button type="button" data-nav="-1" aria-label="Предыдущий месяц" '+(key(month)<=key(monthOf(date(today)))?'disabled':'')+'>‹</button><button type="button" data-nav="1" aria-label="Следующий месяц">›</button></div></div><button type="button" class="stay-weekend" data-weekend>На выходные</button><div class="stay-grid">'+['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(x=>'<small>'+x+'</small>').join('')+cells.join('')+'</div></div><div class="stay-summary"><label>Домик<select aria-label="Выберите домик">'+homes.map(([name],i)=>'<option value="'+i+'" '+(home===i?'selected':'')+'>'+name+'</option>').join('')+'</select></label><p class="stay-rates">Вс–чт · '+rub(homes[home][1])+' за ночь<br>Пт–сб · '+rub(homes[home][2])+' за ночь</p><div aria-live="polite"><p>'+(start?(short(start)+' — '+(end?short(end):'выберите дату выезда')):'Выберите дату заезда в календаре')+'</p>'+(nights?'<p>Ночей: '+nights+'</p><strong class="stay-total">'+rub(total)+'</strong>':'')+'</div><button type="button" data-book '+(!nights||confirmed?'disabled':'')+'>'+(confirmed?'Даты выбраны':'Подтвердить выбор')+'</button><small role="status">'+(confirmed?'Демонстрация завершена. Домик «'+homes[home][0]+'», '+short(start)+' — '+short(end)+'. Итого '+rub(total)+'.':'Демо-бронирование без оплаты.')+'</small></div>';
      if(focus) widget.querySelector(focus)?.focus({preventScroll:true});
    }
    widget.addEventListener('change',e=>{
      if(e.target.matches('select')){home=Number(e.target.value);confirmed=false;render('select');}
    });
    widget.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b||b.disabled)return;
      if(b.hasAttribute('data-weekend')){
        const now=date(today);
        const friday=next(now,(5-now.getUTCDay()+7)%7);
        start=key(friday);end=key(next(friday,2));month=monthOf(friday);confirmed=false;
        render('[data-weekend]');return;
      }
      if(b.dataset.nav){month=monthOf(month,Number(b.dataset.nav));render('[data-nav="'+b.dataset.nav+'"]:not(:disabled)');return;}
      if(b.dataset.day){
        const k=b.dataset.day;
        if(!start||end||k<=start){start=k;end='';}else end=k;
        confirmed=false;render('[data-day="'+k+'"]');
      }else if(b.hasAttribute('data-book')){confirmed=true;render();}
    });
    document.addEventListener('click',e=>{
      const trigger=e.target.closest('[data-house]'); if(!trigger)return;
      const i=Number(trigger.dataset.house);if(!homes[i])return;
      home=i;confirmed=false;render();host.scrollIntoView({behavior:'instant'});
    });
    render();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',setup); else setup();
})();
