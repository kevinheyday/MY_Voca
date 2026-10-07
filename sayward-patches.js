/* SAYWARD consolidated runtime patches; source order preserved. */

/* inline script 1: v532192SpeakingQuestionPlaybackStandard */

/* ===== V5.3.192 · SHARED SPEAKING QUESTION + ANSWER PLAYBACK STANDARD ===== */
(function(){
'use strict';

function studySpeakingRow192(itemOrIndex){
  const course=String(itemOrIndex?.course||ACTIVE_STUDY_COURSE||'my');
  const lesson=Number(itemOrIndex?.lesson||myClassLessonNo||1);
  const index=Number(itemOrIndex?.index ?? itemOrIndex ?? 0);
  const data=(typeof studyCourseData==='function')?studyCourseData(course,lesson):myClassData();
  return (data?.speaking||[])[index]||null;
}

function studySpeakingLead192(row){
  if(!row)return '';
  const raw=String(row.prompt||row.question||row.title||row.pattern||'').replace(/\s+/g,' ').trim();
  if(!raw)return '';
  const ans=String(row.text||'').replace(/\s+/g,' ').trim();
  if(raw.toLowerCase()===ans.toLowerCase())return '';
  return raw;
}

function studySpeakingLeadForTTS192(row){
  return studySpeakingLead192(row)
    .replace(/~ing\b/gi,'')
    .replace(/~\s*/g,'')
    .replace(/\.{3,}/g,'')
    .replace(/\s+/g,' ')
    .trim();
}

function studySpeakingLeadEl192(block){
  if(!block)return null;
  return block.querySelector('h3,.studySpeakingPatternEn')||null;
}

async function studySpeakSpeakingCard192(index,block=null){
  const row=studySpeakingRow192(index);
  if(!row)return false;
  const answerParts=myClassSplitSentences(row.text||'').filter(Boolean);
  const lead=studySpeakingLeadForTTS192(row);
  if(!lead && !answerParts.length)return false;

  myClassStop(false);
  const token=++MY_CLASS_PLAY.token;
  MY_CLASS_PLAY.active=true;
  MY_CLASS_PLAY.paused=false;
  const focusEl=block||document.getElementById(`mySpeakBlock${index}`);
  if(focusEl)myClassFocus(focusEl);
  myClassSyncButtons();

  const pause=Math.max(0,Number(loadAppSettings().myClassPause||700));
  const alive=()=>token===MY_CLASS_PLAY.token&&!MY_CLASS_PLAY.paused;

  if(lead){
    const leadEl=studySpeakingLeadEl192(focusEl);
    MY_CLASS_PLAY.currentText=lead;
    if(leadEl && !String(row.prompt||row.pattern||'').includes('~')){
      try{mvDomStartHighlight(lead,leadEl)}catch(e){}
    }
    myClassSetStatus(`SPEAKING ${Number(index)+1} · 질문`,true);
    await speakOne(lead,getSpeechRate(),'en-US');
    if(!alive())return false;
    if(pause){await new Promise(r=>setTimeout(r,Math.min(500,pause)));if(!alive())return false;}
  }

  const sentenceEls=focusEl?Array.from(focusEl.querySelectorAll('.mySpeakSentence')):[];
  for(let i=0;i<answerParts.length;i++){
    if(!alive())return false;
    const text=answerParts[i];
    MY_CLASS_PLAY.currentText=text;
    const sentenceEl=sentenceEls[i]||null;
    if(sentenceEl){try{mvDomStartHighlight(text,sentenceEl)}catch(e){}}
    try{myClassSetSpeakingKoHighlight(focusEl,i)}catch(e){}
    myClassSetStatus(`SPEAKING ${Number(index)+1} · 답변 ${i+1}/${answerParts.length}`,true);
    await speakOne(text,getSpeechRate(),'en-US');
    if(!alive())return false;
    if(i<answerParts.length-1&&pause){await new Promise(r=>setTimeout(r,Math.min(350,pause)));}
  }

  try{myClassClearSpeakingSentenceHighlight()}catch(e){}
  if(alive()){
    MY_CLASS_PLAY.active=false;
    MY_CLASS_PLAY.paused=true;
    myClassSyncButtons();
    myClassSetStatus('재생 완료',false);
  }
  return true;
}
window.studySpeakSpeakingCard192=studySpeakSpeakingCard192;
window.studySpeakingLead192=studySpeakingLead192;
window.studySpeakingLeadForTTS192=studySpeakingLeadForTTS192;

// Individual SPEAKING card button: top question/pattern cue -> model answer.
function studyBindSpeakingQuestionPlayback192(){
  if(myClassTab!=='speaking')return;
  document.querySelectorAll('#myClassPage .mySpeakBlock').forEach((block,i)=>{
    const btn=[...block.querySelectorAll('button')].find(b=>b.textContent.includes('전체 듣기'));
    if(btn){
      btn.textContent='🔊 질문 + 답변 듣기';
      btn.onclick=()=>studySpeakSpeakingCard192(i,block);
    }
  });
  const hint=document.querySelector('#myClassPage .myClassStudyHint');
  if(hint)hint.textContent='핵심 교정·Chunk는 문장 단위, 말하기는 상단 질문(또는 패턴 Cue) → 모범답안 문단 전체 순서로 재생·반복됩니다.';
  const badge=document.querySelector('#myClassPage .myClassParagraphBadge');
  document.querySelectorAll('#myClassPage .myClassParagraphBadge').forEach(x=>x.textContent='질문 + 답변 전체가 1회 반복 단위');
}
window.studyBindSpeakingQuestionPlayback192=studyBindSpeakingQuestionPlayback192;

// Wrap the final shared renderer so MY / 소리영어 / OPIC all receive the same binding.
const baseRenderMyClass192=renderMyClass;
renderMyClass=function(){
  baseRenderMyClass192();
  studyBindSpeakingQuestionPlayback192();
};

// Canonical whole-play / infinite-play engine: prepend the displayed speaking question/pattern cue.
const baseM536SpeakItem192=m536SpeakItem;
m536SpeakItem=async function(item,focusEl,guard=null){
  if(!item || item.tab!=='speaking')return baseM536SpeakItem192(item,focusEl,guard);

  const row=studySpeakingRow192(item);
  const lead=studySpeakingLeadForTTS192(row);
  const parts=myClassSplitSentences(item.text||'');
  const block=focusEl||document.getElementById(`mySpeakBlock${item.index}`);
  const alive=()=>!guard||guard();
  const pause=Math.max(0,Number(loadAppSettings().myClassPause||700));

  if(lead){
    if(!alive()){try{myClassClearSpeakingSentenceHighlight()}catch(e){}return false;}
    MY_CLASS_PLAY.currentText=lead;
    const leadEl=studySpeakingLeadEl192(block);
    if(leadEl && !String(row?.prompt||row?.pattern||'').includes('~')){
      try{mvDomStartHighlight(lead,leadEl)}catch(e){}
    }
    myClassSetStatus?.(`SPEAKING ${item.index+1} · 질문`,true);
    await speakOne(lead,getSpeechRate(),'en-US');
    if(!alive()){try{myClassClearSpeakingSentenceHighlight()}catch(e){}return false;}
    if(pause){await new Promise(r=>setTimeout(r,Math.min(500,pause)));if(!alive())return false;}
  }

  for(let i=0;i<parts.length;i++){
    if(!alive()){try{myClassClearSpeakingSentenceHighlight()}catch(e){}return false;}
    MY_CLASS_PLAY.currentText=parts[i];
    const sentenceEl=document.getElementById(`mySpeakSentence${item.index}_${i}`)||block?.querySelectorAll('.mySpeakSentence')?.[i]||null;
    if(sentenceEl){try{mvDomStartHighlight(parts[i],sentenceEl)}catch(e){}}
    try{myClassSetSpeakingKoHighlight(block,i)}catch(e){}
    myClassSetStatus?.(`SPEAKING ${item.index+1} · 답변 ${i+1}/${parts.length}`,true);
    await speakOne(parts[i],getSpeechRate(),'en-US');
    if(!alive()){try{myClassClearSpeakingSentenceHighlight()}catch(e){}return false;}
    if(i<parts.length-1&&pause){await new Promise(r=>setTimeout(r,Math.min(350,pause)));if(!alive())return false;}
  }

  try{myClassClearSpeakingSentenceHighlight()}catch(e){}
  return true;
};
window.m536SpeakItem=m536SpeakItem;

function mvSpeakingQuestionPlaybackAudit192(){
  const courses=['my','sori','opic','friends'];
  return {
    version:'v5.3.192',
    sharedCourses:courses.map(course=>({course,enabled:!!STUDY_COURSES?.[course]})),
    renderBound:renderMyClass!==baseRenderMyClass192,
    canonicalM536:m536SpeakItem!==baseM536SpeakItem192,
    individualHandler:typeof window.studySpeakSpeakingCard192==='function',
    behavior:'speaking prompt/pattern cue -> model answer'
  };
}
window.mvSpeakingQuestionPlaybackAudit192=mvSpeakingQuestionPlaybackAudit192;

setTimeout(()=>{try{studyBindSpeakingQuestionPlayback192()}catch(e){}},0);
})();



/* inline script 2: v532193SpeakingPlaybackCurrentScreenStandard */

/* ===== V5.3.194 · SPEAKING QUESTION TTS + CURRENT-SCREEN FULL PLAY STANDARD ===== */
(function(){
'use strict';

function studySpeakingRow193(itemOrIndex){
  const course=String(itemOrIndex?.course||ACTIVE_STUDY_COURSE||'my');
  const lesson=Number(itemOrIndex?.lesson||myClassLessonNo||1);
  const index=Number(itemOrIndex?.index ?? itemOrIndex ?? 0);
  const data=(typeof studyCourseData==='function')?studyCourseData(course,lesson):myClassData();
  return (data?.speaking||[])[index]||null;
}

function studySpeakingQuestion193(row,block=null){
  if(!row)return '';
  let text=String(row.prompt||row.question||row.q||row.cue||'').replace(/\s+/g,' ').trim();
  // Pattern-speaking courses may use a pattern cue instead of a literal question.
  if(!text)text=String(row.pattern||'').replace(/\s+/g,' ').trim();
  // Final DOM fallback keeps TTS aligned with exactly what the learner sees.
  if(!text && block){
    text=String(block.querySelector('h3')?.textContent||block.querySelector('.studySpeakingPatternEn')?.textContent||'')
      .replace(/\s+/g,' ').trim();
  }
  const answer=String(row.text||'').replace(/\s+/g,' ').trim();
  if(text && text.toLowerCase()===answer.toLowerCase())return '';
  return text
    .replace(/~ing\b/gi,'')
    .replace(/~\s*/g,'')
    .replace(/\.{3,}/g,'')
    .replace(/\s+/g,' ')
    .trim();
}
window.studySpeakingQuestion193=studySpeakingQuestion193;

function studySpeakingQuestionEl193(block){
  if(!block)return null;
  const h3=block.querySelector('h3');
  if(h3)return h3;
  return block.querySelector('.studySpeakingPatternEn')||null;
}

async function studySpeakQuestionThenAnswer193(item,focusEl,guard=null){
  const row=studySpeakingRow193(item);
  if(!row)return false;
  const block=focusEl||document.getElementById(`mySpeakBlock${item.index}`);
  const question=studySpeakingQuestion193(row,block);
  const parts=myClassSplitSentences(String(row.text||item.text||'')).filter(Boolean);
  const alive=()=>!guard||guard();
  const pause=Math.max(0,Number(loadAppSettings().myClassPause||700));

  // Question is a first-class TTS item. Unlock before queueing it and give Android/Samsung
  // speech synthesis a short stabilization gap before the answer begins.
  if(question){
    if(!alive())return false;
    // Do not enqueue a silent unlock here: on Android it can swallow the first audible question.
    try{if(window.speechSynthesis?.paused)window.speechSynthesis.resume()}catch(e){}
    MY_CLASS_PLAY.currentText=question;
    const qEl=studySpeakingQuestionEl193(block);
    myClassSetStatus?.(`SPEAKING ${item.index+1} · 질문`,true);
    await speakOne(question,getSpeechRate(),'en-US',qEl);
    if(!alive())return false;
    await new Promise(r=>setTimeout(r,Math.max(220,Math.min(650,pause||220))));
    if(!alive())return false;
  }

  for(let i=0;i<parts.length;i++){
    if(!alive())return false;
    const text=parts[i];
    MY_CLASS_PLAY.currentText=text;
    const sentenceEl=document.getElementById(`mySpeakSentence${item.index}_${i}`)||block?.querySelectorAll('.mySpeakSentence')?.[i]||null;
    myClassSetStatus?.(`SPEAKING ${item.index+1} · 답변 ${i+1}/${parts.length}`,true);
    await speakOne(text,getSpeechRate(),'en-US',sentenceEl);
    if(!alive())return false;
    try{myClassSetSpeakingKoHighlight(block,i)}catch(e){}
    if(i<parts.length-1&&pause){
      await new Promise(r=>setTimeout(r,Math.min(350,pause)));
      if(!alive())return false;
    }
  }
  try{myClassClearSpeakingSentenceHighlight()}catch(e){}
  return true;
}
window.studySpeakQuestionThenAnswer193=studySpeakQuestionThenAnswer193;

// Replace the final canonical item speaker so full play, infinite repeat, MY, SORI and OPIC
// all use exactly the same question/cue -> answer sequence.
const baseM536SpeakItem193=m536SpeakItem;
m536SpeakItem=async function(item,focusEl,guard=null){
  if(item?.tab==='speaking'){
    try{unlockTTSFromGesture?.()}catch(e){}
    await new Promise(r=>setTimeout(r,260));
    if(guard&&!guard())return false;
    return studySpeakQuestionThenAnswer193(item,focusEl,guard);
  }
  return baseM536SpeakItem193(item,focusEl,guard);
};
window.m536SpeakItem=m536SpeakItem;

async function studySpeakSpeakingCard193(index,block=null){
  const course=String(ACTIVE_STUDY_COURSE||'my');
  const item=m536MakeItem(course,myClassLessonNo,'speaking',Number(index)||0);
  if(!item)return false;
  myClassStop(false);
  const token=++MY_CLASS_PLAY.token;
  MY_CLASS_PLAY.active=true;
  MY_CLASS_PLAY.paused=false;
  const focusEl=block||document.getElementById(`mySpeakBlock${index}`);
  if(focusEl)myClassFocus?.(focusEl);
  // v5.3.275: unlock from the same tap, then let Samsung/content:// TTS settle
  // BEFORE the first audible item (the question/cue) is queued.
  try{unlockTTSFromGesture?.()}catch(e){}
  try{if(window.speechSynthesis?.paused)window.speechSynthesis.resume()}catch(e){}
  myClassSyncButtons?.();
  const alive=()=>token===MY_CLASS_PLAY.token&&!MY_CLASS_PLAY.paused;
  await new Promise(r=>setTimeout(r,260));
  if(!alive())return false;
  const ok=await studySpeakQuestionThenAnswer193(item,focusEl,alive);
  if(alive()){
    MY_CLASS_PLAY.active=false;
    MY_CLASS_PLAY.paused=true;
    myClassSyncButtons?.();
    myClassSetStatus?.(ok?'재생 완료':'재생 정지',false);
  }
  return ok;
}
window.studySpeakSpeakingCard193=studySpeakSpeakingCard193;

function mvSpeakingQuestionAudioAudit238(){
  return {
    version:'v5.3.275',
    order:'question/cue -> answer',
    androidContentFix:'silent unlock settles before first audible question',
    shared:['my','sori','opic','full','infinite']
  };
}
window.mvSpeakingQuestionAudioAudit238=mvSpeakingQuestionAudioAudit238;

function mvSpeakingQuestionFirstAudit236(){
  const courses=['my','sori','opic','friends'];
  return {
    version:'v5.3.275',
    courses:courses,
    individualButton:'studySpeakSpeakingCard193',
    repeatEngine:'studySpeakQuestionThenAnswer193',
    behavior:'question/cue -> answer sentences'
  };
}
window.mvSpeakingQuestionFirstAudit236=mvSpeakingQuestionFirstAudit236;

function studyBindSpeakingPlayback193(){
  if(myClassTab!=='speaking')return;
  document.querySelectorAll('#myClassPage .mySpeakBlock').forEach((block,i)=>{
    const btn=[...block.querySelectorAll('button')].find(b=>b.textContent.includes('전체 듣기')||b.textContent.includes('질문 + 문단'));
    if(btn){
      btn.textContent='🔊 질문 + 답변 듣기';
      btn.onclick=(e)=>{e?.preventDefault?.();e?.stopPropagation?.();studySpeakSpeakingCard193(i,block);};
    }
  });
  document.querySelectorAll('#myClassPage .myClassParagraphBadge').forEach(x=>x.textContent='질문 + 답변 전체가 1회 반복 단위');
}
window.studyBindSpeakingPlayback193=studyBindSpeakingPlayback193;

const baseRenderMyClass193=renderMyClass;
renderMyClass=function(){
  baseRenderMyClass193();
  studyBindSpeakingPlayback193();
};

function m536VisibleCardIndex193(tab){
  const selector=tab==='corrections'?'.myStudyCard[id^="myCorrectionCard"]'
    :tab==='chunks'?'.myStudyCard[id^="myChunkCard"]'
    :tab==='speaking'?'.mySpeakBlock[id^="mySpeakBlock"]':null;
  if(!selector)return 0;
  const cards=[...document.querySelectorAll(`#myClassContent ${selector}`)];
  if(!cards.length)return 0;
  const vh=window.innerHeight||document.documentElement.clientHeight||800;
  // Prefer the first card whose center is currently on screen. This also makes replay
  // start naturally from where the learner has scrolled, not merely from item #1.
  let chosen=cards.find(el=>{const r=el.getBoundingClientRect();const c=(r.top+r.bottom)/2;return c>=80&&c<=vh-80;});
  if(!chosen)chosen=cards.find(el=>{const r=el.getBoundingClientRect();return r.bottom>80&&r.top<vh;})||cards[0];
  const m=String(chosen.id||'').match(/(\d+)$/);
  return m?Number(m[1])||0:0;
}

function m536CurrentScreenStartIndex193(course=ACTIVE_STUDY_COURSE){
  const c=String(course||'my');
  const list=m536BuildPlaylist(c);
  if(!list.length)return 0;
  const lesson=Number(myClassLessonNo||list[0].lesson||1);
  const tab=String(myClassTab||studyCourseOrder(c)[0]||'corrections');
  const visibleIndex=m536VisibleCardIndex193(tab);
  let pos=list.findIndex(x=>Number(x.lesson)===lesson&&String(x.tab)===tab&&Number(x.index)===visibleIndex);
  if(pos<0)pos=list.findIndex(x=>Number(x.lesson)===lesson&&String(x.tab)===tab);
  if(pos<0)pos=list.findIndex(x=>Number(x.lesson)===lesson);
  return pos<0?0:pos;
}
window.m536CurrentScreenStartIndex193=m536CurrentScreenStartIndex193;

// Global ▶ button standard: if playback is stopped, start from the tab/card currently
// visible. If it was explicitly paused, resume the saved playback position as before.
const baseM536ResumeGlobal193=m536ResumeGlobal;
m536ResumeGlobal=function(){
  const pausedMode=String(M536_TOGGLE_STATE.pausedMode||'idle');
  const course=String(ACTIVE_STUDY_COURSE||M536.course||'my');
  const chosen=m536Lessons(course);
  if(!chosen.length){
    myClassSetStatus?.('재생할 선택 항목이 없습니다',false);
    myClassSyncButtons?.();
    return false;
  }

  // Resume only when the learner is still looking at the same lesson/tab that was paused.
  // If they moved to another tab (e.g. 핵심 교정 -> 말하기), the visible screen wins.
  if(pausedMode==='full'){
    const pausedCourse=String(M536_TOGGLE_STATE.pausedCourse||course);
    const pausedList=m536BuildPlaylist(pausedCourse);
    const pausedItem=pausedList[Math.max(0,Number(M536_TOGGLE_STATE.pausedCursor)||0)]||null;
    const sameScreen=pausedCourse===course && pausedItem &&
      Number(pausedItem.lesson)===Number(myClassLessonNo) &&
      String(pausedItem.tab)===String(myClassTab);
    if(sameScreen)return baseM536ResumeGlobal193();
  }else if(pausedMode==='infinite'){
    const x=M536_TOGGLE_STATE.pausedInfiniteItem;
    const sameScreen=x && String(x.course||course)===course &&
      Number(x.lesson)===Number(myClassLessonNo) &&
      String(x.tab)===String(myClassTab);
    if(sameScreen)return baseM536ResumeGlobal193();
  }

  // New start or screen changed after a stop: start exactly from the current visible card.
  M536_TOGGLE_STATE.pausedMode='idle';
  M536_TOGGLE_STATE.pausedInfiniteItem=null;
  M536.course=course;
  const startAt=m536CurrentScreenStartIndex193(course);
  m536RunFull(startAt);
  return true;
};
window.m536ResumeGlobal=m536ResumeGlobal;

m536ToggleGlobalPlayback=function(){
  if(m536IsPlaying())return m536PauseGlobal();
  return m536ResumeGlobal();
};
window.m536ToggleGlobalPlayback=m536ToggleGlobalPlayback;

function mvSpeakingPlaybackAudit193(){
  const course=String(ACTIVE_STUDY_COURSE||'my');
  const row=studySpeakingRow193({course,lesson:myClassLessonNo,index:0});
  return {
    version:'v5.3.196',
    questionDetected:studySpeakingQuestion193(row),
    currentCourse:course,
    currentLesson:myClassLessonNo,
    currentTab:myClassTab,
    currentStartIndex:m536CurrentScreenStartIndex193(course),
    canonicalQuestionThenAnswer:m536SpeakItem!==baseM536SpeakItem193,
    sharedCourses:['my','sori','opic','friends'].map(x=>({course:x,enabled:!!STUDY_COURSES?.[x]})),
    behavior:'idle 전체 재생 = current visible tab/card; paused 전체 재생 = resume saved cursor'
  };
}
window.mvSpeakingPlaybackAudit193=mvSpeakingPlaybackAudit193;

setTimeout(()=>{try{studyBindSpeakingPlayback193()}catch(e){}},0);
})();



/* inline script 3: v53197PatternGrammarSlotStandard */

/* ===== V5.3.275 · PATTERN GRAMMAR-SLOT HIGHLIGHT STANDARD =====
   All courses use studyFindPatternHits(). Grammar labels such as S/V/O/C/A/B
   are placeholders only; actual sentence words are highlighted instead.
*/
function mvPatternGrammarSlotAudit197(){
  const cases=[
    ['wonder whether S would ~','I wonder whether I would be satisfied.'],
    ['so that S can V','I work extra hours so that we can make ends meet.'],
    ['the thought that S might ~','The thought that I might look younger was tempting.'],
    ['remind A of B','It reminds me of her.'],
    ['make someone think that ~','Seeing them makes me think that natural aging may be better.']
  ];
  const rows=cases.map(([pattern,text])=>({pattern,text,fixedParts:studyPatternFixedParts(pattern),hits:studyFindPatternHits(text,pattern)}));
  return {version:'v5.3.275',rule:'S/V/O/C/A/B are grammar slots, never literal match tokens',passed:rows.every(r=>r.hits.length>0),rows};
}
window.mvPatternGrammarSlotAudit197=mvPatternGrammarSlotAudit197;



/* inline script 4: unnamed */

/* ===== V5.3.275 · OPIC REGISTRY CARD AUDIT ===== */
window.mvOpicRegistryAudit202=function(){
  const meta=studyCourseMeta('opic')||{};
  const lessons=Object.keys(meta).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
  return {
    version:'v5.3.275',
    lessons,
    lessonCount:studyCourseLessonCount('opic'),
    cards:[...document.querySelectorAll('#homePage .opicClassSection .opicCourseCard')].map(c=>({id:c.id,lesson:Number(c.dataset.studyLesson),title:c.querySelector('.myClassTop b')?.textContent||''})),
    selected:studyCourseSelectedLessons('opic')
  };
};



/* inline script 5: v532211CrossCourseAudit */

window.mvAllRepeatAudit211=function(){
  const mode=typeof currentHomeStudyMode==='function'?currentHomeStudyMode():'day';
  const selections={};
  try{selections.day=[...document.querySelectorAll('.daySelectCheck:checked')].map(x=>Number(x.dataset.checkDay))}catch(e){selections.day=[]}
  for(const c of ['my','sori','opic','friends']){
    try{selections[c]=studyCourseSelectedLessons(c)}catch(e){selections[c]=[]}
  }
  return {
    version:'v5.3.275',
    currentMode:mode,
    queue:typeof allRepeatQueue209==='function'?allRepeatQueue209(mode):[],
    selections,
    active:!!window.MV_ALL_REPEAT_209?.active,
    current:window.MV_ALL_REPEAT_209?.current||''
  };
};



/* inline script 6: v532212AllRepeatAudit */

window.mvAllRepeatAudit212=function(){
  const mode=window.currentHomeStudyMode212?.()||window.MV_HOME_MODE_212||'day';
  const selected={};
  try{selected.day=[...document.querySelectorAll('.daySelectCheck:checked')].map(x=>Number(x.dataset.checkDay))}catch(e){selected.day=[]}
  for(const c of ['my','sori','opic','friends']){
    try{selected[c]=studyCourseSelectedLessons(c)}catch(e){selected[c]=[]}
  }
  return {
    version:'v5.3.275',
    startMode:mode,
    active:!!window.MV_ALL_REPEAT_209?.active,
    current:window.MV_ALL_REPEAT_209?.current||'',
    queue:[...(window.MV_ALL_REPEAT_209?.queue||[])],
    selected,
    dayPass:typeof AUTO!=='undefined'?AUTO.pass:null,
    dayRepeats:typeof AUTO!=='undefined'?AUTO.repeats:null
  };
};



/* inline script 7: v532213AllRepeatAudit */

window.mvAllRepeatAudit213=function(){
  const map={homeModeDay:'day',homeModeMy:'my',homeModeSori:'sori',homeModeOpic:'opic',homeModeFriends:'friends'};
  const active=document.querySelector('#homeStudyModePanel .homeStudyModeBtn.active');
  const selected={};
  try{selected.day=JSON.parse(localStorage.getItem(selectedDaysKey())||'[]')}catch(e){selected.day=[]}
  for(const c of ['my','sori','opic','friends']){try{selected[c]=studyCourseSelectedLessons(c)}catch(e){selected[c]=[]}}
  return {version:'v5.3.275',visibleMode:map[active?.id]||null,savedMode:localStorage.getItem('mv_homeStudyMode212'),
    queue:[...(window.MV_ALL_REPEAT_209?.queue||[])],current:window.MV_ALL_REPEAT_209?.current||'',
    active:!!window.MV_ALL_REPEAT_209?.active,selected,dayActive:typeof AUTO!=='undefined'?AUTO.active:null,
    dayPass:typeof AUTO!=='undefined'?AUTO.pass:null,dayRepeats:typeof AUTO!=='undefined'?AUTO.repeats:null};
};



/* inline script 8: v532214AllRepeatAudit */

window.mvAllRepeatAudit214=function(){
  const a=document.querySelector('#homeStudyModePanel .homeStudyModeBtn.active');
  const map={homeModeDay:'day',homeModeMy:'my',homeModeSori:'sori',homeModeOpic:'opic',homeModeFriends:'friends'};
  return {
    version:'v5.3.275',
    visibleMode:map[a?.id]||null,
    enabled:!!document.getElementById('homeAllRepeat209')?.checked,
    active:!!window.MV_ALL_REPEAT_209?.active,
    current:window.MV_ALL_REPEAT_209?.current||'',
    queue:[...(window.MV_ALL_REPEAT_209?.queue||[])],
    startFn:typeof window.startAllRepeat209,
    stopFn:typeof window.allRepeatStop209,
    toggleFn:typeof window.toggleAllRepeat214
  };
};



/* inline script 9: v532215DayHandoffWatch */

