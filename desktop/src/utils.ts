export function isElectron() {
  return (
    typeof navigator !== 'undefined' &&
    navigator.userAgent.toLowerCase().includes('electron')
  );
}

export function appendEl(parent: HTMLElement, child: HTMLElement) {
  parent.appendChild(child);
  return child;
}

export function createEl(
  name: string,
  properties: Record<string, any> = {},
  ...children: (string | Node)[]
): HTMLElement {
  const element = document.createElement(name);
  if (properties) Object.assign(element, properties);

  children.forEach((child) => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });

  return element;
}

export function createFragment(...children: (string | Node)[]) {
  const fragment = document.createDocumentFragment();

  children.forEach((child) => {
    if (typeof child === 'string') {
      fragment.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      fragment.appendChild(child);
    }
  });

  return fragment;
}
