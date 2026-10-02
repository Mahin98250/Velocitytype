/** VelocityType bootstrap — initializes only services that exist. */
const APP_VERSION="0.2.0";
/** Mark the shell ready and dismiss the decorative startup overlay. */
function initializeApp(){
 const root=document.documentElement;root.dataset.app="velocitytype";root.dataset.appVersion=APP_VERSION;
 const year=document.querySelector("#copyright-year");if(year)year.textContent=String(new Date().getFullYear());
 const loader=document.querySelector("#loading-screen");
 if(loader){requestAnimationFrame(()=>{loader.classList.add("is-hidden");loader.addEventListener("transitionend",()=>loader.remove(),{once:true});window.setTimeout(()=>loader.remove(),650);});}
 root.dataset.ready="true";return{name:"VelocityType",version:APP_VERSION,ready:true};
}
initializeApp();