(function(){
  let wasDayActive=false;
  setInterval(()=>{
    const s=window.MV_ALL_REPEAT_215;
    if(!s?.active||s.current!=='day'){wasDayActive=false;return}
    const now=!!(typeof AUTO!=='undefined'&&AUTO.active);
    if(wasDayActive&&!now&&!s.advancing)setTimeout(()=>window.allRepeatAdvance215?.(),100);
    wasDayActive=now;
  },400);
})();



/* inline script 10: v532215AllRepeatAudit */

window.mvAllRepeatAudit215=function(){
  const s=window.MV_ALL_REPEAT_215||{};
  return {version:'v5.3.275',active:!!s.active,current:s.current||'',queue:[...(s.queue||[])],index:s.index||0,cycle:s.cycle||0,
    advancing:!!s.advancing,snapshots:s.snapshots||null,dayActive:typeof AUTO!=='undefined'?AUTO.active:null,
    dayPass:typeof AUTO!=='undefined'?AUTO.pass:null,dayRepeats:typeof AUTO!=='undefined'?AUTO.repeats:null,
    m536Mode:typeof M536!=='undefined'?M536.mode:null,m536Course:typeof M536!=='undefined'?M536.course:null,
    m536Cursor:typeof M536!=='undefined'?M536.cursor:null};
};



/* inline script 11: v532216AllRepeatTrace */

window.MV_ALL_REPEAT_TRACE_216=[];
window.mvAllRepeatTrace216=function(event,extra={}){
  const s=window.MV_ALL_REPEAT_215||{};
  const row={t:Date.now(),event,current:s.current||'',index:s.index||0,queue:[...(s.queue||[])],...extra};
  window.MV_ALL_REPEAT_TRACE_216.push(row);
  if(window.MV_ALL_REPEAT_TRACE_216.length>80)window.MV_ALL_REPEAT_TRACE_216.shift();
  return row;
};



/* inline script 12: v532217DayAdvanceAudit */

window.mvDayAdvanceAudit217=function(){
  return {
    version:'v5.3.275',
    integrated:!!window.MV_ALL_REPEAT_215?.active,
    currentCourse:window.MV_ALL_REPEAT_215?.current||'',
    queue:[...(window.MV_ALL_REPEAT_215?.queue||[])],
    queueIndex:window.MV_ALL_REPEAT_215?.index??null,
    autoActive:typeof AUTO!=='undefined'?AUTO.active:null,
    autoPass:typeof AUTO!=='undefined'?AUTO.pass:null,
    autoRepeats:typeof AUTO!=='undefined'?AUTO.repeats:null,
    cardIndex:typeof i!=='undefined'?i:null,
    deckLength:typeof deck!=='undefined'?deck.length:null,
    currentKey:(typeof cur==='function'&&cur())?cardKey(cur()):null,
    renderedKey:typeof __renderedCardKey!=='undefined'?__renderedCardKey:null,
    renderVersion:typeof __renderVersion!=='undefined'?__renderVersion:null
  };
};



/* inline script 13: v532219AllRepeatAudit */

window.mvAllRepeatAudit219=function(){
  const s=window.MV_ALL_REPEAT_219||{};
  return {
    version:'v5.3.275',active:!!s.active,current:s.current||'',queue:[...(s.queue||[])],
    index:s.index??null,snapshot:s.snapshot||null,
    dayHook:typeof window.MV_DAY_ONCE_COMPLETE_219,
    courseHook:typeof window.MV_COURSE_ONCE_COMPLETE_219,
    autoActive:typeof AUTO!=='undefined'?AUTO.active:null,
    m536Mode:typeof M536!=='undefined'?M536.mode:null,
    m536Course:typeof M536!=='undefined'?M536.course:null
  };
};



/* inline script 14: v532220AllRepeatTrace */

(function(){
  window.MV_ALL_REPEAT_TRACE_220=[];
  window.mvAllRepeatTrace220=function(event,extra={}){
    const s=window.MV_ALL_REPEAT_219||{};
    const row={
      t:Date.now(),event,active:!!s.active,current:s.current||'',
      index:s.index??null,queue:[...(s.queue||[])],
      homeHidden:document.getElementById('homePage')?.classList.contains('hidden')??null,
      myPageHidden:document.getElementById('myClassPage')?.classList.contains('hidden')??null,
      autoActive:typeof AUTO!=='undefined'?AUTO.active:null,
      m536Mode:typeof M536!=='undefined'?M536.mode:null,
      m536Course:typeof M536!=='undefined'?M536.course:null,
      ...extra
    };
    window.MV_ALL_REPEAT_TRACE_220.push(row);
    if(window.MV_ALL_REPEAT_TRACE_220.length>100)window.MV_ALL_REPEAT_TRACE_220.shift();
    return row;
  };
})();



/* inline script 15: v532221ControllerAudit */

window.mvControllerAudit221=function(){
  const b=document.getElementById('homeAllRepeatStart210');
  return {
    version:'v5.3.275',
    buttonText:b?.textContent||'',
    v209:!!window.MV_ALL_REPEAT_209?.active,
    v215:!!window.MV_ALL_REPEAT_215?.active,
    v219:!!window.MV_ALL_REPEAT_219?.active,
    current219:window.MV_ALL_REPEAT_219?.current||'',
    queue219:[...(window.MV_ALL_REPEAT_219?.queue||[])],
    soriStored:(()=>{try{return JSON.parse(localStorage.getItem('mv_studySelected_sori')||'[]')}catch(e){return []}})(),
    soriChecked:[...document.querySelectorAll('#homePage .soriClassSection .studySelectCheck[data-study-mode="sori"]:checked')].map(x=>Number(x.dataset.studyId)),
    dayHook:typeof window.MV_DAY_ONCE_COMPLETE_219,
    courseHook:typeof window.MV_COURSE_ONCE_COMPLETE_219,
    m536Mode:typeof M536!=='undefined'?M536.mode:null,
    m536Course:typeof M536!=='undefined'?M536.course:null
  };
};



/* inline script 16: v532222OverallIsolationAudit */

window.mvOverallIsolationAudit222=function(){
  const s=window.MV_ALL_REPEAT_219||{};
  return {
    version:'v5.3.275',
    active:!!s.active,current:s.current||'',queue:[...(s.queue||[])],index:s.index??null,
    snapshot:s.snapshot||null,
    internalStart:!!window.MV_ALL_REPEAT_INTERNAL_START_222,
    dayHook:typeof window.MV_DAY_ONCE_COMPLETE_219,
    courseHook:typeof window.MV_COURSE_ONCE_COMPLETE_219,
    lastError:window.MV_ALL_REPEAT_LAST_ERROR_222||'',
    autoActive:typeof AUTO!=='undefined'?AUTO.active:null,
    autoPass:typeof AUTO!=='undefined'?AUTO.pass:null,
    autoRepeats:typeof AUTO!=='undefined'?AUTO.repeats:null,
    m536Mode:typeof M536!=='undefined'?M536.mode:null,
    m536Course:typeof M536!=='undefined'?M536.course:null
  };
};



/* inline script 17: v532239StudyFavoriteStandard */

/* ===== V5.3.275 · CORRECTION / CHUNK / SPEAKING FAVORITE STANDARD ===== */
(function(){
'use strict';
const MV_STUDY_FAVORITES_KEY_239='mv_study_favorites_239';

function studyFavoriteHash239(text){
  let h=2166136261>>>0;
  const s=String(text||'');
  for(let i=0;i<s.length;i++){
    h^=s.charCodeAt(i);
    h=Math.imul(h,16777619)>>>0;
  }
  return h.toString(36);
}
function studyFavoriteRow239(course,lesson,tab,index){
  try{
    const d=studyCourseData(course,Number(lesson))||{};
    const rows=tab==='corrections'?(d.corrections||[])
      :tab==='chunks'?(d.chunks||[])
      :tab==='speaking'?(d.speaking||[])
      :[];
    return rows[Number(index)]||null;
  }catch(e){return null}
}
function studyFavoriteKey239(course,lesson,tab,index){
  const row=studyFavoriteRow239(course,lesson,tab,index)||{};
  const signature=tab==='corrections'
    ? `${row.en||''}|${row.bad||''}`
    :tab==='chunks'
      ? `${row.pattern||''}|${row.example||''}`
      :`${row.prompt||row.question||row.pattern||''}|${row.text||''}`;
  return `${String(course||'my')}|${Number(lesson)||1}|${String(tab||'')}|${studyFavoriteHash239(signature)}`;
}
function studyFavoriteSet239(){
  try{
    const a=JSON.parse(localStorage.getItem(MV_STUDY_FAVORITES_KEY_239)||'[]');
    return new Set(Array.isArray(a)?a:[]);
  }catch(e){return new Set()}
}
function studyFavoriteSave239(set){
  try{localStorage.setItem(MV_STUDY_FAVORITES_KEY_239,JSON.stringify([...set]))}catch(e){}
}
function studyFavoriteHas239(course,lesson,tab,index){
  return studyFavoriteSet239().has(studyFavoriteKey239(course,lesson,tab,index));
}
function studyFavoriteHasItem239(item){
  if(!item)return false;
  return studyFavoriteHas239(item.course||ACTIVE_STUDY_COURSE,item.lesson,item.tab,item.index);
}
function studyFavoriteToggle239(course,lesson,tab,index){
  const key=studyFavoriteKey239(course,lesson,tab,index);
  const set=studyFavoriteSet239();
  if(set.has(key))set.delete(key);else set.add(key);
  studyFavoriteSave239(set);
  studyFavoriteDecorateCards239();
  try{studyFavoriteSyncStartLabel239(currentHomeStudyMode?.()||course)}catch(e){}
  return set.has(key);
}
function studyFavoriteButton239(course,lesson,tab,index,card){
  if(!card)return;
  const key=studyFavoriteKey239(course,lesson,tab,index);
  let b=card.querySelector('.studyFavoriteBtn239');
  if(!b){
    b=document.createElement('button');
    b.type='button';
    b.className='studyFavoriteBtn239';
    b.innerHTML='<span class="star">☆</span><span class="label">즐겨찾기</span>';
    b.addEventListener('click',(e)=>{
      e.preventDefault();
      e.stopPropagation();
      studyFavoriteToggle239(course,lesson,tab,index);
    });
    card.appendChild(b);
  }
  b.dataset.favoriteKey=key;
  const on=studyFavoriteSet239().has(key);
  b.classList.toggle('active',on);
  b.setAttribute('aria-pressed',on?'true':'false');
  b.setAttribute('aria-label',on?'즐겨찾기 해제':'즐겨찾기 추가');
  const star=b.querySelector('.star');if(star)star.textContent=on?'★':'☆';
  card.classList.toggle('studyFavoriteCard239',on);
}
function studyFavoriteDecorateCards239(){
  const course=String(ACTIVE_STUDY_COURSE||'my');
  const lesson=Number(myClassLessonNo||1);
  const tab=String(myClassTab||'');
  if(!['corrections','chunks','speaking'].includes(tab))return;
  const d=studyCourseData(course,lesson)||{};
  const rows=tab==='corrections'?(d.corrections||[])
    :tab==='chunks'?(d.chunks||[])
    :(d.speaking||[]);
  rows.forEach((_,i)=>{
    const card=document.getElementById(
      tab==='corrections'?`myCorrectionCard${i}`:
      tab==='chunks'?`myChunkCard${i}`:`mySpeakBlock${i}`
    );
    studyFavoriteButton239(course,lesson,tab,i,card);
  });
}
function studyFavoriteOnly239(mode){
  if(!['my','sori','opic','friends'].includes(String(mode||'')))return false;
  return localStorage.getItem(`mv_study_favorite_only_239_${mode}`)==='1';
}
function studyFavoriteSetOnly239(mode,on){
  if(!['my','sori','opic','friends'].includes(String(mode||'')))return;
  try{localStorage.setItem(`mv_study_favorite_only_239_${mode}`,on?'1':'0')}catch(e){}
}
function studyFavoriteRenderFilter239(mode,box){
  if(!box)return;
  const favoriteMode=['my','sori','opic','friends'].includes(String(mode||''));
  box.classList.toggle('favoriteOnly239',studyFavoriteOnly239(mode));
  box.classList.toggle('hasFavorite239',favoriteMode);
  box.querySelector('.studyFavoriteOnly239')?.remove();
  if(!favoriteMode)return;
  const checks=box.querySelector('.rp206Checks');
  if(!checks)return;
  const label=document.createElement('label');
  label.className='studyFavoriteOnly239';
  label.innerHTML=`<input type="checkbox" data-favorite-only-239="1" ${studyFavoriteOnly239(mode)?'checked':''}><span>즐겨찾기만</span>`;
  checks.appendChild(label);
  const input=label.querySelector('input');
  input.onchange=()=>{
    studyFavoriteSetOnly239(mode,input.checked);
    box.classList.toggle('favoriteOnly239',input.checked);
    studyFavoriteSyncStartLabel239(mode);
  };
}
function studyFavoriteSyncStartLabel239(mode){
  const start=document.getElementById('sharedStudyStart');
  if(!start||!['my','sori','opic','friends'].includes(String(mode||'')))return;
  if(studyFavoriteOnly239(mode)){
    start.textContent='즐겨찾기 집중 반복';
  }
}
function studyFavoriteCount239(course){
  const lessons=typeof studyCourseSelectedLessons==='function'?studyCourseSelectedLessons(course):[];
  let n=0;
  for(const lesson of lessons){
    const d=studyCourseData(course,lesson)||{};
    for(const tab of ['corrections','chunks','speaking']){
      const rows=tab==='corrections'?(d.corrections||[]):tab==='chunks'?(d.chunks||[]):(d.speaking||[]);
      rows.forEach((_,i)=>{if(studyFavoriteHas239(course,lesson,tab,i))n++});
    }
  }
  return n;
}

window.studyFavoriteHash239=studyFavoriteHash239;
window.studyFavoriteKey239=studyFavoriteKey239;
window.studyFavoriteHas239=studyFavoriteHas239;
window.studyFavoriteHasItem239=studyFavoriteHasItem239;
window.studyFavoriteToggle239=studyFavoriteToggle239;
window.studyFavoriteDecorateCards239=studyFavoriteDecorateCards239;
window.studyFavoriteOnly239=studyFavoriteOnly239;
window.studyFavoriteSetOnly239=studyFavoriteSetOnly239;
window.studyFavoriteRenderFilter239=studyFavoriteRenderFilter239;
window.studyFavoriteSyncStartLabel239=studyFavoriteSyncStartLabel239;
window.studyFavoriteCount239=studyFavoriteCount239;

/* Always re-attach stars after the shared renderer rebuilds a tab. */
const prevRender239=window.renderMyClass;
window.renderMyClass=function(){
  const r=prevRender239.apply(this,arguments);
  try{studyFavoriteDecorateCards239()}catch(e){}
  return r;
};

/* Also restore stars after delayed decorators alter speaking cards. */
document.addEventListener('click',(e)=>{
  if(e.target?.closest?.('.myClassTab,.studyFavoriteBtn239'))setTimeout(studyFavoriteDecorateCards239,30);
},true);

window.mvStudyFavoriteAudit239=function(){
  return {
    version:'v5.3.275',
    storage:MV_STUDY_FAVORITES_KEY_239,
    tabs:['corrections','chunks','speaking'],
    courses:['my','sori','opic','friends'],
    favoriteOnly:{
      my:studyFavoriteOnly239('my'),
      sori:studyFavoriteOnly239('sori'),
      opic:studyFavoriteOnly239('opic')
    }
  };
};
})();



/* inline script 18: v532241Sori3VisibilityAudit */

window.mvSori3VisibilityAudit241=function(){
  const card=document.getElementById('soriGroup3Card');
  const sec=document.querySelector('.soriClassSection');
  return {version:'v5.3.275',cardExists:!!card,insideSori:!!card&&card.closest('.soriClassSection')===sec,
    lesson:studyCardCourseLesson(card)?.lesson||0,lessonCount:studyCourseLessonCount('sori')};
};



/* inline script 19: v532246FreeDragPage */

(function(){
'use strict';
let S=null;

function topNow246(){
  try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(e){window.scrollTo(0,0)}
  try{document.documentElement.scrollTop=0;document.body.scrollTop=0}catch(e){}
}
window.mvStudyScrollTopInstant242=topNow246;

function canGo246(dir){
  const tabs=(typeof studyCourseOrder==='function'?studyCourseOrder(ACTIVE_STUDY_COURSE):['corrections','chunks','speaking','habits']).filter(Boolean);
  let i=tabs.indexOf(myClassTab); if(i<0)i=0;
  const lesson=Number(myClassLessonNo)||1;
  const max=(typeof studyCourseLessonCount==='function'?studyCourseLessonCount(ACTIVE_STUDY_COURSE):1)||1;
  const ni=i+dir;
  if(ni>=0&&ni<tabs.length)return true;
  if(ni<0)return lesson>1;
  return lesson<max;
}

function makeSnapshot246(){
  const page=document.getElementById('myClassPage');
  if(!page)return null;
  const scrollY=window.scrollY||document.documentElement.scrollTop||0;
  const clone=page.cloneNode(true);
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  clone.querySelectorAll('button,input,select,textarea,a').forEach(el=>el.setAttribute('tabindex','-1'));
  // Snapshot cleanup: fixed/floating controls are already present on the real destination page.
  // Hiding only these duplicated overlay controls keeps the moving page edge clean.
  clone.querySelectorAll('[style*="position: fixed"],[style*="position:fixed"],.floatingControls,.fixedBottom,.bottomDock').forEach(el=>{
    el.style.visibility='hidden';
  });
  clone.style.pointerEvents='none';
  clone.style.margin='0';
  clone.style.width='100vw';

  const inner=document.createElement('div');
  inner.className='mvSwipeCardInner246';
  inner.style.top=(-scrollY)+'px';
  inner.appendChild(clone);
  return inner;
}

function cleanup246(s=S){
  if(!s)return;
  try{s.stage?.remove()}catch(e){}
  document.body.classList.remove('mvSwipeActive246');
  if(S===s)S=null;
}

function begin246(dir,x,y){
  if(S||!canGo246(dir))return false;
  const inner=makeSnapshot246(); if(!inner)return false;

  const stage=document.createElement('div'); stage.className='mvSwipeStage246';
  const card=document.createElement('div'); card.className='mvSwipeCard246 '+(dir>0?'next':'prev');
  const shade=document.createElement('div'); shade.className='mvSwipeShade246';
  card.append(inner,shade); stage.appendChild(card); document.body.appendChild(stage);
  document.body.classList.add('mvSwipeActive246');

  S={dir,startX:x,startY:y,lastX:x,lastY:y,lastT:performance.now(),dx:0,dy:0,vx:0,vy:0,stage,card,shade,ending:false};
  return true;
}

function move246(x,y){
  if(!S||S.ending)return false;
  const now=performance.now();
  let dx=x-S.startX, dy=y-S.startY;

  // Page direction remains left/right, but vertical movement follows the finger freely.
  if(S.dir>0)dx=Math.min(0,dx); else dx=Math.max(0,dx);
  dy=Math.max(-window.innerHeight*.42,Math.min(window.innerHeight*.42,dy));

  const dt=Math.max(1,now-S.lastT);
  S.vx=S.vx*.62+((x-S.lastX)/dt)*.38;
  S.vy=S.vy*.62+((y-S.lastY)/dt)*.38;
  S.lastX=x; S.lastY=y; S.lastT=now; S.dx=dx; S.dy=dy;

  const w=Math.max(1,window.innerWidth), h=Math.max(1,window.innerHeight);
  const px=Math.min(1,Math.abs(dx)/w), py=Math.min(.42,Math.abs(dy)/h);
  // Tilt follows vertical finger position like a physical card.
  // Vertical gesture direction controls the card tilt sign.
  // Upward drag => one tilt direction, downward drag => the exact opposite.
  const verticalSign=dy<0?-1:(dy>0?1:0);
  const tiltMag=2.2 + 10.5*Math.min(.42,Math.abs(dy)/h) + 2.5*px;
  const horizontalMirror=(S.dir>0?1:-1);
  const z=verticalSign===0
    ? (S.dir>0?-1:1)*1.2
    : verticalSign*tiltMag*horizontalMirror;
  const scale=1-.016*px-.008*py;

  // Anchor the card at the opposite corner. This makes right-swipe tilt
  // visibly mirror left-swipe tilt instead of being visually cancelled by perspective.
  const originX=S.dir>0?'right':'left';
  const originY=dy<0?'bottom':(dy>0?'top':'center');
  S.card.style.transformOrigin=`${originX} ${originY}`;

  S.card.style.transition='none';
  S.card.style.transform=`translate3d(${dx}px,${dy}px,0) rotateZ(${z}deg) scale(${scale})`;
  S.card.style.filter=`brightness(${1-.06*px})`;
  S.shade.style.opacity=String(.15*Math.max(px,py));
  return true;
}

function commitNavigation246(dir){
  // Resolve the destination explicitly, then render it once.
  // This avoids a Samsung/content:// touch-cancel path leaving the visual swipe
  // completed while the underlying tab remains unchanged.
  const tabs=(typeof studyCourseOrder==='function'
    ? studyCourseOrder(ACTIVE_STUDY_COURSE)
    : ['corrections','chunks','speaking','habits']).filter(Boolean);
  let i=tabs.indexOf(myClassTab); if(i<0)i=0;
  let ni=i+dir;
  let nextLesson=Number(myClassLessonNo)||1;
  const maxLesson=(typeof studyCourseLessonCount==='function'
    ? studyCourseLessonCount(ACTIVE_STUDY_COURSE)
    : 1)||1;

  if(ni<0){
    if(nextLesson<=1)return false;
    nextLesson--; ni=tabs.length-1;
  }else if(ni>=tabs.length){
    if(nextLesson>=maxLesson)return false;
    nextLesson++; ni=0;
  }

  stopAllMyClassPlayback?.(true);
  myClassLessonNo=nextLesson;
  myClassTab=tabs[ni];
  try{M536.course=ACTIVE_STUDY_COURSE}catch(e){}
  myClassUpdateHeader?.();
  renderMyClass?.();
  studySyncCourseUI?.();
  document.querySelectorAll('.myClassTab').forEach(
    b=>b.classList.toggle('active',b.dataset.myclassTab===myClassTab)
  );
  myClassSetStatus?.('화면 전환 · 재생 정지',false);
  topNow246();
  return true;
}

function end246(cancel){
  if(!S||S.ending)return false;
  const s=S; s.ending=true;
  const w=Math.max(1,window.innerWidth), h=Math.max(1,window.innerHeight);
  const progressX=Math.abs(s.dx)/w;
  const travel=Math.hypot(s.dx,s.dy);
  const travelRatio=travel/Math.max(1,Math.min(w,h));
  const speed=Math.hypot(s.vx,s.vy);

  // The gesture is already direction-locked as a horizontal page swipe.
  // After that lock, diagonal/up/down dragging must still complete the page turn.
  const finish=!cancel && (
    progressX>=.10 ||
    travelRatio>=.18 ||
    Math.abs(s.vx)>=.28 ||
    speed>=.46
  );

  if(!finish){
    const dur=190;
    s.card.style.transition=`transform ${dur}ms cubic-bezier(.22,.72,.18,1),filter ${dur}ms ease-out`;
    s.shade.style.transition=`opacity ${dur}ms ease-out`;
    requestAnimationFrame(()=>{
      s.card.style.transform='translate3d(0,0,0) rotateY(0deg) rotateZ(0deg) scale(1)';
      s.card.style.filter='brightness(1)'; s.shade.style.opacity='0';
    });
    setTimeout(()=>cleanup246(s),dur+40);
    return false;
  }

  // Render destination underneath only now, once touch has ended.
  let committed=false;
  try{committed=commitNavigation246(s.dir)===true}catch(err){cleanup246(s);throw err}
  if(!committed){
    s.ending=false;
    const dur=180;
    s.card.style.transition=`transform ${dur}ms cubic-bezier(.22,.72,.18,1),filter ${dur}ms ease-out`;
    requestAnimationFrame(()=>{s.card.style.transform='translate3d(0,0,0) rotateZ(0deg) scale(1)';s.card.style.filter='brightness(1)'});
    setTimeout(()=>cleanup246(s),dur+35);
    return false;
  }

  const targetX=s.dir>0?-w*1.18:w*1.18;
  // Preserve the user's vertical throw, so diagonal/up/down swipes continue naturally.
  const throwY=Math.max(-h*.48,Math.min(h*.48,s.dy + s.vy*110));
  const dist=Math.hypot(targetX-s.dx,throwY-s.dy);
  const pxms=Math.max(.85,speed);
  const dur=Math.max(150,Math.min(340,dist/pxms));
  const verticalSign=s.dy<0?-1:(s.dy>0?1:0);
  const horizontalMirror=(s.dir>0?1:-1);
  const rotZ=verticalSign===0
    ? (s.dir>0?-10:10)
    : verticalSign*14*horizontalMirror;
  const originX=s.dir>0?'right':'left';
  const originY=s.dy<0?'bottom':(s.dy>0?'top':'center');
  s.card.style.transformOrigin=`${originX} ${originY}`;

  s.card.style.transition=`transform ${dur}ms cubic-bezier(.18,.78,.16,1),opacity ${dur}ms ease-out,filter ${dur}ms ease-out`;
  s.shade.style.transition=`opacity ${dur}ms ease-out`;
  requestAnimationFrame(()=>{
    s.card.style.transform=`translate3d(${targetX}px,${throwY}px,0) rotateZ(${rotZ}deg) scale(.975)`;
    s.card.style.opacity='0'; s.card.style.filter='brightness(.90)'; s.shade.style.opacity='0';
  });
  setTimeout(()=>{cleanup246(s);topNow246()},dur+50);
  return true;
}

window.mvSwipePage246={
  canGo:canGo246,
  begin:begin246,
  move:move246,
  end:end246,
  finalPoint:(x,y)=>{ if(S&&!S.ending) move246(x,y); },
  active:()=>!!S,
  forceCleanup:()=>cleanup246()
};
window.mvSwipePageAudit246=()=>({
 version:'v5.3.275',
 mode:'2D full-screen card drag',
 followsX:true,followsY:true,velocityAware:true,
 navigation:'once on touchend',
 destinationStartsAtTop:true,
 scope:['my','sori','opic','friends']
});
})();



/* inline script 20: v532247VerticalTiltAudit */

window.mvSwipeVerticalTiltAudit247=function(){
  return {
    version:'v5.3.275',
    verticalTilt:'opposite by dy sign',
    upward:'rotateZ negative',
    downward:'rotateZ positive',
    finalThrowPreservesVerticalTilt:true,
    scope:['my','sori','opic','friends']
  };
};



/* inline script 21: v532248BidirectionalTiltAudit */

window.mvSwipeBidirectionalTiltAudit248=function(){
  return {
    version:'v5.3.275',
    leftSwipe:'vertical tilt flips by up/down',
    rightSwipe:'mirrored vertical tilt flips by up/down',
    mirroredByHorizontalDirection:true,
    finalThrowMirrored:true,
    scope:['my','sori','opic','friends']
  };
};



/* inline script 22: v532249RightTiltVisualFixAudit */

window.mvSwipeRightTiltVisualFix249=function(){
  return {
    version:'v5.3.275',
    fix:'remove rotateY visual cancellation + quadrant transform-origin',
    leftSwipe:{up:'opposite angle',down:'opposite angle'},
    rightSwipe:{up:'mirrored angle',down:'mirrored angle'},
    transformOrigin:'changes by horizontal direction and vertical direction',
    scope:['my','sori','opic','friends']
  };
};



/* inline script 23: v532250SwipeCommitAudit */

window.mvSwipeCommitAudit250=function(){
  return {
    version:'v5.3.275',
    completion:'2D distance + velocity',
    xThreshold:.10,
    diagonalThreshold:.18,
    finalTouchPointApplied:true,
    navigation:'goMyClassTab on successful release',
    destinationStartsAtTop:true,
    scope:['my','sori','opic','friends']
  };
};



/* inline script 24: v532251SwipeCommitSamsungAudit */

