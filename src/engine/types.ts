/** Framework-independent contracts. Copy engine/ into any TypeScript frontend. */
export type Uniform =
  | { type: 'float'; value: number }
  | { type: 'vec2'; value: [number, number] }
  | { type: 'vec3'; value: [number, number, number] }
  | { type: 'vec4'; value: [number, number, number, number] };
export interface TransitionDefinition {
  id: string;
  /** Defines vec4 transition(vec2 uv). Sampling helpers and uniforms are supplied by the renderer. */
  fragment: string;
  durationMs: number;
  /** Linear progress allows effects with timings measured in seconds. */
  easing?: 'linear' | 'smoothstep';
  /** Clip live content to the WebGL front, using coordinates local to the target. */
  clipContent?: (progress: number, viewport: DOMRectReadOnly, target: DOMRectReadOnly) => { from: string; to: string };
  uniforms: Record<string, Uniform>;
  contentTiming: { exitEnd: number; enterStart: number; stagger: number };
}
export interface Background {
  src: string;
  focal: [number, number];
  brightness: number;
  scrim: 'left' | 'center';
  camera: { zoom: number; drift: number; parallax: number };
}
export interface FloatingPose {
  position?: [number, number];
  size?: number;
  glow?: string;
  rotation?: number;
  visible?: boolean;
}
export interface SlideDefinition {
  id: string;
  group: string;
  background: Background;
  floating?: FloatingPose;
}
export interface FloatingOptions extends FloatingPose {
  src: string;
  rings?: boolean;
  trails?: number;
}
export interface PresentationOptions {
  slides: SlideDefinition[];
  transition: TransitionDefinition;
  floating?: false | FloatingOptions;
  announcement: string;
}
export interface FloatingModule {
  move(from: FloatingPose | undefined, to: FloatingPose | undefined): void;
  render(progress: number, time: number, reduced: boolean): void;
  destroy(): void;
}
export type NavigationState = 'idle' | 'loading' | 'transitioning';
