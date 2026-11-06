import type { Background, TransitionDefinition } from './types';
import { cameraAt, clamp } from './math';

const vertex = `attribute vec2 aPosition; varying vec2 vUv;
void main(){ vUv=aPosition*0.5+0.5; gl_Position=vec4(aPosition,0.,1.); }`;
export function fragmentSource(effect: TransitionDefinition) {
  const custom = Object.entries(effect.uniforms).map(([name, value]) => {
    if (!/^uEffect[A-Za-z0-9_]+$/.test(name)) throw new Error('Custom uniforms must start with uEffect');
    return `uniform ${value.type} ${name};`;
  }).join('\n');
  return `precision mediump float;
    varying vec2 vUv;
    uniform sampler2D uFrom, uTo;
    uniform vec2 uResolution, uFromSize, uToSize, uFromFocal, uToFocal, uPointer;
    uniform vec2 uFromCamera, uToCamera;
    uniform float uProgress, uDirection, uFromBrightness, uToBrightness, uFromParallax, uToParallax;
    ${custom}
    vec2 cameraUv(vec2 uv, vec2 size, vec2 focal, vec2 camera, float parallax) {
      float viewportRatio=uResolution.x/uResolution.y;
      float imageRatio=size.x/size.y;
      vec2 visible=viewportRatio>imageRatio ? vec2(1.,imageRatio/viewportRatio) : vec2(viewportRatio/imageRatio,1.);
      visible/=camera.x;
      vec2 center=clamp(vec2(focal.x,1.-focal.y),visible*.5,1.-visible*.5);
      return clamp(center+(uv-.5)*visible+vec2(camera.y,0.)+uPointer*parallax,0.,1.);
    }
    vec4 getFromColor(vec2 uv) { return vec4(texture2D(uFrom,cameraUv(uv,uFromSize,uFromFocal,uFromCamera,uFromParallax)).rgb*uFromBrightness,1.); }
    vec4 getToColor(vec2 uv) { return vec4(texture2D(uTo,cameraUv(uv,uToSize,uToFocal,uToCamera,uToParallax)).rgb*uToBrightness,1.); }
    ${effect.fragment}
    void main(){ gl_FragColor=transition(vUv); }`;
}
interface Asset { image: HTMLImageElement | null; texture: WebGLTexture | null }
export class BackgroundRenderer {
  readonly canvas = document.createElement('canvas');
  private layers = [document.createElement('div'), document.createElement('div')];
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private shaders: WebGLShader[] = [];
  private buffer: WebGLBuffer | null = null;
  private cache = new Map<string, Asset>();
  private pending = new Map<string, Promise<Asset>>();
  private abort = new AbortController();
  private disposed = false;
  private protected = new Set<string>();
  constructor(private host: HTMLElement, readonly effect: TransitionDefinition, private onLoss: () => void) {
    this.layers.forEach(layer => { layer.className='background-layer'; host.append(layer); });
    this.canvas.className='background-canvas'; this.canvas.setAttribute('aria-hidden','true'); host.append(this.canvas);
    try { this.initialize(); } catch (error) { console.warn('Presentation uses background crossfade:', error); this.fallback(); }
    this.canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); this.fallback(); this.onLoss(); }, { signal:this.abort.signal });
  }
  private initialize() {
    const gl = this.canvas.getContext('webgl', { alpha:false, antialias:false, depth:false, powerPreference:'low-power' });
    if (!gl) throw new Error('WebGL unavailable');
    this.gl=gl;
    const compile = (type:number, source:string) => {
      const shader=gl.createShader(type); if(!shader) throw new Error('Shader allocation failed');
      this.shaders.push(shader); gl.shaderSource(shader,source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'Shader compile error');
      return shader;
    };
    const program=gl.createProgram(); if(!program) throw new Error('Program allocation failed');
    this.program=program;
    gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex)); gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragmentSource(this.effect)));
    gl.linkProgram(program); if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'Shader link error');
    gl.useProgram(program);
    this.buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,'aPosition'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    gl.uniform1i(gl.getUniformLocation(program,'uFrom'),0); gl.uniform1i(gl.getUniformLocation(program,'uTo'),1);
    for(const [name,uniform] of Object.entries(this.effect.uniforms)) {
      const location=gl.getUniformLocation(program,name);
      if(uniform.type==='float') gl.uniform1f(location,uniform.value);
      else if(uniform.type==='vec2') gl.uniform2fv(location,uniform.value);
      else if(uniform.type==='vec3') gl.uniform3fv(location,uniform.value);
      else gl.uniform4fv(location,uniform.value);
    }
    this.host.dataset.renderer='webgl';
  }
  private fallback() {
    this.canvas.hidden=true; this.host.dataset.renderer='fallback';
    this.releaseGpu(); this.gl=null;
  }
  private releaseGpu() {
    const gl=this.gl; if(!gl) return;
    this.cache.forEach(asset=>{ if(asset.texture) gl.deleteTexture(asset.texture); asset.texture=null; });
    this.shaders.forEach(shader=>gl.deleteShader(shader)); this.shaders=[];
    if(this.buffer) gl.deleteBuffer(this.buffer); if(this.program) gl.deleteProgram(this.program);
    this.program=null; this.buffer=null;
  }
  async prepare(background: Background) {
    const key=background.src;
    const cached=this.cache.get(key);
    if(cached) { this.cache.delete(key); this.cache.set(key,cached); return cached; }
    const existing=this.pending.get(key); if(existing) return existing;
    const promise=new Promise<Asset>(resolve=>{
      const image=new Image(); image.decoding='async';
      const timer=setTimeout(()=>finish(null),8000);
      const finish=(loaded:HTMLImageElement|null)=>{ clearTimeout(timer); image.onload=image.onerror=null;
        resolve({image:loaded,texture:null}); };
      image.onload=()=>finish(image); image.onerror=()=>finish(null); image.src=key;
    }).then(asset=>{
      this.pending.delete(key); if(this.disposed) return asset;
      const gl=this.gl;
      if(gl) {
        try {
          const texture=gl.createTexture(); asset.texture=texture; gl.bindTexture(gl.TEXTURE_2D,texture);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
          if(asset.image) gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,asset.image);
          else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([11,26,46,255]));
        } catch { this.fallback(); }
      }
      this.cache.set(key,asset); this.evict(); return asset;
    });
    this.pending.set(key,promise); return promise;
  }
  protect(...backgrounds: Background[]) { this.protected=new Set(backgrounds.map(b=>b.src)); }
  private evict() {
    for(const [key,asset] of this.cache) {
      if(this.cache.size<=6) break;
      if(this.protected.has(key)) continue;
      if(asset.texture) this.gl?.deleteTexture(asset.texture); this.cache.delete(key);
    }
  }
  render(from:Background,to:Background,progress:number,direction:number,fromAge:number,toAge:number,pointer:[number,number],reduced:boolean) {
    const assets=[this.cache.get(from.src),this.cache.get(to.src)];
    const cameras=[cameraAt(fromAge,from.camera.zoom,from.camera.drift,reduced),cameraAt(toAge,to.camera.zoom,to.camera.drift,reduced)];
    const gl=this.gl;
    // DOM layers always stay current underneath the canvas, including after context loss.
    [from,to].forEach((background,index)=>{
      const layer=this.layers[index]; const asset=assets[index];
      const source=asset?.image ? `url(${JSON.stringify(background.src)})` : 'none';
      if(layer.style.backgroundImage!==source) layer.style.backgroundImage=source;
      layer.style.backgroundPosition=`${background.focal[0]*100}% ${background.focal[1]*100}%`;
      layer.style.filter=`brightness(${background.brightness})`;
      layer.style.opacity=String(index===0?1:clamp(progress));
      const [zoom,drift]=cameras[index]; const parallax=reduced?0:background.camera.parallax;
      layer.style.transform=`scale(${zoom}) translate(${(drift+pointer[0]*parallax)*100}%,${pointer[1]*parallax*100}%)`;
    });
    if(gl)this.canvas.hidden=reduced;
    if(reduced || !gl || !this.program || !assets[0]?.texture || !assets[1]?.texture) return;
    const ratio=Math.min(devicePixelRatio||1,1.25);
    const width=Math.round(this.host.clientWidth*ratio),height=Math.round(this.host.clientHeight*ratio);
    if(this.canvas.width!==width || this.canvas.height!==height) { this.canvas.width=width; this.canvas.height=height; gl.viewport(0,0,width,height); }
    const u=(name:string)=>gl.getUniformLocation(this.program!,name);
    gl.uniform2f(u('uResolution'),width,height); gl.uniform1f(u('uProgress'),progress); gl.uniform1f(u('uDirection'),direction);
    gl.uniform2fv(u('uPointer'),reduced?[0,0]:pointer);
    ['From','To'].forEach((prefix,index)=>{
      const asset=assets[index]!; const b=index===0?from:to;
      gl.activeTexture(index===0?gl.TEXTURE0:gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,asset.texture);
      gl.uniform2f(u(`u${prefix}Size`),asset.image?.naturalWidth??1,asset.image?.naturalHeight??1);
      gl.uniform2fv(u(`u${prefix}Focal`),b.focal); gl.uniform2fv(u(`u${prefix}Camera`),cameras[index]);
      gl.uniform1f(u(`u${prefix}Brightness`),b.brightness); gl.uniform1f(u(`u${prefix}Parallax`),b.camera.parallax);
    });
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  }
  destroy() { this.disposed=true; this.abort.abort(); this.releaseGpu(); this.cache.clear(); this.layers.forEach(l=>l.remove()); this.canvas.remove(); }
}