window.mvSwipeCommitSamsungAudit251=function(){
  return {
    version:'v5.3.275',
    samsungTouchCancel:'uses normal commit thresholds instead of forced cancel',
    destination:'resolved explicitly before render',
    expected:'corrections left swipe -> chunks',
    scope:['my','sori','opic','friends']
  };
};



/* inline script 25: v532252VerticalLessonSwipe */

(function(){
'use strict';
let V=null;

function topNow252(){
  try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(e){window.scrollTo(0,0)}
  try{document.documentElement.scrollTop=0;document.body.scrollTop=0}catch(e){}
}

function canLesson252(dir){
  const course=ACTIVE_STUDY_COURSE||'my';
  const max=Math.max(1,Number(studyCourseLessonCount?.(course))||1);
  const next=Number(myClassLessonNo||1)+(dir>0?1:-1);
  return next>=1&&next<=max;
}

function snapshot252(){
  const page=document.getElementById('myClassPage');
  if(!page)return null;
  const scrollY=window.scrollY||document.documentElement.scrollTop||0;
  const clone=page.cloneNode(true);
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  clone.querySelectorAll('button,input,select,textarea,a').forEach(el=>el.setAttribute('tabindex','-1'));
  // Snapshot cleanup: fixed/floating controls are already present on the real destination page.
  // Hiding only these duplicated overlay controls keeps the moving page edge clean.
  clone.querySelectorAll('[style*="position: fixed"],[style*="position:fixed"],.floatingControls,.fixedBottom,.bottomDock').forEach(el=>{
    el.style.visibility='hidden';
  });
  clone.style.pointerEvents='none';
  clone.style.margin='0';
  clone.style.width='100vw';

  const inner=document.createElement('div');
  inner.className='mvSwipeCardInner246';
  inner.style.top=(-scrollY)+'px';
  inner.appendChild(clone);
  return inner;
}

function cleanup252(s=V){
  if(!s)return;
  try{s.stage?.remove()}catch(e){}
  document.body.classList.remove('mvSwipeActive246');
  if(V===s)V=null;
}

function begin252(dir,x,y){
  if(V||!canLesson252(dir))return false;
  const inner=snapshot252(); if(!inner)return false;

  const stage=document.createElement('div'); stage.className='mvSwipeStage246';
  const card=document.createElement('div'); card.className='mvSwipeCard246';
  const shade=document.createElement('div'); shade.className='mvSwipeShade246';
  card.append(inner,shade); stage.appendChild(card); document.body.appendChild(stage);
  document.body.classList.add('mvSwipeActive246');

  V={
    dir,startX:x,startY:y,lastX:x,lastY:y,lastT:performance.now(),
    dx:0,dy:0,vx:0,vy:0,stage,card,shade,ending:false
  };
  return true;
}

function move252(x,y){
  if(!V||V.ending)return false;
  const now=performance.now();
  let dx=x-V.startX, dy=y-V.startY;

  // Same-tab lesson gesture keeps its vertical direction:
  // dir +1 = next lesson from page bottom (finger moves upward)
  // dir -1 = previous lesson from page top (finger moves downward)
  if(V.dir>0)dy=Math.min(0,dy);
  else dy=Math.max(0,dy);

  // Keep a little horizontal freedom so it feels like the same draggable card.
  dx=Math.max(-window.innerWidth*.35,Math.min(window.innerWidth*.35,dx));

  const dt=Math.max(1,now-V.lastT);
  V.vx=V.vx*.62+((x-V.lastX)/dt)*.38;
  V.vy=V.vy*.62+((y-V.lastY)/dt)*.38;
  V.lastX=x; V.lastY=y; V.lastT=now; V.dx=dx; V.dy=dy;

  const w=Math.max(1,window.innerWidth), h=Math.max(1,window.innerHeight);
  const py=Math.min(1,Math.abs(dy)/h);
  const px=Math.min(.35,Math.abs(dx)/w);

  // Vertical page turn: horizontal offset controls the lean, vertical motion controls travel.
  const z=(dx===0?0:(dx>0?1:-1))*(2+9*px) + (V.dir>0?-1:1)*(2+5*py);
  const scale=1-.014*py-.006*px;

  V.card.style.transformOrigin=V.dir>0?'center top':'center bottom';
  V.card.style.transition='none';
  V.card.style.transform=`translate3d(${dx}px,${dy}px,0) rotateZ(${z}deg) scale(${scale})`;
  V.card.style.filter=`brightness(${1-.055*py})`;
  V.shade.style.opacity=String(.14*Math.max(py,px));
  return true;
}

function bottomNow252(){
  const apply=()=>{
    const h=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);
    const vh=window.innerHeight||document.documentElement.clientHeight||0;
    const y=Math.max(0,h-vh);
    try{window.scrollTo({top:y,left:0,behavior:'auto'})}catch(e){window.scrollTo(0,y)}
    try{document.documentElement.scrollTop=y;document.body.scrollTop=y}catch(e){}
  };
  // renderMyClass can change page height over the next frame; settle twice.
  requestAnimationFrame(()=>{apply();requestAnimationFrame(apply)});
  setTimeout(apply,80);
}

function commit252(dir){
  const course=ACTIVE_STUDY_COURSE||'my';
  const max=Math.max(1,Number(studyCourseLessonCount?.(course))||1);
  const next=Number(myClassLessonNo||1)+(dir>0?1:-1);
  if(next<1||next>max)return false;

  stopAllMyClassPlayback?.(true);
  myClassLessonNo=next;
  try{M536.course=course}catch(e){}
  myClassUpdateHeader?.();
  renderMyClass?.();
  studySyncCourseUI?.();
  document.querySelectorAll('.myClassTab').forEach(
    b=>b.classList.toggle('active',b.dataset.myclassTab===myClassTab)
  );
  myClassSetStatus?.(dir>0?'다음 수업 · 같은 학습':'이전 수업 · 같은 학습',false);
  // Continuous vertical reading standard:
  // bottom + swipe up -> next lesson at TOP
  // top + swipe down -> previous lesson at BOTTOM
  if(dir>0)topNow252();
  else bottomNow252();
  return true;
}

function end252(cancel){
  if(!V||V.ending)return false;
  const s=V; s.ending=true;
  const w=Math.max(1,window.innerWidth), h=Math.max(1,window.innerHeight);
  const progressY=Math.abs(s.dy)/h;
  const travelRatio=Math.hypot(s.dx,s.dy)/Math.max(1,Math.min(w,h));
  const speed=Math.hypot(s.vx,s.vy);
  const finish=!cancel && (
    progressY>=.10 ||
    travelRatio>=.18 ||
    Math.abs(s.vy)>=.28 ||
    speed>=.46
  );

  if(!finish){
    const dur=190;
    s.card.style.transition=`transform ${dur}ms cubic-bezier(.22,.72,.18,1),filter ${dur}ms ease-out`;
    s.shade.style.transition=`opacity ${dur}ms ease-out`;
    requestAnimationFrame(()=>{
      s.card.style.transform='translate3d(0,0,0) rotateZ(0deg) scale(1)';
      s.card.style.filter='brightness(1)';
      s.shade.style.opacity='0';
    });
    setTimeout(()=>cleanup252(s),dur+40);
    return false;
  }

  let committed=false;
  try{committed=commit252(s.dir)===true}catch(err){cleanup252(s);throw err}
  if(!committed){
    s.ending=false;
    return end252(true);
  }

  const targetY=s.dir>0?-h*1.14:h*1.14;
  const throwX=Math.max(-w*.45,Math.min(w*.45,s.dx+s.vx*100));
  const dist=Math.hypot(throwX-s.dx,targetY-s.dy);
  const dur=Math.max(150,Math.min(340,dist/Math.max(.85,speed)));

  const leanSign=throwX===0?0:(throwX>0?1:-1);
  const rotZ=leanSign*(10+Math.min(5,Math.abs(throwX)/w*10)) + (s.dir>0?-4:4);

  s.card.style.transition=`transform ${dur}ms cubic-bezier(.18,.78,.16,1),opacity ${dur}ms ease-out,filter ${dur}ms ease-out`;
  s.shade.style.transition=`opacity ${dur}ms ease-out`;
  requestAnimationFrame(()=>{
    s.card.style.transform=`translate3d(${throwX}px,${targetY}px,0) rotateZ(${rotZ}deg) scale(.975)`;
    s.card.style.opacity='0';
    s.card.style.filter='brightness(.90)';
    s.shade.style.opacity='0';
  });
  setTimeout(()=>{
    cleanup252(s);
    if(s.dir>0)topNow252();
    else bottomNow252();
  },dur+50);
  return true;
}

window.mvVerticalLessonSwipe252={
  canGo:canLesson252,
  begin:begin252,
  move:move252,
  end:end252,
  finalPoint:(x,y)=>{if(V&&!V.ending)move252(x,y)},
  active:()=>!!V,
  forceCleanup:()=>cleanup252()
};
window.mvVerticalLessonSwipeAudit252=()=>({
  version:'v5.3.275',
  topPullDown:'previous lesson same tab, destination bottom',
  bottomPushUp:'next lesson same tab, destination top',
  liveCard:true,
  xFreedom:true,
  velocityAware:true,
  destinationStartsAtTop:true,
  scope:['my','sori','opic','friends']
});
})();



/* inline script 26: v532253SwipeCornerCleanupAudit */

window.mvSwipeCornerCleanupAudit253=function(){
  return {
    version:'v5.3.275',
    fix:'clean swipe-card corners and duplicate floating overlays',
    cardRadius:0,
    shadow:'reduced',
    edge:'single subtle line',
    scope:['horizontal tab swipe','vertical lesson swipe']
  };
};



/* inline script 27: v532254UniversalSwipeStandard */

(function(){
'use strict';
let U=null;

function snapshotRoot254(root){
  if(!root)return null;
  const scrollY=window.scrollY||document.documentElement.scrollTop||0;
  const clone=root.cloneNode(true);
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  clone.querySelectorAll('button,input,select,textarea,a').forEach(el=>el.setAttribute('tabindex','-1'));
  clone.querySelectorAll('[style*="position: fixed"],[style*="position:fixed"],.floatingControls,.fixedBottom,.bottomDock').forEach(el=>{
    el.style.visibility='hidden';
  });
  clone.style.pointerEvents='none';
  clone.style.margin='0';
  clone.style.width='100vw';

  const inner=document.createElement('div');
  inner.className='mvSwipeCardInner246';
  inner.style.top=(-scrollY)+'px';
  inner.appendChild(clone);
  return inner;
}

function cleanup254(s=U){
  if(!s)return;
  try{s.stage?.remove()}catch(e){}
  document.body.classList.remove('mvSwipeActive246');
  if(U===s)U=null;
}

function begin254(opts){
  if(U||!opts?.root||typeof opts.onCommit!=='function')return false;
  const inner=snapshotRoot254(opts.root); if(!inner)return false;
  const dir=opts.dir>0?1:-1;
  const stage=document.createElement('div'); stage.className='mvSwipeStage246';
  const card=document.createElement('div'); card.className='mvSwipeCard246 '+(dir>0?'next':'prev');
  const shade=document.createElement('div'); shade.className='mvSwipeShade246';
  card.append(inner,shade); stage.appendChild(card); document.body.appendChild(stage);
  document.body.classList.add('mvSwipeActive246');
  U={
    dir,startX:opts.x,startY:opts.y,lastX:opts.x,lastY:opts.y,lastT:performance.now(),
    dx:0,dy:0,vx:0,vy:0,stage,card,shade,onCommit:opts.onCommit,ending:false
  };
  return true;
}

function move254(x,y){
  if(!U||U.ending)return;
  const now=performance.now();
  let dx=x-U.startX,dy=y-U.startY;
  if(U.dir>0)dx=Math.min(0,dx);else dx=Math.max(0,dx);
  dy=Math.max(-window.innerHeight*.42,Math.min(window.innerHeight*.42,dy));
  const dt=Math.max(1,now-U.lastT);
  U.vx=U.vx*.62+((x-U.lastX)/dt)*.38;
  U.vy=U.vy*.62+((y-U.lastY)/dt)*.38;
  U.lastX=x;U.lastY=y;U.lastT=now;U.dx=dx;U.dy=dy;

  const w=Math.max(1,window.innerWidth),h=Math.max(1,window.innerHeight);
  const px=Math.min(1,Math.abs(dx)/w),py=Math.min(.42,Math.abs(dy)/h);
  const verticalSign=dy<0?-1:(dy>0?1:0);
  const horizontalMirror=(U.dir>0?1:-1);
  const tiltMag=2.2+10.5*Math.min(.42,Math.abs(dy)/h)+2.5*px;
  const z=verticalSign===0?(U.dir>0?-1:1)*1.2:verticalSign*tiltMag*horizontalMirror;
  const originX=U.dir>0?'right':'left';
  const originY=dy<0?'bottom':(dy>0?'top':'center');
  U.card.style.transformOrigin=`${originX} ${originY}`;
  U.card.style.transition='none';
  U.card.style.transform=`translate3d(${dx}px,${dy}px,0) rotateZ(${z}deg) scale(${1-.016*px-.008*py})`;
  U.card.style.filter=`brightness(${1-.06*px})`;
  U.shade.style.opacity=String(.15*Math.max(px,py));
}

function end254(cancel){
  if(!U||U.ending)return false;
  const s=U;s.ending=true;
  const w=Math.max(1,window.innerWidth),h=Math.max(1,window.innerHeight);
  const progressX=Math.abs(s.dx)/w;
  const travelRatio=Math.hypot(s.dx,s.dy)/Math.max(1,Math.min(w,h));
  const speed=Math.hypot(s.vx,s.vy);
  const finish=!cancel&&(progressX>=.10||travelRatio>=.18||Math.abs(s.vx)>=.28||speed>=.46);

  if(!finish){
    const dur=180;
    s.card.style.transition=`transform ${dur}ms cubic-bezier(.22,.72,.18,1),filter ${dur}ms ease-out`;
    s.shade.style.transition=`opacity ${dur}ms ease-out`;
    requestAnimationFrame(()=>{
      s.card.style.transform='translate3d(0,0,0) rotateZ(0deg) scale(1)';
      s.card.style.filter='brightness(1)';s.shade.style.opacity='0';
    });
    setTimeout(()=>cleanup254(s),dur+35);
    return false;
  }

  let ok=false;
  try{ok=s.onCommit(s.dir)!==false}catch(err){cleanup254(s);throw err}
  if(!ok){s.ending=false;return end254(true)}

  const targetX=s.dir>0?-w*1.18:w*1.18;
  const throwY=Math.max(-h*.48,Math.min(h*.48,s.dy+s.vy*110));
  const dist=Math.hypot(targetX-s.dx,throwY-s.dy);
  const dur=Math.max(150,Math.min(340,dist/Math.max(.85,speed)));
  const verticalSign=s.dy<0?-1:(s.dy>0?1:0);
  const mirror=(s.dir>0?1:-1);
  const rotZ=verticalSign===0?(s.dir>0?-10:10):verticalSign*14*mirror;
  s.card.style.transition=`transform ${dur}ms cubic-bezier(.18,.78,.16,1),opacity ${dur}ms ease-out,filter ${dur}ms ease-out`;
  s.shade.style.transition=`opacity ${dur}ms ease-out`;
  requestAnimationFrame(()=>{
    s.card.style.transform=`translate3d(${targetX}px,${throwY}px,0) rotateZ(${rotZ}deg) scale(.975)`;
    s.card.style.opacity='0';s.card.style.filter='brightness(.90)';s.shade.style.opacity='0';
  });
  setTimeout(()=>cleanup254(s),dur+45);
  return true;
}

window.MV_SWIPE_STANDARD_254={
  begin:begin254,move:move254,end:end254,
  finalPoint:(x,y)=>{if(U&&!U.ending)move254(x,y)},
  active:()=>!!U,forceCleanup:()=>cleanup254()
};
window.mvSwipeStandardAudit254=()=>({
  version:'v5.3.275',
  standard:'full-screen snapshot + finger-follow + mirrored tilt + velocity commit',
  applied:['MY/SORI/OPIC/FRIENDS tabs','MY/SORI/OPIC/FRIENDS lesson edges','DAY learning cards','word quiz questions']
});
})();



/* inline script 28: v532255AutoPlaybackPageTurn */

(function(){
'use strict';
let busy=false;

function clonePage255(root){
  if(!root)return null;
  const scrollY=window.scrollY||document.documentElement.scrollTop||0;
  const clone=root.cloneNode(true);
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  clone.querySelectorAll('button,input,select,textarea,a').forEach(el=>el.setAttribute('tabindex','-1'));
  clone.querySelectorAll('[style*="position: fixed"],[style*="position:fixed"],.floatingControls,.fixedBottom,.bottomDock').forEach(el=>{
    el.style.visibility='hidden';
  });
  clone.style.pointerEvents='none';
  clone.style.margin='0';
  clone.style.width='100vw';

  const inner=document.createElement('div');
  inner.className='mvSwipeCardInner246';
  inner.style.top=(-scrollY)+'px';
  inner.appendChild(clone);
  return inner;
}

function topNow255(){
  try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(e){window.scrollTo(0,0)}
  try{document.documentElement.scrollTop=0;document.body.scrollTop=0}catch(e){}
}

async function autoTurn255(commit,dir=1){
  if(typeof commit!=='function')return false;
  const root=document.getElementById('myClassPage');
  if(!root||root.classList.contains('hidden')||busy){
    commit(); topNow255(); return true;
  }

  const inner=clonePage255(root);
  if(!inner){commit();topNow255();return true}

  busy=true;
  const stage=document.createElement('div');
  stage.className='mvSwipeStage246';
  const card=document.createElement('div');
  card.className='mvSwipeCard246 '+(dir>0?'next':'prev');
  const shade=document.createElement('div');
  shade.className='mvSwipeShade246';
  card.append(inner,shade);stage.appendChild(card);document.body.appendChild(stage);
  document.body.classList.add('mvSwipeActive246');

  // Render the destination at the top underneath the old-page snapshot.
  commit();
  topNow255();

  const w=Math.max(1,window.innerWidth);
  const h=Math.max(1,window.innerHeight);
  const targetX=dir>0?-w*1.16:w*1.16;
  const targetY=-Math.min(h*.12,90);
  const rotZ=dir>0?-8:8;
  card.style.transformOrigin=dir>0?'right bottom':'left bottom';

  // v5.3.275 · continuous human-speed page turn.
  // No mid-point pause: one uninterrupted motion from start to finish.
  await new Promise(r=>setTimeout(r,110));

  await new Promise(resolve=>{
    const dur=720;
    card.style.transition=`transform ${dur}ms cubic-bezier(.20,.62,.18,1),opacity ${dur}ms cubic-bezier(.55,.05,.70,.35),filter ${dur}ms ease-out`;
    shade.style.transition=`opacity ${dur}ms ease-out`;
    requestAnimationFrame(()=>{
      card.style.transform=`translate3d(${targetX}px,${targetY}px,0) rotateZ(${rotZ}deg) scale(.98)`;
      card.style.opacity='0';
      card.style.filter='brightness(.91)';
      shade.style.opacity='0';
    });
    setTimeout(resolve,dur+40);
  });

  try{stage.remove()}catch(e){}
  document.body.classList.remove('mvSwipeActive246');
  busy=false;
  topNow255();
  return true;
}

window.mvAutoPlaybackPageTurn255=autoTurn255;
window.mvAutoPlaybackPageTurnAudit255=()=>({
  version:'v5.3.275',
  use:'automatic full-playback tab/lesson screen changes',
  style:'same full-screen swipe-card standard',
  destinationStartsAtTop:true,
  noVisibleScrollToTop:true,
  scope:['my','sori','opic','friends']
});
})();



/* inline script 29: v532255AutoDayTurn */

window.mvAutoDayPlaybackTurn255=async function(commit){
  if(typeof commit!=='function')return false;
  const root=document.getElementById('dayAppPage');
  if(!root||root.classList.contains('hidden')){commit();return true}

  const scrollY=window.scrollY||document.documentElement.scrollTop||0;
  const clone=root.cloneNode(true);
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  clone.querySelectorAll('button,input,select,textarea,a').forEach(el=>el.setAttribute('tabindex','-1'));
  clone.querySelectorAll('[style*="position: fixed"],[style*="position:fixed"],.floatingControls,.fixedBottom,.bottomDock').forEach(el=>el.style.visibility='hidden');
  clone.style.pointerEvents='none';clone.style.margin='0';clone.style.width='100vw';

  const inner=document.createElement('div');inner.className='mvSwipeCardInner246';inner.style.top=(-scrollY)+'px';inner.appendChild(clone);
  const stage=document.createElement('div');stage.className='mvSwipeStage246';
  const card=document.createElement('div');card.className='mvSwipeCard246 next';
  const shade=document.createElement('div');shade.className='mvSwipeShade246';
  card.append(inner,shade);stage.appendChild(card);document.body.appendChild(stage);
  document.body.classList.add('mvSwipeActive246');

  commit();
  try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(e){window.scrollTo(0,0)}

  const w=Math.max(1,window.innerWidth),h=Math.max(1,window.innerHeight);
  const tx=-w*1.16,ty=-Math.min(h*.10,80);
  card.style.transformOrigin='right bottom';

  // v5.3.275 · DAY uses the same uninterrupted page-turn timing.
  await new Promise(r=>setTimeout(r,110));

  const dur=700;
  card.style.transition=`transform ${dur}ms cubic-bezier(.20,.62,.18,1),opacity ${dur}ms cubic-bezier(.55,.05,.70,.35),filter ${dur}ms ease-out`;
  requestAnimationFrame(()=>{
    card.style.transform=`translate3d(${tx}px,${ty}px,0) rotateZ(-8deg) scale(.98)`;
    card.style.opacity='0';
    card.style.filter='brightness(.91)';
  });
  await new Promise(r=>setTimeout(r,dur+40));
  stage.remove();
  document.body.classList.remove('mvSwipeActive246');

  // Ensure the destination frame has actually painted before resolving.
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  return true;
};



/* inline script 30: v532256HumanAutoSwipeSpeedAudit */

window.mvHumanAutoSwipeSpeedAudit256=function(){
  return {
    version:'v5.3.275',
    automaticTurn:'human-like visible speed',
    preHoldMs:140,
    midSwipeMs:330,
    finishSwipeMs:390,
    totalVisualMs:'about 900ms',
    dayTurn:'same slower two-phase standard'
  };
};



/* inline script 31: v532259PlaybackProgressStatusDriven */

(function(){
'use strict';

function parts259(){
  const status=document.getElementById('myClassPlaybackStatus');
  return {
    status,
    box:status?.querySelector('.mvPlaybackProgress258'),
    fill:status?.querySelector('.mvPlaybackFill258'),
    count:status?.querySelector('.mvPlaybackCount258')
  };
}
function hide259(){
  const {status,box,fill,count}=parts259();
  box?.classList.remove('on');
  status?.classList.remove('mvProgress258On');
  if(fill)fill.style.width='0%';
  if(count)count.textContent='0/0';
}
function total259(tab,lesson,course){
  try{
    const d=studyCourseData?.(course,lesson);
    const a=d?.[tab];
    if(Array.isArray(a)&&a.length)return a.length;
  }catch(e){}
  // DOM fallback: current rendered cards.
  const map={corrections:'.myStudyCard[data-study-tab="corrections"],.myCorrectionCard',
             chunks:'.myStudyCard[data-study-tab="chunks"],.myChunkCard',
             speaking:'.myStudyCard[data-study-tab="speaking"],.mySpeakBlock'};
  try{
    const n=document.querySelectorAll(map[tab]||'.myStudyCard').length;
    if(n)return n;
  }catch(e){}
  return 0;
}
function sync259(text,playing){
  try{
    if(!playing){hide259();return}
    const {status,box,fill,count}=parts259();
    if(!status||!box||!fill||!count)return;

    const s=String(text||'');
    let tab='';
    if(/핵심\s*교정|Correction/i.test(s))tab='corrections';
    else if(/Chunk/i.test(s))tab='chunks';
    else if(/말하기|Speaking/i.test(s))tab='speaking';
    else {hide259();return}

    // Status examples: "전체 반복 · 수업 1 · 핵심 교정 10 · 문장 2/2"
    // or "Chunk · 5/12 · 1/2". Prefer the card number immediately after tab label.
    let current=0;
    let statusTotal=0;
    const patterns=tab==='corrections'
      ? [/핵심\s*교정\s*(\d+)/i,/Correction\s*(\d+)/i]
      : tab==='chunks'
      ? [/Chunk\s*(\d+)/i]
      : [/말하기\s*(\d+)/i,/Speaking\s*(\d+)/i];
    for(const rx of patterns){const m=s.match(rx);if(m){current=Number(m[1])||0;break}}

    // V5.3.276: current-tab playback paints statuses like
    // '핵심 교정 · 1/12 · 1/2'. The older parser only accepted
    // '핵심 교정 1', so the visible progress bar disappeared.
    if(!current){
      const labelRx=tab==='corrections'?'(?:핵심\s*교정|Correction)':tab==='chunks'?'Chunk':'(?:말하기|Speaking)';
      const pair=s.match(new RegExp(labelRx+'\\s*[·:|-]?\\s*(\\d+)\\s*\\/\\s*(\\d+)','i'));
      if(pair){
        current=Number(pair[1])||0;
        statusTotal=Number(pair[2])||0;
      }
    }

    const lessonMatch=s.match(/수업\s*(\d+)/);
    const lesson=lessonMatch?Number(lessonMatch[1]):Number(window.myClassLessonNo||1);
    const course=String(window.ACTIVE_STUDY_COURSE||window.M536?.course||'my');
    let total=statusTotal||total259(tab,lesson,course);

    const playlist=Array.isArray(window.M536?.playlist)?window.M536.playlist:[];
    const samePlaylist=playlist.filter(x=>
      Number(x.lesson)===lesson &&
      String(x.tab||'')===tab &&
      String(x.course||course)===course
    );
    const configuredFavoriteOnly=!!window.studyFavoriteOnly239?.(course);
    const favoriteCheck=document.querySelector('[data-favorite-only-239="1"]');
    const favoriteCheckOn=!!favoriteCheck?.checked;
    const favoriteStartLabel=/즐겨찾기\s*집중\s*반복/.test(String(document.getElementById('sharedStudyStart')?.textContent||''));
    const favoriteOnly=configuredFavoriteOnly || favoriteCheckOn || favoriteStartLabel;

    // Favorite-only STANDARD:
    // Never infer the denominator from the full tab or from original card numbering.
    // Count the actual ★ favorite indices in THIS lesson + THIS tab.
    // Example: favorites are original cards 2, 7, 11 among 12 =>
    // progress MUST be 1/3, 2/3, 3/3 (not 2/12, 7/12, 11/12).
    let favoriteIndices=[];
    if(favoriteOnly){
      try{
        const d=window.studyCourseData?.(course,lesson)||{};
        const rows=Array.isArray(d?.[tab])?d[tab]:[];
        favoriteIndices=rows.map((_,idx)=>idx).filter(idx=>
          !!window.studyFavoriteHas239?.(course,lesson,tab,idx)
        );
      }catch(e){favoriteIndices=[]}
    }

    if(favoriteOnly && favoriteIndices.length){
      total=favoriteIndices.length;

      // Resolve the actual original card index currently being played.
      const item=playlist[Number(window.M536?.cursor)||0];
      let originalIndex=-1;
      if(item && Number(item.lesson)===lesson && String(item.tab||'')===tab){
        originalIndex=Number(item.index);
      }
      if(!Number.isFinite(originalIndex)||originalIndex<0){
        // Status label is 1-based original card number, e.g. "핵심 교정 11".
        originalIndex=Math.max(0,(Number(current)||1)-1);
      }

      const favoritePos=favoriteIndices.indexOf(originalIndex);
      if(favoritePos>=0)current=favoritePos+1;
      else{
        // Last-resort fallback: match the closest favorite position without
        // ever using the original 1..N card number as the displayed numerator.
        const prior=favoriteIndices.filter(idx=>idx<=originalIndex).length;
        current=Math.max(1,Math.min(total,prior||1));
      }
    }else{
      // Original v259 fallback for normal playback.
      if(!total && samePlaylist.length)total=samePlaylist.length;
      if(!current && samePlaylist.length){
        const item=playlist[Number(window.M536?.cursor)||0];
        if(item && Number(item.lesson)===lesson && String(item.tab||'')===tab){
          const key=typeof window.m536ItemKey==='function'?window.m536ItemKey(item):null;
          const idx=samePlaylist.findIndex(x=>key&&window.m536ItemKey(x)===key);
          current=idx>=0?idx+1:(Number(item.index)||0)+1;
          if(!total)total=samePlaylist.length;
        }
      }
    }

    if(!total||!current){hide259();return}
    current=Math.max(1,Math.min(total,current));
    fill.style.width=(current/total*100)+'%';
    count.textContent=`${current}/${total}`;
    box.classList.add('on');
    status.classList.add('mvProgress258On');
  }catch(e){hide259()}
}

const original=window.myClassSetStatus;
if(typeof original==='function'){
  window.myClassSetStatus=function(text,playing=false){
    const result=original.apply(this,arguments);
    // UI-only: update after canonical status paint; never changes playback state.
    try{sync259(text,playing)}catch(e){}
    return result;
  };
}
window.mvPlaybackProgressSync259=sync259;
window.mvPlaybackProgressAudit259=()=>({
  version:'v5.3.275',
  trigger:'canonical status paint',
  playbackEngineTouched:false,
  progress:'current card / total cards in current lesson+tab',
  scope:['MY','SORI','OPIC']
});
})();



