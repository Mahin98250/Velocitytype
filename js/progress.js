/* VelocityType progress and analytics — private, local-only session data. */
const HISTORY_KEY="velocitytype.sessions.v1";
const bestEl=document.querySelector("#progress-best");
const sessionsEl=document.querySelector("#progress-sessions");
const accuracyEl=document.querySelector("#progress-accuracy");
const listEl=document.querySelector("#history-list");
const emptyEl=document.querySelector("#history-empty");
const chartEl=document.querySelector("#weekly-chart");
const weekTotalEl=document.querySelector("#analytics-week-total");
const insightEl=document.querySelector("#analytics-insight-text");

function readSessions(){
  try{
    const value=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");
    return Array.isArray(value)?value.filter(item=>item&&typeof item==="object"):[];
  }catch(error){return [];}
}
function formatDate(value){
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return "—";
  return new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric"}).format(date);
}
function dayKey(date){
  return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0");
}
function validNumber(value){
  const number=Number(value);
  return Number.isFinite(number)?number:0;
}
function buildWeek(sessions){
  const today=new Date();today.setHours(0,0,0,0);
  const days=[];
  for(let offset=6;offset>=0;offset--){
    const date=new Date(today);date.setDate(today.getDate()-offset);
    const key=dayKey(date);
    const runs=sessions.filter(session=>{
      const stamp=new Date(session.createdAt);
      return !Number.isNaN(stamp.getTime())&&dayKey(stamp)===key;
    });
    const speeds=runs.map(run=>validNumber(run.wpm)).filter(value=>value>=0);
    days.push({key,label:new Intl.DateTimeFormat(undefined,{weekday:"short"}).format(date),count:runs.length,average:speeds.length?speeds.reduce((a,b)=>a+b,0)/speeds.length:0});
  }
  return days;
}
function renderWeek(sessions){
  if(!chartEl)return;
  const days=buildWeek(sessions);
  const max=Math.max(1,...days.map(day=>day.average));
  const total=days.reduce((sum,day)=>sum+day.count,0);
  if(weekTotalEl)weekTotalEl.textContent=total+" "+(total===1?"session":"sessions");
  chartEl.textContent="";
  days.forEach(day=>{
    const column=document.createElement("div");column.className="weekly-chart__day";
    const value=document.createElement("span");value.className="weekly-chart__value";value.textContent=day.count?Math.round(day.average)+"":"—";
    const track=document.createElement("div");track.className="weekly-chart__track";
    const bar=document.createElement("span");bar.className="weekly-chart__bar";
    bar.style.height=day.count?Math.max(5,(day.average/max)*100)+"%":"3px";
    bar.setAttribute("aria-hidden","true");track.appendChild(bar);
    const label=document.createElement("span");label.className="weekly-chart__label";label.textContent=day.label;
    column.setAttribute("aria-label",day.label+": "+(day.count?Math.round(day.average)+" WPM average from "+day.count+" sessions":"no sessions"));
    column.append(value,track,label);chartEl.appendChild(column);
  });
  if(!insightEl)return;
  const active=days.filter(day=>day.count>0);
  if(!active.length){insightEl.textContent="Complete a few tests to reveal your practice pattern.";return;}
  const bestDay=active.reduce((best,day)=>day.average>best.average?day:best,active[0]);
  const practiceDays=active.length;
  const avg=active.reduce((sum,day)=>sum+day.average,0)/practiceDays;
  const errorTotals={};
  sessions.forEach(session=>{const mistakes=session&&session.mistakes&&typeof session.mistakes==="object"?session.mistakes:{};Object.entries(mistakes).forEach(([character,count])=>{const amount=Number(count);if(character.length===1&&Number.isFinite(amount)&&amount>0)errorTotals[character]=(errorTotals[character]||0)+amount;});});
  const weakest=Object.entries(errorTotals).sort((a,b)=>b[1]-a[1])[0];
  insightEl.textContent="You practiced on "+practiceDays+" of the last 7 days. Your strongest daily average was "+Math.round(bestDay.average)+" WPM ("+bestDay.label+"); active-day average: "+Math.round(avg)+" WPM."+(weakest?" Focus suggestion: review the "+(weakest[0]===" "?"space":JSON.stringify(weakest[0]))+" key, which appears in "+weakest[1]+" recorded errors.":"");
}
function renderHistory(){
  const sessions=readSessions();
  const speeds=sessions.map(item=>validNumber(item.wpm)).filter(value=>value>=0);
  const accuracies=sessions.map(item=>validNumber(item.accuracy)).filter(value=>value>=0&&value<=100);
  const best=speeds.length?Math.max(...speeds):0;
  const averageAccuracy=accuracies.length?accuracies.reduce((a,b)=>a+b,0)/accuracies.length:0;
  if(bestEl)bestEl.textContent=String(Math.round(best));
  if(sessionsEl)sessionsEl.textContent=String(sessions.length);
  if(accuracyEl)accuracyEl.textContent=accuracies.length?averageAccuracy.toFixed(1)+"%":"—";
  if(!listEl)return;
  listEl.textContent="";
  const recent=sessions.slice(-6).reverse();
  if(emptyEl)emptyEl.hidden=recent.length>0;
  recent.forEach(session=>{
    const row=document.createElement("div");row.className="history-row";
    const mode=document.createElement("span");mode.className="history-row__mode";mode.textContent=String(session.mode||"random");
    const wpm=document.createElement("span");wpm.className="history-row__metric";wpm.textContent=Math.round(validNumber(session.wpm))+" WPM";
    const accuracy=document.createElement("span");accuracy.className="history-row__metric";accuracy.textContent=validNumber(session.accuracy).toFixed(1)+"%";
    const date=document.createElement("span");date.className="history-row__date";date.textContent=formatDate(session.createdAt);
    row.append(mode,wpm,accuracy,date);listEl.appendChild(row);
  });
  renderWeek(sessions);
}
window.addEventListener("velocitytype:session-complete",renderHistory);
window.addEventListener("storage",event=>{if(event.key===HISTORY_KEY)renderHistory();});
renderHistory();
window.VelocityTypeProgress={ready:true,refresh:renderHistory};
