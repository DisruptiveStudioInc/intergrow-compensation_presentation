import { it,expect,vi } from 'vitest';
import { BackgroundRenderer } from '../src/engine/renderer';
import { architecturalWipe } from '../src/engine/transitions/architectural-wipe';
import { slideDefinitions } from '../src/content/slides';
it('uses a brand background when image decoding fails and remains operable without WebGL',async()=>{
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null);
  vi.spyOn(console,'warn').mockImplementation(()=>{});
  const original=globalThis.Image;
  class BrokenImage {onerror:(()=>void)|null=null;onload:(()=>void)|null=null;decoding='';set src(_value:string){queueMicrotask(()=>this.onerror?.());}}
  vi.stubGlobal('Image',BrokenImage);
  const host=document.createElement('div');document.body.append(host);const loss=vi.fn();
  const renderer=new BackgroundRenderer(host,architecturalWipe,loss);
  const background=slideDefinitions[0].background;
  await renderer.prepare(background);renderer.render(background,background,1,1,0,0,[0,0],true);
  expect(host.dataset.renderer).toBe('fallback');expect(host.querySelector('canvas')!.hidden).toBe(true);
  expect(host.querySelector<HTMLElement>('.background-layer')!.style.backgroundImage).toContain(background.src);
  host.querySelector('canvas')!.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));expect(loss).toHaveBeenCalledOnce();
  renderer.destroy();expect(host.children.length).toBe(0);host.remove();vi.stubGlobal('Image',original);
});
it('falls back when a custom shader fails to compile',()=>{
  const gl={createProgram:()=>({}),createShader:()=>({}),shaderSource:vi.fn(),compileShader:vi.fn(),getShaderParameter:()=>false,getShaderInfoLog:()=> 'invalid custom GLSL',deleteShader:vi.fn(),deleteProgram:vi.fn(),VERTEX_SHADER:35633,COMPILE_STATUS:35713};
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(gl as never);vi.spyOn(console,'warn').mockImplementation(()=>{});
  const host=document.createElement('div');const renderer=new BackgroundRenderer(host,architecturalWipe,()=>{});
  expect(host.dataset.renderer).toBe('fallback');expect(gl.deleteShader).toHaveBeenCalledOnce();expect(gl.deleteProgram).toHaveBeenCalledOnce();renderer.destroy();
});
it('owns explicit CSS fallback setup and keeps background URLs on the DOM layers',()=>{
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null);
  vi.spyOn(console,'warn').mockImplementation(()=>{});
  const host=document.createElement('div');const renderer=new BackgroundRenderer(host,architecturalWipe,()=>{});
  const background=slideDefinitions[0].background;
  renderer.useFallback();renderer.render(background,background,1,1,0,0,[0,0],true);
  expect(host.dataset.renderer).toBe('fallback');expect(renderer.canvas.hidden).toBe(true);
  expect(host.querySelector<HTMLElement>('.background-layer')!.style.backgroundImage).toContain(background.src);
  renderer.destroy();
});