/* inline script 32: v532261FavoriteProgressSafeAudit */

window.mvFavoriteProgressSafeAudit261=function(){
  return {
    version:'v5.3.275',
    base:'v5.3.275 visible progress implementation',
    favoriteOnly:'counter uses filtered active playlist',
    normalPlayback:'v259 logic preserved',
    playbackEngineTouched:false
  };
};



/* inline script 33: v532262FavoriteDenominatorAudit */

window.mvFavoriteDenominatorAudit262=function(){
 return {
   version:'v5.3.275',
   rule:'favorite-only 100% = actual filtered favorites in current lesson+tab',
   example:'3 favorites among 12 => 1/3, 2/3, 3/3',
   detection:['favorite-only setting','actual playlist smaller than full tab'],
   base:'v5.3.275 / v5.3.259 visible progress path',
   playbackEngineTouched:false
 };
};



/* inline script 34: v532263FavoriteExactCountAudit */

window.mvFavoriteExactCountAudit263=function(course=window.ACTIVE_STUDY_COURSE||'my',lesson=window.myClassLessonNo||1,tab=window.myClassTab||'corrections'){
  let favoriteIndices=[];
  try{
    const d=window.studyCourseData?.(course,lesson)||{};
    const rows=Array.isArray(d?.[tab])?d[tab]:[];
    favoriteIndices=rows.map((_,idx)=>idx).filter(idx=>!!window.studyFavoriteHas239?.(course,lesson,tab,idx));
  }catch(e){}
  return {
    version:'v5.3.275',
    rule:'favorite denominator = exact favorite count in current lesson+tab',
    favoriteIndices,
    denominator:favoriteIndices.length,
    example:'original cards 2,7,11 => progress 1/3,2/3,3/3',
    playbackEngineTouched:false
  };
};



/* inline script 35: v532264ProgressLayoutAudit */

window.mvProgressLayoutAudit264=function(){
  return {
    version:'v5.3.275',
    change:'progress bar width reduced and right-aligned to protect status label',
    mobileWidthPx:112,
    maxWidthPx:154,
    countAlwaysVisible:true,
    countingLogicChanged:false,
    playbackEngineTouched:false
  };
};



/* inline script 36: v532265OverallFavoriteSkipAudit */

window.mvOverallFavoriteSkipAudit265=function(){
  const s=window.MV_ALL_REPEAT_219||{};
  return {
    version:'v5.3.275',
    rule:'overall repeat + favorite-only + zero favorites => skip course',
    neverFallbackToAll:true,
    favoriteOnlySnapshot:s.favoriteOnlySnapshot||null,
    engineEmptyPlaylistGuard:true,
    individualRepeatBehavior:'unchanged'
  };
};



/* inline script 37: v532266DayAutoPageTurnStandard */

(function(){
'use strict';
let chain=Promise.resolve();

window.mvDayAutoAdvance266=function(commit){
  if(typeof commit!=='function')return Promise.resolve(false);

  // Serialize automatic DAY transitions so a second card can never cut off
  // the page-turn animation that is already visible.
  chain=chain.catch(()=>{}).then(async()=>{
    if(typeof window.mvAutoDayPlaybackTurn255==='function'){
      await window.mvAutoDayPlaybackTurn255(commit);

      // v5.3.275 timing standard:
      // wait until the turned page is fully gone and the destination card is stable
      // before autoRead of the next word can begin.
      await new Promise(r=>setTimeout(r,220));
      return true;
    }
    commit();
    await new Promise(r=>setTimeout(r,120));
    return true;
  });
  return chain;
};

window.mvDayAutoPageTurnAudit266=function(){
  return {
    version:'v5.3.275',
    rule:'every automatic DAY next-word / repeat-pass transition uses page turn',
    engine:'mvAutoDayPlaybackTurn255 human-speed visual',
    serialized:true,
    manualSwipe:'unchanged'
  };
};
})();



/* inline script 38: v532267DayTurnPlaybackTimingAudit */

window.mvDayTurnPlaybackTimingAudit267=function(){
  return {
    version:'v5.3.275',
    rule:'next DAY word audio starts only after page turn fully completes',
    pageTurn:'human-speed two phase',
    postTurnSettleMs:220,
    finalPaintFrames:2,
    fallbackSettleMs:120,
    scope:['DAY automatic full playback','DAY repeat-pass restart']
  };
};



/* inline script 39: v532268ContinuousPageTurnAudit */

window.mvContinuousPageTurnAudit268=function(){
  return {
    version:'v5.3.275',
    fix:'remove mid-turn pause from automatic page transitions',
    generalAutoTurnMs:720,
    dayAutoTurnMs:700,
    preHoldMs:110,
    dayPostTurnAudioSettleMs:170,
    motion:'single continuous transition',
    applies:['DAY automatic word changes','MY/SORI/OPIC/FRIENDS automatic tab/lesson changes'],
    manualSwipe:'unchanged'
  };
};



/* inline script 40: v532269Sori3FirsthandPatternAudit */

window.mvSori3FirsthandPatternAudit269=function(){
  const d=window.SORI_GROUP_3||SORI_GROUP_3;
  return {
    version:'v5.3.275',
    correctionAdded:d.corrections.some(x=>x.en==='I know firsthand how difficult it is to make friends.'),
    chunkExpanded:d.chunks.some(x=>x.id==='day_chunk_12'&&/how difficult it can be to make new friends/.test(x.example||'')),
    opicVariant:true
  };
};



/* inline script 41: v532270MySentencePatternIsolationAudit */

window.mvMySentencePatternIsolationAudit270=function(){
  const lesson7=MY_CLASS_LESSON_7;
  const sentence=lesson7.corrections[0].en;
  return {
    version:'v5.3.275',
    lesson7Sentence:sentence,
    invalidLesson2Pattern:/go out for drinks/i.test(sentence)?'unexpected':'excluded',
    lesson7OwnPatterns:['be swamped','work through lunch'],
    rule:'MY sentence pattern hints must come from the active lesson and the current sentence'
  };
};



/* inline script 42: v532271OpicSentenceSpeakingSource */

(function(){
'use strict';

function opicSentenceLessonCount271(){
  try{return studyCourseLessonCount('opic')}catch(e){return 19}
}
function opicSentenceData271(n){
  try{return studyCourseData('opic',Number(n)||1)||{}}catch(e){return {}}
}
function splitEn271(text){
  try{return myClassSplitSentences(String(text||''))}catch(e){
    return String(text||'').match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(x=>x.trim()).filter(Boolean)||[];
  }
}
function splitKo271(text){
  try{return splitKo(String(text||''))}catch(e){
    return String(text||'').split(/(?<=[.!?。！？])\s+/).map(x=>x.trim()).filter(Boolean);
  }
}
function patternMatch271(text,pattern){
  const t=String(text||'').toLowerCase();
  const n=String(pattern||'').replace(/~ing/gi,'').replace(/~|someone|something|\bA\b|\bB\b|\.\.\./gi,' ')
    .replace(/[^A-Za-z0-9'\s-]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
  const words=n.split(' ').filter(x=>x.length>2);
  if(!words.length)return false;
  let pos=0;
  for(const word of words){const k=t.indexOf(word,pos);if(k<0)return false;pos=k+word.length}
  return true;
}
function patterns271(d,text){
  const rows=[];
  (d?.chunks||[]).forEach(x=>{
    if(x?.pattern&&patternMatch271(text,x.pattern))rows.push([x.pattern,x.ko||'']);
  });
  return rows.filter((x,i,a)=>a.findIndex(y=>y[0]===x[0])===i);
}
window.opicSentenceCards271=function(lessonNo){
  const n=Math.max(1,Math.min(opicSentenceLessonCount271(),Number(lessonNo)||1));
  const d=opicSentenceData271(n),out=[];let order=1;
  (d.corrections||[]).forEach((x,i)=>{
    const pats=patterns271(d,x.en||'');
    out.push({
      isPracticeSentence:true,isOpicSentence:true,
      practiceId:`OPIC_${n}_C_${i+1}`,sentenceStatsKey:`__opic__${n}_C_${i+1}`,
      example:x.en||'',translation:x.ko||'',
      practicePatterns:pats.map(x=>x[0]),practicePatternMeanings:pats.map(x=>x[1]),
      targetWords:[],newDay:n,newNo:order++,word:`OPIC ${n} 핵심 교정 ${i+1}`
    });
  });
  (d.chunks||[]).forEach((x,i)=>{
    out.push({
      isPracticeSentence:true,isOpicSentence:true,
      practiceId:`OPIC_${n}_K_${i+1}`,sentenceStatsKey:`__opic__${n}_K_${i+1}`,
      example:x.example||x.pattern||'',translation:x.exampleKo||x.ko||'',
      practicePatterns:x.pattern?[x.pattern]:[],practicePatternMeanings:x.ko?[x.ko]:[],
      targetWords:[],newDay:n,newNo:order++,word:`OPIC ${n} Chunk ${i+1}`
    });
  });
  (d.speaking||[]).forEach((x,i)=>{
    const ens=splitEn271(x.text||x.answer||x.en||''),kos=splitKo271(x.ko||x.answerKo||'');
    ens.forEach((en,j)=>{
      const pats=patterns271(d,en);
      out.push({
        isPracticeSentence:true,isOpicSentence:true,
        practiceId:`OPIC_${n}_S_${i+1}_${j+1}`,sentenceStatsKey:`__opic__${n}_S_${i+1}_${j+1}`,
        example:en,translation:kos[j]||x.ko||x.answerKo||'',
        practicePatterns:pats.map(x=>x[0]),practicePatternMeanings:pats.map(x=>x[1]),
        targetWords:[],newDay:n,newNo:order++,word:`OPIC ${n} 말하기 ${i+1}-${j+1}`
      });
    });
  });
  return out.filter(x=>x.example&&x.translation);
};

let opicLesson271=Math.max(1,Math.min(opicSentenceLessonCount271(),Number(localStorage.getItem('mv_opicSentenceLesson271')||1)));

function addButton271(){
  const sw=document.querySelector('#sentenceSourceBar .sentenceSourceSwitch');if(!sw)return;
  sw.classList.remove('v534ThreeSources');sw.classList.add('standardFourSentenceSources');
  if(!document.getElementById('sentenceSourceOpic')){
    const b=document.createElement('button');
    b.id='sentenceSourceOpic';b.className='sentenceSourceBtn';b.type='button';b.textContent='OPIC';
    sw.appendChild(b);
  }
  const b=document.getElementById('sentenceSourceOpic');
  if(b)b.onclick=()=>setSentenceSource('opic');
}

const prevBuild=buildQuizDeck;
buildQuizDeck=function(){
  if(quizMode==='sentence'&&sentenceSourceMode==='opic'){
    quizAllWrongMode=false;
    let pool=window.opicSentenceCards271(opicLesson271);
    pool.forEach(q=>ensureSentenceStats(q));
    if(quizFilterMode==='wrong')pool=pool.filter(isWeakSentence).sort((a,b)=>(ensureSentenceStats(b).sentenceWrong||0)-(ensureSentenceStats(a).sentenceWrong||0));
    quizDeck=pool;quizIndex=0;quizSessionDone=false;quizSessionWrong=[];updateQuizFilterCount();return;
  }
  return prevBuild();
};

const prevCount=updateQuizFilterCount;
updateQuizFilterCount=function(){
  if(quizMode==='sentence'&&sentenceSourceMode==='opic'){
    const base=window.opicSentenceCards271(opicLesson271),el=document.getElementById('quizFilterCount');
    if(el)el.textContent=(quizFilterMode==='wrong'?base.filter(isWeakSentence).length:base.length)+'문장';
    return;
  }
  return prevCount();
};

const prevLabel=sentenceSourceLabel;
sentenceSourceLabel=function(){
  if(sentenceSourceMode==='opic')return 'OPIC';
  return prevLabel();
};

const prevSync=syncSentenceSourceUI;
syncSentenceSourceUI=function(){
  prevSync();addButton271();
  document.getElementById('sentenceSourceOpic')?.classList.toggle('active',sentenceSourceMode==='opic');
};

const prevSet=setSentenceSource;
setSentenceSource=function(mode){
  if(mode!=='opic')return prevSet(mode);
  stopDayLoop(true);
  sentenceSourceMode='opic';quizFilterMode=(quizFilterMode==='wrong')?'wrong':'all';
  localStorage.setItem(packKey('sentenceSourceMode'),'opic');localStorage.setItem(packKey('quizFilterMode'),quizFilterMode);
  quizSelectedDay=opicLesson271;
  clearQuizAutoNext();clearSentenceRecallTimer();stopSentenceRepeat(true);stopSpeech();quizAllWrongMode=false;
  syncSentenceSourceUI();updateQuizDayNav();buildQuizDeck();quizAnswered=false;newq();
};

const prevNav=updateQuizDayNav;
updateQuizDayNav=function(){
  if(quizMode==='sentence'&&sentenceSourceMode==='opic'){
    const btn=$('quizAllWrongBtn'),label=$('quizDayLabel');if(!btn||!label)return;
    btn.disabled=true;btn.classList.remove('active');btn.textContent='OPIC 문장 학습';
    const count=window.opicSentenceCards271(opicLesson271).length;
    const meta=studyCourseMeta('opic')?.[opicLesson271]||{};
    label.innerHTML=`<b>OPIC ${opicLesson271}</b><span>${count}문장 · ${meta.shortTitle||meta.title||''}</span>`;
    $('quizPrevDay').disabled=opicLesson271<=1;
    $('quizNextDay').disabled=opicLesson271>=opicSentenceLessonCount271();
    updateQuizFilterCount();return;
  }
  return prevNav();
};

const prevDay=setQuizDay;
setQuizDay=function(day){
  if(quizMode==='sentence'&&sentenceSourceMode==='opic'){
    stopSpeech();if('speechSynthesis' in window)window.speechSynthesis.cancel();
    opicLesson271=Math.max(1,Math.min(opicSentenceLessonCount271(),Number(day)||1));
    quizSelectedDay=opicLesson271;localStorage.setItem('mv_opicSentenceLesson271',String(opicLesson271));
    updateQuizDayNav();buildQuizDeck();quizAnswered=false;newq();return;
  }
  return prevDay(day);
};

const prevQuestion=newSentenceRecallQuestion;
newSentenceRecallQuestion=function(){
  prevQuestion();
  if(sentenceSourceMode==='opic'&&quizCurrent){
    $('qw').innerHTML=`OPIC ${opicLesson271} 문장 <span class="myClassQuizBadge">${quizIndex+1}/${quizDeck.length}</span>`;
    $('quizMeta').textContent=`OPIC ${opicLesson271} · 문장 말하기 · ${sentenceFilterLabel()} · ${quizIndex+1}/${quizDeck.length}`;
  }
};

setTimeout(()=>{addButton271();syncSentenceSourceUI();},50);

window.mvOpicSentenceSpeakingAudit271=function(){
  return {
    version:'v5.3.275',
    source:'OPIC 1–19',
    sourceButton:!!document.getElementById('sentenceSourceOpic'),
    sentenceBuilder:typeof window.opicSentenceCards271==='function',
    currentLesson:opicLesson271,
    rule:'OPIC sentence speaking uses each OPIC lesson corrections/chunks/speaking data'
  };
};
})();



/* inline script 43: v532272MicPermissionGuideAudit */

window.mvMicPermissionGuideAudit272=function(){
  return {
    version:'v5.3.275',
    deniedGuide:'설정 → 앱 → Chrome → 권한 → 마이크 → 앱 사용 중에만 허용',
    contentProtocolGuide:true,
    warmPermissionGuide:true,
    rule:'permission errors must tell the user exactly where to fix them'
  };
};



/* inline script 44: v532273Sori3LetAloneAudit */

window.mvSori3LetAloneAudit273=function(){
 const d=window.SORI_GROUP_3||SORI_GROUP_3;
 return {version:'v5.3.275',
 chunk:d.chunks.some(x=>x.id==='day_chunk_25'),
 core:d.corrections.some(x=>/let alone travel abroad/.test(x.en||'')),
 speaking:d.speaking.some(x=>/let alone work out/.test(x.text||''))};
};



/* inline script 45: v532274BackgroundButtonStateFix */

(function(){
'use strict';

/* Android Home/app-switch standard:
   backgrounded playback is a resumable PAUSED session, never visually "playing".
   This keeps the bottom control at ▶ 전체 시작 when the browser returns. */
function mvBgMarkPaused274(){
  try{
    const s=window.MV_BG_PLAYBACK_207;
    if(!s || !s.wasActive)return false;

    const mode=String(s.mode||'idle');
    M536_TOGGLE_STATE.pausedMode=mode;
    M536_TOGGLE_STATE.pausedCourse=String(s.course||M536.course||ACTIVE_STUDY_COURSE||'my');

    if(mode==='full'){
      const list=m536BuildPlaylist(M536_TOGGLE_STATE.pausedCourse);
      let cursor=Math.max(0,Number(s.cursor)||0);
      if(s.itemDone)cursor=Math.max(0,Number(s.nextCursor)||cursor);
      else if(s.itemKey && Array.isArray(list)){
        const byKey=list.findIndex(x=>m536ItemKey(x)===s.itemKey);
        if(byKey>=0)cursor=byKey;
      }
      M536_TOGGLE_STATE.pausedCursor=cursor;
    }else if(mode==='infinite' && s.infiniteItem){
      M536_TOGGLE_STATE.pausedInfiniteItem={...s.infiniteItem};
    }

    // A hidden browser cannot be considered actively playing after Android
    // has suspended/cancelled TTS.
    M536.token++;
    M536.mode='idle';
    M536.busy=false;
    MY_CLASS_PLAY.active=false;
    MY_CLASS_PLAY.paused=true;
    try{stopSpeech()}catch(e){}
    try{window.speechSynthesis?.cancel()}catch(e){}
    return true;
  }catch(e){return false}
}

function mvBgSyncStartButton274(){
  try{
    const s=window.MV_BG_PLAYBACK_207;
    if(!s || !s.wasActive)return false;
    mvBgMarkPaused274();
    // The old automatic restore must not flip M536 back to "full" merely
    // because the app became visible. User explicitly resumes with one tap.
    s.restorePending=false;
    myClassSyncButtons?.();
    myClassSetStatus?.('백그라운드에서 재생이 멈췄습니다 · ▶ 전체 시작을 누르면 이어서 재생합니다',false);
    return true;
  }catch(e){return false}
}
window.mvBgSyncStartButton274=mvBgSyncStartButton274;

document.addEventListener('visibilitychange',()=>{
  const s=window.MV_BG_PLAYBACK_207;
  if(!s)return;
  if(document.visibilityState==='hidden'){
    // Let the existing v207 listener checkpoint first, then convert that
    // checkpoint to the shared paused/resume state.
    setTimeout(()=>{
      if(s.wasActive)mvBgMarkPaused274();
    },0);
  }else{
    // Run after v207's listener. Cancel its pending auto-restore and present
    // the truthful one-tap resume state.
    setTimeout(()=>{
      if(s.wasActive)mvBgSyncStartButton274();
    },20);
  }
});

window.addEventListener('pageshow',()=>{
  setTimeout(()=>{
    const s=window.MV_BG_PLAYBACK_207;
    if(s?.wasActive)mvBgSyncStartButton274();
  },30);
});
window.addEventListener('focus',()=>{
  if(document.visibilityState==='visible'){
    setTimeout(()=>{
      const s=window.MV_BG_PLAYBACK_207;
      if(s?.wasActive)mvBgSyncStartButton274();
    },30);
  }
});

window.mvBackgroundButtonStateAudit274=function(){
  return {
    version:'v5.3.275',
    hiddenState:'paused/resumable',
    returnButton:'▶ 전체 시작',
    resume:'single tap',
    cursor:'checkpointed item',
    autoRestore:false,
    applies:['MY','SORI','OPIC']
  };
};
})();



/* inline script 46: v532275AndroidBackgroundSynchronousPauseFix */

(function(){
'use strict';

/* v5.3.275
   Android may freeze JS immediately after visibilityState becomes hidden.
   Therefore background pause state MUST be captured synchronously inside the
   visibilitychange event. Do not rely on setTimeout while hidden. */
const MV_BG_SYNC_275={
  suspended:false,
  mode:'idle',
  course:'my',
  cursor:0,
  itemKey:'',
  infiniteItem:null
};
window.MV_BG_SYNC_275=MV_BG_SYNC_275;

function mvCaptureBackgroundSync275(){
  const mode=(M536?.mode==='full'||M536?.mode==='infinite')?M536.mode:'idle';
  const active=mode!=='idle' || !!MY_CLASS_PLAY?.active;
  if(!active)return false;

  MV_BG_SYNC_275.suspended=true;
  MV_BG_SYNC_275.mode=mode==='idle'?'full':mode;
  MV_BG_SYNC_275.course=String(M536?.course||ACTIVE_STUDY_COURSE||'my');
  MV_BG_SYNC_275.cursor=Math.max(0,Number(M536?.cursor)||0);
  MV_BG_SYNC_275.infiniteItem=M536?.infiniteItem?{...M536.infiniteItem}:null;
  try{
    const item=M536?.playlist?.[MV_BG_SYNC_275.cursor];
    MV_BG_SYNC_275.itemKey=item?m536ItemKey(item):'';
  }catch(e){MV_BG_SYNC_275.itemKey=''}

  // Feed the SAME shared resume state used by the bottom button.
  M536_TOGGLE_STATE.pausedMode=MV_BG_SYNC_275.mode;
  M536_TOGGLE_STATE.pausedCourse=MV_BG_SYNC_275.course;
  M536_TOGGLE_STATE.pausedCursor=MV_BG_SYNC_275.cursor;
  M536_TOGGLE_STATE.pausedInfiniteItem=MV_BG_SYNC_275.infiniteItem?{...MV_BG_SYNC_275.infiniteItem}:null;

  // Stop synchronously. Android can suspend timers immediately after this event.
  M536.token++;
  M536.mode='idle';
  M536.busy=false;
  MY_CLASS_PLAY.active=false;
  MY_CLASS_PLAY.paused=true;
  try{stopSpeech()}catch(e){}
  try{window.speechSynthesis?.cancel()}catch(e){}

  // Prevent the older v207 auto-resume path from changing the button back
  // to "전체 정지" when the page becomes visible.
  if(window.MV_BG_PLAYBACK_207){
    MV_BG_PLAYBACK_207.restorePending=false;
  }
  try{myClassSyncButtons?.()}catch(e){}
  return true;
}

function mvShowPausedAfterReturn275(){
  if(!MV_BG_SYNC_275.suspended)return false;

  // Re-assert idle because pageshow/focus/older callbacks may have stale state.
  M536.token++;
  M536.mode='idle';
  M536.busy=false;
  MY_CLASS_PLAY.active=false;
  MY_CLASS_PLAY.paused=true;

  M536_TOGGLE_STATE.pausedMode=MV_BG_SYNC_275.mode;
  M536_TOGGLE_STATE.pausedCourse=MV_BG_SYNC_275.course;
  M536_TOGGLE_STATE.pausedCursor=MV_BG_SYNC_275.cursor;
  M536_TOGGLE_STATE.pausedInfiniteItem=MV_BG_SYNC_275.infiniteItem?{...MV_BG_SYNC_275.infiniteItem}:null;

  if(window.MV_BG_PLAYBACK_207)MV_BG_PLAYBACK_207.restorePending=false;
  try{myClassSyncButtons?.()}catch(e){}
  try{myClassSetStatus?.('백그라운드에서 일시정지 · ▶ 전체 시작을 한 번 누르면 이어서 재생',false)}catch(e){}
  return true;
}

// Capture in the same event turn. No hidden-state timer.
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden'){
    mvCaptureBackgroundSync275();
  }else{
    mvShowPausedAfterReturn275();
  }
});

window.addEventListener('pageshow',()=>mvShowPausedAfterReturn275());
window.addEventListener('focus',()=>{
  if(document.visibilityState==='visible')mvShowPausedAfterReturn275();
});

// Clear only after the user actually presses ▶ and playback has been launched.
const _toggle275=window.m536ToggleGlobalPlayback;
window.m536ToggleGlobalPlayback=function(){
  if(MV_BG_SYNC_275.suspended && !m536IsPlaying()){
    // Re-assert resume checkpoint in case another UI sync touched it.
    M536_TOGGLE_STATE.pausedMode=MV_BG_SYNC_275.mode;
    M536_TOGGLE_STATE.pausedCourse=MV_BG_SYNC_275.course;
    M536_TOGGLE_STATE.pausedCursor=MV_BG_SYNC_275.cursor;
    M536_TOGGLE_STATE.pausedInfiniteItem=MV_BG_SYNC_275.infiniteItem?{...MV_BG_SYNC_275.infiniteItem}:null;
    const ok=m536ResumeGlobal();
    if(ok!==false)MV_BG_SYNC_275.suspended=false;
    return ok;
  }
  return _toggle275();
};
// myClassTogglePlay resolves the global function at call time, so the bottom
// button now uses this one-tap resume wrapper.

window.mvAndroidBackgroundSynchronousPauseAudit275=function(){
  return {
    version:'v5.3.275',
    rootCause:'Android can suspend hidden-page timers before v274 setTimeout executes',
    capture:'synchronous visibilitychange',
    returnState:'idle + resumable checkpoint',
    bottomButton:'▶ 전체 시작',
    tapsToResume:1,
    oldAutoRestoreDisabled:true
  };
};
})();



/* inline script 47: v532276FinalBehaviorRestore */

/* ===== V5.3.276 · FINAL BEHAVIOR RESTORE =====
   Restore the proven final UX without rolling back newer v275 background logic:
   - current-tab playback progress bar + current/total counter
   - favorite-only counter uses exact favorite playlist size
   - MY/SORI/OPIC/FRIENDS checkbox selection never moves the page
   - OPIC selection sync is non-destructive (no card-list rebuild per tap)
*/
window.mvFinalBehaviorRestoreAudit276=function(){
  return {
    version:'v5.3.276',
    base:'v5.3.275',
    preserved:['v275 Android background synchronous pause/resume','latest OPIC/SORI/MY data','shared playback engine','page-turn/swipe standard'],
    restored:{
      currentTabProgress:'visible current/total + progress bar',
      favoriteProgress:'filtered favorite count, not original card number',
      selectionNoJump:['MY','SORI','OPIC'],
      opicSync:'non-destructive card reuse'
    }
  };
};



/* inline script 48: unnamed */

/* V5.3.277 · OPIC 20–26 restore migration
   v5.3.276 exposed only OPIC 1–19. If that build rewrote the persisted selection,
   restore the newly available lesson numbers once without changing existing 1–19 choices. */
