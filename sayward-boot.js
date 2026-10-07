(()=>{
'use strict';
const BUILD='20261007-v5.4.60-native-gate-hardened';
const VERSION='5.4.60';
const FULL_CSS=['sayward-core.css','sayward-patches.css','sayward-home.css'];
const HOME_SUMMARY_KEY='sayward_home_summary_v1';
const ACTIVE_DAY_MAX=11;
const OPIC_JS=['sayward-opic-1.js','sayward-opic-2.js'];
const ENGINE_JS=['sayward-core.js','sayward-patches.js'];
const PROFILE_DATA={day:[],opic:OPIC_JS,my:[],sori:[]};
const dayDataFile=day=>`sayward-day-${String(Number(day)||1).padStart(2,'0')}.json`;
const fill=document.getElementById('saywardBootFill');
const status=document.getElementById('saywardBootStatus');
const retry=document.getElementById('saywardBootRetry');
const overlay=document.getElementById('saywardBootOverlay');
const diag=document.getElementById('saywardBootDiag');
const leanBadge=document.getElementById('saywardLeanBadge');
const leanBadgeText=document.getElementById('saywardLeanBadgeText');
const HOME_FRAGMENT='sayward-home.html';
const DEFERRED_FRAGMENT='sayward-deferred.html';
const runtimeAnchor=document.getElementById('saywardRuntimeAnchor');
const HISTORY_KEY='sayward_boot_history';
const RUN_ID=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
const RUN_STARTED=Date.now();
let bootLastTimer=null,bootLastPending=null;
let shellReady=false,fullReady=false,fullLoading=false,fullPromise=null,pendingReplay=null;
const loadedScripts=new Set();
const LEAN_DAY_META={1:'Everyday Essentials',2:'Everyday Essentials · Expressing Opinions',3:'Expressing Opinions',4:'Expressing Opinions · Reasons & Explanations',5:'Reasons & Explanations',6:'Reasons & Explanations · Choices & Decisions',7:'Choices & Decisions',8:'Choices & Decisions · People & Feelings',9:'People & Feelings',10:'People & Feelings · Comparisons & Differences',11:'Comparisons & Differences'};
let currentRun={id:RUN_ID,build:BUILD,version:VERSION,startedAt:RUN_STARTED,shellReady:false,fullReady:false,events:[]};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let historyEnabled=false,historyTimer=null;
function readHistory(){try{const raw=localStorage.getItem(HISTORY_KEY)||'[]';if(raw.length>260000)return [];const h=JSON.parse(raw);return Array.isArray(h)?h:[]}catch(e){return []}}
function writeHistory(force=false){
  if(!historyEnabled&&!force)return;
  try{
    const h=readHistory();const i=h.findIndex(x=>x&&x.id===RUN_ID);
    const copy={...currentRun,events:currentRun.events.slice(-32)};
    if(i>=0)h[i]=copy;else h.unshift(copy);
    localStorage.setItem(HISTORY_KEY,JSON.stringify(h.slice(0,4)));
  }catch(e){}
}
function scheduleHistory(force=false){
  if(force){if(historyTimer){clearTimeout(historyTimer);historyTimer=null}writeHistory(true);return}
  if(!historyEnabled||historyTimer)return;
  historyTimer=setTimeout(()=>{historyTimer=null;writeHistory(false)},600);
}
function pruneDebugStorage(){
  try{
    localStorage.removeItem('sayward_recovery_status');
    const raw=localStorage.getItem(HISTORY_KEY)||'';
    if(raw.length>260000)localStorage.removeItem(HISTORY_KEY);
  }catch(e){}
}
function homeSnapshot(){try{const h=document.getElementById('homePage');if(!h)return {exists:false,visible:false};const cs=getComputedStyle(h),r=h.getBoundingClientRect();const visible=!h.classList.contains('hidden')&&cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)>0&&r.width>20&&r.height>20;return {exists:true,visible,hiddenClass:h.classList.contains('hidden'),display:cs.display,visibility:cs.visibility,opacity:cs.opacity,w:Math.round(r.width),h:Math.round(r.height),children:h.children.length,textLen:(h.textContent||'').trim().length}}catch(e){return {exists:!!document.getElementById('homePage'),visible:false,error:String(e)}}}
function runtimeSnapshot(){const snap={visibility:document.visibilityState,domElements:document.getElementsByTagName('*').length,home:homeSnapshot(),shellReady,fullReady};try{if(performance.memory)snap.heapMB=Math.round(performance.memory.usedJSHeapSize/1048576*10)/10}catch(e){}return snap}
function flushBootLast(){if(!bootLastPending)return;try{localStorage.setItem('sayward_boot_last',JSON.stringify(bootLastPending))}catch(e){}bootLastPending=null;bootLastTimer=null}
function trace(stage,detail='',extra={}){const ev={stage,detail,at:Date.now(),elapsed:Date.now()-RUN_STARTED,...runtimeSnapshot(),...extra};currentRun.lastStage=stage;currentRun.lastDetail=detail;currentRun.lastAt=ev.at;currentRun.events.push(ev);scheduleHistory(false);bootLastPending={build:BUILD,runId:RUN_ID,stage,detail,at:ev.at,complete:shellReady,shellReady,fullReady,home:ev.home};if(!bootLastTimer)bootLastTimer=setTimeout(flushBootLast,450);return ev}
function withBuild(url){return `${url}?b=${encodeURIComponent(BUILD)}`}
function timed(label,promise,ms=20000){let id;const timeout=new Promise((_,reject)=>{id=setTimeout(()=>reject(new Error(`${label} timeout (${ms/1000}s)`)),ms)});return Promise.race([promise,timeout]).finally(()=>clearTimeout(id))}
const loadedCss=new Set();let fullCssPromise=null;
async function loadCss(url){if(loadedCss.has(url))return true;const href=withBuild(url),started=Date.now();try{const cssText=await timed('CSS '+url,(async()=>{const r=await fetch(href,{cache:'default',credentials:'same-origin'});if(!r.ok)throw new Error('HTTP '+r.status+' for '+url);return r.text()})(),8000);const st=document.createElement('style');st.setAttribute('data-sayward-css',url);st.textContent=cssText;document.head.appendChild(st);loadedCss.add(url);try{localStorage.setItem('sayward_boot_css',JSON.stringify({build:BUILD,runId:RUN_ID,file:url,mode:'fetch-style',ms:Date.now()-started,at:Date.now()}))}catch(e){}return true}catch(err){const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.setAttribute('data-sayward-css-fallback',url);l.onload=()=>loadedCss.add(url);document.head.appendChild(l);trace('css-fallback',url,{error:String(err)});await wait(60);return false}}
function ensureFullStyles(){if(fullCssPromise)return fullCssPromise;fullCssPromise=(async()=>{trace('full-css-start','user-triggered');for(const f of FULL_CSS){trace('css',f);await loadCss(f);await wait(12)}trace('full-css-ready','all app styles');return true})().catch(e=>{fullCssPromise=null;throw e});return fullCssPromise}
let fragmentFetchPromises=new Map();
function fetchTextAsset(url,timeout=10000){
  if(fragmentFetchPromises.has(url))return fragmentFetchPromises.get(url);
  const p=timed('HTML '+url,(async()=>{const r=await fetch(withBuild(url),{cache:'default',credentials:'same-origin'});if(!r.ok)throw new Error('HTTP '+r.status+' for '+url);return r.text()})(),timeout).finally(()=>fragmentFetchPromises.delete(url));
  fragmentFetchPromises.set(url,p);return p
}
const scriptLoadPromises=new Map();
function loadJs(url,timeout=20000){
  if(loadedScripts.has(url)){trace('script-load-skip',url,{reason:'already-loaded'});return Promise.resolve(true)}
  if(scriptLoadPromises.has(url)){trace('script-load-join',url,{reason:'in-flight'});return scriptLoadPromises.get(url)}
  const p=timed('JS '+url,new Promise((resolve,reject)=>{
    const sc=document.createElement('script');sc.src=withBuild(url);sc.async=false;sc.dataset.saywardLazyScript=url;
    sc.onload=()=>{loadedScripts.add(url);resolve(true)};
    sc.onerror=()=>{try{sc.remove()}catch(e){}reject(new Error('JS '+url))};
    document.body.appendChild(sc)
  }),timeout).finally(()=>scriptLoadPromises.delete(url));
  scriptLoadPromises.set(url,p);
  trace('script-load-start',url);
  return p
}
async function waitReady(name,test,ms=5000){const started=Date.now();while(Date.now()-started<ms){try{if(test())return true}catch(e){}await wait(40)}throw new Error(name+' loaded but did not reach READY handshake')}
function setBootProgress(p,label){if(fill)fill.style.width=Math.max(2,Math.min(100,p))+'%';if(status)status.innerHTML=`<span class="bootPct">${Math.round(p)}%</span> · ${label}`}
function showOverlay(label='학습 기능 준비 중'){if(overlay)overlay.style.display='grid';setBootProgress(35,label)}
function hideOverlay(){if(overlay)overlay.style.display='none'}
function setBadge(text,on=true){if(leanBadgeText)leanBadgeText.textContent=text;if(leanBadge)leanBadge.classList.toggle('on',!!on)}
function noteError(type,err){const payload={build:BUILD,runId:RUN_ID,type,message:String(err?.message||err||''),stack:String(err?.stack||''),at:Date.now()};try{localStorage.setItem('sayward_boot_error',JSON.stringify(payload))}catch(e){}trace('runtime-error',type,{error:payload});if(diag){diag.style.display='block';diag.textContent=`진단: ${type} · ${payload.message}`}}
window.addEventListener('error',e=>noteError('error',e.error||e.message));
window.addEventListener('unhandledrejection',e=>noteError('rejection',e.reason));
function initialMode(){try{const m=localStorage.getItem('mv_mainHomeStudyMode540')||localStorage.getItem('mv_homeStudyMode212');if(['day','my','sori','opic'].includes(m))return m}catch(e){}return 'day'}
async function attachLeanHome(){
  const existing=document.getElementById('homePage');
  if(existing&&!existing.hasAttribute('data-static-gate'))return existing;
  trace(existing?'home-upgrade-start':'home-fragment-start',HOME_FRAGMENT);
  const html=await fetchTextAsset(HOME_FRAGMENT,8000);
  const t=document.createElement('template');t.innerHTML=html.trim();
  const home=t.content.querySelector('#homePage');
  if(!home)throw new Error('homePage missing from '+HOME_FRAGMENT);
  if(existing)existing.replaceWith(home);else document.body.insertBefore(home,runtimeAnchor||document.body.lastChild);
  trace(existing?'home-upgrade-ready':'home-fragment-ready',HOME_FRAGMENT,{bytes:html.length,homeNodes:home.getElementsByTagName('*').length});
  return home
}

function leanJson(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||'null');return v==null?fallback:v}catch(e){return fallback}}
function leanModeApply(mode){
  const m=['day','my','sori','opic'].includes(mode)?mode:'day',h=document.getElementById('homePage');if(!h)return;
  h.dataset.cleanMode=m;
  document.querySelectorAll('[data-clean-mode-button]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.cleanModeButton===m?'true':'false'));
  try{if(['day','my','sori','opic'].includes(m)){localStorage.setItem('mv_mainHomeStudyMode540',m);localStorage.setItem('mv_homeStudyMode212',m)}}catch(e){}
}
function buildLeanDaySettings(){
  const day=document.querySelector('#homePage .daySection');if(!day)return;
  if(!document.getElementById('cleanDaySettings')){
    const head=day.querySelector(':scope>.sectionHead');
    const card=document.createElement('section');card.id='cleanDaySettings';card.className='cleanDaySettings';
    card.innerHTML='<div class="cleanDaySettingsTitle">🎧 DAY 학습 설정</div><div class="cleanDaySettingsGrid"><div class="cleanDayField" data-slot="target"><label>학습 대상</label></div><div class="cleanDayField" data-slot="order"><label>재생 순서</label></div><div class="cleanDayField" data-slot="speech"><label>자동 읽기</label></div><div class="cleanDayField" data-slot="repeat"><label>반복 횟수</label></div></div>';
    if(head)head.insertAdjacentElement('afterend',card);else day.prepend(card);
    [['selectedStudyMode','target'],['homeOrderMode','order'],['homeSpeechMode','speech'],['autoRepeat','repeat']].forEach(([id,slot])=>{const el=document.getElementById(id),host=card.querySelector('[data-slot="'+slot+'"]');if(el&&host){el.classList.remove('repeatSelect');host.appendChild(el)}});
  }
  const today=document.querySelector('#homePage .todayCard'),settings=document.getElementById('cleanDaySettings');
  if(today&&settings&&today.previousElementSibling!==settings)settings.insertAdjacentElement('afterend',today);
  const mode=document.getElementById('selectedStudyMode'),rep=document.getElementById('autoRepeat'),ord=document.getElementById('homeOrderMode'),speech=document.getElementById('homeSpeechMode');
  try{if(mode){mode.value=localStorage.getItem('mv_unified_selectedStudyMode')||mode.value;mode.onchange=()=>localStorage.setItem('mv_unified_selectedStudyMode',mode.value)}if(rep){rep.value=localStorage.getItem('mv_unified_selectedStudyRepeat')||rep.value;rep.onchange=()=>localStorage.setItem('mv_unified_selectedStudyRepeat',rep.value)}if(ord){ord.value=localStorage.getItem('mv_unified_order')||ord.value;ord.onchange=()=>localStorage.setItem('mv_unified_order',ord.value)}if(speech){speech.value=localStorage.getItem('mv_unified_speech')||speech.value;speech.onchange=()=>localStorage.setItem('mv_unified_speech',speech.value)}}catch(e){}
}
function leanSavedDays(){const a=leanJson('mv_unified_selectedStudyDays',[]);return Array.isArray(a)?a.map(Number).filter(d=>d>=1&&d<=11):[]}
function readHomeSummary(){try{const x=JSON.parse(localStorage.getItem(HOME_SUMMARY_KEY)||'null');return x&&typeof x==='object'?x:null}catch(e){return null}}
function renderLeanDayGrid(words=null,summary=null){
  const grid=document.getElementById('dayGrid');if(!grid)return;
  const saved=leanSavedDays(),list=Array.isArray(words)?words:[],sum=summary||readHomeSummary()||{},byDayMeta=sum.days||{};
  grid.dataset.leanHydrated=list.length?'1':'0';
  grid.innerHTML=Array.from({length:11},(_,i)=>{const d=i+1,s=byDayMeta[d]||byDayMeta[String(d)]||{},checked=saved.includes(d),learned=Number(s.learned)||0,total=Number(s.total)||30,studyTotal=Number(s.studyTotal)||0,due=Number(s.due)||0,wrong=Number(s.wrong)||0,fav=Number(s.fav)||0,pct=Number.isFinite(Number(s.pct))?Number(s.pct):(total?Math.round(learned/total*100):0),hasSummary=!!(summary||readHomeSummary());return '<div class="dayCard activeDayCard '+(checked?'selectedDay ':'')+'leanDayCard" data-day="'+d+'" data-lean-day="'+d+'" role="button" tabindex="0"><div class="dayCardTop"><span>DAY '+d+'</span><span class="dayStatus">'+(hasSummary?(learned===0?'미학습':learned>=total?'완료':'학습 중'):'준비')+'</span><span class="dayCardCheckWrap"><input class="daySelectCheck" type="checkbox" data-check-day="'+d+'" '+(checked?'checked':'')+' aria-label="DAY '+d+' 선택"></span></div><div class="leanDayTitle">'+(LEAN_DAY_META[d]||('DAY '+d))+'</div><div class="dayProgress"><div style="width:'+pct+'%"></div></div><div class="dayCompactMeta leanDayMeta"><span>📖 '+(hasSummary?learned:'—')+'/'+total+'</span><span>❌ '+(hasSummary?wrong:'—')+'</span><span>⭐ '+(hasSummary?fav:'—')+' 모름</span></div><div class="dayCardBottom leanDayMeta"><span>'+(hasSummary?pct:'—')+'%</span><span>학습 '+(hasSummary?studyTotal:'—')+'회</span><span>복습 '+(hasSummary?due:'—')+'</span></div></div>'}).join('');
  grid.querySelectorAll('.daySelectCheck').forEach(ch=>ch.addEventListener('change',e=>{e.stopPropagation();const days=[...grid.querySelectorAll('.daySelectCheck:checked')].map(x=>Number(x.dataset.checkDay)).sort((a,b)=>a-b);try{localStorage.setItem('mv_unified_selectedStudyDays',JSON.stringify(days))}catch(x){};ch.closest('.dayCard')?.classList.toggle('selectedDay',ch.checked)}));
}
function updateLeanSummaryFromCompact(summary){
  if(!summary||typeof summary!=='object')return;const g=summary.global||{};const learned=Number(g.learned)||0,due=Number(g.due)||0,weak=Number(g.weak)||0,total=Number(g.total)||330,unlearned=Math.max(0,total-learned);const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=String(v)};set('todayReviewCount',due);set('todayLearned',learned);set('todayUnlearned',unlearned);set('todayWeak',weak);const title=document.getElementById('todayTitle'),btn=document.getElementById('todayStartBtn');if(title)title.textContent=due?'오늘 복습할 단어가 '+due+'개 있어요':(unlearned?'DAY 1~11 학습을 이어서 진행하세요':'현재 선택 가능 DAY를 완료했어요 🎉');if(btn)btn.textContent=due?'오늘 복습 '+due+'개 시작':(unlearned?'다음 DAY 학습 시작':'DAY 1 다시 보기');
}
function prepareLeanHomeLayout(){
  buildLeanDaySettings();leanModeApply(initialMode());
  const compact=readHomeSummary();
  if(compact){renderLeanDayGrid(null,compact);updateLeanSummaryFromCompact(compact)}
  else{const t=document.getElementById('todayTitle');if(t)t.textContent='홈 화면 준비 완료 · 학습 현황은 잠시 후 갱신됩니다'}
  try{localStorage.setItem('sayward_lean_hydration',JSON.stringify({build:BUILD,runId:RUN_ID,stage:'static-layout-ready',mode:'compact-only',hasSummary:!!compact,at:Date.now()}))}catch(e){}
}
async function hydrateLeanHomeData(){
  try{
    trace('lean-hydrate-start','APP-ONLY tiny DAY index + compact summary');
    await loadJs('sayward-day-index.js',6000);await wait(15);
    const words=Array.isArray(globalThis.SAYWARD_DAY_INDEX)?globalThis.SAYWARD_DAY_INDEX:[];
    const compact=readHomeSummary();if(compact){renderLeanDayGrid(words,compact);updateLeanSummaryFromCompact(compact)}
    try{localStorage.setItem('sayward_lean_hydration',JSON.stringify({build:BUILD,runId:RUN_ID,stage:'ready',mode:'compact-summary',words:words.length,hasSummary:!!compact,at:Date.now()}))}catch(e){}
    trace('lean-hydrate-ready','DAY 1~11 tiny index',{words:words.length,compact:!!compact,domElements:document.getElementsByTagName('*').length});
    if(!compact){const t=document.getElementById('todayTitle');if(t)t.textContent='홈은 준비됐습니다 · 학습 현황은 학습 기능 사용 후 자동 갱신됩니다';trace('large-storage-skipped','mv_unified_stats not read on Home startup')}
  }catch(e){try{localStorage.setItem('sayward_lean_hydration',JSON.stringify({build:BUILD,runId:RUN_ID,stage:'failed',mode:'compact-summary',error:String(e?.message||e),at:Date.now()}))}catch(x){}trace('lean-hydrate-failed','DAY 1~11 tiny index',{error:String(e?.message||e)})}
}
let modeTransitionSeq=0;
function installLeanInterception(){document.addEventListener('click',e=>{
  if(fullReady){
    const dc=e.target?.closest?.('[data-lean-day],[data-day]');
    if(dc&&dc.closest?.('#homePage')&&!e.target?.closest?.('.daySelectCheck')){
      const day=Number(dc.dataset.leanDay||dc.dataset.day||0);
      if(day>=1&&day<=ACTIVE_DAY_MAX&&!isDayLoaded(day)){
        e.preventDefault();e.stopImmediatePropagation();
        const seq=++modeTransitionSeq;
        setBadge('DAY '+day+' 데이터 불러오는 중',true);
        trace('day-transition-start','DAY '+day,{seq});
        ensureDayData(day).then(()=>{
          if(seq!==modeTransitionSeq){trace('day-transition-stale','DAY '+day,{seq,current:modeTransitionSeq});return}
          setBadge('',false);
          trace('day-transition-ready','DAY '+day,{seq});
          if(typeof window.requestDayLearning==='function')window.requestDayLearning(day);
          else replayAction({kind:'day',day});
        }).catch(err=>noteError('day-switch',err));
        return
      }
    }
    const mb=e.target?.closest?.('[data-clean-mode-button]');
    if(mb){
      const p=mb.dataset.cleanModeButton||'day';
      if(!loadedProfiles.has(p)&&((PROFILE_DATA[p]||[]).length)){
        e.preventDefault();e.stopImmediatePropagation();
        const seq=++modeTransitionSeq;
        setBadge(p.toUpperCase()+' 데이터 불러오는 중',true);
        trace('mode-transition-start',p,{seq});
        ensureProfileData(p).then(()=>{
          if(seq!==modeTransitionSeq){trace('mode-transition-stale',p,{seq,current:modeTransitionSeq});return}
          setBadge('',false);window.setHomeStudyMode?.(p);trace('mode-transition-ready',p,{seq})
        }).catch(err=>noteError('profile-switch',err));
        return
      }
      modeTransitionSeq++;
    }
    return;
  }
  if(e.target?.closest?.('.daySelectCheck,select,input,label'))return;
  const dayCard=e.target?.closest?.('[data-lean-day]');
  if(dayCard){e.preventDefault();e.stopImmediatePropagation();activateFull({kind:'day',day:Number(dayCard.dataset.leanDay)});return}
  const t=e.target?.closest?.('#homePage button,#homePage [role="button"],#homePage [onclick]');if(!t)return;
  const modeBtn=t.closest?.('[data-clean-mode-button]');
  if(modeBtn){e.preventDefault();e.stopImmediatePropagation();const mode=modeBtn.dataset.cleanModeButton||'day';leanModeApply(mode);trace('lean-mode-select',mode);if(mode==='sori'||mode==='opic')activateFull({kind:'mode',mode});return}
  e.preventDefault();e.stopImmediatePropagation();pendingReplay={kind:'id',id:t.id||'',onclick:t.getAttribute('onclick')||''};activateFull(pendingReplay)
},true)}
let deferredAttached=false;
async function appendDeferredDom(){
  if(deferredAttached)return true;
  trace('deferred-fragment-start',DEFERRED_FRAGMENT);
  const html=await fetchTextAsset(DEFERRED_FRAGMENT,10000);
  const t=document.createElement('template');t.innerHTML=html.trim();
  const nodes=[...t.content.children];
  const home=document.getElementById('homePage');if(!home)throw new Error('homePage missing before deferred mount');
  let after=false,afterRef=home,inserted=0;
  for(const node of nodes){
    if(node.id==='__saywardHomeSlot'){after=true;continue}
    node.classList?.add('saywardDeferredMount');
    if(!after)document.body.insertBefore(node,home);
    else{afterRef.insertAdjacentElement('afterend',node);afterRef=node}
    inserted++;
    if(inserted%2===0)await wait(12);
  }
  deferredAttached=true;
  trace('app-dom-expanded','deferred fragment attached',{inserted,bytes:html.length,domElements:document.getElementsByTagName('*').length});
  return true
}
function actionProfile(action){
  if(action?.kind==='day')return 'day';
  if(action?.kind==='mode'&&['day','my','sori','opic'].includes(action.mode))return action.mode;
  const mode=document.getElementById('homePage')?.dataset.cleanMode||initialMode();
  return ['day','my','sori','opic'].includes(mode)?mode:'day';
}
const loadedProfiles=new Set();
const profileLoadPromises=new Map();
const loadedDays=new Set();
const dayLoadPromises=new Map();
let profileRequestSeq=0;
globalThis.SAYWARD_TOEFL_DAYS=globalThis.SAYWARD_TOEFL_DAYS||{};
function isDayLoaded(day){
  day=Number(day);
  return loadedDays.has(day)||Array.isArray(globalThis.SAYWARD_TOEFL_DAYS?.[day]);
}
function writeLoaderState(extra={}){
  try{localStorage.setItem('sayward_lazy_loader',JSON.stringify({build:BUILD,runId:RUN_ID,loaded:[...loadedProfiles],loadedDays:[...loadedDays].sort((a,b)=>a-b),inFlight:[...profileLoadPromises.keys()],dayInFlight:[...dayLoadPromises.keys()],scriptInFlight:[...scriptLoadPromises.keys()],seq:profileRequestSeq,at:Date.now(),...extra}))}catch(e){}
}
async function ensureDayData(day){
  day=Number(day);
  if(!Number.isInteger(day)||day<1||day>ACTIVE_DAY_MAX)throw new Error('DAY '+day+' is not available in this build');
  if(isDayLoaded(day)){
    loadedDays.add(day);
    trace('day-data-skip','DAY '+day,{reason:'already-loaded'});
    return true
  }
  if(dayLoadPromises.has(day)){
    trace('day-data-join','DAY '+day,{reason:'in-flight'});
    writeLoaderState({event:'day-join',day});
    return dayLoadPromises.get(day)
  }
  const file=dayDataFile(day),started=Date.now();
  const p=(async()=>{
    trace('day-data-fetch-start',file,{day});
    writeLoaderState({event:'day-start',day,file});
    const data=await timed('DAY '+day+' data',(async()=>{
      const r=await fetch(withBuild(file),{cache:'default',credentials:'same-origin'});
      if(!r.ok)throw new Error('HTTP '+r.status+' for '+file);
      return r.json()
    })(),10000);
    if(!Array.isArray(data)||!data.length)throw new Error(file+' returned empty data');
    if(data.some(w=>Number(w?.newDay)!==day))throw new Error(file+' contains another DAY');
    globalThis.SAYWARD_TOEFL_DAYS[day]=data;
    loadedDays.add(day);
    if(typeof globalThis.SAYWARD_SYNC_EXTERNAL_DATA==='function'){
      const counts=globalThis.SAYWARD_SYNC_EXTERNAL_DATA();
      trace('day-data-sync','DAY '+day,{day,words:data.length,counts});
    }
    try{localStorage.setItem('sayward_day_loader',JSON.stringify({build:BUILD,runId:RUN_ID,day,file,words:data.length,loadedDays:[...loadedDays].sort((a,b)=>a-b),ms:Date.now()-started,at:Date.now()}))}catch(e){}
    trace('day-data-ready','DAY '+day,{day,file,words:data.length,ms:Date.now()-started,loadedDays:[...loadedDays].sort((a,b)=>a-b)});
    writeLoaderState({event:'day-ready',day,file});
    return true
  })().catch(err=>{
    trace('day-data-failed','DAY '+day,{day,file,error:String(err?.message||err)});
    writeLoaderState({event:'day-failed',day,file,error:String(err?.message||err)});
    throw err
  }).finally(()=>{
    dayLoadPromises.delete(day);
    writeLoaderState({event:'day-settled',day,file})
  });
  dayLoadPromises.set(day,p);
  writeLoaderState({event:'day-registered',day,file});
  return p
}
globalThis.SAYWARD_ENSURE_DAY_DATA=ensureDayData;
globalThis.SAYWARD_IS_DAY_LOADED=isDayLoaded;

