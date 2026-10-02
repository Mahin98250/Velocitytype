/* VelocityType deterministic typing engine — no framework, no backend. */
const TEST_TEXTS={
  random:[
    "Small improvements compound quickly when practice is focused, deliberate, and consistent. Keep your eyes moving forward, trust the rhythm, and let accuracy lead the pace.",
    "Good typing is not a race against every second. It is a balance between precision and flow, where clean keystrokes become automatic through repetition.",
    "The fastest way to improve is to notice what slows you down. Reduce hesitation, correct your habits, and give every session a clear purpose."
  ],
  quotes:[
    "The secret of getting ahead is getting started.",
    "Great things are done by a series of small things brought together.",
    "Success is the sum of small efforts, repeated day in and day out."
  ],
  code:[
    "function measureSpeed(correctChars, elapsedMs) { const minutes = elapsedMs / 60000; return minutes > 0 ? (correctChars / 5) / minutes : 0; }"
  ],
  numbers:[
    "482 190 763 051 884 320 617 945 208 731 559 104 826 390 471 663 015 782 244 918 537 106 395 844."
  ],
  symbols:[
    "! @ # $ % ^ & * ( ) _ + = - [ ] { } ; : , . ? / < > ~ |"
  ],
  mixed:[
    "VelocityType v0.3 — practice at 120 WPM, keep accuracy above 98%, and make another focused session count."
  ]
};
const DURATIONS=[15,30,60,120];
const STORAGE_KEY="velocitytype.sessions.v1";
const els={
  surface:document.querySelector("#typing-surface"),
  input:document.querySelector("#typing-input"),
  copy:document.querySelector("#typing-copy"),
  durationGroup:document.querySelector("#duration-controls"),
  modeGroup:document.querySelector("#mode-controls"),
  wpm:document.querySelector("#live-wpm"),
  cpm:document.querySelector("#live-cpm"),
  accuracy:document.querySelector("#live-accuracy"),
  errors:document.querySelector("#live-errors"),
  time:document.querySelector("#live-time"),
  status:document.querySelector("#practice-status"),
  statusDot:document.querySelector("#practice-status-dot"),
  pause:document.querySelector("#pause-test"),
  restart:document.querySelector("#restart-test"),
  result:document.querySelector("#result-panel"),
  resultScore:document.querySelector("#result-score"),
  resultDetail:document.querySelector("#result-detail"),
  resultBest:document.querySelector("#result-best"),
  progressBar:document.querySelector("#typing-progress-bar"),
  retry:document.querySelector("#retry-test")
};
const state={duration:15,mode:"random",text:"",startedAt:0,elapsedBeforePause:0,running:false,paused:false,finished:false,raf:0,correct:0,errors:0,lastValueLength:0};
let audioContext=null;

