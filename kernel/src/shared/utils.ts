export function clone(obj: Object) {
  return JSON.parse(JSON.stringify(obj));
}
