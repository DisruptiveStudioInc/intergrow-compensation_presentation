import { describe,it,expect } from 'vitest';
import { NavigationController,WheelIntent,canScroll,isInteractive } from '../src/engine/navigation';
import { cameraAt,contentFrame,bezier } from '../src/engine/math';
import { architecturalWipe } from '../src/engine/transitions/architectural-wipe';
import { crossfade } from '../src/engine/transitions/crossfade';
import { fragmentSource } from '../src/engine/renderer';
import { normalizeTransition } from '../src/engine/transitions/normalize';
import { validateContent } from '../scripts/validate-content';

describe('navigation state',()=>{
  it('clamps endpoints and ignores duplicate/invalid targets',async()=>{
    const calls:number[]=[];const nav=new NavigationController(15,0,async(_,to)=>{calls.push(to);});
    expect(await nav.previous()).toBe(false);expect(await nav.goTo(NaN)).toBe(false);
    await nav.goTo(100);expect(nav.current).toBe(14);expect(await nav.next()).toBe(false);expect(calls).toEqual([14]);
  });
  it('ignores rapid inputs until the loading/transition operation settles',async()=>{
    let release!:()=>void;const nav=new NavigationController(15,0,()=>new Promise(resolve=>{release=resolve;}));
    const moving=nav.next();expect(nav.state).toBe('loading');expect(await nav.next()).toBe(false);
    nav.state='transitioning';expect(await nav.goTo(10)).toBe(false);
    release();await moving;expect(nav.current).toBe(1);expect(nav.state).toBe('idle');
  });
  it('unlocks after a host operation fails',async()=>{
    const nav=new NavigationController(3,0,async()=>{throw new Error('failure');});
    await expect(nav.next()).rejects.toThrow();expect(nav.current).toBe(0);expect(nav.state).toBe('idle');
  });
});
describe('scroll intent',()=>{
  it('requires fresh wheel gestures after inner content reaches a boundary',()=>{
    const wheel=new WheelIntent();expect(wheel.consume(100,0,true)).toBe(0);
    expect(wheel.consume(100,60,false)).toBe(0);expect(wheel.consume(100,350,false)).toBe(1);
    expect(wheel.consume(100,400,false)).toBe(0);
  });
  it('accumulates trackpad movement and resets for a direction change',()=>{
    const wheel=new WheelIntent();expect(wheel.consume(30,0,false)).toBe(0);expect(wheel.consume(-30,20,false)).toBe(0);expect(wheel.consume(-40,40,false)).toBe(-1);
  });
  it('detects scroll boundaries and excludes interactive keyboard targets',()=>{
    const panel=document.createElement('div');Object.defineProperties(panel,{scrollHeight:{value:1000},clientHeight:{value:400}});
    expect(canScroll(panel,-1)).toBe(false);expect(canScroll(panel,1)).toBe(true);panel.scrollTop=600;expect(canScroll(panel,1)).toBe(false);
    const button=document.createElement('button');button.innerHTML='<span>Next</span>';expect(isInteractive(button.firstChild)).toBe(true);expect(isInteractive(panel)).toBe(false);
  });
});
describe('transition plug-in contract',()=>{
  it.each([architecturalWipe,crossfade])('composes $id with the shared sampling API',effect=>{
    const source=fragmentSource(effect);expect(source).toContain('vec4 transition(vec2 uv)');expect(source).toContain('getFromColor');expect(source).toContain('getToColor');expect(source).toContain('uResolution');
    for(let i=0;i<20;i++)expect(contentFrame(1,i,20,effect.contentTiming)).toBe(1);
    expect(contentFrame(0,0,1,effect.contentTiming)).toBe(0);
  });
  it('rejects effect uniforms that collide with engine uniforms',()=>{
    expect(()=>fragmentSource({...crossfade,uniforms:{uProgress:{type:'float',value:1}}})).toThrow('uEffect');
  });
  it('keeps motion bounded and stops all camera motion for reduced motion',()=>{
    expect(cameraAt(100,.07,.008,true)).toEqual([1,0]);const [zoom,drift]=cameraAt(100,.07,.008,false);expect(zoom).toBeLessThanOrEqual(1.07);expect(Math.abs(drift)).toBeLessThanOrEqual(.008);
    expect(bezier(10,90,30,0)).toBe(10);expect(bezier(10,90,30,1)).toBe(90);
  });
});
it('validates language parity, rank data, grouping, and local assets',()=>{expect(validateContent).not.toThrow();});

it('repairs invalid plug-in timing rather than locking the navigation',()=>{const effect=normalizeTransition({...crossfade,durationMs:-1,contentTiming:{exitEnd:0,enterStart:2,stagger:NaN}});expect(effect.durationMs).toBe(900);expect(effect.contentTiming).toEqual({exitEnd:.2,enterStart:.55,stagger:.045});});
