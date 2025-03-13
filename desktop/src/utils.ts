export function isElectron() {
  return (
    typeof navigator !== 'undefined' &&
    navigator.userAgent.toLowerCase().includes('electron')
  );
}
