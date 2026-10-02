/* VelocityType landing interactions */
const prefersReducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const header=document.querySelector(".site-header");
const revealItems=[...document.querySelectorAll(".reveal")];

function syncHeader(){
  if(header) header.classList.toggle("is-scrolled",window.scrollY>18);
}
if(header){
  syncHeader();
  window.addEventListener("scroll",syncHeader,{passive:true});
}

if(revealItems.length){
  if(prefersReducedMotion){
    revealItems.forEach(el=>el.classList.add("is-visible"));
  }else{
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },{threshold:.12,rootMargin:"0px 0px -40px"});
    revealItems.forEach(el=>observer.observe(el));
  }
}

const featureLink=document.querySelector('[href="#features"]');
const workspaceLink=document.querySelector('[href="#workspace"]');
const sections=[...document.querySelectorAll("main section[id]")];
const navLinks=[...document.querySelectorAll(".navbar__link")];

if(sections.length && navLinks.length){
  const sectionObserver=new IntersectionObserver(entries=>{
    const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(!visible)return;
    navLinks.forEach(link=>{
      const active=link.getAttribute("href")===`#${visible.target.id}`;
      link.classList.toggle("navbar__link--active",active);
      if(active)link.setAttribute("aria-current","page");else link.removeAttribute("aria-current");
    });
  },{threshold:[.2,.45,.7],rootMargin:"-20% 0px -55% 0px"});
  sections.forEach(section=>sectionObserver.observe(section));
}

document.querySelectorAll('a[href^="#"]').forEach(anchor=>{
  anchor.addEventListener("click",event=>{
    const id=anchor.getAttribute("href");
    const target=id&&document.querySelector(id);
    if(!target)return;
    event.preventDefault();
    target.scrollIntoView({behavior:prefersReducedMotion?"auto":"smooth",block:"start"});
  });
});

export const landingReady=true;
