/**
 * Make a copy of an object.
 *
 * @param obj Any Javascript object (not just a record)
 * @returns The copy.
 */
export function clone(obj: Object) {
  return JSON.parse(JSON.stringify(obj));
}
