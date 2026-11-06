import {signed,validate,display} from './status-model.mjs';
const FEED='https://raw.githubusercontent.com/Mizard2115/VIA-AUREA-Status/status-data/status.json';
const words={ok:'Работает',down:'Есть проблема',unknown:'Нет свежих данных'};
let current=null,expires=0,pending=false;
function render(){
 const value=current&&performance.now()<expires?current:{status:'unknown',components:{control:'unknown',handoff:'unknown',network:'unknown'}};
 document.querySelector('.hero').className='hero '+value.status;
 document.getElementById('headline').textContent=value.status==='ok'?'Сервис работает':value.status==='down'?'Есть перебои в работе':'Ждём свежую проверку';
 document.getElementById('summary').textContent=value.status==='ok'?'Внешняя проверка подтверждает доступность перечисленных служб.':value.status==='down'?'Одна или несколько служб не ответили на внешнюю проверку. Мы показываем результаты ниже.':'Нет подтверждённых свежих результатов. Предыдущий статус не считается подтверждением работы.';
 for(const element of document.querySelectorAll('[data-component]')){const state=value.components[element.dataset.component]||'unknown';element.className='badge '+state;element.querySelector('span').textContent=words[state];}
}
async function refresh(){
 if(pending)return;pending=true;const button=document.getElementById('refresh');button.disabled=true;button.textContent='Обновляем…';const started=performance.now();
 try{
  const nonce=Date.now();const [feed,clock]=await Promise.all([fetch(FEED+'?v='+Math.floor(nonce/30000),{cache:'no-store',signal:AbortSignal.timeout(10000)}),fetch('./index.html?clock='+nonce,{method:'HEAD',cache:'no-store',signal:AbortSignal.timeout(10000)})]);
  if(!feed.ok||!clock.ok)throw Error();const envelope=await feed.json();
  const date=Date.parse(clock.headers.get('Date'));const age=Number(clock.headers.get('Age')||0);if(!Number.isFinite(date)||!Number.isFinite(age)||age<0)throw Error();
  const value=validate(envelope.report,envelope.report.checked_at);const raw=new TextEncoder().encode(JSON.stringify(value));if(!await signed(raw,envelope.signature))throw Error();
  current=display(value,Math.floor((date+age*1000+(performance.now()-started))/1000));expires=performance.now()+Math.max(0,current.valid_for_ms-(performance.now()-started));
  document.getElementById('checked').textContent='Последняя проверка: '+new Date(value.checked_at*1000).toLocaleString('ru-RU');
 }catch{current=null;expires=0;}
 finally{pending=false;button.disabled=false;button.textContent='Обновить статус ↗';render();}
}
document.getElementById('refresh').addEventListener('click',refresh);setInterval(refresh,30000);setInterval(render,1000);refresh();
