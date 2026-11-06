import type { PresentationOptions, FloatingModule } from './types';
import { BackgroundRenderer } from './renderer';
import { NavigationController, WheelIntent, canScroll, isInteractive } from './navigation';
import { clamp, contentFrame, ease } from './math';
import { normalizeTransition } from './transitions/normalize';

export async function createPresentation(root: HTMLElement, options: PresentationOptions) {
  const abort=new AbortController(),signal=abort.signal;
  const transition=normalizeTransition(options.transition);
  const slides=Array.from(root.querySelectorAll<HTMLElement>('[data-slide]'));
  if(!slides.length || slides.length!==options.slides.length) throw new Error('Slide markup and configuration must match');
  const clipContent=transition.clipContent;
  // Clipping a panel's ancestor prevents the panel from sampling the deck backdrop.
  const clipTargets=slides.map(slide=>{
    const content=slide.querySelector<HTMLElement>('[data-clip-children]');
    return content ? Array.from(content.children) as HTMLElement[] : [slide];
  });
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover:hover) and (pointer:fine)');
  const backdrop=root.querySelector<HTMLElement>('[data-background]')!;
  const status=root.querySelector<HTMLElement>('[data-announcer]')!;
  const progressBar=root.querySelector<HTMLElement>('[data-progress]');
  const counter=root.querySelector<HTMLElement>('[data-counter]');
  const currentLabel=root.querySelector<HTMLElement>('[data-current-label]');
  const previous=root.querySelector<HTMLButtonElement>('[data-previous]');
  const next=root.querySelector<HTMLButtonElement>('[data-next]');
  const groups=Array.from(root.querySelectorAll<HTMLButtonElement>('[data-group]'));
  const dots=Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-go]'));
  const rankLinks=Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-rank-link]'));
  const locales=Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-locale]'));
  let destroyed=false,ready=false,floating:FloatingModule|undefined;
  let from=0,to=0,start=0,age=0,fromAge=0,clock=0,last=0,frame=0;
  let resolveTransition:(()=>void)|undefined;
  let clipsContent=false;
  let pointer:[number,number]=[0,0],targetPointer:[number,number]=[0,0];
  let historyPending:number|undefined,startupIntent:{index:number;push:boolean}|undefined;
  let running=false;
  const slideIndexFromHash=(hash:string)=>{
    if(!hash||hash==='#')return Math.max(0,options.slides.findIndex(s=>s.id==='cover'));
    try{return options.slides.findIndex(s=>s.id===decodeURIComponent(hash.startsWith('#')?hash.slice(1):hash));}
    catch{return -1;}
  };
  const initial=Math.max(0,slideIndexFromHash(location.hash));
  let nav:NavigationController;
  const renderer=new BackgroundRenderer(backdrop,transition,()=>{ if(resolveTransition) finish(); });
  function updateUi(index:number,announce=true){
    slides.forEach((slide,i)=>{
      const active=i===index;slide.dataset.active=String(active);slide.inert=!active;slide.setAttribute('aria-hidden',String(!active));
      if(!active) slide.querySelectorAll<HTMLElement>('[data-animate]').forEach(el=>{el.style.opacity='';el.style.transform='';});
    });
    const info=options.slides[index],title=slides[index].dataset.title??'';
    root.dataset.group=info.group;root.dataset.scrim=info.background.scrim;root.style.setProperty('--scrim-opacity',info.background.scrim==='left'?'1':'.75');
    groups.forEach(button=>{ const active=button.dataset.group===info.group;button.setAttribute('aria-pressed',String(active)); });
    dots.forEach(button=>{if(Number(button.dataset.go)===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
    if(counter)counter.textContent=String(index+1).padStart(2,'0');
    if(currentLabel)currentLabel.textContent=title;
    if(progressBar)progressBar.style.width=`${(index+1)/slides.length*100}%`;
    if(previous)previous.disabled=index===0;if(next)next.disabled=index===slides.length-1;
    locales.forEach(link=>{link.hash=info.id;});
    if(announce)status.textContent=options.announcement.replace('{current}',String(index+1)).replace('{total}',String(slides.length)).replace('{title}',title);
  }
  function clearContentClip(){
    if(!clipsContent)return;
    for(const target of [...clipTargets[from],...clipTargets[to]])target.style.clipPath='';
    clipsContent=false;
  }
  function finish(){
    if(!resolveTransition)return;
    const focused=document.activeElement;
    const needsFocus=focused instanceof HTMLElement && slides[from].contains(focused);
    clearContentClip();
    age=clock-start;from=to;updateUi(to);
    slides[to].querySelectorAll<HTMLElement>('[data-animate]').forEach(el=>{el.style.opacity='';el.style.transform='';});
    if(needsFocus) slides[to].focus({preventScroll:true});
    const done=resolveTransition;resolveTransition=undefined;done();
  }
  nav=new NavigationController(slides.length,Math.max(0,initial),async(a,b)=>{
    from=a;to=b;root.dataset.state='loading';
    renderer.protect(options.slides[a].background,options.slides[b].background);
    try{await renderer.prepare(options.slides[b].background);}
    catch(error){if(!destroyed){renderer.useFallback();console.warn('Presentation background preparation failed; using the CSS fallback.',error);}}
    if(destroyed)return;
    nav.state='transitioning';root.dataset.state='transitioning';
    fromAge=age;start=clock;
    slides[b].scrollTop=0;slides[b].dataset.entering='true';
    clipsContent=!!clipContent&&!reduced.matches&&backdrop.dataset.renderer==='webgl';
    if(clipsContent)clipTargets[b].forEach(target=>{target.style.clipPath='inset(100%)';});
    else slides[b].querySelectorAll<HTMLElement>('[data-animate]').forEach(el=>{el.style.opacity='0';});
    floating?.move(options.slides[a].floating,options.slides[b].floating);
    await new Promise<void>(resolve=>{resolveTransition=resolve;if(document.hidden)finish();});
    delete slides[b].dataset.entering;root.dataset.state='idle';
    for(const n of [b-1,b+1])if(options.slides[n])void renderer.prepare(options.slides[n].background).catch(()=>renderer.useFallback());
  });
  async function request(index:number,push=true){
    if(!ready){
      const target=Math.trunc(index);
      if(!Number.isFinite(index)||target<0||target>=slides.length||target===nav.current||startupIntent)return;
      startupIntent={index:target,push};
      return;
    }
    if(nav.state!=='idle')return;
    const changed=await nav.goTo(index);
    if(historyPending!==undefined){const pending=historyPending;historyPending=undefined;void request(pending,false);return;}
    if(changed&&push){const url=new URL(location.href);url.hash=options.slides[nav.current].id;history.pushState(null,'',url);}
  }
  function render(now:number){
    if(destroyed)return;
    const elapsed=last?(now-last)/1000:0;
    const dt=nav.state==='transitioning'&&transition.easing==='linear'?elapsed:Math.min(elapsed,.05);
    last=now;clock+=dt;
    const smoothing=1-Math.exp(-dt*4);pointer=[pointer[0]+(targetPointer[0]-pointer[0])*smoothing,pointer[1]+(targetPointer[1]-pointer[1])*smoothing];
    if(nav.state==='transitioning'&&resolveTransition){
      const duration=reduced.matches ? .16 : transition.durationMs/1000;
      const p=clamp((clock-start)/duration);
      const progress=transition.easing==='linear'&&!reduced.matches?p:ease(p);
      renderer.render(options.slides[from].background,options.slides[to].background,progress,to>from?1:-1,fromAge+clock-start,clock-start,pointer,reduced.matches);
      if(clipsContent&&clipContent&&!reduced.matches){
        const viewport=backdrop.getBoundingClientRect();
        for(const target of clipTargets[from]){
          target.style.clipPath=clipContent(p,viewport,target.getBoundingClientRect()).from;
        }
        for(const target of clipTargets[to]){
          target.style.clipPath=clipContent(p,viewport,target.getBoundingClientRect()).to;
        }
      }else{
        clearContentClip();
        const exiting=slides[from].querySelectorAll<HTMLElement>('[data-animate]');
        exiting.forEach(el=>{el.style.opacity=String(1-ease(p/transition.contentTiming.exitEnd));});
        const entering=slides[to].querySelectorAll<HTMLElement>('[data-animate]');
        entering.forEach((el,i)=>{const v=reduced.matches?p:contentFrame(p,i,entering.length,transition.contentTiming);el.style.opacity=String(v);el.style.transform=reduced.matches?'none':`translateY(${(1-v)*18}px)`;});
      }
      floating?.render(p,clock,reduced.matches);if(p===1)finish();
    }else{
      age+=dt;
      renderer.render(options.slides[from].background,options.slides[from].background,1,1,age,age,pointer,reduced.matches);
      floating?.render(1,clock,reduced.matches);
    }
    if(!document.hidden)frame=requestAnimationFrame(render);
  }
  function startFrameLoop(){
    if(destroyed||!ready||document.hidden||running)return;
    running=true;
    frame=requestAnimationFrame(render);
  }
  from=to=nav.current;root.dataset.state='loading';root.dataset.enhanced='true';root.setAttribute('aria-busy','true');updateUi(nav.current,false);
  previous?.addEventListener('click',()=>void request(nav.current-1),{signal});next?.addEventListener('click',()=>void request(nav.current+1),{signal});
  dots.forEach(b=>b.addEventListener('click',()=>void request(Number(b.dataset.go)),{signal}));
  rankLinks.forEach(link=>link.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
    const index=Number(link.dataset.go);
    if(!Number.isInteger(index)||index<0||index>=slides.length)return;
    event.preventDefault();
    void request(index);
  },{signal}));
  groups.forEach(b=>b.addEventListener('click',()=>void request(options.slides.findIndex(s=>s.group===b.dataset.group)),{signal}));
  root.addEventListener('pointermove',e=>{if(fine.matches&&!reduced.matches)targetPointer=[(e.clientX/innerWidth-.5)*2,-(e.clientY/innerHeight-.5)*2];},{signal});
  root.addEventListener('pointerleave',()=>{targetPointer=[0,0];},{signal});
  window.addEventListener('keydown',e=>{
    if(e.altKey||e.ctrlKey||e.metaKey||isInteractive(e.target))return;
    const direction=['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)?1:['ArrowLeft','ArrowUp','PageUp'].includes(e.key)?-1:0;
    if(direction){if(['ArrowUp','ArrowDown','PageUp','PageDown',' '].includes(e.key)&&canScroll(slides[nav.current],direction))return;e.preventDefault();void request(nav.current+direction);}
    else if(e.key==='Home'||e.key==='End'){e.preventDefault();void request(e.key==='Home'?0:slides.length-1);}
  },{signal});
  const wheel=new WheelIntent();
  root.addEventListener('wheel',e=>{
    if(e.ctrlKey||e.metaKey||e.target instanceof Element&&e.target.closest('header,footer'))return;
    const delta=(Math.abs(e.deltaY)>=Math.abs(e.deltaX)?e.deltaY:e.deltaX)*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
    const scrollable=canScroll(slides[nav.current],Math.sign(delta));
    const direction=wheel.consume(delta,performance.now(),scrollable);
    if(!scrollable)e.preventDefault();if(direction)void request(nav.current+direction);
  },{passive:false,signal});
  let touch:{x:number;y:number;scrollTop:number;canUp:boolean;canDown:boolean}|undefined;
  root.addEventListener('touchstart',e=>{if(e.touches.length!==1||isInteractive(e.target))return;const point=e.touches[0],slide=slides[nav.current];touch={x:point.clientX,y:point.clientY,scrollTop:slide.scrollTop,canUp:canScroll(slide,-1),canDown:canScroll(slide,1)};},{passive:true,signal});
  root.addEventListener('touchmove',e=>{
    if(!touch || e.touches.length!==1)return;
    const point=e.touches[0],dx=touch.x-point.clientX,dy=touch.y-point.clientY;
    // Keep native vertical scrolling when content can move; retain boundary gestures for the deck.
    if(Math.abs(dx)>Math.abs(dy)*1.3 || (dy>0&&!touch.canDown) || (dy<0&&!touch.canUp))e.preventDefault();
  },{passive:false,signal});
  root.addEventListener('touchend',e=>{
    if(!touch)return;const start=touch;touch=undefined;const p=e.changedTouches[0];if(!p)return;
    const dx=start.x-p.clientX,dy=start.y-p.clientY,horizontal=Math.abs(dx)>Math.abs(dy)*1.3;
    if(Math.max(Math.abs(dx),Math.abs(dy))<50)return;
    if(!horizontal&&((dy>0&&start.canDown)||(dy<0&&start.canUp)||Math.abs(slides[nav.current].scrollTop-start.scrollTop)>2))return;
    void request(nav.current+Math.sign(horizontal?dx:dy));
  },{passive:true,signal});
  root.addEventListener('touchcancel',()=>{touch=undefined;},{signal});
  const historyChange=()=>{
    const index=slideIndexFromHash(location.hash);if(index<0)return;
    // Browser history is authoritative and can replace a click captured during startup.
    if(!ready){startupIntent=index===nav.current?undefined:{index,push:false};return;}
    if(nav.state!=='idle')historyPending=index;else void request(index,false);
  };
  window.addEventListener('popstate',historyChange,{signal});window.addEventListener('hashchange',historyChange,{signal});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;running=false;last=0;if(resolveTransition)finish();}
    else{last=0;startFrameLoop();}
  },{signal});
  const fullscreen=root.querySelector<HTMLButtonElement>('[data-fullscreen]');
  if(fullscreen){fullscreen.hidden=!document.fullscreenEnabled;fullscreen.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await root.requestFullscreen();}catch{/* Browser may deny fullscreen; navigation remains available. */}},{signal});}
  const destroy=()=>{destroyed=true;ready=false;running=false;startupIntent=undefined;root.removeAttribute('aria-busy');clearContentClip();abort.abort();cancelAnimationFrame(frame);frame=0;renderer.destroy();floating?.destroy();resolveTransition?.();};
  window.addEventListener('pagehide',event=>{if(!event.persisted)destroy();},{signal});
  try{renderer.protect(options.slides[from].background);await renderer.prepare(options.slides[from].background);}
  catch(error){if(!destroyed){renderer.useFallback();console.warn('Initial presentation background failed; using the CSS fallback.',error);}}
  if(options.floating){try{const {createFloating}=await import('./floating');if(!destroyed){floating=createFloating(root,options.floating,slides);floating.move(options.slides[from].floating,options.slides[from].floating);}}catch(error){console.warn('Presentation decoration could not initialize.',error);}}
  if(destroyed)return {destroy(){}};
  ready=true;root.removeAttribute('aria-busy');root.dataset.state='idle';
  for(const n of [from-1,from+1])if(options.slides[n])void renderer.prepare(options.slides[n].background).catch(()=>renderer.useFallback());
  startFrameLoop();
  const queued=startupIntent;startupIntent=undefined;
  if(queued)void request(queued.index,queued.push);
  return { navigation:nav, destroy };
}
