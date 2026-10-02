/* VelocityType page navigation + landing interactions */
const prefersReducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const header=document.querySelector(".site-header");
const pageSections=[...document.querySelectorAll("main [data-page]")];
const navLinks=[...document.querySelectorAll("[data-page-nav]")];
const mobileNav=[...document.querySelectorAll("[data-mobile-nav]")];
const routeAliases={top:"home",workspace:"home",features:"home",principles:"home",practice:"practice",progress:"progress",about:"about"};
const canonical={home:"top",practice:"practice",progress:"progress",about:"about"};
let activePage="home";

function syncHeader(){if(header)header.classList.toggle("is-scrolled",window.scrollY>18);}
function setPage(page,{scroll=true}={}){
  if(!canonical[page])page="home";
  activePage=page;
  pageSections.forEach(section=>{
    const visible=section.dataset.page===page;
    section.hidden=!visible;
    section.setAttribute("aria-hidden",String(!visible));
  });
  navLinks.forEach(link=>{
    const active=link.dataset.pageNav===page;
    link.classList.toggle("navbar__link--active",active);
    if(active)link.setAttribute("aria-current","page");else link.removeAttribute("aria-current");
  });
  mobileNav.forEach(link=>{
    const active=link.dataset.mobileNav===page;
    link.classList.toggle("is-active",active);
    if(active)link.setAttribute("aria-current","page");else link.removeAttribute("aria-current");
  });
  if(scroll)window.scrollTo({top:0,behavior:prefersReducedMotion?"auto":"smooth"});
}
function pageFromHash(){const key=location.hash.replace(/^#/,"")||"top";return routeAliases[key]||"home";}
function syncRoute(){setPage(pageFromHash(),{scroll:false});window.scrollTo({top:0,behavior:"auto"});}
if(header){syncHeader();window.addEventListener("scroll",syncHeader,{passive:true});}
setPage(pageFromHash(),{scroll:false});
window.addEventListener("hashchange",syncRoute);
document.querySelectorAll('a[href^="#"]').forEach(anchor=>{
  anchor.addEventListener("click",event=>{
    const id=anchor.getAttribute("href")?.slice(1);
    if(!id)return;
    const destination=routeAliases[id];
    if(destination){
      event.preventDefault();
      if(destination===activePage){
        const target=document.getElementById(id);
        if(target&&id!=="top"&&id!=="workspace")target.scrollIntoView({behavior:prefersReducedMotion?"auto":"smooth",block:"start"});
        else window.scrollTo({top:0,behavior:prefersReducedMotion?"auto":"smooth"});
      }else location.hash=canonical[destination];
      return;
    }
    const target=document.getElementById(id);
    if(target){event.preventDefault();target.scrollIntoView({behavior:prefersReducedMotion?"auto":"smooth",block:"start"});}
  });
});
const revealItems=[...document.querySelectorAll(".reveal")];
if(revealItems.length){
  if(prefersReducedMotion)revealItems.forEach(el=>el.classList.add("is-visible"));
  else if("IntersectionObserver" in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add("is-visible");observer.unobserve(entry.target);}
    }),{threshold:.12,rootMargin:"0px 0px -40px"});
    revealItems.forEach(el=>observer.observe(el));
  }else revealItems.forEach(el=>el.classList.add("is-visible"));
}
export const landingReady=true;