function getSettings(){
  try{
    const value=JSON.parse(localStorage.getItem("velocitytype.settings.v1")||"{}");
    return value&&typeof value==="object"?value:{};
  }catch(error){return {};}
}
function playKeySound(correct){
  const settings=getSettings();
  if(!settings.sound)return;
  try{
    const AudioCtor=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtor)return;
    audioContext??=new AudioCtor();
    if(audioContext.state==="suspended")audioContext.resume();
    const osc=audioContext.createOscillator();
    const gain=audioContext.createGain();
    const volume=Math.min(.04,Math.max(.004,Number(settings.volume??.18)*.16));
    osc.type="sine";
    osc.frequency.value=correct?520:190;
    gain.gain.setValueAtTime(.0001,audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume,audioContext.currentTime+.004);
    gain.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+.045);
    osc.connect(gain);gain.connect(audioContext.destination);
    osc.start();osc.stop(audioContext.currentTime+.05);
  }catch(error){}
}
function pickText(mode){
  const list=TEST_TEXTS[mode]||TEST_TEXTS.random;
  return list[Math.floor(Math.random()*list.length)];
}
function formatTime(ms){
  const total=Math.max(0,Math.floor(ms/1000));
  return String(Math.floor(total/60)).padStart(2,"0")+":"+String(total%60).padStart(2,"0");
}
function elapsedMs(){
  if(!state.running)return state.elapsedBeforePause;
  return state.elapsedBeforePause+(performance.now()-state.startedAt);
}
function metrics(){
  const elapsed=elapsedMs();
  const minutes=Math.max(elapsed/60000,1/60000);
  const typed=state.correct+state.errors;
  return {elapsed,wpm:(state.correct/5)/minutes,cpm:state.correct/minutes,accuracy:typed?state.correct/typed*100:100,typed};
}
function renderText(){
  els.copy.textContent="";
  const frag=document.createDocumentFragment();
  [...state.text].forEach((char,index)=>{
    const span=document.createElement("span");
    span.className="char"+(index===0?" is-current":"");
    span.dataset.index=String(index);
    span.textContent=char;
    frag.appendChild(span);
  });
  els.copy.appendChild(frag);
}
function resetStats(){
  state.correct=0;state.errors=0;state.startedAt=0;state.elapsedBeforePause=0;
  state.running=false;state.paused=false;state.finished=false;state.lastValueLength=0;
  if(state.raf)cancelAnimationFrame(state.raf);
  els.pause.textContent="Pause";els.pause.disabled=true;
  els.status.textContent="Ready — start typing to begin";
  els.statusDot.classList.remove("is-live");els.surface.classList.remove("is-running");
  els.result.classList.remove("is-visible");
  if(els.progressBar)els.progressBar.style.width="0%";
  els.input.value="";
  updateMetrics();
}
function loadTest(){
  state.text=pickText(state.mode);
  renderText();resetStats();
}
function updateMetrics(){
  const m=metrics();
  els.wpm.textContent=String(Math.round(m.wpm));
  els.cpm.textContent=String(Math.round(m.cpm));
  els.accuracy.textContent=m.accuracy.toFixed(m.accuracy===100?0:1)+"%";
  els.errors.textContent=String(state.errors);
  els.time.textContent=formatTime(Math.min(m.elapsed,state.duration*1000));
  if(els.progressBar){
    const ratio=state.text.length?Math.min(1,m.typed/state.text.length):0;
    els.progressBar.style.width=(ratio*100).toFixed(2)+"%";
  }
}
function setMode(mode){
  if(!TEST_TEXTS[mode]||state.running)return;
  state.mode=mode;
  [...els.modeGroup.querySelectorAll("button")].forEach(btn=>btn.classList.toggle("is-active",btn.dataset.mode===mode));
  loadTest();focusInput();
}
function setDuration(duration){
  const value=Number(duration);
  if(!DURATIONS.includes(value)||state.running)return;
  state.duration=value;
  [...els.durationGroup.querySelectorAll("button")].forEach(btn=>btn.classList.toggle("is-active",Number(btn.dataset.duration)===value));
  loadTest();focusInput();
}
function focusInput(){els.input.focus({preventScroll:true});}
function begin(){
  if(state.finished||state.running)return;
  state.startedAt=performance.now();state.running=true;state.paused=false;
  els.pause.disabled=false;els.status.textContent="Live — keep your rhythm";
  els.statusDot.classList.add("is-live");els.surface.classList.add("is-running");
  tick();
}
function togglePause(){
  if(!state.running&&!state.paused)return;
  if(state.running){
    state.elapsedBeforePause=elapsedMs();state.running=false;state.paused=true;
    els.pause.textContent="Resume";els.status.textContent="Paused";els.statusDot.classList.remove("is-live");
    if(state.raf)cancelAnimationFrame(state.raf);
  }else{
    state.startedAt=performance.now();state.running=true;state.paused=false;
    els.pause.textContent="Pause";els.status.textContent="Live — keep your rhythm";els.statusDot.classList.add("is-live");tick();
  }
  focusInput();
}
function getBestWpm(){
  try{
    const sessions=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");
    const values=Array.isArray(sessions)?sessions.map(item=>Number(item.wpm)).filter(Number.isFinite):[];
    return Math.max(0,...values);
  }catch(error){return 0;}
}
function saveSession(session){
  try{
    const previous=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");
    const clean=Array.isArray(previous)?previous.slice(-49):[];
    clean.push(session);
    localStorage.setItem(STORAGE_KEY,JSON.stringify(clean));
  }catch(error){console.warn("VelocityType: session history could not be saved.",error);}
}
function finish(reason){
  const m=metrics();
  state.elapsedBeforePause=Math.min(m.elapsed,state.duration*1000);
  state.running=false;state.finished=true;state.paused=false;
  if(state.raf)cancelAnimationFrame(state.raf);
  els.pause.disabled=true;els.pause.textContent="Pause";
  els.status.textContent=reason==="Complete"?"Complete — test finished":"Time — test finished";
  els.statusDot.classList.remove("is-live");els.surface.classList.remove("is-running");
  updateMetrics();
  const score=Math.round(m.wpm);
  els.resultScore.textContent=score+" WPM";
  els.resultDetail.textContent=score+" WPM · "+m.accuracy.toFixed(1)+"% accuracy · "+state.errors+" errors · "+formatTime(state.elapsedBeforePause);
  const session={wpm:score,cpm:Math.round(m.cpm),accuracy:Number(m.accuracy.toFixed(1)),errors:state.errors,duration:state.duration,mode:state.mode,elapsed:state.elapsedBeforePause,createdAt:new Date().toISOString()};
  saveSession(session);
  window.dispatchEvent(new CustomEvent("velocitytype:session-complete",{detail:session}));
  if(els.resultBest)els.resultBest.textContent="Personal best: "+getBestWpm()+" WPM";
  els.result.classList.add("is-visible");
}
function tick(){
  if(!state.running)return;
  updateMetrics();
  if(metrics().elapsed>=state.duration*1000){finish("Time");return;}
  state.raf=requestAnimationFrame(tick);
}
function handleInput(){
  if(state.finished)return;
  const value=els.input.value.slice(0,state.text.length);
  if(value.length>0&&!state.running&&!state.paused)begin();
  const grew=value.length>state.lastValueLength;
  const spans=els.copy.querySelectorAll(".char");
  let correct=0,errors=0;
  spans.forEach((span,index)=>{
    const typed=value[index];
    const isCorrect=typed!==undefined&&typed===state.text[index];
    const isIncorrect=typed!==undefined&&typed!==state.text[index];
    span.classList.toggle("is-correct",isCorrect);
    span.classList.toggle("is-incorrect",isIncorrect);
    span.classList.toggle("is-current",index===value.length);
    if(isCorrect)correct++;
    if(isIncorrect)errors++;
  });
  state.correct=correct;state.errors=errors;
  if(grew){
    const index=value.length-1;
    playKeySound(value[index]===state.text[index]);
  }
  state.lastValueLength=value.length;
  updateMetrics();
  if(value.length>=state.text.length){finish("Complete");return;}
  if(value.length)scrollCurrentIntoView(value.length);
}
function scrollCurrentIntoView(index){
  const target=els.copy.querySelector('[data-index="'+Math.min(index,state.text.length-1)+'"]');
  if(!target)return;
  const surfaceRect=els.surface.getBoundingClientRect(),targetRect=target.getBoundingClientRect();
  if(targetRect.bottom>surfaceRect.bottom-44||targetRect.top<surfaceRect.top+38)target.scrollIntoView({block:"center",behavior:"auto"});
}
function wire(){
  if(!els.input||!els.copy)return;
  els.durationGroup?.addEventListener("click",event=>{
    const button=event.target.closest("button[data-duration]");
    if(button)setDuration(button.dataset.duration);
  });
  els.modeGroup?.addEventListener("click",event=>{
    const button=event.target.closest("button[data-mode]");
    if(button)setMode(button.dataset.mode);
  });
  els.surface.addEventListener("click",focusInput);
  els.input.addEventListener("input",handleInput);
  ["paste","drop"].forEach(type=>els.input.addEventListener(type,event=>event.preventDefault()));
  els.input.addEventListener("keydown",event=>{if(event.key==="Tab")event.preventDefault();});
  els.pause.addEventListener("click",togglePause);
  els.restart.addEventListener("click",()=>{loadTest();focusInput();});
  els.retry?.addEventListener("click",()=>{loadTest();focusInput();});
  document.addEventListener("keydown",event=>{
    if(!state.finished)return;
    if(event.key==="Enter"&&document.activeElement!==els.input){loadTest();focusInput();}
  });
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden&&state.running)togglePause();
  });
  loadTest();
}
wire();
window.VelocityTypeTyping={ready:true,storageKey:STORAGE_KEY};
