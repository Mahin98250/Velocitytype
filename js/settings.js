/* VelocityType settings, history import/export, and local personalization. */
const SETTINGS_KEY="velocitytype.settings.v1";
const DEFAULTS={theme:"dark",font:"system",cursor:"line",compact:false,sound:true,volume:.18,soundStyle:"mechanical",reduceMotion:false};
const root=document.documentElement;
const modal=document.querySelector("#settings-modal");
const form=document.querySelector("#settings-form");
const opens=[...document.querySelectorAll('[data-action="open-settings"]')];
const close=document.querySelector("#settings-close");
const exportButton=document.querySelector("#export-history");
const importButton=document.querySelector("#import-history");
const resetButton=document.querySelector("#reset-history");
const importInput=document.querySelector("#import-file");
const previewSound=document.querySelector("#preview-key-sound");

function readSettings(){
  try{const v=JSON.parse(localStorage.getItem(SETTINGS_KEY)||"null");return {...DEFAULTS,...(v&&typeof v==="object"?v:{})};}
  catch(error){return {...DEFAULTS};}
}
function applySettings(settings){
  root.dataset.theme=settings.theme==="dim"?"dim":"dark";
  root.dataset.compact=settings.compact?"true":"false";
  root.dataset.forceReducedMotion=settings.reduceMotion?"true":"false";
  root.style.setProperty("--font-mono",settings.font==="system"?'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace':'"SFMono-Regular","Cascadia Code","Roboto Mono",Menlo,Monaco,Consolas,monospace');
  const surface=document.querySelector("#typing-surface");
  if(surface)surface.dataset.cursor=settings.cursor||"line";
}
function syncForm(settings){
  if(!form)return;
  form.elements.theme.value=settings.theme;
  form.elements.font.value=settings.font;
  form.elements.cursor.value=settings.cursor;
  form.elements.compact.checked=!!settings.compact;
  form.elements.sound.checked=!!settings.sound;
  form.elements.volume.value=String(settings.volume);
  if(form.elements.soundStyle)form.elements.soundStyle.value=["soft","crisp","mechanical"].includes(settings.soundStyle)?settings.soundStyle:"soft";
  form.elements.reduceMotion.checked=!!settings.reduceMotion;
}
function update(){
  const fd=new FormData(form),old=readSettings();
  const next={...old,theme:String(fd.get("theme")||"dark"),font:String(fd.get("font")||"system"),cursor:String(fd.get("cursor")||"line"),compact:fd.get("compact")==="on",sound:fd.get("sound")==="on",volume:Math.min(1,Math.max(0,Number(fd.get("volume")??.18))),soundStyle:["soft","crisp","mechanical"].includes(String(fd.get("soundStyle")))?String(fd.get("soundStyle")):"soft",reduceMotion:fd.get("reduceMotion")==="on"};
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(next));
  applySettings(next);
  window.dispatchEvent(new CustomEvent("velocitytype:settings-changed",{detail:next}));
}
function openSettings(){if(!modal)return;syncForm(readSettings());modal.classList.add("is-open");modal.setAttribute("aria-hidden","false");close?.focus();}
function closeSettings(){if(!modal)return;modal.classList.remove("is-open");modal.setAttribute("aria-hidden","true");opens[0]?.focus();}
function sessions(){
  try{const v=JSON.parse(localStorage.getItem("velocitytype.sessions.v1")||"[]");return Array.isArray(v)?v:[];}
  catch(error){return [];}
}
function exportHistory(){
  const blob=new Blob([JSON.stringify({app:"VelocityType",version:1,exportedAt:new Date().toISOString(),sessions:sessions()},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="velocitytype-history.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
}
function validSession(item){
  if(!item||typeof item!=="object")return false;
  return Number.isFinite(Number(item.wpm))&&Number.isFinite(Number(item.accuracy))&&[15,30,60,120].includes(Number(item.duration));
}
async function importHistory(file){
  const raw=JSON.parse(await file.text()),incoming=Array.isArray(raw)?raw:raw?.sessions;
  if(!Array.isArray(incoming))throw new Error("Invalid history file.");
  const clean=incoming.filter(validSession).map(item=>({...item,wpm:Math.max(0,Math.round(Number(item.wpm))),cpm:Math.max(0,Math.round(Number(item.cpm||0))),accuracy:Math.min(100,Math.max(0,Number(Number(item.accuracy).toFixed(1)))),errors:Math.max(0,Math.round(Number(item.errors||0))),duration:Number(item.duration),createdAt:new Date(item.createdAt||Date.now()).toISOString()})).slice(-50);
  if(!clean.length)throw new Error("No valid sessions found.");
  const replace=window.confirm("Replace local history with the imported sessions? Cancel keeps and merges both.");
  const merged=replace?clean:[...sessions(),...clean].sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)).slice(-50);
  localStorage.setItem("velocitytype.sessions.v1",JSON.stringify(merged));
  window.dispatchEvent(new CustomEvent("velocitytype:session-complete",{detail:null}));
}
function resetHistory(){
  if(!window.confirm("Delete all saved VelocityType sessions on this device? This cannot be undone."))return;
  localStorage.removeItem("velocitytype.sessions.v1");
  window.dispatchEvent(new CustomEvent("velocitytype:session-complete",{detail:null}));
}
function bind(){
  const settings=readSettings();
  applySettings(settings);
  syncForm(settings);
  opens.forEach(button=>button.addEventListener("click",openSettings));
  close?.addEventListener("click",closeSettings);
  modal?.addEventListener("click",e=>{if(e.target===modal)closeSettings();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&modal?.classList.contains("is-open"))closeSettings();});
  form?.addEventListener("change",update);
  previewSound?.addEventListener("click",()=>window.dispatchEvent(new Event("velocitytype:preview-sound")));
  exportButton?.addEventListener("click",exportHistory);
  resetButton?.addEventListener("click",resetHistory);
  importButton?.addEventListener("click",()=>importInput?.click());
  importInput?.addEventListener("change",async e=>{
    const file=e.target.files?.[0];
    if(!file)return;
    try{await importHistory(file);window.alert("History imported successfully.");}
    catch(error){window.alert(error?.message||"Could not import history.");}
    finally{e.target.value="";}
  });
}
bind();
window.VelocityTypeSettings={ready:true,get:readSettings};
