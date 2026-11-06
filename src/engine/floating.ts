import type { FloatingModule, FloatingOptions, FloatingPose } from './types';
import { bezier, ease } from './math';
/** Decorative HTML image. Dynamically imported only when the feature is enabled. */
export function createFloating(host: HTMLElement, options: FloatingOptions, panels: HTMLElement[]): FloatingModule {
  const element=document.createElement('div'); element.className='floating-image'; element.setAttribute('aria-hidden','true');
  const image=document.createElement('img'); image.src=options.src; image.alt=''; element.append(image);
  const trails: HTMLImageElement[]=[];
  for(let i=0;i<Math.min(5,options.trails??0);i++){ const ghost=image.cloneNode() as HTMLImageElement; ghost.className='floating-trail'; element.prepend(ghost); trails.push(ghost); }
  if(options.rings) for(let i=0;i<2;i++){ const ring=document.createElement('span'); ring.className='floating-ring'; ring.style.rotate=`${i*60-30}deg`; element.append(ring); }
  host.append(element);
  const defaults: Required<FloatingPose>={position:[0.8,0.5],size:140,rotation:0,glow:'transparent',visible:true,...options};
  let from=defaults,to=defaults;
  let geometry={x:0,y:0,size:0,hidden:false};
  function layout(){
    const active=panels.find(p=>p.dataset.entering==='true')??panels.find(p=>p.dataset.active==='true');
    const textRects=Array.from(active?.querySelectorAll<HTMLElement>('.slide-copy,.rank-panel,.rank-ladder,.closing-values,.feature-stat')??[]).map(el=>el.getBoundingClientRect());
    const width=host.clientWidth,height=host.clientHeight;
    let size=Math.min(to.size,width*.3),x=to.position[0]*width,y=to.position[1]*height;
    const overlaps=(cx:number,cy:number,s:number)=>textRects.some(panel=>cx+s/2>panel.left-16 && cx-s/2<panel.right+16 && cy+s/2>panel.top-16 && cy-s/2<panel.bottom+16);
    if(overlaps(x,y,size)) {
      const candidates=[[width-size/2-28,height/2],[size/2+28,height/2],[width/2,height-size/2-100]];
      const free=candidates.find(([cx,cy])=>!overlaps(cx,cy,size));
      if(free) [x,y]=free;
      else { size*=.6; const small=candidates.find(([cx,cy])=>!overlaps(cx,cy,size)); if(small) [x,y]=small; else { geometry={x,y,size,hidden:true}; return; } }
    }
    geometry={x,y,size,hidden:!to.visible};
  }
  const observer=new ResizeObserver(layout); observer.observe(host);
  return {
    move(a,b){from={...defaults,...a};to={...defaults,...b};layout();},
    render(progress,time,reduced){
      const p=reduced?1:ease(progress); const {x,y,size,hidden}=geometry;
      element.hidden=hidden; if(hidden) return;
      const x0=from.position[0]*host.clientWidth,y0=from.position[1]*host.clientHeight;
      const cx=bezier(x0,x,(x0+x)/2,p),cy=bezier(y0,y,Math.min(y0,y)-70,p)+(reduced?0:Math.sin(time*1.3)*6);
      element.style.width=`${size}px`; element.style.height=`${size}px`;
      element.style.transform=`translate(${cx-size/2}px,${cy-size/2}px) rotateY(${from.rotation+(to.rotation-from.rotation)*p+(reduced?0:360*p+Math.sin(time)*4)}deg)`;
      element.style.filter=`drop-shadow(0 0 24px ${to.glow})`;
      trails.forEach((ghost,i)=>{ ghost.hidden=reduced||progress===1;ghost.style.opacity=String(.15*(1-progress));ghost.style.transform=`translate(${-12*(i+1)}px,${4*(i+1)}px)`; });
    },
    destroy(){observer.disconnect();element.remove();},
  };
}
