/* VelocityType progress view — reads the same local session store as the engine. */
const HISTORY_KEY="velocitytype.sessions.v1";
const bestEl=document.querySelector("#progress-best");
const sessionsEl=document.querySelector("#progress-sessions");
const accuracyEl=document.querySelector("#progress-accuracy");
const listEl=document.querySelector("#history-list");
const emptyEl=document.querySelector("#history-empty");

function readSessions(){
  try{
    const value=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");
    return Array.isArray(value)?value:[];
  }catch(error){
    return [];
  }
}
function formatDate(value){
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return "—";
  return new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric"}).format(date);
}
function renderHistory(){
  const sessions=readSessions();
  const wpmValues=sessions.map(item=>Number(item.wpm)).filter(Number.isFinite);
  const accuracyValues=sessions.map(item=>Number(item.accuracy)).filter(Number.isFinite);
  const best=wpmValues.length?Math.max(...wpmValues):0;
  const averageAccuracy=accuracyValues.length?accuracyValues.reduce((a,b)=>a+b,0)/accuracyValues.length:0;
  bestEl.textContent=String(best);
  sessionsEl.textContent=String(sessions.length);
  accuracyEl.textContent=averageAccuracy?averageAccuracy.toFixed(1)+"%":"—";
  listEl.textContent="";
  const recent=sessions.slice(-6).reverse();
  emptyEl.hidden=recent.length>0;
  recent.forEach(session=>{
    const row=document.createElement("div");
    row.className="history-row";
    row.innerHTML='<span class="history-row__mode">'+escapeHtml(session.mode||"random")+'</span><span class="history-row__metric">'+Number(session.wpm||0)+" WPM</span><span class="history-row__metric">'+Number(session.accuracy||0).toFixed(1)+"%</span><span class="history-row__date">'+formatDate(session.createdAt)+'</span>';
    listEl.appendChild(row);
  });
}
function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
}
window.addEventListener("velocitytype:session-complete",renderHistory);
window.addEventListener("storage",event=>{if(event.key===HISTORY_KEY)renderHistory();});
renderHistory();
window.VelocityTypeProgress={ready:true,refresh:renderHistory};