(function mvRestoreOpic2026Selection277(){
  try{
    const mark='mv_opic_20_26_restore_277';
    if(localStorage.getItem(mark)) return;
    const key='mv_studySelected_opic';
    const raw=localStorage.getItem(key);
    let cur=[];
    try{ cur=raw===null?[]:JSON.parse(raw); }catch(e){ cur=[]; }
    if(!Array.isArray(cur)) cur=[];
    const next=[...new Set(cur.map(Number).filter(Number.isFinite).concat([20,21,22,23,24,25,26]))].sort((a,b)=>a-b);
    localStorage.setItem(key,JSON.stringify(next));
    localStorage.setItem(mark,'1');
  }catch(e){ console.warn('[MY VOCA] OPIC 20–26 selection restore skipped',e); }
})();
function mvOpic2026RestoreAudit277(){
  try{
    const meta=(typeof STUDY_COURSES!=='undefined'&&STUDY_COURSES.opic)?STUDY_COURSES.opic.meta():{};
    const nums=[20,21,22,23,24,25,26];
    return {
      lessonCount:Object.keys(meta||{}).length,
      restored:nums.every(n=>!!meta[n]&&!!STUDY_COURSES.opic.data(n)?.speaking?.length),
      corrections:nums.map(n=>STUDY_COURSES.opic.data(n)?.corrections?.length||0),
      chunks:nums.map(n=>STUDY_COURSES.opic.data(n)?.chunks?.length||0)
    };
  }catch(e){ return {error:String(e)}; }
}
window.mvOpic2026RestoreAudit277=mvOpic2026RestoreAudit277;



/* inline script 49: v532278UnifiedSwipeBoundaryStandard */

(function(){
'use strict';
if(window.__MV_UNIFIED_SWIPE_278__)return;
window.__MV_UNIFIED_SWIPE_278__=true;

let G=null;
let suppressClickUntil=0;
let suppressClickRoot=null;

function shown278(el){
  if(!el||el.classList.contains('hidden'))return false;
  const cs=getComputedStyle(el);
  return cs.display!=='none'&&cs.visibility!=='hidden';
}
function blocked278(target){
  if(!target?.closest)return false;
  return !!target.closest('select,textarea,input,audio,video,[contenteditable="true"],[data-swipe-ignore="true"],.compareSheet,.drawerPanel,.favoritePickerSheet,.startOverlay:not(.hidden)');
}
function top278(){
  try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(e){window.scrollTo(0,0)}
  try{document.documentElement.scrollTop=0;document.body.scrollTop=0}catch(e){}
}
function mode278(){return document.getElementById('orderMode')?.value||'book'}
function rawWords278(day){return (ALL_WORDS||[]).filter(w=>Number(w.newDay)===Number(day))}
function dayDeck278(day){
  const mode=mode278();
  if(mode==='practiceSentence')return typeof practiceSentenceCardsMinimal==='function'?practiceSentenceCardsMinimal([day]):[];
  const raw=rawWords278(day);
  return typeof applyStudyOrder==='function'?applyStudyOrder(raw,mode):raw;
}
function adjacentDay278(dir){
  const next=Number(currentDay||1)+(dir>0?1:-1);
  const max=Math.max(1,Number(currentCfg?.().days)||1);
  if(next<1||next>max)return null;
  return dayDeck278(next).length?next:null;
}
function canDay278(dir){
  if(typeof AUTO!=='undefined'&&AUTO?.active){
    return dir>0?i<deck.length-1:i>0;
  }
  if(mode278()==='practiceSentence')return adjacentDay278(dir)!==null;
  if(dir>0&&i<deck.length-1)return true;
  if(dir<0&&i>0)return true;
  return adjacentDay278(dir)!==null;
}
function loadAdjacentDay278(dir){
  const day=adjacentDay278(dir);if(day===null)return false;
  const raw=rawWords278(day),nextDeck=dayDeck278(day);if(!nextDeck.length)return false;
  try{stopSpeech?.()}catch(e){}
  try{AUTO.token++}catch(e){}
  currentDay=day;W=raw;deck=nextDeck;
  i=(mode278()==='practiceSentence'||dir>0)?0:Math.max(0,deck.length-1);
  try{quizSelectedDay=currentDay;quizAllWrongMode=false;updateQuizDayNav?.()}catch(e){}
  const scoreEye=document.querySelector('.scoreEyebrow');if(scoreEye)scoreEye.textContent=`${dayDisplayLabel(currentDay)} MASTERY SCORE`;
  render(true);top278();
  return true;
}
function commitDay278(dir){
  try{stopSpeech?.()}catch(e){}
  try{AUTO.token++}catch(e){}
  if(typeof AUTO!=='undefined'&&AUTO?.active){
    if(dir>0&&i<deck.length-1){i++;render();return true}
    if(dir<0&&i>0){i--;render();return true}
    return false;
  }
  if(mode278()==='practiceSentence')return loadAdjacentDay278(dir);
  if(dir>0&&i<deck.length-1){i++;render();return true}
  if(dir<0&&i>0){i--;render();return true}
  return loadAdjacentDay278(dir);
}

function quizPoolForDay278(day){
  // DAY-boundary swipe is for the normal word quiz family
  // (choice / recall / lexical). Sentence sources have their own lesson navigator.
  if(typeof quizMode==='undefined'||quizMode==='favorite'||quizMode==='sentence'||quizAllWrongMode)return [];
  let pool=ALL_WORDS.filter(w=>Number(w.newDay)===Number(day));
  pool=typeof applyQuizFilter==='function'?applyQuizFilter(pool):pool;
  if(quizMode==='lexical')pool=pool.filter(w=>fallbackSynonymsOf(w).length||antonymsOf(w).length);
  return pool;
}
function adjacentQuizDay278(dir){
  if(typeof quizMode==='undefined'||quizMode==='favorite'||quizMode==='sentence'||quizAllWrongMode)return null;
  const next=Number(quizSelectedDay||currentDay||1)+(dir>0?1:-1);
  const max=Math.max(1,Number(currentCfg?.().days)||1);
  if(next<1||next>max)return null;
  return quizPoolForDay278(next).length?next:null;
}
function canQuiz278(dir){
  if(typeof quizMode!=='undefined'&&quizMode==='favorite')return false;
  if(!Array.isArray(quizDeck)||!quizDeck.length)return false;
  if(dir>0){
    if(!quizSessionDone&&quizIndex<quizDeck.length-1)return true;
    return adjacentQuizDay278(1)!==null;
  }
  if(quizSessionDone)return quizDeck.length>0;
  if(quizIndex>0)return true;
  return adjacentQuizDay278(-1)!==null;
}
function loadAdjacentQuizDay278(dir){
  const day=adjacentQuizDay278(dir);if(day===null)return false;
  try{clearQuizAutoNext?.()}catch(e){}
  try{stopSpeech?.()}catch(e){}
  try{window.speechSynthesis?.cancel()}catch(e){}
  try{quizPendingPlaybackFactory=null}catch(e){}
  try{clearSentenceRecallTimer?.();stopSentenceRepeat?.(true)}catch(e){}
  quizAllWrongMode=false;
  quizSelectedDay=day;
  updateQuizDayNav();
  buildQuizDeck();
  if(!quizDeck.length)return false;
  quizSessionDone=false;
  quizAnswered=false;
  // LEFT swipe enters the next DAY at its first question.
  // RIGHT swipe enters the previous DAY at its last question.
  quizIndex=dir>0?0:Math.max(0,quizDeck.length-1);
  newq();
  top278();
  return true;
}
function previousQuiz278(){
  if(quizMode==='sentence')try{sentenceSaveResume?.()}catch(e){}
  try{clearQuizAutoNext?.()}catch(e){}
  try{stopSpeech?.()}catch(e){}
  try{window.speechSynthesis?.cancel()}catch(e){}
  try{quizPendingPlaybackFactory=null}catch(e){}
  try{clearSentenceRecallTimer?.();stopSentenceRepeat?.(true)}catch(e){}
  if(quizSessionDone){
    if(!quizDeck.length)return false;
    quizSessionDone=false;quizIndex=Math.max(0,quizDeck.length-1);newq();return true;
  }
  if(quizIndex<=0)return false;
  quizIndex--;quizAnswered=false;newq();return true;
}
function commitQuiz278(dir){
  try{clearQuizAutoNext?.()}catch(e){}
  if(dir>0){
    if(!quizSessionDone&&quizIndex<quizDeck.length-1){goToNextQuizQuestion();return true}
    return loadAdjacentQuizDay278(1);
  }
  if(quizSessionDone||quizIndex>0)return previousQuiz278();
  return loadAdjacentQuizDay278(-1);
}

function coursePos278(){
  const course=String(ACTIVE_STUDY_COURSE||'my');
  const tabs=(typeof studyCourseOrder==='function'?studyCourseOrder(course):['corrections','chunks','speaking','habits']).filter(Boolean);
  let ti=tabs.indexOf(myClassTab);if(ti<0)ti=0;
  const lesson=Number(myClassLessonNo)||1;
  const max=Math.max(1,Number(studyCourseLessonCount?.(course))||1);
  return {course,tabs,ti,lesson,max};
}
function canCourse278(dir){
  const p=coursePos278(),ni=p.ti+dir;
  if(ni>=0&&ni<p.tabs.length)return true;
  return ni<0?p.lesson>1:p.lesson<p.max;
}
function commitCourse278(dir){
  const p=coursePos278();let ni=p.ti+dir,nextLesson=p.lesson;
  if(ni<0){if(nextLesson<=1)return false;nextLesson--;ni=p.tabs.length-1}
  else if(ni>=p.tabs.length){if(nextLesson>=p.max)return false;nextLesson++;ni=0}
  try{stopAllMyClassPlayback?.(true)}catch(e){}
  myClassLessonNo=nextLesson;myClassTab=p.tabs[ni];
  try{M536.course=p.course}catch(e){}
  try{myClassUpdateHeader?.();renderMyClass?.();studySyncCourseUI?.()}catch(e){console.warn('[V5.3.278] course swipe render',e)}
  document.querySelectorAll('.myClassTab').forEach(b=>b.classList.toggle('active',b.dataset.myclassTab===myClassTab));
  try{myClassSetStatus?.('화면 전환 · 재생 정지',false)}catch(e){}
  top278();return true;
}

function context278(target){
  const dayPage=document.getElementById('dayAppPage');
  if(shown278(dayPage)){
    const quiz=document.getElementById('quiz');
    if(shown278(quiz)&&quiz.contains(target)&&quizMode!=='favorite'){
      return {kind:'quiz',root:quiz,can:canQuiz278,commit:commitQuiz278};
    }
    const learn=document.getElementById('learn');
    if(shown278(learn)&&learn.contains(target)){
      return {kind:'day',root:dayPage,can:canDay278,commit:commitDay278};
    }
  }
  const course=document.getElementById('myClassPage');
  if(shown278(course)&&course.contains(target)){
    return {kind:'course',root:course,can:canCourse278,commit:commitCourse278};
  }
  return null;
}
function finish278(cancel,changed){
  if(!G)return false;
  const g=G;G=null;
  if(g.locked&&changed)window.MV_SWIPE_STANDARD_254?.finalPoint?.(changed.clientX,changed.clientY);
  let committed=false;
  if(g.locked)committed=window.MV_SWIPE_STANDARD_254?.end?.(!!cancel)===true;
  if(committed){suppressClickUntil=Date.now()+520;suppressClickRoot=g.ctx.root}
  return committed;
}

document.addEventListener('touchstart',e=>{
  if(e.touches.length!==1||blocked278(e.target))return;
  const ctx=context278(e.target);if(!ctx)return;
  const t=e.touches[0];
  G={ctx,sx:t.clientX,sy:t.clientY,locked:false,dir:0};
  // Do NOT stop propagation on touchstart. The course screen's shared vertical
  // boundary handler needs the same start point for bottom-up / top-down lesson
  // swipes. Horizontal ownership is taken only after direction lock in touchmove.
},{capture:true,passive:true});

document.addEventListener('touchmove',e=>{
  if(!G||e.touches.length!==1)return;
  const t=e.touches[0],dx=t.clientX-G.sx,dy=t.clientY-G.sy,ax=Math.abs(dx),ay=Math.abs(dy);
  if(!G.locked&&ax>=14&&ax>=ay*.90){
    const dir=dx<0?1:-1;
    if(G.ctx.can(dir)){
      G.dir=dir;
      G.locked=window.MV_SWIPE_STANDARD_254?.begin?.({root:G.ctx.root,dir,x:G.sx,y:G.sy,onCommit:G.ctx.commit})===true;
    }
  }
  if(G.locked){
    if(e.cancelable)e.preventDefault();
    e.stopPropagation();
    window.MV_SWIPE_STANDARD_254?.move?.(t.clientX,t.clientY);
  }
},{capture:true,passive:false});

document.addEventListener('touchend',e=>{
  if(!G)return;
  const t=e.changedTouches&&e.changedTouches[0];
  if(G.locked){e.stopPropagation();finish278(false,t)}else G=null;
},{capture:true,passive:true});

document.addEventListener('touchcancel',e=>{
  if(!G)return;
  const t=e.changedTouches&&e.changedTouches[0];
  if(G.locked){e.stopPropagation();finish278(false,t)}else G=null;
},{capture:true,passive:true});

document.addEventListener('click',e=>{
  if(Date.now()>suppressClickUntil)return;
  if(suppressClickRoot&&suppressClickRoot.contains(e.target)){
    e.preventDefault();e.stopImmediatePropagation();
  }
},{capture:true});

window.MV_SWIPE_STANDARD_278={
  contextFor:context278,
  canDay:canDay278,commitDay:commitDay278,
  canQuiz:canQuiz278,commitQuiz:commitQuiz278,
  adjacentQuizDay:adjacentQuizDay278,loadAdjacentQuizDay:loadAdjacentQuizDay278,
  canCourse:canCourse278,commitCourse:commitCourse278,
  active:()=>!!G
};
window.mvSwipeBoundaryStandardAudit278=function(){
  const p=coursePos278();
  return {
    version:'v5.3.278',
    gesture:'document-capture shared horizontal swipe',
    startsOn:['word/question box','answer option button','DAY card content','MY/SORI/OPIC/FRIENDS card content'],
    tapSafety:'tap remains tap; click is suppressed only after committed horizontal swipe',
    nativeControlsExcluded:['input','select','textarea','audio','video','contenteditable'],
    dayBoundary:'DAY N last -> DAY N+1 first / DAY N first -> DAY N-1 last',
    practiceReadingBoundary:'whole DAY reading page -> adjacent DAY',
    courseBoundary:'last study screen -> next lesson first / first study screen -> previous lesson last',
    course:{course:p.course,lesson:p.lesson,maxLesson:p.max,tab:myClassTab,tabs:p.tabs},
    quiz:'question navigation + DAY boundary: last -> next DAY first / first -> previous DAY last'
  };
};
})();



/* inline script 50: v532279QuizDayBoundaryAudit */

window.mvQuizDayBoundaryAudit279=function(){
  try{
    const s=window.MV_SWIPE_STANDARD_278;
    return {
      version:'v5.3.279',
      quizSelectedDay:Number(quizSelectedDay||0),
      quizIndex:Number(quizIndex||0),
      quizTotal:Array.isArray(quizDeck)?quizDeck.length:0,
      canLeft:s?.canQuiz?.(1)===true,
      canRight:s?.canQuiz?.(-1)===true,
      nextDay:s?.adjacentQuizDay?.(1),
      prevDay:s?.adjacentQuizDay?.(-1),
      rule:'DAY N last --left--> DAY N+1 first / DAY N first --right--> DAY N-1 last'
    };
  }catch(e){return {version:'v5.3.279',error:String(e)}}
};



/* inline script 51: v532280SpeakingPairingStandard */

(function(){
function refreshSpeakingKo280(){
  if(typeof myClassTab==='undefined'||myClassTab!=='speaking')return;
  const d=studyCourseData(ACTIVE_STUDY_COURSE,myClassLessonNo);
  (d?.speaking||[]).forEach((item,i)=>{
    const block=document.getElementById(`mySpeakBlock${i}`);
    const koEl=block?.querySelector('.mySpeakKoText');
    if(!koEl)return;
    const ens=myClassSplitSentences(item.text||'');
    const kos=studySpeakingAlignedKoSentences280(item,d);
    const complete=ens.length>0&&kos.length===ens.length&&kos.every(Boolean);
    if(complete){
      koEl.innerHTML='🇰🇷 '+kos.map((kt,k)=>`<span class="mySpeakKoSentence" data-ko-index="${k}">${myClassEsc(kt)}</span>`).join(' ');
      koEl.dataset.koMode='aligned';
    }else{
      const raw=String(item.ko||'').trim();
      const label=/위 핵심|AL 수준으로 답해|전체 답변의 흐름/.test(raw)?'🇰🇷 학습 안내 · ':'🇰🇷 참고 한글 · ';
      koEl.innerHTML=`<span class="mySpeakKoSummary280">${myClassEsc(label+raw)}</span>`;
      koEl.dataset.koMode='summary';
    }
  });
}
window.refreshSpeakingKo280=refreshSpeakingKo280;
const prevRender280=renderMyClass;
renderMyClass=function(){
  const r=prevRender280.apply(this,arguments);
  refreshSpeakingKo280();
  return r;
};

window.mvSpeakingPairAudit280=function(){
  const courses=['my','sori','opic','friends'];
  const report={version:'v5.3.280',rule:'Never index-pair a summary/instruction with English sentences',courses:{},splitExamples:{
    am:myClassSplitSentences('I wake up at 2 a.m. and go back to sleep.'),
    us:myClassSplitSentences('I check U.S. interest rates every day.'),
    quotedKo:myClassSplitKoSentences("예를 들어 '가장 큰 문제는 무엇입니까?'라고 질문합니다. 다음 질문도 합니다.")
  }};
  courses.forEach(course=>{
    const meta=studyCourseMeta(course)||{};
    let speaking=0,englishSentences=0,safePairs=0,unsafePairs=0,summaryBlocks=0;
    Object.keys(meta).map(Number).filter(Number.isFinite).forEach(lesson=>{
      const d=studyCourseData(course,lesson);
      (d?.speaking||[]).forEach(item=>{
        speaking++;
        const ens=myClassSplitSentences(item.text||''),kos=studySpeakingAlignedKoSentences280(item,d);
        englishSentences+=ens.length;
        safePairs+=kos.filter(Boolean).length;
        unsafePairs+=ens.filter((_,i)=>!String(kos[i]||'').trim()).length;
        if(studySpeakingKoIsSummary280(item.ko||'')||kos.filter(Boolean).length!==ens.length)summaryBlocks++;
      });
    });
    report.courses[course]={speaking,englishSentences,safePairs,unsafePairs,summaryBlocks};
  });
  return report;
};

setTimeout(refreshSpeakingKo280,0);
})();



/* inline script 52: v532282UnifiedPlaybackSessionStandard */

/* ===== V5.3.285 · MP3 RECORDING SAVE UI =====
   - Free voice recording: replaces compare-sequence button with Listen + MP3 Save.
   - MP3 Save is disabled until a recording exists.
   - Save opens an editable filename sheet and focuses the input so the mobile keyboard opens.
   - Speaking practice uses the same MP3 save controller and lesson/sentence/timestamp naming.
*/

/* ===== V5.3.282 · UNIFIED PLAYBACK SESSION STANDARD =====
   One playback session across DAY / MY / SORI / OPIC / FRIENDS.
   Rules:
   1) Top "전체 반복 시작" and per-course "선택한 ... 전체 반복" are independent commands.
      A course button NEVER delegates to the top integrated-repeat button.
   2) HOME = PAUSE + CHECKPOINT. Pressing the same start command resumes that checkpoint.
   3) Pressing a DIFFERENT playback command clears the old checkpoint and starts the new scope at the beginning.
   4) Directly opening one MY/SORI/OPIC/FRIENDS lesson and pressing the bottom play button plays that lesson only,
      pauses/resumes in place, and stops after one complete lesson cycle.
*/
(function(){
'use strict';

const COURSE_NAMES_281={day:'DAY VOCA',my:'MY 수업',sori:'소리영어',opic:'OPIC',friends:'FRIENDS'};
const VALID_281=['day','my','sori','opic','friends'];
const MV281=window.MV_PLAYBACK_STANDARD_281={
  version:'5.3.284',
  kind:'idle',              // idle | course | overall | single
  scope:null,               // day | my | sori | opic
  status:'idle',            // idle | playing | paused
  lesson:null,
  selectionKey:'',
  screen:null,
  m536Checkpoint:null,
  overallPause:null,
  direct:null,
  reason:''
};
window.MV_PLAYBACK_SESSION_281=MV281;
window.MV_PLAYBACK_STANDARD_282=MV281;
window.MV_PLAYBACK_SESSION_282=MV281;

const SINGLE281={active:false,course:null,lesson:null};
window.MV_SINGLE_LESSON_281=SINGLE281;

function mv281Arr(v){return [...new Set((Array.isArray(v)?v:[]).map(Number).filter(Number.isFinite))].sort((a,b)=>a-b)}
function mv281Read(key,fallback=[]){try{return mv281Arr(JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback)))}catch(e){return mv281Arr(fallback)}}
function mv281Write(key,v){try{localStorage.setItem(key,JSON.stringify(mv281Arr(v)))}catch(e){}}
function mv281DayKey(){try{return selectedDaysKey()}catch(e){return 'mv_selected_days'}}
function mv281Mode(){
  try{return window.currentHomeStudyMode212?.()||window.MV_HOME_MODE_212||'day'}catch(e){return 'day'}
}
function mv281ModeSelection(mode){
  if(mode==='day')return mv281Read(mv281DayKey(),[]);
  if(mode==='my')return mv281Read('mv_myClassSelectedLessons',[]);
  if(mode==='sori')return mv281Read('mv_studySelected_sori',[]);
  if(mode==='opic')return mv281Read('mv_studySelected_opic',[]);
  if(mode==='friends')return mv281Read('mv_studySelected_friends',Object.keys(studyCourseMeta('friends')||{}).map(Number).filter(Number.isFinite));
  return [];
}
function mv281PersistVisible(mode){
  try{
    if(mode==='day'){
      const ids=[...document.querySelectorAll('#dayGrid .daySelectCheck:not(:disabled):checked')].map(x=>Number(x.dataset.checkDay));
      mv281Write(mv281DayKey(),ids);return;
    }
    if(mode==='my'){
      const ids=[...document.querySelectorAll('#homePage .myClassSection .myClassSelectCheck:checked')].map(x=>Number(x.dataset.myLesson||x.dataset.studyId));
      mv281Write('mv_myClassSelectedLessons',ids);return;
    }
    if(mode==='friends')return;
    const key=mode==='sori'?'mv_studySelected_sori':'mv_studySelected_opic';
    const ids=[...document.querySelectorAll(`#homePage .studySelectCheck[data-study-mode="${mode}"]:checked`)].map(x=>Number(x.dataset.studyId));
    mv281Write(key,ids);
  }catch(e){}
}
function mv281SelectionKey(mode){
  const selected=mv281ModeSelection(mode);
  let extra='';
  try{
    if(mode==='day'){
      const studyMode=document.getElementById('selectedStudyMode')?.value||localStorage.getItem(selectedStudyModeKey())||'all';
      const order=document.getElementById('orderMode')?.value||localStorage.getItem(packKey('order'))||'book';
      extra=`|${studyMode}|${order}`;
    }else{
      const fav=!!window.studyFavoriteOnly239?.(mode);
      const parts=window.studyRepeatParts206?.(mode)||[];
      extra=`|fav:${fav?'1':'0'}|parts:${JSON.stringify(parts)}`;
    }
  }catch(e){}
  return `${mode}:${JSON.stringify(selected)}${extra}`;
}
function mv281Screen(){
  try{return {course:String(ACTIVE_STUDY_COURSE||M536?.course||'my'),lesson:Number(myClassLessonNo)||1,tab:String(myClassTab||'corrections')}}catch(e){return null}
}
function mv281CaptureM536(){
  try{
    const mode=(M536.mode==='full'||M536.mode==='infinite')?M536.mode:String(M536_TOGGLE_STATE.pausedMode||'idle');
    const bg=window.MV_BG_PLAYBACK_207||{};
    return {
      mode,
      course:String(M536.course||M536_TOGGLE_STATE.pausedCourse||ACTIVE_STUDY_COURSE||'my'),
      cursor:Math.max(0,Number(M536.cursor)||Number(M536_TOGGLE_STATE.pausedCursor)||0),
      rep:Math.max(0,Number(bg.rep)||0),
      itemDone:!!bg.itemDone,
      nextCursor:Math.max(0,Number(bg.nextCursor)||0),
      itemKey:String(bg.itemKey||''),
      infiniteItem:M536.infiniteItem?{...M536.infiniteItem}:(M536_TOGGLE_STATE.pausedInfiniteItem?{...M536_TOGGLE_STATE.pausedInfiniteItem}:null)
    };
  }catch(e){return null}
}
/* ===== V5.4.19 · PERSISTENT PLAYBACK POSITION STANDARD =====
   UI is unchanged. Only the playback start cursor is persisted.
   - DAY uses the existing mv_selected_auto_progress_v1 payload.
   - MY / SORI / OPIC / FRIENDS use one shared resume store.
   - Course selection/repeat-range changes invalidate that course checkpoint naturally
     through selectionKey matching.
   - A checkpoint is item-level: resuming restarts the saved sentence/item from its beginning.
*/
const MV_PLAYBACK_RESUME_KEY_419='sayward_playback_resume_v1';
function mv419ResumeStore(){
  try{const x=JSON.parse(localStorage.getItem(MV_PLAYBACK_RESUME_KEY_419)||'{}');return x&&typeof x==='object'?x:{}}catch(e){return {}}
}
function mv419WriteResumeStore(store){
  try{localStorage.setItem(MV_PLAYBACK_RESUME_KEY_419,JSON.stringify(store||{}))}catch(e){}
}
function mv419ResumeId(kind,scope,lesson=null){
  return kind==='single'?`single:${scope}:${Number(lesson)||1}`:`course:${scope}`;
}
function mv419NormalizeCheckpoint(cp,scope){
  if(!cp)return null;
  let cursor=Math.max(0,Number(cp.cursor)||0);
  if(cp.itemDone)cursor=Math.max(0,Number(cp.nextCursor)||0);
  return {
    mode:'full',course:String(scope||cp.course||'my'),cursor,rep:0,
    itemDone:false,nextCursor:cursor,itemKey:cp.itemDone?'':String(cp.itemKey||''),infiniteItem:null
  };
}
function mv419SaveResume(kind,scope,lesson=null,cp=null,screen=null){
  if(!['course','single'].includes(String(kind||'')))return false;
  const c=String(scope||'');if(!['my','sori','opic','friends'].includes(c))return false;
  const normalized=mv419NormalizeCheckpoint(cp,c);if(!normalized)return false;
  const store=mv419ResumeStore();
  const id=mv419ResumeId(kind,c,lesson);
  store[id]={
    version:1,kind,c,lesson:kind==='single'?(Number(lesson)||1):null,
    selectionKey:kind==='course'?mv281SelectionKey(c):'',
    checkpoint:normalized,
    screen:screen?{course:c,lesson:Number(screen.lesson)||1,tab:String(screen.tab||'corrections')}:null,
    savedAt:Date.now()
  };
  mv419WriteResumeStore(store);return true;
}
function mv419LoadResume(kind,scope,lesson=null){
  const c=String(scope||'');
  const row=mv419ResumeStore()[mv419ResumeId(kind,c,lesson)];
  if(!row||row.kind!==kind||row.c!==c)return null;
  if(kind==='course'&&row.selectionKey!==mv281SelectionKey(c))return null;
  if(kind==='single'&&Number(row.lesson)!==(Number(lesson)||1))return null;
  return row;
}
function mv419ClearResume(kind,scope,lesson=null){
  const store=mv419ResumeStore();delete store[mv419ResumeId(kind,String(scope||''),lesson)];mv419WriteResumeStore(store);
}
function mv419SaveActiveResume(){
  try{
    const kind=MV281.kind==='single'?'single':(MV281.kind==='course'?'course':null);
    if(!kind)return false;
    const scope=String(M536?.course||MV281.scope||ACTIVE_STUDY_COURSE||'my');
    if(!['my','sori','opic','friends'].includes(scope))return false;
    const cp=mv281CaptureM536();
    const screen=mv281Screen();
    return mv419SaveResume(kind,scope,kind==='single'?(MV281.lesson||myClassLessonNo):null,cp,screen);
  }catch(e){return false}
}
function mv419TrackRunningItem(course,cursor,item){
  try{
    if(M536.mode!=='full')return;
    const kind=MV281.kind==='single'?'single':(MV281.kind==='course'?'course':null);
    if(!kind)return;
    const c=String(course||M536.course||ACTIVE_STUDY_COURSE||'my');
    const cp={mode:'full',course:c,cursor:Math.max(0,Number(cursor)||0),rep:0,itemDone:false,nextCursor:Math.max(0,Number(cursor)||0),itemKey:item?m536ItemKey(item):'',infiniteItem:null};
    const screen=item?{course:c,lesson:Number(item.lesson)||1,tab:String(item.tab||'corrections')}:mv281Screen();
    mv419SaveResume(kind,c,kind==='single'?(MV281.lesson||item?.lesson||myClassLessonNo):null,cp,screen);
  }catch(e){}
}
function mv419ResetAllPlaybackPositions(){
  try{localStorage.removeItem(MV_PLAYBACK_RESUME_KEY_419)}catch(e){}
  try{clearSelectedProgress?.()}catch(e){try{localStorage.removeItem('mv_selected_auto_progress_v1')}catch(x){}}
  try{mv281AbortSession?.('playback-position-reset')}catch(e){}
  try{mv281ResetM536Resume?.()}catch(e){}
  try{learningPlaybackPaused=true;updateLearningPlaybackButton?.()}catch(e){}
  return true;
}
window.mv419SaveResume=mv419SaveResume;
window.mv419LoadResume=mv419LoadResume;
window.mv419ClearResume=mv419ClearResume;
window.mv419SaveActiveResume=mv419SaveActiveResume;
window.mv419TrackRunningItem=mv419TrackRunningItem;
window.mv419ResetAllPlaybackPositions=mv419ResetAllPlaybackPositions;