async function ensureProfileData(profile,day=null){
  profile=['day','my','sori','opic'].includes(profile)?profile:'day';
  if(profile==='day'){
    if(Number.isInteger(Number(day))&&Number(day)>=1&&Number(day)<=ACTIVE_DAY_MAX){
      await ensureDayData(Number(day));
    }
    try{localStorage.setItem('sayward_lazy_profile',JSON.stringify({build:BUILD,runId:RUN_ID,profile:'day',loaded:[...loadedProfiles],loadedDays:[...loadedDays].sort((a,b)=>a-b),at:Date.now()}))}catch(e){}
    return true
  }
  if(loadedProfiles.has(profile)){trace('profile-load-skip',profile,{reason:'already-loaded'});return true}
  if(profileLoadPromises.has(profile)){trace('profile-load-join',profile,{reason:'in-flight'});writeLoaderState({event:'join',profile});return profileLoadPromises.get(profile)}
  const requestId=++profileRequestSeq;
  const p=(async()=>{
    trace('profile-load-start',profile,{requestId});writeLoaderState({event:'start',profile,requestId});
    const files=PROFILE_DATA[profile]||[];
    if(files.length){
      let i=0;
      for(const f of files){
        setBootProgress(38+Math.round((i/files.length)*24),`${profile.toUpperCase()} 데이터 ${i+1}/${files.length}`);
        trace('profile-data-load',f,{profile,requestId});
        await loadJs(f,15000);i++;await wait(24);
      }
    }
    if(typeof globalThis.SAYWARD_SYNC_EXTERNAL_DATA==='function'){
      const counts=globalThis.SAYWARD_SYNC_EXTERNAL_DATA();
      trace('profile-data-sync',profile,{profile,requestId,counts});
    }
    loadedProfiles.add(profile);
    try{localStorage.setItem('sayward_lazy_profile',JSON.stringify({build:BUILD,runId:RUN_ID,profile,loaded:[...loadedProfiles],loadedDays:[...loadedDays].sort((a,b)=>a-b),at:Date.now()}))}catch(e){}
    trace('profile-load-ready',profile,{requestId,loaded:[...loadedProfiles],loadedDays:[...loadedDays].sort((a,b)=>a-b)});
    writeLoaderState({event:'ready',profile,requestId});
    return true
  })().catch(err=>{trace('profile-load-failed',profile,{requestId,error:String(err?.message||err)});writeLoaderState({event:'failed',profile,requestId,error:String(err?.message||err)});throw err}).finally(()=>{profileLoadPromises.delete(profile);writeLoaderState({event:'settled',profile,requestId})});
  profileLoadPromises.set(profile,p);writeLoaderState({event:'registered',profile,requestId});
  return p;
}
function replayAction(a){if(!a)return;setTimeout(()=>{try{if(a.kind==='mode'){window.setHomeStudyMode?.(a.mode);return}if(a.kind==='day'){if(typeof window.requestDayLearning==='function')window.requestDayLearning(a.day);else document.querySelector('#dayGrid [data-day="'+a.day+'"]')?.click();return}if(a.id){const el=document.getElementById(a.id);if(el)el.click();else if(a.onclick){(0,eval)(a.onclick)}}}catch(e){noteError('replay',e)}},30)}
async function activateFull(action=null){
  if(action)pendingReplay=action;
  const profile=actionProfile(pendingReplay);
  const requestedDay=pendingReplay?.kind==='day'?Number(pendingReplay.day):null;
  if(fullReady){
    try{await ensureProfileData(profile,requestedDay)}catch(e){noteError('profile-data',e);throw e}
    const a=pendingReplay;pendingReplay=null;replayAction(a);return true
  }
  if(fullLoading){trace('full-activation-join',profile,{pending:pendingReplay});return fullPromise}
  fullLoading=true;setBadge('학습 기능 불러오는 중',true);showOverlay('필요한 기능만 준비');
  trace('full-activation-start','user-triggered',{profile});
  fullPromise=(async()=>{try{
    await ensureProfileData(profile,requestedDay);
    if(!loadedScripts.has('sayward-day-index.js')){try{await loadJs('sayward-day-index.js',6000)}catch(e){}}
    setBootProgress(58,'화면 스타일 준비');await ensureFullStyles();
    setBootProgress(66,'학습 화면 확장');await appendDeferredDom();await wait(45);
    setBootProgress(76,'핵심 기능 준비');trace('engine-load','sayward-core.js',{profile});
    await loadJs('sayward-core.js',20000);await waitReady('Core',()=>window.__SAYWARD_CORE_READY__?.version===VERSION,6500);
    if(typeof globalThis.SAYWARD_SYNC_EXTERNAL_DATA==='function')globalThis.SAYWARD_SYNC_EXTERNAL_DATA();
    await wait(55);
    setBootProgress(88,'화면 기능 연결');trace('engine-load','sayward-patches.js',{profile});
    await loadJs('sayward-patches.js',16000);await waitReady('Patches',()=>window.__SAYWARD_PATCHES_READY__?.version===VERSION,6500);await wait(80);
    document.querySelectorAll('.saywardDeferredMount').forEach(el=>el.classList.remove('saywardDeferredMount'));
    fullReady=true;currentRun.fullReady=true;currentRun.fullReadyAt=Date.now();trace('full-ready','engine ready',{profile,loadedProfiles:[...loadedProfiles]});
    const finalAction=pendingReplay;
    const finalProfile=actionProfile(finalAction);
    const finalDay=finalAction?.kind==='day'?Number(finalAction.day):null;
    if(finalProfile!==profile||finalDay!==requestedDay){
      trace('final-profile-catchup',finalProfile,{startedWith:profile,finalDay,requestedDay});
      await ensureProfileData(finalProfile,finalDay)
    }
    try{const mode=document.getElementById('homePage')?.dataset.cleanMode||initialMode();window.setHomeStudyMode?.(mode)}catch(e){}
    setBootProgress(100,'준비 완료');hideOverlay();setBadge('',false);const a=pendingReplay;pendingReplay=null;replayAction(a);scheduleHistory(true);return true
  }catch(e){noteError('full-activation',e);hideOverlay();setBadge('기능 준비 실패 · 다시 눌러 재시도',true);if(retry){retry.style.display='inline-block';retry.onclick=()=>{fullLoading=false;fullPromise=null;activateFull(pendingReplay)}}throw e
  }finally{if(fullReady)fullLoading=false}})();return fullPromise
}
window.SAYWARD_ACTIVATE_FULL=activateFull;

