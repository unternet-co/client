/**
 * Make a copy of an object.
 *
 * @param obj Any Javascript object (not just a record)
 * @returns The copy.
 */
export function clone(obj: Object) {
  return JSON.parse(JSON.stringify(obj));
}

export function listener<E extends Record<string, any>>(emitter: {
  on: <K extends keyof E>(event: K, fn: (data: E[K]) => void) => void;
  off: <K extends keyof E>(event: K, fn: (data: E[K]) => void) => void;
}) {
  return function on<K extends keyof E>(
    event: K,
    listener: (data: E[K]) => void
  ): () => void {
    emitter.on(event, listener); // attach
    return () => emitter.off(event, listener); // detach handle
  };
}
screen;