function mv281ResetM536Resume(){
  try{
    M536_TOGGLE_STATE.pausedMode='idle';
    M536_TOGGLE_STATE.pausedCourse='my';
    M536_TOGGLE_STATE.pausedCursor=0;
    M536_TOGGLE_STATE.pausedInfiniteItem=null;
  }catch(e){}
  try{if(window.MV_BG_SYNC_275)window.MV_BG_SYNC_275.suspended=false}catch(e){}
  try{if(window.MV_BG_PLAYBACK_207){MV_BG_PLAYBACK_207.restorePending=false;MV_BG_PLAYBACK_207.wasActive=false;MV_BG_PLAYBACK_207.hidden=false}}catch(e){}
}
function mv281ClearOuter(clearSnapshot=true){
  try{
    const s=window.MV_ALL_REPEAT_219;
    if(s){s.active=false;s.token=(Number(s.token)||0)+1;if(clearSnapshot){s.queue=[];s.index=0;s.current='';s.snapshot=null;s.favoriteOnlySnapshot=null}}
  }catch(e){}
  try{if(window.MV_ALL_REPEAT_215){MV_ALL_REPEAT_215.active=false;MV_ALL_REPEAT_215.queue=[];MV_ALL_REPEAT_215.current='';MV_ALL_REPEAT_215.token=(Number(MV_ALL_REPEAT_215.token)||0)+1}}catch(e){}
  try{if(window.MV_ALL_REPEAT_209){MV_ALL_REPEAT_209.active=false;MV_ALL_REPEAT_209.queue=[];MV_ALL_REPEAT_209.current=''}}catch(e){}
  window.MV_DAY_ONCE_COMPLETE_219=null;
  window.MV_COURSE_ONCE_COMPLETE_219=null;
  window.MV_ALL_REPEAT_INTERNAL_START_222=false;
}
function mv281AbortSession(reason='new-command'){
  mv281ClearOuter(true);
  try{if(typeof AUTO!=='undefined'&&AUTO){AUTO.active=false;AUTO.token++}}catch(e){}
  try{stopDayLoop?.(true)}catch(e){}
  try{stopAllMyClassPlayback?.(true)}catch(e){}
  try{stopSpeech?.()}catch(e){}
  try{window.speechSynthesis?.cancel()}catch(e){}
  // v5.4.19: playback positions are independent by learning scope; only Config reset or normal completion clears them.
  mv281ResetM536Resume();
  SINGLE281.active=false;SINGLE281.course=null;SINGLE281.lesson=null;
  MV281.kind='idle';MV281.scope=null;MV281.status='idle';MV281.lesson=null;
  MV281.selectionKey='';MV281.screen=null;MV281.m536Checkpoint=null;MV281.overallPause=null;MV281.direct=null;MV281.reason=reason;
}
window.mv281AbortSession=mv281AbortSession;

function mv281RestoreSelection(course,arr){
  const ids=mv281Arr(arr),set=new Set(ids);
  try{
    if(course==='day'){
      mv281Write(mv281DayKey(),ids);
      document.querySelectorAll('#dayGrid .daySelectCheck:not(:disabled)').forEach(c=>{
        c.checked=set.has(Number(c.dataset.checkDay));c.closest('.dayCard')?.classList.toggle('selectedDay',c.checked);
      });
    }else if(course==='my'){
      mv281Write('mv_myClassSelectedLessons',ids);
      document.querySelectorAll('#homePage .myClassSection .myClassSelectCheck').forEach(c=>{
        c.checked=set.has(Number(c.dataset.myLesson||c.dataset.studyId));c.closest('.myClassCard')?.classList.toggle('myClassChecked',c.checked);
      });
    }else{
      mv281Write(course==='sori'?'mv_studySelected_sori':course==='friends'?'mv_studySelected_friends':'mv_studySelected_opic',ids);
      document.querySelectorAll(`#homePage .studySelectCheck[data-study-mode="${course}"]`).forEach(c=>{
        c.checked=set.has(Number(c.dataset.studyId));c.closest('.myClassCard')?.classList.toggle('myClassChecked',c.checked);
      });
    }
  }catch(e){}
}

function mv281ShowM536Page(course,screen=null){
  try{document.getElementById('homePage')?.classList.add('hidden')}catch(e){}
  try{document.getElementById('dayAppPage')?.classList.add('hidden')}catch(e){}
  try{hideStandalonePages?.()}catch(e){}
  document.getElementById('myClassPage')?.classList.remove('hidden');
  document.getElementById('myClassBottom')?.classList.remove('hidden');
  try{
    ACTIVE_STUDY_COURSE=course;M536.course=course;
    if(screen){myClassLessonNo=Number(screen.lesson)||1;myClassTab=String(screen.tab||studyCourseOrder(course)?.[0]||'corrections')}
    myClassUpdateHeader?.();renderMyClass?.();studySyncCourseUI?.();
  }catch(e){}
}
function mv281ShowDayPage(){
  document.getElementById('homePage')?.classList.add('hidden');
  document.getElementById('dayAppPage')?.classList.remove('hidden');
}
function mv281ResolveResumeCursor(cp,course){
  let cursor=Math.max(0,Number(cp?.cursor)||0),rep=Math.max(0,Number(cp?.rep)||0);
  try{
    const list=m536BuildPlaylist(course)||[];
    if(!list.length)return {cursor:0,rep:0};
    if(cp?.itemDone){cursor=Math.max(0,Math.min(list.length-1,Number(cp.nextCursor)||0));rep=0}
    else if(cp?.itemKey){const hit=list.findIndex(x=>m536ItemKey(x)===cp.itemKey);if(hit>=0)cursor=hit}
    cursor=Math.max(0,Math.min(list.length-1,cursor));
  }catch(e){}
  return {cursor,rep};
}
function mv281ResumeM536(course,cp,screen){
  mv281ShowM536Page(course,screen);
  try{M536_TOGGLE_STATE.pausedMode='idle';M536_TOGGLE_STATE.pausedInfiniteItem=null}catch(e){}
  if(cp?.mode==='infinite'&&cp.infiniteItem){
    try{m536RunInfinite({...cp.infiniteItem,course});return true}catch(e){return false}
  }
  const at=mv281ResolveResumeCursor(cp,course);
  try{m536RunFull(at.cursor,at.rep);return true}catch(e){
    try{return window.m536ResumeGlobal?.()!==false}catch(x){return false}
  }
}

function mv281PauseM536(kind,scope,lesson=null){
  const cp=mv281CaptureM536();
  const screen=mv281Screen();
  try{if(typeof m536IsPlaying==='function'&&m536IsPlaying())m536PauseGlobal()}catch(e){}
  MV281.kind=kind;MV281.scope=scope;MV281.status='paused';MV281.lesson=lesson;MV281.screen=screen;MV281.m536Checkpoint=cp;
  if(kind==='course')MV281.selectionKey=mv281SelectionKey(scope);
  if(kind==='single'){SINGLE281.active=true;SINGLE281.course=scope;SINGLE281.lesson=Number(lesson)||Number(screen?.lesson)||1}
  try{mv419SaveResume(kind,scope,kind==='single'?(lesson||screen?.lesson):null,cp,screen)}catch(e){}
  try{myClassSyncButtons?.()}catch(e){}
}

function mv281NavigateHome(){
  // Overall state is frozen, not destroyed.
  const outer=window.MV_ALL_REPEAT_219;
  const outerActive=!!outer?.active;
  const activeCourse=String(outer?.current||MV281.scope||(()=>{try{return M536.course||ACTIVE_STUDY_COURSE||'my'}catch(e){return 'my'}})());

  if(outerActive){
    if(activeCourse==='day'){
      try{saveSelectedProgress?.();if(!learningPlaybackPaused)pauseLearningPlayback?.()}catch(e){}
      try{if(typeof AUTO!=='undefined'&&AUTO){AUTO.active=false;AUTO.token++}}catch(e){}
      MV281.m536Checkpoint=null;
    }else{
      const cp=mv281CaptureM536();
      try{if(typeof m536IsPlaying==='function'&&m536IsPlaying())m536PauseGlobal()}catch(e){}
      MV281.m536Checkpoint=cp;
    }
    MV281.kind='overall';MV281.scope=activeCourse;MV281.status='paused';MV281.screen=mv281Screen();
    MV281.overallPause={
      queue:[...(outer.queue||[])],index:Number(outer.index)||0,current:String(outer.current||activeCourse),
      snapshot:outer.snapshot?JSON.parse(JSON.stringify(outer.snapshot)):null,
      favoriteOnlySnapshot:outer.favoriteOnlySnapshot?{...outer.favoriteOnlySnapshot}:null
    };
    outer.active=false;outer.token=(Number(outer.token)||0)+1;
    window.MV_DAY_ONCE_COMPLETE_219=null;window.MV_COURSE_ONCE_COMPLETE_219=null;
  }else if(typeof m536IsPlaying==='function'&&m536IsPlaying()){
    const kind=MV281.kind==='single'?'single':'course';
    const scope=String(M536.course||ACTIVE_STUDY_COURSE||MV281.scope||'my');
    mv281PauseM536(kind,scope,kind==='single'?(MV281.lesson||myClassLessonNo):null);
  }else if(typeof AUTO!=='undefined'&&AUTO?.active){
    try{saveSelectedProgress?.();pauseLearningPlayback?.()}catch(e){}
    try{AUTO.active=false;AUTO.token++}catch(e){}
    MV281.kind='course';MV281.scope='day';MV281.status='paused';MV281.selectionKey=mv281SelectionKey('day');MV281.screen=null;MV281.m536Checkpoint=null;
  }

  try{if(currentCardRepeatActive)stopCurrentCardRepeatImmediately()}catch(e){}
  try{stopSpeech?.();window.speechSynthesis?.cancel()}catch(e){}
  try{stopRepeatWakeSession?.();forceReleaseWakeLock?.()}catch(e){}
  document.getElementById('myClassPage')?.classList.add('hidden');
  document.getElementById('myClassBottom')?.classList.add('hidden');
  document.getElementById('dayAppPage')?.classList.add('hidden');
  document.getElementById('homePage')?.classList.remove('hidden');
  try{hideStandalonePages?.()}catch(e){}
  try{updateHomeDashboard?.()}catch(e){}
  const homeMode=VALID_281.includes(MV281.scope)?MV281.scope:mv281Mode();
  try{window.setHomeStudyMode?.(homeMode)}catch(e){}
  MV281.direct=null;
  try{window.scrollTo({top:0,behavior:'auto'})}catch(e){window.scrollTo(0,0)}
  setTimeout(mv281SyncUI,0);
}
window.mv281NavigateHome=mv281NavigateHome;

function mv281StartFreshCourse(mode){
  mv281AbortSession('new-course:'+mode);
  mv281PersistVisible(mode);
  const selected=mv281ModeSelection(mode);
  if(!selected.length){alert(mode==='day'?'학습할 Day를 하나 이상 선택해 주세요.':`${COURSE_NAMES_281[mode]||'학습'} 항목을 하나 이상 선택해 주세요.`);return false}
  MV281.kind='course';MV281.scope=mode;MV281.status='playing';MV281.selectionKey=mv281SelectionKey(mode);MV281.reason='fresh-course';
  if(mode==='day'){
    // startSelectedAutoLearning already validates selection/order/studyMode and resumes its saved card.
    try{startSelectedAutoLearning();return true}catch(e){MV281.status='idle';return false}
  }
  try{
    ACTIVE_STUDY_COURSE=mode;M536.course=mode;
    const saved=mv419LoadResume('course',mode);
    if(saved?.checkpoint){
      MV281.reason='persistent-resume-course';
      MV281.screen=saved.screen||null;MV281.m536Checkpoint=saved.checkpoint;
      return mv281ResumeM536(mode,saved.checkpoint,saved.screen);
    }
    window.m536StartCourse?.(mode);
    return true;
  }catch(e){MV281.status='idle';return false}
}
function mv281ResumeCourse(mode){
  if(MV281.kind!=='course'||MV281.status!=='paused'||MV281.scope!==mode)return false;
  if(MV281.selectionKey!==mv281SelectionKey(mode))return false;
  MV281.status='playing';MV281.reason='resume-course';
  if(mode==='day'){
    try{startSelectedAutoLearning();return true}catch(e){MV281.status='paused';return false}
  }
  return mv281ResumeM536(mode,MV281.m536Checkpoint,MV281.screen);
}
function mv281CourseStart(mode){
  mode=VALID_281.includes(mode)?mode:'day';
  mv281PersistVisible(mode);
  if(mv281ResumeCourse(mode)){mv281SyncUI();return true}
  const ok=mv281StartFreshCourse(mode);mv281SyncUI();return ok;
}
window.mv281CourseStart=mv281CourseStart;

function mv281FreezeOverallState(){
  const s=window.MV_ALL_REPEAT_219;
  if(!s)return null;
  return {queue:[...(s.queue||[])],index:Number(s.index)||0,current:String(s.current||''),snapshot:s.snapshot?JSON.parse(JSON.stringify(s.snapshot)):null,favoriteOnlySnapshot:s.favoriteOnlySnapshot?{...s.favoriteOnlySnapshot}:null};
}
function mv281ResumeOverall(){
  const saved=MV281.overallPause;
  const s=window.MV_ALL_REPEAT_219;
  if(!saved||!s)return false;
  mv281ClearOuter(false);
  s.queue=[...(saved.queue||[])];s.index=Math.max(0,Number(saved.index)||0);s.current=String(saved.current||s.queue[s.index]||MV281.scope||'day');
  s.snapshot=saved.snapshot?JSON.parse(JSON.stringify(saved.snapshot)):null;
  s.favoriteOnlySnapshot=saved.favoriteOnlySnapshot?{...saved.favoriteOnlySnapshot}:null;
  s.active=true;s.token=(Number(s.token)||0)+1;
  const token=s.token,course=s.current;
  MV281.kind='overall';MV281.scope=course;MV281.status='playing';MV281.reason='resume-overall';
  if(s.snapshot?.[course])mv281RestoreSelection(course,s.snapshot[course]);

  const complete=()=>{if(!s.active||token!==s.token)return;window.advanceAllRepeat219?.()};
  if(course==='day'){
    window.MV_DAY_ONCE_COMPLETE_219=complete;window.MV_COURSE_ONCE_COMPLETE_219=null;
    try{startSelectedAutoLearning();setTimeout(mv281SyncUI,0);return true}catch(e){s.active=false;MV281.status='paused';return false}
  }
  window.MV_COURSE_ONCE_COMPLETE_219=complete;window.MV_DAY_ONCE_COMPLETE_219=null;
  try{window.studyFavoriteSetOnly239?.(course,!!s.favoriteOnlySnapshot?.[course])}catch(e){}
  const ok=mv281ResumeM536(course,MV281.m536Checkpoint,MV281.screen);
  setTimeout(mv281SyncUI,0);return ok;
}
function mv281StartOverall(){
  const mode=mv281Mode();
  // v5.3.282: HOME keeps the checkpoint, but it is resumed only when the
  // learner starts again from the SAME visible study mode.  If the learner
  // changed DAY/MY/SORI/OPIC/FRIENDS and presses the top start button, that is a new
  // command: clear the old checkpoint and start from the newly selected mode.
  if(MV281.kind==='overall'&&MV281.status==='paused'&&MV281.overallPause&&MV281.scope===mode)return mv281ResumeOverall();
  mv281AbortSession('new-overall:'+mode);
  let ok=false;
  try{ok=window.startAllRepeat219?.(mode)!==false}catch(e){ok=false}
  if(ok){MV281.kind='overall';MV281.status='playing';MV281.scope=String(window.MV_ALL_REPEAT_219?.current||mode);MV281.overallPause=null;MV281.reason='fresh-overall'}
  mv281SyncUI();return ok;
}
window.mv281StartOverall=mv281StartOverall;

function mv281SingleDone(course){
  const completedLesson=Number(MV281.lesson||SINGLE281.lesson||myClassLessonNo)||1;
  try{mv419ClearResume('single',String(course||MV281.scope||'my'),completedLesson)}catch(e){}
  SINGLE281.active=false;SINGLE281.course=null;SINGLE281.lesson=null;
  MV281.kind='idle';MV281.scope=null;MV281.status='idle';MV281.lesson=null;MV281.selectionKey='';MV281.m536Checkpoint=null;MV281.reason='single-complete';
  try{M536_TOGGLE_STATE.pausedMode='idle';M536_TOGGLE_STATE.pausedInfiniteItem=null}catch(e){}
  try{myClassSetStatus?.('이 수업 전체 재생이 완료되었습니다',false);myClassSyncButtons?.()}catch(e){}
}
function mv281ArmSingleDone(course){
  window.MV_DAY_ONCE_COMPLETE_219=null;
  window.MV_COURSE_ONCE_COMPLETE_219=(doneCourse)=>{window.MV_COURSE_ONCE_COMPLETE_219=null;mv281SingleDone(doneCourse||course)};
}
function mv281StartSingle(course,lesson){
  const direct={course:String(course),lesson:Number(lesson)||1};
  mv281AbortSession('new-single');
  MV281.direct={...direct};
  MV281.kind='single';MV281.scope=direct.course;MV281.lesson=direct.lesson;MV281.status='playing';MV281.reason='fresh-single';
  SINGLE281.active=true;SINGLE281.course=direct.course;SINGLE281.lesson=direct.lesson;
  try{
    ACTIVE_STUDY_COURSE=direct.course;M536.course=direct.course;myClassLessonNo=direct.lesson;
    const order=studyCourseOrder(direct.course)||['corrections','chunks','speaking'];
    const picked=window.studyRepeatParts206?.(direct.course)||order;
    myClassTab=order.find(x=>picked.includes(x))||order[0]||'corrections';
    myClassUpdateHeader?.();renderMyClass?.();
    MV281.screen=mv281Screen();
    mv281ArmSingleDone(direct.course);
    const saved=mv419LoadResume('single',direct.course,direct.lesson);
    if(saved?.checkpoint){
      MV281.reason='persistent-resume-single';
      MV281.screen=saved.screen||MV281.screen;MV281.m536Checkpoint=saved.checkpoint;
      const at=mv281ResolveResumeCursor(saved.checkpoint,direct.course);
      m536RunFull(at.cursor,0);
    }else{
      m536RunFull(0,0);
    }
    myClassSyncButtons?.();
    return true;
  }catch(e){mv281SingleDone(direct.course);return false}
}
function mv281ResumeSingle(){
  if(MV281.kind!=='single'||MV281.status!=='paused'||!MV281.scope||!MV281.lesson)return false;
  SINGLE281.active=true;SINGLE281.course=MV281.scope;SINGLE281.lesson=MV281.lesson;
  mv281ArmSingleDone(MV281.scope);
  MV281.status='playing';MV281.reason='resume-single';
  return mv281ResumeM536(MV281.scope,MV281.m536Checkpoint,MV281.screen);
}

// m536BuildPlaylist -> m536Lessons -> studyCourseSelectedLessons.
// While a direct lesson session is active, make that canonical lesson list exactly one lesson.
const baseSelected281=window.studyCourseSelectedLessons;
function selectedLessons281(course){
  const c=String(course||'my');
  if(SINGLE281.active&&SINGLE281.course===c)return [Number(SINGLE281.lesson)||1];
  try{return baseSelected281?baseSelected281(c):[]}catch(e){return []}
}
window.studyCourseSelectedLessons=selectedLessons281;
try{studyCourseSelectedLessons=selectedLessons281}catch(e){}

// Direct card opening is VIEW ONLY. It does not destroy a paused session.
const baseDirect281=window.studyDirectOpenCourse;
function directOpen281(course,lesson=1){
  const c=VALID_281.includes(String(course))?String(course):'my',n=Math.max(1,Number(lesson)||1);
  const prior={kind:MV281.kind,scope:MV281.scope,status:MV281.status,lesson:MV281.lesson,selectionKey:MV281.selectionKey,screen:MV281.screen,m536Checkpoint:MV281.m536Checkpoint,overallPause:MV281.overallPause,reason:MV281.reason};
  let out=true;
  try{out=baseDirect281?baseDirect281(c,n):true}catch(e){out=false}
  // base direct navigation hard-stops visible engines, but a HOME checkpoint belongs to the previous command.
  if(prior.status==='paused'){
    MV281.kind=prior.kind;MV281.scope=prior.scope;MV281.status=prior.status;MV281.lesson=prior.lesson;MV281.selectionKey=prior.selectionKey;
    MV281.screen=prior.screen;MV281.m536Checkpoint=prior.m536Checkpoint;MV281.overallPause=prior.overallPause;MV281.reason=prior.reason;
  }
  MV281.direct={course:c,lesson:n};
  setTimeout(mv281SyncUI,0);
  return out;
}
window.studyDirectOpenCourse=directOpen281;
try{studyDirectOpenCourse=directOpen281}catch(e){}

function mv281ToggleM536(){
  const playing=(()=>{try{return m536IsPlaying()}catch(e){return false}})();
  if(playing){
    const outer=!!window.MV_ALL_REPEAT_219?.active;
    const kind=outer?'overall':(MV281.kind==='single'?'single':'course');
    const scope=String(M536.course||ACTIVE_STUDY_COURSE||MV281.scope||'my');
    const lesson=kind==='single'?(MV281.lesson||myClassLessonNo):null;
    const cp=mv281CaptureM536(),screen=mv281Screen();
    try{m536PauseGlobal()}catch(e){return false}
    MV281.kind=kind;MV281.scope=scope;MV281.status='paused';MV281.lesson=lesson;MV281.screen=screen;MV281.m536Checkpoint=cp;
    if(kind==='course')MV281.selectionKey=mv281SelectionKey(scope);
    if(kind==='single'){SINGLE281.active=true;SINGLE281.course=scope;SINGLE281.lesson=Number(lesson)||1}
    try{mv419SaveResume(kind,scope,kind==='single'?lesson:null,cp,screen)}catch(e){}
    MV281.reason='bottom-pause';
    myClassSyncButtons?.();return true;
  }

  if(MV281.kind==='single'&&MV281.status==='paused'&&MV281.scope===String(ACTIVE_STUDY_COURSE||M536.course||'')){
    const ok=mv281ResumeSingle();myClassSyncButtons?.();return ok;
  }
  if(MV281.kind==='overall'&&MV281.status==='paused'&&window.MV_ALL_REPEAT_219?.active){
    MV281.status='playing';MV281.reason='bottom-resume-overall';
    const ok=mv281ResumeM536(MV281.scope,MV281.m536Checkpoint,MV281.screen);myClassSyncButtons?.();return ok;
  }
  if(MV281.kind==='course'&&MV281.status==='paused'&&MV281.scope===String(ACTIVE_STUDY_COURSE||M536.course||'')){
    MV281.status='playing';MV281.reason='bottom-resume-course';
    const ok=mv281ResumeM536(MV281.scope,MV281.m536Checkpoint,MV281.screen);myClassSyncButtons?.();return ok;
  }

  // A directly opened lesson uses a one-lesson, one-cycle session.
  if(MV281.direct){return mv281StartSingle(MV281.direct.course,MV281.direct.lesson)}

  // Fallback: current screen becomes a one-course session starting at the visible card.
  const c=String(ACTIVE_STUDY_COURSE||M536.course||'my');
  mv281AbortSession('bottom-fresh-course');
  MV281.kind='course';MV281.scope=c;MV281.status='playing';MV281.selectionKey=mv281SelectionKey(c);MV281.reason='bottom-fresh-course';
  try{return window.m536ResumeGlobal?.()!==false}catch(e){return false}
}
window.m536ToggleGlobalPlayback=mv281ToggleM536;
try{m536ToggleGlobalPlayback=mv281ToggleM536}catch(e){}

// Bottom button wording is derived from playback state, not from its previous text.
const baseSyncButtons281=window.myClassSyncButtons||(()=>{});
function syncButtons281(){
  try{baseSyncButtons281()}catch(e){}
  const b=document.getElementById('myClassPlayPause');if(!b)return;
  const playing=(()=>{try{return m536IsPlaying()}catch(e){return false}})();
  if(playing)b.innerHTML='⏸<br>일시정지';
  else if(MV281.status==='paused'&&['course','overall','single'].includes(MV281.kind))b.innerHTML='▶<br>계속';
  else if(MV281.direct)b.innerHTML='▶<br>이 수업 시작';
  else b.innerHTML='▶<br>전체 시작';
  b.setAttribute('aria-pressed',playing?'true':'false');
}
window.myClassSyncButtons=syncButtons281;
try{myClassSyncButtons=syncButtons281}catch(e){}

const baseLearningButton281=window.updateLearningPlaybackButton||(()=>{});
function learningButton281(){
  try{baseLearningButton281()}catch(e){}
  const b=document.getElementById('learnPlayPause');if(!b)return;
  if(!learningPlaybackPaused)b.innerHTML='⏸<br>일시정지';
  else if(MV281.status==='paused'&&MV281.scope==='day')b.innerHTML='▶<br>계속';
  else b.innerHTML='▶<br>전체 재생';
}
window.updateLearningPlaybackButton=learningButton281;
try{updateLearningPlaybackButton=learningButton281}catch(e){}

function mv281SyncUI(){
  const top=document.getElementById('homeAllRepeatStart210');
  const toggle=document.getElementById('homeAllRepeat209');
  if(top){
    if(MV281.kind==='overall'&&MV281.status==='paused'&&MV281.overallPause){
      // v5.3.282: HOME is a pause/checkpoint action, but the HOME control
      // returns to its normal label.  Resume-vs-fresh is decided by scope,
      // never by button text.
      const on=!!toggle?.checked;
      top.disabled=!on;top.style.opacity=on?'1':'.45';top.style.cursor=on?'pointer':'default';
      top.textContent=on?'▶ 전체 반복 시작':'▶ 체크 후 시작';
    }else if(window.MV_ALL_REPEAT_219?.active){
      top.disabled=false;top.style.opacity='1';top.textContent=`⏹ 전체 반복 정지 · ${COURSE_NAMES_281[MV_ALL_REPEAT_219.current]||''}`.trim();
    }else{
      const on=!!toggle?.checked;top.disabled=!on;top.style.opacity=on?'1':'.45';top.textContent=on?'▶ 전체 반복 시작':'▶ 체크 후 시작';
    }
  }
  // v5.3.282: HOME start buttons keep their normal labels.  A saved
  // checkpoint is resumed by session/scope state, not by changing the label
  // to '이어 재생'.  The shared toolbar renderer owns its normal wording.
  try{syncButtons281();learningButton281()}catch(e){}
}
window.mv281SyncUI=mv281SyncUI;

