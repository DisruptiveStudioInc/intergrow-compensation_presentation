import {it,expect,vi} from 'vitest';
import {createFloating} from '../src/engine/floating';
it('animates an optional image, hides it when requested, and tears down observers and nodes',()=>{
  const disconnect=vi.fn();vi.stubGlobal('ResizeObserver',class {observe(){}disconnect=disconnect;});
  const host=document.createElement('div');Object.defineProperties(host,{clientWidth:{value:1200},clientHeight:{value:800}});document.body.append(host);
  const floating=createFloating(host,{src:'/images/fixture-mark.svg',position:[.8,.5],rings:true,trails:3},[]);
  floating.move(undefined,{position:[.7,.6],size:160,glow:'#abc',rotation:20});floating.render(.5,1,false);
  const image=host.querySelector<HTMLElement>('.floating-image')!;expect(image.hidden).toBe(false);expect(image.style.transform).toContain('rotateY');expect(image.querySelectorAll('.floating-trail').length).toBe(3);expect(image.querySelectorAll('.floating-ring').length).toBe(2);
  floating.render(1,1,true);expect([...image.querySelectorAll<HTMLElement>('.floating-trail')].every(el=>el.hidden)).toBe(true);
  floating.move(undefined,{visible:false});floating.render(1,1,false);expect(image.hidden).toBe(true);floating.destroy();expect(host.children.length).toBe(0);expect(disconnect).toHaveBeenCalledOnce();host.remove();vi.unstubAllGlobals();
});
