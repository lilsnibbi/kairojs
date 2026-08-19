import { EventEmitter } from "node:events";

/**
 * The emitter this bot publishes its own events on.
 *
 * It deliberately lives outside any store folder. The loader imports piece files with a
 * cache-busting query so an edited piece re-evaluates, which means a piece module is a *different*
 * instance from one imported normally — any module-level state declared inside a piece would be
 * duplicated. A piece's own static imports resolve normally and stay cached, so shared state has to
 * live in a module like this one.
 */
export const deployEmitter = new EventEmitter();
