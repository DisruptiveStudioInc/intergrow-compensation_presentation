import { clamp } from './math';
import type { NavigationState } from './types';
/** Owns intent/state only; animation and DOM are supplied by the host. */
export class NavigationController {
  state: NavigationState = 'idle';
  current: number;
  target: number;
  constructor(readonly count: number, initial: number, private readonly navigate: (from:number,to:number)=>Promise<void>) {
    this.current = this.target = clamp(initial, 0, count-1);
  }
  async goTo(index: number) {
    if (!Number.isFinite(index)) return false;
    const target = clamp(Math.trunc(index), 0, this.count-1);
    if (!Number.isFinite(target) || this.state !== 'idle' || target === this.current) return false;
    this.target = target;
    this.state = 'loading';
    try { await this.navigate(this.current, target); this.current = target; }
    finally { this.target = this.current; this.state = 'idle'; }
    return true;
  }
  next() { return this.goTo(this.current + 1); }
  previous() { return this.goTo(this.current - 1); }
}
export function canScroll(element: HTMLElement, direction: number) {
  return direction > 0 ? element.scrollTop + element.clientHeight < element.scrollHeight - 2 : element.scrollTop > 2;
}
export function isInteractive(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('a,button,input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="slider"]');
}
/** One decision per wheel burst. Once a burst starts scrolling content, it cannot navigate. */
export class WheelIntent {
  private last = -Infinity;
  private total = 0;
  private locked = false;
  consume(delta: number, time: number, scrollable: boolean) {
    if (time - this.last > 180) { this.total = 0; this.locked = false; }
    this.last = time;
    if (scrollable) this.locked = true;
    if (this.locked) return 0;
    if (Math.sign(delta) !== Math.sign(this.total)) this.total = 0;
    this.total += delta;
    if (Math.abs(this.total) < 65) return 0;
    this.locked = true;
    return Math.sign(this.total);
  }
}
