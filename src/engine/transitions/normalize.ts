import type { TransitionDefinition } from '../types';
/** A bad plug-in timing value must not leave navigation permanently locked. */
export function normalizeTransition(effect:TransitionDefinition):TransitionDefinition {
  const timing=effect.contentTiming;
  const validTiming=timing&&Object.values(timing).every(Number.isFinite)&&timing.exitEnd>0&&timing.exitEnd<=timing.enterStart&&timing.enterStart<1&&timing.stagger>=0;
  return {...effect,
    durationMs:Number.isFinite(effect.durationMs)&&effect.durationMs>0?effect.durationMs:900,
    contentTiming:validTiming?timing:{exitEnd:.2,enterStart:.55,stagger:.045},
  };
}
