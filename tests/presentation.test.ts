import { beforeEach,afterEach,it,expect,vi } from 'vitest';
import { createPresentation } from '../src/engine/presentation';
import { architecturalWipe } from '../src/engine/transitions/architectural-wipe';
import { slideDefinitions } from '../src/content/slides';
const rendererState=vi.hoisted(()=>({prepare:vi.fn(async()=>{}),fallback:vi.fn(),destroy:vi.fn()}));
vi.mock('../src/engine/renderer',()=>({BackgroundRenderer:class{protect(){}prepare(...args:unknown[]){return rendererState.prepare(...args)}useFallback(){rendererState.fallback()}render(){}destroy(){rendererState.destroy()}}}));
let callbacks=new Map<number,FrameRequestCallback>(),time=0,id=0;
let root:HTMLElement;
async function advance(){for(let i=0;i<30;i++){await Promise.resolve();time+=50;const batch=[...callbacks.values()];callbacks.clear();batch.forEach(callback=>callback(time));}await Promise.resolve();await Promise.resolve();}
beforeEach(()=>{
  history.replaceState(null,'','/');time=0;callbacks.clear();
  rendererState.prepare.mockReset().mockResolvedValue(undefined);rendererState.fallback.mockReset();rendererState.destroy.mockReset();
  vi.stubGlobal('matchMedia',()=>({matches:false}));
  vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{callbacks.set(++id,cb);return id;});
  vi.stubGlobal('cancelAnimationFrame',(key:number)=>callbacks.delete(key));
  root=document.createElement('main');
  root.innerHTML=`<div data-background></div><div data-announcer></div><div data-progress></div><span data-counter></span><span data-current-label></span><button data-previous></button><button data-next></button><a data-locale href='/fr/'></a><button data-group='plan'></button>`+slideDefinitions.slice(0,3).map((s,i)=>`<section data-slide id='${s.id}' data-title='Title ${i}' tabindex='-1'><p data-animate>Slide ${i}</p><button data-go='${(i+1)%3}'>jump</button></section><button data-go='${i}'>${i}</button>`).join('');
  document.body.append(root);
});
afterEach(()=>{root.remove();vi.unstubAllGlobals();});
it('routes all button targets by their configured index and preserves the slide in locale links',async()=>{
  const app=await createPresentation(root,{slides:slideDefinitions.slice(0,3),transition:architecturalWipe,announcement:'{current}/{total}: {title}'});
  root.querySelector<HTMLButtonElement>('[data-go="2"]')!.click();await advance();
  expect(app.navigation!.current).toBe(2);expect(location.hash).toBe('#portfolio');
  expect(new URL(root.querySelector('a')!.href).pathname+new URL(root.querySelector('a')!.href).hash).toBe('/fr/#portfolio');
  expect(root.querySelector('[data-announcer]')!.textContent).toBe('3/3: Title 2');
  const sections=root.querySelectorAll<HTMLElement>('[data-slide]');expect(sections[0].inert).toBe(true);expect(sections[2].inert).toBe(false);
  expect(root.querySelector<HTMLButtonElement>('[data-next]')!.disabled).toBe(true);app.destroy();
});
it('handles keyboard input when body has focus and ignores input controls',async()=>{
  const app=await createPresentation(root,{slides:slideDefinitions.slice(0,3),transition:architecturalWipe,announcement:'{current}'});
  document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await advance();expect(app.navigation!.current).toBe(1);
  const input=document.createElement('input');root.append(input);input.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await advance();expect(app.navigation!.current).toBe(1);
  app.destroy();document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}));await advance();expect(app.navigation!.current).toBe(1);
});
it('restores deep links and browser history without pushing replacement history entries',async()=>{
  history.replaceState(null,'','/#portfolio');const app=await createPresentation(root,{slides:slideDefinitions.slice(0,3),transition:architecturalWipe,announcement:'{current}'});expect(app.navigation!.current).toBe(2);
  const historyLength=history.length;history.replaceState(null,'','/#cover');window.dispatchEvent(new PopStateEvent('popstate'));await advance();
  expect(app.navigation!.current).toBe(0);expect(history.length).toBe(historyLength);app.destroy();
});
it('maps a bare route to cover and follows same-document Back and Forward without adding history entries',async()=>{
  const app=await createPresentation(root,{slides:slideDefinitions.slice(0,3),transition:architecturalWipe,announcement:'{current}'});
  expect(app.navigation!.current).toBe(0);
  root.querySelector<HTMLButtonElement>('[data-next]')!.click();await advance();
  root.querySelector<HTMLButtonElement>('[data-next]')!.click();await advance();
  expect(app.navigation!.current).toBe(2);
  const historyLength=history.length;
  const traverse=async(direction:'back'|'forward')=>{
    await new Promise<void>(resolve=>{
      let events=2;
      const done=()=>{if(--events===0)resolve();};
      window.addEventListener('popstate',done,{once:true});
      window.addEventListener('hashchange',done,{once:true});
      history[direction]();
    });
    await advance();
  };
  await traverse('back');expect(app.navigation!.current).toBe(1);
  await traverse('back');expect(location.pathname+location.hash).toBe('/');expect(app.navigation!.current).toBe(0);
  await traverse('forward');expect(app.navigation!.current).toBe(1);
  await traverse('forward');expect(app.navigation!.current).toBe(2);
  expect(history.length).toBe(historyLength);app.destroy();
});
it('uses the same brief transition with reduced motion and completes it',async()=>{
  vi.stubGlobal('matchMedia',()=>({matches:true}));
  const app=await createPresentation(root,{slides:slideDefinitions.slice(0,3),transition:architecturalWipe,announcement:'{current}'});
  root.querySelector<HTMLButtonElement>('[data-next]')!.click();await advance();expect(app.navigation!.current).toBe(1);expect(root.querySelector('[data-active="true"] [data-animate]')!.getAttribute('style')).not.toContain('translate');app.destroy();
});
it('requires a fresh vertical swipe after scrolling content, but accepts horizontal swipes',async()=>{
  const app=await createPresentation(root,{slides:slideDefinitions.slice(0,3),transition:architecturalWipe,announcement:'{current}'});
  const slide=root.querySelector<HTMLElement>('[data-slide]')!;Object.defineProperties(slide,{clientHeight:{value:400},scrollHeight:{value:800}});
  const touch=(type:string,x:number,y:number)=>{const event=new Event(type,{bubbles:true});Object.defineProperty(event,type==='touchstart'?'touches':'changedTouches',{value:[{clientX:x,clientY:y}]});slide.dispatchEvent(event);};
  touch('touchstart',100,200);slide.scrollTop=400;touch('touchend',100,100);await advance();expect(app.navigation!.current).toBe(0);
  touch('touchstart',100,200);touch('touchend',100,100);await advance();expect(app.navigation!.current).toBe(1);
  touch('touchstart',200,200);touch('touchend',100,200);await advance();expect(app.navigation!.current).toBe(2);app.destroy();
});
it('uses the first slide of the selected group and ignores rapid button presses',async()=>{
  const app=await createPresentation(root,{slides:slideDefinitions.slice(0,3),transition:architecturalWipe,announcement:'{current}'});
  root.querySelector<HTMLButtonElement>('[data-group]')!.click();root.querySelector<HTMLButtonElement>('[data-go="2"]')!.click();await advance();expect(app.navigation!.current).toBe(1);app.destroy();
});
it('captures the first valid startup click and replays it after delayed initial preparation',async()=>{
  let resolvePreparation!:()=>void;
  rendererState.prepare.mockImplementationOnce(()=>new Promise<void>(resolve=>{resolvePreparation=resolve;}));
  const pending=createPresentation(root,{slides:slideDefinitions.slice(0,3),transition:architecturalWipe,announcement:'{current}'});
  expect(root.dataset.state).toBe('loading');expect(root.getAttribute('aria-busy')).toBe('true');expect(callbacks.size).toBe(0);
  root.querySelector<HTMLButtonElement>('[data-next]')!.click();
  root.querySelector<HTMLButtonElement>('[data-go="2"]')!.click();
  resolvePreparation();
  const app=await pending;expect(root.hasAttribute('aria-busy')).toBe(false);await advance();
  expect(app.navigation!.current).toBe(1);expect(location.hash).toBe(`#${slideDefinitions[1].id}`);app.destroy();
});
it('queues browser history navigation that arrives during initial preparation',async()=>{
  let resolvePreparation!:()=>void;
  rendererState.prepare.mockImplementationOnce(()=>new Promise<void>(resolve=>{resolvePreparation=resolve;}));
  const pending=createPresentation(root,{slides:slideDefinitions.slice(0,3),transition:architecturalWipe,announcement:'{current}'});
  root.querySelector<HTMLButtonElement>('[data-next]')!.click();
  history.replaceState(null,'','/#portfolio');window.dispatchEvent(new PopStateEvent('popstate'));window.dispatchEvent(new HashChangeEvent('hashchange'));
  resolvePreparation();const app=await pending;await advance();
  expect(app.navigation!.current).toBe(2);expect(location.hash).toBe('#portfolio');app.destroy();
});
it('clears a captured click when startup history returns to the current slide',async()=>{
  let resolvePreparation!:()=>void;
  rendererState.prepare.mockImplementationOnce(()=>new Promise<void>(resolve=>{resolvePreparation=resolve;}));
  const pending=createPresentation(root,{slides:slideDefinitions.slice(0,3),transition:architecturalWipe,announcement:'{current}'});
  root.querySelector<HTMLButtonElement>('[data-next]')!.click();
  history.replaceState(null,'','/');window.dispatchEvent(new PopStateEvent('popstate'));window.dispatchEvent(new HashChangeEvent('hashchange'));
  resolvePreparation();const app=await pending;await advance();
  expect(app.navigation!.current).toBe(0);expect(location.hash).toBe('');app.destroy();
});
it('starts on the CSS fallback when initial image preparation rejects',async()=>{
  rendererState.prepare.mockRejectedValueOnce(new Error('image load failed'));
  const warn=vi.spyOn(console,'warn').mockImplementation(()=>{});
  const app=await createPresentation(root,{slides:slideDefinitions.slice(0,3),transition:architecturalWipe,announcement:'{current}'});
  expect(rendererState.fallback).toHaveBeenCalledOnce();expect(root.dataset.state).toBe('idle');expect(root.hasAttribute('aria-busy')).toBe(false);
  expect(callbacks.size).toBe(1);app.destroy();expect(rendererState.destroy).toHaveBeenCalledOnce();warn.mockRestore();
});
it('completes a queued navigation through renderer fallback when its image preparation rejects',async()=>{
  let resolveInitial!:()=>void;
  rendererState.prepare.mockImplementationOnce(()=>new Promise<void>(resolve=>{resolveInitial=resolve;})).mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('target preparation failed'));
  const warn=vi.spyOn(console,'warn').mockImplementation(()=>{});
  const pending=createPresentation(root,{slides:slideDefinitions.slice(0,3),transition:architecturalWipe,announcement:'{current}'});
  root.querySelector<HTMLButtonElement>('[data-go="2"]')!.click();resolveInitial();
  const app=await pending;await advance();
  expect(app.navigation!.current).toBe(2);expect(root.dataset.state).toBe('idle');expect(rendererState.fallback).toHaveBeenCalledOnce();
  app.destroy();warn.mockRestore();
});
it('tears down if the page is destroyed before initial preparation finishes',async()=>{
  let resolvePreparation!:()=>void;
  rendererState.prepare.mockImplementationOnce(()=>new Promise<void>(resolve=>{resolvePreparation=resolve;}));
  const pending=createPresentation(root,{slides:slideDefinitions.slice(0,3),transition:architecturalWipe,announcement:'{current}'});
  window.dispatchEvent(new Event('pagehide'));resolvePreparation();await pending;
  expect(root.hasAttribute('aria-busy')).toBe(false);expect(callbacks.size).toBe(0);expect(rendererState.destroy).toHaveBeenCalledOnce();
});
it('keeps one frame loop across visibility changes and tears it down on destroy',async()=>{
  const app=await createPresentation(root,{slides:slideDefinitions.slice(0,3),transition:architecturalWipe,announcement:'{current}'});
  expect(callbacks.size).toBe(1);
  const originalHidden=Object.getOwnPropertyDescriptor(document,'hidden');
  Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));expect(callbacks.size).toBe(0);
  Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));expect(callbacks.size).toBe(1);
  app.destroy();expect(callbacks.size).toBe(0);expect(rendererState.destroy).toHaveBeenCalledOnce();
  if(originalHidden)Object.defineProperty(document,'hidden',originalHidden);else delete (document as {hidden?:boolean}).hidden;
});
