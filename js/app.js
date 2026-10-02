/** VelocityType bootstrap — foundation services only. */
const APP_VERSION="0.3.0";

function initializeApp(){
  const root=document.documentElement;
  root.dataset.app="velocitytype";
  root.dataset.appVersion=APP_VERSION;

  const year=document.querySelector("#copyright-year");
  if(year) year.textContent=String(new Date().getFullYear());

  const loader=document.querySelector("#loading-screen");
  if(loader){
    requestAnimationFrame(()=>{
      loader.classList.add("is-hidden");
      loader.addEventListener("transitionend",()=>loader.remove(),{once:true});
      window.setTimeout(()=>loader.remove(),650);
    });
  }

  root.dataset.ready="true";
  window.VelocityType={version:APP_VERSION,ready:true};
}
initializeApp();