async function handleEarlyAction(action){
  if(!action)return true;
  if(action.kind==='mode'){
    leanModeApply(action.mode||'day');
    trace('early-mode-ready',action.mode||'day');
    if(action.mode==='sori'||action.mode==='opic')return activateFull(action);
    hideOverlay();setBadge('',false);return true;
  }
  return activateFull(action);
}
window.SAYWARD_HANDLE_EARLY_ACTION=handleEarlyAction;
(async()=>{try{
  trace('bootstrap-start','interaction-gated enhancer');
  setBootProgress(15,'홈 화면 확장');
  await ensureFullStyles();
  const home=await attachLeanHome();
  prepareLeanHomeLayout();installLeanInterception();
  document.title='SAYWARD v'+VERSION;
  shellReady=true;currentRun.shellReady=true;currentRun.shellReadyAt=Date.now();
  document.documentElement.classList.add('saywardStaticReady');
  trace('full-home-ready','full home attached after user interaction',{homeNodes:home.getElementsByTagName('*').length});
  try{localStorage.removeItem('sayward_boot_error')}catch(e){}
  pruneDebugStorage();historyEnabled=true;scheduleHistory(true);flushBootLast();
  setTimeout(()=>hydrateLeanHomeData(),80); // APP-ONLY: landing index.html never loads this file
  window.__SAYWARD_BOOT_READY__=true;
  const early=window.__SAYWARD_EARLY_ACTION__;window.__SAYWARD_EARLY_ACTION__=null;
  if(early)await handleEarlyAction(early);else hideOverlay();
}catch(e){noteError('enhancer-bootstrap',e);hideOverlay();setBadge('기능 준비 실패 · 다시 눌러 재시도',true);flushBootLast();}
})();
})();