// IMPORTANT: capture before the legacy target onclick. Per-course start never calls the overall controller.
document.addEventListener('click',(e)=>{
  const shared=e.target?.closest?.('#sharedStudyStart');
  if(shared){
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    mv281CourseStart(mv281Mode());
    return;
  }
  const top=e.target?.closest?.('#homeAllRepeatStart210');
  if(top){
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    if(MV281.kind==='overall'&&MV281.status==='paused'&&MV281.overallPause&&MV281.scope===mv281Mode()){
      mv281ResumeOverall();return;
    }
    if(window.MV_ALL_REPEAT_219?.active){
      try{window.stopAllRepeat219?.()}catch(x){}
      mv281AbortSession('manual-overall-stop');mv281SyncUI();return;
    }
    if(!document.getElementById('homeAllRepeat209')?.checked)return;
    mv281StartOverall();
    return;
  }
  const home=e.target?.closest?.('#myClassHomeBtn,#learnHomeControl');
  if(home){
    const myPage=document.getElementById('myClassPage'),dayPage=document.getElementById('dayAppPage');
    const relevant=(myPage&&!myPage.classList.contains('hidden'))||(dayPage&&!dayPage.classList.contains('hidden'));
    if(relevant){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();mv281NavigateHome()}
  }
},true);

// Mode switches only change what is visible. They do NOT clear a checkpoint.
document.addEventListener('click',(e)=>{
  if(e.target?.closest?.('#homeModeDay,#homeModeMy,#homeModeSori,#homeModeOpic,#homeModeFriends'))setTimeout(mv281SyncUI,0);
},false);

// If Android/background logic pauses M536, reflect that in the same session state.
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='hidden')return;
  try{if(MV281.status==='playing'&&MV281.scope!=='day')mv419SaveActiveResume()}catch(e){}
  setTimeout(()=>{
    try{
      if(MV281.status==='playing'&&MV281.scope!=='day'&&M536.mode==='idle'&&String(M536_TOGGLE_STATE.pausedMode||'idle')!=='idle'){
        MV281.status='paused';MV281.screen=mv281Screen();MV281.m536Checkpoint=mv281CaptureM536();MV281.reason='background-pause';
        mv419SaveResume(MV281.kind==='single'?'single':'course',MV281.scope,MV281.kind==='single'?MV281.lesson:null,MV281.m536Checkpoint,MV281.screen);
      }
    }catch(e){}
  },0);
});
window.addEventListener('pagehide',()=>{try{if(MV281.status==='playing'&&MV281.scope!=='day')mv419SaveActiveResume()}catch(e){}});
window.addEventListener('beforeunload',()=>{try{if(MV281.status==='playing'&&MV281.scope!=='day')mv419SaveActiveResume()}catch(e){}});

window.mvPlaybackSessionAudit281=function(){
  return {
    version:'5.3.284',
    rule:{home:'pause+checkpoint',sameCommand:'resume',differentCommand:'clear+fresh',courseStartIndependentFromOverall:true,directLesson:'one lesson / one cycle'},
    session:{kind:MV281.kind,scope:MV281.scope,status:MV281.status,lesson:MV281.lesson,reason:MV281.reason},
    outerActive:!!window.MV_ALL_REPEAT_219?.active,
    m536Mode:(()=>{try{return M536.mode}catch(e){return 'n/a'}})(),
    pausedMode:(()=>{try{return M536_TOGGLE_STATE.pausedMode}catch(e){return 'n/a'}})(),
    single:{...SINGLE281}
  };
};

window.mvPlaybackSessionAudit282=function(){
  const visibleMode=mv281Mode();
  return {
    version:'5.3.284',
    rule:{
      home:'pause + checkpoint; HOME label resets to normal start',
      sameModeTopStart:'resume saved checkpoint',
      differentModeTopStart:'clear old checkpoint + start fresh from visible mode',
      scopeDecisionUsesStateNotLabel:true
    },
    visibleMode,
    pausedScope:MV281.status==='paused'?MV281.scope:null,
    wouldResumeTop:MV281.kind==='overall'&&MV281.status==='paused'&&!!MV281.overallPause&&MV281.scope===visibleMode,
    session:{kind:MV281.kind,scope:MV281.scope,status:MV281.status,reason:MV281.reason}
  };
};

setTimeout(()=>{ try{mv281SyncUI()}catch(e){} },0);
})();




/* inline script 53: v532285VerticalBoundarySwipeFixAudit */

window.mvVerticalBoundarySwipeFixAudit285=function(){
  const source=String(document.documentElement.innerHTML||'');
  return {
    version:'v5.3.286',
    scope:['my','sori','opic','friends'],
    verticalTouchstartReceivesEvent:!source.includes('cannot race with the shared standard. This does not prevent a normal tap.'),
    nextFromBottom:'swipe up -> next lesson top',
    previousFromTop:'swipe down -> previous lesson bottom',
    horizontalSwipeStillOwnedAfterDirectionLock:true
  };
};



/* inline script 54: v53286CoursePositionAndCompactCards */

(function(){
  'use strict';
  function normalize286(){
    document.querySelectorAll('#homePage .soriClassSection .soriCourseCard').forEach((card,i)=>{
      const n=Number(card.dataset.studyLesson)||i+1;
      const b=card.querySelector('.myClassTop b');
      if(b)b.textContent=`소리영어 · 수업 ${n}`;
      card.setAttribute('aria-label',`소리영어 수업 ${n}`);
    });
    document.querySelectorAll('#homePage .opicClassSection .opicCourseCard').forEach((card,i)=>{
      const n=Number(card.dataset.studyLesson)||i+1;
      const meta=typeof studyCourseMeta==='function'?(studyCourseMeta('opic')||{}):{};
      const short=meta[n]?.shortTitle||card.querySelector('.myClassTitle')?.textContent||`OPIC ${n}`;
      const top=card.querySelector('.myClassTop b');
      const title=card.querySelector('.myClassTitle');
      if(top)top.textContent=`OPIC ${n}`;
      if(title)title.textContent=short;
      card.setAttribute('aria-label',`OPIC ${n}. ${short}`);
    });
  }
  window.mvNormalizeCourseCards286=normalize286;
  const oldStamp=window.studyStampCourseCards;
  if(typeof oldStamp==='function'&&!oldStamp.__v286){
    const wrapped=function(){const r=oldStamp.apply(this,arguments);try{normalize286()}catch(e){}return r;};
    wrapped.__v286=true;
    window.studyStampCourseCards=wrapped;
    try{studyStampCourseCards=wrapped}catch(e){}
  }
  setTimeout(normalize286,220);
  setTimeout(normalize286,700);
})();



/* inline script 55: v532288SwipeLifetimeFix */

(function(){
'use strict';
if(window.__MV_SWIPE_LIFETIME_FIX_288__)return;
window.__MV_SWIPE_LIFETIME_FIX_288__=true;

const STAGE='.mvSwipeStage246';
let cleanupTimer288=0;
let autoSwipeDepth288=0;

function manualSwipeActive288(){
  try{
    if(window.MV_SWIPE_STANDARD_254?.active?.())return true;
    if(window.mvVerticalLessonSwipe252?.active?.())return true;
  }catch(e){}
  return false;
}
function swipeProtected288(){
  return manualSwipeActive288() || autoSwipeDepth288>0;
}

/* IMPORTANT: normal cleanup never removes a live gesture snapshot.
   force=true is reserved for starting a NEW gesture or actually leaving the page. */
function removeStages288(force=false){
  if(!force && swipeProtected288())return false;
  try{
    document.querySelectorAll(STAGE).forEach(stage=>{
      try{stage.classList.add('mvGhost288')}catch(e){}
      try{stage.remove()}catch(e){try{stage.parentNode&&stage.parentNode.removeChild(stage)}catch(_) {}}
    });
  }catch(e){}
  try{
    if(!document.querySelector(STAGE))document.body.classList.remove('mvSwipeActive246');
  }catch(e){}
  return true;
}
window.mvRemoveSwipeGhosts287=(force)=>removeStages288(!!force);
window.mvRemoveSwipeGhosts288=(force)=>removeStages288(!!force);

function scheduleCleanup288(delay,force=false){
  clearTimeout(cleanupTimer288);
  cleanupTimer288=setTimeout(()=>removeStages288(force),Math.max(0,Number(delay)||0));
}
function multiCleanup288(){
  /* Long enough for the 150–340ms release animation + cleanup margin.
     If the engine still reports active, removeStages288 simply waits. */
  scheduleCleanup288(460,false);
  setTimeout(()=>removeStages288(false),950);
  setTimeout(()=>removeStages288(false),1800);
}

/* The old root-local horizontal engine must stay disabled so one finger gesture
   can create only one page-turn snapshot. Vertical lesson boundary remains separate. */
try{
  const legacy=window.mvSwipePage246;
  if(legacy&&!legacy.__disabled288){
    try{legacy.forceCleanup&&legacy.forceCleanup()}catch(e){}
    legacy.begin=function(){return false};
    legacy.move=function(){return false};
    legacy.end=function(){return false};
    legacy.finalPoint=function(){};
    legacy.active=function(){return false};
    legacy.forceCleanup=function(){removeStages288(true)};
    legacy.__disabled287=true;
    legacy.__disabled288=true;
  }
}catch(e){}

/* Horizontal finger-follow swipe.
   Clean stale layers BEFORE begin. Once begin succeeds, never clean while active(). */
try{
  const s=window.MV_SWIPE_STANDARD_254;
  if(s&&!s.__lifetimePatched288){
    const oldBegin=s.begin,oldEnd=s.end,oldForce=s.forceCleanup;
    s.begin=function(opts){
      try{oldForce&&oldForce.call(s)}catch(e){}
      removeStages288(true);
      return oldBegin?oldBegin.call(s,opts):false;
    };
    s.end=function(cancel){
      try{return oldEnd?oldEnd.call(s,cancel):false}
      finally{multiCleanup288()}
    };
    s.forceCleanup=function(){
      try{oldForce&&oldForce.call(s)}finally{removeStages288(true)}
    };
    s.__lifetimePatched288=true;
  }
}catch(e){}

/* Vertical lesson boundary uses the same lifetime rule. */
try{
  const v=window.mvVerticalLessonSwipe252;
  if(v&&!v.__lifetimePatched288){
    const oldBegin=v.begin,oldEnd=v.end,oldForce=v.forceCleanup;
    v.begin=function(dir,x,y){
      try{oldForce&&oldForce.call(v)}catch(e){}
      removeStages288(true);
      return oldBegin?oldBegin.call(v,dir,x,y):false;
    };
    v.end=function(cancel){
      try{return oldEnd?oldEnd.call(v,cancel):false}
      finally{multiCleanup288()}
    };
    v.forceCleanup=function(){
      try{oldForce&&oldForce.call(v)}finally{removeStages288(true)}
    };
    v.__lifetimePatched288=true;
  }
}catch(e){}

/* Automatic page turns also render the destination underneath the snapshot.
   protect the snapshot for the full async animation, otherwise renderMyClass()
   would erase it at the first frame. */
try{
  const oldAuto=window.mvAutoPlaybackPageTurn255;
  if(oldAuto&&!oldAuto.__lifetimePatched288){
    const wrapped=async function(commit,dir){
      removeStages288(true);
      autoSwipeDepth288++;
      try{return await oldAuto(commit,dir)}
      finally{autoSwipeDepth288=Math.max(0,autoSwipeDepth288-1);multiCleanup288()}
    };
    wrapped.__lifetimePatched288=true;
    window.mvAutoPlaybackPageTurn255=wrapped;
  }
}catch(e){}
try{
  const oldDay=window.mvAutoDayPlaybackTurn255;
  if(oldDay&&!oldDay.__lifetimePatched288){
    const wrapped=async function(commit){
      removeStages288(true);
      autoSwipeDepth288++;
      try{return await oldDay(commit)}
      finally{autoSwipeDepth288=Math.max(0,autoSwipeDepth288-1);multiCleanup288()}
    };
    wrapped.__lifetimePatched288=true;
    window.mvAutoDayPlaybackTurn255=wrapped;
  }
}catch(e){}

/* A real destination render is a good stale-layer cleanup point ONLY when no live
   gesture/automatic page turn owns the snapshot. This is the v5.3.287 regression fix. */
try{
  const oldRender=window.renderMyClass;
  if(oldRender&&!oldRender.__lifetimePatched288){
    const wrapped=function(){
      removeStages288(false);
      const out=oldRender.apply(this,arguments);
      setTimeout(()=>removeStages288(false),0);
      setTimeout(()=>removeStages288(false),520);
      return out;
    };
    wrapped.__lifetimePatched288=true;
    window.renderMyClass=wrapped;
  }
}catch(e){}

/* touchend/cancel starts delayed cleanup; never remove synchronously on finger-up.
   This preserves the visible release/throw animation. */
['touchend','touchcancel','pointerup','pointercancel'].forEach(type=>{
  window.addEventListener(type,()=>multiCleanup288(),{capture:false,passive:true});
});
window.addEventListener('blur',()=>scheduleCleanup288(700,false),{passive:true});
window.addEventListener('pagehide',()=>removeStages288(true),{passive:true});
window.addEventListener('pageshow',()=>scheduleCleanup288(0,false),{passive:true});
window.addEventListener('orientationchange',()=>scheduleCleanup288(180,true),{passive:true});
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='visible')removeStages288(true);
  else scheduleCleanup288(0,false);
},{passive:true});

/* Last-resort orphan watchdog. A user may hold a swipe for a long time, so the
   watchdog MUST NOT delete a snapshot while either swipe engine is active. */
try{
  const observer=new MutationObserver(muts=>{
    for(const m of muts){
      for(const n of m.addedNodes||[]){
        if(n&&n.nodeType===1&&n.matches&&n.matches(STAGE)){
          n.dataset.mvStageBorn288=String(Date.now());
          const check=()=>{
            try{
              if(!n.isConnected)return;
              if(swipeProtected288()){
                setTimeout(check,1800);
                return;
              }
              if(Date.now()-Number(n.dataset.mvStageBorn288||0)>=5000){
                n.classList.add('mvGhost288');n.remove();
                if(!document.querySelector(STAGE))document.body.classList.remove('mvSwipeActive246');
              }
            }catch(e){}
          };
          setTimeout(check,5200);
        }
      }
    }
  });
  observer.observe(document.body,{childList:true});
}catch(e){}

setTimeout(()=>{ try{removeStages288(true)}catch(e){} },0);

window.mvSwipeLifetimeAudit288=function(){
  return {
    version:'v5.3.288',
    rule:'live snapshot remains visible from direction-lock through finger release animation',
    manualActive:manualSwipeActive288(),
    autoSwipeDepth:autoSwipeDepth288,
    protected:swipeProtected288(),
    visibleSwipeStages:document.querySelectorAll(STAGE).length,
    horizontalOwner:'MV_SWIPE_STANDARD_254',
    verticalOwner:'mvVerticalLessonSwipe252',
    cleanup:'stale only while idle; forced only on new gesture/page leave/orientation',
    watchdog:'never removes while finger/auto swipe is active'
  };
};
})();



/* inline script 56: v532289PlaybackBrowsePauseStandard */

/* v5.3.289 · playback/manual-navigation standard
   - A manual MY/SORI/OPIC/FRIENDS tab/lesson swipe never changes the active playback scope.
   - If playback is running, a committed manual navigation PAUSES and checkpoints it.
   - The learner may browse any tab/lesson freely while paused.
   - Bottom Continue returns to the saved playback screen and resumes the same playlist.
   - UI wording stays generic: playing = '일시정지', paused = '계속'. No tab-specific '핵심 교정 계속/Chunk 계속'.
*/
(function(){
'use strict';
if(window.__MV_PLAYBACK_BROWSE_PAUSE_289__)return;
window.__MV_PLAYBACK_BROWSE_PAUSE_289__=true;

const SESSION=window.MV_PLAYBACK_STANDARD_281||window.MV_PLAYBACK_SESSION_281||null;
const SINGLE=window.MV_SINGLE_LESSON_281||null;
const page=()=>document.getElementById('myClassPage');
const pageVisible=()=>{const p=page();return !!p&&!p.classList.contains('hidden')};

function currentScreen289(){
  try{return {course:String(ACTIVE_STUDY_COURSE||M536?.course||'my'),lesson:Number(myClassLessonNo)||1,tab:String(myClassTab||'corrections')}}catch(e){return null}
}
function captureCheckpoint289(){
  try{
    const bg=window.MV_BG_PLAYBACK_207||{};
    return {
      // This function is called while M536 is actively playing, so use the live
      // controller directly. M536_TOGGLE_STATE is intentionally private to the
      // older controller IIFE and must not be referenced from this patch.
      mode:(M536.mode==='full'||M536.mode==='infinite')?M536.mode:'idle',
      course:String(M536.course||ACTIVE_STUDY_COURSE||'my'),
      cursor:Math.max(0,Number(M536.cursor)||0),
      rep:Math.max(0,Number(bg.rep)||0),
      itemDone:!!bg.itemDone,
      nextCursor:Math.max(0,Number(bg.nextCursor)||0),
      itemKey:String(bg.itemKey||''),
      infiniteItem:M536.infiniteItem?{...M536.infiniteItem}:null
    };
  }catch(e){return null}
}
function isPlaying289(){
  try{return typeof m536IsPlaying==='function'&&m536IsPlaying()}catch(e){return false}
}
function pauseForBrowse289(reason='manual-browse'){
  if(!pageVisible()||!isPlaying289())return false;

  const outer=!!window.MV_ALL_REPEAT_219?.active;
  const kind=outer?'overall':(SESSION?.kind==='single'?'single':'course');
  const scope=String(M536.course||ACTIVE_STUDY_COURSE||SESSION?.scope||'my');
  const lesson=kind==='single'?(Number(SESSION?.lesson)||Number(myClassLessonNo)||1):null;
  const cp=captureCheckpoint289();
  const screen=currentScreen289();

  try{m536PauseGlobal()}catch(e){return false}

  if(SESSION){
    SESSION.kind=kind;
    SESSION.scope=scope;
    SESSION.status='paused';
    SESSION.lesson=lesson;
    SESSION.screen=screen;
    SESSION.m536Checkpoint=cp;
    SESSION.reason=reason;
  }
  if(kind==='single'&&SINGLE){
    SINGLE.active=true;SINGLE.course=scope;SINGLE.lesson=Number(lesson)||1;
  }

  // Status is intentionally generic. The action button remains '▶ 계속', because
  // pressing it resumes the saved playback; it never adopts a tab-specific label.
  try{myClassSetStatus?.('⏸ 일시정지 · 화면 탐색 중',false)}catch(e){}
  try{myClassSyncButtons?.()}catch(e){}
  return true;
}
window.mvPausePlaybackForBrowse289=pauseForBrowse289;

/* Shared stop interception for COMMITTED manual swipes.
   The swipe commit functions in older blocks call stopAllMyClassPlayback(true).
   While a course swipe engine is actively committing, convert that hard stop into
   pause+checkpoint instead. Outside that exact context the original hard stop is untouched. */
const originalStop289=window.stopAllMyClassPlayback;
function manualCourseSwipeActive289(){
  if(!pageVisible())return false;
  try{
    return !!(window.MV_SWIPE_STANDARD_254?.active?.()||window.mvVerticalLessonSwipe252?.active?.());
  }catch(e){return false}
}
function stopAllMyClassPlayback289(clearCurrent=true){
  if(manualCourseSwipeActive289()&&isPlaying289()){
    pauseForBrowse289('manual-swipe-pause');
    return;
  }
  return originalStop289?originalStop289(clearCurrent):undefined;
}
window.stopAllMyClassPlayback=stopAllMyClassPlayback289;
try{stopAllMyClassPlayback=stopAllMyClassPlayback289}catch(e){}

/* Manual tab taps use the same rule as swipe. Capture phase replaces legacy
   handlers that used to hard-stop and clear the session. */
document.addEventListener('click',e=>{
  const tab=e.target?.closest?.('.myClassTab');
  if(!tab||!pageVisible())return;
  const next=String(tab.dataset.myclassTab||'');
  if(!next||next===String(myClassTab||''))return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  const paused=pauseForBrowse289('manual-tab-pause');
  myClassTab=next;
  try{renderMyClass?.();studySyncCourseUI?.()}catch(err){console.warn('[v5.3.289] tab render',err)}
  document.querySelectorAll('.myClassTab').forEach(b=>b.classList.toggle('active',b.dataset.myclassTab===myClassTab));
  try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(err){window.scrollTo(0,0)}
  try{myClassSetStatus?.(paused?'⏸ 일시정지 · 화면 탐색 중':'화면 전환',false)}catch(err){}
  try{myClassSyncButtons?.()}catch(err){}
},true);

/* After a committed swipe, older commit code writes '재생 정지'. Restore the
   pause wording on the next frame without changing the destination screen. */
function refreshPausedBrowseUI289(){
  if(!SESSION||SESSION.status!=='paused'||!pageVisible())return;
  if(isPlaying289())return;
  try{myClassSetStatus?.('⏸ 일시정지 · 화면 탐색 중',false)}catch(e){}
  try{myClassSyncButtons?.()}catch(e){}
}
['touchend','pointerup'].forEach(type=>window.addEventListener(type,()=>{
  setTimeout(refreshPausedBrowseUI289,0);
  setTimeout(refreshPausedBrowseUI289,420);
},{passive:true}));

/* Keep generic bottom wording. We deliberately do NOT show '핵심 교정 계속',
   'Chunk 계속', etc. The current action alone determines the label. */
const priorSync289=window.myClassSyncButtons;
function syncButtons289(){
  try{priorSync289?.()}catch(e){}
  const b=document.getElementById('myClassPlayPause');if(!b)return;
  const playing=isPlaying289();
  if(playing)b.innerHTML='⏸<br>일시정지';
  else if(SESSION?.status==='paused'&&['course','overall','single'].includes(String(SESSION.kind||'')))b.innerHTML='▶<br>계속';
  else if(SESSION?.direct)b.innerHTML='▶<br>이 수업 시작';
  else b.innerHTML='▶<br>전체 시작';
  b.setAttribute('aria-pressed',playing?'true':'false');
}
window.myClassSyncButtons=syncButtons289;
try{myClassSyncButtons=syncButtons289}catch(e){}

if(SESSION)SESSION.version='5.3.289';
setTimeout(()=>{ try{refreshPausedBrowseUI289()}catch(e){} },0);

window.mvPlaybackBrowsePauseAudit289=function(){
  return {
    version:'v5.3.289',
    rule:'manual tab/lesson navigation pauses and checkpoints; Continue returns to saved playback screen',
    session:SESSION?{kind:SESSION.kind,scope:SESSION.scope,status:SESSION.status,lesson:SESSION.lesson,reason:SESSION.reason,screen:SESSION.screen}:null,
    currentScreen:currentScreen289(),
    playing:isPlaying289(),
    swipeActive:manualCourseSwipeActive289(),
    button:document.getElementById('myClassPlayPause')?.innerText||'',
    wording:'playing=일시정지, paused=계속; no tab-specific continue label'
  };
};
})();



/* inline script 57: v53292UnifiedSearchRuntime */

