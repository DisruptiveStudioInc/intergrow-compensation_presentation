import { crystalDissolve } from './engine/transitions/crystal-dissolve';
// Plug-and-play: import a different TransitionDefinition and change this single value.
export const presentation = { transition: crystalDissolve, floating: false as const };
