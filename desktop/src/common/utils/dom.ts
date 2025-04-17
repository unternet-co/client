export function appendEl(parent: Node, child: HTMLElement) {
  parent.appendChild(child);
  return child;
}

export function clearNode(el: HTMLElement) {
  el.innerHTML = '';
}

export function attachStyles(shadow: ShadowRoot, styles: string) {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(styles);
  shadow.adoptedStyleSheets = [sheet];
}

export function createEl<T extends HTMLElement = HTMLElement>(
  name: string,
  properties: Record<string, any> = {},
  ...children: (string | Node)[]
): T {
  const element = document.createElement(name) as T;
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