(function(){
'use strict';
if(window.__MV_UNIFIED_SEARCH_292__)return;
window.__MV_UNIFIED_SEARCH_292__=true;

const S292={index:null,query:'',filter:'all',results:[],lastScroll:0,lastTarget:null};
const RECENT_KEY='mv_unified_search_recent_292';
const FILTERS=[['all','전체'],['word','단어'],['pattern','패턴'],['chunk','Chunk'],['sentence','문장']];
const TYPE_LABEL={word:'단어',pattern:'패턴',chunk:'Chunk',sentence:'문장'};
const COURSE_LABEL={my:'MY 수업',sori:'소리영어',opic:'OPIC',friends:'FRIENDS'};

const esc292=(s)=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm292=(s)=>String(s??'').normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
const uniq292=(arr)=>[...new Set(arr.filter(Boolean))];
function source292(course,lesson,part=''){
  if(course==='day')return `DAY ${lesson}${part?` · ${part}`:''}`;
  if(course==='opic')return `OPIC ${lesson}${part?` · ${part}`:''}`;
  if(course==='sori')return `소리영어 수업 ${lesson}${part?` · ${part}`:''}`;
  if(course==='friends')return `FRIENDS S01E${String(lesson).padStart(2,'0')}${part?` · ${part}`:''}`;
  return `MY 수업 ${lesson}${part?` · ${part}`:''}`;
}
function add292(out,item){
  const hay=norm292([item.title,item.ko,item.example,item.exampleKo,item.extra,item.source].join(' '));
  if(!hay)return;
  item.hay=hay;item.titleNorm=norm292(item.title);item.koNorm=norm292(item.ko);item.exampleNorm=norm292([item.example,item.exampleKo,item.extra].join(' '));
  out.push(item);
}
function buildIndex292(){
  if(S292.index)return S292.index;
  const out=[];
  const words=(typeof ALL_WORDS!=='undefined'&&Array.isArray(ALL_WORDS))?ALL_WORDS:[];
  words.forEach((w,idx)=>{
    const day=Math.max(1,Number(w?.newDay)||1);
    const wid=String(w?.uniqueId||`${day}:${w?.newNo||idx}:${w?.word||''}`);
    add292(out,{id:`w:${wid}`,type:'word',course:'day',lesson:day,wordId:wid,title:String(w?.word||''),ko:String(w?.meaning||w?.ko||''),example:String(w?.example||''),exampleKo:String(w?.translation||''),extra:[w?.englishMeaning,w?.memoryKo].filter(Boolean).join(' · '),source:source292('day',day,'단어')});
    const pats=[];
    const pushPat=(title,ko='')=>{const t=String(title||'').trim();if(!t||norm292(t)===norm292(w?.word))return;const key=norm292(t);if(pats.some(x=>x.key===key))return;pats.push({key,title:t,ko:String(ko||'')})};
    pushPat(w?.phrase,w?.patternMeaning||'');
    pushPat(w?.collocation,w?.patternMeaning||'');
    const c2=Array.isArray(w?.collocations2)?w.collocations2:[];
    const ck=Array.isArray(w?.collocationsKo)?w.collocationsKo:[];
    c2.forEach((p,j)=>pushPat(p,ck[j]||''));
    pats.forEach((p,j)=>add292(out,{id:`p:${wid}:${j}`,type:'pattern',course:'day',lesson:day,wordId:wid,title:p.title,ko:p.ko||String(w?.patternMeaning||''),example:String(w?.example||''),exampleKo:String(w?.translation||''),extra:String(w?.word||''),source:source292('day',day,'패턴')}));
  });

  ['my','sori','opic','friends'].forEach(course=>{
    let count=0;try{count=Number(studyCourseLessonCount(course))||0}catch(e){}
    for(let lesson=1;lesson<=count;lesson++){
      let d=null;try{d=studyCourseData(course,lesson)}catch(e){d=null}
      if(!d)continue;
      (d.corrections||[]).forEach((x,i)=>{
        const part=(course==='sori'||course==='friends')?'핵심 문장':'핵심 교정';
        add292(out,{id:`${course}:${lesson}:c:${i}`,type:'sentence',course,lesson,tab:'corrections',index:i,title:String(x?.en||''),ko:String(x?.ko||''),example:String(x?.bad||''),extra:[x?.tip,x?.grammar,x?.why].filter(Boolean).join(' · '),source:source292(course,lesson,part)});
      });
      (d.chunks||[]).forEach((x,i)=>add292(out,{id:`${course}:${lesson}:k:${i}`,type:'chunk',course,lesson,tab:'chunks',index:i,title:String(x?.pattern||''),ko:String(x?.ko||''),example:String(x?.example||''),exampleKo:String(x?.exampleKo||''),extra:String(x?.source||''),source:source292(course,lesson,'Chunk')}));
      (d.speaking||[]).forEach((x,i)=>add292(out,{id:`${course}:${lesson}:s:${i}`,type:'sentence',course,lesson,tab:'speaking',index:i,title:String(x?.prompt||x?.pattern||'말하기'),ko:String(x?.promptKo||''),example:String(x?.text||''),exampleKo:String(x?.ko||''),extra:String(x?.pattern||''),source:source292(course,lesson,'말하기')}));
      (d.habits||[]).forEach((x,i)=>add292(out,{id:`${course}:${lesson}:h:${i}`,type:'sentence',course,lesson,tab:'habits',index:i,title:String(x?.title||'학습 Point'),ko:String(x?.text||''),example:'',extra:'',source:source292(course,lesson,(course==='sori'||course==='friends')?'소리 Point':'습관')}));
    }
  });
  const seen=new Set();
  S292.index=out.filter(x=>{const k=`${x.type}|${x.course}|${x.lesson}|${x.tab||''}|${x.index??''}|${x.wordId||''}|${norm292(x.title)}`;if(seen.has(k))return false;seen.add(k);return true});
  return S292.index;
}

function score292(item,q){
  const n=norm292(q);if(!n)return 0;
  let s=0;
  if(item.titleNorm===n)s+=1200;
  else if(item.titleNorm.startsWith(n))s+=900;
  else if(item.titleNorm.includes(n))s+=720;
  if(item.koNorm===n)s+=850;else if(item.koNorm.includes(n))s+=560;
  if(item.exampleNorm.includes(n))s+=300;
  if(item.hay.includes(n))s+=120;
  if(item.type==='chunk')s+=22;else if(item.type==='pattern')s+=17;else if(item.type==='word')s+=13;
  return s;
}
function search292(q,filter=S292.filter){
  const n=norm292(q);if(!n){S292.results=[];return []}
  const rows=buildIndex292().filter(x=>(filter==='all'||x.type===filter)&&x.hay.includes(n)).map(x=>({x,s:score292(x,n)}));
  rows.sort((a,b)=>b.s-a.s||a.x.lesson-b.x.lesson||String(a.x.title).localeCompare(String(b.x.title)));
  S292.results=rows.map(r=>r.x);return S292.results;
}
function highlight292(text,q){
  const raw=String(text||'');const term=String(q||'').trim();if(!term)return esc292(raw);
  const safe=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');let re;try{re=new RegExp(safe,'ig')}catch(e){return esc292(raw)}
  let out='',last=0,m;while((m=re.exec(raw))){out+=esc292(raw.slice(last,m.index))+`<mark class="mvSearchMark292">${esc292(m[0])}</mark>`;last=m.index+m[0].length;if(!m[0].length)re.lastIndex++}out+=esc292(raw.slice(last));return out;
}
function recent292(){try{const a=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');return Array.isArray(a)?a.filter(Boolean).slice(0,5):[]}catch(e){return []}}
function saveRecent292(q){q=String(q||'').trim();if(!q)return;const a=[q,...recent292().filter(x=>norm292(x)!==norm292(q))].slice(0,5);try{localStorage.setItem(RECENT_KEY,JSON.stringify(a))}catch(e){}}
function clearRecent292(){try{localStorage.removeItem(RECENT_KEY)}catch(e){}render292()}

function createUI292(){
  if(document.getElementById('mvGlobalSearch292'))return;
  const overlay=document.createElement('section');overlay.id='mvGlobalSearch292';overlay.hidden=true;overlay.setAttribute('aria-label','통합 검색');
  overlay.innerHTML=`<div class="mvSearchShell292">
    <div class="mvSearchHeader292"><button class="mvSearchIconBtn292" id="mvSearchClose292" aria-label="검색 닫기">‹</button><div class="mvSearchHeaderCopy292"><b>통합 검색</b><span>내가 배운 모든 내용을 한 번에 검색해 보세요.</span></div><span></span></div>
    <div class="mvSearchInputWrap292"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg><input id="mvSearchInput292" class="mvSearchInput292" type="search" autocomplete="off" enterkeyhint="search" placeholder="단어 · 패턴 · Chunk · 문장 검색"><button id="mvSearchClear292" class="mvSearchClear292" aria-label="검색어 지우기">×</button></div>
    <div class="mvSearchChips292" id="mvSearchChips292">${FILTERS.map(([k,v])=>`<button class="mvSearchChip292${k==='all'?' active':''}" data-search-filter292="${k}">${v}</button>`).join('')}</div>
    <div id="mvSearchBody292"></div>
  </div>`;
  document.body.appendChild(overlay);

  const ret=document.createElement('button');ret.id='mvSearchReturn292';ret.type='button';ret.innerHTML='🔍 <span>검색 결과</span>';ret.addEventListener('click',()=>open292({keep:true}));document.body.appendChild(ret);

  const hero=document.querySelector('#homePage .homeHero');
  if(hero&&!document.getElementById('mvSearchHomeBtn292')){
    const b=document.createElement('button');b.id='mvSearchHomeBtn292';b.type='button';b.setAttribute('aria-label','통합 검색');b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>';b.addEventListener('click',()=>open292());hero.appendChild(b);
  }

  document.getElementById('mvSearchClose292').addEventListener('click',close292);
  const input=document.getElementById('mvSearchInput292');
  input.addEventListener('input',()=>{S292.query=input.value;document.getElementById('mvSearchClear292').classList.toggle('on',!!input.value);render292()});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){saveRecent292(input.value);render292();input.blur()}});
  document.getElementById('mvSearchClear292').addEventListener('click',()=>{input.value='';S292.query='';input.focus();document.getElementById('mvSearchClear292').classList.remove('on');render292()});
  document.getElementById('mvSearchChips292').addEventListener('click',e=>{const b=e.target.closest('[data-search-filter292]');if(!b)return;S292.filter=b.dataset.searchFilter292;document.querySelectorAll('.mvSearchChip292').forEach(x=>x.classList.toggle('active',x===b));render292()});
  document.getElementById('mvSearchBody292').addEventListener('click',e=>{
    const recent=e.target.closest('[data-recent292]');if(recent){input.value=recent.dataset.recent292;S292.query=input.value;document.getElementById('mvSearchClear292').classList.add('on');render292();return}
    const clear=e.target.closest('[data-clear-recent292]');if(clear){clearRecent292();return}
    const card=e.target.closest('[data-result292]');if(!card)return;const item=S292.results[Number(card.dataset.result292)];if(item){saveRecent292(S292.query);navigate292(item)}
  });
}

function render292(){
  const body=document.getElementById('mvSearchBody292');if(!body)return;
  const q=String(S292.query||'').trim();
  if(!q){
    const a=recent292();
    body.innerHTML=a.length?`<div class="mvSearchRecent292"><div class="mvSearchRecentHead292"><b>최근 검색어</b><button class="mvSearchRecentClear292" data-clear-recent292="1">전체 삭제</button></div><div class="mvSearchRecentList292">${a.map(x=>`<button class="mvSearchRecentBtn292" data-recent292="${esc292(x)}"><span>◷</span><span>${esc292(x)}</span></button>`).join('')}</div></div>`:`<div class="mvSearchEmpty292"><div class="ico">🔎</div><b>배운 표현을 찾아보세요</b><span>영어와 한글 모두 검색할 수 있습니다.<br>단어 · 패턴 · Chunk · 핵심 문장 · 말하기 내용을 통합 검색합니다.</span></div>`;
    return;
  }
  const rows=search292(q,S292.filter),total=rows.length,show=rows.slice(0,120);
  body.innerHTML=`<div class="mvSearchMeta292"><span>검색 결과 <b>${total}개</b>${total>120?' · 상위 120개 표시':''}</span><span class="mvSearchSort292">관련도순</span></div><div class="mvSearchResults292">${show.length?show.map((x,i)=>`<button class="mvSearchCard292" data-result292="${i}"><div><div class="mvSearchCardTop292">${esc292(TYPE_LABEL[x.type]||x.type)} · ${esc292(x.source)}</div><div class="mvSearchCardTitle292">${highlight292(x.title,q)}</div>${x.ko?`<div class="mvSearchCardKo292">${highlight292(x.ko,q)}</div>`:''}${x.example?`<div class="mvSearchCardExample292">${highlight292(x.example,q)}</div>`:''}</div><div class="mvSearchArrow292">›</div></button>`).join(''):`<div class="mvSearchEmpty292"><div class="ico">🧐</div><b>검색 결과가 없습니다</b><span>다른 단어 또는 한글 뜻으로 검색해 보세요.</span></div>`}</div>`;
}

function open292(opts={}){
  createUI292();const overlay=document.getElementById('mvGlobalSearch292');const input=document.getElementById('mvSearchInput292');
  overlay.hidden=false;document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';document.getElementById('mvSearchReturn292')?.classList.remove('on');
  if(!opts.keep){S292.lastScroll=window.scrollY||0}
  input.value=S292.query||'';document.getElementById('mvSearchClear292').classList.toggle('on',!!input.value);render292();
  requestAnimationFrame(()=>setTimeout(()=>{try{input.focus({preventScroll:true});input.setSelectionRange(input.value.length,input.value.length)}catch(e){input.focus()}},35));
}
function close292(){const overlay=document.getElementById('mvGlobalSearch292');if(!overlay)return;overlay.hidden=true;document.documentElement.style.overflow='';document.body.style.overflow='';const home=document.getElementById('homePage');if(S292.lastTarget&&home?.classList.contains('hidden'))showReturn292()}
window.mvOpenUnifiedSearch292=open292;

function pulse292(el){if(!el)return;el.classList.remove('mvSearchTarget292');void el.offsetWidth;el.classList.add('mvSearchTarget292');setTimeout(()=>el.classList.remove('mvSearchTarget292'),2100)}
function showReturn292(){const b=document.getElementById('mvSearchReturn292');if(b)b.classList.add('on')}
function navigateDay292(item){
  close292();
  try{openDay(Number(item.lesson)||1,'learn')}catch(e){console.warn('[v5.3.292] DAY search navigation',e);return}
  setTimeout(()=>{
    try{stopSpeech?.()}catch(e){}
    try{if(typeof AUTO!=='undefined'){AUTO.active=false;AUTO.token++}}catch(e){}
    try{learningPlaybackPaused=true;updateLearningPlaybackButton?.()}catch(e){}
    try{
      const pool=(typeof W!=='undefined'&&Array.isArray(W))?W:[];
      const target=pool.findIndex(w=>String(w?.uniqueId||`${w?.newDay}:${w?.newNo}:${w?.word}`)===String(item.wordId));
      if(target>=0){deck=[...pool];i=target;render(false)}
    }catch(e){}
    requestAnimationFrame(()=>requestAnimationFrame(()=>{pulse292(document.getElementById('card'));window.scrollTo({top:0,left:0,behavior:'auto'});showReturn292()}));
  },70);
}
function studyTarget292(item){
  if(item.tab==='corrections')return document.getElementById(`myCorrectionCard${item.index}`);
  if(item.tab==='chunks')return document.getElementById(`myChunkCard${item.index}`);
  if(item.tab==='speaking')return document.getElementById(`mySpeakBlock${item.index}`);
  if(item.tab==='habits')return document.querySelector(`#myClassContent .myRule:nth-child(${Number(item.index)+1})`);
  return null;
}
function navigateStudy292(item){
  close292();
  try{studyDirectOpenCourse(item.course,Number(item.lesson)||1)}catch(e){console.warn('[v5.3.292] study search navigation',e);return}
  try{myClassTab=item.tab||'corrections';renderMyClass?.();studySyncCourseUI?.();myClassSyncButtons?.()}catch(e){}
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const el=studyTarget292(item);if(el){el.scrollIntoView({block:'center',behavior:'auto'});pulse292(el)}else window.scrollTo(0,0);showReturn292();
  }));
}
function navigate292(item){S292.lastTarget=item?.id||null;if(item.course==='day')navigateDay292(item);else navigateStudy292(item)}

/* Keep the launcher isolated to HOME so playback/swipe behavior is not modified. */
createUI292();
// v5.4.59: the full cross-course search index is built only on first real search.
// Do not scan all learning data during cold start.

window.mvUnifiedSearchAudit292=()=>({version:'v5.3.292',indexCount:buildIndex292().length,query:S292.query,filter:S292.filter,resultCount:S292.results.length,homeButton:!!document.getElementById('mvSearchHomeBtn292'),rule:'additive unified search only; existing playback/swipe/card logic unchanged'});
})();



/* inline script 58: mv540CleanHomeRuntime */

(function(){
'use strict';
if(window.__MV540_CLEAN_HOME__) return;
window.__MV540_CLEAN_HOME__=true;
const MODES=['day','my','sori','opic','friends'];
const MAIN_MODES=['day','my','sori','opic'];
const MAIN_MODE_KEY='mv_mainHomeStudyMode540';
const scrollByMode={day:0,my:0,sori:0,opic:0,friends:0};
const home=()=>document.getElementById('homePage');
function homeVisible(){const h=home();return !!h&&!h.classList.contains('hidden')&&getComputedStyle(h).display!=='none'}
function validMode(m){return MODES.includes(m)?m:'day'}
function resolveInitialMainMode(){
  try{
    const main=localStorage.getItem(MAIN_MODE_KEY);
    if(MAIN_MODES.includes(main))return main;
    const legacy=localStorage.getItem('mv_homeStudyMode212');
    if(MAIN_MODES.includes(legacy)){
      localStorage.setItem(MAIN_MODE_KEY,legacy);
      return legacy;
    }
  }catch(e){}
  return 'day';
}
function currentMode(){
  const h=home(); if(h?.dataset.cleanMode && MODES.includes(h.dataset.cleanMode)) return h.dataset.cleanMode;
  const live=String(window.MV_HOME_MODE_212||''); if(MODES.includes(live)) return live;
  try{const s=localStorage.getItem('mv_homeStudyMode212'); if(MODES.includes(s)) return s}catch(e){}
  return 'day';
}
function setHomeVisibleClass(){document.body.classList.toggle('mv540HomeVisible',homeVisible())}
function applyMode(mode,{restoreScroll=false}={}){
  const m=validMode(mode); const h=home(); if(!h)return m;
  h.dataset.cleanMode=m;
  window.MV_HOME_MODE_212=m;
  try{
    localStorage.setItem('mv_homeStudyMode212',m);
    if(MAIN_MODES.includes(m))localStorage.setItem(MAIN_MODE_KEY,m);
  }catch(e){}
  document.querySelectorAll('[data-clean-mode-button]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.cleanModeButton===m?'true':'false'));
  try{window.syncSharedStudySelectionUI?.(m)}catch(e){}
  syncOverallProxy();
  syncToday();
  if(restoreScroll){requestAnimationFrame(()=>window.scrollTo({top:scrollByMode[m]||0,left:0,behavior:'auto'}));}
  return m;
}

// Wrap the already-standardized v5.3.189/v5.3.275 mode engine exactly once.
const nativeSetMode=window.setHomeStudyMode;
if(typeof nativeSetMode==='function'&&!nativeSetMode.__mv540){
  const wrapped=function(mode){const m=validMode(mode);const r=nativeSetMode.call(this,m);applyMode(m);return r};
  wrapped.__mv540=true;window.setHomeStudyMode=wrapped;try{setHomeStudyMode=wrapped}catch(e){}
}

function switchMode(mode,restoreScroll=false){
  const old=currentMode(); scrollByMode[old]=window.scrollY||0;
  if(typeof window.setHomeStudyMode==='function') window.setHomeStudyMode(validMode(mode)); else applyMode(mode);
  if(restoreScroll) requestAnimationFrame(()=>window.scrollTo({top:scrollByMode[validMode(mode)]||0,left:0,behavior:'auto'}));
}

function bindLauncher(){
  document.querySelectorAll('[data-clean-mode-button]').forEach(b=>{
    if(b.dataset.mv540Bound)return;b.dataset.mv540Bound='1';
    b.addEventListener('click',()=>switchMode(b.dataset.cleanModeButton,false));
  });
  const menu=document.getElementById('cleanHeroMenuHit'); if(menu&&!menu.dataset.mv540Bound){menu.dataset.mv540Bound='1';menu.addEventListener('click',()=>document.getElementById('drawerMenuButton')?.click())}
  const search=document.getElementById('cleanHeroSearchHit'); if(search&&!search.dataset.mv540Bound){search.dataset.mv540Bound='1';search.addEventListener('click',()=>{if(typeof window.mvOpenUnifiedSearch292==='function')window.mvOpenUnifiedSearch292();else document.getElementById('mvSearchHomeBtn292')?.click()})}
}

let overallObserver=null;
function bindOverallProxy(){
  const proxy=document.getElementById('cleanOverallRepeat'); const start=document.getElementById('cleanOverallStart');
  const real=document.getElementById('homeAllRepeat209'); const realStart=document.getElementById('homeAllRepeatStart210');
  if(!proxy||!start||!real||!realStart)return false;
  // Preserve user setting; first-ever clean launch follows approved default ON.
  try{if(localStorage.getItem('mv_allRepeat209')===null){localStorage.setItem('mv_allRepeat209','1');real.checked=true;real.dispatchEvent(new Event('change',{bubbles:true}))}}catch(e){}
  if(!proxy.dataset.mv540Bound){
    proxy.dataset.mv540Bound='1';proxy.addEventListener('change',()=>{real.checked=proxy.checked;real.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(syncOverallProxy,0)});
  }
  if(!start.dataset.mv540Bound){
    start.dataset.mv540Bound='1';start.addEventListener('click',()=>{if(!real.checked){real.checked=true;try{localStorage.setItem('mv_allRepeat209','1')}catch(e){};real.dispatchEvent(new Event('change',{bubbles:true}))}realStart.click();setTimeout(syncOverallProxy,0);setTimeout(syncOverallProxy,100)})
  }
  if(!overallObserver){overallObserver=new MutationObserver(syncOverallProxy);overallObserver.observe(realStart,{childList:true,characterData:true,subtree:true,attributes:true});overallObserver.observe(real,{attributes:true,attributeFilter:['checked','disabled']})}
  return true;
}
function syncOverallProxy(){
  const proxy=document.getElementById('cleanOverallRepeat'); const start=document.getElementById('cleanOverallStart'); const txt=document.getElementById('cleanOverallStartText');
  const real=document.getElementById('homeAllRepeat209'); const realStart=document.getElementById('homeAllRepeatStart210');
  if(!proxy||!start||!real||!realStart)return;
  proxy.checked=!!real.checked;
  const s=String(realStart.textContent||''); const stopping=/정지/.test(s); const paused=/계속|재개/.test(s);
  start.disabled=!!realStart.disabled&&!stopping&&!paused;
  if(txt)txt.textContent=stopping?'전체 정지':paused?'전체 계속':'전체 학습 반복';
  const play=start.querySelector('.cleanOverallPlay');if(play)play.textContent=stopping?'■':'▶';
}


function placeTodayCard(){
  const card=document.querySelector('#homePage .todayCard');
  const day=document.querySelector('#homePage .daySection');
  if(!card||!day)return false;
  const anchor=document.getElementById('cleanDaySettings')||day.querySelector(':scope>.sectionHead');
  if(anchor){
    if(card.parentElement!==day||card.previousElementSibling!==anchor) anchor.insertAdjacentElement('afterend',card);
  }else if(card.parentElement!==day){
    day.prepend(card);
  }
  return true;
}

function buildDaySettings(){
  const day=document.querySelector('#homePage .daySection'); if(!day||document.getElementById('cleanDaySettings'))return false;
  const head=day.querySelector(':scope>.sectionHead');
  const card=document.createElement('section'); card.id='cleanDaySettings'; card.className='cleanDaySettings';
  card.innerHTML='<div class="cleanDaySettingsTitle">🎧 DAY 학습 설정</div><div class="cleanDaySettingsGrid">'+
    '<div class="cleanDayField" data-slot="target"><label>학습 대상</label></div>'+
    '<div class="cleanDayField" data-slot="order"><label>재생 순서</label></div>'+
    '<div class="cleanDayField" data-slot="speech"><label>자동 읽기</label></div>'+
    '<div class="cleanDayField" data-slot="repeat"><label>반복 횟수</label></div></div>';
  if(head)head.insertAdjacentElement('afterend',card);else day.prepend(card);
  const moves=[['selectedStudyMode','target'],['homeOrderMode','order'],['homeSpeechMode','speech'],['autoRepeat','repeat']];
  moves.forEach(([id,slot])=>{const el=document.getElementById(id);const host=card.querySelector(`[data-slot="${slot}"]`);if(el&&host){el.classList.remove('repeatSelect');host.appendChild(el)}});
  return true;
}

let todayObserver=null;
function syncToday(){
  const countEl=document.getElementById('todayReviewCount'),title=document.getElementById('todayTitle'),btn=document.getElementById('todayStartBtn'); if(!countEl||!title||!btn)return;
  const count=String(countEl.textContent||'0').trim();
  title.innerHTML=`오늘 복습할 단어가 <span class="todayCountAccent">${count}</span>개 있어요`;
  btn.textContent=`오늘 복습 ${count}개 시작`;
  if(!todayObserver){todayObserver=new MutationObserver(syncToday);todayObserver.observe(countEl,{childList:true,characterData:true,subtree:true})}
}

function bindHomeSwipe(){
  const h=home(); if(!h||h.dataset.mv540Swipe)return;h.dataset.mv540Swipe='1';
  let sx=0,sy=0,tracking=false,horizontal=false;
  const hardBlock=t=>!!t?.closest('select,textarea,[contenteditable="true"]');
  h.addEventListener('touchstart',e=>{
    if(e.touches.length!==1||hardBlock(e.target))return;
    const t=e.touches[0]; sx=t.clientX; sy=t.clientY; tracking=true; horizontal=false;
  },{passive:true,capture:true});
  h.addEventListener('touchmove',e=>{
    if(!tracking||e.touches.length!==1)return;
    const t=e.touches[0],dx=t.clientX-sx,dy=t.clientY-sy;
    if(!horizontal && Math.abs(dx)>12 && Math.abs(dx)>Math.abs(dy)*1.15)horizontal=true;
    if(horizontal)e.preventDefault();
  },{passive:false,capture:true});
  h.addEventListener('touchend',e=>{
    if(!tracking)return;
    const wasHorizontal=horizontal; tracking=false; horizontal=false;
    const t=e.changedTouches?.[0]; if(!t)return;
    const dx=t.clientX-sx,dy=t.clientY-sy;
    if(!wasHorizontal||Math.abs(dx)<50||Math.abs(dx)<Math.abs(dy)*1.15)return;
    e.preventDefault();
    const cur=currentMode(),i=MODES.indexOf(cur);
    const next=dx<0?MODES[(i+1)%MODES.length]:MODES[(i-1+MODES.length)%MODES.length];
    switchMode(next,true);
  },{passive:false,capture:true});
  h.addEventListener('touchcancel',()=>{tracking=false;horizontal=false},{passive:true,capture:true});
}

function boot(){
  const __homeStarted=Date.now();
  try{
    try{document.title='SAYWARD v5.4.59'}catch(e){}
    try{ensureMyClassHomeCards()}catch(e){console.warn('[SAYWARD] MY card auto-heal',e)}
    setHomeVisibleClass();bindLauncher();bindOverallProxy();buildDaySettings();placeTodayCard();bindHomeSwipe();
    const initialMainMode=resolveInitialMainMode();
    // Home default contract: first launch => DAY; later launches => last selected MAIN button.
    // Auxiliary FRIENDS never replaces the remembered main-button default.
    if(typeof window.setHomeStudyMode==='function') window.setHomeStudyMode(initialMainMode); else applyMode(initialMainMode);
    syncToday();syncOverallProxy();
    window.__SAYWARD_HOME_READY__={version:'5.4.59',ok:true,mode:initialMainMode,ms:Date.now()-__homeStarted,at:Date.now()};
  }catch(e){
    window.__SAYWARD_HOME_READY__={version:'5.4.59',ok:false,error:String(e?.message||e),ms:Date.now()-__homeStarted,at:Date.now()};
    throw e;
  }
}

// Initialize once, then only a few deterministic retries for legacy startup construction.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,300),{once:true}); else setTimeout(boot,300);
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-drawer-action="home"],#myClassHomeBtn,#learnHomeControl'))setTimeout(()=>{setHomeVisibleClass();applyMode(currentMode())},0)},true);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(()=>{setHomeVisibleClass();syncOverallProxy()},0)});

window.mvCleanAudit540=function(){
  const h=home(),bar=document.getElementById('sharedStudySelectBar');
  const cards=[...document.querySelectorAll('#homePage .myClassSection .myClassCard')].slice(0,4);
  return {
    version:'v5.4.59',mode:currentMode(),defaultMainMode:resolveInitialMainMode(),hero:!!document.getElementById('cleanHeroMenuHit'),launcher:document.querySelectorAll('.cleanModeCard').length,
    sharedBar:!!bar,daySettings:!!document.getElementById('cleanDaySettings'),legacyModePanelVisible:!!document.getElementById('homeStudyModePanel')&&getComputedStyle(document.getElementById('homeStudyModePanel')).display!=='none',
    visibleSections:{day:getComputedStyle(document.querySelector('#homePage .daySection')||document.body).display,my:getComputedStyle(document.querySelector('#homePage .myClassSection')||document.body).display,sori:getComputedStyle(document.querySelector('#homePage .soriClassSection')||document.body).display,opic:getComputedStyle(document.querySelector('#homePage .opicClassSection')||document.body).display,friends:getComputedStyle(document.querySelector('#homePage .friendsClassSection')||document.body).display},
    myCards:cards.map(c=>({w:Math.round(c.getBoundingClientRect().width),h:Math.round(c.getBoundingClientRect().height)})),
    rule:'single HOME UI owner; v5.3.293-310 presentation patches removed; feature engines preserved'
  };
};
})();



/* inline script 59: mv540Patch542Runtime */

(function(){
  function apply(){
    try{document.querySelectorAll('#homePage .appVersion,#homePage #mvBuildBadge,#homePage .versionTag,#homePage .versionBadge,#homePage .buildBadge,#homePage .homeDayBadge').forEach(el=>el.remove())}catch(e){}
    const t=document.getElementById('todayTitle');
    if(t){t.style.whiteSpace='nowrap';}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,0));else setTimeout(apply,0);
  setTimeout(apply,500);
})();



/* inline script 60: mv540FinalFixRuntime */

(function(){
  function cleanVersions(){
    const hero=document.querySelector('#homePage .homeHero');
    if(hero){
      hero.querySelectorAll('.appVersion,.versionTag,.versionBadge,.buildBadge,#mvBuildBadge,#cleanHeroTextOverlay').forEach(el=>el.remove());
    }
  }
  function normalizeFavorite(){
    const box=document.getElementById('sharedStudyRepeatParts206');
    if(!box)return;
    const fav=box.querySelector('.studyFavoriteOnly239');
    box.classList.toggle('hasFavorite239',!!fav);
    if(fav){const s=fav.querySelector('span');if(s)s.textContent='즐겨찾기만';}
  }
  function apply(){cleanVersions();normalizeFavorite();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,0));else setTimeout(apply,0);
  setTimeout(apply,600);
  document.addEventListener('change',e=>{if(e.target?.closest?.('#sharedStudyRepeatParts206'))setTimeout(normalizeFavorite,0)},true);
})();

// v5.4.59: one authoritative visible version update after all legacy patches have loaded.
try{
  const __v=String(window.SAYWARD_VERSION||'5.4.59');
  document.title='SAYWARD v'+__v;
  document.documentElement.style.setProperty('--sayward-version-label','\"v'+__v+'\"');
  document.querySelectorAll('.appVersion').forEach(x=>x.textContent='SAYWARD v'+__v);
  const b=document.getElementById('mvBuildBadge');if(b)b.textContent='v'+__v;
  document.querySelectorAll('.versionTag,.versionBadge,.buildBadge').forEach(x=>x.textContent='v'+__v);
}catch(e){}
window.__SAYWARD_PATCHES_READY__={version:'5.4.59',at:Date.now()};
