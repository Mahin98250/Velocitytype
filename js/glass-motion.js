/* Pointer-aware glass sheen; disabled for touch and reduced-motion users. */
(()=>{
  const finePointer=window.matchMedia("(hover: hover) and (pointer: fine)");
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  if(!finePointer.matches||reduced.matches)return;
  const targets=".glass-panel,.typing-preview,.typing-surface";
  let active=null,frame=0,x=0,y=0;
  document.addEventListener("pointerover",event=>{
    const node=event.target.closest?.(targets);
    if(node)active=node;
  },{passive:true});
  document.addEventListener("pointerout",event=>{
    if(active&&event.relatedTarget&&!active.contains(event.relatedTarget))active=null;
  },{passive:true});
  document.addEventListener("pointermove",event=>{
    const node=event.target.closest?.(targets);
    if(!node)return;
    active=node;x=event.clientX;y=event.clientY;
    if(frame)return;
    frame=requestAnimationFrame(()=>{
      frame=0;
      if(!active)return;
      const rect=active.getBoundingClientRect();
      active.style.setProperty("--pointer-x",Math.max(0,Math.min(rect.width,x-rect.left))+"px");
      active.style.setProperty("--pointer-y",Math.max(0,Math.min(rect.height,y-rect.top))+"px");
    });
  },{passive:true});
  document.addEventListener("pointerdown",event=>{
    const node=event.target.closest?.(targets);
    if(node){node.style.setProperty("--pointer-x",(event.clientX-node.getBoundingClientRect().left)+"px");node.style.setProperty("--pointer-y",(event.clientY-node.getBoundingClientRect().top)+"px");}
  },{passive:true});
})();
